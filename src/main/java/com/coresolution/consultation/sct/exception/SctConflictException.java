package com.coresolution.consultation.sct.exception;

/**
 * SCT 상태 충돌(제출 후 쓰기 등) — HTTP 409.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public class SctConflictException extends RuntimeException {

    /**
     * @param message 메시지
     */
    public SctConflictException(String message) {
        super(message);
    }
}
