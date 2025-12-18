package com.coresolution.consultation.entity.erp.accounting;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 원장 엔티티
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 * 
 * 계정별 기간별 원장을 관리합니다.
 * 기초 잔액 + 총 차변 - 총 대변 = 기말 잔액
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-18
 */
@Entity
@Table(name = "erp_ledgers",
    indexes = {
        @Index(name = "idx_erp_ledgers_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_erp_ledgers_account_id", columnList = "account_id"),
        @Index(name = "idx_erp_ledgers_period", columnList = "period_start, period_end")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_erp_ledgers_account_period", 
            columnNames = {"tenant_id", "account_id", "period_start", "period_end"})
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ledger {
    
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
     * 계정 ID (FK: accounts.id)
     */
    @NotNull(message = "계정 ID는 필수입니다.")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;
    
    /**
     * 기간 시작일
     */
    @NotNull(message = "기간 시작일은 필수입니다.")
    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;
    
    /**
     * 기간 종료일
     */
    @NotNull(message = "기간 종료일은 필수입니다.")
    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;
    
    /**
     * 기초 잔액
     */
    @Column(name = "opening_balance", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal openingBalance = BigDecimal.ZERO;
    
    /**
     * 총 차변
     */
    @Column(name = "total_debit", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalDebit = BigDecimal.ZERO;
    
    /**
     * 총 대변
     */
    @Column(name = "total_credit", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalCredit = BigDecimal.ZERO;
    
    /**
     * 기말 잔액 (기초 잔액 + 총 차변 - 총 대변)
     */
    @Column(name = "closing_balance", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal closingBalance = BigDecimal.ZERO;
    
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
     * 기말 잔액 계산
     * 기초 잔액 + 총 차변 - 총 대변 = 기말 잔액
     */
    public void calculateClosingBalance() {
        this.closingBalance = openingBalance
            .add(totalDebit != null ? totalDebit : BigDecimal.ZERO)
            .subtract(totalCredit != null ? totalCredit : BigDecimal.ZERO);
    }
}

