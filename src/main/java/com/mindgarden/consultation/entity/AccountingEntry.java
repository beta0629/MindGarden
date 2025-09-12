package com.mindgarden.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
 * 회계 분개 엔티티
 * 대차대조표 작성을 위한 회계 거래 분개
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Entity
@Table(name = "accounting_entries", indexes = {
    @Index(name = "idx_accounting_entry_date", columnList = "entry_date"),
    @Index(name = "idx_accounting_entry_type", columnList = "entry_type"),
    @Index(name = "idx_accounting_entry_account", columnList = "account_code"),
    @Index(name = "idx_accounting_entry_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountingEntry {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 분개 일자
     */
    @NotNull(message = "분개 일자는 필수입니다.")
    @Column(name = "entry_date", nullable = false)
    private java.time.LocalDate entryDate;
    
    /**
     * 분개 유형 (차변/대변)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 10)
    private EntryType entryType;
    
    /**
     * 계정 코드
     */
    @NotNull(message = "계정 코드는 필수입니다.")
    @Size(max = 20, message = "계정 코드는 20자 이하여야 합니다.")
    @Column(name = "account_code", nullable = false, length = 20)
    private String accountCode;
    
    /**
     * 계정명
     */
    @NotNull(message = "계정명은 필수입니다.")
    @Size(max = 100, message = "계정명은 100자 이하여야 합니다.")
    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;
    
    /**
     * 금액
     */
    @NotNull(message = "금액은 필수입니다.")
    @DecimalMin(value = "0.0", message = "금액은 0 이상이어야 합니다.")
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
    /**
     * 적요
     */
    @Size(max = 500, message = "적요는 500자 이하여야 합니다.")
    @Column(name = "description", length = 500)
    private String description;
    
    /**
     * 관련 거래 ID (급여, 구매, 결제 등)
     */
    @Column(name = "related_transaction_id")
    private Long relatedTransactionId;
    
    /**
     * 관련 거래 타입
     */
    @Size(max = 50, message = "관련 거래 타입은 50자 이하여야 합니다.")
    @Column(name = "related_transaction_type", length = 50)
    private String relatedTransactionType;
    
    /**
     * 대차대조표 분류
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "balance_sheet_category", nullable = false, length = 20)
    private BalanceSheetCategory balanceSheetCategory;
    
    /**
     * 세부 분류
     */
    @Size(max = 50, message = "세부 분류는 50자 이하여야 합니다.")
    @Column(name = "subcategory", length = 50)
    private String subcategory;
    
    /**
     * 승인 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;
    
    /**
     * 승인자 ID
     */
    @Column(name = "approver_id")
    private Long approverId;
    
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
        if (approvalStatus == null) {
            approvalStatus = ApprovalStatus.PENDING;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }
    
    /**
     * 분개 유형 열거형
     */
    public enum EntryType {
        DEBIT("차변"),
        CREDIT("대변");
        
        private final String displayName;
        
        EntryType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    /**
     * 대차대조표 분류 열거형
     */
    public enum BalanceSheetCategory {
        ASSETS_CURRENT("유동자산"),
        ASSETS_FIXED("고정자산"),
        LIABILITIES_CURRENT("유동부채"),
        LIABILITIES_LONG_TERM("비유동부채"),
        EQUITY("자본"),
        REVENUE("수익"),
        EXPENSES("비용");
        
        private final String displayName;
        
        BalanceSheetCategory(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    /**
     * 승인 상태 열거형
     */
    public enum ApprovalStatus {
        PENDING("대기중"),
        APPROVED("승인됨"),
        REJECTED("거부됨"),
        CANCELLED("취소됨");
        
        private final String displayName;
        
        ApprovalStatus(String displayName) {
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
    public void approve(Long approverId, String comment) {
        this.approvalStatus = ApprovalStatus.APPROVED;
        this.approverId = approverId;
        this.approvedAt = LocalDateTime.now();
        this.approvalComment = comment;
    }
    
    /**
     * 거부 처리
     */
    public void reject(Long approverId, String comment) {
        this.approvalStatus = ApprovalStatus.REJECTED;
        this.approverId = approverId;
        this.approvedAt = LocalDateTime.now();
        this.approvalComment = comment;
    }
    
    /**
     * 취소 처리
     */
    public void cancel() {
        this.approvalStatus = ApprovalStatus.CANCELLED;
    }
    
    /**
     * 승인 가능한 상태인지 확인
     */
    public boolean isApprovable() {
        return ApprovalStatus.PENDING.equals(approvalStatus);
    }
    
    /**
     * 승인된 상태인지 확인
     */
    public boolean isApproved() {
        return ApprovalStatus.APPROVED.equals(approvalStatus);
    }
    
    /**
     * 차변인지 확인
     */
    public boolean isDebit() {
        return EntryType.DEBIT.equals(entryType);
    }
    
    /**
     * 대변인지 확인
     */
    public boolean isCredit() {
        return EntryType.CREDIT.equals(entryType);
    }
}
