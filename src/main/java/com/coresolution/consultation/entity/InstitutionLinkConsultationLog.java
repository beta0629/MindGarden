package com.coresolution.consultation.entity;

import java.time.LocalDate;
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
 * 타기관 연계 상담일지. 회기권 {@link ConsultationRecord} 와 분리하여 오류를 격리한다.
 *
 * <p>remainingSessions 컬럼이 없으며 저장 시 회기 잔여를 요구하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Entity
@Table(name = "institution_link_consultation_logs", indexes = {
    @Index(name = "idx_ilcl_tenant_contract", columnList = "tenant_id, contract_id"),
    @Index(name = "idx_ilcl_tenant_client", columnList = "tenant_id, client_id"),
    @Index(name = "idx_ilcl_tenant_session_date", columnList = "tenant_id, session_date")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_ilcl_tenant_source_record",
            columnNames = {"tenant_id", "source_record_id"})
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class InstitutionLinkConsultationLog extends BaseEntity {

    @NotNull
    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "schedule_id")
    private Long scheduleId;

    @NotNull
    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @NotNull
    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;

    @NotNull
    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "session_number")
    private Integer sessionNumber;

    @Column(name = "client_condition", columnDefinition = "TEXT")
    private String clientCondition;

    @Column(name = "main_issues", columnDefinition = "TEXT")
    private String mainIssues;

    @Column(name = "intervention_methods", columnDefinition = "TEXT")
    private String interventionMethods;

    @Column(name = "client_response", columnDefinition = "TEXT")
    private String clientResponse;

    @Column(name = "next_session_plan", columnDefinition = "TEXT")
    private String nextSessionPlan;

    @Column(name = "homework_assigned", columnDefinition = "TEXT")
    private String homeworkAssigned;

    @Column(name = "consultant_observations", columnDefinition = "TEXT")
    private String consultantObservations;

    @Column(name = "consultant_assessment", columnDefinition = "TEXT")
    private String consultantAssessment;

    @Column(name = "progress_evaluation", columnDefinition = "TEXT")
    private String progressEvaluation;

    @Column(name = "special_considerations", columnDefinition = "TEXT")
    private String specialConsiderations;

    @Column(name = "is_session_completed")
    private Boolean isSessionCompleted;

    @Column(name = "source_record_id")
    private Long sourceRecordId;
}
