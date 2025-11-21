package com.coresolution.core.domain.onboarding;

/**
 * 온보딩 요청 상태
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public enum OnboardingStatus {
    PENDING,      // 대기 중
    IN_REVIEW,    // 검토 중
    APPROVED,     // 승인됨
    REJECTED,     // 거부됨
    ON_HOLD       // 보류
}

