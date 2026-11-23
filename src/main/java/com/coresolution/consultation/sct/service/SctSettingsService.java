package com.coresolution.consultation.sct.service;

import com.coresolution.consultation.sct.dto.SctSettingsResponse;
import com.coresolution.consultation.sct.dto.SctSettingsUpdateRequest;

/**
 * SCT 센터 설정(만료·보관). ADMIN만 변경.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctSettingsService {

    /**
     * @param tenantId 테넌트
     * @return 설정
     */
    SctSettingsResponse getSettings(String tenantId);

    /**
     * @param tenantId 테넌트
     * @param request  변경
     * @param actorId  변경자
     * @param actorRole 역할
     * @return 저장 결과
     */
    SctSettingsResponse updateSettings(
            String tenantId, SctSettingsUpdateRequest request, Long actorId, String actorRole);

    /**
     * 새 발송용 만료 일수(1~30).
     *
     * @param tenantId 테넌트
     * @return 일수
     */
    int resolveLinkExpiryDays(String tenantId);
}
