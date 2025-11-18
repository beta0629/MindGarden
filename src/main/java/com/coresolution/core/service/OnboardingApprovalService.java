package com.coresolution.core.service;

import java.util.Map;

/**
 * 온보딩 승인 서비스 인터페이스
 * PL/SQL 프로시저를 호출하여 온보딩 승인 프로세스 처리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface OnboardingApprovalService {
    
    /**
     * 온보딩 승인 처리
     * PL/SQL 프로시저 ProcessOnboardingApproval 호출
     * 
     * @param requestId 온보딩 요청 ID
     * @param tenantId 테넌트 ID
     * @param tenantName 테넌트 이름
     * @param businessType 업종 타입
     * @param approvedBy 승인자
     * @param decisionNote 결정 노트
     * @return 처리 결과 (success, message)
     */
    Map<String, Object> processOnboardingApproval(
            Long requestId,
            String tenantId,
            String tenantName,
            String businessType,
            String approvedBy,
            String decisionNote
    );
}

