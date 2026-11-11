package com.coresolution.core.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

/**
 * Cloudflare Turnstile 공개 테스트 시크릿으로 siteverify 동작을 검증한다.
 *
 * <p>always-pass {@code 1x0000...AA} / always-fail {@code 2x0000...AA} 만 사용(문서화된 테스트 키).
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
class HomepageInquiryTurnstileTestSecretsTest {

    private static final String ALWAYS_PASS = "1x0000000000000000000000000000000AA";
    private static final String ALWAYS_FAIL = "2x0000000000000000000000000000000AA";

    @Test
    void alwaysPassSecret_acceptsDummyToken() {
        TurnstileCaptchaVerifier verifier = new TurnstileCaptchaVerifier(new RestTemplate(), ALWAYS_PASS);
        assertThat(verifier.requiresCaptchaToken()).isTrue();
        assertThat(verifier.verify("XXXX.DUMMY.TOKEN.XXXX", "127.0.0.1")).isTrue();
    }

    @Test
    void alwaysFailSecret_rejectsDummyToken() {
        TurnstileCaptchaVerifier verifier = new TurnstileCaptchaVerifier(new RestTemplate(), ALWAYS_FAIL);
        assertThat(verifier.verify("XXXX.DUMMY.TOKEN.XXXX", "127.0.0.1")).isFalse();
    }
}
