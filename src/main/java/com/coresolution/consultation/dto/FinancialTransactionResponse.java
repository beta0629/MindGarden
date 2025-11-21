package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회계 거래 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialTransactionResponse {
    
    private Long id;
    private String transactionType;
    private String transactionTypeDisplayName;
    private String category;
    private String subcategory;
    private BigDecimal amount;
    private String description;
    private LocalDate transactionDate;
    private String status;
    private String statusDisplayName;
    private String approverName;
    private LocalDateTime approvedAt;
    private String approvalComment;
    private Long relatedEntityId;
    private String relatedEntityType;
    private String department;
    private String projectCode;
    private String branchCode;
    private Boolean taxIncluded;
    private BigDecimal taxAmount;
    private BigDecimal amountBeforeTax;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 매칭 정보 (CONSULTANT_CLIENT_MAPPING 관련 거래인 경우)
    private String consultantName;
    private String clientName;
}
