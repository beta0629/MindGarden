package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.repository.UserSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link UserSessionServiceImpl#slideActiveSession} — 활동 시 expiresAt 슬라이딩.
 *
 * @author MindGarden
 * @since 2026-08-07
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserSessionServiceImpl — slideActiveSession")
class UserSessionServiceImplSlideActiveSessionTest {

    private static final String SESSION_ID = "ABCDEF0123456789ABCDEF0123456789";
    private static final int TIMEOUT_MINUTES = 240;

    @Mock
    private UserSessionRepository userSessionRepository;

    @InjectMocks
    private UserSessionServiceImpl userSessionService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(
                userSessionService,
                "sessionTimeoutProperties",
                new SessionTimeoutProperties(Duration.ofHours(4)));
    }

    @Test
    @DisplayName("활동 후 expiresAt·lastActivityAt 이 timeoutMinutes 기준으로 연장된다")
    void slideActiveSession_extendsExpiresAt() {
        LocalDateTime oldActivity = LocalDateTime.now().minusMinutes(31);
        LocalDateTime oldExpiry = LocalDateTime.now().plusHours(1);
        UserSession session = activeSession(oldActivity, oldExpiry);
        when(userSessionRepository.findActiveSessionBySessionId(eq(SESSION_ID), any(LocalDateTime.class)))
                .thenReturn(Optional.of(session));
        when(userSessionRepository.save(any(UserSession.class))).thenAnswer(inv -> inv.getArgument(0));

        boolean ok = userSessionService.slideActiveSession(
                SESSION_ID, TIMEOUT_MINUTES, SessionConstants.SESSION_SLIDING_THROTTLE_SECONDS);

        assertThat(ok).isTrue();
        ArgumentCaptor<UserSession> captor = ArgumentCaptor.forClass(UserSession.class);
        verify(userSessionRepository).save(captor.capture());
        UserSession saved = captor.getValue();
        assertThat(saved.getLastActivityAt()).isAfter(oldActivity);
        assertThat(saved.getExpiresAt()).isAfter(oldExpiry);
        assertThat(Duration.between(LocalDateTime.now(), saved.getExpiresAt()).toMinutes())
                .isBetween((long) TIMEOUT_MINUTES - 2L, (long) TIMEOUT_MINUTES + 2L);
    }

    @Test
    @DisplayName("스로틀 구간 내면 save 없이 true — expiresAt 유지")
    void slideActiveSession_throttled_skipsWrite() {
        LocalDateTime recent = LocalDateTime.now().minusMinutes(5);
        LocalDateTime expiry = LocalDateTime.now().plusHours(3);
        UserSession session = activeSession(recent, expiry);
        when(userSessionRepository.findActiveSessionBySessionId(eq(SESSION_ID), any(LocalDateTime.class)))
                .thenReturn(Optional.of(session));

        boolean ok = userSessionService.slideActiveSession(
                SESSION_ID, TIMEOUT_MINUTES, SessionConstants.SESSION_SLIDING_THROTTLE_SECONDS);

        assertThat(ok).isTrue();
        verify(userSessionRepository, never()).save(any());
        assertThat(session.getExpiresAt()).isEqualTo(expiry);
        assertThat(session.getLastActivityAt()).isEqualTo(recent);
    }

    @Test
    @DisplayName("비활성·만료 세션이면 false — 중복로그인 강제종료 경로와 충돌하지 않음")
    void slideActiveSession_inactive_returnsFalse() {
        when(userSessionRepository.findActiveSessionBySessionId(eq(SESSION_ID), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        boolean ok = userSessionService.slideActiveSession(
                SESSION_ID, TIMEOUT_MINUTES, SessionConstants.SESSION_SLIDING_THROTTLE_SECONDS);

        assertThat(ok).isFalse();
        verify(userSessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("스로틀 0이면 매 호출마다 연장")
    void slideActiveSession_zeroThrottle_alwaysWrites() {
        LocalDateTime recent = LocalDateTime.now().minusSeconds(1);
        LocalDateTime expiry = LocalDateTime.now().plusHours(3);
        UserSession session = activeSession(recent, expiry);
        when(userSessionRepository.findActiveSessionBySessionId(eq(SESSION_ID), any(LocalDateTime.class)))
                .thenReturn(Optional.of(session));
        when(userSessionRepository.save(any(UserSession.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(userSessionService.slideActiveSession(SESSION_ID, TIMEOUT_MINUTES, 0)).isTrue();
        assertThat(userSessionService.slideActiveSession(SESSION_ID, TIMEOUT_MINUTES, 0)).isTrue();
        verify(userSessionRepository, times(2)).save(any(UserSession.class));
    }

    private static UserSession activeSession(LocalDateTime lastActivity, LocalDateTime expiresAt) {
        User user = User.builder()
                .email("slide-test@example.com")
                .build();
        user.setId(1L);
        user.setTenantId("tenant-slide");
        return UserSession.builder()
                .id(10L)
                .user(user)
                .sessionId(SESSION_ID)
                .lastActivityAt(lastActivity)
                .expiresAt(expiresAt)
                .isActive(true)
                .tenantId("tenant-slide")
                .build();
    }
}
