package com.coresolution.consultation.controller;

import java.util.Map;
import com.coresolution.consultation.service.portone.PortOnePaymentWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 포트원 결제모듈 V2 웹훅 수신 (인증 없음, 원시 바디 기준 서명 검증).
 *
 * @author CoreSolution
 * @since 2026-04-15
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PortOnePaymentWebhookController {

    private final PortOnePaymentWebhookService portOnePaymentWebhookService;

    /**
     * 포트원 콘솔 Webhook URL: {@code POST /api/v1/payments/webhooks/portone/v2}
     * Content-Type: application/json, Version 2024-04-25
     */
    @PostMapping(value = "/webhooks/portone/v2", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> receivePortOneV2Webhook(
            @RequestBody byte[] rawBody,
            @RequestHeader(value = "webhook-timestamp", required = false) String webhookTimestamp,
            @RequestHeader(value = "webhook-signature", required = false) String webhookSignature,
            @RequestHeader(value = "webhook-id", required = false) String webhookId) {
        return portOnePaymentWebhookService.handleWebhook(rawBody, webhookTimestamp, webhookSignature, webhookId);
    }
}
