package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.InstitutionLinkConsultationLogCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogResponse;

/**
 * 타기관 연계 상담일지 서비스. 회기 {@code consultation_records} 에 쓰지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public interface InstitutionLinkConsultationLogService {

    /**
     * 타기관 일지를 저장한다. remainingSessions 검증을 하지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param request 생성 요청
     * @return 저장된 일지
     * @throws IllegalStateException tenantId 가 없거나 공백인 경우
     * @throws com.coresolution.consultation.exception.EntityNotFoundException 계약이 테넌트에 없을 때
     * @throws com.coresolution.consultation.exception.ValidationException 필수값 누락
     */
    InstitutionLinkConsultationLogResponse create(String tenantId,
            InstitutionLinkConsultationLogCreateRequest request);
}
