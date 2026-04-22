package com.coresolution.consultation.dto;

import lombok.Data;

/**
 * 상담일지 서버 초안 저장 요청 본문.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@Data
public class ConsultationRecordDraftSaveRequest {

    /**
     * JSON 문자열 페이로드.
     */
    private String payloadJson;

    /**
     * 낙관적 락 기대 버전(선택). 불일치 시 {@link com.coresolution.consultation.exception.ValidationException}.
     */
    private Long expectedVersion;
}
