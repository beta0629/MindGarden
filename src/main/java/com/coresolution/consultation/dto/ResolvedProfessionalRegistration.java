package com.coresolution.consultation.dto;

import com.coresolution.consultation.constant.UserRole;

/**
 * 전문가 유형 공통코드와 저장할 {@link UserRole} 결정 결과.
 *
 * @param professionalProviderTypeCode {@code users.professional_provider_type_code}
 * @param userRole {@code users.role}
 * @author CoreSolution
 * @since 2026-05-10
 */
public record ResolvedProfessionalRegistration(String professionalProviderTypeCode, UserRole userRole) {
}
