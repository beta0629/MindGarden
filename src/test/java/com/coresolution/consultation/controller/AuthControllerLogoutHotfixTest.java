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

import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.auth.CurrentSessionCredentials;
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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * AuthController 정상 로그아웃 — 현재 세션만 종료.
 *
 * <p>배경: 동시 로그인이 허용된 계정에서 한 세션의 로그아웃이 계정 전체 세션·refresh 토큰을 폐기해
 * 다른 기기가 401 + refresh 실패로 튕기던 문제. 로그아웃은 {@code authService.terminateCurrentSession} 에
 * 현재 요청의 세션 식별 정보(DB 세션 ID, Bearer Access JWT, 선택 본문 Refresh JWT)만 넘긴다.
 * 계정 전체 종료({@code terminateAllSessionsForUser})는 관리자 강제 로그아웃 전용.</p>
 *
 * <p>시나리오:
 * <ul>
 *   <li>L1 — 로그인 사용자 logout 시 {@code terminateCurrentSession(END_REASON_LOGOUT)} 호출,
 *           계정 전체 종료·테넌트 일괄 비활성화는 호출하지 않음</li>
 *   <li>L2 — 미인증 세션 logout 시 {@code terminateCurrentSession} 호출 금지 (NPE/회귀 가드)</li>
 *   <li>L3 — 호출 순서: {@code logoutSession → terminateCurrentSession → session.invalidate}</li>
 *   <li>L4 — 본문 refreshToken·DB 세션 ID 속성 전달</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-13
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthController — 로그아웃은 현재 세션만 종료")
class AuthControllerLogoutHotfixTest {

    private static final String TENANT_ID = UUID.randomUUID().toString();
    private static final String LOGIN_PRINCIPAL = "tester@example.com";
    private static final String SESSION_ID = "session-logout-xyz";
    private static final Long USER_PK = 21L;
    private static final String ACCESS_TOKEN = "current.access.jwt";
    private static final String REFRESH_TOKEN = "current.refresh.jwt";

    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private UserRepository userRepository;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private AuthService authService;
    @Mock private BranchService branchService;
    @Mock private UserSessionService userSessionService;
    @Mock private com.coresolution.consultation.service.SystemConfigService systemConfigService;
    @Mock private com.coresolution.consultation.service.SessionSecurityPolicyService sessionSecurityPolicyService;
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
    @Mock private com.coresolution.consultation.config.SessionCookieSupport sessionCookieSupport;
    @Mock private com.coresolution.consultation.service.ClientProfilePhoneVerificationService
            clientProfilePhoneVerificationService;

    @Mock private HttpSession session;
    @Mock private HttpServletRequest httpRequest;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        lenient().when(session.getId()).thenReturn(SESSION_ID);
        lenient().when(httpRequest.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer " + ACCESS_TOKEN);
        // SecurityContext 잔존 방지 — SessionUtils.getCurrentUser fallback 으로 SecurityContext
        // 를 조회하므로 테스트 간 격리를 위해 명시적으로 초기화한다.
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ---------------------------------------------------------------- //
    // L1 — 정상 로그아웃은 현재 세션만 종료
    // ---------------------------------------------------------------- //

    @Test
    @DisplayName("L1 — 로그인 사용자 logout 시 terminateCurrentSession(END_REASON_LOGOUT) 만 호출")
    void logout_terminatesOnlyCurrentSession() {
        User loggedInUser = userEntity();
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(loggedInUser);

        ResponseEntity<ApiResponse<Void>> response = authController.logout(session, httpRequest, null);

        // 응답은 항상 200 (로그아웃은 실패해도 성공으로 처리되는 기존 정책 유지)
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();

        ArgumentCaptor<CurrentSessionCredentials> captor = ArgumentCaptor.forClass(CurrentSessionCredentials.class);
        verify(authService).terminateCurrentSession(eq(loggedInUser), captor.capture(),
            eq(SessionManagementConstants.END_REASON_LOGOUT));
        assertThat(captor.getValue().getSessionId()).isEqualTo(SESSION_ID);
        assertThat(captor.getValue().getAccessToken()).isEqualTo(ACCESS_TOKEN);
        assertThat(captor.getValue().getRefreshToken()).isNull();

        // 동일 계정 다른 세션 보호 — 계정 전체 종료·테넌트 일괄 비활성화 금지
        verify(authService, never()).terminateAllSessionsForUser(any(User.class), anyString());
        verify(userSessionService, never()).deactivateAllSessionsForTenantUser(anyString(), anyLong(), anyString());
    }

    @Test
    @DisplayName("L1-a — 컨트롤러는 refreshTokenService 를 직접 호출하지 않고 authService 에 위임")
    void logout_doesNotCallRefreshTokenServiceDirectly() {
        User loggedInUser = userEntity();
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(loggedInUser);

        authController.logout(session, httpRequest, null);

        verify(refreshTokenService, never()).revokeAllUserTokens(anyLong());
        verify(refreshTokenService, never()).revokeRefreshToken(anyString());
    }

    // ---------------------------------------------------------------- //
    // L2 — 미인증 세션 (logoutUser == null) 가드
    // ---------------------------------------------------------------- //

    @Test
    @DisplayName("L2 — 미인증 세션 logout 시 terminateCurrentSession 호출 금지 (NPE 가드)")
    void logout_skipsTerminationWhenUserMissing() {
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(null);

        ResponseEntity<ApiResponse<Void>> response = authController.logout(session, httpRequest, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(authService, never()).terminateCurrentSession(any(User.class), any(), anyString());
        verify(authService, never()).terminateAllSessionsForUser(any(User.class), anyString());
    }

    // ---------------------------------------------------------------- //
    // L3 — 호출 순서 회귀 가드
    // ---------------------------------------------------------------- //

    @Test
    @DisplayName("L3 — 호출 순서: logoutSession → terminateCurrentSession → session.invalidate")
    void logout_invokesInExpectedOrder() {
        User loggedInUser = userEntity();
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(loggedInUser);

        authController.logout(session, httpRequest, null);

        // 토큰 폐기는 HTTP 세션 무효화 이전에 완료되어야 한다.
        InOrder order = inOrder(authService, session);
        order.verify(authService).logoutSession(SESSION_ID);
        order.verify(authService).terminateCurrentSession(eq(loggedInUser), any(CurrentSessionCredentials.class),
            eq(SessionManagementConstants.END_REASON_LOGOUT));
        order.verify(session).invalidate();
    }

    // ---------------------------------------------------------------- //
    // L4 — 본문 refreshToken · DB 세션 ID 전달
    // ---------------------------------------------------------------- //

    @Test
    @DisplayName("L4 — 본문 refreshToken 과 세션 속성 DB sessionId 를 현재 세션 식별 정보로 전달")
    void logout_passesPresentedRefreshTokenAndDbSessionId() {
        User loggedInUser = userEntity();
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(loggedInUser);
        when(session.getAttribute(SessionConstants.SESSION_ID)).thenReturn("db-session-1");

        authController.logout(session, httpRequest, Map.of("refreshToken", REFRESH_TOKEN));

        ArgumentCaptor<CurrentSessionCredentials> captor = ArgumentCaptor.forClass(CurrentSessionCredentials.class);
        verify(authService).terminateCurrentSession(eq(loggedInUser), captor.capture(),
            eq(SessionManagementConstants.END_REASON_LOGOUT));
        assertThat(captor.getValue().getSessionId()).isEqualTo("db-session-1");
        assertThat(captor.getValue().getRefreshToken()).isEqualTo(REFRESH_TOKEN);
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
