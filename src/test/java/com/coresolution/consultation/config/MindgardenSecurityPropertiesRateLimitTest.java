package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

/**
 * {@link MindgardenSecurityProperties.RateLimit} 기본값 및 YAML 바인딩 검증.
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
class MindgardenSecurityPropertiesRateLimitTest {

    @Test
    void defaultOnboardingCreateRateLimitValues() {
        MindgardenSecurityProperties.RateLimit rateLimit = new MindgardenSecurityProperties.RateLimit();
        assertThat(rateLimit.getOnboardingCreateRequestsPerMinute()).isEqualTo(5);
        assertThat(rateLimit.getOnboardingCreatePath()).isEqualTo("/api/v1/onboarding/requests");
    }

    @Test
    void bindsOnboardingCreatePropertiesFromEnvironment() {
        ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(TestMindgardenSecurityPropertiesConfig.class)
            .withPropertyValues(
                "mindgarden.security.rate-limit.onboarding-create-requests-per-minute=7",
                "mindgarden.security.rate-limit.onboarding-create-path=/custom/onboarding/requests");

        runner.run(context -> {
            assertThat(context).hasSingleBean(MindgardenSecurityProperties.class);
            MindgardenSecurityProperties props = context.getBean(MindgardenSecurityProperties.class);
            assertThat(props.getRateLimit().getOnboardingCreateRequestsPerMinute()).isEqualTo(7);
            assertThat(props.getRateLimit().getOnboardingCreatePath()).isEqualTo("/custom/onboarding/requests");
        });
    }

    @Configuration
    @EnableConfigurationProperties(MindgardenSecurityProperties.class)
    static class TestMindgardenSecurityPropertiesConfig {
    }
}
