package com.coresolution.consultation.sct.exception;

/**
 * SCT 본인확인 SMS OTP 오답·형식 오류. HTTP 400.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public class SctOtpInvalidException extends RuntimeException {

    /**
     * @param message 메시지(일치여부·실번호·코드 금지)
     */
    public SctOtpInvalidException(String message) {
        super(message);
    }
}
