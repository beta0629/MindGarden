package com.coresolution.consultation.exception;

/**
 * 인증 실패 시 발생 (로그인 필요 등)
 * HTTP 401 Unauthorized
 *
 * @author MindGarden
 * @since 2026-03-16
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
