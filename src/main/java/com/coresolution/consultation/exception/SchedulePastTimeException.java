package com.coresolution.consultation.exception;

import com.coresolution.consultation.util.ScheduleSlotGuard;

/**
 * 일정 생성·이동이 현재 시각 이전 규칙에 걸렸을 때 발생한다.
 *
 * <p>{@link GlobalExceptionHandler} 가 HTTP 400 + 사유별 errorCode
 * ({@code SCHEDULE_MOVE_FROM_PAST}, {@code SCHEDULE_MOVE_TO_PAST}, {@code SCHEDULE_CREATE_IN_PAST}) 로 응답한다.
 * 판정은 {@link ScheduleSlotGuard} 만 사용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public class SchedulePastTimeException extends IllegalStateException {

    private static final long serialVersionUID = 1L;

    private final Long scheduleId;

    private final ScheduleSlotGuard.Denial denial;

    /**
     * @param scheduleId 대상 일정 ID (생성·상담 재예약 등 일정 ID 가 없으면 null)
     * @param denial     거부 사유
     */
    public SchedulePastTimeException(Long scheduleId, ScheduleSlotGuard.Denial denial) {
        super(denial.getMessage());
        this.scheduleId = scheduleId;
        this.denial = denial;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public ScheduleSlotGuard.Denial getDenial() {
        return denial;
    }

    public String getErrorCode() {
        return denial.getErrorCode();
    }
}
