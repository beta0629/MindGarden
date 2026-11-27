package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.coresolution.consultation.config.MindgardenSecurityProperties;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.AccountIntegrationRequest;
import com.coresolution.consultation.dto.AccountIntegrationResponse;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.dto.EmailVerificationSendOutcome;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.support.SecureNumericCodeGenerator;
import com.coresolution.consultation.service.support.VerificationAttemptLimiter;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.slf4j.LoggerFactory;

/**
 * {@link AccountIntegrationServiceImpl} 이메일 인증 발송·검증·통합 보안 단위 테스트.
 */
@DisplayName("AccountIntegrationServiceImpl 이메일 인증·통합")
class AccountIntegrationServiceImplEmailVerificationTest {

    private static final String TENANT_ID = "tenant-acct-int";
    private static final String MEMBER_EMAIL = "member@example.com";
    private static final String OUTSIDER_EMAIL = "outsider@example.com";
    private static final String CLIENT_IP = "203.0.113.7";
    private static final String PASSWORD = "Passw0rd!";

    private UserRepository userRepository;
    private UserSocialAccountRepository userSocialAccountRepository;
    private PasswordService passwordService;
    private EmailService emailService;
    private MindgardenSecurityProperties properties;
    private AccountIntegrationServiceImpl service;
    private ListAppender<ILoggingEvent> logAppender;
    private Logger serviceLogger;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        userRepository = mock(UserRepository.class);
        userSocialAccountRepository = mock(UserSocialAccountRepository.class);
        passwordService = mock(PasswordService.class);
        emailService = mock(EmailService.class);
        properties = new MindgardenSecurityProperties();
        properties.getAccountIntegration().setEmailVerificationCooldownSeconds(0);
        properties.getAccountIntegration().setEmailVerificationDailyLimit(100);
        VerificationAttemptLimiter limiter = new VerificationAttemptLimiter(properties);
        service = new AccountIntegrationServiceImpl(userRepository, userSocialAccountRepository,
            mock(UserService.class), passwordService, emailService, properties,
            new SecureNumericCodeGenerator(), limiter);
        when(emailService.sendTemplateEmail(anyString(), anyString(), anyString(), anyMap()))
            .thenReturn(EmailResponse.builder().success(true).emailId("e1").build());
        when(userRepository.findByTenantIdAndEmail(TENANT_ID, MEMBER_EMAIL)).thenReturn(Optional.of(member()));

        serviceLogger = (Logger) LoggerFactory.getLogger(AccountIntegrationServiceImpl.class);
        serviceLogger.setLevel(Level.DEBUG);
        logAppender = new ListAppender<>();
        logAppender.start();
        serviceLogger.addAppender(logAppender);
    }

    @AfterEach
    void tearDown() {
        serviceLogger.detachAppender(logAppender);
        TenantContextHolder.clear();
    }

    private User member() {
        User u = new User();
        u.setId(7L);
        u.setEmail(MEMBER_EMAIL);
        u.setName("member");
        u.setRole(UserRole.CLIENT);
        u.setPassword("hashed");
        return u;
    }

    private String sendAndCaptureCode(String email) {
        service.sendEmailVerificationCode(email, CLIENT_IP);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> vars = ArgumentCaptor.forClass(Map.class);
        verify(emailService).sendTemplateEmail(anyString(), eq(email), anyString(), vars.capture());
        return String.valueOf(vars.getValue().get("verificationCode"));
    }

    @Test
    @DisplayName("일일 상한 초과 시 DAILY_LIMIT")
    void sendEmailVerificationCode_dailyLimitExceeded_returnsDailyLimit() {
        properties.getAccountIntegration().setEmailVerificationDailyLimit(1);

        assertThat(service.sendEmailVerificationCode(MEMBER_EMAIL).getStatus())
            .isEqualTo(EmailVerificationSendOutcome.Status.SUCCESS);

        assertThat(service.sendEmailVerificationCode(MEMBER_EMAIL).getStatus())
            .isEqualTo(EmailVerificationSendOutcome.Status.DAILY_LIMIT);
    }

    @Test
    @DisplayName("쿨다운 중이면 COOLDOWN 및 retryAfterSeconds > 0")
    void sendEmailVerificationCode_withinCooldown_returnsCooldown() {
        properties.getAccountIntegration().setEmailVerificationCooldownSeconds(60);

        assertThat(service.sendEmailVerificationCode(MEMBER_EMAIL).getStatus())
            .isEqualTo(EmailVerificationSendOutcome.Status.SUCCESS);

        EmailVerificationSendOutcome second = service.sendEmailVerificationCode(MEMBER_EMAIL);
        assertThat(second.getStatus()).isEqualTo(EmailVerificationSendOutcome.Status.COOLDOWN);
        assertThat(second.getRetryAfterSeconds()).isGreaterThan(0L);
    }

    @Test
    @DisplayName("발송 코드는 6자리 숫자 형식")
    void sentCode_isSixDigits() {
        assertThat(sendAndCaptureCode(MEMBER_EMAIL)).matches("\\d{6}");
    }

    @Test
    @DisplayName("미가입 이메일은 메일을 보내지 않지만 응답은 가입 이메일과 동일(SUCCESS)")
    void send_unregisteredEmail_sameOutcomeNoMail() {
        EmailVerificationSendOutcome member = service.sendEmailVerificationCode(MEMBER_EMAIL, CLIENT_IP);
        EmailVerificationSendOutcome outsider = service.sendEmailVerificationCode(OUTSIDER_EMAIL, CLIENT_IP);

        assertThat(outsider.getStatus()).isEqualTo(member.getStatus());
        assertThat(outsider.getRetryAfterSeconds()).isEqualTo(member.getRetryAfterSeconds());
        verify(emailService, never()).sendTemplateEmail(anyString(), eq(OUTSIDER_EMAIL), anyString(), anyMap());
    }

    @Test
    @DisplayName("미가입·가입 이메일 모두 쿨다운 응답이 동일")
    void send_cooldownResponseIdenticalForMemberAndOutsider() {
        properties.getAccountIntegration().setEmailVerificationCooldownSeconds(60);
        service.sendEmailVerificationCode(MEMBER_EMAIL, CLIENT_IP);
        service.sendEmailVerificationCode(OUTSIDER_EMAIL, CLIENT_IP);

        assertThat(service.sendEmailVerificationCode(OUTSIDER_EMAIL, CLIENT_IP).getStatus())
            .isEqualTo(service.sendEmailVerificationCode(MEMBER_EMAIL, CLIENT_IP).getStatus())
            .isEqualTo(EmailVerificationSendOutcome.Status.COOLDOWN);
    }

    @Test
    @DisplayName("IP당 발송 요청 한도 초과 시 IP_LIMIT")
    void send_ipLimitExceeded() {
        properties.getAccountIntegration().setSendMaxRequestsPerIp(2);

        service.sendEmailVerificationCode("a@example.com", CLIENT_IP);
        EmailVerificationSendOutcome second = service.sendEmailVerificationCode("b@example.com", CLIENT_IP);
        EmailVerificationSendOutcome third = service.sendEmailVerificationCode("c@example.com", CLIENT_IP);

        assertThat(second.getStatus()).isEqualTo(EmailVerificationSendOutcome.Status.SUCCESS);
        assertThat(third.getStatus()).isEqualTo(EmailVerificationSendOutcome.Status.IP_LIMIT);
    }

    @Test
    @DisplayName("이메일당 실패 5회 후 올바른 코드도 거부(코드 폐기·잠금)")
    void verify_afterMaxFailures_locksAndDiscardsCode() {
        String code = sendAndCaptureCode(MEMBER_EMAIL);
        for (int i = 0; i < properties.getAccountIntegration().getVerifyMaxAttemptsPerEmail(); i++) {
            assertThat(service.verifyEmailCode(MEMBER_EMAIL, "000000".equals(code) ? "111111" : "000000", CLIENT_IP))
                .isFalse();
        }

        assertThat(service.isVerificationLocked(MEMBER_EMAIL)).isTrue();
        assertThat(service.verifyEmailCode(MEMBER_EMAIL, code, CLIENT_IP)).isFalse();
    }

    @Test
    @DisplayName("올바른 코드는 시도 한도 안에서 통과")
    void verify_correctCodeWithinLimit_passes() {
        String code = sendAndCaptureCode(MEMBER_EMAIL);
        assertThat(service.verifyEmailCode(MEMBER_EMAIL, "abcdef", CLIENT_IP)).isFalse();
        assertThat(service.verifyEmailCode(MEMBER_EMAIL, code, CLIENT_IP)).isTrue();
    }

    @Test
    @DisplayName("IP당 실패 한도 초과 시 다른 이메일 검증도 거부")
    void verify_ipLockedBlocksOtherEmails() {
        properties.getAccountIntegration().setVerifyMaxFailuresPerIp(2);
        String code = sendAndCaptureCode(MEMBER_EMAIL);
        service.verifyEmailCode("x1@example.com", "000000", CLIENT_IP);
        service.verifyEmailCode("x2@example.com", "000000", CLIENT_IP);

        assertThat(service.verifyEmailCode(MEMBER_EMAIL, code, CLIENT_IP)).isFalse();
    }

    @Test
    @DisplayName("인증 코드는 로그에 평문으로 남지 않는다(성공·실패 모두)")
    void codes_neverLogged() {
        String code = sendAndCaptureCode(MEMBER_EMAIL);
        String wrong = "000000".equals(code) ? "111111" : "000000";
        service.verifyEmailCode(MEMBER_EMAIL, wrong, CLIENT_IP);
        service.verifyEmailCode(MEMBER_EMAIL, code, CLIENT_IP);

        assertThat(logAppender.list).isNotEmpty();
        for (ILoggingEvent event : logAppender.list) {
            assertThat(event.getFormattedMessage()).doesNotContain(code).doesNotContain(wrong);
        }
    }

    @Test
    @DisplayName("통합 — 비밀번호 없으면 거부")
    void integrate_passwordRequired() {
        AccountIntegrationResponse response = service.integrateAccountsByEmail(request(null, "123456"), CLIENT_IP);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getStatus())
            .isEqualTo(AccountIntegrationResponse.IntegrationStatus.PASSWORD_VERIFICATION_REQUIRED);
        verify(userSocialAccountRepository, never()).save(any());
    }

    @Test
    @DisplayName("통합 성공 응답에는 JWT 토큰 필드가 없다")
    void integrate_successResponseHasNoTokens() {
        String code = sendAndCaptureCode(MEMBER_EMAIL);
        when(passwordService.matches(PASSWORD, "hashed")).thenReturn(true);
        when(userSocialAccountRepository.findByUserAndProviderAndIsDeletedFalse(any(), anyString()))
            .thenReturn(Optional.empty());
        when(userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(
            anyString(), anyString(), anyString())).thenReturn(Optional.empty());

        AccountIntegrationResponse response = service.integrateAccountsByEmail(request(PASSWORD, code), CLIENT_IP);

        assertThat(response.isSuccess()).isTrue();
        assertThat(AccountIntegrationResponse.class.getDeclaredFields())
            .extracting(java.lang.reflect.Field::getName)
            .doesNotContain("accessToken", "refreshToken");
    }

    @Test
    @DisplayName("통합 — 비밀번호 불일치는 실패하고 SNS 계정을 저장하지 않는다")
    void integrate_wrongPassword_rejected() {
        String code = sendAndCaptureCode(MEMBER_EMAIL);
        when(passwordService.matches(anyString(), anyString())).thenReturn(false);

        AccountIntegrationResponse response = service.integrateAccountsByEmail(request("bad", code), CLIENT_IP);

        assertThat(response.isSuccess()).isFalse();
        verify(userSocialAccountRepository, never()).save(any());
    }

    private AccountIntegrationRequest request(String password, String code) {
        return AccountIntegrationRequest.builder()
            .existingEmail(MEMBER_EMAIL)
            .existingPassword(password)
            .verificationCode(code)
            .provider("KAKAO")
            .providerUserId("kakao-1")
            .socialEmail("social@example.com")
            .build();
    }
}
