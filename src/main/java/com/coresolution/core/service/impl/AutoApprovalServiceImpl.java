package com.coresolution.core.service.impl;

import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.service.AutoApprovalService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 자동 승인 서비스 구현체
 * 온보딩 요청의 자동 승인 조건을 체크하고 처리
 * 
 * 자동 승인 조건:
 * 1. 위험도가 LOW
 * 2. 결제 수단이 등록되어 있음 (checklistJson에 paymentMethodId 포함)
 * 3. 구독이 생성되어 있음 (checklistJson에 subscriptionId 포함)
 * 4. 허용된 업종인 경우 (선택적, 설정 가능)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AutoApprovalServiceImpl implements AutoApprovalService {
    
    private final ObjectMapper objectMapper;
    
    /**
     * 자동 승인 활성화 여부 (기본값: true)
     */
    @Value("${onboarding.auto-approval.enabled:true}")
    private boolean autoApprovalEnabled;
    
    /**
     * 자동 승인 허용 위험도 (기본값: LOW만 허용)
     */
    @Value("${onboarding.auto-approval.allowed-risk-levels:LOW}")
    private String allowedRiskLevels;
    
    /**
     * 자동 승인 허용 업종 목록 (비어있으면 모든 업종 허용)
     */
    @Value("${onboarding.auto-approval.allowed-business-types:}")
    private String allowedBusinessTypes;
    
    /**
     * 결제 수단 필수 여부 (기본값: true)
     */
    @Value("${onboarding.auto-approval.require-payment-method:true}")
    private boolean requirePaymentMethod;
    
    /**
     * 구독 필수 여부 (기본값: true)
     */
    @Value("${onboarding.auto-approval.require-subscription:true}")
    private boolean requireSubscription;
    
    @Override
    public boolean canAutoApprove(OnboardingRequest request) {
        if (!autoApprovalEnabled) {
            log.debug("자동 승인이 비활성화되어 있습니다.");
            return false;
        }
        
        AutoApprovalResult result = checkAutoApprovalConditions(request);
        return result.isEligible();
    }
    
    @Override
    public AutoApprovalResult checkAutoApprovalConditions(OnboardingRequest request) {
        log.debug("자동 승인 조건 체크 시작: requestId={}, riskLevel={}, businessType={}", 
            request.getId(), request.getRiskLevel(), request.getBusinessType());
        
        // 1. 위험도 체크
        RiskLevel riskLevel = request.getRiskLevel() != null ? request.getRiskLevel() : RiskLevel.LOW;
        Set<RiskLevel> allowedRiskLevelSet = parseRiskLevels(allowedRiskLevels);
        boolean isAllowedRiskLevel = allowedRiskLevelSet.contains(riskLevel);
        
        if (!isAllowedRiskLevel) {
            log.debug("자동 승인 불가: 위험도 {}는 허용되지 않습니다. 허용 위험도: {}", 
                riskLevel, allowedRiskLevelSet);
            return new AutoApprovalResult(
                false,
                String.format("위험도 %s는 자동 승인 대상이 아닙니다.", riskLevel),
                riskLevel,
                false,
                false,
                false
            );
        }
        
        // 2. 업종 체크 (선택적)
        boolean isAllowedBusinessType = true;
        if (allowedBusinessTypes != null && !allowedBusinessTypes.trim().isEmpty()) {
            Set<String> allowedBusinessTypeSet = parseBusinessTypes(allowedBusinessTypes);
            String businessType = request.getBusinessType();
            isAllowedBusinessType = businessType != null && allowedBusinessTypeSet.contains(businessType);
            
            if (!isAllowedBusinessType) {
                log.debug("자동 승인 불가: 업종 {}는 허용되지 않습니다. 허용 업종: {}", 
                    businessType, allowedBusinessTypeSet);
                return new AutoApprovalResult(
                    false,
                    String.format("업종 %s는 자동 승인 대상이 아닙니다.", businessType),
                    riskLevel,
                    false,
                    false,
                    false
                );
            }
        }
        
        // 3. 결제 수단 및 구독 체크 (checklistJson 파싱)
        Map<String, Object> checklist = parseChecklistJson(request.getChecklistJson());
        boolean hasPaymentMethod = false;
        boolean hasSubscription = false;
        
        if (checklist != null) {
            hasPaymentMethod = checklist.containsKey("paymentMethodId") && 
                             checklist.get("paymentMethodId") != null &&
                             !checklist.get("paymentMethodId").toString().trim().isEmpty();
            
            hasSubscription = checklist.containsKey("subscriptionId") && 
                            checklist.get("subscriptionId") != null &&
                            !checklist.get("subscriptionId").toString().trim().isEmpty() &&
                            !checklist.get("subscriptionId").toString().equals("pending");
        }
        
        // 4. 필수 조건 체크
        if (requirePaymentMethod && !hasPaymentMethod) {
            log.debug("자동 승인 불가: 결제 수단이 등록되지 않았습니다.");
            return new AutoApprovalResult(
                false,
                "결제 수단이 등록되지 않았습니다.",
                riskLevel,
                false,
                hasSubscription,
                isAllowedBusinessType
            );
        }
        
        if (requireSubscription && !hasSubscription) {
            log.debug("자동 승인 불가: 구독이 생성되지 않았습니다.");
            return new AutoApprovalResult(
                false,
                "구독이 생성되지 않았습니다.",
                riskLevel,
                hasPaymentMethod,
                false,
                isAllowedBusinessType
            );
        }
        
        // 모든 조건을 만족하는 경우
        log.info("자동 승인 조건 만족: requestId={}, riskLevel={}, hasPaymentMethod={}, hasSubscription={}", 
            request.getId(), riskLevel, hasPaymentMethod, hasSubscription);
        
        return new AutoApprovalResult(
            true,
            "모든 자동 승인 조건을 만족합니다.",
            riskLevel,
            hasPaymentMethod,
            hasSubscription,
            isAllowedBusinessType
        );
    }
    
    /**
     * 위험도 문자열 파싱 (예: "LOW,MEDIUM" -> Set<RiskLevel>)
     */
    private Set<RiskLevel> parseRiskLevels(String riskLevelsStr) {
        Set<RiskLevel> result = new HashSet<>();
        if (riskLevelsStr == null || riskLevelsStr.trim().isEmpty()) {
            result.add(RiskLevel.LOW);
            return result;
        }
        
        String[] parts = riskLevelsStr.split(",");
        for (String part : parts) {
            try {
                RiskLevel level = RiskLevel.valueOf(part.trim().toUpperCase());
                result.add(level);
            } catch (IllegalArgumentException e) {
                log.warn("알 수 없는 위험도 레벨: {}", part);
            }
        }
        
        if (result.isEmpty()) {
            result.add(RiskLevel.LOW);
        }
        
        return result;
    }
    
    /**
     * 업종 문자열 파싱 (예: "CONSULTATION,ACADEMY" -> Set<String>)
     */
    private Set<String> parseBusinessTypes(String businessTypesStr) {
        Set<String> result = new HashSet<>();
        if (businessTypesStr == null || businessTypesStr.trim().isEmpty()) {
            return result;
        }
        
        String[] parts = businessTypesStr.split(",");
        for (String part : parts) {
            result.add(part.trim().toUpperCase());
        }
        
        return result;
    }
    
    /**
     * checklistJson 파싱
     */
    private Map<String, Object> parseChecklistJson(String checklistJson) {
        if (checklistJson == null || checklistJson.trim().isEmpty()) {
            return null;
        }
        
        try {
            return objectMapper.readValue(checklistJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("checklistJson 파싱 실패: {}", e.getMessage());
            return null;
        }
    }
}

