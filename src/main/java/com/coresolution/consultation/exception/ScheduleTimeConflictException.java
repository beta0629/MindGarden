package com.coresolution.consultation.exception;

/**
 * 상담 일정 생성 시 같은 상담사·날짜의 점유 시간과 겹칠 때 발생한다.
 *
 * <p>{@link GlobalExceptionHandler} 가 HTTP 409 와 사용자 사유 문구로 응답한다.
 * 시스템 오류가 아니므로 500 으로 올리지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public class ScheduleTimeConflictException extends IllegalStateException {

    private static final long serialVersionUID = 1L;

    /** 응답 {@code errorCode}. 화면은 {@code message} 를 사유로 쓴다. */
    public static final String ERROR_CODE = "SCHEDULE_TIME_CONFLICT";

    /**
     * @param message 사용자에게 보여줄 겹침 사유
     */
    public ScheduleTimeConflictException(String message) {
        super(message);
    }
}
