package com.coresolution.core.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

/**
 * {@link TossSecretStartupValidator} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-30
 */
class TossSecretStartupValidatorTest {

    private static final String DUMMY_SECRET = "unit-test-dummy";

    @Test
    @DisplayName("시뮬레이션 모드 기본값: 시크릿 키 없이 기동")
    void simulationDefault_noSecret_passes() {
        MockEnvironment env = new MockEnvironment();

        assertThatCode(() -> new TossSecretStartupValidator(env).validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("시뮬레이션 모드 명시: 시크릿 키 없이 기동")
    void simulationTrue_noSecret_passes() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(TossSecretStartupValidator.PROP_TOSS_SIMULATION_MODE, "true");

        assertThatCode(() -> new TossSecretStartupValidator(env).validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("실결제 모드 + 시크릿 키 미설정: 기동 중단, 메시지에 env 이름만")
    void liveMode_noSecret_fails() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(TossSecretStartupValidator.PROP_TOSS_SIMULATION_MODE, "false")
                .withProperty(TossSecretStartupValidator.PROP_TOSS_SECRET_KEY, "");

        assertThatThrownBy(() -> new TossSecretStartupValidator(env).validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(TossSecretStartupValidator.ENV_PAYMENT_TOSS_SECRET_KEY);
    }

    @Test
    @DisplayName("실결제 모드 + 시크릿 키 설정: 기동")
    void liveMode_withSecret_passes() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(TossSecretStartupValidator.PROP_TOSS_SIMULATION_MODE, "false")
                .withProperty(TossSecretStartupValidator.PROP_TOSS_SECRET_KEY, DUMMY_SECRET);

        assertThatCode(() -> new TossSecretStartupValidator(env).validate()).doesNotThrowAnyException();
    }
}
