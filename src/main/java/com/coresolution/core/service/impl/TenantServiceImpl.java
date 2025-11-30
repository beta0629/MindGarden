package com.coresolution.core.service.impl;
import com.coresolution.core.context.TenantContextHolder;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.TenantService;
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
}

