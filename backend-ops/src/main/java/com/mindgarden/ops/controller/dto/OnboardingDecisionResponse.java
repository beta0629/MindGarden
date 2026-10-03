package com.mindgarden.ops.controller.dto;

import com.mindgarden.ops.domain.onboarding.OnboardingRequest;

/**
 * 온보딩 결정 응답 DTO
 * 승인 시 생성된 관리자 계정 정보 포함
 */
public record OnboardingDecisionResponse(
    OnboardingRequest request,
    AdminAccountInfo adminAccount
) {
    /**
     * 생성된 관리자 계정 정보. 비밀번호는 신청자만 알고 있으므로 포함하지 않는다.
     */
    public record AdminAccountInfo(
        String email,
        String tenantId,
        String tenantName
    ) {
    }
}

