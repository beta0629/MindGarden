package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.util.Map;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 타기관 연계 상담일지 생성 요청. remainingSessions·sessionNumber 를 요구하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionLinkConsultationLogCreateRequest {

    private Long contractId;

    private Long mappingId;

    private Long scheduleId;

    @NotNull
    private Long clientId;

    @NotNull
    private Long consultantId;

    @NotNull
    private LocalDate sessionDate;

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

    /**
     * 스케줄 상담일지 payload 를 타기관 요청으로 변환한다. {@code sessionNumber} 는 무시한다.
     *
     * @param recordData 스케줄 컨트롤러 본문
     * @return 타기관 생성 요청
     */
    public static InstitutionLinkConsultationLogCreateRequest fromSchedulePayload(Map<String, Object> recordData) {
        if (recordData == null) {
            return InstitutionLinkConsultationLogCreateRequest.builder().build();
        }
        return InstitutionLinkConsultationLogCreateRequest.builder()
                .contractId(toLong(recordData.get("contractId")))
                .mappingId(toLong(recordData.get("mappingId")))
                .scheduleId(firstLong(recordData.get("scheduleId"), recordData.get("consultationId")))
                .clientId(toLong(recordData.get("clientId")))
                .consultantId(toLong(recordData.get("consultantId")))
                .sessionDate(toLocalDate(recordData.get("sessionDate")))
                .clientCondition(toStringValue(recordData.get("clientCondition")))
                .mainIssues(toStringValue(recordData.get("mainIssues")))
                .interventionMethods(toStringValue(recordData.get("interventionMethods")))
                .clientResponse(toStringValue(recordData.get("clientResponse")))
                .nextSessionPlan(toStringValue(recordData.get("nextSessionPlan")))
                .homeworkAssigned(toStringValue(recordData.get("homeworkAssigned")))
                .consultantObservations(toStringValue(recordData.get("consultantObservations")))
                .consultantAssessment(toStringValue(recordData.get("consultantAssessment")))
                .progressEvaluation(toStringValue(recordData.get("progressEvaluation")))
                .specialConsiderations(toStringValue(recordData.get("specialConsiderations")))
                .isSessionCompleted(toBoolean(recordData.get("isSessionCompleted")))
                .build();
    }

    private static Long firstLong(Object first, Object second) {
        Long parsed = toLong(first);
        return parsed != null ? parsed : toLong(second);
    }

    private static Long toLong(Object raw) {
        if (raw == null || raw.toString().isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(raw.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static LocalDate toLocalDate(Object raw) {
        if (raw == null || raw.toString().isBlank()) {
            return null;
        }
        return LocalDate.parse(raw.toString().trim());
    }

    private static String toStringValue(Object raw) {
        return raw == null ? null : raw.toString();
    }

    private static Boolean toBoolean(Object raw) {
        if (raw == null || raw.toString().isBlank()) {
            return null;
        }
        return Boolean.valueOf(raw.toString().trim());
    }
}
