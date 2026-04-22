package com.coresolution.consultation.service;

import java.util.Optional;
import com.coresolution.consultation.dto.ConsultationRecordDraftResponse;

/**
 * 상담일지 서버 초안(자동저장) 서비스.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
public interface ConsultationRecordDraftService {

    /**
     * 초안 조회.
     *
     * @param tenantId 테넌트 ID
     * @param consultationId 상담(스케줄) ID
     * @param consultantId 상담사 ID
     * @return 초안(없으면 empty)
     */
    Optional<ConsultationRecordDraftResponse> getDraft(String tenantId, Long consultationId, Long consultantId);

    /**
     * 초안 upsert (테넌트·상담·상담사 단위 1건).
     *
     * @param tenantId 테넌트 ID
     * @param consultationId 상담(스케줄) ID
     * @param consultantId 상담사 ID
     * @param payloadJson JSON 문자열
     * @param expectedVersion 기대 버전(null이면 검사 생략)
     * @return 저장 후 응답
     */
    ConsultationRecordDraftResponse upsertDraft(
            String tenantId,
            Long consultationId,
            Long consultantId,
            String payloadJson,
            Long expectedVersion);
}
