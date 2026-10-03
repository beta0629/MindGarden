package com.coresolution.core.controller.dto;

/**
 * 온보딩 결정 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.1.0
 * @since 2025-12-27
 */
public record OnboardingDecisionResponse(
    OnboardingRequestAdminResponse request,
    AdminAccountInfo adminAccount
) {
    /**
     * 생성된 관리자 계정 정보. 비밀번호는 신청자만 알고 있으므로 포함하지 않는다.
     */
    public record AdminAccountInfo(
        String email,
        String tenantId,
        String tenantName
    ) {}
}
