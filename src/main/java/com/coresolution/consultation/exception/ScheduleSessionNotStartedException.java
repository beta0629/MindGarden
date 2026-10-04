package com.coresolution.consultation.exception;

import com.coresolution.consultation.util.ScheduleSessionStartGate;

/**
 * 일정 시작 시각 이전에 완료(COMPLETED 전이·회기 차감·급여 반영)를 요청했을 때 발생한다.
 *
 * <p>{@link GlobalExceptionHandler} 가 HTTP 400 + {@code SCHEDULE_SESSION_NOT_STARTED} 로 응답한다.
 * 판정은 {@link ScheduleSessionStartGate} 만 사용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
public class ScheduleSessionNotStartedException extends IllegalStateException {

    private static final long serialVersionUID = 1L;

    private final Long scheduleId;

    /**
     * @param scheduleId 대상 일정 ID
     */
    public ScheduleSessionNotStartedException(Long scheduleId) {
        super(ScheduleSessionStartGate.COMPLETION_BEFORE_START_MESSAGE);
        this.scheduleId = scheduleId;
    }

    public Long getScheduleId() {
        return scheduleId;
    }
}
