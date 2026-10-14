package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.coresolution.consultation.config.TemporaryPasswordProperties;
import com.coresolution.consultation.dto.CredentialSmsResult;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;

/**
 * 임시 비밀번호 문자는 템플릿으로만 만들고, 로그에 비밀번호를 남기지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("임시 비밀번호 문자")
class ClientCredentialNotificationServiceTest {

    private static final String PASSWORD = "Kp9@mxzw-SECRET";
    private static final String TEMPLATE = "[{centerName}] id={loginId} pw={tempPassword} url={loginUrl}";

    @Mock
    private SmsAuthService smsAuthService;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private AuditLogService auditLogService;

    private TemporaryPasswordProperties properties;
    private ClientCredentialNotificationService service;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void setUp() {
        properties = new TemporaryPasswordProperties();
        properties.setSmsTemplateKey("CLIENT_TEMP_PASSWORD_SMS");
        properties.setSmsTemplate(TEMPLATE);
        properties.setLoginUrl("https://login.example/login");
        service = new ClientCredentialNotificationService(
                properties, smsAuthService, tenantRepository, auditLogService);
        appender = new ListAppender<>();
        appender.start();
        ((Logger) LoggerFactory.getLogger(ClientCredentialNotificationService.class)).addAppender(appender);
        ((Logger) LoggerFactory.getLogger(SmsAuthService.class)).addAppender(appender);
    }

    @AfterEach
    void tearDown() {
        ((Logger) LoggerFactory.getLogger(ClientCredentialNotificationService.class)).detachAppender(appender);
        ((Logger) LoggerFactory.getLogger(SmsAuthService.class)).detachAppender(appender);
    }

    @Test
    @DisplayName("템플릿을 치환해 보내고 로그에는 비밀번호가 없다")
    void rendersTemplateAndMasksLog() {
        Tenant tenant = new Tenant();
        tenant.setName("마음센터");
        when(tenantRepository.findByTenantId("tenant-a")).thenReturn(Optional.of(tenant));
        when(smsAuthService.sendConfidentialNotificationMessage(eq("01012345678"), anyString())).thenReturn(true);

        CredentialSmsResult result = service.deliver("01012345678", "user-7", PASSWORD, "tenant-a", 7L);

        assertThat(result.isSmsSent()).isTrue();
        assertThat(result.getSkipReason()).isNull();
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(smsAuthService).sendConfidentialNotificationMessage(eq("01012345678"), body.capture());
        assertThat(body.getValue())
                .contains("마음센터")
                .contains("user-7")
                .contains(PASSWORD)
                .contains("https://login.example/login");
        assertThat(logs()).doesNotContain(PASSWORD);
        verify(auditLogService).record(org.mockito.ArgumentMatchers.argThat(entry ->
                entry.getMetadataJson() != null && !entry.getMetadataJson().contains(PASSWORD)));
    }

    @Test
    @DisplayName("전화번호가 없으면 보내지 않는다")
    void missingPhoneSkipsSend() {
        CredentialSmsResult result = service.deliver("  ", "user-7", PASSWORD, "tenant-a", 7L);

        assertThat(result.isSmsSent()).isFalse();
        assertThat(result.getSkipReason()).isEqualTo(ClientCredentialNotificationService.REASON_PHONE_MISSING);
        verify(smsAuthService, never()).sendConfidentialNotificationMessage(anyString(), anyString());
        assertThat(logs()).doesNotContain(PASSWORD);
    }

    @Test
    @DisplayName("템플릿이 없으면 등록은 실패로 표시하고 보내지 않는다")
    void missingTemplateSkipsSend() {
        properties.setSmsTemplate(" ");

        CredentialSmsResult result = service.deliver("01012345678", "user-7", PASSWORD, "tenant-a", 7L);

        assertThat(result.isSmsSent()).isFalse();
        assertThat(result.getSkipReason()).isEqualTo(ClientCredentialNotificationService.REASON_TEMPLATE_MISSING);
        verify(smsAuthService, never()).sendConfidentialNotificationMessage(anyString(), anyString());
    }

    private String logs() {
        StringBuilder builder = new StringBuilder();
        for (ILoggingEvent event : appender.list) {
            builder.append(event.getFormattedMessage()).append('\n');
        }
        return builder.toString();
    }
}
