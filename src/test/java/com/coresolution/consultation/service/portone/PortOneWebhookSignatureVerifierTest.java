package com.coresolution.consultation.service.portone;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 포트원 V2 웹훅 서명 검증 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-04-15
 */
class PortOneWebhookSignatureVerifierTest {

    @Test
    void isValid_acceptsMatchingV1Signature() throws Exception {
        String secret = "whsec_unit_test_secret";
        String timestamp = "1700000000";
        String rawBody = "{\"type\":\"Transaction.Paid\",\"data\":{}}";
        String message = timestamp + "." + rawBody;
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] digest = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        String header = "v1," + Base64.getEncoder().encodeToString(digest);

        assertTrue(PortOneWebhookSignatureVerifier.isValid(rawBody, timestamp, header, secret));
    }

    @Test
    void isValid_rejectsWrongSecret() throws Exception {
        String secret = "whsec_unit_test_secret";
        String timestamp = "1700000000";
        String rawBody = "{}";
        String message = timestamp + "." + rawBody;
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] digest = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        String header = "v1," + Base64.getEncoder().encodeToString(digest);

        assertFalse(PortOneWebhookSignatureVerifier.isValid(rawBody, timestamp, header, "other_secret"));
    }
}
