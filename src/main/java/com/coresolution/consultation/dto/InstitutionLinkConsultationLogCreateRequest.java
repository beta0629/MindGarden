package com.coresolution.consultation.dto;

import java.time.LocalDate;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 타기관 연계 상담일지 생성 요청. remainingSessions 없음.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionLinkConsultationLogCreateRequest {

    @NotNull
    private Long contractId;

    private Long scheduleId;

    @NotNull
    private Long clientId;

    @NotNull
    private Long consultantId;

    @NotNull
    private LocalDate sessionDate;

    private Integer sessionNumber;

    private String clientCondition;

    private String mainIssues;

    private String interventionMethods;

    private String clientResponse;

    private String nextSessionPlan;

    private String homeworkAssigned;

    private String consultantObservations;

    private String consultantAssessment;

    private String progressEvaluation;

    private String specialConsiderations;

    private Boolean isSessionCompleted;
}
