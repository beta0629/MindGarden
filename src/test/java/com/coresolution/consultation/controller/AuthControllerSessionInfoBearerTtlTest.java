package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.config.SessionCookieSupport;
import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientProfilePhoneVerificationService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.OtpDeliveryService;
import com.coresolution.consultation.service.BearerIdleSessionService;
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.SessionSecurityPolicyService;
import com.coresolution.consultation.service.SmsOtpVerificationService;
import com.coresolution.consultation.service.SystemConfigService;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Bearer/JWT 경로에서 새 컨테이너 HttpSession(기본 maxInactiveInterval)이 올 때
 * {@code GET /api/v1/auth/session-info} 가 역할별 TTL로 정렬하는지 검증.
 *
 * <p>버그: CLIENT/CONSULTANT 인데 응답 {@code maxInactiveInterval} 이 컨테이너 기본(ADMIN)으로
 * 노출되던 회귀. user 가 있으면 {@link SessionTimeoutProperties#getTimeoutSecondsForRole} SSOT.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthController — session-info Bearer 경로 역할 TTL")
class AuthControllerSessionInfoBearerTtlTest {

    private static final String TENANT_ID = UUID.randomUUID().toString();
    private static final String SESSION_ID = "sess-bearer-" + UUID.randomUUID();
    private static final Long USER_PK = 42L;

    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private UserRepository userRepository;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private AuthService authService;
    @Mock private BranchService branchService;
    @Mock private UserSessionService userSessionService;
    @Mock private SystemConfigService systemConfigService;
    @Mock private SessionSecurityPolicyService sessionSecurityPolicyService;
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
    @Mock private SessionCookieSupport sessionCookieSupport;
    @Mock private SessionTimeoutProperties sessionTimeoutProperties;
    @Mock private ClientProfilePhoneVerificationService clientProfilePhoneVerificationService;

    @Mock private HttpSession session;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        lenient().when(session.getId()).thenReturn(SESSION_ID);
        // 새 컨테이너 세션 시뮬레이션: 기본 maxInactiveInterval = ADMIN/컨테이너 폴백
        lenient().when(session.getMaxInactiveInterval())
            .thenReturn(SessionConstants.SESSION_TIMEOUT_SECONDS);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Bearer 새 세션 + CLIENT — maxInactiveInterval 이 CLIENT TTL 이고 setMaxInactiveInterval 호출")
    void getSessionInfo_bearerNewSession_client_returnsRoleTtl() {
        // Given
        User client = userWithRole(UserRole.CLIENT);
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(client);
        when(sessionTimeoutProperties.getTimeoutSecondsForRole(UserRole.CLIENT))
            .thenReturn(SessionConstants.SESSION_TIMEOUT_SECONDS_CLIENT);

        // When
        ResponseEntity<ApiResponse<Map<String, Object>>> response = authController.getSessionInfo(session);

        // Then
        assertSessionInfoRoleTtl(response, SessionConstants.SESSION_TIMEOUT_SECONDS_CLIENT);
        verify(session).setMaxInactiveInterval(SessionConstants.SESSION_TIMEOUT_SECONDS_CLIENT);
    }

    @Test
    @DisplayName("Bearer 새 세션 + CONSULTANT — maxInactiveInterval 이 CONSULTANT TTL 이고 setMaxInactiveInterval 호출")
    void getSessionInfo_bearerNewSession_consultant_returnsRoleTtl() {
        // Given
        User consultant = userWithRole(UserRole.CONSULTANT);
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(consultant);
        when(sessionTimeoutProperties.getTimeoutSecondsForRole(UserRole.CONSULTANT))
            .thenReturn(SessionConstants.SESSION_TIMEOUT_SECONDS_CONSULTANT);

        // When
        ResponseEntity<ApiResponse<Map<String, Object>>> response = authController.getSessionInfo(session);

        // Then
        assertSessionInfoRoleTtl(response, SessionConstants.SESSION_TIMEOUT_SECONDS_CONSULTANT);
        verify(session).setMaxInactiveInterval(SessionConstants.SESSION_TIMEOUT_SECONDS_CONSULTANT);
    }

    @Test
    @DisplayName("test-override 활성(실객체 configureTestOverride) 시 override TTL 이 maxInactiveInterval 에 반영")
    void getSessionInfo_bearerNewSession_usesOverrideFromRealProperties() {
        // Given — 실객체 + 비운영 프로필에서 override 활성, assert는 properties 반환값과 비교
        SessionTimeoutProperties realProperties = new SessionTimeoutProperties(Duration.ofHours(4));
        MockEnvironment mockEnvironment = new MockEnvironment();
        mockEnvironment.setActiveProfiles("dev");
        realProperties.configureTestOverride(mockEnvironment, SessionConstants.SESSION_TIMEOUT_SECONDS_CLIENT / 40);
        ReflectionTestUtils.setField(authController, "sessionTimeoutProperties", realProperties);

        User consultant = userWithRole(UserRole.CONSULTANT);
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(consultant);
        int expectedOverrideTtl = realProperties.getTimeoutSecondsForRole(UserRole.CONSULTANT);
        assertThat(expectedOverrideTtl)
            .as("configureTestOverride 후 CONSULTANT TTL은 override 값이어야 함")
            .isEqualTo(realProperties.getTestOverrideSeconds())
            .isPositive();

        // When
        ResponseEntity<ApiResponse<Map<String, Object>>> response = authController.getSessionInfo(session);

        // Then
        assertSessionInfoRoleTtl(response, expectedOverrideTtl);
        verify(session).setMaxInactiveInterval(expectedOverrideTtl);
    }

    private static void assertSessionInfoRoleTtl(
            ResponseEntity<ApiResponse<Map<String, Object>>> response, int expectedTtl) {
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        Map<String, Object> data = response.getBody().getData();
        assertThat(data).isNotNull();
        assertThat(data.get("isAuthenticated")).isEqualTo(true);
        assertThat(data.get("maxInactiveInterval")).isEqualTo(expectedTtl);
    }

    private static User userWithRole(UserRole role) {
        User user = User.builder()
            .userId("u-" + USER_PK + "-" + UUID.randomUUID())
            .email(role.name().toLowerCase() + "-" + UUID.randomUUID() + "@example.com")
            .name("세션TTL테스터-" + role.name())
            .role(role)
            .isActive(true)
            .isPasswordChanged(true)
            .build();
        user.setId(USER_PK);
        user.setTenantId(TENANT_ID);
        return user;
    }
}
