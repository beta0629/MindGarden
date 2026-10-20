package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicLong;
import com.coresolution.consultation.config.MindgardenSecurityProperties;
import com.coresolution.consultation.service.support.VerificationAttemptLimiter.Scope;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("VerificationAttemptLimiter")
class VerificationAttemptLimiterTest {

    private static final String KEY = "k@example.com";
    private static final long MINUTE_MS = 60_000L;

    private final MindgardenSecurityProperties properties = new MindgardenSecurityProperties();
    private final AtomicLong clock = new AtomicLong(1_000_000L);
    private final VerificationAttemptLimiter limiter = new VerificationAttemptLimiter(properties, clock::get);

    @Test
    @DisplayName("한도 도달 시 잠기고 잠금 시간이 지나면 풀린다")
    void locksAtLimitAndUnlocksAfterDuration() {
        int max = properties.getAccountIntegration().getVerifyMaxAttemptsPerEmail();
        for (int i = 0; i < max - 1; i++) {
            assertThat(limiter.recordAttempt(Scope.VERIFY_EMAIL, KEY)).isFalse();
        }
        assertThat(limiter.recordAttempt(Scope.VERIFY_EMAIL, KEY)).isTrue();
        assertThat(limiter.isLocked(Scope.VERIFY_EMAIL, KEY)).isTrue();

        clock.addAndGet(properties.getAccountIntegration().getVerifyLockMinutes() * MINUTE_MS + 1);
        assertThat(limiter.isLocked(Scope.VERIFY_EMAIL, KEY)).isFalse();
        assertThat(limiter.recordAttempt(Scope.VERIFY_EMAIL, KEY)).isFalse();
    }

    @Test
    @DisplayName("reset 하면 카운터가 초기화된다")
    void resetClearsCounter() {
        int max = properties.getAccountIntegration().getVerifyMaxAttemptsPerEmail();
        for (int i = 0; i < max - 1; i++) {
            limiter.recordAttempt(Scope.VERIFY_EMAIL, KEY);
        }
        limiter.reset(Scope.VERIFY_EMAIL, KEY);
        assertThat(limiter.recordAttempt(Scope.VERIFY_EMAIL, KEY)).isFalse();
    }

    @Test
    @DisplayName("범위와 키가 다르면 서로 영향이 없고 null 키는 무시")
    void scopesAreIndependent() {
        int max = properties.getAccountIntegration().getVerifyMaxAttemptsPerEmail();
        for (int i = 0; i < max; i++) {
            limiter.recordAttempt(Scope.VERIFY_EMAIL, KEY);
        }
        assertThat(limiter.isLocked(Scope.VERIFY_IP, KEY)).isFalse();
        assertThat(limiter.isLocked(Scope.VERIFY_EMAIL, "other")).isFalse();
        assertThat(limiter.recordAttempt(Scope.VERIFY_IP, null)).isFalse();
    }
}
