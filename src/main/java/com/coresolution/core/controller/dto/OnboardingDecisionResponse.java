package com.coresolution.core.controller.dto;

import com.coresolution.core.domain.onboarding.OnboardingRequest;

/**
 * 온보딩 결정 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-27
 */
public record OnboardingDecisionResponse(
    OnboardingRequest request,
    AdminAccountInfo adminAccount
) {
    /**
     * 관리자 계정 정보
     */
    public record AdminAccountInfo(
        String email,
        String password,
        String tenantId,
        String tenantName
    ) {}
}

