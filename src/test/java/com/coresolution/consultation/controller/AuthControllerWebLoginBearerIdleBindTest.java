package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.AuthRequest;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.dto.UserDto;
import com.coresolution.consultation.entity.RefreshToken;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.service.BearerIdleSessionService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientProfilePhoneVerificationService;
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
import com.coresolution.core.constant.TestDocumentationIps;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * 웹 {@code /login} JWT 발급 직후 Access {@code sid} 로
 * {@link BearerIdleSessionService#ensureActiveSession} 바인딩 회귀 고정.
 *
 * <p>버그: JSESSIONID 세션만 만들고 JWT sid 는 ensure 하지 않아 Bearer 즉시 401.</p>
 *
 * @author MindGarden
 * @since 2026-10-31
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthController — 웹 /login JWT sid Bearer idle 바인딩")
class AuthControllerWebLoginBearerIdleBindTest {

    private String tenantId;
    private String loginPrincipal;
    private String password;
    private String httpSessionId;
    private Long userPk;
    private String accessToken;
    private String refreshToken;
    private String jwtSid;

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
    @Mock private BearerIdleSessionService bearerIdleSessionService;
    @Mock private SmsOtpVerificationService smsOtpVerificationService;
    @Mock private OtpDeliveryService otpDeliveryService;
    @Mock private com.coresolution.consultation.config.SessionCookieSupport sessionCookieSupport;
    @Mock private com.coresolution.consultation.config.SessionTimeoutProperties sessionTimeoutProperties;
    @Mock private ClientProfilePhoneVerificationService clientProfilePhoneVerificationService;

    @Mock private HttpSession session;
    @Mock private HttpServletRequest httpRequest;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-" + UUID.randomUUID();
        loginPrincipal = "login-" + UUID.randomUUID() + "@example.com";
        password = "SecretPass1!";
        httpSessionId = "jsession-" + UUID.randomUUID();
        userPk = Math.abs(UUID.randomUUID().getMostSignificantBits());
        accessToken = "access." + UUID.randomUUID() + ".jwt";
        refreshToken = "refresh." + UUID.randomUUID() + ".jwt";
        jwtSid = UUID.randomUUID().toString().replace("-", "");

        when(session.getId()).thenReturn(httpSessionId);
        lenient().when(httpRequest.getHeader("User-Agent")).thenReturn("Mozilla/5.0 junit");
        lenient().when(httpRequest.getHeader("Host")).thenReturn("app.example.com");
        lenient().when(httpRequest.getHeader("X-Forwarded-For"))
                .thenReturn(TestDocumentationIps.DOC_NET_3_DEVICE_PRIMARY);
        lenient().when(httpRequest.getRemoteAddr())
                .thenReturn(TestDocumentationIps.DOC_NET_3_DEVICE_PRIMARY);
        lenient().when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});
        lenient().when(dynamicPermissionService.getUserPermissionsAsStringList(any(User.class)))
                .thenReturn(List.of("READ"));
        lenient().when(jwtService.generateToken(any(User.class), any())).thenReturn(accessToken);
        lenient().when(jwtService.generateRefreshToken(any(User.class))).thenReturn(refreshToken);
        lenient().when(jwtService.extractSessionId(accessToken)).thenReturn(jwtSid);
        lenient().when(refreshTokenService.createRefreshToken(any(User.class), anyString(), any()))
                .thenReturn(RefreshToken.builder()
                        .tokenId("rt-" + UUID.randomUUID())
                        .userId(userPk)
                        .tenantId(tenantId)
                        .refreshTokenHash("hash")
                        .revoked(false)
                        .build());
        lenient().when(userRoleQueryService.getActiveRoles(any(User.class), anyString()))
                .thenReturn(Collections.emptyList());
        lenient().when(tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(anyString(), anyString()))
                .thenReturn(Optional.empty());
    }

    @Test
    @DisplayName("웹 /login 성공 후 accessToken sid 로 ensureActiveSession 호출")
    void loginSuccess_bindsBearerIdleSessionWithJwtSid() {
        // Given
        User user = userEntity();
        UserDto userDto = UserDto.builder()
                .id(userPk)
                .email(loginPrincipal)
                .name("웹로그인")
                .role(UserRole.CONSULTANT.getValue())
                .tenantId(tenantId)
                .isActive(true)
                .build();
        AuthResponse serviceResponse = AuthResponse.builder()
                .success(true)
                .message("로그인 성공")
                .token(null)
                .refreshToken(null)
                .user(userDto)
                .build();
        when(authService.authenticateWithSession(
                eq(loginPrincipal), eq(password), eq(httpSessionId), anyString(), anyString()))
                .thenReturn(serviceResponse);
        when(userService.findById(userPk)).thenReturn(Optional.of(user));

        AuthRequest request = AuthRequest.builder()
                .email(loginPrincipal)
                .password(password)
                .build();

        // When
        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                authController.login(request, session, httpRequest);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().get("accessToken")).isEqualTo(accessToken);
        verify(jwtService).extractSessionId(accessToken);
        verify(bearerIdleSessionService).ensureActiveSession(
                eq(user), eq(jwtSid), anyString(), anyString());
    }

    @Test
    @DisplayName("confirm-duplicate-login 성공 시에도 JWT sid ensureActiveSession 호출")
    void confirmDuplicateLogin_bindsBearerIdleSessionWithJwtSid() {
        // Given
        User user = userEntity();
        UserDto userDto = UserDto.builder()
                .id(userPk)
                .email(loginPrincipal)
                .name("웹로그인")
                .role(UserRole.CONSULTANT.getValue())
                .tenantId(tenantId)
                .isActive(true)
                .build();
        when(authService.authenticateWithSession(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(AuthResponse.builder()
                        .success(true)
                        .message("로그인 성공")
                        .user(userDto)
                        .build());
        when(userService.findByLoginPrincipal(loginPrincipal)).thenReturn(Optional.of(user));

        Map<String, Object> body = Map.of(
                "email", loginPrincipal,
                "password", password,
                "confirmTerminate", Boolean.TRUE);

        // When
        authController.confirmDuplicateLogin(body, session, httpRequest);

        // Then — confirm 경로는 DTO 로부터 new User() 를 만들므로 동일 sid 바인딩만 검증
        verify(jwtService).extractSessionId(accessToken);
        verify(bearerIdleSessionService).ensureActiveSession(
                any(User.class), eq(jwtSid), anyString(), anyString());
    }

    private User userEntity() {
        User user = User.builder()
                .userId("u-" + userPk)
                .email(loginPrincipal)
                .password("{bcrypt}$2a$10$0123456789012345678901x")
                .name("웹로그인")
                .role(UserRole.CONSULTANT)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        user.setId(userPk);
        user.setTenantId(tenantId);
        return user;
    }
}
