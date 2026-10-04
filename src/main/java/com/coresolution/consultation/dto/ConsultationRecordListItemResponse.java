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
 * <p>2026-10-05: 식별자(일지·일정·내담자)·일자·회기·작성자·상태만 남긴다. 서술형 본문과
 * 위험도·진척·목표 달성·다음 일정 같은 평가 항목도 목록에서는 빼고, Expo·웹 목록은 탭 시 단건
 * 상세 API 로 받는다.</p>
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
    private final Boolean isSessionCompleted;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

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
                .isSessionCompleted(entity.getIsSessionCompleted())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
