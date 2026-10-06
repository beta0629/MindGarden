package com.coresolution.consultation.service.impl;

import java.time.Clock;
import java.time.LocalDateTime;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;

/**
 * 생성 경로 단위 테스트용 일정 시계 고정.
 *
 * <p>{@link ScheduleServiceImpl#requireCreateStartNotInPast} 는 과거 시작 생성을 거부한다.
 * 고정 날짜 픽스처를 쓰는 생성 테스트가 실행 시점에 따라 과거가 되지 않도록,
 * 시계를 모든 픽스처보다 이전(KST)으로 고정한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
final class ScheduleSessionClockFixtures {

    /** 생성 테스트 픽스처(2026-05 이후, 실행일 기준 now+N) 보다 이전 시각. */
    static final LocalDateTime BEFORE_FIXTURES_KST = LocalDateTime.of(2026, 1, 1, 0, 0);

    private ScheduleSessionClockFixtures() {
    }

    static void pinBeforeFixtures(ScheduleServiceImpl service) {
        service.useSessionStartClock(Clock.fixed(
                BEFORE_FIXTURES_KST.atZone(ReservationSmsBusinessHours.ZONE_SEOUL).toInstant(),
                ReservationSmsBusinessHours.ZONE_SEOUL));
    }
}
