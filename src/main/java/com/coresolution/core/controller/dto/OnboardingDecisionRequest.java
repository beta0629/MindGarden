package com.coresolution.core.controller.dto;

import com.coresolution.core.domain.onboarding.OnboardingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 온보딩 요청 결정 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public record OnboardingDecisionRequest(
    @NotNull(message = "상태(status)는 필수입니다. 가능한 값: PENDING, IN_REVIEW, APPROVED, REJECTED, ON_HOLD")
    OnboardingStatus status,
    
    @NotBlank(message = "승인자 ID(actorId)는 필수입니다")
    String actorId,
    
    String note  // 결정 노트
) {
    /**
     * Jackson deserialization을 위한 생성자
     * enum 변환 실패 시 더 명확한 에러 메시지 제공
     */
    @JsonCreator
    public OnboardingDecisionRequest {
        if (status == null) {
            throw new IllegalArgumentException(
                "상태(status)는 필수입니다. 가능한 값: PENDING, IN_REVIEW, APPROVED, REJECTED, ON_HOLD"
            );
        }
    }
}

