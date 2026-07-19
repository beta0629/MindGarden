package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
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

/**
 * {@link ScheduleServiceImpl#updateSchedule} 일정 변경 시 SCHEDULE_CHANGED
 * 외부 채널은 즉시 발송하지 않고 디바운스 pending 등록만 한다.
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
    }
}
