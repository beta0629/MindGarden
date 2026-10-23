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
 * 타기관 연계 상담일지. 회기권 {@link ConsultationRecord} 와 테이블을 분리한다.
 *
 * <p>remainingSessions / sessionSequence 컬럼이 없으며 저장 시 회기 잔여를 요구하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Entity
@Table(name = "institution_link_consultation_logs", indexes = {
    @Index(name = "idx_ilcl_tenant_mapping_month", columnList = "tenant_id, mapping_id, billing_year_month"),
    @Index(name = "idx_ilcl_tenant_contract_month", columnList = "tenant_id, contract_id, billing_year_month"),
    @Index(name = "idx_ilcl_tenant_session_date", columnList = "tenant_id, session_date"),
    @Index(name = "idx_ilcl_tenant_schedule", columnList = "tenant_id, schedule_id")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class InstitutionLinkConsultationLog extends BaseEntity {

    @Column(name = "contract_id")
    private Long contractId;

    @Column(name = "mapping_id")
    private Long mappingId;

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

    @NotNull
    @Size(max = 7)
    @Column(name = "billing_year_month", nullable = false, length = 7)
    private String billingYearMonth;

    @NotNull
    @Column(name = "monthly_occurrence", nullable = false)
    private Integer monthlyOccurrence;

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

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
