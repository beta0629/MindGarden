package com.coresolution.consultation.entity.erp.financial;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.BaseEntity;

/**
 * 회계 거래 엔티티.
 * <p>
 * 수입·지출 거래를 통합 관리하는 회계 시스템의 핵심 엔티티입니다.
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Entity
@Table(name = "financial_transactions", indexes = {
    @Index(name = "idx_financial_transaction_date", columnList = "transaction_date"),
    @Index(name = "idx_financial_transaction_type", columnList = "transaction_type"),
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class FinancialTransaction extends BaseEntity {
    
    
     /**
     * 거래 유형 (수입/지출)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private TransactionType transactionType;
    
     /**
     * 거래 카테고리 (공통 코드와 연결)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_code_id")
    private CommonCode categoryCode;
    
     /**
     * 거래 상세 분류 (공통 코드와 연결)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subcategory_code_id")
    private CommonCode subcategoryCode;
    
     /**
     * 거래 카테고리 (문자열 - 호환성을 위해 유지)
     */
    @Size(max = 50, message = "카테고리는 50자 이하여야 합니다.")
    @Column(name = "category", length = 50)
    private String category;
    
     /**
     * 거래 상세 분류 (문자열 - 호환성을 위해 유지)
     */
    @Size(max = 50, message = "상세 분류는 50자 이하여야 합니다.")
    @Column(name = "subcategory", length = 50)
    private String subcategory;
    
    /**
     * 거래 금액(총액).
     * 업무 규칙에 따라 세전·세포함·순액 등 의미가 달라질 수 있으므로
     * {@link #taxIncluded}, {@link #taxAmount}, {@link #amountBeforeTax}와 함께 해석합니다.
     */
    @NotNull(message = "거래 금액은 필수입니다.")
    @DecimalMin(value = "0.0", message = "거래 금액은 0 이상이어야 합니다.")
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
     /**
     * 거래 설명
     */
    @Size(max = 500, message = "거래 설명은 500자 이하여야 합니다.")
    @Column(name = "description", length = 500)
    private String description;
    
     /**
     * 거래 날짜
     */
    @NotNull(message = "거래 날짜는 필수입니다.")
    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;
    
     /**
     * 거래 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
    private TransactionStatus status = TransactionStatus.PENDING;
    
     /**
     * 승인자 (User 엔티티와 연결)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;
    
     /**
     * 승인 시간
     */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
     /**
     * 승인 코멘트
     */
    @Size(max = 500, message = "승인 코멘트는 500자 이하여야 합니다.")
    @Column(name = "approval_comment", length = 500)
    private String approvalComment;
    
     /**
     * 관련 엔티티 ID (급여계산, 구매요청, 결제 등과 연결)
     */
    @Column(name = "related_entity_id")
    private Long relatedEntityId;
    
     /**
     * 관련 엔티티 타입
     */
    @Size(max = 50, message = "관련 엔티티 타입은 50자 이하여야 합니다.")
    @Column(name = "related_entity_type", length = 50)
    private String relatedEntityType;
    
     /**
     * 부서/센터
     */
    @Size(max = 100, message = "부서명은 100자 이하여야 합니다.")
    @Column(name = "department", length = 100)
    private String department;
    
     /**
     * 프로젝트 코드
     */
    @Size(max = 50, message = "프로젝트 코드는 50자 이하여야 합니다.")
    @Column(name = "project_code", length = 50)
    private String projectCode;
    
    /**
     * 세금(부가세) 포함 여부.
     * {@code true}인 경우 {@link #amount}가 세포함 금액으로 해석되는 경우가 많습니다.
     */
    @Column(name = "tax_included", nullable = false)
    @Builder.Default
    private Boolean taxIncluded = false;

    /**
     * 부가세(VAT) 등 세액.
     * 일반적으로 이 필드는 부가세 금액을 뜻합니다.
     * 원천징수 예정액(예: 사업소득 3.3%)은 별도 필드·맥락에서 관리하며, 동일 필드에 혼용하지 않도록 주의합니다.
     */
    @DecimalMin(value = "0.0", message = "세금 금액은 0 이상이어야 합니다.")
    @Column(name = "tax_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    /**
     * 원천징수 예정액(예: 사업소득 3.3%). 부가세({@link #taxAmount})와 별도 필드.
     */
    @DecimalMin(value = "0.0", message = "원천징수 금액은 0 이상이어야 합니다.")
    @Column(name = "withholding_tax_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal withholdingTaxAmount = BigDecimal.ZERO;

    /**
     * 세전 금액(과세 표준에 해당하는 금액 등).
     * {@link #taxIncluded}, {@link #amount}, {@link #taxAmount}와의 관계는 업무 규칙에 따릅니다.
     */
    @DecimalMin(value = "0.0", message = "세전 금액은 0 이상이어야 합니다.")
    @Column(name = "amount_before_tax", precision = 15, scale = 2)
    private BigDecimal amountBeforeTax;

    /**
     * 카드 가맹점 수수료(D5: 승인액 − 수수료 = 실입금).
     * {@link #amount}는 고객 청구·승인 총액(부가세 포함 등)으로 해석하고, 실입금은 {@code amount - cardMerchantFeeAmount}입니다.
     * D6: PG·단말 자동 연동 시 {@code Payment#externalResponse} 등에서 채움 예정(현재 기본 0·수동 보정).
     */
    @DecimalMin(value = "0.0", message = "카드 수수료는 0 이상이어야 합니다.")
    @Column(name = "card_merchant_fee_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal cardMerchantFeeAmount = BigDecimal.ZERO;
    
    /**
     * 레거시 지점 코드. 브랜치 코드 기반 필터링은 사용하지 않습니다.
     * 레거시 데이터 호환을 위해 필드만 유지(NULL 허용)하며, 신규 코드에서는 테넌트 ID만 사용하세요.
     *
     * @deprecated 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated
    @Size(max = 20, message = "지점 코드는 20자 이하여야 합니다.")
    @Column(name = "branch_code", length = 20)
    private String branchCode;
    
    /**
     * 비고
     */
    private String remarks;

    @PrePersist
    protected void onCreate() {
        if (status == null) {
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            status = TransactionStatus.PENDING;
        }
        if (taxIncluded == null) {
            taxIncluded = false;
        }
        if (taxAmount == null) {
            taxAmount = BigDecimal.ZERO;
        }
        if (withholdingTaxAmount == null) {
            withholdingTaxAmount = BigDecimal.ZERO;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (amountBeforeTax == null) {
            amountBeforeTax = amount;
        }
        if (cardMerchantFeeAmount == null) {
            cardMerchantFeeAmount = BigDecimal.ZERO;
        }
        if (amount != null && cardMerchantFeeAmount.compareTo(amount) > 0) {
            cardMerchantFeeAmount = amount;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        if (amountBeforeTax == null) {
            amountBeforeTax = amount;
        }
        if (withholdingTaxAmount == null) {
            withholdingTaxAmount = BigDecimal.ZERO;
        }
        if (cardMerchantFeeAmount == null) {
            cardMerchantFeeAmount = BigDecimal.ZERO;
        }
        if (amount != null && cardMerchantFeeAmount.compareTo(amount) > 0) {
            cardMerchantFeeAmount = amount;
        }
    }

    /**
     * 카드 실입금액(D5). {@link #amount}에서 가맹점 수수료를 뺀 값.
     */
    public BigDecimal resolveCardNetDepositAmount() {
        BigDecimal fee = cardMerchantFeeAmount != null ? cardMerchantFeeAmount : BigDecimal.ZERO;
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        return amount.subtract(fee);
    }
    
     /**
     * 거래 유형 열거형
     */
    public enum TransactionType {
        INCOME("수입"),
        EXPENSE("지출"),
        RECEIVABLES("미수금");
        
        private final String displayName;
        
        TransactionType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
     /**
     * 거래 상태 열거형
     */
    public enum TransactionStatus {
        PENDING("대기중"),
        APPROVED("승인됨"),
        REJECTED("거부됨"),
        CANCELLED("취소됨"),
        COMPLETED("완료됨");
        
        private final String displayName;
        
        TransactionStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    
     /**
     * 승인 처리
     */
    public void approve(User approver, String comment) {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        this.status = TransactionStatus.APPROVED;
        this.approver = approver;
        this.approvedAt = LocalDateTime.now();
        this.approvalComment = comment;
    }
    
     /**
     * 거부 처리
     */
    public void reject(User approver, String comment) {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        this.status = TransactionStatus.REJECTED;
        this.approver = approver;
        this.approvedAt = LocalDateTime.now();
        this.approvalComment = comment;
    }
    
     /**
     * 취소 처리
     */
    public void cancel() {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        this.status = TransactionStatus.CANCELLED;
    }
    
     /**
     * 완료 처리
     */
    public void complete() {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        this.status = TransactionStatus.COMPLETED;
    }
    
     /**
     * 승인 가능한 상태인지 확인
     */
    public boolean isApprovable() {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        return TransactionStatus.PENDING.equals(status);
    }
    
     /**
     * 승인된 상태인지 확인
     */
    public boolean isApproved() {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        return TransactionStatus.APPROVED.equals(status);
    }
    
     /**
     * 수입 거래인지 확인
     */
    public boolean isIncome() {
        return TransactionType.INCOME.equals(transactionType);
    }
    
     /**
     * 지출 거래인지 확인
     */
    public boolean isExpense() {
        return TransactionType.EXPENSE.equals(transactionType);
    }
}
