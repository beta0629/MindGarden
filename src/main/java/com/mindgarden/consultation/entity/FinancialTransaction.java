package com.mindgarden.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
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
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회계 거래 엔티티
 * 수입/지출 거래를 통합 관리하는 회계 시스템의 핵심 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Entity
@Table(name = "financial_transactions", indexes = {
    @Index(name = "idx_financial_transaction_date", columnList = "transaction_date"),
    @Index(name = "idx_financial_transaction_type", columnList = "transaction_type"),
    @Index(name = "idx_financial_transaction_category", columnList = "category"),
    @Index(name = "idx_financial_transaction_status", columnList = "status"),
    @Index(name = "idx_financial_transaction_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialTransaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
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
     * 거래 금액
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
     * 세금 포함 여부
     */
    @Column(name = "tax_included", nullable = false)
    @Builder.Default
    private Boolean taxIncluded = false;
    
    /**
     * 세금 금액
     */
    @DecimalMin(value = "0.0", message = "세금 금액은 0 이상이어야 합니다.")
    @Column(name = "tax_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;
    
    /**
     * 세전 금액
     */
    @DecimalMin(value = "0.0", message = "세전 금액은 0 이상이어야 합니다.")
    @Column(name = "amount_before_tax", precision = 15, scale = 2)
    private BigDecimal amountBeforeTax;
    
    /**
     * 비고
     */
    @Size(max = 1000, message = "비고는 1000자 이하여야 합니다.")
    @Column(name = "remarks", length = 1000)
    private String remarks;
    
    /**
     * 삭제 여부
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
    
    /**
     * 생성 시간
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * 수정 시간
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = TransactionStatus.PENDING;
        }
        if (taxIncluded == null) {
            taxIncluded = false;
        }
        if (taxAmount == null) {
            taxAmount = BigDecimal.ZERO;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (amountBeforeTax == null) {
            amountBeforeTax = amount;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        if (amountBeforeTax == null) {
            amountBeforeTax = amount;
        }
    }
    
    /**
     * 거래 유형 열거형
     */
    public enum TransactionType {
        INCOME("수입"),
        EXPENSE("지출");
        
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
    
    // 비즈니스 메서드
    
    /**
     * 승인 처리
     */
    public void approve(User approver, String comment) {
        this.status = TransactionStatus.APPROVED;
        this.approver = approver;
        this.approvedAt = LocalDateTime.now();
        this.approvalComment = comment;
    }
    
    /**
     * 거부 처리
     */
    public void reject(User approver, String comment) {
        this.status = TransactionStatus.REJECTED;
        this.approver = approver;
        this.approvedAt = LocalDateTime.now();
        this.approvalComment = comment;
    }
    
    /**
     * 취소 처리
     */
    public void cancel() {
        this.status = TransactionStatus.CANCELLED;
    }
    
    /**
     * 완료 처리
     */
    public void complete() {
        this.status = TransactionStatus.COMPLETED;
    }
    
    /**
     * 승인 가능한 상태인지 확인
     */
    public boolean isApprovable() {
        return TransactionStatus.PENDING.equals(status);
    }
    
    /**
     * 승인된 상태인지 확인
     */
    public boolean isApproved() {
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
