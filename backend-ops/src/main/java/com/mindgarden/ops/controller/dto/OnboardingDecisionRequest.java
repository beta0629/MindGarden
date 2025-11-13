package com.mindgarden.ops.controller.dto;

import com.mindgarden.ops.domain.onboarding.OnboardingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OnboardingDecisionRequest(
    @NotNull OnboardingStatus status,
    @NotBlank String actorId,
    String note
) {
}
