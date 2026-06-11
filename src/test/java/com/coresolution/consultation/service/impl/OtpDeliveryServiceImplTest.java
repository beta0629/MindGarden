package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.OtpDeliveryChannel;
import com.coresolution.consultation.constant.OtpPurpose;
import com.coresolution.consultation.dto.OtpDeliveryResult;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.SmsGatewayService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link OtpDeliveryServiceImpl} 단위 테스트.
 *
 * <p>push-first → SMS 폴백 정책의 모든 분기 검증:
 * <ol>
 *   <li>push 발송 성공 시 SMS 호출 없음 (중복 발송 차단)</li>
 *   <li>push token 없음 → SMS 폴백 + fallbackReason 적재</li>
 *   <li>push 발송 실패 → SMS 폴백</li>
 *   <li>SMS 게이트웨이 stub 모드 → SMS_STUB 채널 반환</li>
 *   <li>push·SMS 모두 실패 → FAILED 채널 + failureReason</li>
 *   <li>userId null (비로그인) → push skip + SMS 발송</li>
 *   <li>code 형식 비정상 → 즉시 FAILED</li>
 * </ol></p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@ExtendWith(MockitoExtension.class)
class OtpDeliveryServiceImplTest {

    @Mock
    private MobilePushDispatchService mobilePushDispatchService;

    @Mock
    private SmsGatewayService smsGatewayService;

    @InjectMocks
    private OtpDeliveryServiceImpl sut;

    private static final String TENANT_ID = "mindgarden";
    private static final Long USER_ID = 42L;
    private static final String PHONE = "01012345678";
    private static final String CODE = "123456";

    @Test
    @DisplayName("push 발송 성공 시 채널=PUSH, SMS 호출 없음")
    void deliver_whenPushSucceeds_returnsPush_andSkipsSms() {
        when(mobilePushDispatchService.dispatchAuthenticationOtp(
                eq(TENANT_ID), eq(USER_ID), anyString(), anyString(), eq(OtpPurpose.PHONE_CHANGE.getCode())))
                .thenReturn(true);

        OtpDeliveryResult result = sut.deliver(TENANT_ID, USER_ID, PHONE, CODE, OtpPurpose.PHONE_CHANGE);

        assertThat(result.getChannel()).isEqualTo(OtpDeliveryChannel.PUSH);
        assertThat(result.getFallbackReason()).isNull();
        assertThat(result.getSentAt()).isNotNull();
        verify(smsGatewayService, never()).send(anyString(), anyString());
    }

    @Test
    @DisplayName("push 발송 실패 → SMS 폴백 + fallbackReason 기록")
    void deliver_whenPushFails_fallsBackToSms() {
        when(mobilePushDispatchService.dispatchAuthenticationOtp(
                eq(TENANT_ID), eq(USER_ID), anyString(), anyString(), anyString()))
                .thenReturn(false);
        when(smsGatewayService.send(eq(PHONE), anyString())).thenReturn(true);
        when(smsGatewayService.isStubMode()).thenReturn(false);

        OtpDeliveryResult result = sut.deliver(TENANT_ID, USER_ID, PHONE, CODE, OtpPurpose.PHONE_CHANGE);

        assertThat(result.getChannel()).isEqualTo(OtpDeliveryChannel.SMS);
        assertThat(result.getFallbackReason()).isEqualTo("push_dispatch_failed_or_no_token");
        verify(smsGatewayService, times(1)).send(eq(PHONE), anyString());
    }

    @Test
    @DisplayName("userId 없음(비로그인) → push skip + SMS 발송")
    void deliver_whenNoUser_skipsPush_andSendsSms() {
        when(smsGatewayService.send(eq(PHONE), anyString())).thenReturn(true);
        when(smsGatewayService.isStubMode()).thenReturn(false);

        OtpDeliveryResult result = sut.deliver(TENANT_ID, null, PHONE, CODE, OtpPurpose.SIGNUP_VERIFICATION);

        assertThat(result.getChannel()).isEqualTo(OtpDeliveryChannel.SMS);
        assertThat(result.getFallbackReason()).isEqualTo("no_user_context");
        verify(mobilePushDispatchService, never()).dispatchAuthenticationOtp(
                anyString(), any(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("SMS 게이트웨이 stub 모드 → 채널=SMS_STUB")
    void deliver_whenSmsStubMode_returnsSmsStubChannel() {
        when(mobilePushDispatchService.dispatchAuthenticationOtp(
                anyString(), any(), anyString(), anyString(), anyString()))
                .thenReturn(false);
        when(smsGatewayService.send(eq(PHONE), anyString())).thenReturn(true);
        when(smsGatewayService.isStubMode()).thenReturn(true);

        OtpDeliveryResult result = sut.deliver(TENANT_ID, USER_ID, PHONE, CODE, OtpPurpose.PHONE_CHANGE);

        assertThat(result.getChannel()).isEqualTo(OtpDeliveryChannel.SMS_STUB);
    }

    @Test
    @DisplayName("push·SMS 모두 실패 → 채널=FAILED + failureReason")
    void deliver_whenAllChannelsFail_returnsFailed() {
        when(mobilePushDispatchService.dispatchAuthenticationOtp(
                anyString(), any(), anyString(), anyString(), anyString()))
                .thenReturn(false);
        when(smsGatewayService.send(eq(PHONE), anyString())).thenReturn(false);

        OtpDeliveryResult result = sut.deliver(TENANT_ID, USER_ID, PHONE, CODE, OtpPurpose.PHONE_CHANGE);

        assertThat(result.getChannel()).isEqualTo(OtpDeliveryChannel.FAILED);
        assertThat(result.getFailureReason()).contains("sms_dispatch_failed");
    }

    @Test
    @DisplayName("code 형식 비정상 → 즉시 FAILED + push·SMS 호출 없음")
    void deliver_whenInvalidCode_returnsFailedImmediately() {
        OtpDeliveryResult result = sut.deliver(TENANT_ID, USER_ID, PHONE, "12345", OtpPurpose.PHONE_CHANGE);

        assertThat(result.getChannel()).isEqualTo(OtpDeliveryChannel.FAILED);
        assertThat(result.getFailureReason()).isEqualTo("invalid_code_format");
        verify(mobilePushDispatchService, never()).dispatchAuthenticationOtp(
                anyString(), any(), anyString(), anyString(), anyString());
        verify(smsGatewayService, never()).send(anyString(), anyString());
    }

    @Test
    @DisplayName("push 발송 시 OTP code 가 본문에 포함되어 전달된다")
    void deliver_whenPush_includesCodeInBody() {
        when(mobilePushDispatchService.dispatchAuthenticationOtp(
                anyString(), any(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        sut.deliver(TENANT_ID, USER_ID, PHONE, CODE, OtpPurpose.PHONE_CHANGE);

        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(mobilePushDispatchService).dispatchAuthenticationOtp(
                eq(TENANT_ID), eq(USER_ID), anyString(), bodyCaptor.capture(), anyString());
        assertThat(bodyCaptor.getValue()).contains(CODE);
    }

    @Test
    @DisplayName("SMS 폴백 시 OTP code 가 본문에 포함되어 전달된다")
    void deliver_whenSms_includesCodeInBody() {
        when(mobilePushDispatchService.dispatchAuthenticationOtp(
                anyString(), any(), anyString(), anyString(), anyString()))
                .thenReturn(false);
        when(smsGatewayService.send(eq(PHONE), anyString())).thenReturn(true);
        when(smsGatewayService.isStubMode()).thenReturn(false);

        sut.deliver(TENANT_ID, USER_ID, PHONE, CODE, OtpPurpose.LOGIN_VERIFICATION);

        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(smsGatewayService).send(eq(PHONE), bodyCaptor.capture());
        assertThat(bodyCaptor.getValue()).contains(CODE);
    }
}
