package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.PartnerInstitutionCreateRequest;
import com.coresolution.consultation.dto.PartnerInstitutionResponse;
import com.coresolution.consultation.dto.PartnerInstitutionUpdateRequest;

/**
 * 연계 기관 마스터 서비스.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public interface PartnerInstitutionService {

    /**
     * 테넌트 기관 목록.
     *
     * @param tenantId 테넌트 ID
     * @return 기관 목록
     * @throws IllegalStateException tenantId 가 없거나 공백인 경우
     */
    List<PartnerInstitutionResponse> list(String tenantId);

    /**
     * 기관 등록.
     *
     * @param tenantId 테넌트 ID
     * @param request 생성 요청
     * @return 저장된 기관
     * @throws IllegalStateException tenantId 가 없거나 공백인 경우
     * @throws com.coresolution.consultation.exception.ValidationException 필수값 누락
     */
    PartnerInstitutionResponse create(String tenantId, PartnerInstitutionCreateRequest request);

    /**
     * 기관 수정.
     *
     * @param tenantId 테넌트 ID
     * @param id 기관 ID
     * @param request 수정 요청
     * @return 수정된 기관
     * @throws IllegalStateException tenantId 가 없거나 공백인 경우
     * @throws com.coresolution.consultation.exception.EntityNotFoundException 기관 없음
     */
    PartnerInstitutionResponse update(String tenantId, Long id, PartnerInstitutionUpdateRequest request);
}
