package com.coresolution.consultation.exception;

/**
 * 이력이 있어 삭제할 수 없는 공통코드 (HTTP 409).
 *
 * @author CoreSolution
 * @since 2026-10-12
 */
public class CommonCodeInUseException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /** 오류 응답 코드 */
    public static final String ERROR_CODE = "COMMON_CODE_IN_USE";

    /**
     * @param message 사용자 안내 문구 (상수)
     */
    public CommonCodeInUseException(String message) {
        super(message);
    }
}
