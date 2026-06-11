package com.coresolution.consultation.service;

import java.util.List;

import com.coresolution.consultation.config.SmsProperties;
import com.coresolution.consultation.service.sms.SmsProvider;
import com.coresolution.core.context.TenantContextHolder;
import ch.qos.logback.classic.Level;
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
import static org.mockito.Mockito.when;

/**
 * B4 hotfix — {@link SmsAuthService} OTP 평문 로그 회귀 가드.
 *
 * <p>표준화 v2 Phase 1 B4: {@link SmsAuthService#sendVerificationCode(String)} (테스트 모드)
 * 와 {@link SmsAuthService#verifyCode(String, String, String)} 의 로그에서 인증번호 평문이
 * 절대 출력되지 않아야 한다. PR #227 SSOT (`OtpDeliveryServiceImpl.recordAudit` 패턴) 정합.
 *
 * <p>참조: {@code docs/project-management/2026-06-11/STANDARDIZATION_ROADMAP.md} §B4.
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SmsAuthService — B4 OTP 평문 로그 회귀 가드")
class SmsAuthServiceOtpLeakTest {

    private static final String TENANT_ID = "tenant-test";
    private static final String PHONE = "01012345678";
    private static final String MOCK_OTP = "987654";

    @Mock
    private TenantSmsSettingsService tenantSmsSettingsService;

    @Mock
    private SmsProvider smsProvider;

    private SmsProperties smsProperties;
    private SmsAuthService service;

    private ListAppender<ILoggingEvent> appender;
    private Logger logger;

    @BeforeEach
    void setUp() {
        smsProperties = new SmsProperties();
        smsProperties.setEnabled(true);
        smsProperties.setTestMode(true);
        smsProperties.setMockVerificationCode(MOCK_OTP);

        when(tenantSmsSettingsService.isSmsEnabledForTenant(TENANT_ID)).thenReturn(true);

        service = new SmsAuthService(smsProperties, tenantSmsSettingsService, List.of(smsProvider));

        TenantContextHolder.setTenantId(TENANT_ID);

        logger = (Logger) LoggerFactory.getLogger(SmsAuthService.class);
        appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void tearDown() {
        if (logger != null && appender != null) {
            logger.detachAppender(appender);
        }
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("sendVerificationCode(testMode=true) 시 로그에 OTP 평문 부재")
    void sendVerificationCode_testMode_doesNotLogOtpPlaintext() {
        String code = service.sendVerificationCode(PHONE);

        assertThat(code).isEqualTo(MOCK_OTP);
        assertThat(appender.list)
            .as("테스트 모드 발송 로그에 OTP 평문이 포함되어서는 안 됨")
            .noneMatch(e -> e.getFormattedMessage().contains(MOCK_OTP));
    }

    @Test
    @DisplayName("verifyCode 실패 시 입력·발송 OTP 평문이 로그에 부재")
    void verifyCode_failure_doesNotLogInputOrSentCode() {
        String inputCode = "111222";
        String sentCode = MOCK_OTP;

        boolean valid = service.verifyCode(PHONE, inputCode, sentCode);

        assertThat(valid).isFalse();
        assertThat(appender.list)
            .as("검증 로그에 입력·발송 OTP 평문이 포함되어서는 안 됨")
            .noneMatch(e -> e.getFormattedMessage().contains(inputCode))
            .noneMatch(e -> e.getFormattedMessage().contains(sentCode));
    }

    @Test
    @DisplayName("verifyCode 성공 시에도 OTP 평문이 로그에 부재")
    void verifyCode_success_doesNotLogCode() {
        String code = "555444";

        boolean valid = service.verifyCode(PHONE, code, code);

        assertThat(valid).isTrue();
        assertThat(appender.list)
            .as("검증 성공 로그에도 OTP 평문이 포함되어서는 안 됨")
            .noneMatch(e -> e.getFormattedMessage().contains(code));
    }

    @Test
    @DisplayName("sendNotificationMessage(testMode=true) 로그에 본문 평문 부재 (bodyLength 만 기록)")
    void sendNotificationMessage_testMode_doesNotLogBodyPlaintext() {
        String bodyWithOtp = "[CoreSolution] 인증번호는 654321입니다.";

        boolean sent = service.sendNotificationMessage(PHONE, bodyWithOtp);

        assertThat(sent).isTrue();
        assertThat(appender.list)
            .filteredOn(e -> e.getLevel().equals(Level.INFO))
            .as("발송 메시지 본문 평문이 로그에 노출되어서는 안 됨")
            .noneMatch(e -> e.getFormattedMessage().contains(bodyWithOtp))
            .noneMatch(e -> e.getFormattedMessage().contains("654321"));
        // bodyLength 만 기록되었는지 확인
        assertThat(appender.list)
            .anyMatch(e -> e.getFormattedMessage().contains("bodyLength="));
    }
}
