package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;

/**
 * 상담일지 세션 완료 시 링크 {@link Schedule} COMPLETED 전이·회기 차감 판정.
 *
 * <p>사용자 플로우(가예약→스케줄→입금확인→일지완료)에서 일지만 완료되고
 * Schedule 이 BOOKED/CONFIRMED 로 남는 드리프트를 막는다.
 * 이미 COMPLETED 이면 deduct 멱등만, BOOKED/CONFIRMED/IN_PROGRESS 이면
 * deduct → COMPLETED 저장 (updateSchedule/completeSchedule 게이트와 동일 취지).</p>
 *
 * @author CoreSolution
 * @since 2026-09-23
 */
public final class ConsultationRecordLinkedScheduleCompletion {

    /**
     * 링크 스케줄에 적용할 동작.
     */
    public enum Action {
        /** 이미 COMPLETED — {@code deductSessionAtCompletionIfNeeded} 멱등만 */
        DEDUCT_ONLY,
        /** BOOKED/CONFIRMED/IN_PROGRESS — deduct 후 COMPLETED */
        DEDUCT_AND_MARK_COMPLETED,
        /** CANCELLED 등 — 전이 없음 */
        SKIP
    }

    private ConsultationRecordLinkedScheduleCompletion() {
    }

    /**
     * 스케줄 상태에 따른 완료 훅 동작을 결정한다.
     *
     * @param schedule 링크 일정 (null 이면 SKIP)
     * @return 적용할 {@link Action}
     */
    public static Action resolveAction(Schedule schedule) {
        if (schedule == null || schedule.getId() == null) {
            return Action.SKIP;
        }
        ScheduleStatus status = schedule.getStatus();
        if (status == null) {
            return Action.SKIP;
        }
        if (ScheduleStatus.COMPLETED.equals(status)) {
            return Action.DEDUCT_ONLY;
        }
        if (ScheduleStatus.BOOKED.equals(status)
                || ScheduleStatus.CONFIRMED.equals(status)
                || ScheduleStatus.IN_PROGRESS.equals(status)) {
            return Action.DEDUCT_AND_MARK_COMPLETED;
        }
        return Action.SKIP;
    }
}
