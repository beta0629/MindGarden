package com.coresolution.consultation.sct.exception;

/**
 * SCT PHONE 채널 — SMS OTP 확인 필요. HTTP 400.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public class SctOtpRequiredException extends RuntimeException {

    /**
     * @param message 메시지(일치여부·실번호·코드 금지)
     */
    public SctOtpRequiredException(String message) {
        super(message);
    }
}
