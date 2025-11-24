package com.coresolution.core.dto.academy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 정산 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementResponse {
    
    /**
     * 정산 상태 열거형
     */
    public enum SettlementStatus {
        DRAFT, CALCULATED, APPROVED, PAID, CANCELLED
    }
    
    private String settlementId;
    private String tenantId;
    private Long branchId;
    private String settlementPeriod;
    private LocalDate settlementDate;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal totalRevenue;
    private BigDecimal totalPayments;
    private BigDecimal refundAmount;
    private BigDecimal netRevenue;
    private BigDecimal teacherSettlement;
    private BigDecimal hqRoyalty;
    private BigDecimal commissionRate;
    private BigDecimal royaltyRate;
    private BigDecimal netSettlement;
    private SettlementStatus status;
    private LocalDateTime calculatedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime paidAt;
    private String approvedBy;
    private String paidBy;
    private String notes;
    private String calculationDetailsJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

