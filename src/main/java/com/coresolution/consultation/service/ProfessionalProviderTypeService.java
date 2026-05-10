package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.ResolvedProfessionalRegistration;

/**
 * 전문가 등록 시 테넌트 {@code PROFESSIONAL_PROVIDER_TYPE} 공통코드 검증·역할 결정.
 *
 * @author CoreSolution
 * @since 2026-05-10
 */
public interface ProfessionalProviderTypeService {

    /**
     * 상담사(전문가) 등록·수정에 사용할 유형 코드와 저장할 사용자 역할을 결정합니다.
     *
     * @param tenantId 테넌트 ID
     * @param requestedProfessionalTypeCode 요청 유형 코드(공백이면 기본 유형 또는 레거시 role로 보완)
     * @param legacyRoleField {@link com.coresolution.consultation.dto.ConsultantRegistrationRequest#getRole()} 등 레거시 문자열
     * @return 결정된 유형 코드와 사용자 역할
     */
    ResolvedProfessionalRegistration resolve(String tenantId, String requestedProfessionalTypeCode,
            String legacyRoleField);
}
