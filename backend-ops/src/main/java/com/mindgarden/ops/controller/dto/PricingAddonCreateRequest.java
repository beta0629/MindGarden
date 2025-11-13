package com.mindgarden.ops.controller.dto;

import com.mindgarden.ops.domain.pricing.FeeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record PricingAddonCreateRequest(
    @NotBlank String addonCode,
    @NotBlank String displayName,
    String displayNameKo,
    String category,
    String categoryKo,
    @NotNull FeeType feeType,
    @NotNull @PositiveOrZero BigDecimal unitPrice,
    String unit
) {}
