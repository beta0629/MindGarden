package com.coresolution.consultation.sct.exception;

/**
 * SCT 본인확인 SMS OTP 만료. HTTP 400.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public class SctOtpExpiredException extends RuntimeException {

    /**
     * @param message 메시지(일치여부·실번호·코드 금지)
     */
    public SctOtpExpiredException(String message) {
        super(message);
    }
}
