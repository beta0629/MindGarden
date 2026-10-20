package com.coresolution.consultation.service.portone;

import java.time.Instant;
import java.util.Base64;
import java.util.Random;
import com.coresolution.consultation.config.PortOneWebhookProperties;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 포트원 V2 웹훅 서명 검증 단위 테스트.
 * <p>
 * 회귀 벡터는 Standard Webhooks Java {@code TestScenario.validSigned()}
 * (포트원 server-sdk 가 따르는 공개 예시) 이다. 운영 시크릿이 아니다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-15
 */
class PortOneWebhookSignatureVerifierTest {

    /**
     * Public Standard Webhooks example vector
     * ({@code TestScenario.validSigned()}), not an environment or production secret.
     * https://github.com/standard-webhooks/standard-webhooks/blob/main/libraries/java/src/test/java/com/standardwebhooks/TestScenario.java
     */
    private static final String SPEC_SECRET = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";

    private static final String SPEC_SECRET_UNPREFIXED = "MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";

    private static final String SPEC_ID = "msg_p5jXN8AQM9LWM0D4loKWxJek";

    private static final String SPEC_TIMESTAMP = "1614265330";

    private static final String SPEC_PAYLOAD = "{\"test\": 2432232314}";

    private static final String SPEC_SIGNATURE = "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=";

    /** 포트원 server-sdk {@code webhook.test.ts} 의 불일치 시그니처. */
    private static final String UNRELATED_V1 = "v1,Ceo5qEr07ixe2NLpvHk3FH9bwy/WavXrAFQ/9tdO6mc=";

    private static final Instant SPEC_INSTANT = Instant.ofEpochSecond(Long.parseLong(SPEC_TIMESTAMP));

    @Test
    void defaultToleranceIsFiveMinutesAndPropertiesUseIt() {
        assertEquals(5 * 60, PortOneWebhookSignatureVerifier.DEFAULT_TOLERANCE_SECONDS);
        assertEquals(
                PortOneWebhookSignatureVerifier.DEFAULT_TOLERANCE_SECONDS,
                new PortOneWebhookProperties().getToleranceSeconds());
    }

    @Test
    void isValid_acceptsStandardWebhooksSpecVector() {
        assertTrue(verify(SPEC_SIGNATURE, SPEC_SECRET, SPEC_INSTANT));
        assertTrue(verify(SPEC_SIGNATURE, SPEC_SECRET_UNPREFIXED, SPEC_INSTANT));
        Instant atToleranceEdge = SPEC_INSTANT.plusSeconds(
                PortOneWebhookSignatureVerifier.DEFAULT_TOLERANCE_SECONDS);
        assertTrue(verify(SPEC_SIGNATURE, SPEC_SECRET, atToleranceEdge));
    }

    @Test
    void isValid_acceptsWhenAnySpaceSeparatedV1SignatureMatches() {
        String header = UNRELATED_V1
                + " v2,Ceo5qEr07ixe2NLpvHk3FH9bwy/WavXrAFQ/9tdO6mc= "
                + SPEC_SIGNATURE
                + " "
                + UNRELATED_V1;
        assertTrue(verify(header, SPEC_SECRET, SPEC_INSTANT));
        assertFalse(verify(UNRELATED_V1 + " v2,Ceo5qEr07ixe2NLpvHk3FH9bwy/WavXrAFQ/9tdO6mc=",
                SPEC_SECRET, SPEC_INSTANT));
    }

    @Test
    void isValid_rejectsTimestampOutsideTolerance() {
        Instant expired = SPEC_INSTANT.plusSeconds(
                PortOneWebhookSignatureVerifier.DEFAULT_TOLERANCE_SECONDS + 1L);
        assertFalse(verify(SPEC_SIGNATURE, SPEC_SECRET, expired));

        Instant tooNew = SPEC_INSTANT.minusSeconds(
                PortOneWebhookSignatureVerifier.DEFAULT_TOLERANCE_SECONDS + 1L);
        assertFalse(verify(SPEC_SIGNATURE, SPEC_SECRET, tooNew));
    }

    @Test
    void isValid_rejectsWrongOrNonBase64Secret() {
        assertFalse(verify(SPEC_SIGNATURE, "whsec_AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI=", SPEC_INSTANT));
        assertFalse(verify(SPEC_SIGNATURE, "whsec_unit_test_secret", SPEC_INSTANT));
    }

    @Test
    void isWhsecPrefixedBase64_acceptsPrefixedStandardBase64() {
        assertTrue(PortOneWebhookSignatureVerifier.isWhsecPrefixedBase64("  " + SPEC_SECRET + "  "));
        byte[] material = new byte[16];
        new Random(94L).nextBytes(material);
        String generated = "whsec_" + Base64.getEncoder().encodeToString(material);
        assertTrue(PortOneWebhookSignatureVerifier.isWhsecPrefixedBase64(generated));
    }

    @Test
    void isWhsecPrefixedBase64_rejectsMissingPrefix() {
        assertFalse(PortOneWebhookSignatureVerifier.isWhsecPrefixedBase64(SPEC_SECRET_UNPREFIXED));
        assertFalse(PortOneWebhookSignatureVerifier.isWhsecPrefixedBase64(" " + SPEC_SECRET_UNPREFIXED + " "));
        assertFalse(PortOneWebhookSignatureVerifier.isWhsecPrefixedBase64(null));
    }

    @Test
    void isWhsecPrefixedBase64_rejectsBase64DecodeFailure() {
        assertFalse(PortOneWebhookSignatureVerifier.isWhsecPrefixedBase64("whsec_"));
        assertFalse(PortOneWebhookSignatureVerifier.isWhsecPrefixedBase64("whsec_unit_test_secret"));
        assertFalse(PortOneWebhookSignatureVerifier.isWhsecPrefixedBase64("whsec_!!!!"));
    }

    @Test
    void isValid_rejectsMissingWebhookId() {
        assertFalse(PortOneWebhookSignatureVerifier.isValid(
                SPEC_PAYLOAD,
                "  ",
                SPEC_TIMESTAMP,
                SPEC_SIGNATURE,
                SPEC_SECRET,
                SPEC_INSTANT,
                PortOneWebhookSignatureVerifier.DEFAULT_TOLERANCE_SECONDS));
    }

    private static boolean verify(String signatureHeader, String secret, Instant now) {
        return PortOneWebhookSignatureVerifier.isValid(
                SPEC_PAYLOAD,
                SPEC_ID,
                SPEC_TIMESTAMP,
                signatureHeader,
                secret,
                now,
                PortOneWebhookSignatureVerifier.DEFAULT_TOLERANCE_SECONDS);
    }
}
