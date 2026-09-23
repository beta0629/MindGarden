package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 포트원(IAMPORT) PG 설정의 채널 키·테스트모드 부분 수정 요청.
 *
 * <p>전체 PUT({@link TenantPgConfigurationRequest})과 달리 승인 상태를 강등하지 않는다.
 * API: {@code PATCH .../pg-configurations/{configId}/portone-settings}</p>
 *
 * @author MindGarden
 * @since 2026-09-17
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantPgPortoneSettingsUpdateRequest {

    /**
     * 테스트 모드 여부. null 이면 기존 값 유지.
     */
    private Boolean testMode;

    /**
     * 포트원 V2 라이브(운영) 채널 키.
     * null = 변경 없음, 빈 문자열 = 키 제거.
     */
    private String portoneChannelKey;

    /**
     * 포트원 V2 테스트 채널 키.
     * null = 변경 없음, 빈 문자열 = 키 제거.
     */
    private String portoneChannelKeyTest;

    /**
     * 포트원 V2 웹훅 시크릿.
     * null = 변경 없음, 빈 문자열 = 키 제거.
     */
    private String portoneWebhookSecret;
}
