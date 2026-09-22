package com.coresolution.consultation.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 타기관 연계 계약. 회기권 {@link ConsultantClientMapping} 과 테이블을 분리한다.
 *
 * <p>remainingSessions / usedSessions / totalSessions 컬럼이 없다.
 * 기간({@code periodStart}/{@code periodEnd})은 optional 이며 월 단위 고정이 아니다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Entity
@Table(name = "institution_link_contracts", indexes = {
    @Index(name = "idx_ilc_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_ilc_tenant_client", columnList = "tenant_id, client_id"),
    @Index(name = "idx_ilc_tenant_consultant", columnList = "tenant_id, consultant_id"),
    @Index(name = "idx_ilc_tenant_status", columnList = "tenant_id, status")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_ilc_tenant_source_mapping",
            columnNames = {"tenant_id", "source_mapping_id"})
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class InstitutionLinkContract extends BaseEntity {

    @NotNull
    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;

    @NotNull
    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(name = "prepaid_amount")
    private Long prepaidAmount;

    @Column(name = "prepaid_at")
    private LocalDateTime prepaidAt;

    @Column(name = "monthly_amount")
    private Long monthlyAmount;

    @NotNull
    @Size(max = 50)
    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Size(max = 200)
    @Column(name = "institution_name", length = 200)
    private String institutionName;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "source_mapping_id")
    private Long sourceMappingId;
}
