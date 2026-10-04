package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.coresolution.consultation.entity.ConsultationRecord;
import lombok.Builder;
import lombok.Getter;

/**
 * 상담일지 <b>목록</b> 응답 항목 (요약·메타 전용).
 *
 * <p>목록 API 는 상담일지 본문을 돌려주지 않는다. 임상 본문(의료·약물·가족·위험요소·평가 등)은
 * 단건 조회에서만 노출한다. 본 DTO 는 {@code GET /api/v1/schedules/consultation-records?consultantId=}
 * 페이지 목록에 쓰이며, 엔티티 직렬화(모든 TEXT 컬럼 노출) 를 대체한다.</p>
 *
 * <p>아래 4개 필드({@code clientCondition}, {@code mainIssues}, {@code consultantObservations},
 * {@code nextSessionPlan})는 Expo 상담일지 목록 화면이 미리보기 문구로 렌더링하고 있어 호환을 위해
 * 남겨 둔다. 목록 미리보기를 없애기로 결정되면 함께 제거한다 (운영 화면 영향 있음).</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Getter
@Builder
public class ConsultationRecordListItemResponse {

    private final Long id;
    private final Long consultationId;
    private final Long clientId;
    private final Long consultantId;
    private final LocalDate sessionDate;
    private final Integer sessionNumber;
    private final Integer sessionDurationMinutes;
    private final Boolean isSessionCompleted;
    private final LocalDateTime completionTime;
    private final Integer progressScore;
    private final String riskAssessment;
    private final String goalAchievement;
    private final LocalDate nextSessionDate;
    private final LocalDate homeworkDueDate;
    private final LocalDate followUpDueDate;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    /** 목록 미리보기 호환 필드 — Expo 목록 화면 렌더링용. 미리보기 제거 시 함께 제거. */
    private final String clientCondition;
    /** 목록 미리보기 호환 필드 — Expo 목록 화면 렌더링용. 미리보기 제거 시 함께 제거. */
    private final String mainIssues;
    /** 목록 미리보기 호환 필드 — Expo 목록 화면 렌더링용. 미리보기 제거 시 함께 제거. */
    private final String consultantObservations;
    /** 목록 미리보기 호환 필드 — Expo 목록 화면 렌더링용. 미리보기 제거 시 함께 제거. */
    private final String nextSessionPlan;

    /**
     * 엔티티 → 목록 항목 변환.
     *
     * @param entity 상담일지 엔티티
     * @return 요약·메타 항목
     */
    public static ConsultationRecordListItemResponse fromEntity(ConsultationRecord entity) {
        return ConsultationRecordListItemResponse.builder()
                .id(entity.getId())
                .consultationId(entity.getConsultationId())
                .clientId(entity.getClientId())
                .consultantId(entity.getConsultantId())
                .sessionDate(entity.getSessionDate())
                .sessionNumber(entity.getSessionNumber())
                .sessionDurationMinutes(entity.getSessionDurationMinutes())
                .isSessionCompleted(entity.getIsSessionCompleted())
                .completionTime(entity.getCompletionTime())
                .progressScore(entity.getProgressScore())
                .riskAssessment(entity.getRiskAssessment())
                .goalAchievement(entity.getGoalAchievement())
                .nextSessionDate(entity.getNextSessionDate())
                .homeworkDueDate(entity.getHomeworkDueDate())
                .followUpDueDate(entity.getFollowUpDueDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .clientCondition(entity.getClientCondition())
                .mainIssues(entity.getMainIssues())
                .consultantObservations(entity.getConsultantObservations())
                .nextSessionPlan(entity.getNextSessionPlan())
                .build();
    }
}
