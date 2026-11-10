package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
import com.coresolution.consultation.dto.lifecycle.WithdrawalOptions;
import com.coresolution.consultation.dto.lifecycle.WithdrawalRequestDto;
import com.coresolution.consultation.dto.lifecycle.WithdrawalStatusDto;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.UserLifecycleService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.security.PasswordService;

import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
        TenantContextHolder.setTenantId(TENANT_ID);
        currentUser = new User();
        currentUser.setId(USER_ID);
        currentUser.setTenantId(TENANT_ID);
        currentUser.setEmail("user@example.com");
        currentUser.setPassword("encoded-pw");
        currentUser.setRole(UserRole.CLIENT);
        currentUser.setLifecycleState(LifecycleState.ACTIVE);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    // ---------- POST /request ----------

    @Test
    @DisplayName("request: 비밀번호 일치 + ACTIVE → WITHDRAWAL_PENDING 전이 + 만료 시각 노출")
    void request_success() {
        WithdrawalRequestDto req = new WithdrawalRequestDto("plain-pw", "이유", null, null);
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
            when(userLifecycleService.requestWithdrawal(
                    eq(USER_ID), any(Actor.class), any(WithdrawalOptions.class)))
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
            assertThat(body.get("deleteCommunityBody")).isEqualTo(false);
            verify(userLifecycleService, times(1))
                    .requestWithdrawal(eq(USER_ID), any(Actor.class), any(WithdrawalOptions.class));
        }
    }

    @Test
    @DisplayName("request: 비밀번호 불일치 시 401 + 전이 호출 없음")
    void request_passwordMismatch_returns401() {
        WithdrawalRequestDto req = new WithdrawalRequestDto("wrong-pw", null, null, null);
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));
            when(passwordService.matches(anyString(), anyString())).thenReturn(false);

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.requestWithdrawal(session, req);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
            verify(userLifecycleService, never())
                    .requestWithdrawal(anyLong(), any(Actor.class), any(WithdrawalOptions.class));
        }
    }

    @Test
    @DisplayName("request: 소셜(appleSub) + confirmPhrase=DELETE → 비밀번호 없이 탈퇴 신청")
    void request_socialConfirmPhrase_success() {
        currentUser.setAppleSub("001234.apple-sub");
        currentUser.setPassword("temp-unknown");
        WithdrawalRequestDto req = new WithdrawalRequestDto(
                null, "SIWA leave", null, UserWithdrawalController.SOCIAL_CONFIRM_PHRASE);
        TransitionResult result = TransitionResult.builder()
                .userId(USER_ID)
                .fromState(LifecycleState.ACTIVE)
                .toState(LifecycleState.WITHDRAWAL_PENDING)
                .transitionedAt(LocalDateTime.now())
                .build();
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));
            when(userLifecycleService.requestWithdrawal(
                    eq(USER_ID), any(Actor.class), any(WithdrawalOptions.class)))
                    .thenReturn(result);

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.requestWithdrawal(session, req);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(passwordService, never()).matches(anyString(), anyString());
            verify(userLifecycleService).requestWithdrawal(
                    eq(USER_ID), any(Actor.class), any(WithdrawalOptions.class));
        }
    }

    @Test
    @DisplayName("request: 소셜(socialProvider) + 잘못된 confirmPhrase → 401")
    void request_socialConfirmPhrase_mismatch_returns401() {
        currentUser.setSocialProvider("KAKAO");
        WithdrawalRequestDto req = new WithdrawalRequestDto(null, null, null, "delete");
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.requestWithdrawal(session, req);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
            verify(userLifecycleService, never())
                    .requestWithdrawal(anyLong(), any(Actor.class), any(WithdrawalOptions.class));
        }
    }

    @Test
    @DisplayName("request: password·confirmPhrase 모두 공백 → 400")
    void request_bothBlank_returns400() {
        WithdrawalRequestDto req = new WithdrawalRequestDto("  ", null, null, "");
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.requestWithdrawal(session, req);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            verify(userLifecycleService, never())
                    .requestWithdrawal(anyLong(), any(Actor.class), any(WithdrawalOptions.class));
        }
    }

    @Test
    @DisplayName("request: 비소셜 + password 공백 + confirmPhrase만 → 400")
    void request_credentialUser_confirmOnly_returns400() {
        WithdrawalRequestDto req = new WithdrawalRequestDto(
                null, null, null, UserWithdrawalController.SOCIAL_CONFIRM_PHRASE);
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.requestWithdrawal(session, req);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            verify(userLifecycleService, never())
                    .requestWithdrawal(anyLong(), any(Actor.class), any(WithdrawalOptions.class));
        }
    }

    @Test
    @DisplayName("request: 테넌트 컨텍스트 공백 → IllegalStateException (fail-closed)")
    void request_blankTenantContext_throws() {
        TenantContextHolder.clear();
        WithdrawalRequestDto req = new WithdrawalRequestDto("plain-pw", null, null, null);
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));

            assertThatThrownBy(() -> controller.requestWithdrawal(session, req))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("테넌트 컨텍스트");
            verify(userLifecycleService, never())
                    .requestWithdrawal(anyLong(), any(Actor.class), any(WithdrawalOptions.class));
        }
    }

    @Test
    @DisplayName("request: user.tenantId 공백 → IllegalStateException (fail-closed)")
    void request_blankUserTenant_throws() {
        currentUser.setTenantId("  ");
        WithdrawalRequestDto req = new WithdrawalRequestDto("plain-pw", null, null, null);
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));

            assertThatThrownBy(() -> controller.requestWithdrawal(session, req))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("사용자 테넌트");
        }
    }

    @Test
    @DisplayName("request Q12-b: deleteCommunityBody=true → WithdrawalOptions.of(true) 위임")
    void request_deleteCommunityBody_true_passesOption() {
        WithdrawalRequestDto req = new WithdrawalRequestDto("plain-pw", "사유", Boolean.TRUE, null);
        TransitionResult result = TransitionResult.builder()
                .userId(USER_ID)
                .fromState(LifecycleState.ACTIVE)
                .toState(LifecycleState.WITHDRAWAL_PENDING)
                .auditLogId(111L)
                .transitionedAt(LocalDateTime.now())
                .build();
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));
            when(passwordService.matches("plain-pw", "encoded-pw")).thenReturn(true);
            when(userLifecycleService.requestWithdrawal(
                    eq(USER_ID), any(Actor.class), any(WithdrawalOptions.class)))
                    .thenReturn(result);

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.requestWithdrawal(session, req);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            Map<String, Object> body = response.getBody().getData();
            assertThat(body.get("deleteCommunityBody")).isEqualTo(true);

            ArgumentCaptor<WithdrawalOptions> optionsCaptor =
                    ArgumentCaptor.forClass(WithdrawalOptions.class);
            verify(userLifecycleService).requestWithdrawal(
                    eq(USER_ID), any(Actor.class), optionsCaptor.capture());
            assertThat(optionsCaptor.getValue().isDeleteCommunityBody()).isTrue();
        }
    }

    @Test
    @DisplayName("request Q12-b: deleteCommunityBody=false → WithdrawalOptions.defaults() 위임")
    void request_deleteCommunityBody_false_passesDefaults() {
        WithdrawalRequestDto req = new WithdrawalRequestDto("plain-pw", "사유", Boolean.FALSE, null);
        TransitionResult result = TransitionResult.builder()
                .userId(USER_ID)
                .fromState(LifecycleState.ACTIVE)
                .toState(LifecycleState.WITHDRAWAL_PENDING)
                .transitionedAt(LocalDateTime.now())
                .build();
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));
            when(passwordService.matches("plain-pw", "encoded-pw")).thenReturn(true);
            when(userLifecycleService.requestWithdrawal(
                    eq(USER_ID), any(Actor.class), any(WithdrawalOptions.class)))
                    .thenReturn(result);

            controller.requestWithdrawal(session, req);

            ArgumentCaptor<WithdrawalOptions> optionsCaptor =
                    ArgumentCaptor.forClass(WithdrawalOptions.class);
            verify(userLifecycleService).requestWithdrawal(
                    eq(USER_ID), any(Actor.class), optionsCaptor.capture());
            assertThat(optionsCaptor.getValue().isDeleteCommunityBody()).isFalse();
        }
    }

    @Test
    @DisplayName("request Q12-b: deleteCommunityBody=null (페이로드 누락) → false 기본값")
    void request_deleteCommunityBody_null_defaultsToFalse() {
        WithdrawalRequestDto req = new WithdrawalRequestDto("plain-pw", null, null, null);
        TransitionResult result = TransitionResult.builder()
                .userId(USER_ID)
                .fromState(LifecycleState.ACTIVE)
                .toState(LifecycleState.WITHDRAWAL_PENDING)
                .transitionedAt(LocalDateTime.now())
                .build();
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(currentUser);
            when(userService.findById(USER_ID)).thenReturn(Optional.of(currentUser));
            when(passwordService.matches("plain-pw", "encoded-pw")).thenReturn(true);
            when(userLifecycleService.requestWithdrawal(
                    eq(USER_ID), any(Actor.class), any(WithdrawalOptions.class)))
                    .thenReturn(result);

            controller.requestWithdrawal(session, req);

            ArgumentCaptor<WithdrawalOptions> optionsCaptor =
                    ArgumentCaptor.forClass(WithdrawalOptions.class);
            verify(userLifecycleService).requestWithdrawal(
                    eq(USER_ID), any(Actor.class), optionsCaptor.capture());
            assertThat(optionsCaptor.getValue().isDeleteCommunityBody()).isFalse();
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
