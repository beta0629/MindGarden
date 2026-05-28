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
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * 재무 마감 기간 엔티티 (financial_period 테이블 매핑).
 *
 * <p>합의서: docs/project-management/2026-05-28/ERP_FINANCIAL_CLOSE_IMPLEMENTATION_PLAN.md §2 Q4.</p>
 *
 * <ul>
 *   <li>멀티테넌트 격리: {@link #tenantId} NOT NULL + UNIQUE (tenant_id, period_type, period_start)</li>
 *   <li>낙관적 락: {@link #version} ({@code @Version}) — 동시 마감 충돌 방지</li>
 *   <li>스냅샷 KPI: {@link #totalIncome}, {@link #totalExpense}, {@link #netAmount},
 *       {@link #totalTaxAmount}(Q8 부가세 가드), {@link #totalRefund}</li>
 *   <li>재오픈 추적: {@link #status}=REOPENED 시 {@link #reopenedAt}/{@link #reopenedBy}/{@link #reopenReason}</li>
 * </ul>
 *
 * <p>본 엔티티는 {@code BaseEntity} 를 상속하지 않는다 — financial_period 는
 * append-on-close + REOPEN 한 번만 가능한 SSOT 이며, soft delete/auditing 컬럼이 불필요하다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Entity
@Table(
    name = "financial_period",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_tenant_period",
            columnNames = {"tenant_id", "period_type", "period_start"}
        )
    },
    indexes = {
        @Index(name = "idx_tenant_status", columnList = "tenant_id, status"),
        @Index(name = "idx_tenant_period_end", columnList = "tenant_id, period_end")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class FinancialPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    /** 테넌트 ID — 멀티테넌트 격리 (NOT NULL). */
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "period_type", nullable = false, length = 10)
    private PeriodType periodType;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 10)
    @Builder.Default
    private PeriodStatus status = PeriodStatus.OPEN;

    @Column(name = "total_income", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalIncome = BigDecimal.ZERO;

    @Column(name = "total_expense", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalExpense = BigDecimal.ZERO;

    @Column(name = "net_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal netAmount = BigDecimal.ZERO;

    /** 기간 부가세 합계 (Q8 가드 — 마감 차단 판단용). */
    @Column(name = "total_tax_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalTaxAmount = BigDecimal.ZERO;

    /** 기간 환불 합계 (Q8 가드 — expected_tax 산식 보조). */
    @Column(name = "total_refund", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalRefund = BigDecimal.ZERO;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by", length = 64)
    private String closedBy;

    @Column(name = "reopened_at")
    private LocalDateTime reopenedAt;

    @Column(name = "reopened_by", length = 64)
    private String reopenedBy;

    @Column(name = "reopen_reason", length = 500)
    private String reopenReason;

    /** 낙관적 락 — 동시 마감 충돌 시 OptimisticLockException 으로 차단. */
    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 닫힌 상태(CLOSED 또는 REOPENED) 여부 헬퍼.
     *
     * @return 마감 또는 재오픈 상태이면 true
     */
    public boolean isClosedOrReopened() {
        return status != null && status.isClosedOrReopened();
    }
}
