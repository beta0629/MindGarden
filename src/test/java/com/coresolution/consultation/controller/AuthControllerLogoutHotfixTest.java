package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.OtpDeliveryService;
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.SmsOtpVerificationService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.service.PermissionGroupService;
import com.coresolution.core.service.UserRoleQueryService;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * AuthController 정상 로그아웃 hotfix 단위 테스트.
 *
 * <p>회귀 배경 — PR #293 ({@code checkDuplicateLogin} 이 {@code user_sessions} OR
 * {@code refresh_token_store} 둘 다 검사) 와 PR #295 ({@code cleanupUserSessions} SSOT 에
 * {@code refresh_token} revoke 통합) 사이의 비대칭. 정상 logout 경로가
 * {@code user_sessions} 만 비활성화하고 {@code refresh_token_store} 를 남겨두면
 * 즉시 재로그인 시 "다른 곳에서 로그인" 모달이 잔존한다.
 *
 * <p>시나리오:
 * <ul>
 *   <li>L1 — 로그인 사용자 logout 시 {@code authService.cleanupUserSessions} 가
 *           {@code END_REASON_LOGOUT} 로 호출되어 refresh_token 까지 revoke 위임</li>
 *   <li>L2 — 미인증 세션 logout 시 {@code cleanupUserSessions} 호출 금지 (NPE/회귀 가드)</li>
 *   <li>L3 — 호출 순서: {@code logoutSession → cleanupUserSessions → session.invalidate}</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-13
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthController — 정상 로그아웃 hotfix (refresh_token SSOT 정합)")
class AuthControllerLogoutHotfixTest {

    private static final String TENANT_ID = UUID.randomUUID().toString();
    private static final String LOGIN_PRINCIPAL = "tester@example.com";
    private static final String SESSION_ID = "session-logout-xyz";
    private static final Long USER_PK = 21L;

    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private UserRepository userRepository;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private AuthService authService;
    @Mock private BranchService branchService;
    @Mock private UserSessionService userSessionService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private UserService userService;
    @Mock private UserRoleQueryService userRoleQueryService;
    @Mock private TenantRoleRepository tenantRoleRepository;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private PermissionGroupService permissionGroupService;
    @Mock private Environment environment;
    @Mock private JwtService jwtService;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private SmsOtpVerificationService smsOtpVerificationService;
    @Mock private OtpDeliveryService otpDeliveryService;

    @Mock private HttpSession session;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        lenient().when(session.getId()).thenReturn(SESSION_ID);
        // SecurityContext 잔존 방지 — SessionUtils.getCurrentUser fallback 으로 SecurityContext
        // 를 조회하므로 테스트 간 격리를 위해 명시적으로 초기화한다.
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ---------------------------------------------------------------- //
    // L1 — 정상 로그아웃 시 refresh_token 까지 revoke 위임
    // ---------------------------------------------------------------- //

    @Test
    @DisplayName("L1 — 로그인 사용자 logout 시 cleanupUserSessions(END_REASON_LOGOUT) 호출")
    void logout_invokesCleanupUserSessionsForLoggedInUser() {
        // given — 세션에 인증 사용자가 들어있는 정상 로그인 상태
        User loggedInUser = userEntity();
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(loggedInUser);

        // when
        ResponseEntity<ApiResponse<Void>> response = authController.logout(session);

        // then — 응답은 항상 200 (로그아웃은 실패해도 성공으로 처리되는 기존 정책 유지)
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();

        // P1 hotfix — 정상 logout 경로도 SSOT (cleanupUserSessions) 를 거쳐야
        // refresh_token_store 까지 revoke 된다. (PR #295 비대칭 회귀 해소)
        verify(authService).cleanupUserSessions(eq(loggedInUser),
            eq(SessionManagementConstants.END_REASON_LOGOUT));
    }

    @Test
    @DisplayName("L1-a — 컨트롤러는 refreshTokenService 를 직접 호출하지 않고 authService 에 위임")
    void logout_doesNotCallRefreshTokenServiceDirectly() {
        User loggedInUser = userEntity();
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(loggedInUser);

        authController.logout(session);

        // SSOT 위반 가드 — refresh_token revoke 는 AuthServiceImpl.cleanupUserSessions
        // 안에서만 수행되어야 하며, 컨트롤러가 RefreshTokenService 를 직접 호출하면 안 된다.
        verify(refreshTokenService, never()).revokeAllUserTokens(anyLong());
        verify(refreshTokenService, never()).revokeRefreshToken(anyString());
    }

    // ---------------------------------------------------------------- //
    // L2 — 미인증 세션 (logoutUser == null) 가드
    // ---------------------------------------------------------------- //

    @Test
    @DisplayName("L2 — 미인증 세션 logout 시 cleanupUserSessions 호출 금지 (NPE 가드)")
    void logout_skipsCleanupWhenUserMissing() {
        // given — 세션에 사용자 정보 없음 (예: 이미 만료/직접 호출 시나리오)
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(null);

        // when
        ResponseEntity<ApiResponse<Void>> response = authController.logout(session);

        // then — 정상 응답은 유지되지만 사용자 식별 불가 → SSOT 호출 금지
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(authService, never()).cleanupUserSessions(any(User.class), anyString());
    }

    // ---------------------------------------------------------------- //
    // L3 — 호출 순서 회귀 가드
    // ---------------------------------------------------------------- //

    @Test
    @DisplayName("L3 — 호출 순서: logoutSession → cleanupUserSessions → session.invalidate")
    void logout_invokesInExpectedOrder() {
        User loggedInUser = userEntity();
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(loggedInUser);

        authController.logout(session);

        // 순서 보장 — refresh_token revoke 는 HTTP 세션 무효화 이전에 완료되어야 한다.
        // (세션 무효화 후에는 SessionUtils.getCurrentUser 가 null 을 반환할 수 있음)
        InOrder order = inOrder(authService, session);
        order.verify(authService).logoutSession(SESSION_ID);
        order.verify(authService).cleanupUserSessions(eq(loggedInUser),
            eq(SessionManagementConstants.END_REASON_LOGOUT));
        order.verify(session).invalidate();
    }

    // ---------------------------------------------------------------- //
    // 테스트 fixture
    // ---------------------------------------------------------------- //

    private static User userEntity() {
        User user = User.builder()
            .userId("u-" + USER_PK)
            .email(LOGIN_PRINCIPAL)
            .name("로그아웃테스터")
            .role(UserRole.CLIENT)
            .isActive(true)
            .isPasswordChanged(true)
            .build();
        user.setId(USER_PK);
        user.setTenantId(TENANT_ID);
        return user;
    }
}
