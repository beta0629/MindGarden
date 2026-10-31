package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.service.UserSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.env.MockEnvironment;

/**
 * 로그인 직후 Bearer idle 게이트·병렬 요청·refresh(sid 교체) 시나리오 가드.
 *
 * <p>요구: idle check passes right after login and stays authenticated through 5+ parallel
 * requests and a refresh, both with override 120 and without.</p>
 *
 * @author MindGarden
 * @since 2026-10-31
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("BearerIdleSession — 로그인 직후·병렬·refresh 가드")
class BearerIdleSessionPostLoginGuardTest {

    /** 테스트 픽스처 — .dev override 120초 */
    private static final int OVERRIDE_TTL_SECONDS_120 = 120;

    private static final int PARALLEL_REQUESTS = 6;

    @Mock
    private UserSessionService userSessionService;

    private SessionTimeoutProperties sessionTimeoutProperties;
    private BearerIdleSessionServiceImpl service;
    private Map<String, UserSession> store;

    @BeforeEach
    void setUp() {
        sessionTimeoutProperties = new SessionTimeoutProperties(Duration.ofHours(4));
        service = new BearerIdleSessionServiceImpl(userSessionService, sessionTimeoutProperties, "test-server-key");
        store = new ConcurrentHashMap<>();
        stubInMemoryUserSessionService();
    }

    @Nested
    @DisplayName("override 120")
    class WithOverride120 {

        @BeforeEach
        void enableOverride() {
            MockEnvironment env = new MockEnvironment();
            env.setActiveProfiles("dev");
            sessionTimeoutProperties.configureTestOverride(env, OVERRIDE_TTL_SECONDS_120);
            assertThat(sessionTimeoutProperties.getTimeoutSecondsForRole(UserRole.CONSULTANT))
                    .isEqualTo(OVERRIDE_TTL_SECONDS_120);
        }

        @ParameterizedTest(name = "{0}")
        @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
        @DisplayName("로그인 ensure 직후 활성 → 병렬 6회 유지 → refresh 새 sid 활성")
        void postLoginParallelAndRefresh_stayActive(UserRole role) throws Exception {
            assertThat(sessionTimeoutProperties.getTimeoutSecondsForRole(role))
                    .isEqualTo(OVERRIDE_TTL_SECONDS_120);
            runPostLoginParallelAndRefreshScenario(role);
        }
    }

    @Nested
    @DisplayName("override 없음 — 역할 기본 TTL")
    class WithoutOverride {

        @ParameterizedTest(name = "{0}")
        @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
        @DisplayName("로그인 ensure 직후 활성 → 병렬 6회 유지 → refresh 새 sid 활성")
        void postLoginParallelAndRefresh_stayActive(UserRole role) throws Exception {
            assertThat(sessionTimeoutProperties.getTestOverrideSeconds()).isZero();
            runPostLoginParallelAndRefreshScenario(role);
        }
    }

    private void runPostLoginParallelAndRefreshScenario(UserRole role) throws Exception {
        // Given
        User user = userWithRole(role);
        String oldSid = newSessionId();
        service.ensureActiveSession(user, oldSid, "127.0.0.1", "junit-agent");

        // When — 로그인 직후 idle check
        boolean immediate = service.isBearerSessionActive(oldSid, role);

        // Then
        assertThat(immediate).as("로그인 ensure 직후 활성").isTrue();

        // When — 병렬 5~8 요청: isBearerSessionActive + touchActivity
        ExecutorService pool = Executors.newFixedThreadPool(PARALLEL_REQUESTS);
        try {
            List<Callable<Boolean>> tasks = new ArrayList<>();
            for (int i = 0; i < PARALLEL_REQUESTS; i++) {
                tasks.add(() -> {
                    boolean active = service.isBearerSessionActive(oldSid, role);
                    boolean touched = service.touchActivity(oldSid, role);
                    return active && touched;
                });
            }
            List<Future<Boolean>> futures = pool.invokeAll(tasks, 15, TimeUnit.SECONDS);
            for (Future<Boolean> future : futures) {
                assertThat(future.get()).as("병렬 Bearer idle+touch 모두 true").isTrue();
            }
        } finally {
            pool.shutdownNow();
        }

        // When — refresh 게이트 시뮬레이션: old sid 활성이면 새 sid ensure 후 old 비활성 가능
        assertThat(service.isBearerSessionActive(oldSid, role)).isTrue();
        String newSid = newSessionId();
        service.ensureActiveSession(user, newSid, "127.0.0.1", "junit-agent");
        userSessionService.deactivateSession(service.toServerSessionKey(oldSid), SessionManagementConstants.END_REASON_LOGOUT);

        // Then
        assertThat(service.isBearerSessionActive(newSid, role)).as("refresh 후 새 sid 활성").isTrue();
        assertThat(service.isBearerSessionActive(oldSid, role)).as("old sid 비활성 가능").isFalse();
    }

    private void stubInMemoryUserSessionService() {
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
            if (session.getExpiresAt() != null && !session.getExpiresAt().isAfter(LocalDateTime.now())) {
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
                    if (session.getExpiresAt() != null
                            && !session.getExpiresAt().isAfter(LocalDateTime.now())) {
                        return false;
                    }
                    session.setLastActivityAt(LocalDateTime.now());
                    session.extendExpirationSeconds(timeoutSeconds);
                    return true;
                });
        when(userSessionService.deactivateSession(anyString(), anyString())).thenAnswer(invocation -> {
            String sid = invocation.getArgument(0);
            UserSession session = store.get(sid);
            if (session == null) {
                return false;
            }
            session.setIsActive(false);
            return true;
        });
    }

    private static String newSessionId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private static User userWithRole(UserRole role) {
        User user = User.builder()
                .email("post-login-" + UUID.randomUUID() + "@example.com")
                .role(role)
                .isActive(true)
                .build();
        user.setId(Math.abs(UUID.randomUUID().getMostSignificantBits()));
        user.setTenantId("tenant-" + UUID.randomUUID());
        return user;
    }
}
