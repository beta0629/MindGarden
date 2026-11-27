package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.core.read.ListAppender;
import com.coresolution.consultation.constant.EmailConstants;
import com.coresolution.consultation.dto.EmailRequest;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.core.repository.TenantRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link EmailServiceImpl#sendEmail} 로그 PII 회귀 — 본문·제목·수신자 평문 미포함.
 *
 * <p>JavaMailSender 는 모킹한다(실발송 금지). sendEmail 에는 SMS 식 test-mode/시뮬레이션
 * 분기가 없어, 성공·전면차단·한도초과·레거시 지점 차단·검사 실패·첨부 스킵·
 * MessagingException·일반 Exception·검증 실패 로그 경로를 모두 밟는다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EmailServiceImpl.sendEmail 로그 PII")
class EmailServiceImplSendEmailLogPiiTest {

    private static final String TO_EMAIL = "qa.pii.recipient.zx9qk@testdomain-xyz.example";
    private static final String LOCAL_PART = "qa.pii.recipient.zx9qk";
    private static final String SUBJECT = "PII-SUBJ-ZX9QK-CONFIDENTIAL-TITLE";
    private static final String BODY = "PII-BODY-SECRET-PAYLOAD-42-DO-NOT-LOG";
    private static final String MASKED_TO = EmailLogMasking.maskForLog(TO_EMAIL);

    @Mock
    private JavaMailSender javaMailSender;

    @Mock
    private CommonCodeService commonCodeService;

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private EmailServiceImpl emailService;

    private ListAppender<ILoggingEvent> logAppender;
    private Logger serviceLogger;

    @BeforeEach
    void attachAppender() {
        serviceLogger = (Logger) LoggerFactory.getLogger(EmailServiceImpl.class);
        logAppender = new ListAppender<>();
        logAppender.start();
        serviceLogger.addAppender(logAppender);
        serviceLogger.setLevel(Level.DEBUG);
        ReflectionTestUtils.setField(emailService, "blockLegacyBranchRecipients", false);
        ReflectionTestUtils.setField(emailService, "blockAllOutboundEmail", false);
        ReflectionTestUtils.setField(emailService, "sendAllowlist", "");
    }

    @AfterEach
    void detachAppender() {
        if (serviceLogger != null && logAppender != null) {
            serviceLogger.detachAppender(logAppender);
        }
    }

    @Test
    @DisplayName("성공 발송 로그: 마스킹 수신자·subjectLength 만, 본문·제목·수신자 평문 없음")
    void sendEmail_successLogsOmitBodySubjectAndRecipientPlaintext() throws Exception {
        stubMailSender();

        EmailResponse response = emailService.sendEmail(request());

        assertThat(response.isSuccess()).isTrue();
        verify(javaMailSender).send(any(MimeMessage.class));
        assertLogsOmitPlaintext(/* expectMaskedTo */ true, /* expectSubjectLength */ true);
    }

    @Test
    @DisplayName("전면 차단 로그: 마스킹 수신자·subjectLength 만, 평문 없음, 발송기 미호출")
    void sendEmail_blockAllOutboundLogsOmitPlaintext() {
        ReflectionTestUtils.setField(emailService, "blockAllOutboundEmail", true);

        EmailResponse response = emailService.sendEmail(request());

        assertThat(response.isSuccess()).isFalse();
        verify(javaMailSender, never()).send(any(MimeMessage.class));
        assertLogsOmitPlaintext(true, true);
    }

    @Test
    @DisplayName("발송 한도 초과 로그: 마스킹 수신자만, 평문 없음, 발송기 미호출")
    void sendEmail_rateLimitLogsOmitPlaintext() {
        @SuppressWarnings("unchecked")
        Map<String, Integer> counts =
                (Map<String, Integer>) ReflectionTestUtils.getField(emailService, "emailCountMap");
        counts.put(TO_EMAIL, EmailConstants.HOURLY_EMAIL_LIMIT);

        EmailResponse response = emailService.sendEmail(request());

        assertThat(response.isSuccess()).isFalse();
        verify(javaMailSender, never()).send(any(MimeMessage.class));
        assertLogsOmitPlaintext(true, true);
    }

    @Test
    @DisplayName("레거시 지점 수신자 차단 로그: 마스킹 수신자만, 평문 없음, 발송기 미호출")
    void sendEmail_legacyBranchBlockLogsOmitPlaintext() {
        ReflectionTestUtils.setField(emailService, "blockLegacyBranchRecipients", true);
        CommonCode branch = CommonCode.builder()
                .codeValue("BR-LEGACY-1")
                .extraData("{\"email\":\"" + TO_EMAIL + "\"}")
                .build();
        when(commonCodeService.getActiveCommonCodesByGroup("BRANCH")).thenReturn(List.of(branch));

        EmailResponse response = emailService.sendEmail(request());

        assertThat(response.isSuccess()).isFalse();
        verify(javaMailSender, never()).send(any(MimeMessage.class));
        assertLogsOmitPlaintext(true, true);
    }

    @Test
    @DisplayName("레거시 지점 검사 실패 후 발송 성공 로그: 마스킹 수신자·subjectLength 만, 평문 없음")
    void sendEmail_legacyCheckFailureThenSendLogsOmitPlaintext() throws Exception {
        ReflectionTestUtils.setField(emailService, "blockLegacyBranchRecipients", true);
        when(commonCodeService.getActiveCommonCodesByGroup("BRANCH"))
                .thenThrow(new IllegalStateException("branch-lookup-failed"));
        stubMailSender();

        EmailResponse response = emailService.sendEmail(request());

        assertThat(response.isSuccess()).isTrue();
        assertLogsOmitPlaintext(true, true);
    }

    @Test
    @DisplayName("무효 첨부 경로 스킵 후 발송 성공 로그: 평문 없음")
    void sendEmail_invalidAttachmentSkipLogsOmitPlaintext() throws Exception {
        stubMailSender();
        EmailRequest request = request();
        request.setAttachments(List.of("/tmp/no-such-email-attachment-zx9qk.bin"));

        EmailResponse response = emailService.sendEmail(request);

        assertThat(response.isSuccess()).isTrue();
        assertLogsOmitPlaintext(true, true);
    }

    @Test
    @DisplayName("MessagingException 실패 로그: 마스킹 수신자만, 평문 없음")
    void sendEmail_messagingExceptionLogsOmitPlaintext() throws Exception {
        // JavaMailSender.send 는 MailException 만 던져 Mockito 로 MessagingException 을
        // stub 할 수 없다. MimeMessageHelper.setTo 가 호출하는 setRecipient 에서 발생시킨다.
        MimeMessage failing = new MimeMessage(Session.getInstance(new Properties())) {
            @Override
            public void setRecipient(jakarta.mail.Message.RecipientType type,
                    jakarta.mail.Address address) throws MessagingException {
                throw new MessagingException("mime-recipient-failed");
            }
        };
        when(javaMailSender.createMimeMessage()).thenReturn(failing);

        EmailResponse response = emailService.sendEmail(request());

        assertThat(response.isSuccess()).isFalse();
        assertLogsOmitPlaintext(true, true);
    }

    @Test
    @DisplayName("일반 Exception 실패 로그: 마스킹 수신자만, 평문 없음")
    void sendEmail_runtimeExceptionLogsOmitPlaintext() throws Exception {
        when(javaMailSender.createMimeMessage())
                .thenReturn(new MimeMessage(Session.getInstance(new Properties())));
        doThrow(new IllegalStateException("transport-unavailable"))
                .when(javaMailSender)
                .send(any(MimeMessage.class));

        EmailResponse response = emailService.sendEmail(request());

        assertThat(response.isSuccess()).isFalse();
        assertLogsOmitPlaintext(true, true);
    }

    @Test
    @DisplayName("요청 검증 실패 로그: 마스킹 수신자·subjectLength 만, 평문 없음, 발송기 미호출")
    void sendEmail_validationFailureLogsOmitPlaintext() {
        EmailRequest request = request();
        request.setContent(" ");

        EmailResponse response = emailService.sendEmail(request);

        assertThat(response.isSuccess()).isFalse();
        verify(javaMailSender, never()).send(any(MimeMessage.class));
        assertLogsOmitPlaintext(true, true);
    }

    private EmailRequest request() {
        return EmailRequest.builder()
                .toEmail(TO_EMAIL)
                .subject(SUBJECT)
                .content(BODY)
                .type("HTML")
                .build();
    }

    private void stubMailSender() throws Exception {
        when(javaMailSender.createMimeMessage())
                .thenReturn(new MimeMessage(Session.getInstance(new Properties())));
    }

    private void assertLogsOmitPlaintext(boolean expectMaskedTo, boolean expectSubjectLength) {
        assertThat(logAppender.list).isNotEmpty();
        for (int i = 0; i < logAppender.list.size(); i++) {
            ILoggingEvent event = logAppender.list.get(i);
            String line = render(event);
            String kind = plaintextKind(line);
            if (kind != null) {
                fail("captured log line[" + i + "] template=[" + event.getMessage()
                        + "] contains " + kind + " plaintext (values omitted)");
            }
        }
        String allLogs = renderAll();
        if (expectMaskedTo) {
            assertThat(allLogs).contains(MASKED_TO);
        }
        if (expectSubjectLength) {
            assertThat(allLogs).contains("subjectLength=" + SUBJECT.length());
        }
    }

    private String renderAll() {
        StringBuilder sb = new StringBuilder();
        for (ILoggingEvent event : logAppender.list) {
            sb.append(render(event)).append('\n');
        }
        return sb.toString();
    }

    private static String render(ILoggingEvent event) {
        StringBuilder sb = new StringBuilder();
        if (event.getFormattedMessage() != null) {
            sb.append(event.getFormattedMessage());
        }
        IThrowableProxy thrown = event.getThrowableProxy();
        while (thrown != null) {
            if (thrown.getMessage() != null) {
                sb.append('\n').append(thrown.getMessage());
            }
            thrown = thrown.getCause();
        }
        return sb.toString();
    }

    private static String plaintextKind(String line) {
        if (line.contains(TO_EMAIL) || line.contains(LOCAL_PART)) {
            return "recipient";
        }
        if (line.contains(SUBJECT)) {
            return "subject";
        }
        if (line.contains(BODY)) {
            return "body";
        }
        return null;
    }
}
