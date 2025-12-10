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
     * 생성된 관리자 계정 정보
     */
    public record AdminAccountInfo(
        String email,
        String password,  // 원본 비밀번호 (온보딩 체크리스트에서 추출한 값)
        String tenantId,
        String tenantName
    ) {
    }
}

