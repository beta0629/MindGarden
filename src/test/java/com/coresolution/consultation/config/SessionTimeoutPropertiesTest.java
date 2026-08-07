package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.SessionManagementConstants;

/**
 * HttpSession TTL SSOT(기본 4h) 스모크.
 *
 * @author MindGarden
 * @since 2026-08-05
 */
class SessionTimeoutPropertiesTest {

    private static final int FOUR_HOURS_SECONDS = 4 * 60 * 60;
    private static final int FOUR_HOURS_MINUTES = 240;

    @Test
    @DisplayName("SessionTimeoutProperties 기본 4h는 14400초·240분")
    void defaultTimeoutIsFourHours() {
        SessionTimeoutProperties properties = new SessionTimeoutProperties(Duration.ofHours(4));

        assertThat(properties.getTimeoutSeconds()).isEqualTo(FOUR_HOURS_SECONDS);
        assertThat(properties.getTimeoutMinutes()).isEqualTo(FOUR_HOURS_MINUTES);
    }

    @Test
    @DisplayName("SessionConstants·SessionManagementConstants 폴백이 4h SSOT와 정합")
    void fallbackConstantsMatchFourHourSsot() {
        assertThat(SessionConstants.SESSION_TIMEOUT_SECONDS).isEqualTo(FOUR_HOURS_SECONDS);
        assertThat(SessionConstants.BUSINESS_SESSION_TIMEOUT_SECONDS)
                .isEqualTo(SessionConstants.SESSION_TIMEOUT_SECONDS);
        assertThat(SessionManagementConstants.DEFAULT_SESSION_TIMEOUT_MINUTES)
                .isEqualTo(FOUR_HOURS_MINUTES);
    }

    @Test
    @DisplayName("잘못된 Duration이면 SessionConstants 폴백 사용")
    void invalidDurationUsesFallback() {
        SessionTimeoutProperties properties = new SessionTimeoutProperties(Duration.ZERO);

        assertThat(properties.getTimeoutSeconds())
                .isEqualTo(SessionConstants.SESSION_TIMEOUT_SECONDS);
    }

    @Test
    @DisplayName("동시 세션 상수 — 레거시 운영1/개발3 + Spring CEILING(-1) SSOT")
    void maxConcurrentSessionsMatchSecuritySsot() {
        assertThat(SessionManagementConstants.MAX_CONCURRENT_SESSIONS_PRODUCTION).isEqualTo(1);
        assertThat(SessionManagementConstants.MAX_CONCURRENT_SESSIONS_DEVELOPMENT).isEqualTo(3);
        assertThat(SessionManagementConstants.MAX_CONCURRENT_SESSIONS)
                .isEqualTo(SessionManagementConstants.MAX_CONCURRENT_SESSIONS_DEVELOPMENT);
        assertThat(SessionConstants.MAX_CONCURRENT_SESSIONS)
                .isEqualTo(SessionManagementConstants.MAX_CONCURRENT_SESSIONS_DEVELOPMENT);
        assertThat(SessionManagementConstants.MAX_CONCURRENT_SESSIONS_SPRING_CEILING).isEqualTo(-1);
        assertThat(SessionManagementConstants.MAX_CONCURRENT_SESSIONS_WHEN_DUPLICATE_ALLOWED)
                .isEqualTo(-1);
    }
}
