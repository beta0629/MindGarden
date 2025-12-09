package com.mindgarden.ops.controller.dto;

import com.mindgarden.ops.domain.onboarding.RiskLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OnboardingCreateRequest(
    String tenantId, // 테넌트 ID (선택적, 없으면 자동 생성)
    @NotBlank String tenantName,
    String region, // 지역 정보 (선택적)
    String businessType, // 업종 정보 (선택적, 예: "CONSULTATION", "ACADEMY")
    @NotBlank String requestedBy,
    @NotNull RiskLevel riskLevel,
    String checklistJson
) {}
