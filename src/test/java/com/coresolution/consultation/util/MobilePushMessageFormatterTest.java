package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.entity.Schedule;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link MobilePushMessageFormatter} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@DisplayName("MobilePushMessageFormatter")
class MobilePushMessageFormatterTest {

    @Test
    @DisplayName("formatScheduleSlot — 한국어 요일·HH:mm–HH:mm")
    void formatScheduleSlot_koreanWeekdayAndTimeRange() {
        LocalDate date = LocalDate.of(2026, 5, 20);
        String slot = MobilePushMessageFormatter.formatScheduleSlot(
                date, LocalTime.of(14, 0), LocalTime.of(15, 0));

        assertThat(slot).isEqualTo("2026-05-20 (수) 14:00–15:00");
    }

    @Test
    @DisplayName("buildBookingConfirmedBody — 일시·상담사 포함")
    void buildBookingConfirmedBody_includesSlotAndConsultant() {
        Schedule schedule = sampleSchedule();
        String body = MobilePushMessageFormatter.buildBookingConfirmedBody(schedule, "김상담");

        assertThat(body).contains("예약이 확정되었습니다.");
        assertThat(body).contains("2026-05-20 (수) 14:00–15:00");
        assertThat(body).contains("김상담");
    }

    @Test
    @DisplayName("buildBookingRescheduledBody — 역할별 문구")
    void buildBookingRescheduledBody_roleSpecificCopy() {
        String oldSlot = "2026-05-19 (화) 10:00–11:00";
        String newSlot = "2026-05-20 (수) 14:00–15:00";

        String clientBody = MobilePushMessageFormatter.buildBookingRescheduledBody(
                oldSlot, newSlot, "김상담", "이내담", false);
        String consultantBody = MobilePushMessageFormatter.buildBookingRescheduledBody(
                oldSlot, newSlot, "김상담", "이내담", true);

        assertThat(clientBody).contains("상담사: 김상담").contains("이전:").contains("변경:");
        assertThat(consultantBody).contains("내담자: 이내담");
    }

    @Test
    @DisplayName("buildPaymentCompletedBody — 천단위 콤마·설명")
    void buildPaymentCompletedBody_amountWithComma() {
        String body = MobilePushMessageFormatter.buildPaymentCompletedBody(
                new BigDecimal("150000"), "10회기 패키지");

        assertThat(body).isEqualTo("10회기 패키지 150,000원 결제가 완료되었습니다.");
    }

    @Test
    @DisplayName("buildBookingReminderLead — 선행 문구 + 일시")
    void buildBookingReminderLead_appendsSlot() {
        Schedule schedule = sampleSchedule();
        String body = MobilePushMessageFormatter.buildBookingReminderLead(
                "상담이 30분 후에 시작됩니다.", schedule);

        assertThat(body).startsWith("상담이 30분 후에 시작됩니다.");
        assertThat(body).contains("일시: 2026-05-20 (수) 14:00–15:00");
    }

    private static Schedule sampleSchedule() {
        Schedule schedule = new Schedule();
        schedule.setDate(LocalDate.of(2026, 5, 20));
        schedule.setStartTime(LocalTime.of(14, 0));
        schedule.setEndTime(LocalTime.of(15, 0));
        return schedule;
    }
}
