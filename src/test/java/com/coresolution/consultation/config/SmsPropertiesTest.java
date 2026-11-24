package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

/**
 * {@link SmsProperties#isTestMode()} — profile=dev 강제 및 Environment null 안전.
 *
 * @author MindGarden
 * @since 2026-11-24
 */
@DisplayName("SmsProperties — dev 프로파일 테스트 모드 강제")
class SmsPropertiesTest {

    @Test
    @DisplayName("Environment null + setTestMode(false) → isTestMode=false (단위 테스트 호환)")
    void environmentNull_usesFieldOnly() {
        SmsProperties props = new SmsProperties();
        props.setTestMode(false);

        assertThat(props.isTestMode()).isFalse();
    }

    @Test
    @DisplayName("Environment null + setTestMode(true) → isTestMode=true")
    void environmentNull_testModeTrue() {
        SmsProperties props = new SmsProperties();
        props.setTestMode(true);

        assertThat(props.isTestMode()).isTrue();
    }

    @Test
    @DisplayName("profile=dev + setTestMode(false) → isTestMode=true (fail-safe)")
    void devProfile_forcesTestModeTrue() {
        Environment environment = mock(Environment.class);
        when(environment.acceptsProfiles(any(Profiles.class))).thenAnswer(invocation -> {
            Profiles profiles = invocation.getArgument(0);
            return profiles.matches(profile -> SmsProperties.DEV_PROFILE.equals(profile));
        });

        SmsProperties props = new SmsProperties();
        props.setEnvironment(environment);
        props.setTestMode(false);

        assertThat(props.isTestMode()).isTrue();
    }

    @Test
    @DisplayName("profile=prod + setTestMode(false) → isTestMode=false")
    void prodProfile_respectsFalse() {
        Environment environment = mock(Environment.class);
        when(environment.acceptsProfiles(any(Profiles.class))).thenAnswer(invocation -> {
            Profiles profiles = invocation.getArgument(0);
            return profiles.matches(profile -> "prod".equals(profile));
        });

        SmsProperties props = new SmsProperties();
        props.setEnvironment(environment);
        props.setTestMode(false);

        assertThat(props.isTestMode()).isFalse();
    }

    @Test
    @DisplayName("profile=prod + setTestMode(true) → isTestMode=true")
    void prodProfile_respectsTrue() {
        Environment environment = mock(Environment.class);
        when(environment.acceptsProfiles(any(Profiles.class))).thenAnswer(invocation -> {
            Profiles profiles = invocation.getArgument(0);
            return profiles.matches(profile -> "prod".equals(profile));
        });

        SmsProperties props = new SmsProperties();
        props.setEnvironment(environment);
        props.setTestMode(true);

        assertThat(props.isTestMode()).isTrue();
    }

    @Test
    @DisplayName("profile=dev 이면 isProductionMode=false (enabled=true 여도)")
    void devProfile_blocksProductionMode() {
        Environment environment = mock(Environment.class);
        when(environment.acceptsProfiles(any(Profiles.class))).thenAnswer(invocation -> {
            Profiles profiles = invocation.getArgument(0);
            return profiles.matches(profile -> SmsProperties.DEV_PROFILE.equals(profile));
        });

        SmsProperties props = new SmsProperties();
        props.setEnvironment(environment);
        props.setEnabled(true);
        props.setTestMode(false);

        assertThat(props.isProductionMode()).isFalse();
    }
}
