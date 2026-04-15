package com.coresolution.core.service.impl;

import com.coresolution.core.constants.TenantDisplayNameMessages;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.TenantNameUpdateRequest;
import com.coresolution.core.dto.TenantNameUpdateResponse;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.BrandingService;
import com.coresolution.core.service.TenantService;
import com.coresolution.consultation.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 테넌트 서비스 구현체
 * 테넌트 정보 관리를 위한 서비스 계층 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantServiceImpl implements TenantService {
    
    private final TenantRepository tenantRepository;
    private final BrandingService brandingService;
    
    /**
     * 테넌트의 업종 타입 조회
     * @param tenantId 테넌트 ID
     * @return 업종 타입
     */
    @Override
    public String getBusinessType(String tenantId) {
        log.debug("테넌트 업종 타입 조회: tenantId={}", tenantId);
        
        return tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .map(Tenant::getBusinessType)
                .orElseThrow(() -> {
                    log.warn("테넌트를 찾을 수 없습니다: tenantId={}", tenantId);
                    return new IllegalArgumentException("테넌트를 찾을 수 없습니다: " + tenantId);
                });
    }
    
    /**
     * 테넌트 정보 존재 여부 확인
     * @param tenantId 테넌트 ID
     * @return 존재 여부
     */
    @Override
    public boolean existsTenant(String tenantId) {
        log.debug("테넌트 존재 여부 확인: tenantId={}", tenantId);
        
        boolean exists = tenantRepository.existsByTenantId(tenantId);
        log.debug("테넌트 존재 여부: tenantId={}, exists={}", tenantId, exists);
        
        return exists;
    }
    
    /**
     * 테넌트 활성 상태 확인
     * @param tenantId 테넌트 ID
     * @return 활성 상태 여부
     */
    @Override
    public boolean isActiveTenant(String tenantId) {
        log.debug("테넌트 활성 상태 확인: tenantId={}", tenantId);
        
        boolean isActive = tenantRepository.findActiveByTenantId(tenantId).isPresent();
        log.debug("테넌트 활성 상태: tenantId={}, isActive={}", tenantId, isActive);
        
        return isActive;
    }
    
    /**
     * 모든 활성 테넌트 ID 목록 조회
     * @return 활성 테넌트 ID 목록
     */
    @Override
    public java.util.List<String> getAllActiveTenantIds() {
        log.debug("모든 활성 테넌트 ID 조회");
        
        java.util.List<String> tenantIds = tenantRepository.findAllActive()
                .stream()
                .map(Tenant::getTenantId)
                .collect(java.util.stream.Collectors.toList());
        
        log.debug("활성 테넌트 수: {}", tenantIds.size());
        
        return tenantIds;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public TenantNameUpdateResponse updateTenantDisplayName(String tenantId, TenantNameUpdateRequest request) {
        log.info("테넌트 표시명 변경 처리: tenantId={}", tenantId);

        Tenant tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .orElseThrow(() -> new EntityNotFoundException(TenantDisplayNameMessages.TENANT_NOT_FOUND));

        String trimmed = request.getName() != null ? request.getName().trim() : "";
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException(TenantDisplayNameMessages.NAME_EMPTY_AFTER_TRIM);
        }

        tenantRepository.findByNameAndIsDeletedFalse(trimmed).ifPresent(other -> {
            if (!other.getTenantId().equals(tenantId)) {
                throw new IllegalArgumentException(TenantDisplayNameMessages.DUPLICATE_NAME_IN_USE);
            }
        });

        tenant.setName(trimmed);
        Tenant saved = tenantRepository.save(tenant);
        brandingService.syncBrandingJsonCompanyNameWithTenant(saved);
        log.info("테넌트 표시명 변경 완료: tenantId={}", tenantId);

        return TenantNameUpdateResponse.fromEntity(saved);
    }
}

