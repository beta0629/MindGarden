package com.coresolution.core.dto.academy;

import com.coresolution.core.domain.academy.AcademyTuitionPayment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 수강료 결제 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TuitionPaymentResponse {
    
    private String paymentId;
    private String tenantId;
    /**
     * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated    private Long branchId;
    private String invoiceId;
    private String enrollmentId;
    private Long consumerId;
    private BigDecimal amount;
    private String currency;
    private AcademyTuitionPayment.PaymentMethod paymentMethod;
    private String pgProvider;
    private String pgTransactionId;
    private String pgStatus;
    private AcademyTuitionPayment.PaymentStatus status;
    private LocalDateTime paidAt;
    private LocalDateTime failedAt;
    private String failureReason;
    private BigDecimal refundAmount;
    private LocalDateTime refundedAt;
    private String refundReason;
    private String receiptNumber;
    private LocalDateTime receiptIssuedAt;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

