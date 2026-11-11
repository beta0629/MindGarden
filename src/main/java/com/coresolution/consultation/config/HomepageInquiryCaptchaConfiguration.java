package com.coresolution.consultation.config;

import com.coresolution.core.security.CaptchaVerifier;
import com.coresolution.core.security.NoOpCaptchaVerifier;
import com.coresolution.core.security.TurnstileCaptchaVerifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

/**
 * 홈페이지 문의 전용 Turnstile 빈. 로그인/온보딩 {@code captchaVerifier} 와 분리한다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Slf4j
@Configuration
public class HomepageInquiryCaptchaConfiguration {

    /**
     * 홈페이지 문의 CAPTCHA 검증기.
     *
     * <p>enabled=false → no-op. enabled=true 이고 secret 있으면 Turnstile.
     * enabled=true 이고 secret 비어 있으면 no-op 빈을 두되, 서비스가 properties 로 fail-closed(503) 한다
     * (시크릿 값을 로그하지 않음).
     *
     * @param properties 홈페이지 문의 설정
     * @param restTemplate HTTP 클라이언트
     * @return 검증기
     */
    @Bean(name = "homepageInquiryCaptchaVerifier")
    public CaptchaVerifier homepageInquiryCaptchaVerifier(
            HomepageInquiryProperties properties,
            RestTemplate restTemplate) {
        HomepageInquiryProperties.Captcha captcha = properties.getCaptcha();
        if (captcha == null || !captcha.isEnabled()) {
            log.info("homepage-inquiry captcha disabled — using no-op verifier");
            return new NoOpCaptchaVerifier();
        }
        if (!StringUtils.hasText(captcha.getSecretKey())) {
            log.warn(
                    "mindgarden.homepage-inquiry.captcha.enabled=true 이지만 secret key 가 비어 있습니다. "
                            + "공개 문의 POST 는 fail-closed(503) 됩니다. "
                            + "환경 변수 MINDGARDEN_HOMEPAGE_CAPTCHA_SECRET_KEY 를 설정하세요.");
            return new NoOpCaptchaVerifier();
        }
        return new TurnstileCaptchaVerifier(restTemplate, captcha.getSecretKey().trim());
    }
}
