package com.coresolution.core.service;

import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.RiskLevel;

/**
 * 자동 승인 서비스 인터페이스
 * 온보딩 요청의 자동 승인 조건을 체크하고 처리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface AutoApprovalService {
    
    /**
     * 온보딩 요청이 자동 승인 조건을 만족하는지 확인
     * 
     * @param request 온보딩 요청
     * @return 자동 승인 가능 여부
     */
    boolean canAutoApprove(OnboardingRequest request);
    
    /**
     * 자동 승인 조건 상세 체크
     * 
     * @param request 온보딩 요청
     * @return 자동 승인 결과 (조건 만족 여부, 실패 사유 등)
     */
    AutoApprovalResult checkAutoApprovalConditions(OnboardingRequest request);
    
    /**
     * 자동 승인 결과 클래스
     */
    class AutoApprovalResult {
        private final boolean eligible;
        private final String reason;
        private final RiskLevel riskLevel;
        private final boolean hasPaymentMethod;
        private final boolean hasSubscription;
        private final boolean isAllowedBusinessType;
        
        public AutoApprovalResult(
                boolean eligible,
                String reason,
                RiskLevel riskLevel,
                boolean hasPaymentMethod,
                boolean hasSubscription,
                boolean isAllowedBusinessType) {
            this.eligible = eligible;
            this.reason = reason;
            this.riskLevel = riskLevel;
            this.hasPaymentMethod = hasPaymentMethod;
            this.hasSubscription = hasSubscription;
            this.isAllowedBusinessType = isAllowedBusinessType;
        }
        
        public boolean isEligible() {
            return eligible;
        }
        
        public String getReason() {
            return reason;
        }
        
        public RiskLevel getRiskLevel() {
            return riskLevel;
        }
        
        public boolean hasPaymentMethod() {
            return hasPaymentMethod;
        }
        
        public boolean hasSubscription() {
            return hasSubscription;
        }
        
        public boolean isAllowedBusinessType() {
            return isAllowedBusinessType;
        }
    }
}

