package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link SchedulePastTimeGate} — 이동·생성 공통 과거 판정.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("SchedulePastTimeGate 이동·생성 과거 판정")
class SchedulePastTimeGateTest {

    private static final LocalDate DAY = LocalDate.of(2026, 10, 6);
    private static final LocalTime START = LocalTime.of(11, 0);
    private static final LocalTime END = LocalTime.of(11, 50);

    @Test
    @DisplayName("날짜·시작 변경 → 새 시작 시각으로 판정")
    void resolve_startMoved_usesNewStart() {
        LocalDateTime target = SchedulePastTimeGate.resolveMoveTarget(
                DAY.plusDays(1), START, DAY, START, END);
        assertThat(target).isEqualTo(DAY.atTime(START));
    }

    @Test
    @DisplayName("시작 그대로·종료만 변경(리사이즈) → 새 종료 시각으로 판정")
    void resolve_endOnly_usesNewEnd() {
        LocalDateTime target = SchedulePastTimeGate.resolveMoveTarget(
                DAY, START, DAY, START, LocalTime.of(12, 30));
        assertThat(target).isEqualTo(DAY.atTime(12, 30));
    }

    @Test
    @DisplayName("요청에 날짜·시작이 없으면 이전 값 사용, 시작 시각 없으면 00:00")
    void resolve_fallbacks() {
        assertThat(SchedulePastTimeGate.resolveMoveTarget(DAY, START, null, LocalTime.of(9, 0), null))
                .isEqualTo(DAY.atTime(9, 0));
        assertThat(SchedulePastTimeGate.resolveMoveTarget(DAY, null, DAY.plusDays(1), null, null))
                .isEqualTo(DAY.plusDays(1).atStartOfDay());
        assertThat(SchedulePastTimeGate.resolveMoveTarget(null, null, null, START, END)).isNull();
    }

    @Test
    @DisplayName("현재 직전은 과거, 현재와 같거나 이후는 허용")
    void isInPast_boundary() {
        LocalDateTime now = DAY.atTime(14, 0);
        assertThat(SchedulePastTimeGate.isInPast(now.minusMinutes(1), now)).isTrue();
        assertThat(SchedulePastTimeGate.isInPast(now, now)).isFalse();
        assertThat(SchedulePastTimeGate.isInPast(now.plusMinutes(1), now)).isFalse();
    }

    @Test
    @DisplayName("자정 경계 — 23:59 는 과거, 다음날 00:00 은 허용")
    void isInPast_midnight() {
        LocalDateTime now = DAY.atTime(23, 59, 30);
        assertThat(SchedulePastTimeGate.isInPast(DAY.atTime(23, 59), now)).isTrue();
        assertThat(SchedulePastTimeGate.isInPast(DAY.plusDays(1).atStartOfDay(), now)).isFalse();
    }

    @Test
    @DisplayName("판정 불가(null) → false")
    void isInPast_null() {
        assertThat(SchedulePastTimeGate.isInPast(null, DAY.atStartOfDay())).isFalse();
        assertThat(SchedulePastTimeGate.isInPast(DAY.atStartOfDay(), null)).isFalse();
    }

    @Test
    @DisplayName("이동 — 원래 시작이 지났으면 MOVE_FROM_PAST 가 목적지보다 우선")
    void resolveMoveDenial_originPastWins() {
        LocalDateTime now = DAY.atTime(14, 0);
        assertThat(SchedulePastTimeGate.resolveMoveDenial(
                DAY.atTime(11, 0), DAY.plusDays(1).atTime(11, 0), now))
                .isEqualTo(SchedulePastTimeGate.Denial.MOVE_FROM_PAST);
        assertThat(SchedulePastTimeGate.resolveMoveDenial(
                DAY.plusDays(1).atTime(11, 0), DAY.atTime(11, 0), now))
                .isEqualTo(SchedulePastTimeGate.Denial.MOVE_TO_PAST);
        assertThat(SchedulePastTimeGate.resolveMoveDenial(
                DAY.plusDays(1).atTime(11, 0), DAY.plusDays(2).atTime(11, 0), now))
                .isNull();
    }

    @Test
    @DisplayName("생성 — 과거 시작 CREATE_IN_PAST, 현재·이후는 허용")
    void resolveCreateDenial() {
        LocalDateTime now = DAY.atTime(14, 0);
        assertThat(SchedulePastTimeGate.resolveCreateDenial(DAY.atTime(13, 59), now))
                .isEqualTo(SchedulePastTimeGate.Denial.CREATE_IN_PAST);
        assertThat(SchedulePastTimeGate.resolveCreateDenial(DAY.atTime(14, 0), now)).isNull();
        assertThat(SchedulePastTimeGate.resolveCreateDenial(null, now)).isNull();
    }
}
