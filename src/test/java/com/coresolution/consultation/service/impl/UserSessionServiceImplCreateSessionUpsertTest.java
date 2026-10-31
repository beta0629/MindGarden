package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.repository.UserSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link UserSessionServiceImpl#createSession} 동일 sid 활성 세션 upsert(삭제 금지) 회귀.
 *
 * @author MindGarden
 * @since 2026-10-31
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("UserSessionServiceImpl — createSession idempotent upsert")
class UserSessionServiceImplCreateSessionUpsertTest {

    @Mock
    private UserSessionRepository userSessionRepository;

    private SessionTimeoutProperties sessionTimeoutProperties;
    private UserSessionServiceImpl service;

    @BeforeEach
    void setUp() {
        sessionTimeoutProperties = new SessionTimeoutProperties(Duration.ofHours(4));
        service = new UserSessionServiceImpl();
        ReflectionTestUtils.setField(service, "userSessionRepository", userSessionRepository);
        ReflectionTestUtils.setField(service, "sessionTimeoutProperties", sessionTimeoutProperties);
    }

    @Test
    @DisplayName("동일 sid 활성 세션이 있으면 deleteBySessionId 호출 없이 슬라이드 저장")
    void createSession_existingActive_upsertsWithoutDelete() {
        // Given
        User user = user();
        String sid = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime createdAt = LocalDateTime.now().minusMinutes(5);
        UserSession existing = UserSession.builder()
                .id(99L)
                .user(user)
                .sessionId(sid)
                .lastActivityAt(createdAt)
                .expiresAt(createdAt.plusHours(1))
                .isActive(true)
                .tenantId(user.getTenantId())
                .loginType(SessionManagementConstants.LOGIN_TYPE_NORMAL)
                .build();
        when(userSessionRepository.findActiveSessionBySessionId(eq(sid), any(LocalDateTime.class)))
                .thenReturn(Optional.of(existing));
        when(userSessionRepository.save(any(UserSession.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        UserSession result = service.createSession(
                user, sid, "127.0.0.1", "junit-agent",
                SessionManagementConstants.LOGIN_TYPE_NORMAL, null);

        // Then
        verify(userSessionRepository, never()).deleteBySessionId(anyString());
        ArgumentCaptor<UserSession> captor = ArgumentCaptor.forClass(UserSession.class);
        verify(userSessionRepository).save(captor.capture());
        assertThat(result.getSessionId()).isEqualTo(sid);
        assertThat(result.getIsActive()).isTrue();
        assertThat(captor.getValue().getLastActivityAt()).isAfter(createdAt);
    }

    private static User user() {
        User user = User.builder()
                .email("upsert-" + UUID.randomUUID() + "@example.com")
                .role(UserRole.CLIENT)
                .isActive(true)
                .build();
        user.setId(7L);
        user.setTenantId("tenant-" + UUID.randomUUID());
        return user;
    }
}
