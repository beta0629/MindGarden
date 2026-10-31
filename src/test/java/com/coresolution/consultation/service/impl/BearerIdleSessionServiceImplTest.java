package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Stream;

import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.service.UserSessionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * {@link BearerIdleSessionServiceImpl} 역할별 유휴 TTL·override·401 JSON·touch 스로틀 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-10-31
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BearerIdleSessionServiceImpl — Bearer 서버 유휴 강제")
class BearerIdleSessionServiceImplTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Mock
    private UserSessionService userSessionService;

    private SessionTimeoutProperties sessionTimeoutProperties;
    private BearerIdleSessionServiceImpl service;

    @BeforeEach
    void setUp() {
        sessionTimeoutProperties = new SessionTimeoutProperties(Duration.ofHours(4));
        service = new BearerIdleSessionServiceImpl(userSessionService, sessionTimeoutProperties);
    }

    @Nested
    @DisplayName("isBearerSessionActive — 역할별 TTL")
    class IsBearerSessionActiveRoleTtl {

        @ParameterizedTest(name = "{0} 한도 내 → true")
        @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
        @DisplayName("한도 내 lastActivityAt → true")
        void insideTtl_returnsTrue(UserRole role) {
            // Given
            String sid = newSessionId();
            int ttlSeconds = expectedRoleTtlSeconds(role);
            LocalDateTime lastActivityAt = LocalDateTime.now().minusSeconds(ttlSeconds - 60L);
            when(userSessionService.getActiveSession(sid)).thenReturn(activeSession(sid, lastActivityAt));

            // When
            boolean active = service.isBearerSessionActive(sid, role);

            // Then
            assertThat(active).as("%s TTL=%ds 한도 내", role, ttlSeconds).isTrue();
            verify(userSessionService, never()).deactivateSession(eq(sid), eq(SessionManagementConstants.END_REASON_EXPIRED));
        }

        @ParameterizedTest(name = "{0} 한도 초과 → false")
        @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
        @DisplayName("한도 초과 lastActivityAt → false 및 만료 비활성화")
        void overTtl_returnsFalseAndDeactivates(UserRole role) {
            // Given
            String sid = newSessionId();
            int ttlSeconds = expectedRoleTtlSeconds(role);
            LocalDateTime lastActivityAt = LocalDateTime.now().minusSeconds(ttlSeconds + 60L);
            when(userSessionService.getActiveSession(sid)).thenReturn(activeSession(sid, lastActivityAt));

            // When
            boolean active = service.isBearerSessionActive(sid, role);

            // Then
            assertThat(active).as("%s TTL=%ds 한도 초과", role, ttlSeconds).isFalse();
            verify(userSessionService).deactivateSession(sid, SessionManagementConstants.END_REASON_EXPIRED);
        }

        @ParameterizedTest(name = "{0} 역할 TTL 상수는 SessionConstants 와 일치")
        @MethodSource("com.coresolution.consultation.service.impl.BearerIdleSessionServiceImplTest#roleTtlCases")
        @DisplayName("역할별 SessionConstants TTL 이 properties 와 일치")
        void roleTtlMatchesSessionConstants(UserRole role, int expectedSeconds) {
            assertThat(sessionTimeoutProperties.getTimeoutSecondsForRole(role))
                    .as("%s 역할 TTL", role)
                    .isEqualTo(expectedSeconds);
        }
    }

    @Nested
    @DisplayName("isBearerSessionActive — test-override")
    class IsBearerSessionActiveOverride {

        @BeforeEach
        void enableOverride() {
            MockEnvironment env = new MockEnvironment();
            env.setActiveProfiles("dev");
            // ADMIN(4h)보다 훨씬 짧은 override — 통과/초과를 역할 상수와 분리해 검증
            sessionTimeoutProperties.configureTestOverride(env, 120);
            assertThat(sessionTimeoutProperties.getTestOverrideSeconds()).isEqualTo(120);
        }

        @ParameterizedTest(name = "{0} override 한도 내 → true")
        @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
        @DisplayName("override 초 기준 한도 내 → true")
        void overrideInside_returnsTrue(UserRole role) {
            // Given
            String sid = newSessionId();
            int overrideTtl = sessionTimeoutProperties.getTimeoutSecondsForRole(role);
            assertThat(overrideTtl).isEqualTo(120);
            LocalDateTime lastActivityAt = LocalDateTime.now().minusSeconds(overrideTtl - 30L);
            when(userSessionService.getActiveSession(sid)).thenReturn(activeSession(sid, lastActivityAt));

            // When / Then
            assertThat(service.isBearerSessionActive(sid, role)).isTrue();
        }

        @ParameterizedTest(name = "{0} override 한도 초과 → false")
        @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
        @DisplayName("override 초 기준 한도 초과 → false")
        void overrideOver_returnsFalse(UserRole role) {
            // Given
            String sid = newSessionId();
            int overrideTtl = sessionTimeoutProperties.getTimeoutSecondsForRole(role);
            LocalDateTime lastActivityAt = LocalDateTime.now().minusSeconds(overrideTtl + 60L);
            when(userSessionService.getActiveSession(sid)).thenReturn(activeSession(sid, lastActivityAt));

            // When
            boolean active = service.isBearerSessionActive(sid, role);

            // Then
            assertThat(active).isFalse();
            verify(userSessionService).deactivateSession(sid, SessionManagementConstants.END_REASON_EXPIRED);
        }
    }

    @Nested
    @DisplayName("경계·입력")
    class EdgeCases {

        @Test
        @DisplayName("sid 비어 있으면 false")
        void blankSid_returnsFalse() {
            assertThat(service.isBearerSessionActive("  ", UserRole.CLIENT)).isFalse();
            assertThat(service.isBearerSessionActive(null, UserRole.ADMIN)).isFalse();
        }

        @Test
        @DisplayName("활성 세션 없으면 false")
        void missingSession_returnsFalse() {
            String sid = newSessionId();
            when(userSessionService.getActiveSession(sid)).thenReturn(null);

            assertThat(service.isBearerSessionActive(sid, UserRole.CONSULTANT)).isFalse();
        }

        @Test
        @DisplayName("lastActivityAt null 이면 만료 처리 후 false")
        void nullLastActivity_deactivates() {
            String sid = newSessionId();
            when(userSessionService.getActiveSession(sid)).thenReturn(activeSession(sid, null));

            assertThat(service.isBearerSessionActive(sid, UserRole.CLIENT)).isFalse();
            verify(userSessionService).deactivateSession(sid, SessionManagementConstants.END_REASON_EXPIRED);
        }
    }

    @Nested
    @DisplayName("touchActivity — BEARER_ACTIVITY_THROTTLE_SECONDS 전달")
    class TouchActivity {

        @ParameterizedTest(name = "{0}")
        @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
        @DisplayName("slideActiveSession 에 BEARER_ACTIVITY_THROTTLE_SECONDS 를 넘긴다")
        void touchActivity_passesBearerThrottle(UserRole role) {
            // Given
            String sid = newSessionId();
            int timeoutMinutes = sessionTimeoutProperties.getTimeoutMinutesForRole(role);
            when(userSessionService.slideActiveSession(
                    eq(sid),
                    eq(timeoutMinutes),
                    eq((long) SessionConstants.BEARER_ACTIVITY_THROTTLE_SECONDS)))
                    .thenReturn(true);

            // When
            boolean ok = service.touchActivity(sid, role);

            // Then
            assertThat(ok).isTrue();
            verify(userSessionService).slideActiveSession(
                    sid,
                    timeoutMinutes,
                    SessionConstants.BEARER_ACTIVITY_THROTTLE_SECONDS);
        }

        @Test
        @DisplayName("sid 비어 있으면 slide 호출 없이 false")
        void blankSid_skipsSlide() {
            assertThat(service.touchActivity("", UserRole.ADMIN)).isFalse();
            verify(userSessionService, never()).slideActiveSession(
                    org.mockito.ArgumentMatchers.anyString(),
                    org.mockito.ArgumentMatchers.anyInt(),
                    org.mockito.ArgumentMatchers.anyLong());
        }
    }

    @Nested
    @DisplayName("writeUnauthorizedIdle")
    class WriteUnauthorizedIdle {

        @Test
        @DisplayName("401 JSON — success=false, redirectToLogin=true, SESSION_EXPIRED_MESSAGE")
        void writesUnauthorizedJsonBody() throws Exception {
            // Given
            String path = "/api/v1/clients/" + UUID.randomUUID();
            MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
            MockHttpServletResponse response = new MockHttpServletResponse();

            // When
            service.writeUnauthorizedIdle(request, response);

            // Then
            assertThat(response.getStatus()).isEqualTo(401);
            JsonNode body = OBJECT_MAPPER.readTree(response.getContentAsByteArray());
            assertThat(body.get("success").asBoolean()).isFalse();
            assertThat(body.get("message").asText())
                    .isEqualTo(SessionManagementConstants.SESSION_EXPIRED_MESSAGE);
            assertThat(body.get("redirectToLogin").asBoolean()).isTrue();
            assertThat(body.get("path").asText()).isEqualTo(path);
            assertThat(body.get("method").asText()).isEqualTo("GET");
            assertThat(body.get("timestamp").isNumber()).isTrue();
        }
    }

    static Stream<Arguments> roleTtlCases() {
        return Stream.of(
                Arguments.of(UserRole.CLIENT, SessionConstants.SESSION_TIMEOUT_SECONDS_CLIENT),
                Arguments.of(UserRole.CONSULTANT, SessionConstants.SESSION_TIMEOUT_SECONDS_CONSULTANT),
                Arguments.of(UserRole.ADMIN, SessionConstants.SESSION_TIMEOUT_SECONDS_ADMIN));
    }

    private int expectedRoleTtlSeconds(UserRole role) {
        int fromProperties = sessionTimeoutProperties.getTimeoutSecondsForRole(role);
        int fromConstants = switch (role) {
            case CLIENT -> SessionConstants.SESSION_TIMEOUT_SECONDS_CLIENT;
            case CONSULTANT -> SessionConstants.SESSION_TIMEOUT_SECONDS_CONSULTANT;
            case ADMIN -> SessionConstants.SESSION_TIMEOUT_SECONDS_ADMIN;
            default -> throw new IllegalArgumentException("unexpected role: " + role);
        };
        assertThat(fromProperties).isEqualTo(fromConstants);
        return fromProperties;
    }

    private static String newSessionId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private static UserSession activeSession(String sid, LocalDateTime lastActivityAt) {
        User user = User.builder()
                .email("bearer-idle-" + UUID.randomUUID() + "@example.com")
                .build();
        user.setId(Math.abs(UUID.randomUUID().getMostSignificantBits()));
        user.setTenantId("tenant-" + UUID.randomUUID());
        return UserSession.builder()
                .id(Math.abs(UUID.randomUUID().getLeastSignificantBits()))
                .user(user)
                .sessionId(sid)
                .lastActivityAt(lastActivityAt)
                .expiresAt(LocalDateTime.now().plusHours(4))
                .isActive(true)
                .tenantId(user.getTenantId())
                .build();
    }
}
