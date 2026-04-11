package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.config.MindgardenSecurityProperties;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.dto.EmailVerificationSendOutcome;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.security.PasswordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link AccountIntegrationServiceImpl} 이메일 인증 발송 쿨다운·일일 상한 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AccountIntegrationServiceImpl 이메일 인증 발송")
class AccountIntegrationServiceImplEmailVerificationTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserSocialAccountRepository userSocialAccountRepository;
    @Mock
    private UserService userService;
    @Mock
    private JwtService jwtService;
    @Mock
    private PasswordService passwordService;
    @Mock
    private EmailService emailService;
    @Mock
    private MindgardenSecurityProperties mindgardenSecurityProperties;

    @InjectMocks
    private AccountIntegrationServiceImpl accountIntegrationService;

    @BeforeEach
    void stubEmailSuccess() {
        when(emailService.sendTemplateEmail(anyString(), anyString(), anyString(), anyMap()))
            .thenReturn(EmailResponse.builder().success(true).emailId("e1").build());
    }

    @Test
    @DisplayName("일일 상한 초과 시 DAILY_LIMIT")
    void sendEmailVerificationCode_dailyLimitExceeded_returnsDailyLimit() {
        MindgardenSecurityProperties.AccountIntegration ai = new MindgardenSecurityProperties.AccountIntegration();
        ai.setEmailVerificationCooldownSeconds(0);
        ai.setEmailVerificationDailyLimit(1);
        when(mindgardenSecurityProperties.getAccountIntegration()).thenReturn(ai);

        assertThat(accountIntegrationService.sendEmailVerificationCode("user@example.com").getStatus())
            .isEqualTo(EmailVerificationSendOutcome.Status.SUCCESS);

        assertThat(accountIntegrationService.sendEmailVerificationCode("user@example.com").getStatus())
            .isEqualTo(EmailVerificationSendOutcome.Status.DAILY_LIMIT);
    }

    @Test
    @DisplayName("쿨다운 중이면 COOLDOWN 및 retryAfterSeconds > 0")
    void sendEmailVerificationCode_withinCooldown_returnsCooldown() {
        MindgardenSecurityProperties.AccountIntegration ai = new MindgardenSecurityProperties.AccountIntegration();
        ai.setEmailVerificationCooldownSeconds(60);
        ai.setEmailVerificationDailyLimit(100);
        when(mindgardenSecurityProperties.getAccountIntegration()).thenReturn(ai);

        assertThat(accountIntegrationService.sendEmailVerificationCode("cool@example.com").getStatus())
            .isEqualTo(EmailVerificationSendOutcome.Status.SUCCESS);

        EmailVerificationSendOutcome second = accountIntegrationService.sendEmailVerificationCode("cool@example.com");
        assertThat(second.getStatus()).isEqualTo(EmailVerificationSendOutcome.Status.COOLDOWN);
        assertThat(second.getRetryAfterSeconds()).isGreaterThan(0L);
    }
}
