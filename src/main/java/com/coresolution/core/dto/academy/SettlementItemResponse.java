package com.coresolution.core.dto.academy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 정산 항목 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementItemResponse {
    
    /**
     * 항목 유형 열거형
     */
    public enum ItemType {
        TEACHER, CLASS, COURSE, ENROLLMENT
    }
    
    private String settlementItemId;
    private String settlementId;
    private String tenantId;
    private Long branchId;
    private ItemType itemType;
    private String itemId;
    private String itemName;
    private BigDecimal revenueAmount;
    private BigDecimal settlementAmount;
    private BigDecimal commissionRate;
    private BigDecimal commissionAmount;
    private Integer enrollmentCount;
    private Integer paymentCount;
    private Integer totalSessions;
    private Integer completedSessions;
    private String detailsJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

