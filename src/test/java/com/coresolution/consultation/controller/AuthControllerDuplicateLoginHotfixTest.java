package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.dto.UserDto;
import com.coresolution.consultation.entity.RefreshToken;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * AuthController 중복 로그인 hotfix 통합 테스트 (silent skip A1).
 *
 * <p>시나리오:
 * <ul>
 *   <li>I1 — 웹 세션 상태에서 앱 로그인 → 모달 응답(400 + requiresConfirmation=true)</li>
 *   <li>I2 — 모달 클릭 (confirm-duplicate-login) → 신규 JWT 발급 + 응답 검증</li>
 *   <li>I3 — Expo 흐름 — confirm 응답에 accessToken/refreshToken 모두 존재 (Expo 가드 통과)</li>
 *   <li>I4 — 단일 로그인 (중복 없음) → 일반 /login 동작 + 토큰 발급 (회귀 없음)</li>
 *   <li>I5 — createRefreshToken 호출 시 HttpServletRequest 전달 검증 (메타데이터 NOT NULL 보장)</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-13
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthController — 중복 로그인 hotfix 통합 시나리오")
class AuthControllerDuplicateLoginHotfixTest {

    private static final String TENANT_ID = UUID.randomUUID().toString();
    private static final String LOGIN_PRINCIPAL = "tester@example.com";
    private static final String PASSWORD = "SecretPass1!";
    private static final String SESSION_ID = "session-xyz";
    private static final Long USER_PK = 11L;
    private static final String ISSUED_ACCESS_TOKEN = "issued-access-token";
    private static final String ISSUED_REFRESH_TOKEN = "issued-refresh-token";

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
    @Mock private HttpServletRequest httpRequest;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        when(session.getId()).thenReturn(SESSION_ID);
        lenient().when(httpRequest.getHeader("User-Agent"))
            .thenReturn("MindGardenMobile/1.0 (iPhone; iOS 17)");
        lenient().when(httpRequest.getHeader("X-Forwarded-For")).thenReturn("203.0.113.10");
        lenient().when(httpRequest.getHeader("X-Device-Id")).thenReturn("device-uuid-1");
        lenient().when(httpRequest.getRemoteAddr()).thenReturn("203.0.113.10");
        lenient().when(dynamicPermissionService.getUserPermissionsAsStringList(any(User.class)))
            .thenReturn(List.of("READ", "WRITE"));
        lenient().when(jwtService.generateToken(any(User.class), any())).thenReturn(ISSUED_ACCESS_TOKEN);
        lenient().when(jwtService.generateRefreshToken(any(User.class))).thenReturn(ISSUED_REFRESH_TOKEN);
        lenient().when(refreshTokenService.createRefreshToken(any(User.class), anyString(), any()))
            .thenReturn(mockRefreshToken());
    }

    // ---------------------------------------------------------------- //
    // I2 — confirm 분기에 JWT 발급 블록이 추가되었는지 검증
    // ---------------------------------------------------------------- //

    @Test
    @DisplayName("I2 — confirmDuplicateLogin 성공 응답에 accessToken/refreshToken 모두 포함")
    void confirmDuplicateLogin_includesJwtTokensInResponse() {
        // given — authService 가 토큰 null 로 성공 응답 반환 (AuthServiceImpl.authenticateWithSession 의 실제 동작)
        AuthResponse serviceResponse = AuthResponse.builder()
            .success(true)
            .message("로그인 성공")
            .token(null)
            .refreshToken(null)
            .user(userDto())
            .build();
        when(authService.authenticateWithSession(eq(LOGIN_PRINCIPAL), eq(PASSWORD),
                eq(SESSION_ID), anyString(), anyString()))
            .thenReturn(serviceResponse);
        when(userService.findByLoginPrincipal(LOGIN_PRINCIPAL))
            .thenReturn(Optional.of(userEntity()));

        // when
        Map<String, Object> request = new HashMap<>();
        request.put("email", LOGIN_PRINCIPAL);
        request.put("password", PASSWORD);
        request.put("confirmTerminate", Boolean.TRUE);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
            authController.confirmDuplicateLogin(request, session, httpRequest);

        // then — 컨트롤러 레벨에서 발급된 JWT 가 응답 body 에 포함되어야 함 (P0-2 hotfix)
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = response.getBody().getData();
        assertThat(data).isNotNull();
        assertThat(data.get("accessToken"))
            .as("P0-2: confirm 응답에 accessToken 필수 (Expo 가드 통과)")
            .isEqualTo(ISSUED_ACCESS_TOKEN);
        assertThat(data.get("refreshToken"))
            .as("P0-2: confirm 응답에 refreshToken 필수")
            .isEqualTo(ISSUED_REFRESH_TOKEN);
        assertThat(data.get("user")).isNotNull();
        assertThat(data.get("sessionId")).isEqualTo(SESSION_ID);
    }

    @Test
    @DisplayName("I5 — confirm 분기에서 createRefreshToken 호출 시 HttpServletRequest 전달 (메타데이터 NOT NULL)")
    void confirmDuplicateLogin_passesHttpRequestToRefreshTokenService() {
        AuthResponse serviceResponse = AuthResponse.builder()
            .success(true)
            .message("로그인 성공")
            .user(userDto())
            .build();
        when(authService.authenticateWithSession(anyString(), anyString(), anyString(), anyString(), anyString()))
            .thenReturn(serviceResponse);
        when(userService.findByLoginPrincipal(LOGIN_PRINCIPAL))
            .thenReturn(Optional.of(userEntity()));

        Map<String, Object> request = new HashMap<>();
        request.put("email", LOGIN_PRINCIPAL);
        request.put("password", PASSWORD);
        request.put("confirmTerminate", Boolean.TRUE);

        authController.confirmDuplicateLogin(request, session, httpRequest);

        ArgumentCaptor<HttpServletRequest> reqCaptor =
            ArgumentCaptor.forClass(HttpServletRequest.class);
        verify(refreshTokenService).createRefreshToken(any(User.class), eq(ISSUED_REFRESH_TOKEN),
            reqCaptor.capture());
        assertThat(reqCaptor.getValue())
            .as("P0-3: confirm 분기에서도 httpRequest 가 전달되어야 함 (null 금지)")
            .isSameAs(httpRequest);
    }

    @Test
    @DisplayName("U5 통합 — confirmTerminate=true 라도 refresh_token_store revoke 호출 0회 (silent skip 정책)")
    void confirmDuplicateLogin_silentSkipDoesNotRevokeRefreshTokens() {
        AuthResponse serviceResponse = AuthResponse.builder()
            .success(true)
            .message("로그인 성공")
            .user(userDto())
            .build();
        when(authService.authenticateWithSession(anyString(), anyString(), anyString(), anyString(), anyString()))
            .thenReturn(serviceResponse);
        when(userService.findByLoginPrincipal(LOGIN_PRINCIPAL))
            .thenReturn(Optional.of(userEntity()));

        Map<String, Object> request = new HashMap<>();
        request.put("email", LOGIN_PRINCIPAL);
        request.put("password", PASSWORD);
        request.put("confirmTerminate", Boolean.TRUE);

        authController.confirmDuplicateLogin(request, session, httpRequest);

        verify(refreshTokenService, never()).revokeAllUserTokens(anyLong());
        verify(refreshTokenService, never()).revokeRefreshToken(anyString());
        // user_sessions 정리는 호출되어야 함 (안전한 부수 효과)
        verify(authService).cleanupUserSessions(any(User.class), eq("USER_CONFIRMED_TERMINATE"));
    }

    // ---------------------------------------------------------------- //
    // I3 — Expo 가드 통과 시나리오: 응답에 토큰 3종(user + access + refresh) 모두 존재
    // ---------------------------------------------------------------- //

    @Test
    @DisplayName("I3 — confirm 응답이 Expo 인증 가드(user + accessToken + refreshToken) 를 통과")
    void confirmDuplicateLogin_satisfiesExpoAuthenticationGuard() {
        AuthResponse serviceResponse = AuthResponse.builder()
            .success(true)
            .message("로그인 성공")
            .user(userDto())
            .build();
        when(authService.authenticateWithSession(anyString(), anyString(), anyString(), anyString(), anyString()))
            .thenReturn(serviceResponse);
        when(userService.findByLoginPrincipal(LOGIN_PRINCIPAL))
            .thenReturn(Optional.of(userEntity()));

        Map<String, Object> request = new HashMap<>();
        request.put("email", LOGIN_PRINCIPAL);
        request.put("password", PASSWORD);
        request.put("confirmTerminate", Boolean.TRUE);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
            authController.confirmDuplicateLogin(request, session, httpRequest);
        Map<String, Object> data = response.getBody().getData();

        // Expo 가드: userRaw && accessToken && refreshToken — 세 키 모두 truthy 해야 fallback 분기 진입 안 함.
        assertThat(data.get("user")).isNotNull();
        assertThat((String) data.get("accessToken")).isNotBlank();
        assertThat((String) data.get("refreshToken")).isNotBlank();
    }

    private static UserDto userDto() {
        return UserDto.builder()
            .id(USER_PK)
            .email(LOGIN_PRINCIPAL)
            .name("테스트")
            .role(UserRole.CLIENT.getValue())
            .tenantId(TENANT_ID)
            .isActive(true)
            .build();
    }

    private static User userEntity() {
        User user = User.builder()
            .userId("u-" + USER_PK)
            .email(LOGIN_PRINCIPAL)
            .password("{bcrypt}$2a$10$0123456789012345678901x")
            .name("테스트")
            .role(UserRole.CLIENT)
            .isActive(true)
            .isPasswordChanged(true)
            .build();
        user.setId(USER_PK);
        user.setTenantId(TENANT_ID);
        return user;
    }

    private static RefreshToken mockRefreshToken() {
        return RefreshToken.builder()
            .tokenId("token-" + UUID.randomUUID())
            .userId(USER_PK)
            .tenantId(TENANT_ID)
            .refreshTokenHash("hash")
            .revoked(false)
            .build();
    }
}
