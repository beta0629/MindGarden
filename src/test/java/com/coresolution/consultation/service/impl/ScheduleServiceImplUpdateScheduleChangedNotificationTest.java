package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
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
 * 알림톡/SMS/인앱 NotificationService 트리거 검증 (핫픽스 2026-06-02).
 *
 * <p>기존 push 테스트 ({@link ScheduleServiceImplUpdateSchedulePushTest}) 와 별도로,
 * 어드민/상담사의 schedules UI 직접 수정 경로에서도 SMS 알림이 발송되도록
 * {@code notificationService.sendScheduleChanged} 호출 여부를 검증.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl updateSchedule SCHEDULE_CHANGED 알림 트리거")
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
    private UserRepository userRepository;
    @Mock
    private ConsultantRepository consultantRepository;
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;

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

    private User stubClient() {
        User u = new User();
        u.setId(CLIENT_ID);
        u.setTenantId(TENANT_ID);
        u.setName("홍길동");
        return u;
    }

    private Consultant stubConsultant() {
        Consultant c = new Consultant();
        c.setId(CONSULTANT_ID);
        c.setTenantId(TENANT_ID);
        c.setName("조재은");
        return c;
    }

    @Test
    @DisplayName("date/time 변경 시 sendScheduleChanged 호출 - 변경된 슬롯과 상담사명 전달")
    void slotChange_invokesSendScheduleChanged() {
        Schedule existing = existingConfirmed();
        Schedule patch = new Schedule();
        patch.setDate(LocalDate.of(2026, 5, 21));
        patch.setStartTime(LocalTime.of(14, 0));
        patch.setEndTime(LocalTime.of(15, 0));

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findByTenantIdAndId(eq(TENANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(stubClient()));
        when(consultantRepository.findByTenantIdAndId(eq(TENANT_ID), eq(CONSULTANT_ID)))
                .thenReturn(Optional.of(stubConsultant()));

        scheduleService.updateSchedule(SCHEDULE_ID, patch);

        verify(notificationService).sendScheduleChanged(
                any(User.class),
                anyString(),
                eq("2026-05-20 10:00"),
                eq("2026-05-21 14:00"));
    }

    @Test
    @DisplayName("CANCELLED 로 변경 시 sendScheduleChanged 미호출")
    void cancellingNow_doesNotInvokeSendScheduleChanged() {
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

        verify(notificationService, never())
                .sendScheduleChanged(any(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("clientId 가 null 인 개인 일정의 경우 sendScheduleChanged 미호출")
    void personalSchedule_doesNotInvokeSendScheduleChanged() {
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

        verify(notificationService, never())
                .sendScheduleChanged(any(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("slot 변경 없음 (status 만 변경) — sendScheduleChanged 미호출")
    void noSlotChange_doesNotInvokeSendScheduleChanged() {
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

        verify(notificationService, never())
                .sendScheduleChanged(any(), anyString(), anyString(), anyString());
    }
}
