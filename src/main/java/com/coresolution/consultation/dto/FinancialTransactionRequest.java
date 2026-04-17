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
 * 회계 거래 생성/수정 요청 DTO.
 * <p>
 * 금액 관련 필드({@code amount}, {@code taxIncluded}, {@code taxAmount}, {@code withholdingTaxAmount},
 * {@code amountBeforeTax})의 의미는
 * 엔티티 {@link com.coresolution.consultation.entity.erp.financial.FinancialTransaction}와 동일하게 해석합니다.
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
    
    /**
     * 거래 금액(총액). {@code taxIncluded}·세액 필드와 함께 해석합니다.
     */
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
    
    /**
     * @deprecated 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated
    @Size(max = 20, message = "지점 코드는 20자 이하여야 합니다.")
    private String branchCode;

    /**
     * 세금(부가세) 포함 여부.
     */
    private Boolean taxIncluded;

    /**
     * 부가세(VAT) 등 세액. 일반적으로 부가세 금액을 뜻합니다.
     * 원천징수 예정액은 별도 필드·맥락에서 관리하며, 동일 필드에 혼용하지 않도록 주의합니다.
     */
    @DecimalMin(value = "0.0", message = "세금 금액은 0 이상이어야 합니다.")
    private BigDecimal taxAmount;

    /**
     * 원천징수 예정액. 부가세({@code taxAmount})와 별도.
     */
    @DecimalMin(value = "0.0", message = "원천징수 금액은 0 이상이어야 합니다.")
    private BigDecimal withholdingTaxAmount;

    /**
     * 세전 금액(과세 표준에 해당하는 금액 등).
     * {@code taxIncluded}, {@code amount}, {@code taxAmount}와의 관계는 업무 규칙에 따릅니다.
     */
    @DecimalMin(value = "0.0", message = "세전 금액은 0 이상이어야 합니다.")
    private BigDecimal amountBeforeTax;

    /**
     * 카드 가맹점 수수료(D5). 미입력 시 0. {@code amount}를 초과할 수 없습니다.
     */
    @DecimalMin(value = "0.0", message = "카드 수수료는 0 이상이어야 합니다.")
    private BigDecimal cardMerchantFeeAmount;
    
    @Size(max = 1000, message = "비고는 1000자 이하여야 합니다.")
    private String remarks;
}
