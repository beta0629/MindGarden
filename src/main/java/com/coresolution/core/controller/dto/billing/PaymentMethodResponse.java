package com.coresolution.core.controller.dto.billing;

import java.time.LocalDateTime;

/**
 * 결제 수단 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public record PaymentMethodResponse(
    String paymentMethodId,
    String tenantId,
    String pgProvider,
    String cardBrand,
    String cardLast4,
    Integer cardExpMonth,
    Integer cardExpYear,
    String cardholderName,
    Boolean isDefault,
    LocalDateTime createdAt
) {
}

