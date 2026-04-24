package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.TenantSmsEffectiveCredentials;
import com.coresolution.consultation.dto.TenantSmsSettingsResponse;
import com.coresolution.consultation.dto.TenantSmsSettingsUpdateRequest;

/**
 * 테넌트별 SMS 비시크릿 설정 조회·저장 및 발송용 자격 증명 결정.
 *
 * @author CoreSolution
 * @since 2026-04-25
 */
public interface TenantSmsSettingsService {

    /**
     * 화면/API용 효과적 설정. DB 행이 없으면 sms_enabled true, 나머지 null.
     *
     * @param tenantId 테넌트 ID
     * @return 응답 DTO
     */
    TenantSmsSettingsResponse getEffectiveSettings(String tenantId);

    /**
     * 설정 upsert (tenant_id 스코프 단일 행).
     *
     * @param tenantId 테넌트 ID
     * @param request  요청
     * @return 저장 후 효과적 설정
     */
    TenantSmsSettingsResponse upsert(String tenantId, TenantSmsSettingsUpdateRequest request);

    /**
     * 테넌트 SMS 채널 사용 여부. 행이 없으면 true(전역 설정 상속).
     *
     * @param tenantId 테넌트 ID(null이면 true)
     * @return 비활성 시 false
     */
    boolean isSmsEnabledForTenant(String tenantId);

    /**
     * 발송 시 사용할 자격 증명. DB·참조가 비어 있으면 {@code sms.auth} 바인딩 값.
     * 참조 문자열은 Spring {@code Environment} 또는 시스템 환경 변수로 조회한다.
     *
     * @param tenantId 테넌트 ID(null이면 전역만)
     * @return 효과적 자격 증명
     */
    TenantSmsEffectiveCredentials getEffectiveCredentials(String tenantId);
}
