package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

/**
 * {@link MindgardenSecurityProperties.Captcha} 기본값 및 바인딩 검증.
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
class MindgardenSecurityPropertiesCaptchaTest {

    @Test
    void defaultCaptchaDisabledAndEmptyKeys() {
        MindgardenSecurityProperties.Captcha captcha = new MindgardenSecurityProperties.Captcha();
        assertThat(captcha.isEnabled()).isFalse();
        assertThat(captcha.getSecretKey()).isEmpty();
        assertThat(captcha.getSiteKey()).isEmpty();
    }

    @Test
    void bindsCaptchaFromEnvironment() {
        ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(TestMindgardenSecurityPropertiesConfig.class)
            .withPropertyValues(
                "mindgarden.security.captcha.enabled=true",
                "mindgarden.security.captcha.secret-key=env-secret",
                "mindgarden.security.captcha.site-key=env-site");

        runner.run(context -> {
            assertThat(context).hasSingleBean(MindgardenSecurityProperties.class);
            MindgardenSecurityProperties props = context.getBean(MindgardenSecurityProperties.class);
            assertThat(props.getCaptcha().isEnabled()).isTrue();
            assertThat(props.getCaptcha().getSecretKey()).isEqualTo("env-secret");
            assertThat(props.getCaptcha().getSiteKey()).isEqualTo("env-site");
        });
    }

    @Configuration
    @EnableConfigurationProperties(MindgardenSecurityProperties.class)
    static class TestMindgardenSecurityPropertiesConfig {
    }
}
