package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.config.SessionCookieSupport;
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
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.SmsOtpVerificationService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * current-user 응답에 결제 soft-refresh 용 phone / isPhoneVerified 필드가 포함되는지 검증.
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthController — current-user 휴대폰 게이트 필드")
class AuthControllerGetCurrentUserPhoneFieldsTest {

    private static final String TENANT = "tph-" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    private static final Long USER_ID = 77L;
    private static final String PLAIN_PHONE = "01012345678";
    private static final LocalDateTime VERIFIED_AT = LocalDateTime.of(2026, 9, 18, 12, 0);

    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private UserRepository userRepository;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private AuthService authService;
    @Mock private BranchService branchService;
    @Mock private UserSessionService userSessionService;
    @Mock private SystemConfigService systemConfigService;
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
    @Mock private ClientProfilePhoneVerificationService clientProfilePhoneVerificationService;

    @Mock private HttpSession session;
    @Mock private HttpServletRequest httpRequest;
    @Mock private HttpServletResponse httpResponse;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT);
        SecurityContextHolder.clearContext();
        when(session.getId()).thenReturn("sess-" + USER_ID);
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(buildUser());
        when(userRepository.findByTenantIdAndId(TENANT, USER_ID)).thenReturn(Optional.of(buildUser()));
        when(encryptionUtil.safeDecrypt(any())).thenAnswer(inv -> {
            String v = inv.getArgument(0);
            if ("enc-phone".equals(v)) {
                return PLAIN_PHONE;
            }
            return v;
        });
        when(userSocialAccountRepository.findByTenantIdAndUserIdAndIsDeletedFalse(TENANT, USER_ID))
                .thenReturn(Collections.emptyList());
        when(branchService.getAllActiveBranches()).thenReturn(Collections.emptyList());
        when(clientProfilePhoneVerificationService.isPhoneVerifiedForPayment(any())).thenReturn(true);
        when(clientProfilePhoneVerificationService.findPhoneVerifiedAt(any()))
                .thenReturn(Optional.of(VERIFIED_AT));
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT)).thenReturn(Optional.empty());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("인증 사용자 current-user 에 phone·isPhoneVerified·phoneVerifiedAt 포함")
    void currentUser_includesPhoneGateFields() {
        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                authController.getCurrentUser(session, httpRequest, httpResponse, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        Map<String, Object> data = response.getBody().getData();
        assertThat(data)
                .containsEntry("phone", PLAIN_PHONE)
                .containsEntry("phoneNumber", PLAIN_PHONE)
                .containsEntry("isPhoneVerified", true)
                .containsEntry("phoneVerifiedAt", VERIFIED_AT);

        verify(clientProfilePhoneVerificationService).isPhoneVerifiedForPayment(any(User.class));
        verify(clientProfilePhoneVerificationService).findPhoneVerifiedAt(any(User.class));
    }

    private User buildUser() {
        User u = User.builder()
                .userId("u" + USER_ID)
                .email("user@example.com")
                .name("홍길동")
                .role(UserRole.CLIENT)
                .phone("enc-phone")
                .isActive(true)
                .build();
        u.setId(USER_ID);
        u.setTenantId(TENANT);
        u.setIsDeleted(false);
        return u;
    }
}
