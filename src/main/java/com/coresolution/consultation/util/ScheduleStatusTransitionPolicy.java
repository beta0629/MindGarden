package com.coresolution.consultation.util;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

import com.coresolution.consultation.constant.ScheduleStatus;

/**
 * 일정 상태 전이 허용 판정 SSOT.
 *
 * <p>관리자 확정({@code PUT /schedules/{id}/confirm})과 일정 수정의 점유 전환(예약·확정·진행 중으로 바꾸기)은
 * 이 판정만 사용한다. 결제·매핑 조건은 {@link MappingPaymentScheduleGate} 가 따로 본다(상태 판정과 독립).</p>
 *
 * <ul>
 *   <li>확정 가능: 예약됨({@link ScheduleStatus#BOOKED}), 사후 결제 가예약({@link ScheduleStatus#TENTATIVE_PENDING_PAYMENT})</li>
 *   <li>이미 확정({@link ScheduleStatus#CONFIRMED}): 재요청은 상태·회기·알림 변경 없이 그대로 돌려준다(중복 요청 1회 반영)</li>
 *   <li>그 밖(취소·휴가·완료·진행 중·예약 가능 슬롯): 확정 불가 → 409</li>
 *   <li>종료 상태(취소·완료)에서 점유 상태로 되돌리는 수정은 불가(재점유 시 회기 재차감 방지)</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public final class ScheduleStatusTransitionPolicy {

    /** 확정 불가 상태에서 확정을 요청했을 때의 오류 코드. */
    public static final String CONFIRM_NOT_ALLOWED_ERROR_CODE = "SCHEDULE_STATUS_NOT_CONFIRMABLE";

    /** 종료 상태 일정을 점유 상태로 되돌리려 할 때의 오류 코드. */
    public static final String REOCCUPY_NOT_ALLOWED_ERROR_CODE = "SCHEDULE_STATUS_TERMINAL";

    private static final Set<ScheduleStatus> CONFIRMABLE_FROM = Collections.unmodifiableSet(
            EnumSet.of(ScheduleStatus.BOOKED, ScheduleStatus.TENTATIVE_PENDING_PAYMENT));

    private static final Set<ScheduleStatus> TERMINAL = Collections.unmodifiableSet(
            EnumSet.of(ScheduleStatus.CANCELLED, ScheduleStatus.COMPLETED));

    private static final Set<ScheduleStatus> OCCUPYING_TARGETS = Collections.unmodifiableSet(
            EnumSet.of(ScheduleStatus.BOOKED, ScheduleStatus.CONFIRMED, ScheduleStatus.IN_PROGRESS));

    private ScheduleStatusTransitionPolicy() {
    }

    /**
     * 관리자 확정으로 {@link ScheduleStatus#CONFIRMED} 전이가 가능한 현재 상태인지.
     *
     * @param current 현재 상태 (null 이면 false)
     * @return 확정 전이를 허용하면 true
     */
    public static boolean allowsConfirm(ScheduleStatus current) {
        return current != null && CONFIRMABLE_FROM.contains(current);
    }

    /**
     * 이미 확정된 일정인지. 확정 재요청은 변경 없이 성공으로 돌려준다.
     *
     * @param current 현재 상태
     * @return {@link ScheduleStatus#CONFIRMED} 이면 true
     */
    public static boolean isAlreadyConfirmed(ScheduleStatus current) {
        return current == ScheduleStatus.CONFIRMED;
    }

    /**
     * 종료 상태(취소·완료)인지.
     *
     * @param status 상태
     * @return 취소·완료이면 true
     */
    public static boolean isTerminal(ScheduleStatus status) {
        return status != null && TERMINAL.contains(status);
    }

    /**
     * 일정 수정으로 {@code previous → intended} 점유 전환을 허용하는지.
     *
     * <p>종료 상태에서 예약·확정·진행 중으로 되돌리는 전환만 거절한다. 상태가 그대로이거나
     * 점유 상태가 아닌 곳(취소·휴가 등)으로 가는 전환은 이 판정의 대상이 아니다.</p>
     *
     * @param previous 변경 전 상태
     * @param intended 요청 상태
     * @return 허용하면 true
     */
    public static boolean allowsReoccupy(ScheduleStatus previous, ScheduleStatus intended) {
        if (intended == null || previous == intended || !OCCUPYING_TARGETS.contains(intended)) {
            return true;
        }
        return !isTerminal(previous);
    }
}
