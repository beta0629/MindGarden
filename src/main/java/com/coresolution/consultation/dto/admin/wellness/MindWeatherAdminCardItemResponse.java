package com.coresolution.consultation.dto.admin.wellness;

import java.time.LocalDateTime;

/**
 * 어드민 마음 날씨 카드 목록 행(PII 최소화: 사용자 PK·요약 미리보기만).
 *
 * @param id                   카드 PK
 * @param clientUserId         내담자 사용자 PK
 * @param source               출처 코드
 * @param sourceRefId          출처 참조(있을 때만)
 * @param summaryPreview       요약 미리보기(절단)
 * @param tone                 톤 코드
 * @param shareSummary         요약 공유 여부
 * @param shareOriginal        원문 공유 여부
 * @param shareConsultantUserId 공유 대상 상담사 PK(없으면 null)
 * @param createdAt            생성 시각
 * @author MindGarden
 * @since 2026-05-14
 */
public record MindWeatherAdminCardItemResponse(
        Long id,
        Long clientUserId,
        String source,
        String sourceRefId,
        String summaryPreview,
        String tone,
        boolean shareSummary,
        boolean shareOriginal,
        Long shareConsultantUserId,
        LocalDateTime createdAt) {
}
