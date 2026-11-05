package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 타기관 연계 상담일지 응답.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionLinkConsultationLogResponse {

    private Long id;
    private String tenantId;
    private Long contractId;
    private Long mappingId;
    private Long scheduleId;
    private Long clientId;
    private Long consultantId;
    private LocalDate sessionDate;
    private String billingYearMonth;
    private Integer monthlyOccurrence;
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
    private LocalDateTime completedAt;

    /**
     * 엔티티 → 응답. 저장 본문 필드를 누락하지 않는다(재오픈 로드용).
     *
     * @param entity 일지
     * @return 응답
     */
    public static InstitutionLinkConsultationLogResponse fromEntity(InstitutionLinkConsultationLog entity) {
        if (entity == null) {
            return null;
        }
        return InstitutionLinkConsultationLogResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .contractId(entity.getContractId())
                .mappingId(entity.getMappingId())
                .scheduleId(entity.getScheduleId())
                .clientId(entity.getClientId())
                .consultantId(entity.getConsultantId())
                .sessionDate(entity.getSessionDate())
                .billingYearMonth(entity.getBillingYearMonth())
                .monthlyOccurrence(entity.getMonthlyOccurrence())
                .clientCondition(entity.getClientCondition())
                .mainIssues(entity.getMainIssues())
                .interventionMethods(entity.getInterventionMethods())
                .clientResponse(entity.getClientResponse())
                .nextSessionPlan(entity.getNextSessionPlan())
                .homeworkAssigned(entity.getHomeworkAssigned())
                .consultantObservations(entity.getConsultantObservations())
                .consultantAssessment(entity.getConsultantAssessment())
                .progressEvaluation(entity.getProgressEvaluation())
                .specialConsiderations(entity.getSpecialConsiderations())
                .isSessionCompleted(entity.getIsSessionCompleted())
                .completedAt(entity.getCompletedAt())
                .build();
    }
}
