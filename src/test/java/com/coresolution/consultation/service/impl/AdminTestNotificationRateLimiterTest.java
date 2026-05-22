package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.config.AdminTestNotificationProperties;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * {@link AdminTestNotificationRateLimiter} 단위 테스트.
 *
 * <p>기획서 §4.X C5 — 분당 10 / 일당 100 한도 검증.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("어드민 테스트 발송 Rate-Limiter")
class AdminTestNotificationRateLimiterTest {

    private static final String TENANT_ID = "tenant-rate-test";
    private static final Long USER_ID = 42L;

    @Mock
    private AdminTestNotificationLogRepository logRepository;

    private AdminTestNotificationRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        AdminTestNotificationProperties properties = new AdminTestNotificationProperties();
        AdminTestNotificationProperties.RateLimit rateLimit =
            new AdminTestNotificationProperties.RateLimit();
        rateLimit.setPerMinute(10);
        rateLimit.setPerDay(100);
        properties.setRateLimit(rateLimit);

        lenient().when(logRepository.countByTenantIdAndSentByUserIdAndSentAtAfter(
            eq(TENANT_ID), eq(USER_ID), any()))
            .thenReturn(0L);

        rateLimiter = new AdminTestNotificationRateLimiter(properties, logRepository);
    }

    @Test
    @DisplayName("초기 상태 — 발송 허용(잔여 10/100)")
    void tryAcquire_whenNoAttempts_returnsAllowed() {
        AdminTestNotificationRateLimiter.Decision decision =
            rateLimiter.tryAcquire(TENANT_ID, USER_ID);

        assertThat(decision.exceeded()).isFalse();
        assertThat(decision.remainingPerMinute()).isEqualTo(10);
        assertThat(decision.remainingPerDay()).isEqualTo(100);
    }

    @Test
    @DisplayName("분당 한도 초과 — PER_MINUTE exceeded")
    void tryAcquire_whenPerMinuteExceeded_returnsExceeded() {
        for (int i = 0; i < 10; i++) {
            rateLimiter.recordAttempt(TENANT_ID, USER_ID);
        }

        AdminTestNotificationRateLimiter.Decision decision =
            rateLimiter.tryAcquire(TENANT_ID, USER_ID);

        assertThat(decision.exceeded()).isTrue();
        assertThat(decision.limitKind()).isEqualTo(AdminTestNotificationRateLimiter.LIMIT_KIND_PER_MINUTE);
        assertThat(decision.retryAfterSeconds()).isEqualTo(60L);
    }
}
