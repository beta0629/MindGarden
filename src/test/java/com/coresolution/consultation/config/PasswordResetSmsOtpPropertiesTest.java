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
 * {@link PasswordResetSmsOtpProperties} 기본값·바인딩·범위 검증.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
@DisplayName("PasswordResetSmsOtpProperties")
class PasswordResetSmsOtpPropertiesTest {

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
    @DisplayName("기본값 180/180/300")
    void defaultsAre180Challenge180Proof300() {
        PasswordResetSmsOtpProperties properties = new PasswordResetSmsOtpProperties();
        assertThat(properties.getOtpExpirySeconds())
            .isEqualTo(PasswordResetSmsOtpProperties.DEFAULT_OTP_EXPIRY_SECONDS);
        assertThat(properties.getOpaque().getChallengeTtlSeconds())
            .isEqualTo(PasswordResetSmsOtpProperties.DEFAULT_OTP_EXPIRY_SECONDS);
        assertThat(properties.getOpaque().getProofTtlSeconds())
            .isEqualTo(PasswordResetSmsOtpProperties.DEFAULT_PROOF_TTL_SECONDS);
        assertThat(PasswordResetSmsOtpProperties.DEFAULT_OTP_EXPIRY_SECONDS).isEqualTo(180L);
        assertThat(PasswordResetSmsOtpProperties.DEFAULT_PROOF_TTL_SECONDS).isEqualTo(300L);
        assertThat(validator.validate(properties)).isEmpty();
    }

    @Test
    @DisplayName("유효값 1200/1200/300 은 검증 통과")
    void validDevValuesPassValidation() {
        PasswordResetSmsOtpProperties properties = new PasswordResetSmsOtpProperties();
        properties.setOtpExpirySeconds(1200L);
        properties.getOpaque().setChallengeTtlSeconds(1200L);
        properties.getOpaque().setProofTtlSeconds(300L);
        assertThat(validator.validate(properties)).isEmpty();
        assertThat(properties.getOtpExpirySeconds()).isEqualTo(1200L);
        assertThat(properties.getOpaque().getChallengeTtlSeconds()).isEqualTo(1200L);
        assertThat(properties.getOpaque().getProofTtlSeconds()).isEqualTo(300L);
    }

    @ParameterizedTest
    @ValueSource(longs = {0L, -1L, 59L, 3601L, 99999L})
    @DisplayName("invalid otpExpirySeconds 는 ConstraintViolation")
    void invalidOtpExpiryFailsValidation(long invalidSeconds) {
        PasswordResetSmsOtpProperties properties = new PasswordResetSmsOtpProperties();
        properties.setOtpExpirySeconds(invalidSeconds);
        Set<ConstraintViolation<PasswordResetSmsOtpProperties>> violations =
            validator.validate(properties);
        assertThat(violations).isNotEmpty();
    }

    @ParameterizedTest
    @ValueSource(longs = {0L, -1L, 59L, 3601L})
    @DisplayName("invalid opaque challenge/proof TTL 는 ConstraintViolation")
    void invalidOpaqueTtlFailsValidation(long invalidSeconds) {
        PasswordResetSmsOtpProperties challengeInvalid = new PasswordResetSmsOtpProperties();
        challengeInvalid.getOpaque().setChallengeTtlSeconds(invalidSeconds);
        assertThat(validator.validate(challengeInvalid)).isNotEmpty();

        PasswordResetSmsOtpProperties proofInvalid = new PasswordResetSmsOtpProperties();
        proofInvalid.getOpaque().setProofTtlSeconds(invalidSeconds);
        assertThat(validator.validate(proofInvalid)).isNotEmpty();
    }

    @Test
    @DisplayName("yml 바인딩 — 기본값 180/180/300")
    void bindsDefaultsFromEmptyEnvironment() {
        new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(
                PropertyPlaceholderAutoConfiguration.class,
                ValidationAutoConfiguration.class))
            .withUserConfiguration(TestPasswordResetSmsOtpPropertiesConfig.class)
            .run(context -> {
                assertThat(context).hasNotFailed();
                assertThat(context).hasSingleBean(PasswordResetSmsOtpProperties.class);
                PasswordResetSmsOtpProperties bean =
                    context.getBean(PasswordResetSmsOtpProperties.class);
                assertThat(bean.getOtpExpirySeconds()).isEqualTo(180L);
                assertThat(bean.getOpaque().getChallengeTtlSeconds()).isEqualTo(180L);
                assertThat(bean.getOpaque().getProofTtlSeconds()).isEqualTo(300L);
            });
    }

    @Test
    @DisplayName("yml 바인딩 — .dev 1200/1200/300")
    void bindsDevProfileValues() {
        new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(
                PropertyPlaceholderAutoConfiguration.class,
                ValidationAutoConfiguration.class))
            .withUserConfiguration(TestPasswordResetSmsOtpPropertiesConfig.class)
            .withPropertyValues(
                "password-reset.otp-expiry-seconds=1200",
                "password-reset.opaque.challenge-ttl-seconds=1200",
                "password-reset.opaque.proof-ttl-seconds=300")
            .run(context -> {
                assertThat(context).hasNotFailed();
                PasswordResetSmsOtpProperties bean =
                    context.getBean(PasswordResetSmsOtpProperties.class);
                assertThat(bean.getOtpExpirySeconds()).isEqualTo(1200L);
                assertThat(bean.getOpaque().getChallengeTtlSeconds()).isEqualTo(1200L);
                assertThat(bean.getOpaque().getProofTtlSeconds()).isEqualTo(300L);
            });
    }

    @Test
    @DisplayName("yml 바인딩 — invalid 값은 컨텍스트 기동 실패")
    void invalidBindingFailsContext() {
        new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(
                PropertyPlaceholderAutoConfiguration.class,
                ValidationAutoConfiguration.class))
            .withUserConfiguration(TestPasswordResetSmsOtpPropertiesConfig.class)
            .withPropertyValues("password-reset.otp-expiry-seconds=0")
            .run(context -> assertThat(context).hasFailed());
    }

    @Configuration
    @EnableConfigurationProperties(PasswordResetSmsOtpProperties.class)
    static class TestPasswordResetSmsOtpPropertiesConfig {
    }
}
