package com.coresolution.consultation.service.impl;

import java.time.Instant;
import com.coresolution.consultation.constant.OtpDeliveryChannel;
import com.coresolution.consultation.constant.OtpPurpose;
import com.coresolution.consultation.dto.OtpDeliveryResult;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.OtpDeliveryService;
import com.coresolution.consultation.service.SmsGatewayService;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OTP 발송 SSOT 구현 — push-first 분기 + SMS 폴백.
 *
 * <p>{@link OtpDeliveryService} 정책 참고. 본 구현은 OTP 저장·검증 책임을 갖지 않고
 * 채널 결정·전송만 담당한다(저장은 {@code SmsOtpVerificationService} SSOT, 호출자가 사전 수행).</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpDeliveryServiceImpl implements OtpDeliveryService {

    private static final String OTP_PUSH_TITLE = "[MindGarden] 인증번호";
    private static final String OTP_PUSH_BODY_FMT = "인증번호: %s (5분 내 입력)";
    private static final String OTP_SMS_BODY_FMT = "[MindGarden] 인증번호: %s (5분 내 입력)";

    private final MobilePushDispatchService mobilePushDispatchService;
    private final SmsGatewayService smsGatewayService;

    @Override
    public OtpDeliveryResult deliver(
            String tenantId,
            Long userId,
            String normalizedPhone,
            String code,
            OtpPurpose purpose) {
        if (code == null || !code.matches("^\\d{6}$")) {
            log.warn("OTP 발송 거부: 코드 형식 비정상");
            return OtpDeliveryResult.failure("invalid_code_format");
        }
        OtpPurpose effectivePurpose = purpose != null ? purpose : OtpPurpose.GENERIC;

        // 1. push-first 시도 — 로그인 사용자 + 테넌트 ID 둘 다 존재해야 push 후보.
        String pushFallbackReason = tryPush(tenantId, userId, code, effectivePurpose);
        if (pushFallbackReason == null) {
            log.info("OTP 발송 채널 결정: PUSH tenantId={} userId={} purpose={}",
                    tenantId, userId, effectivePurpose.getCode());
            return OtpDeliveryResult.builder()
                    .channel(OtpDeliveryChannel.PUSH)
                    .sentAt(Instant.now())
                    .build();
        }

        // 2. SMS 폴백 — 전화번호 없으면 폴백 불가.
        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            log.warn("OTP 발송 실패: SMS 폴백 불가(phone 없음) tenantId={} userId={} reason={}",
                    tenantId, userId, pushFallbackReason);
            return OtpDeliveryResult.failure("sms_fallback_no_phone:" + pushFallbackReason);
        }
        String smsBody = String.format(OTP_SMS_BODY_FMT, code);
        boolean smsSent = smsGatewayService.send(normalizedPhone, smsBody);
        if (!smsSent) {
            log.warn("OTP 발송 실패: push·SMS 모두 실패 tenantId={} userId={} pushReason={}",
                    tenantId, userId, pushFallbackReason);
            return OtpDeliveryResult.failure("sms_dispatch_failed:" + pushFallbackReason);
        }
        OtpDeliveryChannel smsChannel = smsGatewayService.isStubMode()
                ? OtpDeliveryChannel.SMS_STUB
                : OtpDeliveryChannel.SMS;
        log.info("OTP 발송 채널 결정: {} tenantId={} userId={} purpose={} pushFallbackReason={}",
                smsChannel, tenantId, userId, effectivePurpose.getCode(), pushFallbackReason);
        return OtpDeliveryResult.builder()
                .channel(smsChannel)
                .sentAt(Instant.now())
                .fallbackReason(pushFallbackReason)
                .build();
    }

    /**
     * push 발송 시도. 성공 시 null, 폴백이 필요하면 사유 문자열을 반환한다.
     */
    private String tryPush(String tenantId, Long userId, String code, OtpPurpose purpose) {
        if (userId == null) {
            return "no_user_context";
        }
        if (tenantId == null || tenantId.isBlank()) {
            return "no_tenant_context";
        }
        String body = String.format(OTP_PUSH_BODY_FMT, code);
        boolean ok = mobilePushDispatchService.dispatchAuthenticationOtp(
                tenantId, userId, OTP_PUSH_TITLE, body, purpose.getCode());
        return ok ? null : "push_dispatch_failed_or_no_token";
    }
}
