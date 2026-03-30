package com.coresolution.core.controller.dto.billing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 결제 수단 생성 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public record PaymentMethodCreateRequest(
    @NotBlank(message = "결제 수단 토큰은 필수입니다.")
    String paymentMethodToken,
    
    @NotBlank(message = "PG 제공자는 필수입니다.")
    String pgProvider, // TOSS, STRIPE, OTHER
    
    String cardBrand, // VISA, MASTERCARD, AMEX 등
    String cardLast4, // 카드 마지막 4자리
    Integer cardExpMonth, // 만료 월
    Integer cardExpYear, // 만료 년도
    String cardholderName, // 카드 소유자 이름
    
    String tenantId // 온보딩 중이면 null
) {
}

