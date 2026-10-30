package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpSession;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.utils.SessionUtils;

/**
 * HttpSession TTL SSOT — 컨테이너 기본 4h + 역할별 TTL.
 *
 * @author MindGarden
 * @since 2026-08-05
 */
class SessionTimeoutPropertiesTest {

    private static final int FOUR_HOURS_SECONDS = 4 * 60 * 60;
    private static final int FOUR_HOURS_MINUTES = 240;
    private static final int ONE_HOUR_SECONDS = 1 * 60 * 60;
    private static final int TWO_HOURS_SECONDS = 2 * 60 * 60;

    @Test
    @DisplayName("SessionTimeoutProperties 기본 4h는 14400초·240분")
    void defaultTimeoutIsFourHours() {
        SessionTimeoutProperties properties = new SessionTimeoutProperties(Duration.ofHours(4));

        assertThat(properties.getTimeoutSeconds()).isEqualTo(FOUR_HOURS_SECONDS);
        assertThat(properties.getTimeoutMinutes()).isEqualTo(FOUR_HOURS_MINUTES);
    }

    @Test
    @DisplayName("역할별 TTL — CLIENT 1h, CONSULTANT 2h, ADMIN/STAFF 4h, null→ADMIN 폴백")
    void timeoutSecondsForRole_matchesRoleMap() {
        SessionTimeoutProperties properties = new SessionTimeoutProperties(Duration.ofHours(4));

        assertThat(properties.getTimeoutSecondsForRole(UserRole.CLIENT)).isEqualTo(ONE_HOUR_SECONDS);
        assertThat(properties.getTimeoutSecondsForRole(UserRole.CONSULTANT)).isEqualTo(TWO_HOURS_SECONDS);
        assertThat(properties.getTimeoutSecondsForRole(UserRole.ADMIN)).isEqualTo(FOUR_HOURS_SECONDS);
        assertThat(properties.getTimeoutSecondsForRole(UserRole.STAFF)).isEqualTo(FOUR_HOURS_SECONDS);
        assertThat(properties.getTimeoutSecondsForRole((UserRole) null)).isEqualTo(FOUR_HOURS_SECONDS);
        assertThat(properties.getTimeoutSecondsForRole((String) null)).isEqualTo(FOUR_HOURS_SECONDS);
        assertThat(properties.getTimeoutMinutesForRole(UserRole.CLIENT)).isEqualTo(60);
        assertThat(properties.getTimeoutMinutesForRole(UserRole.CONSULTANT)).isEqualTo(120);
        assertThat(properties.getTimeoutMinutesForRole(UserRole.ADMIN)).isEqualTo(240);
    }

    @Test
    @DisplayName("SessionConstants 역할별 상수·폴백이 역할 맵과 정합")
    void fallbackConstantsMatchRoleSsot() {
        assertThat(SessionConstants.SESSION_TIMEOUT_SECONDS_CLIENT).isEqualTo(ONE_HOUR_SECONDS);
        assertThat(SessionConstants.SESSION_TIMEOUT_SECONDS_CONSULTANT).isEqualTo(TWO_HOURS_SECONDS);
        assertThat(SessionConstants.SESSION_TIMEOUT_SECONDS_ADMIN).isEqualTo(FOUR_HOURS_SECONDS);
        assertThat(SessionConstants.SESSION_TIMEOUT_SECONDS_STAFF)
                .isEqualTo(SessionConstants.SESSION_TIMEOUT_SECONDS_ADMIN);
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
    @DisplayName("resolveTimeoutSeconds — 세션 User 역할 우선, 역할 없으면 기존 interval 유지")
    void resolveTimeoutSeconds_usesRoleOrKeepsExisting() {
        SessionTimeoutProperties properties = new SessionTimeoutProperties(Duration.ofHours(4));

        MockHttpSession withUser = new MockHttpSession();
        User consultant = new User();
        consultant.setRole(UserRole.CONSULTANT);
        SessionUtils.setCurrentUser(withUser, consultant);
        assertThat(properties.resolveTimeoutSeconds(withUser)).isEqualTo(TWO_HOURS_SECONDS);

        MockHttpSession noRole = new MockHttpSession();
        noRole.setMaxInactiveInterval(SessionConstants.SESSION_TIMEOUT_SECONDS_CLIENT);
        assertThat(properties.resolveTimeoutSeconds(noRole))
                .isEqualTo(SessionConstants.SESSION_TIMEOUT_SECONDS_CLIENT);

        MockHttpSession empty = new MockHttpSession();
        empty.setMaxInactiveInterval(0);
        assertThat(properties.resolveTimeoutSeconds(empty)).isEqualTo(FOUR_HOURS_SECONDS);
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

    @Test
    @DisplayName("만료 테스트 훅 — 비운영 프로필에서 override>0이면 전 역할 TTL 대체")
    void testOverride_appliesOutsideProd() {
        SessionTimeoutProperties properties = new SessionTimeoutProperties(Duration.ofHours(4));
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        properties.configureTestOverride(env, 120);

        assertThat(properties.getTestOverrideSeconds()).isEqualTo(120);
        assertThat(properties.getTimeoutSecondsForRole(UserRole.CLIENT)).isEqualTo(120);
        assertThat(properties.getTimeoutSecondsForRole(UserRole.CONSULTANT)).isEqualTo(120);
        assertThat(properties.getTimeoutSecondsForRole("ADMIN")).isEqualTo(120);
        assertThat(properties.resolveTimeoutSeconds(new MockHttpSession())).isEqualTo(120);
    }

    @Test
    @DisplayName("만료 테스트 훅 — prod 프로필에서는 항상 꺼짐")
    void testOverride_ignoredInProd() {
        SessionTimeoutProperties properties = new SessionTimeoutProperties(Duration.ofHours(4));
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        properties.configureTestOverride(env, 120);

        assertThat(properties.getTestOverrideSeconds()).isZero();
        assertThat(properties.getTimeoutSecondsForRole(UserRole.CLIENT)).isEqualTo(ONE_HOUR_SECONDS);
    }

    @Test
    @DisplayName("만료 테스트 훅 — 기본 0은 꺼짐")
    void testOverride_offByDefault() {
        SessionTimeoutProperties properties = new SessionTimeoutProperties(Duration.ofHours(4));
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        properties.configureTestOverride(env, 0);

        assertThat(properties.getTimeoutSecondsForRole(UserRole.CONSULTANT)).isEqualTo(TWO_HOURS_SECONDS);
    }
}
