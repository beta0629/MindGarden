package com.coresolution.consultation.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 타기관 연계 등록(월결제·초기 선납). 회기권 {@link ConsultantClientMapping} 과 테이블을 분리한다.
 *
 * <p>remainingSessions / usedSessions / totalSessions 컬럼이 없다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Entity
@Table(name = "institution_link_contracts", indexes = {
    @Index(name = "idx_ilc_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_ilc_tenant_client", columnList = "tenant_id, client_id"),
    @Index(name = "idx_ilc_tenant_institution", columnList = "tenant_id, institution_id"),
    @Index(name = "idx_ilc_tenant_status", columnList = "tenant_id, status")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class InstitutionLinkContract extends BaseEntity {

    @NotNull
    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @NotNull
    @Column(name = "institution_id", nullable = false)
    private Long institutionId;

    @Column(name = "consultant_id")
    private Long consultantId;

    @NotNull
    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @NotNull
    @Column(name = "prepaid_amount", nullable = false)
    private Long prepaidAmount;

    @Column(name = "prepaid_at")
    private LocalDateTime prepaidAt;

    @NotNull
    @Column(name = "monthly_amount", nullable = false)
    private Long monthlyAmount;

    @NotNull
    @Size(max = 50)
    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "source_mapping_id")
    private Long sourceMappingId;
}
