package com.coresolution.consultation.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Apple SIWA 휴대폰 매칭 흐름 — OTP 발송 응답 본문.
 *
 * <p>실패 시 {@code success=false} + {@code message} 만 채워 반환한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplePhoneSendResponse {

    /** 발송/처리 성공 여부. */
    private boolean success;

    /** 사용자 알림용 메시지(국문). */
    private String message;

    /**
     * verify 호출 시 함께 보내야 하는 challenge 토큰 (phone_hash + otp_id 결합).
     * 실패 시 null.
     */
    private String otpChallengeToken;

    /** OTP 만료 시간(초) — 클라이언트 카운트다운 표시용. */
    private Long expiresInSeconds;

    /** 재발송 가능까지 남은 시간(초) — 쿨다운 발생 시 채움. */
    private Long retryAfterSeconds;
}
