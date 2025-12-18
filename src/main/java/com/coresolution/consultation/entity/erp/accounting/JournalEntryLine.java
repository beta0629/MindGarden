package com.coresolution.consultation.entity.erp.accounting;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 분개 상세 라인 엔티티
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-18
 */
@Entity
@Table(name = "erp_journal_entry_lines",
    indexes = {
        @Index(name = "idx_erp_journal_entry_lines_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_erp_journal_entry_lines_journal_entry_id", columnList = "journal_entry_id"),
        @Index(name = "idx_erp_journal_entry_lines_account_id", columnList = "account_id"),
        @Index(name = "idx_erp_journal_entry_lines_is_deleted", columnList = "is_deleted")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntryLine {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 테넌트 ID (ERP 독립성 보장)
     */
    @NotNull(message = "테넌트 ID는 필수입니다.")
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;
    
    /**
     * 분개 ID (FK: accounting_entries.id)
     */
    @NotNull(message = "분개 ID는 필수입니다.")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id", nullable = false)
    private AccountingEntry journalEntry;
    
    /**
     * 계정 ID (FK: accounts.id)
     */
    @NotNull(message = "계정 ID는 필수입니다.")
    @Column(name = "account_id", nullable = false)
    private Long accountId;
    
    /**
     * 차변 금액
     */
    @Column(name = "debit_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal debitAmount = BigDecimal.ZERO;
    
    /**
     * 대변 금액
     */
    @Column(name = "credit_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal creditAmount = BigDecimal.ZERO;
    
    /**
     * 설명
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * 라인 번호
     */
    @NotNull(message = "라인 번호는 필수입니다.")
    @Column(name = "line_number", nullable = false)
    private Integer lineNumber;
    
    /**
     * 생성자 ID
     */
    @Column(name = "created_by")
    private Long createdBy;
    
    /**
     * 생성 시간
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * 수정자 ID
     */
    @Column(name = "updated_by")
    private Long updatedBy;
    
    /**
     * 수정 시간
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    /**
     * 삭제 여부
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
    
    /**
     * 삭제 시간
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    /**
     * 삭제자 ID
     */
    @Column(name = "deleted_by")
    private Long deletedBy;
}

