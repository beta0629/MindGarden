package com.coresolution.core.dto.academy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 청구서 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    
    /**
     * 청구서 상태 열거형
     */
    public enum InvoiceStatus {
        DRAFT, ISSUED, SENT, PAID, PARTIAL, OVERDUE, CANCELLED
    }
    
    private String invoiceId;
    private String tenantId;
    /**
     * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated    private Long branchId;
    private String enrollmentId;
    private Long consumerId;
    private String billingScheduleId;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private LocalDate billingPeriodStart;
    private LocalDate billingPeriodEnd;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String currency;
    private String lineItemsJson;
    private String notes;
    private InvoiceStatus status;
    private LocalDateTime issuedAt;
    private LocalDateTime sentAt;
    private LocalDateTime paidAt;
    private BigDecimal paidAmount;
    private String paymentMethod;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

