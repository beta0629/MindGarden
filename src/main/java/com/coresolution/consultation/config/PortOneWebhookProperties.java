package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Data;

import com.coresolution.consultation.service.portone.PortOneWebhookSignatureVerifier;

/**
 * 포트원 V2 웹훅 서명 검증 설정.
 * <p>
 * 허용 오차 기본값은 {@link PortOneWebhookSignatureVerifier#DEFAULT_TOLERANCE_SECONDS}
 * (Standard Webhooks / 포트원 server-sdk 5분) 이다.
 * {@code mindgarden.pg.portone.webhook.tolerance-seconds}
 * 또는 {@code MINDGARDEN_PG_PORTONE_WEBHOOK_TOLERANCE_SECONDS} 로 덮어쓴다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-10-15
 */
@Data
@ConfigurationProperties(prefix = "mindgarden.pg.portone.webhook")
public class PortOneWebhookProperties {

    /**
     * 웹훅 타임스탬프 허용 오차(초). 음수이면 검증기가 기본값으로 되돌린다.
     */
    private int toleranceSeconds = PortOneWebhookSignatureVerifier.DEFAULT_TOLERANCE_SECONDS;
}
