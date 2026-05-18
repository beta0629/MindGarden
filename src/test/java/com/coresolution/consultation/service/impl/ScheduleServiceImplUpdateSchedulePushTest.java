package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
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
 * {@link ScheduleServiceImpl#updateSchedule} 일정 변경 시 모바일 푸시 연동 검증.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl updateSchedule 푸시")
class ScheduleServiceImplUpdateSchedulePushTest {

    private static final String TENANT_ID = "tenant-push";
    private static final Long SCHEDULE_ID = 42L;

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

    @Test
    @DisplayName("date/time 변경 시 dispatchBookingRescheduled 호출")
    void updateSchedule_slotChange_dispatchesRescheduledPush() {
        Schedule existing = new Schedule();
        existing.setId(SCHEDULE_ID);
        existing.setTenantId(TENANT_ID);
        existing.setClientId(10L);
        existing.setConsultantId(20L);
        existing.setStatus(ScheduleStatus.CONFIRMED);
        existing.setDate(LocalDate.of(2026, 5, 20));
        existing.setStartTime(LocalTime.of(10, 0));
        existing.setEndTime(LocalTime.of(11, 0));

        Schedule patch = new Schedule();
        patch.setDate(LocalDate.of(2026, 5, 21));
        patch.setStartTime(LocalTime.of(14, 0));
        patch.setEndTime(LocalTime.of(15, 0));

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.updateSchedule(SCHEDULE_ID, patch);

        verify(mobilePushDispatchService).dispatchBookingRescheduled(
                eq(TENANT_ID),
                any(Schedule.class),
                eq(LocalDate.of(2026, 5, 20)),
                eq(LocalTime.of(10, 0)),
                eq(LocalTime.of(11, 0)));
    }
}
