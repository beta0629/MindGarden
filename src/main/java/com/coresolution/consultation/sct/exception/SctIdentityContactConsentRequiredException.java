package com.coresolution.consultation.sct.exception;

/**
 * SCT 본인확인용 개인정보 수집·이용 동의 필요 — HTTP 403.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public class SctIdentityContactConsentRequiredException extends RuntimeException {

    /**
     * @param message 메시지
     */
    public SctIdentityContactConsentRequiredException(String message) {
        super(message);
    }
}
