package com.mindgarden.ops.controller.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PricingPlanCreateRequest(
    @NotBlank String planCode,
    @NotBlank String displayName,
    String displayNameKo,
    @NotNull @Positive BigDecimal baseFee,
    @NotBlank String currency,
    String description,
    String descriptionKo
) {
}
