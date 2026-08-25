package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ImmediateReservationSmsDeferralService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.consultation.util.ScheduleSlotGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@link ScheduleServiceImpl#updateSchedule} 완료·취소·과거 슬롯 변경 잠금 검증.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl updateSchedule 슬롯 잠금")
class ScheduleServiceImplUpdateScheduleSlotLockTest {

    private static final String TENANT_ID = "tenant-slot-lock";
    private static final Long SCHEDULE_ID = 77L;

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private TenantAccessControlService accessControlService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock
    private MobilePushDispatchService mobilePushDispatchService;
    @Mock
    private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock
    private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @Mock
    private NotificationBatchSendLogRepository notificationBatchSendLogRepository;
    @Mock
    private ImmediateReservationSmsDeferralService immediateReservationSmsDeferralService;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("COMPLETED + 슬롯 변경 → IllegalStateException")
    void updateSchedule_completedSlotChange_throws() {
        Schedule existing = baseSchedule(ScheduleStatus.COMPLETED, LocalDate.of(2026, 8, 20));
        Schedule patch = slotPatch(LocalDate.of(2026, 8, 21), LocalTime.of(14, 0), LocalTime.of(15, 0));
        stubFind(existing);

        assertThatThrownBy(() -> scheduleService.updateSchedule(SCHEDULE_ID, patch))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_COMPLETED_SLOT_CHANGE_DENIED);

        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("CANCELLED + 슬롯 변경 → IllegalStateException")
    void updateSchedule_cancelledSlotChange_throws() {
        Schedule existing = baseSchedule(ScheduleStatus.CANCELLED, LocalDate.of(2026, 8, 20));
        Schedule patch = slotPatch(LocalDate.of(2026, 8, 21), LocalTime.of(14, 0), LocalTime.of(15, 0));
        stubFind(existing);

        assertThatThrownBy(() -> scheduleService.updateSchedule(SCHEDULE_ID, patch))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_CANCELLED_SLOT_CHANGE_DENIED);

        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("과거 날짜 CONFIRMED + 슬롯 변경 → IllegalStateException")
    void updateSchedule_pastDateSlotChange_throws() {
        LocalDate yesterday = LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL).minusDays(1);
        Schedule existing = baseSchedule(ScheduleStatus.CONFIRMED, yesterday);
        Schedule patch = slotPatch(
                LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL).plusDays(1),
                LocalTime.of(14, 0),
                LocalTime.of(15, 0));
        stubFind(existing);

        assertThatThrownBy(() -> scheduleService.updateSchedule(SCHEDULE_ID, patch))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_PAST_SLOT_CHANGE_DENIED);

        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("COMPLETED + 동일 슬롯 재저장(상태만 등)은 허용 — 슬롯 미변경")
    void updateSchedule_completedSameSlot_allows() {
        LocalDate future = LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL).plusDays(3);
        Schedule existing = baseSchedule(ScheduleStatus.COMPLETED, future);
        existing.setTitle("old");
        Schedule patch = new Schedule();
        patch.setTitle("new-title");
        stubFind(existing);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        Schedule saved = scheduleService.updateSchedule(SCHEDULE_ID, patch);

        assertThat(saved.getTitle()).isEqualTo("new-title");
        verify(scheduleRepository).save(any(Schedule.class));
    }

    @Test
    @DisplayName("미래 CONFIRMED 슬롯 변경은 허용")
    void updateSchedule_futureConfirmedSlotChange_allows() {
        LocalDate future = LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL).plusDays(5);
        Schedule existing = baseSchedule(ScheduleStatus.CONFIRMED, future);
        Schedule patch = slotPatch(future.plusDays(1), LocalTime.of(14, 0), LocalTime.of(15, 0));
        stubFind(existing);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        Schedule saved = scheduleService.updateSchedule(SCHEDULE_ID, patch);

        assertThat(saved.getDate()).isEqualTo(future.plusDays(1));
        verify(scheduleRepository).save(any(Schedule.class));
    }

    @Test
    @DisplayName("ScheduleSlotGuard — 어제 날짜는 과거")
    void scheduleSlotGuard_yesterday_isPast() {
        LocalDate yesterday = LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL).minusDays(1);
        assertThat(ScheduleSlotGuard.isScheduleSlotInPast(yesterday, LocalTime.of(23, 59))).isTrue();
    }

    @Test
    @DisplayName("ScheduleSlotGuard — 내일 날짜는 과거 아님")
    void scheduleSlotGuard_tomorrow_notPast() {
        LocalDate tomorrow = LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL).plusDays(1);
        assertThat(ScheduleSlotGuard.isScheduleSlotInPast(tomorrow, LocalTime.of(0, 0))).isFalse();
    }

    private Schedule baseSchedule(ScheduleStatus status, LocalDate date) {
        Schedule existing = new Schedule();
        existing.setId(SCHEDULE_ID);
        existing.setTenantId(TENANT_ID);
        existing.setClientId(10L);
        existing.setConsultantId(20L);
        existing.setStatus(status);
        existing.setDate(date);
        existing.setStartTime(LocalTime.of(10, 0));
        existing.setEndTime(LocalTime.of(11, 0));
        return existing;
    }

    private Schedule slotPatch(LocalDate date, LocalTime start, LocalTime end) {
        Schedule patch = new Schedule();
        patch.setDate(date);
        patch.setStartTime(start);
        patch.setEndTime(end);
        return patch;
    }

    private void stubFind(Schedule existing) {
        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
    }
}
