package com.coresolution.core.controller.dto;

import com.coresolution.core.domain.onboarding.OnboardingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 온보딩 요청 결정 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public record OnboardingDecisionRequest(
    @NotNull(message = "상태는 필수입니다")
    OnboardingStatus status,
    
    @NotBlank(message = "승인자 ID는 필수입니다")
    String actorId,
    
    String note  // 결정 노트
) {}

