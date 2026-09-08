package com.coresolution.consultation.util;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Objects;
import com.coresolution.consultation.constant.ConsultantAvailabilityConstants;
import com.coresolution.consultation.constant.ConsultantAvailabilityUserFacingMessages;

/**
 * 상담사 가능 시간(availability)·휴가(vacation) D-2 fail-closed 선행일 검증.
 *
 * <p>Availability 엔티티는 concrete date 없이 {@link DayOfWeek} 주간 템플릿이므로,
 * Asia/Seoul today 기준 해당 요일의 <strong>다음 발생일</strong>(요일이 오늘이면 오늘)이
 * {@code today.plusDays(AVAILABILITY_MIN_LEAD_DAYS)} 미만이면 거부한다.</p>
 *
 * <p>Vacation은 concrete {@link LocalDate} 축으로 동일 선행일 상수를 재사용한다.
 * silent clamp 금지.</p>
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
public final class ConsultantAvailabilityLeadDaysGuard {

    private ConsultantAvailabilityLeadDaysGuard() {
    }

    /**
     * Asia/Seoul 현재일 기준으로 dayOfWeek 다음 발생일이 최소 선행일 미만이면 예외.
     *
     * @param dayOfWeek 설정 대상 요일 (null 불가)
     * @throws IllegalArgumentException null dayOfWeek 또는 D-0/D-1(선행일 미만)
     */
    public static void requireMinLeadDays(DayOfWeek dayOfWeek) {
        Clock clock = Clock.system(ReservationSmsBusinessHours.ZONE_SEOUL);
        requireMinLeadDays(dayOfWeek, clock);
    }

    /**
     * 고정 Clock으로 dayOfWeek 다음 발생일 선행일 검증 (테스트·재현용).
     *
     * @param dayOfWeek 설정 대상 요일 (null 불가)
     * @param clock     Asia/Seoul 등 zone이 반영된 시계
     * @throws IllegalArgumentException null dayOfWeek 또는 선행일 미만
     */
    public static void requireMinLeadDays(DayOfWeek dayOfWeek, Clock clock) {
        Objects.requireNonNull(clock, "clock");
        LocalDate today = LocalDate.now(clock);
        requireMinLeadDays(dayOfWeek, today);
    }

    /**
     * 주어진 today 기준으로 dayOfWeek 다음 발생일 선행일 검증.
     *
     * @param dayOfWeek 설정 대상 요일 (null 불가)
     * @param today     기준일 (보통 Asia/Seoul LocalDate.now)
     * @throws IllegalArgumentException null dayOfWeek 또는 선행일 미만
     */
    public static void requireMinLeadDays(DayOfWeek dayOfWeek, LocalDate today) {
        if (dayOfWeek == null) {
            throw new IllegalArgumentException(
                    ConsultantAvailabilityUserFacingMessages.MSG_AVAILABILITY_LEAD_DAYS_DENIED);
        }
        Objects.requireNonNull(today, "today");
        LocalDate nextOccurrence = resolveNextOccurrence(today, dayOfWeek);
        LocalDate minAllowed = today.plusDays(ConsultantAvailabilityConstants.AVAILABILITY_MIN_LEAD_DAYS);
        if (nextOccurrence.isBefore(minAllowed)) {
            throw new IllegalArgumentException(
                    ConsultantAvailabilityUserFacingMessages.MSG_AVAILABILITY_LEAD_DAYS_DENIED);
        }
    }

    /**
     * Asia/Seoul 현재일 기준 concrete 휴가일이 최소 선행일 미만이면 예외.
     *
     * @param targetDate 휴가 대상일 (null → fail-closed 거부)
     * @throws IllegalArgumentException null 또는 D-0/D-1(선행일 미만)
     */
    public static void requireMinLeadDays(LocalDate targetDate) {
        Clock clock = Clock.system(ReservationSmsBusinessHours.ZONE_SEOUL);
        requireMinLeadDays(targetDate, clock);
    }

    /**
     * 고정 Clock으로 concrete 휴가일 선행일 검증 (테스트·재현용).
     *
     * @param targetDate 휴가 대상일 (null → fail-closed 거부)
     * @param clock      Asia/Seoul 등 zone이 반영된 시계
     * @throws IllegalArgumentException null 또는 선행일 미만
     */
    public static void requireMinLeadDays(LocalDate targetDate, Clock clock) {
        Objects.requireNonNull(clock, "clock");
        LocalDate today = LocalDate.now(clock);
        requireMinLeadDays(targetDate, today);
    }

    /**
     * 주어진 today 기준 concrete 휴가일 선행일 검증.
     *
     * @param targetDate 휴가 대상일 (null → fail-closed 거부)
     * @param today      기준일 (보통 Asia/Seoul LocalDate.now)
     * @throws IllegalArgumentException null targetDate 또는 선행일 미만
     */
    public static void requireMinLeadDays(LocalDate targetDate, LocalDate today) {
        if (targetDate == null) {
            throw new IllegalArgumentException(
                    ConsultantAvailabilityUserFacingMessages.MSG_VACATION_LEAD_DAYS_DENIED);
        }
        Objects.requireNonNull(today, "today");
        LocalDate minAllowed = today.plusDays(ConsultantAvailabilityConstants.AVAILABILITY_MIN_LEAD_DAYS);
        if (targetDate.isBefore(minAllowed)) {
            throw new IllegalArgumentException(
                    ConsultantAvailabilityUserFacingMessages.MSG_VACATION_LEAD_DAYS_DENIED);
        }
    }

    /**
     * today 기준 dayOfWeek의 다음 발생일. 요일이 오늘이면 today(0일 후).
     *
     * @param today     기준일
     * @param dayOfWeek 대상 요일
     * @return 다음 발생일
     */
    public static LocalDate resolveNextOccurrence(LocalDate today, DayOfWeek dayOfWeek) {
        Objects.requireNonNull(today, "today");
        Objects.requireNonNull(dayOfWeek, "dayOfWeek");
        int daysUntil = (dayOfWeek.getValue() - today.getDayOfWeek().getValue() + 7) % 7;
        return today.plusDays(daysUntil);
    }
}
