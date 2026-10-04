package com.coresolution.consultation.util;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

import org.springframework.util.StringUtils;

import com.coresolution.consultation.entity.Schedule;

/**
 * 일정 시작 시각 이전 완료 처리(회기 차감·급여 반영·COMPLETED 전이) 차단 판정 SSOT.
 *
 * <p>모든 완료 경로(상담사·관리자 일지 저장, Expo 저장, 세션 완료 API, 타기관 일지 완료 승격,
 * 자동완료 배치)는 {@code ScheduleService#isBeforeSessionStart} 를 거쳐 이 판정만 사용한다.
 * 시작 시각은 {@code date + startTime}(startTime 없으면 그날 00:00), 기준 시계는
 * {@code mindgarden.scheduler.schedule-auto-complete.zone} 설정 시간대(미설정 시
 * {@link ReservationSmsBusinessHours#ZONE_SEOUL}).</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
public final class ScheduleSessionStartGate {

    private ScheduleSessionStartGate() {
    }

    /**
     * 일정이 아직 시작 전인지 판정한다.
     *
     * @param schedule 링크 일정 (null·날짜 없음이면 판정 불가 → false)
     * @param now      설정 시간대 기준 현재 시각
     * @return 시작 시각 이전이면 true
     */
    public static boolean isBeforeStart(Schedule schedule, LocalDateTime now) {
        if (schedule == null || schedule.getDate() == null || now == null) {
            return false;
        }
        LocalTime startTime = schedule.getStartTime() != null ? schedule.getStartTime() : LocalTime.MIDNIGHT;
        return now.isBefore(schedule.getDate().atTime(startTime));
    }

    /**
     * 설정 시간대 기준 현재 시각.
     *
     * @param clock  테스트용 시계 (null 이면 시스템 시계)
     * @param zoneId 설정 시간대 ID (공백이면 기본 시간대)
     * @return 현재 시각
     */
    public static LocalDateTime now(Clock clock, String zoneId) {
        if (clock != null) {
            return LocalDateTime.now(clock);
        }
        return LocalDateTime.now(resolveZone(zoneId));
    }

    /**
     * 설정 시간대 해석.
     *
     * @param zoneId 설정 시간대 ID
     * @return 시간대
     */
    public static ZoneId resolveZone(String zoneId) {
        return StringUtils.hasText(zoneId) ? ZoneId.of(zoneId.trim()) : ReservationSmsBusinessHours.ZONE_SEOUL;
    }
}
