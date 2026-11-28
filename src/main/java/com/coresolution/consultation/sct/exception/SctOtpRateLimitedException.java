package com.coresolution.consultation.sct.exception;

/**
 * SCT 본인확인 SMS OTP rate limit. HTTP 429.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public class SctOtpRateLimitedException extends RuntimeException {

    private final Long retryAfterSeconds;

    /**
     * @param message 메시지(일치여부·실번호·코드 금지)
     */
    public SctOtpRateLimitedException(String message) {
        this(message, null);
    }

    /**
     * @param message           메시지(일치여부·실번호·코드 금지)
     * @param retryAfterSeconds 다시 시도 가능해질 때까지 남은 초(모르면 null)
     */
    public SctOtpRateLimitedException(String message, Long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    /**
     * @return 남은 대기 초(없으면 null)
     */
    public Long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
