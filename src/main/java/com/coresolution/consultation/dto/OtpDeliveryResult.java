package com.coresolution.consultation.dto;

import java.time.Instant;
import com.coresolution.consultation.constant.OtpDeliveryChannel;
import lombok.Builder;
import lombok.Value;

/**
 * OTP 발송 결과 — push-first → SMS 폴백 정책에서 실제 어떤 채널로 발송됐는지 표현.
 *
 * <p>{@link com.coresolution.consultation.service.OtpDeliveryService#deliver} 반환 타입이며,
 * 컨트롤러는 본 결과를 응답 body 의 {@code deliveryChannel} 키로 직렬화하여 FE 가 안내 메시지를
 * 분기할 수 있도록 한다. 모든 채널이 실패한 경우 {@link OtpDeliveryChannel#FAILED} 로
 * 반환되며, 호출자는 사용자 친화 오류 메시지로 4xx 응답을 작성한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Value
@Builder
public class OtpDeliveryResult {

    /**
     * 실제 발송된 채널. 모든 채널 실패 시 {@link OtpDeliveryChannel#FAILED}.
     */
    OtpDeliveryChannel channel;

    /**
     * 발송 결정 시각(UTC). null 가능(테스트 fallback).
     */
    Instant sentAt;

    /**
     * push 채널이 선택되지 않은 사유(예: {@code no_active_push_token}, {@code push_dispatch_failed},
     * {@code expo_access_token_missing}). FE/운영 진단 용도이며, 사용자에게 직접 노출하지 않는다.
     * 채널이 {@link OtpDeliveryChannel#PUSH} 인 경우 null.
     */
    String fallbackReason;

    /**
     * 모든 채널 실패 시 운영 진단용 메시지. 사용자에게는 노출하지 않는다.
     */
    String failureReason;

    /**
     * 실패 결과 헬퍼.
     *
     * @param reason 운영 진단용 사유
     * @return FAILED 채널 결과
     */
    public static OtpDeliveryResult failure(String reason) {
        return OtpDeliveryResult.builder()
                .channel(OtpDeliveryChannel.FAILED)
                .sentAt(Instant.now())
                .failureReason(reason)
                .build();
    }
}
