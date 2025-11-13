package com.mindgarden.ops.controller.dto;

import com.mindgarden.ops.domain.onboarding.RiskLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OnboardingCreateRequest(
    @NotBlank String tenantId,
    @NotBlank String tenantName,
    @NotBlank String requestedBy,
    @NotNull RiskLevel riskLevel,
    String checklistJson
) {}
