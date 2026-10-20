package com.coresolution.consultation.exception;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.util.ScheduleStatusTransitionPolicy;

/**
 * 현재 일정 상태에서 허용되지 않는 전이(확정·재점유)를 요청했을 때 발생한다.
 *
 * <p>{@link GlobalExceptionHandler} 가 HTTP 409 + {@link #getErrorCode()} 로 응답한다.
 * 판정은 {@link ScheduleStatusTransitionPolicy} 만 사용한다. 상태·회기는 바뀌지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public class ScheduleStatusTransitionException extends IllegalStateException {

    private static final long serialVersionUID = 1L;

    private final Long scheduleId;
    private final ScheduleStatus currentStatus;
    private final String errorCode;

    /**
     * @param scheduleId    대상 일정 ID
     * @param currentStatus 현재 상태
     * @param errorCode     {@link ScheduleStatusTransitionPolicy} 오류 코드
     * @param message       사용자 문구
     */
    public ScheduleStatusTransitionException(Long scheduleId, ScheduleStatus currentStatus, String errorCode,
            String message) {
        super(message);
        this.scheduleId = scheduleId;
        this.currentStatus = currentStatus;
        this.errorCode = errorCode;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public ScheduleStatus getCurrentStatus() {
        return currentStatus;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
