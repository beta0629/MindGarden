package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.dto.lifecycle.WithdrawalRequestDto;
import com.coresolution.consultation.dto.lifecycle.WithdrawalStatusDto;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.UserLifecycleService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.security.PasswordService;

import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link UserWithdrawalController} 단위 테스트 — Phase 2-α 자발 탈퇴 3 엔드포인트.
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserWithdrawalController — 자발 탈퇴 request/cancel/status")
class UserWithdrawalControllerTest {

    private static final Long USER_ID = 4242L;
    private static final String TENANT_ID = "tenant-withdrawal-test";

    @Mock private UserLifecycleService userLifecycleService;
    @Mock private UserService userService;
    @Mock private PasswordService passwordService;
    @Mock private HttpSession session;

    @InjectMocks
    private UserWithdrawalController controller;

    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(USER_ID);
        currentUser.setTenantId(TENANT_ID);
        currentUser.setEmail("user@example.com");
        currentUser.setPassword("encoded-pw");
        currentUser.setRole(UserRole.CLIENT);
        currentUser.setLifecycleState(LifecycleState.ACTIVE);
    }

    // ---------- POST /request ----------

    @Test
    @DisplayName("request: 비밀번호 일치 + ACTIVE → WITHDRAWAL_PENDING 전이 + 만료 시각 노출")
    void request_success() {
        WithdrawalRequestDto req = new WithdrawalRequestDto("plain-pw", "이유");
        TransitionResult result = TransitionResult.builder()
                .userId(USER_ID)
                .fromState(LifecycleState.ACTIVE)
                .toState(LifecycleState.WITHDRAWAL_PENDING)
                .auditLogId(101L)
                .transitionedAt(LocalDateTime.now())
                .build();
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));
            when(passwordService.matches("plain-pw", "encoded-pw")).thenReturn(true);
            when(userLifecycleService.requestWithdrawal(eq(USER_ID), any(Actor.class)))
                    .thenReturn(result);

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.requestWithdrawal(session, req);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            Map<String, Object> body = response.getBody().getData();
            assertThat(body.get("userId")).isEqualTo(USER_ID);
            assertThat(body.get("lifecycleState")).isEqualTo("WITHDRAWAL_PENDING");
            assertThat(body.get("graceDays"))
                    .isEqualTo(UserWithdrawalController.WITHDRAWAL_GRACE_PERIOD_DAYS);
            assertThat(body.get("withdrawalExpiresAt")).isNotNull();
            verify(userLifecycleService, times(1))
                    .requestWithdrawal(eq(USER_ID), any(Actor.class));
        }
    }

    @Test
    @DisplayName("request: 비밀번호 불일치 시 401 + 전이 호출 없음")
    void request_passwordMismatch_returns401() {
        WithdrawalRequestDto req = new WithdrawalRequestDto("wrong-pw", null);
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));
            when(passwordService.matches(anyString(), anyString())).thenReturn(false);

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.requestWithdrawal(session, req);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
            verify(userLifecycleService, never())
                    .requestWithdrawal(anyLong(), any(Actor.class));
        }
    }

    // ---------- POST /cancel ----------

    @Test
    @DisplayName("cancel: WITHDRAWAL_PENDING → ACTIVE 정상 취소")
    void cancel_success() {
        currentUser.setLifecycleState(LifecycleState.WITHDRAWAL_PENDING);
        currentUser.setWithdrawalRequestedAt(LocalDateTime.now().minusDays(3));
        TransitionResult result = TransitionResult.builder()
                .userId(USER_ID)
                .fromState(LifecycleState.WITHDRAWAL_PENDING)
                .toState(LifecycleState.ACTIVE)
                .auditLogId(102L)
                .transitionedAt(LocalDateTime.now())
                .build();
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));
            when(userLifecycleService.cancelWithdrawal(eq(USER_ID), any(Actor.class)))
                    .thenReturn(result);

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.cancelWithdrawal(session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            Map<String, Object> body = response.getBody().getData();
            assertThat(body.get("lifecycleState")).isEqualTo("ACTIVE");
            verify(userLifecycleService, times(1))
                    .cancelWithdrawal(eq(USER_ID), any(Actor.class));
        }
    }

    @Test
    @DisplayName("cancel: WITHDRAWAL_PENDING 가 아니면 409 + 전이 호출 없음")
    void cancel_notPending_returns409() {
        currentUser.setLifecycleState(LifecycleState.ACTIVE);
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.cancelWithdrawal(session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            verify(userLifecycleService, never())
                    .cancelWithdrawal(anyLong(), any(Actor.class));
        }
    }

    // ---------- GET /status ----------

    @Test
    @DisplayName("status: ACTIVE 상태 — cancellable=false, expiresAt=null")
    void status_active() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));

            ResponseEntity<ApiResponse<WithdrawalStatusDto>> response =
                    controller.getStatus(session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            WithdrawalStatusDto dto = response.getBody().getData();
            assertThat(dto.getLifecycleState()).isEqualTo(LifecycleState.ACTIVE);
            assertThat(dto.isCancellable()).isFalse();
            assertThat(dto.getWithdrawalRequestedAt()).isNull();
            assertThat(dto.getWithdrawalExpiresAt()).isNull();
        }
    }

    @Test
    @DisplayName("status: WITHDRAWAL_PENDING — cancellable=true, expiresAt = requestedAt + 30일")
    void status_withdrawalPending() {
        LocalDateTime requestedAt = LocalDateTime.now().minusDays(5);
        currentUser.setLifecycleState(LifecycleState.WITHDRAWAL_PENDING);
        currentUser.setWithdrawalRequestedAt(requestedAt);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));

            ResponseEntity<ApiResponse<WithdrawalStatusDto>> response =
                    controller.getStatus(session);

            WithdrawalStatusDto dto = response.getBody().getData();
            assertThat(dto.isCancellable()).isTrue();
            assertThat(dto.getWithdrawalRequestedAt()).isEqualTo(requestedAt);
            assertThat(dto.getWithdrawalExpiresAt())
                    .isEqualTo(requestedAt.plusDays(
                            UserWithdrawalController.WITHDRAWAL_GRACE_PERIOD_DAYS));
        }
    }

    @Test
    @DisplayName("status: SUSPENDED 등 다른 상태는 cancellable=false")
    void status_suspended_notCancellable() {
        currentUser.setLifecycleState(LifecycleState.SUSPENDED);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));

            ResponseEntity<ApiResponse<WithdrawalStatusDto>> response =
                    controller.getStatus(session);

            WithdrawalStatusDto dto = response.getBody().getData();
            assertThat(dto.isCancellable()).isFalse();
        }
    }

    @Test
    @DisplayName("WITHDRAWAL_GRACE_PERIOD_DAYS 상수는 30 (Q3)")
    void grace_period_constant() {
        assertThat(UserWithdrawalController.WITHDRAWAL_GRACE_PERIOD_DAYS).isEqualTo(30);
    }
}
