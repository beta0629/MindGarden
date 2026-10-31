package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
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
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("BearerIdleSessionServiceImpl — Bearer 서버 유휴 강제")
class BearerIdleSessionServiceImplTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    /** 테스트 픽스처 — .dev idle override 120초 (분 절사와 무관하게 초 TTL 검증) */
    private static final int OVERRIDE_TTL_SECONDS_120 = 120;

    /** 테스트 픽스처 — 분 절사 회귀용 override 90초 (구버전 floor(90/60)=1분=60초) */
    private static final int OVERRIDE_TTL_SECONDS_90 = 90;

    @Mock
    private UserSessionService userSessionService;

    private SessionTimeoutProperties sessionTimeoutProperties;
    private BearerIdleSessionServiceImpl service;

    private String key(String sid) {
        return service.toServerSessionKey(sid);
    }

    @BeforeEach
    void setUp() {
        sessionTimeoutProperties = new SessionTimeoutProperties(Duration.ofHours(4));
        service = new BearerIdleSessionServiceImpl(userSessionService, sessionTimeoutProperties, "test-server-key");
    }

    /**
     * createSession 이 초 단위 expiresAt 을 쓰고, getActiveSession 이 expiresAt 을 존중하는
     * 인메모리 백킹 — 분 절사(minutes) 회귀를 재현·고정한다.
     */
    private Map<String, UserSession> stubSecondsAwareSessionStore() {
        Map<String, UserSession> store = new ConcurrentHashMap<>();
        when(userSessionService.createSession(
                any(User.class), anyString(), any(), any(), anyString(), any()))
                .thenAnswer(invocation -> {
                    User user = invocation.getArgument(0);
                    String sid = invocation.getArgument(1);
                    int ttlSeconds = sessionTimeoutProperties.getTimeoutSecondsForRole(user.getRole());
                    LocalDateTime now = LocalDateTime.now();
                    UserSession created = UserSession.builder()
                            .id(Math.abs(UUID.randomUUID().getLeastSignificantBits()))
                            .user(user)
                            .sessionId(sid)
                            .lastActivityAt(now)
                            .expiresAt(now.plusSeconds(ttlSeconds))
                            .isActive(true)
                            .tenantId(user.getTenantId())
                            .loginType(invocation.getArgument(4))
                            .build();
                    store.put(sid, created);
                    return created;
                });
        when(userSessionService.getActiveSession(anyString())).thenAnswer(invocation -> {
            String sid = invocation.getArgument(0);
            UserSession session = store.get(sid);
            if (session == null || !Boolean.TRUE.equals(session.getIsActive())) {
                return null;
            }
            LocalDateTime expiresAt = session.getExpiresAt();
            if (expiresAt != null && !expiresAt.isAfter(LocalDateTime.now())) {
                return null;
            }
            return session;
        });
        when(userSessionService.slideActiveSession(anyString(), anyInt(), anyLong()))
                .thenAnswer(invocation -> {
                    String sid = invocation.getArgument(0);
                    int timeoutSeconds = invocation.getArgument(1);
                    UserSession session = store.get(sid);
                    if (session == null || !Boolean.TRUE.equals(session.getIsActive())) {
                        return false;
                    }
                    session.setLastActivityAt(LocalDateTime.now());
                    session.extendExpirationSeconds(timeoutSeconds);
                    return true;
                });
        when(userSessionService.deactivateSession(anyString(), anyString())).thenAnswer(invocation -> {
            String sid = invocation.getArgument(0);
            UserSession session = store.get(sid);
            if (session != null) {
                session.setIsActive(false);
                return true;
            }
            return false;
        });
        return store;
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
            when(userSessionService.getActiveSession(key(sid))).thenReturn(activeSession(key(sid), lastActivityAt));

            // When
            boolean active = service.isBearerSessionActive(sid, role);

            // Then
            assertThat(active).as("%s TTL=%ds 한도 내", role, ttlSeconds).isTrue();
            verify(userSessionService, never()).deactivateSession(eq(key(sid)), eq(SessionManagementConstants.END_REASON_EXPIRED));
        }

        @ParameterizedTest(name = "{0} 한도 초과 → false")
        @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
        @DisplayName("한도 초과 lastActivityAt → false 및 만료 비활성화")
        void overTtl_returnsFalseAndDeactivates(UserRole role) {
            // Given
            String sid = newSessionId();
            int ttlSeconds = expectedRoleTtlSeconds(role);
            LocalDateTime lastActivityAt = LocalDateTime.now().minusSeconds(ttlSeconds + 60L);
            when(userSessionService.getActiveSession(key(sid))).thenReturn(activeSession(key(sid), lastActivityAt));

            // When
            boolean active = service.isBearerSessionActive(sid, role);

            // Then
            assertThat(active).as("%s TTL=%ds 한도 초과", role, ttlSeconds).isFalse();
            verify(userSessionService).deactivateSession(key(sid), SessionManagementConstants.END_REASON_EXPIRED);
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
            when(userSessionService.getActiveSession(key(sid))).thenReturn(activeSession(key(sid), lastActivityAt));

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
            when(userSessionService.getActiveSession(key(sid))).thenReturn(activeSession(key(sid), lastActivityAt));

            // When
            boolean active = service.isBearerSessionActive(sid, role);

            // Then
            assertThat(active).isFalse();
            verify(userSessionService).deactivateSession(key(sid), SessionManagementConstants.END_REASON_EXPIRED);
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
            when(userSessionService.getActiveSession(key(sid))).thenReturn(null);

            assertThat(service.isBearerSessionActive(sid, UserRole.CONSULTANT)).isFalse();
        }

        @Test
        @DisplayName("lastActivityAt null 이면 만료 처리 후 false")
        void nullLastActivity_deactivates() {
            String sid = newSessionId();
            when(userSessionService.getActiveSession(key(sid))).thenReturn(activeSession(key(sid), null));

            assertThat(service.isBearerSessionActive(sid, UserRole.CLIENT)).isFalse();
            verify(userSessionService).deactivateSession(key(sid), SessionManagementConstants.END_REASON_EXPIRED);
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
            int timeoutSeconds = sessionTimeoutProperties.getTimeoutSecondsForRole(role);
            when(userSessionService.slideActiveSession(
                    eq(key(sid)),
                    eq(timeoutSeconds),
                    eq((long) SessionConstants.BEARER_ACTIVITY_THROTTLE_SECONDS)))
                    .thenReturn(true);

            // When
            boolean ok = service.touchActivity(sid, role);

            // Then
            assertThat(ok).isTrue();
            verify(userSessionService).slideActiveSession(
                    key(sid),
                    timeoutSeconds,
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
    @DisplayName("ensureActiveSession / create — 초 단위 TTL (override 120)")
    class EnsureCreateOverride120 {

        private Map<String, UserSession> store;

        @BeforeEach
        void enableOverrideAndStore() {
            MockEnvironment env = new MockEnvironment();
            env.setActiveProfiles("dev");
            sessionTimeoutProperties.configureTestOverride(env, OVERRIDE_TTL_SECONDS_120);
            assertThat(sessionTimeoutProperties.getTestOverrideSeconds())
                    .isEqualTo(OVERRIDE_TTL_SECONDS_120);
            store = stubSecondsAwareSessionStore();
        }

        @Test
        @DisplayName("ensure 직후 isBearerSessionActive true")
        void ensureThenImmediateActive_true() {
            // Given
            String sid = newSessionId();
            User user = consultantUser();

            // When
            service.ensureActiveSession(user, sid, "127.0.0.1", "junit-agent");

            // Then
            assertThat(service.isBearerSessionActive(sid, UserRole.CONSULTANT)).isTrue();
            UserSession created = store.get(key(sid));
            assertThat(created).isNotNull();
            assertThat(Duration.between(LocalDateTime.now(), created.getExpiresAt()).toSeconds())
                    .as("createSession expiresAt 은 초 단위 override(120) — 분 절사(60) 금지")
                    .isBetween((long) OVERRIDE_TTL_SECONDS_120 - 5L, (long) OVERRIDE_TTL_SECONDS_120 + 5L);
        }

        @Test
        @DisplayName("lastActivity=now-119s → true / now-121s → false")
        void boundaryAroundOverride120() {
            // Given
            String sid = newSessionId();
            User user = consultantUser();
            service.ensureActiveSession(user, sid, "127.0.0.1", "junit-agent");
            UserSession session = store.get(key(sid));

            // When / Then — 한도 내
            session.setLastActivityAt(LocalDateTime.now().minusSeconds(OVERRIDE_TTL_SECONDS_120 - 1L));
            assertThat(service.isBearerSessionActive(sid, UserRole.CONSULTANT)).isTrue();

            // When / Then — 한도 초과
            session.setLastActivityAt(LocalDateTime.now().minusSeconds(OVERRIDE_TTL_SECONDS_120 + 1L));
            assertThat(service.isBearerSessionActive(sid, UserRole.CONSULTANT)).isFalse();
        }
    }

    @Nested
    @DisplayName("ensureActiveSession — override 없음 CONSULTANT 7200")
    class EnsureCreateConsultantDefault {

        private Map<String, UserSession> store;

        @BeforeEach
        void bindStore() {
            assertThat(sessionTimeoutProperties.getTestOverrideSeconds()).isZero();
            store = stubSecondsAwareSessionStore();
        }

        @Test
        @DisplayName("CONSULTANT 기본 TTL 한도 내 true / 초과 false")
        void consultantDefaultTtlBoundaries() {
            // Given
            String sid = newSessionId();
            User user = consultantUser();
            int ttl = SessionConstants.SESSION_TIMEOUT_SECONDS_CONSULTANT;
            assertThat(sessionTimeoutProperties.getTimeoutSecondsForRole(UserRole.CONSULTANT))
                    .isEqualTo(ttl);
            service.ensureActiveSession(user, sid, "127.0.0.1", "junit-agent");
            UserSession session = store.get(key(sid));

            // When / Then — 한도 내
            session.setLastActivityAt(LocalDateTime.now().minusSeconds(ttl - 60L));
            assertThat(service.isBearerSessionActive(sid, UserRole.CONSULTANT)).isTrue();

            // When / Then — 한도 초과
            session.setLastActivityAt(LocalDateTime.now().minusSeconds(ttl + 60L));
            assertThat(service.isBearerSessionActive(sid, UserRole.CONSULTANT)).isFalse();
        }
    }

    @Nested
    @DisplayName("분 절사 회귀 — override 90초")
    class MinutesTruncationRegressionOverride90 {

        private Map<String, UserSession> store;

        @BeforeEach
        void enableOverride90() {
            MockEnvironment env = new MockEnvironment();
            env.setActiveProfiles("dev");
            sessionTimeoutProperties.configureTestOverride(env, OVERRIDE_TTL_SECONDS_90);
            assertThat(sessionTimeoutProperties.getTimeoutSecondsForRole(UserRole.CONSULTANT))
                    .isEqualTo(OVERRIDE_TTL_SECONDS_90);
            store = stubSecondsAwareSessionStore();
        }

        @Test
        @DisplayName("ensure 후 61s 경과에도 true — 구버전 expires_at=60s 면 getActiveSession miss")
        void after61SecondsStillActive_withSecondsExpiresAt() {
            // Given
            String sid = newSessionId();
            User user = consultantUser();
            service.ensureActiveSession(user, sid, "127.0.0.1", "junit-agent");
            UserSession session = store.get(key(sid));
            assertThat(session).isNotNull();
            // create 직후 expiresAt ≈ now+90 — 분 절사였다면 now+60
            assertThat(Duration.between(LocalDateTime.now(), session.getExpiresAt()).toSeconds())
                    .as("초 단위 TTL 90 — 분 절사(60) 이면 실패")
                    .isGreaterThan(60L)
                    .isBetween((long) OVERRIDE_TTL_SECONDS_90 - 5L, (long) OVERRIDE_TTL_SECONDS_90 + 5L);

            // When — 61초 경과 시뮬레이션 (lastActivity·expiresAt 동시 rewind)
            long elapsed = 61L;
            session.setLastActivityAt(session.getLastActivityAt().minusSeconds(elapsed));
            session.setExpiresAt(session.getExpiresAt().minusSeconds(elapsed));

            // Then — idle TTL 90 이므로 61s 후에도 활성 (expiresAt 도 아직 미래)
            assertThat(service.isBearerSessionActive(sid, UserRole.CONSULTANT))
                    .as("override 90s: 61s idle 은 활성 — 구버전 expires=60s 면 false")
                    .isTrue();
        }

        @Test
        @DisplayName("ensure 후 91s 경과 → false")
        void after91SecondsInactive() {
            // Given
            String sid = newSessionId();
            User user = consultantUser();
            service.ensureActiveSession(user, sid, "127.0.0.1", "junit-agent");
            UserSession session = store.get(key(sid));

            // When — 91초 경과
            long elapsed = OVERRIDE_TTL_SECONDS_90 + 1L;
            session.setLastActivityAt(session.getLastActivityAt().minusSeconds(elapsed));
            session.setExpiresAt(session.getExpiresAt().minusSeconds(elapsed));

            // Then
            assertThat(service.isBearerSessionActive(sid, UserRole.CONSULTANT)).isFalse();
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

    private static User consultantUser() {
        User user = User.builder()
                .email("bearer-idle-" + UUID.randomUUID() + "@example.com")
                .role(UserRole.CONSULTANT)
                .isActive(true)
                .build();
        user.setId(Math.abs(UUID.randomUUID().getMostSignificantBits()));
        user.setTenantId("tenant-" + UUID.randomUUID());
        return user;
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

    @Nested
    @DisplayName("서버 세션 키 — JWT sid 를 그대로 저장하지 않음")
    class ServerSessionKey {

        @Test
        @DisplayName("키는 sid 와 다르고 bjs_ 접두사, 같은 sid 는 같은 키, 서버 키가 다르면 다른 키")
        void keyIsHmacOfSid() {
            String sid = UUID.randomUUID().toString();
            String key = service.toServerSessionKey(sid);
            assertThat(key).isNotEqualTo(sid).startsWith(SessionConstants.BEARER_SESSION_KEY_PREFIX)
                    .doesNotContain(sid);
            assertThat(service.toServerSessionKey(sid)).isEqualTo(key);
            BearerIdleSessionServiceImpl other = new BearerIdleSessionServiceImpl(
                    userSessionService, sessionTimeoutProperties, "other-server-key");
            assertThat(other.toServerSessionKey(sid)).isNotEqualTo(key);
            assertThat(service.toServerSessionKey(" ")).isNull();
        }

        @Test
        @DisplayName("ensureActiveSession 은 user_sessions 에 sid 가 아닌 서버 키로 저장")
        void ensureStoresServerKeyNotSid() {
            String sid = UUID.randomUUID().toString();
            User user = User.builder().email("key@example.com").role(UserRole.CLIENT).build();
            user.setId(9L);
            when(userSessionService.getActiveSession(anyString())).thenReturn(null);

            service.ensureActiveSession(user, sid, "127.0.0.1", "ua");

            verify(userSessionService).createSession(
                    eq(user), eq(service.toServerSessionKey(sid)), anyString(), anyString(), anyString(), any());
            verify(userSessionService, never()).createSession(
                    any(), eq(sid), anyString(), anyString(), anyString(), any());
        }
    }
}
