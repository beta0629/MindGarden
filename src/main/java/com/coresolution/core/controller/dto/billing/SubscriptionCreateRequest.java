package com.coresolution.core.controller.dto.billing;

import jakarta.validation.constraints.NotBlank;

/**
 * 구독 생성 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public record SubscriptionCreateRequest(
    String tenantId, // 온보딩 중이면 null
    
    @NotBlank(message = "요금제 ID는 필수입니다.")
    String planId,
    
    @NotBlank(message = "결제 수단 ID는 필수입니다.")
    String paymentMethodId,
    
    String billingCycle, // MONTHLY, QUARTERLY, YEARLY
    
    Boolean autoRenewal
) {
}

