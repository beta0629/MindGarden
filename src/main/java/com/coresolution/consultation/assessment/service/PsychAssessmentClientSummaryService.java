package com.coresolution.consultation.assessment.service;

import com.coresolution.consultation.assessment.dto.PsychAssessmentClientSummaryDto;

/**
 * 내담자 기준 심리검사(TCI/MMPI) 요약 — 상담일지·내담자 UI 노출 SSOT.
 *
 * @author CoreSolution
 * @since 2026-05-09
 */
public interface PsychAssessmentClientSummaryService {

    /**
     * clientId에 대해 노출 가능한 심리 문서·유형 요약을 반환한다.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 PK (null이면 빈 요약)
     * @return hasPsychData, typesPresent, documents
     */
    PsychAssessmentClientSummaryDto buildClientSummary(String tenantId, Long clientId);
}
