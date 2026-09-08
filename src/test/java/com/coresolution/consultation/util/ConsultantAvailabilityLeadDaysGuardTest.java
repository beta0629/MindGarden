package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import com.coresolution.consultation.constant.ConsultantAvailabilityUserFacingMessages;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ConsultantAvailabilityLeadDaysGuard} D-2 fail-closed 단위 테스트.
 *
 * <p>기준일 고정: 2026-09-07(월) Asia/Seoul.
 * DayOfWeek: 오늘(월)=D-0 거부, 화=D-1 거부, 수=D-2 허용, 목=D-3 허용.
 * LocalDate(휴가): today=D-0 거부, +1=D-1 거부, +2=D-2 허용, +3=D-3 허용, null 거부.</p>
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@DisplayName("ConsultantAvailabilityLeadDaysGuard — D-2 fail-closed")
class ConsultantAvailabilityLeadDaysGuardTest {

    private static final ZoneId SEOUL = ReservationSmsBusinessHours.ZONE_SEOUL;
    /** 고정 today: 2026-09-07 월요일 */
    private static final LocalDate FIXED_TODAY = LocalDate.of(2026, 9, 7);
    private static final Clock FIXED_CLOCK = Clock.fixed(
            LocalDateTime.of(2026, 9, 7, 12, 0).atZone(SEOUL).toInstant(),
            SEOUL);

    @Test
    @DisplayName("Given 오늘 요일(월) When 검증 Then D-0 fail-closed 거부")
    void givenTodayWeekday_whenRequireMinLeadDays_thenReject() {
        // Given: today=월, dayOfWeek=월 → 다음 발생일=today (D-0)
        DayOfWeek todayWeekday = FIXED_TODAY.getDayOfWeek();

        // When / Then
        assertThatThrownBy(() -> ConsultantAvailabilityLeadDaysGuard.requireMinLeadDays(
                        todayWeekday, FIXED_CLOCK))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ConsultantAvailabilityUserFacingMessages.MSG_AVAILABILITY_LEAD_DAYS_DENIED);
    }

    @Test
    @DisplayName("Given 내일 요일(화) When 검증 Then D-1 fail-closed 거부")
    void givenTomorrowWeekday_whenRequireMinLeadDays_thenReject() {
        // Given: today=월, dayOfWeek=화 → 다음 발생일=today+1 (D-1)
        DayOfWeek tomorrow = FIXED_TODAY.plusDays(1).getDayOfWeek();

        // When / Then
        assertThatThrownBy(() -> ConsultantAvailabilityLeadDaysGuard.requireMinLeadDays(
                        tomorrow, FIXED_TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ConsultantAvailabilityUserFacingMessages.MSG_AVAILABILITY_LEAD_DAYS_DENIED);
    }

    @Test
    @DisplayName("Given today+2 요일(수) When 검증 Then 허용")
    void givenTodayPlusTwoWeekday_whenRequireMinLeadDays_thenAccept() {
        // Given: today=월, dayOfWeek=수 → 다음 발생일=today+2 (D-2)
        DayOfWeek todayPlusTwo = FIXED_TODAY.plusDays(2).getDayOfWeek();

        // When / Then
        assertThatCode(() -> ConsultantAvailabilityLeadDaysGuard.requireMinLeadDays(
                        todayPlusTwo, FIXED_CLOCK))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Given today+3 요일(목) When 검증 Then 허용")
    void givenTodayPlusThreeWeekday_whenRequireMinLeadDays_thenAccept() {
        // Given: today=월, dayOfWeek=목 → 다음 발생일=today+3 (D-3)
        DayOfWeek todayPlusThree = FIXED_TODAY.plusDays(3).getDayOfWeek();

        // When / Then
        assertThatCode(() -> ConsultantAvailabilityLeadDaysGuard.requireMinLeadDays(
                        todayPlusThree, FIXED_TODAY))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Given null dayOfWeek When 검증 Then fail-closed 거부")
    void givenNullDayOfWeek_whenRequireMinLeadDays_thenReject() {
        // Given / When / Then
        assertThatThrownBy(() -> ConsultantAvailabilityLeadDaysGuard.requireMinLeadDays(
                        (DayOfWeek) null, FIXED_CLOCK))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ConsultantAvailabilityUserFacingMessages.MSG_AVAILABILITY_LEAD_DAYS_DENIED);
    }

    @Test
    @DisplayName("Given 휴가일=오늘(D-0) When 검증 Then fail-closed 거부")
    void givenVacationDateToday_whenRequireMinLeadDays_thenReject() {
        assertThatThrownBy(() -> ConsultantAvailabilityLeadDaysGuard.requireMinLeadDays(
                        FIXED_TODAY, FIXED_CLOCK))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ConsultantAvailabilityUserFacingMessages.MSG_VACATION_LEAD_DAYS_DENIED);
    }

    @Test
    @DisplayName("Given 휴가일=오늘+1(D-1) When 검증 Then fail-closed 거부")
    void givenVacationDateTomorrow_whenRequireMinLeadDays_thenReject() {
        assertThatThrownBy(() -> ConsultantAvailabilityLeadDaysGuard.requireMinLeadDays(
                        FIXED_TODAY.plusDays(1), FIXED_TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ConsultantAvailabilityUserFacingMessages.MSG_VACATION_LEAD_DAYS_DENIED);
    }

    @Test
    @DisplayName("Given 휴가일=오늘+2(D-2) When 검증 Then 허용")
    void givenVacationDateTodayPlusTwo_whenRequireMinLeadDays_thenAccept() {
        assertThatCode(() -> ConsultantAvailabilityLeadDaysGuard.requireMinLeadDays(
                        FIXED_TODAY.plusDays(2), FIXED_CLOCK))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Given 휴가일=오늘+3(D-3) When 검증 Then 허용")
    void givenVacationDateTodayPlusThree_whenRequireMinLeadDays_thenAccept() {
        assertThatCode(() -> ConsultantAvailabilityLeadDaysGuard.requireMinLeadDays(
                        FIXED_TODAY.plusDays(3), FIXED_TODAY))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Given null 휴가일 When 검증 Then fail-closed 거부")
    void givenNullVacationDate_whenRequireMinLeadDays_thenReject() {
        assertThatThrownBy(() -> ConsultantAvailabilityLeadDaysGuard.requireMinLeadDays(
                        (LocalDate) null, FIXED_CLOCK))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ConsultantAvailabilityUserFacingMessages.MSG_VACATION_LEAD_DAYS_DENIED);
    }
}
