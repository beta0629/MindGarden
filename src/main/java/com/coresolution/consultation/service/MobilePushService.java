package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.MobilePushPlatform;
import com.coresolution.consultation.dto.mobilepush.MobilePushSettingsPatchRequest;
import com.coresolution.consultation.dto.mobilepush.MobilePushSettingsPayload;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * 모바일 푸시 토큰·설정(Expo PUSH_API).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public interface MobilePushService {

    /**
     * 토큰 등록 또는 갱신(멱등).
     *
     * @param tenantId 신뢰된 테넌트 ID
     * @param userId 신뢰된 사용자 PK
     * @param rawToken 원문 토큰
     * @param platform 플랫폼
     * @param deviceInfo 선택 JSON
     */
    void registerToken(String tenantId, Long userId, String rawToken, MobilePushPlatform platform, JsonNode deviceInfo);

    /**
     * 토큰 해제(멱등).
     *
     * @param tenantId 테넌트 ID
     * @param userId 사용자 PK
     * @param rawToken 원문 토큰
     */
    void unregisterToken(String tenantId, Long userId, String rawToken);

    /**
     * 설정 조회 — 없으면 기본 true.
     *
     * @param tenantId 테넌트 ID
     * @param userId 사용자 PK
     * @return 설정 페이로드
     */
    MobilePushSettingsPayload getSettings(String tenantId, Long userId);

    /**
     * 설정 부분 갱신 후 병합 결과 반환.
     *
     * @param tenantId 테넌트 ID
     * @param userId 사용자 PK
     * @param patch null 필드 무시
     * @return 갱신 후 전체 스냅샷
     */
    MobilePushSettingsPayload patchSettings(String tenantId, Long userId, MobilePushSettingsPatchRequest patch);
}
