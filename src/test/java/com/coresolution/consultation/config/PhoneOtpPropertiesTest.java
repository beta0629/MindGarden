package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.PropertyPlaceholderAutoConfiguration;
import org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

/**
 * {@link PhoneOtpProperties} 기본값·바인딩·범위 검증.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
@DisplayName("PhoneOtpProperties")
class PhoneOtpPropertiesTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void tearDownValidator() {
        if (validatorFactory != null) {
            validatorFactory.close();
        }
    }

    @Test
    @DisplayName("기본 expirySeconds 는 180")
    void defaultExpirySecondsIs180() {
        PhoneOtpProperties properties = new PhoneOtpProperties();
        assertThat(properties.getExpirySeconds()).isEqualTo(PhoneOtpProperties.DEFAULT_EXPIRY_SECONDS);
        assertThat(PhoneOtpProperties.DEFAULT_EXPIRY_SECONDS).isEqualTo(180L);
        assertThat(validator.validate(properties)).isEmpty();
    }

    @Test
    @DisplayName("유효값 1200 은 검증 통과")
    void valid1200PassesValidation() {
        PhoneOtpProperties properties = new PhoneOtpProperties();
        properties.setExpirySeconds(1200L);
        assertThat(validator.validate(properties)).isEmpty();
        assertThat(properties.getExpirySeconds()).isEqualTo(1200L);
    }

    @ParameterizedTest
    @ValueSource(longs = {0L, -1L, 59L, 3601L, 99999L})
    @DisplayName("invalid expirySeconds 는 ConstraintViolation")
    void invalidExpirySecondsFailsValidation(long invalidSeconds) {
        PhoneOtpProperties properties = new PhoneOtpProperties();
        properties.setExpirySeconds(invalidSeconds);
        Set<ConstraintViolation<PhoneOtpProperties>> violations = validator.validate(properties);
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("yml 바인딩 — 기본값 180")
    void bindsDefaultFromEmptyEnvironment() {
        new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(
                PropertyPlaceholderAutoConfiguration.class,
                ValidationAutoConfiguration.class))
            .withUserConfiguration(TestPhoneOtpPropertiesConfig.class)
            .run(context -> {
                assertThat(context).hasNotFailed();
                assertThat(context).hasSingleBean(PhoneOtpProperties.class);
                assertThat(context.getBean(PhoneOtpProperties.class).getExpirySeconds())
                    .isEqualTo(180L);
            });
    }

    @Test
    @DisplayName("yml 바인딩 — 1200 적용")
    void binds1200FromEnvironment() {
        new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(
                PropertyPlaceholderAutoConfiguration.class,
                ValidationAutoConfiguration.class))
            .withUserConfiguration(TestPhoneOtpPropertiesConfig.class)
            .withPropertyValues("mindgarden.otp.phone.expiry-seconds=1200")
            .run(context -> {
                assertThat(context).hasNotFailed();
                assertThat(context.getBean(PhoneOtpProperties.class).getExpirySeconds())
                    .isEqualTo(1200L);
            });
    }

    @Test
    @DisplayName("yml 바인딩 — invalid 값은 컨텍스트 기동 실패")
    void invalidBindingFailsContext() {
        new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(
                PropertyPlaceholderAutoConfiguration.class,
                ValidationAutoConfiguration.class))
            .withUserConfiguration(TestPhoneOtpPropertiesConfig.class)
            .withPropertyValues("mindgarden.otp.phone.expiry-seconds=0")
            .run(context -> assertThat(context).hasFailed());
    }

    @Configuration
    @EnableConfigurationProperties(PhoneOtpProperties.class)
    static class TestPhoneOtpPropertiesConfig {
    }
}
