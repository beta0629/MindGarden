package com.coresolution.consultation.sct.exception;

/**
 * SCT 기능 플래그 OFF — HTTP 404 fail-closed.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public class SctFeatureDisabledException extends RuntimeException {

    /**
     * @param message 메시지
     */
    public SctFeatureDisabledException(String message) {
        super(message);
    }
}
