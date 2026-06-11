package com.coresolution.consultation.service.impl;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.OtpDeliveryChannel;
import com.coresolution.consultation.constant.OtpPurpose;
import com.coresolution.consultation.dto.OtpDeliveryResult;
import com.coresolution.consultation.dto.SmsGatewaySendResult;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.OtpCurrentTokenService;
import com.coresolution.consultation.service.OtpDeliveryService;
import com.coresolution.consultation.service.SmsGatewayService;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OTP 발송 SSOT 구현 — push-first 분기 + SMS 폴백 + AuditLog OTP_SENT 적재.
 *
 * <p>{@link OtpDeliveryService} 정책 참고. 본 구현은 OTP 저장·검증 책임을 갖지 않고
 * 채널 결정·전송만 담당한다(저장은 {@code SmsOtpVerificationService} SSOT, 호출자가 사전 수행).</p>
 *
 * <p>2026-06-11 PR #224 후속:
 * <ul>
 *   <li>push body 평문 OTP 제거 + {@link OtpCurrentTokenService} 토큰 동봉(data.otpToken).</li>
 *   <li>모든 발송 결과는 {@link AuditAction#OTP_SENT} 감사 로그 1행으로 적재
 *       (delivery_channel/purpose/masked_target/gateway_response_code/ip_address/fallback_reason).</li>
 *   <li>SMS 게이트웨이 정식 응답 코드는 {@link SmsGatewayService#sendDetailed(String, String)} 로 수집.</li>
 * </ul></p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpDeliveryServiceImpl implements OtpDeliveryService {

    private static final String OTP_PUSH_TITLE = "[MindGarden] 인증번호";

    /**
     * 2026-06-11 PR #224 후속 — 잠금 화면 평문 OTP 노출 차단 정책.
     * push body 에서 코드를 제거하고, 사용자가 앱을 열어 인증 화면에서
     * {@code /api/v1/auth/otp/current?otpToken=...} 로 1회 조회한다.
     */
    private static final String OTP_PUSH_BODY = "인증번호가 발송되었습니다. 앱에서 확인하세요.";
    private static final String OTP_SMS_BODY_FMT = "[MindGarden] 인증번호: %s (5분 내 입력)";

    private final MobilePushDispatchService mobilePushDispatchService;
    private final SmsGatewayService smsGatewayService;
    private final OtpCurrentTokenService otpCurrentTokenService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    @Override
    public OtpDeliveryResult deliver(
            String tenantId,
            Long userId,
            String normalizedPhone,
            String code,
            OtpPurpose purpose,
            String ipAddress) {
        if (code == null || !code.matches("^\\d{6}$")) {
            log.warn("OTP 발송 거부: 코드 형식 비정상");
            OtpDeliveryResult invalid = OtpDeliveryResult.failure("invalid_code_format");
            // 코드 형식 비정상은 일반적으로 호출자 버그 또는 입력 오류 — AuditLog 적재 생략(노이즈 차단).
            return invalid;
        }
        OtpPurpose effectivePurpose = purpose != null ? purpose : OtpPurpose.GENERIC;

        // 1. push-first 시도 — 로그인 사용자 + 테넌트 ID 둘 다 존재해야 push 후보.
        String pushFallbackReason = tryPush(tenantId, userId, code, effectivePurpose);
        if (pushFallbackReason == null) {
            log.info("OTP 발송 채널 결정: PUSH tenantId={} userId={} purpose={}",
                    tenantId, userId, effectivePurpose.getCode());
            OtpDeliveryResult result = OtpDeliveryResult.builder()
                    .channel(OtpDeliveryChannel.PUSH)
                    .sentAt(Instant.now())
                    .build();
            recordAudit(tenantId, userId, normalizedPhone, effectivePurpose,
                    OtpDeliveryChannel.PUSH, "push", ipAddress, null);
            return result;
        }

        // 2. SMS 폴백 — 전화번호 없으면 폴백 불가.
        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            log.warn("OTP 발송 실패: SMS 폴백 불가(phone 없음) tenantId={} userId={} reason={}",
                    tenantId, userId, pushFallbackReason);
            OtpDeliveryResult fail = OtpDeliveryResult.failure("sms_fallback_no_phone:" + pushFallbackReason);
            recordAudit(tenantId, userId, normalizedPhone, effectivePurpose,
                    OtpDeliveryChannel.FAILED, "no_phone", ipAddress, pushFallbackReason);
            return fail;
        }
        String smsBody = String.format(OTP_SMS_BODY_FMT, code);
        SmsGatewaySendResult smsResult = smsGatewayService.sendDetailed(normalizedPhone, smsBody);
        if (!smsResult.isOk()) {
            log.warn("OTP 발송 실패: push·SMS 모두 실패 tenantId={} userId={} pushReason={} smsCode={}",
                    tenantId, userId, pushFallbackReason, smsResult.getGatewayStatusCode());
            OtpDeliveryResult fail = OtpDeliveryResult.failure("sms_dispatch_failed:" + pushFallbackReason);
            recordAudit(tenantId, userId, normalizedPhone, effectivePurpose,
                    OtpDeliveryChannel.FAILED, smsResult.getGatewayStatusCode(), ipAddress, pushFallbackReason);
            return fail;
        }
        OtpDeliveryChannel smsChannel = smsGatewayService.isStubMode()
                ? OtpDeliveryChannel.SMS_STUB
                : OtpDeliveryChannel.SMS;
        log.info("OTP 발송 채널 결정: {} tenantId={} userId={} purpose={} pushFallbackReason={} smsCode={}",
                smsChannel, tenantId, userId, effectivePurpose.getCode(), pushFallbackReason,
                smsResult.getGatewayStatusCode());
        OtpDeliveryResult result = OtpDeliveryResult.builder()
                .channel(smsChannel)
                .sentAt(Instant.now())
                .fallbackReason(pushFallbackReason)
                .build();
        recordAudit(tenantId, userId, normalizedPhone, effectivePurpose,
                smsChannel, smsResult.getGatewayStatusCode(), ipAddress, pushFallbackReason);
        return result;
    }

    @Override
    public String fetchCurrentOtp(String otpToken, Long userId) {
        return otpCurrentTokenService.fetchAndConsume(otpToken, userId).orElse(null);
    }

    /**
     * push 발송 시도. 성공 시 null, 폴백이 필요하면 사유 문자열을 반환한다.
     *
     * <p>2026-06-11 PR #224 후속: push body 에는 평문 OTP 를 넣지 않고,
     * {@link OtpCurrentTokenService} 발급 토큰을 data 페이로드에 동봉한다.
     * push 발송 실패 시 발급된 토큰은 만료될 때까지 메모리에 남지만 단일 사용 정책으로 무해.</p>
     */
    private String tryPush(String tenantId, Long userId, String code, OtpPurpose purpose) {
        if (userId == null) {
            return "no_user_context";
        }
        if (tenantId == null || tenantId.isBlank()) {
            return "no_tenant_context";
        }
        String otpToken;
        try {
            otpToken = otpCurrentTokenService.issue(userId, code);
        } catch (Exception ex) {
            log.warn("OTP push token 발급 실패: userId={} reason={}", userId, ex.getMessage());
            return "otp_token_issue_failed";
        }
        boolean ok = mobilePushDispatchService.dispatchAuthenticationOtp(
                tenantId, userId, OTP_PUSH_TITLE, OTP_PUSH_BODY, purpose.getCode(), otpToken);
        return ok ? null : "push_dispatch_failed_or_no_token";
    }

    /**
     * AuditLog OTP_SENT 1행 적재. metadata JSON 직렬화 실패는 swallow 후 빈 metadata 로 적재.
     *
     * @param tenantId         테넌트 ID (null/blank 면 "_unknown" 로 표기)
     * @param userId           수신 사용자 PK (비로그인 흐름은 null)
     * @param phoneRaw         원본 정규화 전화번호 — 마스킹 후 metadata 에 적재
     * @param purpose          {@link OtpPurpose}
     * @param channel          실제 결정된 채널
     * @param gatewayCode      "push" / "stub" / NCP "202" / 예외 "exception" 등
     * @param ipAddress        호출자 IP (AuditLog.ipAddress 컬럼 + metadata 양쪽)
     * @param fallbackReason   push 미선택 사유 (null 허용)
     */
    private void recordAudit(
            String tenantId,
            Long userId,
            String phoneRaw,
            OtpPurpose purpose,
            OtpDeliveryChannel channel,
            String gatewayCode,
            String ipAddress,
            String fallbackReason) {
        try {
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("delivery_channel", channel.name());
            metadata.put("purpose", purpose.name());
            metadata.put("masked_target", PhoneLogMasking.maskForLog(phoneRaw));
            metadata.put("gateway_response_code", gatewayCode != null ? gatewayCode : "unknown");
            if (ipAddress != null && !ipAddress.isBlank()) {
                metadata.put("ip_address", ipAddress);
            }
            if (fallbackReason != null && !fallbackReason.isBlank()) {
                metadata.put("fallback_reason", fallbackReason);
            }
            String metadataJson = serializeMetadata(metadata);

            AuditLog entry = AuditLog.builder()
                    .tenantId(tenantId != null && !tenantId.isBlank() ? tenantId : "_unknown")
                    .actorUserId(userId)
                    .actorRole(userId != null ? "USER" : "ANONYMOUS")
                    .targetUserId(userId)
                    .action(AuditAction.OTP_SENT)
                    .entityType("OTP")
                    .ipAddress(ipAddress)
                    .metadataJson(metadataJson)
                    .build();
            auditLogService.record(entry);
        } catch (Exception ex) {
            // AuditLog 적재 실패가 OTP 발송 자체를 막지 않도록 swallow. 운영 진단용 WARN.
            log.warn("AuditLog OTP_SENT 적재 실패(무시): tenantId={} userId={} channel={} reason={}",
                    tenantId, userId, channel, ex.getMessage());
        }
    }

    private String serializeMetadata(Map<String, Object> metadata) {
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException ex) {
            log.warn("OTP_SENT metadata JSON 직렬화 실패(무시): {}", ex.getMessage());
            return "{}";
        }
    }
}
