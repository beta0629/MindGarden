package com.coresolution.consultation.sct.exception;

/**
 * SCT 만료·취소 — HTTP 410 Gone.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public class SctGoneException extends RuntimeException {

    /**
     * @param message 메시지
     */
    public SctGoneException(String message) {
        super(message);
    }
}
