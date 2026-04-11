package com.coresolution.consultation.config;

import com.coresolution.core.security.CaptchaVerifier;
import com.coresolution.core.security.NoOpCaptchaVerifier;
import com.coresolution.core.security.TurnstileCaptchaVerifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

/**
 * CAPTCHA 검증 빈 등록. {@code mindgarden.security.captcha.enabled} 와 시크릿 키 유무에 따라 no-op 또는 Turnstile 구현을 선택한다.
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
@Slf4j
@Configuration
public class CaptchaConfiguration {

    /**
     * 기본 CAPTCHA 검증기. 비활성화이거나 시크릿이 비어 있으면 no-op.
     *
     * @param securityProperties 보안 설정
     * @param restTemplate 공용 HTTP 클라이언트
     * @return 검증기 구현
     */
    @Bean
    public CaptchaVerifier captchaVerifier(
            MindgardenSecurityProperties securityProperties,
            RestTemplate restTemplate) {
        MindgardenSecurityProperties.Captcha captcha = securityProperties.getCaptcha();
        if (!captcha.isEnabled()) {
            return new NoOpCaptchaVerifier();
        }
        if (!StringUtils.hasText(captcha.getSecretKey())) {
            log.warn(
                "mindgarden.security.captcha.enabled=true 이지만 secret key 가 비어 있어 CAPTCHA 검증을 생략합니다(no-op). "
                    + "환경 변수 MINDGARDEN_CAPTCHA_SECRET_KEY 등으로 시크릿을 설정하세요.");
            return new NoOpCaptchaVerifier();
        }
        return new TurnstileCaptchaVerifier(restTemplate, captcha.getSecretKey().trim());
    }
}
