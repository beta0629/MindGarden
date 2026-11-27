package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.coresolution.consultation.repository.AlertRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.service.SmsTemplateService;
import com.coresolution.consultation.service.TenantKakaoAlimtalkSettingsService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;

/**
 * NotificationServiceImpl 이메일 시뮬레이션 로그 PII 회귀 — 제목·본문 평문 미포함.
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationServiceImpl 이메일 시뮬레이션 로그 PII")
class NotificationServiceImplEmailSimulationLogPiiTest {

    private static final Long USER_ID = 42L;
    private static final String SUBJECT = "예약 확정 안내 — 홍길동님";
    private static final String CONTENT = "상담이 확정되었습니다. OTP 123456 / 01098765432";
    private static final String TYPE = "CONSULTATION_CONFIRMED";

    @Mock
    private KakaoAlimTalkService kakaoAlimTalkService;
    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private SmsAuthService smsAuthService;
    @Mock
    private SmsTemplateService smsTemplateService;
    @Mock
    private EmailService emailService;
    @Mock
    private AlertRepository alertRepository;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private TenantKakaoAlimtalkSettingsService tenantKakaoAlimtalkSettingsService;
    @Mock
    private NotificationChannelPreferenceResolutionService channelPreferenceResolutionService;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private ListAppender<ILoggingEvent> logAppender;
    private Logger serviceLogger;

    @BeforeEach
    void attachAppender() {
        serviceLogger = (Logger) LoggerFactory.getLogger(NotificationServiceImpl.class);
        logAppender = new ListAppender<>();
        logAppender.start();
        serviceLogger.addAppender(logAppender);
        serviceLogger.setLevel(Level.INFO);
    }

    @AfterEach
    void detachAppender() {
        if (serviceLogger != null && logAppender != null) {
            serviceLogger.detachAppender(logAppender);
        }
    }

    @Test
    @DisplayName("sendEmailNotification 시뮬레이션 로그에 subject/content 평문·전화·OTP 미포함")
    void sendEmailNotification_simulationLogsOmitBodyAndPii() {
        boolean success = notificationService.sendEmailNotification(USER_ID, SUBJECT, CONTENT, TYPE);

        assertThat(success).isTrue();

        String allLogs = logAppender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .collect(Collectors.joining("\n"));

        assertThat(allLogs).contains("subjectLength=" + SUBJECT.length())
                .contains("subjectLength: " + SUBJECT.length());
        assertThat(allLogs).contains("contentLength: " + CONTENT.length());
        assertThat(allLogs).contains("사용자ID=" + USER_ID);
        assertThat(allLogs).contains("타입: " + TYPE);

        assertThat(allLogs).doesNotContain(SUBJECT);
        assertThat(allLogs).doesNotContain(CONTENT);
        assertThat(allLogs).doesNotContain("홍길동");
        assertThat(allLogs).doesNotContain("123456");
        assertThat(allLogs).doesNotContain("01098765432");
        assertThat(allLogs).doesNotContain("  - 제목: ");
        assertThat(allLogs).doesNotContain("  - 내용: ");

        List<ILoggingEvent> infos = logAppender.list.stream()
                .filter(e -> e.getLevel() == Level.INFO)
                .toList();
        assertThat(infos).isNotEmpty();
    }
}
