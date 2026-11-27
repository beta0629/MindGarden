package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.util.PhoneLogMasking;
import java.util.List;
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
 * 2026-11-11 운영 RCA — SMS 테스트 모드는 실제 발송 없이 {@code true} 를 돌려줘
 * 발송 로그가 success=1 로 남던 문제. 미발송은 실패로 기록돼야 한다.
 *
 * <p>2026-11-27: 테스트 모드 INFO 로그는 마스킹 phone·bodyLength 만 남기고
 * 본문·URL 평문을 포함하지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationDispatchHelper — SMS 테스트 모드 미발송 = 실패")
class NotificationDispatchHelperSmsTestModeTest {

    private static final String PHONE = "01000000000";
    private static final String CONTENT = "예약 확인 https://example.com/r/1";
    private static final String CONTENT_URL = "https://example.com/r/1";

    @Mock
    private SmsAuthService smsAuthService;
    @Mock
    private KakaoAlimTalkService kakaoAlimTalkService;
    @InjectMocks
    private NotificationDispatchHelper helper;

    private ListAppender<ILoggingEvent> logAppender;
    private Logger helperLogger;

    @BeforeEach
    void attachAppender() {
        helperLogger = (Logger) LoggerFactory.getLogger(NotificationDispatchHelper.class);
        logAppender = new ListAppender<>();
        logAppender.start();
        helperLogger.addAppender(logAppender);
    }

    @AfterEach
    void detachAppender() {
        if (helperLogger != null && logAppender != null) {
            helperLogger.detachAppender(logAppender);
        }
    }

    @Test
    @DisplayName("테스트 모드 → 발송기 미호출, success=false + SMS_TEST_MODE_NOT_SENT + bodyLength 로그(본문·URL 미포함)")
    void dispatchSms_testMode_isFailure() {
        when(smsAuthService.isTestMode()).thenReturn(true);

        NotificationDispatchHelper.DispatchResult result = helper.dispatchSms(PHONE, CONTENT);

        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_SMS_TEST_MODE_NOT_SENT);
        assertThat(result.errorMessage()).isEqualTo(NotificationDispatchHelper.SMS_TEST_MODE_NOT_SENT_MESSAGE);
        verify(smsAuthService, never()).sendNotificationMessage(anyString(), anyString());

        String masked = PhoneLogMasking.maskForLog(PHONE);

        List<ILoggingEvent> infos = logAppender.list.stream()
                .filter(e -> e.getLevel() == Level.INFO)
                .toList();
        assertThat(infos).anySatisfy(event -> {
            String msg = event.getFormattedMessage();
            assertThat(msg).contains("SMS_TEST_MODE_NOT_SENT");
            assertThat(msg).contains("testMode=true");
            assertThat(msg).contains(masked);
            assertThat(msg).contains("bodyLength=" + CONTENT.length());
            assertThat(msg).doesNotContain(PHONE);
            assertThat(msg).doesNotContain(CONTENT);
            assertThat(msg).doesNotContain(CONTENT_URL);
            assertThat(msg).doesNotContain("urls=");
            assertThat(msg).doesNotContain("content=");
        });
    }

    @Test
    @DisplayName("운영 모드 + 발송 성공 → success=true, errorCode 없음")
    void dispatchSms_liveSuccess_hasNoErrorCode() {
        when(smsAuthService.isTestMode()).thenReturn(false);
        when(smsAuthService.sendNotificationMessage(PHONE, "본문")).thenReturn(true);

        NotificationDispatchHelper.DispatchResult result = helper.dispatchSms(PHONE, "본문");

        assertThat(result.success()).isTrue();
        assertThat(result.errorCode()).isNull();
    }
}
