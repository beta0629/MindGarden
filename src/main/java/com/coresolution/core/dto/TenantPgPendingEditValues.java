package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PG 대기 수정(pending) vs live 비교용 마스킹 스냅샷.
 * 시크릿 평문·암호문 값은 포함하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantPgPendingEditValues {

    /**
     * PG 제공자 (예: TOSS, IAMPORT)
     */
    private String provider;

    /**
     * 마스킹된 Store ID
     */
    private String storeId;

    /**
     * 마스킹된 Merchant ID
     */
    private String merchantId;

    /**
     * 라이브 채널 키 마스킹 값 ({@code SecretValueMasking} — 끝 4자리만 노출)
     */
    private String channelKeyMasked;

    /**
     * 테스트 채널 키 마스킹 값 ({@code SecretValueMasking} — 끝 4자리만 노출)
     */
    private String channelKeyTestMasked;

    /**
     * 마스킹된 Webhook URL (host+path 평문, query/fragment 마스킹)
     */
    private String webhookUrl;

    /**
     * 마스킹된 Return URL
     */
    private String returnUrl;

    /**
     * 마스킹된 Cancel URL
     */
    private String cancelUrl;
}
