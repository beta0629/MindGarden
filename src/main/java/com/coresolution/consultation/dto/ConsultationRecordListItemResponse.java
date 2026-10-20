package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.util.ConsultationLogListFilters;
import lombok.Builder;
import lombok.Getter;

/**
 * 상담일지 <b>목록</b> 응답 항목 (요약·메타 전용).
 *
 * <p>목록 API 는 상담일지 본문을 돌려주지 않는다. 임상 본문(의료·약물·가족·위험요소·평가 등)은
 * 단건 조회에서만 노출한다. 본 DTO 는 {@code GET /api/v1/schedules/consultation-records?consultantId=}
 * 페이지 목록에 쓰이며, 엔티티 직렬화(모든 TEXT 컬럼 노출) 를 대체한다.</p>
 *
 * <p>2026-10-05: 식별자(일지·일정·내담자)·일자·회기·작성자·상태만 남긴다. 서술형 본문과
 * 위험도·진척·목표 달성·다음 일정 같은 평가 항목도 목록에서는 빼고, Expo·웹 목록은 탭 시 단건
 * 상세 API 로 받는다.</p>
 *
 * <p>2026-10-11: {@code clientName}·{@code consultantName} 은 임상 본문이 아니라 목록 메타다.
 * 같은 테넌트의 미삭제 사용자 표시명만 싣고, 없으면 null 이다. 비어 있을 때의 화면 문구는
 * locale {@code adminConsultationLogs.people.unknownName} 이다. 마지막 작성자의 표시명은
 * 계속 싣지 않는다.</p>
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
    /** 같은 테넌트 미삭제 내담자 표시명. 목록 메타이며 본문 보호 대상이 아니다. 없으면 null. */
    private final String clientName;
    /** 같은 테넌트 미삭제 상담사 표시명. 목록 메타이며 본문 보호 대상이 아니다. 없으면 null. */
    private final String consultantName;
    private final LocalDate sessionDate;
    private final Integer sessionNumber;
    private final Boolean isSessionCompleted;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    /** 마지막 작성·수정자 users.id. 작성자 표시명은 목록 메타에 포함하지 않는다. */
    private final Long lastEditedById;
    /** 마지막 작성·수정자 역할명. */
    private final String lastEditedByRole;
    /** 마지막 작성·수정 시각. */
    private final LocalDateTime lastEditedAt;
    /** 같은 테넌트 관리자 계열이 대리 작성했는지. */
    private final boolean writtenByAdmin;
    /** 마지막 수정자가 같은 테넌트 관리자 계열인지. */
    private final boolean editedByAdmin;
    /** 주요 이슈 첫 줄. 임상 본문 전문은 포함하지 않는다. */
    private final String summaryPreview;

    /**
     * 엔티티 → 목록 항목 변환.
     *
     * 이름 없이 요약·메타만 변환한다. 표시명이 필요하면
     * {@link #fromEntity(ConsultationRecord, String, String)} 를 쓴다.
     *
     * @param entity 상담일지 엔티티
     * @return 요약·메타 항목. clientName·consultantName 은 null
     */
    public static ConsultationRecordListItemResponse fromEntity(ConsultationRecord entity) {
        return fromEntity(entity, null, null);
    }

    /**
     * 엔티티와 이미 조회한 표시명으로 목록 항목을 만든다.
     *
     * @param entity         상담일지 엔티티
     * @param clientName     내담자 표시명. 없으면 null
     * @param consultantName 상담사 표시명. 없으면 null
     * @return 요약·메타 항목
     */
    public static ConsultationRecordListItemResponse fromEntity(ConsultationRecord entity, String clientName,
            String consultantName) {
        return ConsultationRecordListItemResponse.builder()
                .id(entity.getId())
                .consultationId(entity.getConsultationId())
                .clientId(entity.getClientId())
                .consultantId(entity.getConsultantId())
                .clientName(clientName)
                .consultantName(consultantName)
                .sessionDate(entity.getSessionDate())
                .sessionNumber(entity.getSessionNumber())
                .isSessionCompleted(entity.getIsSessionCompleted())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .lastEditedById(entity.getLastEditedById())
                .lastEditedByRole(entity.getLastEditedByRole())
                .lastEditedAt(entity.getLastEditedAt())
                .writtenByAdmin(entity.isWrittenByAdmin())
                .editedByAdmin(entity.isEditedByAdmin())
                .summaryPreview(ConsultationLogListFilters.preview(entity.getMainIssues()))
                .build();
    }
}
