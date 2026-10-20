package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ScheduleSlotGuard} — 이동·생성 공통 과거 판정(원래 시작 또는 목적지).
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("ScheduleSlotGuard 이동·생성 과거 판정")
class SchedulePastTimeGateTest {

    private static final LocalDate DAY = LocalDate.of(2026, 10, 6);
    private static final LocalTime START = LocalTime.of(11, 0);
    private static final LocalTime END = LocalTime.of(11, 50);
    private static final LocalDateTime NOW = DAY.atTime(14, 0);

    @Test
    @DisplayName("날짜·시작 변경 → 새 시작 시각으로 판정")
    void resolve_startMoved_usesNewStart() {
        LocalDateTime target = ScheduleSlotGuard.resolveMoveTarget(
                DAY.plusDays(1), START, DAY, START, END);
        assertThat(target).isEqualTo(DAY.atTime(START));
    }

    @Test
    @DisplayName("시작 그대로·종료만 변경(리사이즈) → 새 종료 시각으로 판정")
    void resolve_endOnly_usesNewEnd() {
        LocalDateTime target = ScheduleSlotGuard.resolveMoveTarget(
                DAY, START, DAY, START, LocalTime.of(12, 30));
        assertThat(target).isEqualTo(DAY.atTime(12, 30));
    }

    @Test
    @DisplayName("요청에 날짜·시작이 없으면 이전 값 사용, 시작 시각 없으면 00:00")
    void resolve_fallbacks() {
        assertThat(ScheduleSlotGuard.resolveMoveTarget(DAY, START, null, LocalTime.of(9, 0), null))
                .isEqualTo(DAY.atTime(9, 0));
        assertThat(ScheduleSlotGuard.resolveMoveTarget(DAY, null, DAY.plusDays(1), null, null))
                .isEqualTo(DAY.plusDays(1).atStartOfDay());
        assertThat(ScheduleSlotGuard.resolveMoveTarget(null, null, null, START, END)).isNull();
    }

    @Test
    @DisplayName("현재 직전은 과거, 현재와 같거나 이후는 허용")
    void isInPast_boundary() {
        assertThat(ScheduleSlotGuard.isInPast(NOW.minusMinutes(1), NOW)).isTrue();
        assertThat(ScheduleSlotGuard.isInPast(NOW, NOW)).isFalse();
        assertThat(ScheduleSlotGuard.isInPast(NOW.plusMinutes(1), NOW)).isFalse();
    }

    @Test
    @DisplayName("자정 경계 — 23:59 는 과거, 다음날 00:00 은 허용")
    void isInPast_midnight() {
        LocalDateTime now = DAY.atTime(23, 59, 30);
        assertThat(ScheduleSlotGuard.isInPast(DAY.atTime(23, 59), now)).isTrue();
        assertThat(ScheduleSlotGuard.isInPast(DAY.plusDays(1).atStartOfDay(), now)).isFalse();
    }

    @Test
    @DisplayName("판정 불가(null) → false")
    void isInPast_null() {
        assertThat(ScheduleSlotGuard.isInPast(null, DAY.atStartOfDay())).isFalse();
        assertThat(ScheduleSlotGuard.isInPast(DAY.atStartOfDay(), null)).isFalse();
    }

    @Test
    @DisplayName("이동 — 원래 시작이 지났으면 MOVE_FROM_PAST 가 목적지보다 우선(과거→미래 포함)")
    void resolveMoveDenial_originPastWins() {
        assertThat(ScheduleSlotGuard.resolveMoveDenial(
                DAY.atTime(11, 0), DAY.plusDays(1).atTime(11, 0), NOW))
                .isEqualTo(ScheduleSlotGuard.Denial.MOVE_FROM_PAST);
        assertThat(ScheduleSlotGuard.resolveMoveDenial(
                DAY.plusDays(1).atTime(11, 0), DAY.atTime(11, 0), NOW))
                .isEqualTo(ScheduleSlotGuard.Denial.MOVE_TO_PAST);
        assertThat(ScheduleSlotGuard.resolveMoveDenial(
                DAY.plusDays(1).atTime(11, 0), DAY.plusDays(2).atTime(11, 0), NOW))
                .isNull();
    }

    @Test
    @DisplayName("생성 — 과거 시작 CREATE_IN_PAST, 현재·이후는 허용")
    void resolveCreateDenial() {
        assertThat(ScheduleSlotGuard.resolveCreateDenial(DAY.atTime(13, 59), NOW))
                .isEqualTo(ScheduleSlotGuard.Denial.CREATE_IN_PAST);
        assertThat(ScheduleSlotGuard.resolveCreateDenial(DAY.atTime(14, 0), NOW)).isNull();
        assertThat(ScheduleSlotGuard.resolveCreateDenial(null, NOW)).isNull();
    }

    @Test
    @DisplayName("상태 잠금 후 원래 시작이 과거라면 이동 거부 문구(원본 과거 검사 복원)")
    void resolveSlotChangeDenyMessage_originPast() {
        assertThat(ScheduleSlotGuard.resolveSlotChangeDenyMessage(
                ScheduleStatus.CONFIRMED, DAY, START, NOW))
                .isEqualTo(ScheduleSlotGuard.Denial.MOVE_FROM_PAST.getMessage());
        assertThat(ScheduleSlotGuard.resolveSlotChangeDenyMessage(
                ScheduleStatus.CONFIRMED, DAY.plusDays(1), START, NOW))
                .isNull();
        assertThat(ScheduleSlotGuard.resolveSlotChangeDenyMessage(
                ScheduleStatus.COMPLETED, DAY, START, NOW))
                .isEqualTo(ScheduleServiceUserFacingMessages.MSG_COMPLETED_SLOT_CHANGE_DENIED);
    }
}
