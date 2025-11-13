package com.mindgarden.ops.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record PricingPlanUpdateRequest(
    @NotBlank String displayName,
    String displayNameKo,
    @NotNull @PositiveOrZero BigDecimal baseFee,
    @NotBlank String currency,
    String description,
    String descriptionKo,
    Boolean active
) {
}

