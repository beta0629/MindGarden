package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.InstitutionLinkContractCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkContractResponse;

/**
 * 타기관 연계 등록 서비스. 회기권 매핑 테이블에 쓰지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public interface InstitutionLinkContractService {

    /**
     * 테넌트 타기관 연계 목록.
     *
     * @param tenantId 테넌트 ID
     * @return 계약 목록
     * @throws IllegalStateException tenantId 가 없거나 공백인 경우
     */
    List<InstitutionLinkContractResponse> list(String tenantId);

    /**
     * 타기관 연계를 신규 저장한다. remainingSessions 를 요구하지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param request 생성 요청
     * @return 저장된 계약
     * @throws IllegalStateException tenantId 가 없거나 공백인 경우
     * @throws com.coresolution.consultation.exception.ValidationException 필수값 누락
     */
    InstitutionLinkContractResponse create(String tenantId, InstitutionLinkContractCreateRequest request);
}
