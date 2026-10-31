package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.config.SessionCookieSupport;
import com.coresolution.consultation.constant.SessionManagementConstants;
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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * current-user — 중복 로그인으로 기존 세션이 종료된 피해 세션 401 본문 검증.
 *
 * @author MindGarden
 * @since 2026-04-25
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthController — current-user 중복 로그인 세션 종료")
class AuthControllerCurrentUserDuplicateTerminateTest {

    private static final String EXPIRED_COOKIE_HEADER =
            "JSESSIONID=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax";

    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private UserRepository userRepository;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private AuthService authService;
    @Mock private BranchService branchService;
    @Mock private UserSessionService userSessionService;
    @Mock private SystemConfigService systemConfigService;
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
    @Mock private SessionCookieSupport sessionCookieSupport;
    @Mock private com.coresolution.consultation.service.ClientProfilePhoneVerificationService
            clientProfilePhoneVerificationService;

    @Mock private HttpSession session;
    @Mock private HttpServletRequest httpRequest;
    @Mock private HttpServletResponse httpResponse;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        when(session.getId()).thenReturn("sess-" + UUID.randomUUID());
        when(sessionCookieSupport.buildExpiredJsessionSetCookieHeader(any()))
                .thenReturn(EXPIRED_COOKIE_HEADER);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("필터 요청 속성이 있으면 401 + SESSION_TERMINATED_DUPLICATE + 쿠키 만료")
    void currentUser_duplicateTerminated_returnsErrorCodeAndExpiresCookie() {
        when(httpRequest.getAttribute(
                SessionManagementConstants.REQUEST_ATTR_SESSION_TERMINATED_DUPLICATE))
                .thenReturn(Boolean.TRUE);
        when(session.getAttribute(any())).thenReturn(null);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                authController.getCurrentUser(session, httpRequest, httpResponse, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage())
                .isEqualTo(SessionManagementConstants.SESSION_TERMINATED_MESSAGE);
        assertThat(response.getBody().getData())
                .containsEntry("errorCode",
                        SessionManagementConstants.ERROR_CODE_SESSION_TERMINATED_DUPLICATE);
        verify(httpResponse).addHeader(HttpHeaders.SET_COOKIE, EXPIRED_COOKIE_HEADER);
    }

    @Test
    @DisplayName("일반 미인증(속성 없음)은 기존 401 메시지 유지")
    void currentUser_anonymous_keepsGenericUnauthorized() {
        when(httpRequest.getAttribute(
                SessionManagementConstants.REQUEST_ATTR_SESSION_TERMINATED_DUPLICATE))
                .thenReturn(null);
        when(session.getAttribute(any())).thenReturn(null);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                authController.getCurrentUser(session, httpRequest, httpResponse, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("인증이 필요합니다.");
        assertThat(response.getBody().getData()).isNull();
    }
}
