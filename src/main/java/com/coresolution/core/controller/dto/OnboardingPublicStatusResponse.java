package com.coresolution.core.controller.dto;

import java.time.LocalDateTime;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;

/**
 * 비인증 공개 온보딩 응답 (생성·수정·이메일 조회).
 * 이메일만으로 조회되므로 상태 확인에 필요한 최소 필드만 둔다.
 * 연락처·사업자 정보·관리자 비밀번호·checklist_json 은 포함하지 않는다.
 *
 * @param id         신청 번호 (상세 조회 시 이메일과 함께 사용)
 * @param tenantName 신청 기관명
 * @param status     처리 상태
 * @param createdAt  신청일
 * @author CoreSolution
 * @since 2026-10-03
 */
public record OnboardingPublicStatusResponse(
        Long id,
        String tenantName,
        OnboardingStatus status,
        LocalDateTime createdAt) {

    /**
     * 엔티티에서 공개 응답을 만든다.
     *
     * @param request 온보딩 요청 엔티티
     * @return 공개 응답 (입력이 null 이면 null)
     */
    public static OnboardingPublicStatusResponse from(OnboardingRequest request) {
        if (request == null) {
            return null;
        }
        return new OnboardingPublicStatusResponse(request.getId(), request.getTenantName(),
                request.getStatus(), request.getCreatedAt());
    }
}
