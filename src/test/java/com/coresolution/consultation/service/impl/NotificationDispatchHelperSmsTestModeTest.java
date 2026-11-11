package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.SmsAuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 2026-11-11 운영 RCA — SMS 테스트 모드는 실제 발송 없이 {@code true} 를 돌려줘
 * 발송 로그가 success=1 로 남던 문제. 미발송은 실패로 기록돼야 한다.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationDispatchHelper — SMS 테스트 모드 미발송 = 실패")
class NotificationDispatchHelperSmsTestModeTest {

    private static final String PHONE = "01000000000";

    @Mock
    private SmsAuthService smsAuthService;
    @Mock
    private KakaoAlimTalkService kakaoAlimTalkService;
    @InjectMocks
    private NotificationDispatchHelper helper;

    @Test
    @DisplayName("테스트 모드 → 발송기 미호출, success=false + SMS_TEST_MODE_NOT_SENT")
    void dispatchSms_testMode_isFailure() {
        when(smsAuthService.isTestMode()).thenReturn(true);

        NotificationDispatchHelper.DispatchResult result = helper.dispatchSms(PHONE, "본문");

        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_SMS_TEST_MODE_NOT_SENT);
        verify(smsAuthService, never()).sendNotificationMessage(anyString(), anyString());
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
