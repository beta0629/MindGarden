package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.ConsultationStatus;
import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.ScheduleNotificationEligibility;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 1시간·30분 리마인더가 목록 조회 이후 취소·삭제·상담 취소를 다시 읽는지 검증한다.
 *
 * @author MindGarden
 * @since 2026-10-23
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("워크플로우 리마인더 — 발송 직전 일정 재조회")
class WorkflowAutomationServiceImplReminderEligibilityTest {

    private static final String TENANT_ID = "tenant-eligibility";
    private static final Long SCHEDULE_ID = 8_810_301L;
    private static final Long CLIENT_ID = 8_810_302L;
    private static final Long CONSULTANT_ID = 8_810_303L;
    private static final Long CONSULTATION_ID = 8_810_304L;

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ConsultationRepository consultationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ConsultationMessageService consultationMessageService;
    @Mock
    private StatisticsService statisticsService;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private MobilePushDispatchService mobilePushDispatchService;
    @Mock
    private SystemConfigService systemConfigService;
    @Mock
    private TenantService tenantService;

    private WorkflowAutomationServiceImpl service;

    @BeforeEach
    void setUp() {
        ScheduleNotificationEligibility eligibility =
                new ScheduleNotificationEligibility(scheduleRepository, consultationRepository);
        service = new WorkflowAutomationServiceImpl(
                scheduleRepository, userRepository, consultationMessageService,
                statisticsService, commonCodeService, mobilePushDispatchService,
                systemConfigService, tenantService, eligibility);
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED), anyBoolean()))
                .thenReturn(true);
        when(commonCodeService.getCodeValue(anyString(), anyString()))
                .thenAnswer(invocation -> invocation.getArgument(1));
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_ID));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("1시간 전 — 재조회 일정이 취소면 인앱·푸시를 보내지 않는다")
    void t60_rereadCancelled_doesNotNotify() {
        // Given
        Schedule listed = listedSchedule(LocalTime.now().plusHours(1));
        stubList(listed);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
                .thenReturn(Optional.of(blockedCopy(listed, ScheduleStatus.CANCELLED)));

        // When
        service.sendScheduleReminders();

        // Then
        verify(scheduleRepository).findByTenantIdAndId(TENANT_ID, SCHEDULE_ID);
        verifyNoReminder();
    }

    @Test
    @DisplayName("30분 전 — 재조회 일정이 취소면 인앱·푸시를 보내지 않는다")
    void t30_rereadCancelled_doesNotNotify() {
        // Given
        Schedule listed = listedSchedule(LocalTime.now().plusMinutes(30));
        stubList(listed);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
                .thenReturn(Optional.of(blockedCopy(listed, ScheduleStatus.CANCELLED)));

        // When
        service.sendScheduleReminders();

        // Then
        verify(scheduleRepository).findByTenantIdAndId(TENANT_ID, SCHEDULE_ID);
        verifyNoReminder();
    }

    @Test
    @DisplayName("1시간 전 — 재조회 일정이 없으면 인앱·푸시를 보내지 않는다")
    void t60_rereadMissing_doesNotNotify() {
        // Given
        Schedule listed = listedSchedule(LocalTime.now().plusHours(1));
        stubList(listed);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.empty());

        // When
        service.sendScheduleReminders();

        // Then
        verify(scheduleRepository).findByTenantIdAndId(TENANT_ID, SCHEDULE_ID);
        verifyNoReminder();
    }

    @Test
    @DisplayName("30분 전 — 재조회 일정이 없으면 인앱·푸시를 보내지 않는다")
    void t30_rereadMissing_doesNotNotify() {
        // Given
        Schedule listed = listedSchedule(LocalTime.now().plusMinutes(30));
        stubList(listed);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.empty());

        // When
        service.sendScheduleReminders();

        // Then
        verify(scheduleRepository).findByTenantIdAndId(TENANT_ID, SCHEDULE_ID);
        verifyNoReminder();
    }

    @Test
    @DisplayName("1시간 전 — 재조회가 같은 예약 일정이면 푸시를 한 번 보낸다")
    void t60_rereadBooked_dispatchesReminderOnce() {
        // Given
        Schedule listed = listedSchedule(LocalTime.now().plusHours(1));
        stubList(listed);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(listed));

        // When
        service.sendScheduleReminders();

        // Then
        verify(mobilePushDispatchService, times(1)).dispatchBookingReminder(
                eq(TENANT_ID), eq(listed), any(String.class), eq("T60"));
    }

    @Test
    @DisplayName("30분 전 — 재조회가 같은 예약 일정이면 푸시를 한 번 보낸다")
    void t30_rereadBooked_dispatchesReminderOnce() {
        // Given
        Schedule listed = listedSchedule(LocalTime.now().plusMinutes(30));
        stubList(listed);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(listed));

        // When
        service.sendScheduleReminders();

        // Then
        verify(mobilePushDispatchService, times(1)).dispatchBookingReminder(
                eq(TENANT_ID), eq(listed), any(String.class), eq("T30"));
    }

    @Test
    @DisplayName("1시간 전 — 일정은 예약인데 연결 상담이 취소면 인앱·푸시를 보내지 않는다")
    void t60_consultationCancelled_doesNotNotify() {
        // Given
        Schedule listed = listedSchedule(LocalTime.now().plusHours(1));
        listed.setConsultationId(CONSULTATION_ID);
        stubList(listed);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(listed));
        Consultation consultation = new Consultation();
        consultation.setId(CONSULTATION_ID);
        consultation.setStatus(ConsultationStatus.CANCELLED);
        when(consultationRepository.findByTenantIdAndId(TENANT_ID, CONSULTATION_ID))
                .thenReturn(Optional.of(consultation));

        // When
        service.sendScheduleReminders();

        // Then
        verify(consultationRepository).findByTenantIdAndId(TENANT_ID, CONSULTATION_ID);
        verifyNoReminder();
    }

    private void stubList(Schedule schedule) {
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(
                eq(TENANT_ID), eq(LocalDate.now()), anyList()))
                .thenReturn(List.of(schedule));
    }

    private Schedule listedSchedule(LocalTime startTime) {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(CLIENT_ID);
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(startTime);
        schedule.setEndTime(startTime.plusHours(1));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        return schedule;
    }

    private Schedule blockedCopy(Schedule listed, ScheduleStatus status) {
        Schedule blocked = listedSchedule(listed.getStartTime());
        blocked.setDate(listed.getDate());
        blocked.setStatus(status);
        return blocked;
    }

    private void verifyNoReminder() {
        verify(mobilePushDispatchService, never()).dispatchBookingReminder(any(), any(), any(), any());
        verify(consultationMessageService, never()).sendSystemThreadMessage(
                any(), any(), any(), any(), any(), any(), any(), any(), any());
    }
}
