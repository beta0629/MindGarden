package com.coresolution.core.controller.dto.ops;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/**
 * 요금제 수정 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public record PricingPlanUpdateRequest(
    @NotBlank(message = "요금제명은 필수입니다")
    String displayName,
    
    String displayNameKo,
    
    @NotNull(message = "기본 요금은 필수입니다")
    @PositiveOrZero(message = "기본 요금은 0 이상이어야 합니다")
    BigDecimal baseFee,
    
    @NotBlank(message = "통화는 필수입니다")
    String currency,
    
    String description,
    
    String descriptionKo,
    
    Boolean active
) {}

