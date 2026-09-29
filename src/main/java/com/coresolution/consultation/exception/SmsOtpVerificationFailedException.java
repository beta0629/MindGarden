package com.coresolution.consultation.exception;

import com.coresolution.consultation.dto.auth.SmsOtpSendStatus;

/**
 * SMS OTP 확인 실패 — 틀림·만료(400, 남은 시도 횟수) 또는 실패 누적 잠김(429, 잠김 해제까지 남은 초).
 *
 * <p>{@link IllegalArgumentException} 을 상속해 기존 호출부·테스트의 400 분기와 호환된다.
 * {@link GlobalExceptionHandler} 가 {@code data.remainingAttempts} · {@code data.locked} ·
 * {@code data.retryAfterSeconds} 를 본문에 싣는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-29
 */
public class SmsOtpVerificationFailedException extends IllegalArgumentException {

    private static final long serialVersionUID = 1L;

    /** 틀림·만료 — FE 는 「인증 코드」 문구로 오답을 구분한다. */
    public static final String MSG_INVALID = "인증 코드가 올바르지 않거나 만료되었습니다. 다시 받아 주세요.";

    /** 실패 누적 잠김. */
    public static final String MSG_LOCKED = "인증 시도 횟수를 넘었습니다. 잠시 뒤에 다시 시도해 주세요.";

    /** 틀림·만료 응답 코드. */
    public static final String ERROR_CODE_INVALID = "SMS_OTP_INVALID";

    /** 잠김 응답 코드. */
    public static final String ERROR_CODE_LOCKED = "SMS_OTP_LOCKED";

    private final boolean locked;
    private final int remainingAttempts;
    private final Long retryAfterSeconds;

    private SmsOtpVerificationFailedException(
            String message, boolean locked, int remainingAttempts, Long retryAfterSeconds) {
        super(message);
        this.locked = locked;
        this.remainingAttempts = remainingAttempts;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    /**
     * 확인 실패 직후의 OTP 상태로 예외를 만든다.
     *
     * @param status {@code SmsOtpVerificationService#getSendStatus} 결과 (null 이면 남은 횟수 미상 · 잠김 아님)
     * @return 잠김이면 잠김 예외, 아니면 틀림·만료 예외
     */
    public static SmsOtpVerificationFailedException fromStatus(SmsOtpSendStatus status) {
        if (status != null && status.locked()) {
            return new SmsOtpVerificationFailedException(MSG_LOCKED, true, 0, status.retryAfterSeconds());
        }
        int remaining = status == null ? -1 : status.remainingAttempts();
        return new SmsOtpVerificationFailedException(MSG_INVALID, false, remaining, null);
    }

    /**
     * @return 실패 누적으로 잠겼으면 true
     */
    public boolean isLocked() {
        return locked;
    }

    /**
     * @return 잠기기 전 남은 확인 시도 횟수 (미상이면 음수)
     */
    public int getRemainingAttempts() {
        return remainingAttempts;
    }

    /**
     * @return 잠김 해제까지 남은 초 (잠기지 않았으면 null)
     */
    public Long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }

    /**
     * @return 응답 에러 코드
     */
    public String getErrorCode() {
        return locked ? ERROR_CODE_LOCKED : ERROR_CODE_INVALID;
    }
}
