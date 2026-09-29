package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.config.SessionCookieSupport;
import com.coresolution.consultation.constant.OtpDeliveryChannel;
import com.coresolution.consultation.dto.OtpDeliveryResult;
import com.coresolution.consultation.dto.auth.SmsOtpSendStatus;
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

/**
 * {@code POST /api/v1/auth/sms/send} — 기존 필드 유지 + 인증 정책 필드 추가 + 잠김 429 검증.
 *
 * @author MindGarden
 * @since 2026-09-29
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthController — SMS 인증번호 발송 응답")
class AuthControllerSendSmsCodeTest {

    private static final String TENANT = "tsms-" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    private static final String PHONE = "01012345678";
    private static final long EXPIRES_IN_SECONDS = 300L;
    private static final long RESEND_COOLDOWN_SECONDS = 30L;
    private static final int REMAINING_ATTEMPTS = 5;
    private static final long RETRY_AFTER_SECONDS = 540L;

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

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("발송 성공 — message·deliveryChannel 유지 + expiresInSeconds·resendCooldownSeconds·remainingAttempts 추가")
    void send_success_addsPolicyFields() {
        when(smsOtpVerificationService.getSendStatus(PHONE)).thenReturn(
                SmsOtpSendStatus.available(EXPIRES_IN_SECONDS, RESEND_COOLDOWN_SECONDS, REMAINING_ATTEMPTS));
        when(otpDeliveryService.deliver(eq(TENANT), any(), eq(PHONE), anyString(), any(), any()))
                .thenReturn(OtpDeliveryResult.builder()
                        .channel(OtpDeliveryChannel.SMS)
                        .sentAt(Instant.now())
                        .build());

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                authController.sendSmsCode(Map.of("phoneNumber", PHONE), session, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = response.getBody().getData();
        assertThat(data).containsKeys("message", "deliveryChannel");
        assertThat(data.get("deliveryChannel")).isEqualTo(OtpDeliveryChannel.SMS.name());
        assertThat(data.get("expiresInSeconds")).isEqualTo(EXPIRES_IN_SECONDS);
        assertThat(data.get("resendCooldownSeconds")).isEqualTo(RESEND_COOLDOWN_SECONDS);
        assertThat(data.get("remainingAttempts")).isEqualTo(REMAINING_ATTEMPTS);
        assertThat(data).doesNotContainKey("retryAfterSeconds");
        verify(smsOtpVerificationService).storeCode(eq(PHONE), anyString());
    }

    @Test
    @DisplayName("잠김 — 429 + retryAfterSeconds·remainingAttempts=0, 코드 저장·발송 안 함")
    void send_locked_returns429WithRetryAfter() {
        when(smsOtpVerificationService.getSendStatus(PHONE)).thenReturn(
                SmsOtpSendStatus.locked(RETRY_AFTER_SECONDS, EXPIRES_IN_SECONDS, RESEND_COOLDOWN_SECONDS));

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                authController.sendSmsCode(Map.of("phoneNumber", PHONE), session, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER))
                .isEqualTo(String.valueOf(RETRY_AFTER_SECONDS));
        assertThat(response.getBody().isSuccess()).isFalse();
        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("retryAfterSeconds")).isEqualTo(RETRY_AFTER_SECONDS);
        assertThat(data.get("remainingAttempts")).isEqualTo(0);
        verify(smsOtpVerificationService, never()).storeCode(anyString(), anyString());
        verify(otpDeliveryService, never()).deliver(any(), any(), any(), any(), any(), any());
    }
}
