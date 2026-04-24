package com.coresolution.consultation.dto;

/**
 * 발송 시점에 결정된 SMS 자격 증명(로그·API 응답에 포함하지 않음).
 *
 * @param provider     프로바이더 식별자
 * @param apiKey       API 키 또는 NHN 서비스 ID 등
 * @param apiSecret    API 시크릿
 * @param senderNumber 발신 번호
 * @author CoreSolution
 * @since 2026-04-25
 */
public record TenantSmsEffectiveCredentials(
    String provider,
    String apiKey,
    String apiSecret,
    String senderNumber
) {
}
