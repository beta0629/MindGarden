package com.coresolution.consultation.sct.exception;

/**
 * SCT 연락처 검증 잠금 — HTTP 429/403.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public class SctVerifyLockedException extends RuntimeException {

    /**
     * @param message 메시지
     */
    public SctVerifyLockedException(String message) {
        super(message);
    }
}
