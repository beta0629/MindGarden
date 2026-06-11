package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.OtpDeliveryChannel;
import com.coresolution.consultation.constant.OtpPurpose;
import com.coresolution.consultation.dto.OtpDeliveryResult;
import com.coresolution.consultation.dto.SmsGatewaySendResult;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.OtpCurrentTokenService;
import com.coresolution.consultation.service.SmsGatewayService;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
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
 * <p>2026-06-11 PR #224 후속 — push body 평문 OTP 차단 + AuditLog OTP_SENT 적재 회귀 가드:
 * <ol>
 *   <li>push 채널 성공 시 push body 에 평문 OTP 코드가 포함되지 않는다(잠금 화면 노출 차단).</li>
 *   <li>push 채널 성공 시 OtpCurrentTokenService.issue 로 발급된 토큰이 dispatchAuthenticationOtp 로 전달된다.</li>
 *   <li>모든 발송 결과(PUSH/SMS/SMS_STUB/FAILED) 는 AuditLog OTP_SENT 1행으로 적재되며
 *       metadata 에 delivery_channel/purpose/masked_target/gateway_response_code/ip_address 가 포함된다.</li>
 *   <li>NCP SENS 정식 응답 코드(예: "202") 가 metadata.gateway_response_code 로 적재된다.</li>
 *   <li>fetchCurrentOtp 는 OtpCurrentTokenService.fetchAndConsume 로 위임된다.</li>
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

    @Mock
    private OtpCurrentTokenService otpCurrentTokenService;

    @Mock
    private AuditLogService auditLogService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private OtpDeliveryServiceImpl sut;

    private static final String TENANT_ID = "mindgarden";
    private static final Long USER_ID = 42L;
    private static final String PHONE = "01012345678";
    private static final String CODE = "123456";
    private static final String IP = "203.0.113.55";

    @Test
    @DisplayName("push 성공 시 채널=PUSH, SMS 호출 없음, push body 에 평문 OTP 미포함, data 에 otpToken 동봉")
    void deliver_whenPushSucceeds_returnsPush_andStripsPlainOtp() {
        when(otpCurrentTokenService.issue(eq(USER_ID), eq(CODE))).thenReturn("token-xyz");
        when(mobilePushDispatchService.dispatchAuthenticationOtp(
                eq(TENANT_ID), eq(USER_ID), anyString(), anyString(), anyString(), eq("token-xyz")))
                .thenReturn(true);

        OtpDeliveryResult result = sut.deliver(
                TENANT_ID, USER_ID, PHONE, CODE, OtpPurpose.PHONE_CHANGE, IP);

        assertThat(result.getChannel()).isEqualTo(OtpDeliveryChannel.PUSH);
        verify(smsGatewayService, never()).sendDetailed(anyString(), anyString());

        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(mobilePushDispatchService).dispatchAuthenticationOtp(
                eq(TENANT_ID), eq(USER_ID), anyString(), bodyCaptor.capture(), anyString(), eq("token-xyz"));
        assertThat(bodyCaptor.getValue())
                .doesNotContain(CODE)
                .isEqualTo("인증번호가 발송되었습니다. 앱에서 확인하세요.");

        AuditLog audit = captureAuditLog();
        assertThat(audit.getAction()).isEqualTo(AuditAction.OTP_SENT);
        assertThat(audit.getActorUserId()).isEqualTo(USER_ID);
        assertThat(audit.getTargetUserId()).isEqualTo(USER_ID);
        assertThat(audit.getIpAddress()).isEqualTo(IP);
        assertThat(audit.getMetadataJson())
                .contains("\"delivery_channel\":\"PUSH\"")
                .contains("\"purpose\":\"PHONE_CHANGE\"")
                .contains("\"gateway_response_code\":\"push\"")
                .contains("\"ip_address\":\"" + IP + "\"");
    }

    @Test
    @DisplayName("push 실패 → SMS 폴백 성공 시 NCP SENS 응답 코드(\"202\")가 AuditLog 에 적재")
    void deliver_whenSmsFallback_recordsGatewayResponseCode() {
        when(otpCurrentTokenService.issue(eq(USER_ID), eq(CODE))).thenReturn("token-xyz");
        when(mobilePushDispatchService.dispatchAuthenticationOtp(
                anyString(), any(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(false);
        when(smsGatewayService.sendDetailed(eq(PHONE), anyString()))
                .thenReturn(SmsGatewaySendResult.success("202", "accepted"));
        when(smsGatewayService.isStubMode()).thenReturn(false);

        OtpDeliveryResult result = sut.deliver(
                TENANT_ID, USER_ID, PHONE, CODE, OtpPurpose.PHONE_CHANGE, IP);

        assertThat(result.getChannel()).isEqualTo(OtpDeliveryChannel.SMS);
        assertThat(result.getFallbackReason()).isEqualTo("push_dispatch_failed_or_no_token");
        verify(smsGatewayService, times(1)).sendDetailed(eq(PHONE), anyString());

        AuditLog audit = captureAuditLog();
        assertThat(audit.getMetadataJson())
                .contains("\"delivery_channel\":\"SMS\"")
                .contains("\"gateway_response_code\":\"202\"")
                .contains("\"fallback_reason\":\"push_dispatch_failed_or_no_token\"");
    }

    @Test
    @DisplayName("SMS 게이트웨이 stub 모드 → 채널=SMS_STUB + gateway_response_code=\"stub\"")
    void deliver_whenSmsStubMode_recordsStubChannel() {
        when(otpCurrentTokenService.issue(eq(USER_ID), eq(CODE))).thenReturn("token-xyz");
        when(mobilePushDispatchService.dispatchAuthenticationOtp(
                anyString(), any(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(false);
        when(smsGatewayService.sendDetailed(eq(PHONE), anyString()))
                .thenReturn(SmsGatewaySendResult.stub());
        when(smsGatewayService.isStubMode()).thenReturn(true);

        OtpDeliveryResult result = sut.deliver(
                TENANT_ID, USER_ID, PHONE, CODE, OtpPurpose.PHONE_CHANGE, IP);

        assertThat(result.getChannel()).isEqualTo(OtpDeliveryChannel.SMS_STUB);

        AuditLog audit = captureAuditLog();
        assertThat(audit.getMetadataJson())
                .contains("\"delivery_channel\":\"SMS_STUB\"")
                .contains("\"gateway_response_code\":\"stub\"");
    }

    @Test
    @DisplayName("push·SMS 모두 실패 → FAILED + AuditLog 에 실패 코드 + fallback_reason 적재")
    void deliver_whenAllChannelsFail_recordsFailureInAudit() {
        when(otpCurrentTokenService.issue(eq(USER_ID), eq(CODE))).thenReturn("token-xyz");
        when(mobilePushDispatchService.dispatchAuthenticationOtp(
                anyString(), any(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(false);
        when(smsGatewayService.sendDetailed(eq(PHONE), anyString()))
                .thenReturn(SmsGatewaySendResult.failure("500", "server error"));

        OtpDeliveryResult result = sut.deliver(
                TENANT_ID, USER_ID, PHONE, CODE, OtpPurpose.PHONE_CHANGE, IP);

        assertThat(result.getChannel()).isEqualTo(OtpDeliveryChannel.FAILED);

        AuditLog audit = captureAuditLog();
        assertThat(audit.getMetadataJson())
                .contains("\"delivery_channel\":\"FAILED\"")
                .contains("\"gateway_response_code\":\"500\"");
    }

    @Test
    @DisplayName("userId 없음(비로그인) → push skip + SMS 발송 + AuditLog actorUserId=null/ANONYMOUS")
    void deliver_whenNoUser_skipsPush_andSendsSms_andAuditAnonymous() {
        when(smsGatewayService.sendDetailed(eq(PHONE), anyString()))
                .thenReturn(SmsGatewaySendResult.success("202", "accepted"));
        when(smsGatewayService.isStubMode()).thenReturn(false);

        OtpDeliveryResult result = sut.deliver(
                TENANT_ID, null, PHONE, CODE, OtpPurpose.SIGNUP_VERIFICATION, IP);

        assertThat(result.getChannel()).isEqualTo(OtpDeliveryChannel.SMS);
        assertThat(result.getFallbackReason()).isEqualTo("no_user_context");
        verify(mobilePushDispatchService, never()).dispatchAuthenticationOtp(
                anyString(), any(), anyString(), anyString(), anyString(), anyString());

        AuditLog audit = captureAuditLog();
        assertThat(audit.getActorUserId()).isNull();
        assertThat(audit.getActorRole()).isEqualTo("ANONYMOUS");
        assertThat(audit.getMetadataJson())
                .contains("\"fallback_reason\":\"no_user_context\"");
    }

    @Test
    @DisplayName("code 형식 비정상 → 즉시 FAILED + push·SMS·AuditLog 호출 없음")
    void deliver_whenInvalidCode_returnsFailedImmediately_andSkipsAudit() {
        OtpDeliveryResult result = sut.deliver(
                TENANT_ID, USER_ID, PHONE, "12345", OtpPurpose.PHONE_CHANGE, IP);

        assertThat(result.getChannel()).isEqualTo(OtpDeliveryChannel.FAILED);
        assertThat(result.getFailureReason()).isEqualTo("invalid_code_format");
        verify(mobilePushDispatchService, never()).dispatchAuthenticationOtp(
                anyString(), any(), anyString(), anyString(), anyString(), anyString());
        verify(smsGatewayService, never()).sendDetailed(anyString(), anyString());
        verify(auditLogService, never()).record(any(AuditLog.class));
    }

    @Test
    @DisplayName("masked_target 은 phone 번호의 가운데 4자리를 마스킹한다")
    void deliver_audit_masksPhoneInMetadata() {
        when(otpCurrentTokenService.issue(eq(USER_ID), eq(CODE))).thenReturn("token-xyz");
        when(mobilePushDispatchService.dispatchAuthenticationOtp(
                anyString(), any(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        sut.deliver(TENANT_ID, USER_ID, PHONE, CODE, OtpPurpose.PHONE_CHANGE, IP);

        AuditLog audit = captureAuditLog();
        assertThat(audit.getMetadataJson())
                .doesNotContain(PHONE) // 평문 phone 노출 금지
                .contains("\"masked_target\":");
    }

    @Test
    @DisplayName("fetchCurrentOtp 는 OtpCurrentTokenService.fetchAndConsume 으로 위임된다")
    void fetchCurrentOtp_delegatesToTokenService() {
        when(otpCurrentTokenService.fetchAndConsume(eq("token-xyz"), eq(USER_ID)))
                .thenReturn(java.util.Optional.of(CODE));

        String result = sut.fetchCurrentOtp("token-xyz", USER_ID);

        assertThat(result).isEqualTo(CODE);
        verify(otpCurrentTokenService, times(1)).fetchAndConsume(eq("token-xyz"), eq(USER_ID));
    }

    @Test
    @DisplayName("fetchCurrentOtp 가 빈 결과를 받으면 null 을 반환한다")
    void fetchCurrentOtp_returnsNull_whenEmpty() {
        when(otpCurrentTokenService.fetchAndConsume(eq("token-xyz"), eq(USER_ID)))
                .thenReturn(java.util.Optional.empty());

        String result = sut.fetchCurrentOtp("token-xyz", USER_ID);

        assertThat(result).isNull();
    }

    private AuditLog captureAuditLog() {
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogService, times(1)).record(captor.capture());
        return captor.getValue();
    }
}
