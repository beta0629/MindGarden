package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 타기관 연계 일정 연결. 캘린더 occupancy 는 기존 {@code schedules} 행을 유지한다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Entity
@Table(name = "institution_link_schedule_links", indexes = {
    @Index(name = "idx_ilsl_tenant_contract", columnList = "tenant_id, contract_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_ilsl_tenant_schedule", columnNames = {"tenant_id", "schedule_id"})
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class InstitutionLinkScheduleLink extends BaseEntity {

    @NotNull
    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @NotNull
    @Column(name = "schedule_id", nullable = false)
    private Long scheduleId;
}
