package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.core.security.CaptchaVerifier;
import com.coresolution.core.security.NoOpCaptchaVerifier;
import com.coresolution.core.security.TurnstileCaptchaVerifier;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.web.client.RestTemplate;

/**
 * {@link CaptchaConfiguration} 이 프로퍼티에 따라 no-op 또는 Turnstile 빈을 등록하는지 검증.
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
class CaptchaConfigurationTest {

    @Test
    void registersNoOpWhenCaptchaDisabled() {
        new ApplicationContextRunner()
            .withUserConfiguration(MinimalCaptchaTestConfig.class)
            .withPropertyValues("mindgarden.security.captcha.enabled=false")
            .run(context -> {
                CaptchaVerifier bean = context.getBean(CaptchaVerifier.class);
                assertThat(bean).isInstanceOf(NoOpCaptchaVerifier.class);
            });
    }

    @Test
    void registersNoOpWhenEnabledButSecretEmpty() {
        new ApplicationContextRunner()
            .withUserConfiguration(MinimalCaptchaTestConfig.class)
            .withPropertyValues(
                "mindgarden.security.captcha.enabled=true",
                "mindgarden.security.captcha.secret-key=")
            .run(context -> {
                CaptchaVerifier bean = context.getBean(CaptchaVerifier.class);
                assertThat(bean).isInstanceOf(NoOpCaptchaVerifier.class);
            });
    }

    @Test
    void registersTurnstileWhenEnabledAndSecretSet() {
        new ApplicationContextRunner()
            .withUserConfiguration(MinimalCaptchaTestConfig.class)
            .withPropertyValues(
                "mindgarden.security.captcha.enabled=true",
                "mindgarden.security.captcha.secret-key=turnstile-secret-value")
            .run(context -> {
                CaptchaVerifier bean = context.getBean(CaptchaVerifier.class);
                assertThat(bean).isInstanceOf(TurnstileCaptchaVerifier.class);
            });
    }

    @Configuration
    @Import(CaptchaConfiguration.class)
    @org.springframework.boot.context.properties.EnableConfigurationProperties(MindgardenSecurityProperties.class)
    static class MinimalCaptchaTestConfig {

        @Bean
        RestTemplate restTemplate() {
            return new RestTemplate();
        }
    }
}
