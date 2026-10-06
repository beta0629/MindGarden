package com.coresolution.consultation.exception;

import com.coresolution.consultation.util.ScheduleMoveTargetGate;

/**
 * 일정을 현재 시각 이전으로 옮기려 할 때 발생한다.
 *
 * <p>{@link GlobalExceptionHandler} 가 HTTP 400 + {@code SCHEDULE_MOVE_TO_PAST} 로 응답한다.
 * 판정은 {@link ScheduleMoveTargetGate} 만 사용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public class ScheduleMoveToPastException extends IllegalStateException {

    private static final long serialVersionUID = 1L;

    private final Long scheduleId;

    /**
     * @param scheduleId 대상 일정 ID (상담 재예약 등 일정 ID 가 없으면 null)
     */
    public ScheduleMoveToPastException(Long scheduleId) {
        super(ScheduleMoveTargetGate.MOVE_TO_PAST_MESSAGE);
        this.scheduleId = scheduleId;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public String getErrorCode() {
        return ScheduleMoveTargetGate.MOVE_TO_PAST_ERROR_CODE;
    }
}
