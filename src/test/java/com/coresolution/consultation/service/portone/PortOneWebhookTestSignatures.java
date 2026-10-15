package com.coresolution.consultation.service.portone;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.coresolution.consultation.config.PortOneWebhookProperties;

/**
 * 포트원 V2 웹훅 테스트용 서명. Standard Webhooks 와 같이
 * {@code webhook-id.webhook-timestamp.body} 를 Base64 디코드한 시크릿 키로 HMAC-SHA256 한다.
 * 라벨은 테스트 식별자일 뿐 운영 시크릿이 아니다.
 *
 * @author CoreSolution
 * @since 2026-10-15
 */
public final class PortOneWebhookTestSignatures {

    private PortOneWebhookTestSignatures() {
    }

    /**
     * @return 기본 허용 오차(5분)를 쓰는 설정
     */
    public static PortOneWebhookProperties properties() {
        return new PortOneWebhookProperties();
    }

    /**
     * @param label 테스트 식별 문자열
     * @return {@code whsec_} + Base64(label)
     */
    public static String secretForLabel(String label) {
        String encoded = Base64.getEncoder().encodeToString(label.getBytes(StandardCharsets.UTF_8));
        return PortOneWebhookSignatureVerifier.SECRET_PREFIX + encoded;
    }

    /**
     * @return 현재 unix 초
     */
    public static String currentTimestamp() {
        return Long.toString(Instant.now().getEpochSecond());
    }

    /**
     * @param secret    {@link #secretForLabel(String)} 형식
     * @param webhookId webhook-id
     * @param timestamp webhook-timestamp (unix 초 문자열)
     * @param body      원시 바디
     * @return {@code v1,<base64>} 서명
     */
    public static String v1(String secret, String webhookId, String timestamp, String body) throws Exception {
        String material = secret.startsWith(PortOneWebhookSignatureVerifier.SECRET_PREFIX)
                ? secret.substring(PortOneWebhookSignatureVerifier.SECRET_PREFIX.length())
                : secret;
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(Base64.getDecoder().decode(material), "HmacSHA256"));
        String signedContent = webhookId + "." + timestamp + "." + body;
        byte[] digest = mac.doFinal(signedContent.getBytes(StandardCharsets.UTF_8));
        return PortOneWebhookSignatureVerifier.SIGNATURE_VERSION_V1 + ","
                + Base64.getEncoder().encodeToString(digest);
    }
}
