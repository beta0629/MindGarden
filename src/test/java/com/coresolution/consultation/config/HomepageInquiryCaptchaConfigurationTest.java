package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.core.security.CaptchaVerifier;
import com.coresolution.core.security.NoOpCaptchaVerifier;
import com.coresolution.core.security.TurnstileCaptchaVerifier;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

/**
 * 홈페이지 문의 전용 captcha 빈 선택 규칙.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
class HomepageInquiryCaptchaConfigurationTest {

    private final HomepageInquiryCaptchaConfiguration configuration = new HomepageInquiryCaptchaConfiguration();

    @Test
    void disabled_usesNoOp() {
        HomepageInquiryProperties properties = new HomepageInquiryProperties();
        properties.getCaptcha().setEnabled(false);
        CaptchaVerifier verifier = configuration.homepageInquiryCaptchaVerifier(properties, new RestTemplate());
        assertThat(verifier).isInstanceOf(NoOpCaptchaVerifier.class);
    }

    @Test
    void enabledWithSecret_usesTurnstile() {
        HomepageInquiryProperties properties = new HomepageInquiryProperties();
        properties.getCaptcha().setEnabled(true);
        properties.getCaptcha().setSecretKey("1x0000000000000000000000000000000AA");
        CaptchaVerifier verifier = configuration.homepageInquiryCaptchaVerifier(properties, new RestTemplate());
        assertThat(verifier).isInstanceOf(TurnstileCaptchaVerifier.class);
        assertThat(verifier.requiresCaptchaToken()).isTrue();
    }

    @Test
    void enabledWithoutSecret_returnsNoOpBean_serviceFailsClosedSeparately() {
        HomepageInquiryProperties properties = new HomepageInquiryProperties();
        properties.getCaptcha().setEnabled(true);
        properties.getCaptcha().setSecretKey("");
        CaptchaVerifier verifier = configuration.homepageInquiryCaptchaVerifier(properties, new RestTemplate());
        assertThat(verifier).isInstanceOf(NoOpCaptchaVerifier.class);
    }
}
