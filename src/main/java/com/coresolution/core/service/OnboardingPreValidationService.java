package com.coresolution.core.service;

import com.coresolution.core.domain.onboarding.OnboardingRequest;
import java.util.Map;

/**
 * 온보딩 사전 검증 서비스
 * 온보딩 프로세스 시작 전 필수 조건들을 사전에 검증하여 에러를 예방
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
public interface OnboardingPreValidationService {
    
    /**
     * 온보딩 요청 생성 전 사전 검증
     * @param request 온보딩 요청 데이터
     * @return 검증 결과 (isValid, errors)
     */
    ValidationResult validateOnboardingRequest(OnboardingRequest request);
    
    /**
     * 온보딩 승인 전 사전 검증
     * @param requestId 온보딩 요청 ID
     * @return 검증 결과
     */
    ValidationResult validateBeforeApproval(java.util.UUID requestId);
    
    /**
     * 시스템 메타데이터 검증
     * @param businessType 업종
     * @return 검증 결과
     */
    ValidationResult validateSystemMetadata(String businessType);
    
    /**
     * 검증 결과
     */
    class ValidationResult {
        private final boolean isValid;
        private final Map<String, String> errors;
        private final Map<String, String> warnings;
        
        public ValidationResult(boolean isValid, Map<String, String> errors, Map<String, String> warnings) {
            this.isValid = isValid;
            this.errors = errors != null ? errors : java.util.Collections.emptyMap();
            this.warnings = warnings != null ? warnings : java.util.Collections.emptyMap();
        }
        
        public boolean isValid() {
            return isValid;
        }
        
        public Map<String, String> getErrors() {
            return errors;
        }
        
        public Map<String, String> getWarnings() {
            return warnings;
        }
        
        public boolean hasErrors() {
            return !errors.isEmpty();
        }
        
        public boolean hasWarnings() {
            return !warnings.isEmpty();
        }
    }
}

