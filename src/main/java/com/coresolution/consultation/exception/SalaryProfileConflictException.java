package com.coresolution.consultation.exception;

/**
 * 동일 테넌트·상담사에 활성 급여 프로필이 이미 있을 때 발생한다.
 *
 * <p>{@link GlobalExceptionHandler} 가 HTTP 409 와 사용자 사유 문구로 응답한다.
 * 시스템 오류가 아니므로 500 으로 올리지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-02
 */
public class SalaryProfileConflictException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /** 응답 {@code errorCode}. 화면은 {@code message} 를 사유로 쓴다. */
    public static final String ERROR_CODE = "SALARY_PROFILE_CONFLICT";

    /**
     * @param message 사용자에게 보여줄 충돌 사유
     */
    public SalaryProfileConflictException(String message) {
        super(message);
    }
}
