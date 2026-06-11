package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.Map;

import com.coresolution.consultation.service.SmsOtpVerificationService;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
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
import org.slf4j.LoggerFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * B4 hotfix — {@link AuthController#verifySmsCode} OTP 평문 로그 회귀 가드.
 *
 * <p>표준화 v2 Phase 1 B4: {@code /api/v1/auth/sms/verify} 실패·성공 분기 모두에서
 * 인증번호 평문이 로그에 출력되지 않아야 한다(PR #227 SSOT 정합).
 *
 * <p>참조: {@code docs/project-management/2026-06-11/STANDARDIZATION_ROADMAP.md} §B4.
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthController.verifySmsCode — B4 OTP 평문 로그 회귀 가드")
class AuthControllerSmsVerifyOtpLeakTest {

    private static final String PHONE = "01012345678";
    private static final String OTP = "246810";

    @Mock private com.coresolution.consultation.service.RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private com.coresolution.consultation.util.PersonalDataEncryptionUtil encryptionUtil;
    @Mock private com.coresolution.consultation.repository.UserRepository userRepository;
    @Mock private com.coresolution.consultation.repository.UserSocialAccountRepository userSocialAccountRepository;
    @Mock private com.coresolution.core.repository.TenantRepository tenantRepository;
    @Mock private com.coresolution.consultation.service.AuthService authService;
    @Mock private com.coresolution.consultation.service.BranchService branchService;
    @Mock private com.coresolution.consultation.service.UserSessionService userSessionService;
    @Mock private com.coresolution.consultation.service.DynamicPermissionService dynamicPermissionService;
    @Mock private com.coresolution.consultation.service.UserService userService;
    @Mock private com.coresolution.core.service.UserRoleQueryService userRoleQueryService;
    @Mock private com.coresolution.core.repository.TenantRoleRepository tenantRoleRepository;
    @Mock private com.coresolution.consultation.service.UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private com.coresolution.core.service.PermissionGroupService permissionGroupService;
    @Mock private org.springframework.core.env.Environment environment;
    @Mock private com.coresolution.consultation.service.JwtService jwtService;
    @Mock private com.coresolution.consultation.service.RefreshTokenService refreshTokenService;
    @Mock private SmsOtpVerificationService smsOtpVerificationService;
    @Mock private com.coresolution.consultation.service.OtpDeliveryService otpDeliveryService;

    @InjectMocks
    private AuthController controller;

    private ListAppender<ILoggingEvent> appender;
    private Logger logger;

    @BeforeEach
    void setUp() {
        logger = (Logger) LoggerFactory.getLogger(AuthController.class);
        appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void tearDown() {
        if (logger != null && appender != null) {
            logger.detachAppender(appender);
        }
    }

    @Test
    @DisplayName("verifySmsCode 실패 시 OTP 평문이 로그에 부재")
    void verifySmsCode_failure_doesNotLogOtpPlaintext() {
        when(smsOtpVerificationService.verifyAndConsume(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq(OTP)))
            .thenReturn(false);

        Map<String, String> request = new HashMap<>();
        request.put("phoneNumber", PHONE);
        request.put("verificationCode", OTP);

        assertThatThrownBy(() -> controller.verifySmsCode(request))
            .isInstanceOf(IllegalArgumentException.class);

        assertThat(appender.list)
            .as("실패 로그에 OTP 평문이 포함되어서는 안 됨")
            .noneMatch(e -> e.getFormattedMessage().contains(OTP));
    }

    @Test
    @DisplayName("verifySmsCode 성공 시에도 OTP 평문이 로그에 부재")
    void verifySmsCode_success_doesNotLogOtpPlaintext() {
        when(smsOtpVerificationService.verifyAndConsume(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq(OTP)))
            .thenReturn(true);

        Map<String, String> request = new HashMap<>();
        request.put("phoneNumber", PHONE);
        request.put("verificationCode", OTP);

        controller.verifySmsCode(request);

        assertThat(appender.list)
            .as("성공 로그에도 OTP 평문이 포함되어서는 안 됨")
            .noneMatch(e -> e.getFormattedMessage().contains(OTP));
    }
}
