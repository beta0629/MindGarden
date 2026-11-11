package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.ImmediateReservationSmsDeferralService;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.core.context.TenantContextHolder;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ReservationReminderRescheduleServiceImpl} — 날짜 변경 후 새 슬롯 D-1 리마인드 대상 판정.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("새 슬롯 D-1 리마인드 공통 모듈 — 대상 판정·지연·테넌트")
class ReservationReminderRescheduleServiceImplTest {

    private static final String TENANT_ID = "tenant-reschedule-unit";
    private static final Long SCHEDULE_ID = 627L;
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 11);
    private static final LocalDateTime NOW = TODAY.atTime(15, 12);

    @Mock
    private BatchNotificationDispatchService dispatchService;
    @Mock
    private ImmediateReservationSmsDeferralService deferralService;

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("내일로 이동(업무시간) → LATE 즉시 디스패치 1회, 디스패치 중 테넌트 고정")
    void movedToTomorrow_dispatchesLate() {
        when(deferralService.resolveDeferredFireAt()).thenReturn(Optional.empty());
        when(dispatchService.dispatchReservationImmediateLate(SCHEDULE_ID)).thenAnswer(inv -> {
            Assertions.assertThat(TenantContextHolder.getTenantId()).isEqualTo(TENANT_ID);
            return null;
        });

        service().onSlotChanged(TENANT_ID, schedule(TODAY.plusDays(1), LocalTime.of(10, 0)));

        verify(dispatchService).dispatchReservationImmediateLate(SCHEDULE_ID);
        Assertions.assertThat(TenantContextHolder.getTenantId()).isNull();
    }

    @Test
    @DisplayName("오늘 늦은 시각으로 이동 → LATE 디스패치")
    void movedToLaterToday_dispatchesLate() {
        when(deferralService.resolveDeferredFireAt()).thenReturn(Optional.empty());

        service().onSlotChanged(TENANT_ID, schedule(TODAY, LocalTime.of(18, 0)));

        verify(dispatchService).dispatchReservationImmediateLate(SCHEDULE_ID);
    }

    @Test
    @DisplayName("업무시간 외 → 즉시 발송 없이 LATE 지연 PENDING 등록")
    void outsideBusinessHours_enqueuesDeferredLate() {
        LocalDateTime fireAt = TODAY.plusDays(1).atTime(9, 0);
        when(deferralService.resolveDeferredFireAt()).thenReturn(Optional.of(fireAt));

        service().onSlotChanged(TENANT_ID, schedule(TODAY.plusDays(1), LocalTime.of(14, 0)));

        verify(deferralService).enqueue(TENANT_ID, SCHEDULE_ID,
            BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE, fireAt);
        verify(dispatchService, never()).dispatchReservationImmediateLate(anyLong());
    }

    @Test
    @DisplayName("D+2 이상 → 아무것도 하지 않음(다음 09:00 배치가 새 슬롯 담당)")
    void movedTwoDaysAhead_noop() {
        service().onSlotChanged(TENANT_ID, schedule(TODAY.plusDays(2), LocalTime.of(10, 0)));

        verifyNoInteractions(dispatchService, deferralService);
    }

    @Test
    @DisplayName("이미 시작한 시각·취소 상태·테넌트 없음 → 대상 아님")
    void notEligible_noop() {
        Schedule started = schedule(TODAY, LocalTime.of(15, 0));
        Schedule cancelled = schedule(TODAY.plusDays(1), LocalTime.of(10, 0));
        cancelled.setStatus(ScheduleStatus.CANCELLED);
        Schedule personal = schedule(TODAY.plusDays(1), LocalTime.of(10, 0));
        personal.setClientId(null);

        ReservationReminderRescheduleServiceImpl service = service();
        service.onSlotChanged(TENANT_ID, started);
        service.onSlotChanged(TENANT_ID, cancelled);
        service.onSlotChanged(TENANT_ID, personal);
        service.onSlotChanged(" ", schedule(TODAY.plusDays(1), LocalTime.of(10, 0)));

        verifyNoInteractions(dispatchService, deferralService);
    }

    @Test
    @DisplayName("디스패치 예외 → 삼킴(일정 저장 흐름 비차단)")
    void dispatchFailure_isNonBlocking() {
        when(deferralService.resolveDeferredFireAt()).thenReturn(Optional.empty());
        when(dispatchService.dispatchReservationImmediateLate(any())).thenThrow(new IllegalStateException("boom"));

        service().onSlotChanged(TENANT_ID, schedule(TODAY.plusDays(1), LocalTime.of(10, 0)));

        verify(dispatchService).dispatchReservationImmediateLate(SCHEDULE_ID);
    }

    private ReservationReminderRescheduleServiceImpl service() {
        Clock clock = Clock.fixed(NOW.atZone(ReservationSmsBusinessHours.ZONE_SEOUL).toInstant(),
            ReservationSmsBusinessHours.ZONE_SEOUL);
        return new ReservationReminderRescheduleServiceImpl(dispatchService, deferralService, null, clock);
    }

    private Schedule schedule(LocalDate date, LocalTime start) {
        Schedule s = new Schedule();
        s.setId(SCHEDULE_ID);
        s.setTenantId(TENANT_ID);
        s.setClientId(108L);
        s.setConsultantId(3L);
        s.setDate(date);
        s.setStartTime(start);
        s.setEndTime(start.plusMinutes(50));
        s.setStatus(ScheduleStatus.BOOKED);
        s.setIsDeleted(false);
        return s;
    }
}
