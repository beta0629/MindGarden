package com.coresolution.consultation.exception;

/**
 * 권한 없음 시 발생 (접근 거부)
 * HTTP 403 Forbidden
 *
 * @author MindGarden
 * @since 2026-03-16
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(message, cause);
    }
}
