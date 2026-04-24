package com.coresolution.consultation.service;

import java.util.Optional;
import com.coresolution.consultation.dto.TenantKakaoAlimtalkSettingsResponse;
import com.coresolution.consultation.dto.TenantKakaoAlimtalkSettingsUpdateRequest;
import com.coresolution.consultation.service.NotificationService.NotificationType;

/**
 * 테넌트별 카카오 알림톡 비시크릿 설정 조회·저장.
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
public interface TenantKakaoAlimtalkSettingsService {

    /**
     * 화면/API용 효과적 설정. DB 행이 없으면 기본값(알림톡 허용, 템플릿·ref null).
     *
     * @param tenantId 테넌트 ID
     * @return 응답 DTO
     */
    TenantKakaoAlimtalkSettingsResponse getEffectiveSettings(String tenantId);

    /**
     * 설정 upsert (tenant_id 스코프 단일 행).
     *
     * @param tenantId 테넌트 ID
     * @param request  요청
     * @return 저장 후 효과적 설정
     */
    TenantKakaoAlimtalkSettingsResponse upsert(String tenantId, TenantKakaoAlimtalkSettingsUpdateRequest request);

    /**
     * 테넌트 알림톡 채널 사용 여부. 행이 없으면 true(전역·공통코드 경로 상속).
     *
     * @param tenantId 테넌트 ID
     * @return 비활성 시 false
     */
    boolean isAlimTalkEnabledForTenant(String tenantId);

    /**
     * DB에만 있는 비즈 템플릿 코드 오버라이드(비어있지 않은 컬럼).
     *
     * @param tenantId 테넌트 ID
     * @param type     알림 유형
     * @return 있으면 코드
     */
    Optional<String> findBizTemplateCodeOverride(String tenantId, NotificationType type);
}
