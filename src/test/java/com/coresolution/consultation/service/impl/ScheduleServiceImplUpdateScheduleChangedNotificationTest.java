package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.ImmediateReservationSmsDeferralService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ScheduleServiceImpl#updateSchedule} 일정 변경 시 SCHEDULE_CHANGED
 * 외부 채널은 즉시 발송하지 않고 디바운스 pending 등록만 한다.
 * 슬롯 변경 시 D-2/D-1 배치 멱등 로그만 물리 삭제하고 즉시 리마인드 dispatch 는 하지 않는다.
 *
 * @author MindGarden
 * @since 2026-06-02
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl updateSchedule SCHEDULE_CHANGED 디바운스 pending")
class ScheduleServiceImplUpdateScheduleChangedNotificationTest {

    private static final String TENANT_ID = "tenant-incheon-counseling-001";
    private static final Long SCHEDULE_ID = 999L;
    private static final Long CLIENT_ID = 11L;
    private static final Long CONSULTANT_ID = 22L;

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
    @Mock
    private BatchNotificationDispatchService batchNotificationDispatchService;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private Schedule existingConfirmed() {
        Schedule s = new Schedule();
        s.setId(SCHEDULE_ID);
        s.setTenantId(TENANT_ID);
        s.setClientId(CLIENT_ID);
        s.setConsultantId(CONSULTANT_ID);
        s.setStatus(ScheduleStatus.CONFIRMED);
        s.setDate(LocalDate.of(2026, 5, 20));
        s.setStartTime(LocalTime.of(10, 0));
        s.setEndTime(LocalTime.of(11, 0));
        return s;
    }

    @Test
    @DisplayName("date/time 변경 시 enqueueScheduleChanged 호출 — sendScheduleChanged 즉시 미호출")
    void slotChange_enqueuesDebounce_doesNotSendImmediately() {
        Schedule existing = existingConfirmed();
        Schedule patch = new Schedule();
        patch.setDate(LocalDate.of(2026, 5, 21));
        patch.setStartTime(LocalTime.of(14, 0));
        patch.setEndTime(LocalTime.of(15, 0));

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.updateSchedule(SCHEDULE_ID, patch);

        verify(scheduleChangeNotificationDebounceService).enqueueScheduleChanged(
                eq(TENANT_ID),
                any(Schedule.class),
                eq(LocalDate.of(2026, 5, 20)),
                eq(LocalTime.of(10, 0)));
        verify(notificationService, never())
                .sendScheduleChanged(any(), any(), any(), any());
        verify(notificationBatchSendLogRepository)
                .deleteByTenantIdAndTargetTypeAndTargetIdAndTemplateCodeIn(
                        eq(TENANT_ID),
                        eq(BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE),
                        eq(SCHEDULE_ID),
                        eq(BatchNotificationTemplateCodes.RESERVATION_REMINDER_DN_CODES));
        verify(immediateReservationSmsDeferralService)
                .cancelPendingReservationReminders(
                        eq(TENANT_ID),
                        eq(SCHEDULE_ID),
                        eq(BatchNotificationTemplateCodes.RESERVATION_REMINDER_DN_CODES));
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateLate(any());
    }

    @Test
    @DisplayName("CANCELLED 로 변경 시 enqueue 및 sendScheduleChanged 미호출")
    void cancellingNow_doesNotEnqueue() {
        Schedule existing = existingConfirmed();
        Schedule patch = new Schedule();
        patch.setDate(LocalDate.of(2026, 5, 21));
        patch.setStartTime(LocalTime.of(14, 0));
        patch.setEndTime(LocalTime.of(15, 0));
        patch.setStatus(ScheduleStatus.CANCELLED);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.updateSchedule(SCHEDULE_ID, patch);

        verify(scheduleChangeNotificationDebounceService, never())
                .enqueueScheduleChanged(any(), any(), any(), any());
        verify(notificationService, never())
                .sendScheduleChanged(any(), any(), any(), any());
        verify(notificationBatchSendLogRepository, never())
                .deleteByTenantIdAndTargetTypeAndTargetIdAndTemplateCodeIn(
                        any(), any(), any(), any());
        verify(immediateReservationSmsDeferralService, never())
                .cancelPendingReservationReminders(any(), any(), any());
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateLate(any());
    }

    @Test
    @DisplayName("clientId 가 null 인 개인 일정의 경우 enqueue 미호출")
    void personalSchedule_doesNotEnqueue() {
        Schedule existing = existingConfirmed();
        existing.setClientId(null);
        Schedule patch = new Schedule();
        patch.setDate(LocalDate.of(2026, 5, 21));
        patch.setStartTime(LocalTime.of(14, 0));
        patch.setEndTime(LocalTime.of(15, 0));

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.updateSchedule(SCHEDULE_ID, patch);

        verify(scheduleChangeNotificationDebounceService, never())
                .enqueueScheduleChanged(any(), any(), any(), any());
    }

    @Test
    @DisplayName("slot 변경 없음 (status 만 변경) — enqueue 미호출")
    void noSlotChange_doesNotEnqueue() {
        Schedule existing = existingConfirmed();
        Schedule patch = new Schedule();
        patch.setDate(existing.getDate());
        patch.setStartTime(existing.getStartTime());
        patch.setEndTime(existing.getEndTime());
        patch.setTitle("상태만 변경");

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.updateSchedule(SCHEDULE_ID, patch);

        verify(scheduleChangeNotificationDebounceService, never())
                .enqueueScheduleChanged(any(), any(), any(), any());
        verify(notificationBatchSendLogRepository, never())
                .deleteByTenantIdAndTargetTypeAndTargetIdAndTemplateCodeIn(
                        any(), any(), any(), any());
        verify(immediateReservationSmsDeferralService, never())
                .cancelPendingReservationReminders(any(), any(), any());
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateLate(any());
    }

    @Test
    @DisplayName("시간만 변경 — SCHEDULE_CHANGED enqueue, D2/LATE send_log 리셋, 즉시 dispatch 없음")
    void timeOnlyChange_enqueuesDebounce_resetsReminderMarks() {
        Schedule existing = existingConfirmed();
        Schedule patch = new Schedule();
        patch.setDate(existing.getDate());
        patch.setStartTime(LocalTime.of(14, 0));
        patch.setEndTime(LocalTime.of(15, 0));

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.updateSchedule(SCHEDULE_ID, patch);

        verify(scheduleChangeNotificationDebounceService).enqueueScheduleChanged(
                eq(TENANT_ID),
                any(Schedule.class),
                eq(LocalDate.of(2026, 5, 20)),
                eq(LocalTime.of(10, 0)));
        verify(notificationBatchSendLogRepository)
                .deleteByTenantIdAndTargetTypeAndTargetIdAndTemplateCodeIn(
                        eq(TENANT_ID),
                        eq(BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE),
                        eq(SCHEDULE_ID),
                        eq(BatchNotificationTemplateCodes.RESERVATION_REMINDER_DN_CODES));
        verify(immediateReservationSmsDeferralService)
                .cancelPendingReservationReminders(
                        eq(TENANT_ID),
                        eq(SCHEDULE_ID),
                        eq(BatchNotificationTemplateCodes.RESERVATION_REMINDER_DN_CODES));
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateLate(any());
    }

    @Test
    @DisplayName("날짜 변경 시 D2·LATE send_log 물리 삭제 — SINGLE 제외, 즉시 dispatch 없음")
    void slotChange_invalidatesD2AndLateLogs_notSingle_noImmediateDispatch() {
        Schedule existing = existingConfirmed();
        Schedule patch = new Schedule();
        patch.setDate(LocalDate.of(2026, 6, 1));
        patch.setStartTime(LocalTime.of(9, 0));
        patch.setEndTime(LocalTime.of(10, 0));

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.updateSchedule(SCHEDULE_ID, patch);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> codesCaptor = ArgumentCaptor.forClass(Collection.class);
        verify(notificationBatchSendLogRepository)
                .deleteByTenantIdAndTargetTypeAndTargetIdAndTemplateCodeIn(
                        eq(TENANT_ID),
                        eq(BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE),
                        eq(SCHEDULE_ID),
                        codesCaptor.capture());
        assertThat(codesCaptor.getValue())
                .containsExactlyInAnyOrder(
                        BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2,
                        BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
                .doesNotContain(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE);
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateLate(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateSingle(any());
        verify(notificationService, never())
                .sendScheduleChanged(any(), any(), any(), any());
        verify(immediateReservationSmsDeferralService)
                .cancelPendingReservationReminders(
                        eq(TENANT_ID),
                        eq(SCHEDULE_ID),
                        eq(BatchNotificationTemplateCodes.RESERVATION_REMINDER_DN_CODES));
    }

    @Test
    @DisplayName("슬롯 미변경 PUT — D2/LATE send_log 유지")
    void noSlotChange_doesNotInvalidateReminderLogs() {
        Schedule existing = existingConfirmed();
        Schedule patch = new Schedule();
        patch.setDate(existing.getDate());
        patch.setStartTime(existing.getStartTime());
        patch.setEndTime(existing.getEndTime());
        patch.setDescription("메모만 변경");

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.updateSchedule(SCHEDULE_ID, patch);

        verify(notificationBatchSendLogRepository, never())
                .deleteByTenantIdAndTargetTypeAndTargetIdAndTemplateCodeIn(
                        any(), any(), any(), any());
        verify(immediateReservationSmsDeferralService, never())
                .cancelPendingReservationReminders(any(), any(), any());
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateLate(any());
    }

    @Test
    @DisplayName("status 만 변경(슬롯 동일) — D2/LATE 로그 삭제·pending 취소 미호출")
    void statusOnlyChange_doesNotResetReminderMarks() {
        Schedule existing = existingConfirmed();
        Schedule patch = new Schedule();
        patch.setDate(existing.getDate());
        patch.setStartTime(existing.getStartTime());
        patch.setEndTime(existing.getEndTime());
        patch.setStatus(ScheduleStatus.IN_PROGRESS);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.updateSchedule(SCHEDULE_ID, patch);

        verify(scheduleChangeNotificationDebounceService, never())
                .enqueueScheduleChanged(any(), any(), any(), any());
        verify(notificationBatchSendLogRepository, never())
                .deleteByTenantIdAndTargetTypeAndTargetIdAndTemplateCodeIn(
                        any(), any(), any(), any());
        verify(immediateReservationSmsDeferralService, never())
                .cancelPendingReservationReminders(any(), any(), any());
        verify(notificationService, never())
                .sendScheduleChanged(any(), any(), any(), any());
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateLate(any());
    }

    @Test
    @DisplayName("취소만(슬롯 동일) — 리마인드 로그 무효화 분기 미진입")
    void cancellingWithoutSlotChange_doesNotResetReminderMarks() {
        Schedule existing = existingConfirmed();
        Schedule patch = new Schedule();
        patch.setDate(existing.getDate());
        patch.setStartTime(existing.getStartTime());
        patch.setEndTime(existing.getEndTime());
        patch.setStatus(ScheduleStatus.CANCELLED);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.updateSchedule(SCHEDULE_ID, patch);

        verify(scheduleChangeNotificationDebounceService, never())
                .enqueueScheduleChanged(any(), any(), any(), any());
        verify(notificationBatchSendLogRepository, never())
                .deleteByTenantIdAndTargetTypeAndTargetIdAndTemplateCodeIn(
                        any(), any(), any(), any());
        verify(immediateReservationSmsDeferralService, never())
                .cancelPendingReservationReminders(any(), any(), any());
        verify(notificationService, never())
                .sendScheduleChanged(any(), any(), any(), any());
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateLate(any());
    }
}
