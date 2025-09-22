package com.mindgarden.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회계 거래 생성/수정 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialTransactionRequest {
    
    @NotNull(message = "거래 유형은 필수입니다.")
    private String transactionType; // INCOME, EXPENSE
    
    @NotNull(message = "거래 카테고리는 필수입니다.")
    @Size(max = 50, message = "카테고리는 50자 이하여야 합니다.")
    private String category;
    
    @Size(max = 50, message = "상세 분류는 50자 이하여야 합니다.")
    private String subcategory;
    
    @NotNull(message = "거래 금액은 필수입니다.")
    @DecimalMin(value = "0.0", message = "거래 금액은 0 이상이어야 합니다.")
    private BigDecimal amount;
    
    @Size(max = 500, message = "거래 설명은 500자 이하여야 합니다.")
    private String description;
    
    @NotNull(message = "거래 날짜는 필수입니다.")
    private LocalDate transactionDate;
    
    private Long relatedEntityId;
    
    @Size(max = 50, message = "관련 엔티티 타입은 50자 이하여야 합니다.")
    private String relatedEntityType;
    
    @Size(max = 100, message = "부서명은 100자 이하여야 합니다.")
    private String department;
    
    @Size(max = 50, message = "프로젝트 코드는 50자 이하여야 합니다.")
    private String projectCode;
    
    @Size(max = 20, message = "지점 코드는 20자 이하여야 합니다.")
    private String branchCode;
    
    private Boolean taxIncluded;
    
    @DecimalMin(value = "0.0", message = "세금 금액은 0 이상이어야 합니다.")
    private BigDecimal taxAmount;
    
    @DecimalMin(value = "0.0", message = "세전 금액은 0 이상이어야 합니다.")
    private BigDecimal amountBeforeTax;
    
    @Size(max = 1000, message = "비고는 1000자 이하여야 합니다.")
    private String remarks;
}
