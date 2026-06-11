package com.coresolution.consultation.service.impl;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.Map;

import com.coresolution.consultation.config.MindgardenSecurityProperties;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.security.PasswordService;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.slf4j.LoggerFactory;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * B4 hotfix — {@link AccountIntegrationServiceImpl#verifyEmailCode} OTP 평문 로그 회귀 가드.
 *
 * <p>표준화 v2 Phase 1 B4: 이메일 인증 검증 시 입력·저장 OTP 평문이 로그에 출력되지
 * 않아야 한다.
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AccountIntegrationServiceImpl.verifyEmailCode — B4 이메일 OTP 평문 로그 회귀 가드")
class AccountIntegrationServiceImplVerifyEmailCodeOtpLeakTest {

    private static final String EMAIL = "victim@example.com";
    private static final String STORED_OTP = "112233";
    private static final String INPUT_OTP_WRONG = "998877";

    @Mock private UserRepository userRepository;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private UserService userService;
    @Mock private JwtService jwtService;
    @Mock private PasswordService passwordService;
    @Mock private EmailService emailService;
    @Mock private MindgardenSecurityProperties mindgardenSecurityProperties;

    private AccountIntegrationServiceImpl service;
    private ListAppender<ILoggingEvent> appender;
    private Logger logger;

    @BeforeEach
    void setUp() throws Exception {
        service = new AccountIntegrationServiceImpl(
            userRepository, userSocialAccountRepository, userService, jwtService,
            passwordService, emailService, mindgardenSecurityProperties);

        injectStoredCode(EMAIL, STORED_OTP);

        logger = (Logger) LoggerFactory.getLogger(AccountIntegrationServiceImpl.class);
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
    @DisplayName("verifyEmailCode 실패 시 입력·저장 OTP 평문 부재")
    void verifyEmailCode_failure_doesNotLogOtpPlaintext() {
        boolean valid = service.verifyEmailCode(EMAIL, INPUT_OTP_WRONG);

        assertThat(valid).isFalse();
        assertThat(appender.list)
            .as("이메일 검증 실패 로그에 입력 OTP 평문이 포함되어서는 안 됨")
            .noneMatch(e -> e.getFormattedMessage().contains(INPUT_OTP_WRONG))
            .as("이메일 검증 실패 로그에 저장 OTP 평문이 포함되어서는 안 됨")
            .noneMatch(e -> e.getFormattedMessage().contains(STORED_OTP));
    }

    @Test
    @DisplayName("verifyEmailCode 성공 시에도 OTP 평문 부재")
    void verifyEmailCode_success_doesNotLogOtpPlaintext() {
        boolean valid = service.verifyEmailCode(EMAIL, STORED_OTP);

        assertThat(valid).isTrue();
        assertThat(appender.list)
            .as("이메일 검증 성공 로그에도 OTP 평문이 포함되어서는 안 됨")
            .noneMatch(e -> e.getFormattedMessage().contains(STORED_OTP));
    }

    /**
     * Reflection 으로 private inner class {@code EmailVerificationCode} 인스턴스를 생성하고
     * private map {@code emailVerificationCodes} 에 적재한다.
     */
    @SuppressWarnings("unchecked")
    private void injectStoredCode(String email, String code) throws Exception {
        String normalized = invokeNormalizeEmail(email);
        Field codesField = AccountIntegrationServiceImpl.class.getDeclaredField("emailVerificationCodes");
        codesField.setAccessible(true);
        Map<String, Object> codesMap = (Map<String, Object>) codesField.get(service);

        Class<?> innerClass = Class.forName(
            "com.coresolution.consultation.service.impl.AccountIntegrationServiceImpl$EmailVerificationCode");
        var ctor = innerClass.getDeclaredConstructor(String.class, LocalDateTime.class);
        ctor.setAccessible(true);
        Object entry = ctor.newInstance(code, LocalDateTime.now().plusMinutes(10));

        codesMap.put(normalized, entry);
    }

    private String invokeNormalizeEmail(String email) throws Exception {
        Method m = AccountIntegrationServiceImpl.class.getDeclaredMethod("normalizeEmail", String.class);
        m.setAccessible(true);
        return (String) m.invoke(service, email);
    }
}
