package com.coresolution.consultation.exception;

/**
 * 일시적 서비스 불가(HTTP 503). 시크릿 미구성 등 fail-closed 경로에 사용한다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
public class ServiceUnavailableException extends RuntimeException {

    /**
     * @param message 클라이언트 안전 메시지(시크릿·내부 상세 금지)
     */
    public ServiceUnavailableException(String message) {
        super(message);
    }
}
