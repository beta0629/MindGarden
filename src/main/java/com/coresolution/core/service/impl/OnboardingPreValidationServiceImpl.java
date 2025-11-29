package com.coresolution.core.service.impl;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.repository.RoleTemplateRepository;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.OnboardingPreValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 온보딩 사전 검증 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OnboardingPreValidationServiceImpl implements OnboardingPreValidationService {
    
    private final RoleTemplateRepository roleTemplateRepository;
    private final TenantRepository tenantRepository;
    
    @Override
    public ValidationResult validateOnboardingRequest(OnboardingRequest request) {
        log.debug("온보딩 요청 사전 검증 시작: requestId={}", request.getId());
        
        Map<String, String> errors = new HashMap<>();
        Map<String, String> warnings = new HashMap<>();
        
        // 1. 필수 필드 검증
        if (request.getTenantName() == null || request.getTenantName().trim().isEmpty()) {
            errors.put("tenantName", "테넌트명은 필수입니다.");
        }
        
        if (request.getRequestedBy() == null || request.getRequestedBy().trim().isEmpty()) {
            errors.put("requestedBy", "요청자 이메일은 필수입니다.");
        }
        
        if (request.getBusinessType() == null || request.getBusinessType().trim().isEmpty()) {
            errors.put("businessType", "업종은 필수입니다.");
        }
        
        // 2. 업종별 메타데이터 검증
        if (request.getBusinessType() != null && !request.getBusinessType().trim().isEmpty()) {
            ValidationResult metadataResult = validateSystemMetadata(request.getBusinessType());
            if (!metadataResult.isValid()) {
                errors.putAll(metadataResult.getErrors());
            }
            if (metadataResult.hasWarnings()) {
                warnings.putAll(metadataResult.getWarnings());
            }
        }
        
        // 3. 중복 테넌트명 검증 (경고만)
        if (request.getTenantName() != null && !request.getTenantName().trim().isEmpty()) {
            Optional<Tenant> existingTenant = tenantRepository.findByNameAndIsDeletedFalse(request.getTenantName().trim());
            if (existingTenant.isPresent()) {
                warnings.put("tenantName", "동일한 테넌트명이 이미 존재합니다.");
            }
        }
        
        boolean isValid = errors.isEmpty();
        
        if (isValid) {
            log.debug("온보딩 요청 사전 검증 통과: requestId={}", request.getId());
        } else {
            log.warn("온보딩 요청 사전 검증 실패: requestId={}, errors={}", request.getId(), errors);
        }
        
        return new ValidationResult(isValid, errors, warnings);
    }
    
    @Override
    public ValidationResult validateBeforeApproval(java.util.UUID requestId) {
        log.debug("온보딩 승인 전 사전 검증 시작: requestId={}", requestId);
        
        Map<String, String> errors = new HashMap<>();
        Map<String, String> warnings = new HashMap<>();
        
        // TODO: 온보딩 요청 조회 및 검증
        // - 요청 상태 확인
        // - 필수 데이터 확인
        // - 시스템 메타데이터 확인
        
        boolean isValid = errors.isEmpty();
        
        if (isValid) {
            log.debug("온보딩 승인 전 사전 검증 통과: requestId={}", requestId);
        } else {
            log.warn("온보딩 승인 전 사전 검증 실패: requestId={}, errors={}", requestId, errors);
        }
        
        return new ValidationResult(isValid, errors, warnings);
    }
    
    @Override
    public ValidationResult validateSystemMetadata(String businessType) {
        log.debug("시스템 메타데이터 검증 시작: businessType={}", businessType);
        
        Map<String, String> errors = new HashMap<>();
        Map<String, String> warnings = new HashMap<>();
        
        // RoleTemplate 메타데이터 검증
        long templateCount = roleTemplateRepository
                .findByBusinessTypeAndActive(businessType)
                .size();
        
        if (templateCount == 0) {
            String errorMessage = String.format(
                "업종 '%s'에 대한 역할 템플릿이 없습니다. " +
                "시스템 메타데이터 초기화가 필요합니다. " +
                "V9__insert_initial_data.sql 마이그레이션을 실행하거나, " +
                "role_templates 테이블에 해당 업종의 템플릿을 추가해주세요.",
                businessType
            );
            errors.put("roleTemplates", errorMessage);
            log.error("시스템 메타데이터 검증 실패: businessType={}, error={}", businessType, errorMessage);
        } else if (templateCount < 3) {
            String warningMessage = String.format(
                "업종 '%s'에 대한 역할 템플릿이 %d개만 있습니다. " +
                "최소 3개 이상의 템플릿을 권장합니다.",
                businessType, templateCount
            );
            warnings.put("roleTemplates", warningMessage);
            log.warn("시스템 메타데이터 경고: businessType={}, warning={}", businessType, warningMessage);
        } else {
            log.debug("시스템 메타데이터 검증 통과: businessType={}, templateCount={}", businessType, templateCount);
        }
        
        // TODO: 추가 메타데이터 검증
        // - ComponentCatalog 검증
        // - PricingPlan 검증
        // - CommonCode 검증
        
        boolean isValid = errors.isEmpty();
        
        return new ValidationResult(isValid, errors, warnings);
    }
}

