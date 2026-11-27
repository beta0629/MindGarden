package com.coresolution.consultation.sct.exception;

/**
 * SCT 공개 본인확인 세션 필요 — HTTP 401 Unauthorized.
 *
 * @author MindGarden
 * @since 2026-03-27
 */
public class SctVerifyRequiredException extends RuntimeException {

    /**
     * @param message 메시지
     */
    public SctVerifyRequiredException(String message) {
        super(message);
    }
}
