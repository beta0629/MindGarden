package com.coresolution.core.controller.dto.billing;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 구독 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public record SubscriptionResponse(
    String subscriptionId,
    String tenantId,
    String planId,
    String status, // DRAFT, PENDING_ACTIVATION, ACTIVE, SUSPENDED, CANCELLED, TERMINATED
    LocalDate effectiveFrom,
    LocalDate effectiveTo,
    String billingCycle,
    String paymentMethod,
    Boolean autoRenewal,
    LocalDate nextBillingDate,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}

