package com.coresolution.consultation.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * provider-agnostic OAuth 휴대폰 매칭 흐름 — OTP 발송 응답 본문.
 *
 * <p>스키마는 기존 {@code ApplePhoneSendResponse} 와 호환 가능한 superset.
 * 추가 필드(maskedPhone, resendCooldownSeconds, code) 는 디자이너 산출물
 * (docs/design-system/OAUTH_PHONE_VERIFICATION_UX_SPEC.md §3) 의 요구사항을 충족한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OAuthPhoneSendResponse {

    /** 발송/처리 성공 여부. */
    private boolean success;

    /** 사용자 알림용 메시지(국문). */
    private String message;

    /** 실패 코드 (OTP_INVALID / OTP_EXPIRED / DAILY_LIMIT_EXCEEDED / TOKEN_EXPIRED 등). null 이면 성공 또는 일반 실패. */
    private String code;

    /** verify 호출 시 함께 보내야 하는 challenge 토큰 (phone_hash + otp_id 결합). 실패 시 null. */
    private String challengeToken;

    /** OTP 만료 시간(초). */
    private Long expiresInSeconds;

    /** 재발송 가능까지 남은 시간(초). 쿨다운 발생 시 채움. */
    private Long retryAfterSeconds;

    /** 클라이언트 카운트다운 표시용 권장 재발송 쿨다운(초). */
    private Long resendCooldownSeconds;

    /** 사용자에게 노출 가능한 마스킹 휴대폰(예: 010-****-5678). PII 노출 차단. */
    private String maskedPhone;
}
