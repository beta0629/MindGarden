package com.coresolution.consultation.config.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.controller.AdminSessionForceLogoutController;
import com.coresolution.consultation.dto.auth.AdminForceLogoutRequest;
import com.coresolution.consultation.dto.auth.CurrentSessionCredentials;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AuthTokenRevocationService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.service.impl.AuthServiceImpl;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 동일 계정 다중 세션 — 현재 세션 로그아웃 vs 계정 전체 종료 시나리오.
 *
 * <p>실제 {@link JwtService}(서명·sid 연결)·{@link JwtAuthenticationFilter}·{@link AuthTokenRevocationService}
 * (Redis 없음 → 로컬 저장소)와 {@link AuthServiceImpl} 을 연결하고, DB 계층만 mock 한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@DisplayName("현재 세션 로그아웃 시나리오 — 동일 계정 다른 세션 유지")
class CurrentSessionLogoutScenarioTest {

    private static final String TENANT = "tenant-multi-session";
    private static final String USER_ID = "user-multi-1";
    private static final String EMAIL = "multi@example.com";
    private static final Long USER_PK = 77L;
    private static final String PROTECTED_PATH = "/api/v1/clients/me";

    private JwtService jwtService;
    private JwtAuthenticationFilter filter;
    private AuthServiceImpl authService;
    private UserRepository userRepository;
    private RefreshTokenService refreshTokenService;
    private UserSessionService userSessionService;
    private User user;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", Base64.getEncoder().encodeToString(new byte[32]));
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3_600_000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604_800_000L);

        ObjectProvider<StringRedisTemplate> noRedis = mock(ObjectProvider.class);
        AuthTokenRevocationService revocationService = new AuthTokenRevocationService(noRedis);

        user = User.builder()
            .userId(USER_ID)
            .email(EMAIL)
            .role(UserRole.CLIENT)
            .isActive(true)
            .isPasswordChanged(true)
            .lifecycleState(LifecycleState.ACTIVE)
            .build();
        user.setId(USER_PK);
        user.setTenantId(TENANT);

        userRepository = mock(UserRepository.class);
        when(userRepository.findByTenantIdAndUserId(TENANT, USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.updateTokensInvalidatedAt(eq(USER_PK), eq(TENANT), any(LocalDateTime.class)))
            .thenAnswer(inv -> {
                user.setTokensInvalidatedAt(inv.getArgument(2));
                return 1;
            });

        refreshTokenService = mock(RefreshTokenService.class);
        lenient().when(refreshTokenService.findByTokenId(anyString())).thenReturn(Optional.empty());
        userSessionService = mock(UserSessionService.class);
        UserDetailsService userDetailsService = mock(UserDetailsService.class);
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(USER_ID);
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(userDetails);
        DynamicPermissionService dynamicPermissionService = mock(DynamicPermissionService.class);
        when(dynamicPermissionService.getUserPermissionsAsStringList(any(User.class)))
            .thenReturn(Collections.emptyList());

        filter = new JwtAuthenticationFilter(jwtService, mock(UserService.class), userRepository, null,
            revocationService);

        authService = new AuthServiceImpl();
        ReflectionTestUtils.setField(authService, "jwtService", jwtService);
        ReflectionTestUtils.setField(authService, "userRepository", userRepository);
        ReflectionTestUtils.setField(authService, "refreshTokenService", refreshTokenService);
        ReflectionTestUtils.setField(authService, "userSessionService", userSessionService);
        ReflectionTestUtils.setField(authService, "userDetailsService", userDetailsService);
        ReflectionTestUtils.setField(authService, "dynamicPermissionService", dynamicPermissionService);
        ReflectionTestUtils.setField(authService, "authTokenRevocationService", revocationService);
        ReflectionTestUtils.setField(authService, "refreshExpirationMs", 604_800_000L);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("A 로그아웃 → B 는 200(인증 유지·refresh 성공), A 는 401(Access 거부·refresh 실패)")
    void logoutOfSessionA_keepsSessionB() {
        TokenPair sessionA = login();
        TokenPair sessionB = login();

        authService.terminateCurrentSession(user, CurrentSessionCredentials.builder()
                .sessionId("http-session-A")
                .accessToken(sessionA.accessToken())
                .build(),
            SessionManagementConstants.END_REASON_LOGOUT);

        assertThat(isAuthenticated(sessionB.accessToken())).isTrue();
        assertThat(isAuthenticated(sessionA.accessToken())).isFalse();
        assertThat(authService.refreshToken(sessionB.refreshToken(), null).isSuccess()).isTrue();
        assertThat(authService.refreshToken(sessionA.refreshToken(), null).isSuccess()).isFalse();

        verify(userSessionService).deactivateSessionForTenant(TENANT, "http-session-A",
            SessionManagementConstants.END_REASON_LOGOUT);
        verify(userSessionService, never()).deactivateAllSessionsForTenantUser(anyString(), anyLong(), anyString());
        verify(refreshTokenService, never()).revokeAllUserTokens(anyLong());
        verify(userRepository, never()).updateTokensInvalidatedAt(anyLong(), anyString(), any());
    }

    @Test
    @DisplayName("B 가 다시 로그인(lastLoginAt 갱신)해도 A 의 기존 토큰은 401 이 아니다")
    void newLoginElsewhere_doesNotInvalidateExistingSession() {
        TokenPair sessionA = login();
        login();

        TokenPair sessionBAgain = login();
        user.setLastLoginAt(LocalDateTime.now().plusSeconds(5));

        assertThat(isAuthenticated(sessionA.accessToken())).isTrue();
        assertThat(isAuthenticated(sessionBAgain.accessToken())).isTrue();
        assertThat(authService.refreshToken(sessionA.refreshToken(), null).isSuccess()).isTrue();
    }

    @Test
    @DisplayName("관리자 강제 로그아웃 → A·B 모두 401, refresh 실패 / 이후 새 로그인은 허용")
    void adminForceLogout_terminatesAllSessions() throws InterruptedException {
        TokenPair sessionA = login();
        TokenPair sessionB = login();
        waitForNextSecond();

        authService.terminateAllSessionsForUser(user, SessionManagementConstants.END_REASON_ADMIN_FORCE);

        assertThat(isAuthenticated(sessionA.accessToken())).isFalse();
        assertThat(isAuthenticated(sessionB.accessToken())).isFalse();
        assertThat(authService.refreshToken(sessionA.refreshToken(), null).isSuccess()).isFalse();
        assertThat(authService.refreshToken(sessionB.refreshToken(), null).isSuccess()).isFalse();
        verify(refreshTokenService).revokeAllUserTokens(USER_PK);

        TokenPair afterForceLogout = login();
        assertThat(isAuthenticated(afterForceLogout.accessToken())).isTrue();
    }

    @Test
    @DisplayName("동일 테넌트 관리자 API 강제 로그아웃 → A·B 모두 401, refresh 실패, tokens_invalidated_at 기록")
    void adminForceLogoutEndpoint_sameTenant_terminatesAllSessions() throws InterruptedException {
        TokenPair sessionA = login();
        TokenPair sessionB = login();
        waitForNextSecond();

        User admin = User.builder().email("admin@example.com").role(UserRole.ADMIN).build();
        admin.setId(1L);
        admin.setTenantId(TENANT);
        HttpSession adminSession = new MockHttpSession();
        adminSession.setAttribute(SessionConstants.USER_OBJECT, admin);
        when(userRepository.findAllByTenantIdAndEmail(TENANT, EMAIL)).thenReturn(List.of(user));
        AdminSessionForceLogoutController controller = new AdminSessionForceLogoutController(userRepository,
            authService);

        ResponseEntity<ApiResponse<Void>> response = controller.forceLogout(
            AdminForceLogoutRequest.builder().email(EMAIL).build(), adminSession);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(isAuthenticated(sessionA.accessToken())).isFalse();
        assertThat(isAuthenticated(sessionB.accessToken())).isFalse();
        assertThat(authService.refreshToken(sessionA.refreshToken(), null).isSuccess()).isFalse();
        assertThat(authService.refreshToken(sessionB.refreshToken(), null).isSuccess()).isFalse();
        assertThat(user.getTokensInvalidatedAt()).isNotNull();
        verify(userSessionService).deactivateAllSessionsForTenantUser(TENANT, USER_PK,
            SessionManagementConstants.END_REASON_ADMIN_FORCE);
        verify(refreshTokenService).revokeAllUserTokens(USER_PK);
    }

    @Test
    @DisplayName("다른 테넌트 관리자 API 강제 로그아웃 → 403, 대상 세션 유지")
    void adminForceLogoutEndpoint_otherTenant_keepsSessions() {
        TokenPair sessionA = login();

        User otherAdmin = User.builder().email("other-admin@example.com").role(UserRole.ADMIN).build();
        otherAdmin.setId(2L);
        otherAdmin.setTenantId(TENANT + "-other");
        HttpSession adminSession = new MockHttpSession();
        adminSession.setAttribute(SessionConstants.USER_OBJECT, otherAdmin);
        AdminSessionForceLogoutController controller = new AdminSessionForceLogoutController(userRepository,
            authService);

        ResponseEntity<ApiResponse<Void>> response = controller.forceLogout(
            AdminForceLogoutRequest.builder().email(EMAIL).build(), adminSession);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(isAuthenticated(sessionA.accessToken())).isTrue();
        assertThat(authService.refreshToken(sessionA.refreshToken(), null).isSuccess()).isTrue();
        verify(userSessionService, never()).deactivateAllSessionsForTenantUser(anyString(), anyLong(), anyString());
        verify(refreshTokenService, never()).revokeAllUserTokens(anyLong());
        verify(userRepository, never()).updateTokensInvalidatedAt(anyLong(), anyString(), any());
    }

    @Test
    @DisplayName("중복 로그인 확인(종료 확인) 경로 → 현재 요청 세션만 종료, 다른 세션 토큰 유지")
    void terminationConfirm_endsOnlyCurrentSession() {
        TokenPair sessionA = login();
        TokenPair sessionB = login();

        authService.terminateCurrentSession(user, CurrentSessionCredentials.builder()
                .sessionId("http-session-confirm")
                .build(),
            SessionManagementConstants.END_REASON_USER_CONFIRMED_TERMINATE);

        assertThat(isAuthenticated(sessionA.accessToken())).isTrue();
        assertThat(isAuthenticated(sessionB.accessToken())).isTrue();
        assertThat(authService.refreshToken(sessionA.refreshToken(), null).isSuccess()).isTrue();
        verify(userSessionService).deactivateSessionForTenant(TENANT, "http-session-confirm",
            SessionManagementConstants.END_REASON_USER_CONFIRMED_TERMINATE);
        verify(userSessionService, never()).deactivateAllSessionsForTenantUser(anyString(), anyLong(), anyString());
        verify(refreshTokenService, never()).revokeAllUserTokens(anyLong());
    }

    @Test
    @DisplayName("로그아웃 본문으로 받은 Refresh 토큰 1개만 폐기 (sid 연결 없이도)")
    void presentedRefreshToken_revokesOnlyThatToken() {
        TokenPair sessionA = login();
        TokenPair sessionB = login();

        authService.terminateCurrentSession(user, CurrentSessionCredentials.builder()
                .refreshToken(sessionA.refreshToken())
                .build(),
            SessionManagementConstants.END_REASON_LOGOUT);

        assertThat(authService.refreshToken(sessionA.refreshToken(), null).isSuccess()).isFalse();
        assertThat(authService.refreshToken(sessionB.refreshToken(), null).isSuccess()).isTrue();
    }

    @Test
    @DisplayName("같은 요청에서 발급한 Access sid 와 Refresh tokenId 가 같다 (세션 연결)")
    void issuedPairIsLinkedBySessionId() {
        TokenPair pair = login();

        String sid = jwtService.extractSessionId(pair.accessToken());
        assertThat(sid).isNotBlank();
        assertThat(jwtService.extractTokenId(pair.refreshToken())).isEqualTo(sid);
    }

    /** 로그인 요청 1회 — 같은 요청 컨텍스트에서 Access·Refresh 발급. */
    private TokenPair login() {
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(new MockHttpServletRequest()));
        try {
            String access = jwtService.generateToken(user, Collections.emptyList());
            String refresh = jwtService.generateRefreshToken(user);
            return new TokenPair(access, refresh);
        } finally {
            RequestContextHolder.resetRequestAttributes();
        }
    }

    private boolean isAuthenticated(String accessToken) {
        SecurityContextHolder.clearContext();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", PROTECTED_PATH);
        request.addHeader("Authorization", "Bearer " + accessToken);
        try {
            filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        boolean authenticated = SecurityContextHolder.getContext().getAuthentication() != null;
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        return authenticated;
    }

    /** JWT iat 는 초 단위 — 계정 기준 시각이 기존 토큰보다 엄격히 뒤가 되도록 다음 초까지 대기. */
    private static void waitForNextSecond() throws InterruptedException {
        long now = System.currentTimeMillis();
        Thread.sleep(1_000L - (now % 1_000L) + 5L);
    }

    private record TokenPair(String accessToken, String refreshToken) {
    }
}
