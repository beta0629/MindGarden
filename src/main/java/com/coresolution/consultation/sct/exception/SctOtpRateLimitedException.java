package com.coresolution.consultation.sct.exception;

/**
 * SCT 본인확인 SMS OTP rate limit. HTTP 429.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public class SctOtpRateLimitedException extends RuntimeException {

    /**
     * @param message 메시지(일치여부·실번호·코드 금지)
     */
    public SctOtpRateLimitedException(String message) {
        super(message);
    }
}
