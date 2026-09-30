package com.coresolution.consultation.dto.auth;

/**
 * SMS OTP 발송 가능 상태 — {@code POST /api/v1/auth/sms/send} 응답 보조 필드의 출처.
 *
 * @param locked                인증 실패 누적으로 잠겼으면 true
 * @param retryAfterSeconds     잠김 해제까지 남은 초 (잠기지 않았으면 null)
 * @param expiresInSeconds      발송한 인증번호의 유효 시간(초)
 * @param resendCooldownSeconds 다시 받기까지 권장 대기 시간(초)
 * @param remainingAttempts     잠기기 전까지 남은 확인 시도 횟수
 * @author MindGarden
 * @since 2026-09-29
 */
public record SmsOtpSendStatus(
        boolean locked,
        Long retryAfterSeconds,
        long expiresInSeconds,
        long resendCooldownSeconds,
        int remainingAttempts) {

    /**
     * 발송 가능 상태.
     *
     * @param expiresInSeconds      인증번호 유효 시간(초)
     * @param resendCooldownSeconds 재발송 대기(초)
     * @param remainingAttempts     남은 확인 시도 횟수
     * @return 잠기지 않은 상태
     */
    public static SmsOtpSendStatus available(
            long expiresInSeconds, long resendCooldownSeconds, int remainingAttempts) {
        return new SmsOtpSendStatus(false, null, expiresInSeconds, resendCooldownSeconds, remainingAttempts);
    }

    /**
     * 잠김 상태.
     *
     * @param retryAfterSeconds     잠김 해제까지 남은 초
     * @param expiresInSeconds      인증번호 유효 시간(초)
     * @param resendCooldownSeconds 재발송 대기(초)
     * @return 잠긴 상태 (남은 시도 0)
     */
    public static SmsOtpSendStatus locked(
            long retryAfterSeconds, long expiresInSeconds, long resendCooldownSeconds) {
        return new SmsOtpSendStatus(true, retryAfterSeconds, expiresInSeconds, resendCooldownSeconds, 0);
    }
}
