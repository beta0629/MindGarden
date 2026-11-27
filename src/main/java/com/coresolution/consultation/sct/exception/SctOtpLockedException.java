package com.coresolution.consultation.sct.exception;

/**
 * SCT 본인확인 SMS OTP 오답 잠금. HTTP 429.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public class SctOtpLockedException extends RuntimeException {

    /**
     * @param message 메시지(일치여부·실번호·코드 금지)
     */
    public SctOtpLockedException(String message) {
        super(message);
    }
}
