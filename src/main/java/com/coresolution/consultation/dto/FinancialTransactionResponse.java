package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회계 거래 응답 DTO.
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
public class FinancialTransactionResponse {
    
    private Long id;
    private String transactionType;
    private String transactionTypeDisplayName;
    private String category;
    private String subcategory;
    /**
     * 거래 금액(총액). {@code taxIncluded}·세액 필드와 함께 해석합니다.
     */
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
    /**
     * @deprecated 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated
    private String branchCode;
    /**
     * 세금(부가세) 포함 여부.
     */
    private Boolean taxIncluded;
    /**
     * 부가세(VAT) 등 세액. 일반적으로 부가세 금액을 뜻합니다.
     * 원천징수 예정액은 별도 필드·맥락에서 관리하며, 동일 필드에 혼용하지 않도록 주의합니다.
     */
    private BigDecimal taxAmount;
    /**
     * 원천징수 예정액. 부가세({@link #taxAmount})와 별도.
     */
    private BigDecimal withholdingTaxAmount;
    /**
     * 세전 금액(과세 표준에 해당하는 금액 등).
     * {@code taxIncluded}, {@code amount}, {@code taxAmount}와의 관계는 업무 규칙에 따릅니다.
     */
    private BigDecimal amountBeforeTax;
    /**
     * 카드 가맹점 수수료(D5).
     */
    private BigDecimal cardMerchantFeeAmount;
    /**
     * 카드 실입금액(D5): 승인액({@link #amount}) − 수수료.
     */
    private BigDecimal cardNetDepositAmount;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 매칭 정보 (CONSULTANT_CLIENT_MAPPING 관련 거래인 경우)
    private String consultantName;
    private String clientName;
    /** 매핑 패키지명 */
    private String mappingPackageName;
    /** 매핑 상태 표시용 (한글 요약) */
    private String mappingStatusDisplay;
    /** 결제 상태 표시용 (한글 요약) */
    private String mappingPaymentStatusDisplay;
    /** 남은 회기 (매핑 연동 시) */
    private Integer mappingRemainingSessions;
}
