package com.coresolution.consultation.dto;

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

    /**
     * 테넌트 ID (선택). 지정 시 REQUIRES_NEW 등 새 트랜잭션에서도 해당 테넌트로 저장됨.
     */
    @Size(max = 36, message = "테넌트 ID는 36자 이하여야 합니다.")
    private String tenantId;
    
    @Size(max = 100, message = "부서명은 100자 이하여야 합니다.")
    private String department;
    
    @Size(max = 50, message = "프로젝트 코드는 50자 이하여야 합니다.")
    private String projectCode;
    
    @Size(max = 20, message = "지점 코드는 20자 이하여야 합니다.")
    /**
     * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated    private String branchCode;
    
    private Boolean taxIncluded;
    
    /**
     * 세액. 부가세(VAT) 또는 사업소득 원천징수(3.3%) 예정액 등 맥락에 따라 의미가 다름({@code taxIncluded}·카테고리·비고 참조).
     */
    @DecimalMin(value = "0.0", message = "세금 금액은 0 이상이어야 합니다.")
    private BigDecimal taxAmount;

    /**
     * 과세 전 금액 또는 총 입금액(업무 규칙에 따라 동일 기재). 프리랜서 상담료 원천징수 표기 시 총 입금과 같을 수 있음.
     */
    @DecimalMin(value = "0.0", message = "세전 금액은 0 이상이어야 합니다.")
    private BigDecimal amountBeforeTax;
    
    @Size(max = 1000, message = "비고는 1000자 이하여야 합니다.")
    private String remarks;
}
