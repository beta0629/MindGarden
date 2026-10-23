package com.coresolution.consultation.scheduler;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.constant.BookingReminderPushConstants;
import com.coresolution.consultation.constant.ConsultationStatus;
import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.ImmediateReservationSmsPendingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.BatchNotificationDispatchService.DispatchOutcome;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.ScheduleNotificationEligibility;
import com.coresolution.consultation.service.SmsTemplateService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
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
 * D-1 푸시가 목록 조회 이후 취소·삭제·상담 취소를 다시 읽는지 검증한다. SMS 배치는 그대로 둔다.
 *
 * @author MindGarden
 * @since 2026-10-23
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("D-1 푸시 — 발송 직전 일정 재조회")
class ReservationReminderSchedulerD1EligibilityTest {

    private static final String TENANT_ID = "tenant-eligibility";
    private static final Long SCHEDULE_ID = 8_810_501L;
    private static final Long CLIENT_ID = 8_810_502L;
    private static final Long CONSULTANT_ID = 8_810_503L;
    private static final Long CONSULTATION_ID = 8_810_504L;

    @Mock
    private TenantService tenantService;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ConsultationRepository consultationRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ImmediateReservationSmsPendingRepository immediateReservationSmsPendingRepository;
    @Mock
    private BatchNotificationDispatchService dispatchService;
    @Mock
    private MobilePushDispatchService mobilePushDispatchService;
    @Mock
    private SchedulerExecutionLogService logService;
    @Mock
    private SchedulerAlertService alertService;
    @Mock
    private SystemConfigService systemConfigService;
    @Mock
    private SmsTemplateService smsTemplateService;

    private ReservationReminderScheduler scheduler;
    private final LocalDate d1Date = LocalDate.now().plusDays(BookingReminderPushConstants.REMINDER_D1_DAYS_AHEAD);

    @BeforeEach
    void setUp() {
        BatchNotificationProperties properties = new BatchNotificationProperties();
        properties.setReservationReminderDaysAhead(2);
        ScheduleNotificationEligibility eligibility =
                new ScheduleNotificationEligibility(scheduleRepository, consultationRepository);
        scheduler = new ReservationReminderScheduler(
                tenantService, scheduleRepository, mappingRepository, immediateReservationSmsPendingRepository,
                dispatchService, mobilePushDispatchService, properties, logService, alertService,
                systemConfigService, smsTemplateService, eligibility);
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED), anyBoolean()))
                .thenReturn(true);
        when(smsTemplateService.isAutoDispatchEnabledFor(anyString(), anyString())).thenReturn(true);
        when(immediateReservationSmsPendingRepository.existsPendingForScheduleAndFireAtRange(
                any(), any(), any(), any(), any())).thenReturn(false);
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_ID));
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(any(), any(LocalDate.class), anyList()))
                .thenReturn(Collections.emptyList());
        when(dispatchService.dispatchReservationImmediateLate(any())).thenReturn(smsSuccess());
        when(dispatchService.dispatchReservationReminderD2(any())).thenReturn(smsSuccess());
        givenEligibleMapping();
    }

    @Test
    @DisplayName("재조회 일정이 취소면 D-1 푸시를 보내지 않는다")
    void rereadCancelled_doesNotDispatchD1Push() {
        // Given
        Schedule listed = d1Schedule(null);
        stubD1List(listed);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
                .thenReturn(Optional.of(cancelledCopy(listed)));

        // When
        scheduler.runDailyReminder();

        // Then
        verify(scheduleRepository).findByTenantIdAndId(TENANT_ID, SCHEDULE_ID);
        verify(mobilePushDispatchService, never()).dispatchBookingReminder(any(), any(), any(), any());
    }

    @Test
    @DisplayName("재조회 일정이 없으면 D-1 푸시를 보내지 않는다")
    void rereadMissing_doesNotDispatchD1Push() {
        // Given
        Schedule listed = d1Schedule(null);
        stubD1List(listed);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.empty());

        // When
        scheduler.runDailyReminder();

        // Then
        verify(scheduleRepository).findByTenantIdAndId(TENANT_ID, SCHEDULE_ID);
        verify(mobilePushDispatchService, never()).dispatchBookingReminder(any(), any(), any(), any());
    }

    @Test
    @DisplayName("재조회가 같은 예약 일정이면 D-1 푸시를 한 번 보낸다")
    void rereadBooked_dispatchesD1PushOnce() {
        // Given
        Schedule listed = d1Schedule(null);
        stubD1List(listed);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(listed));

        // When
        scheduler.runDailyReminder();

        // Then
        verify(mobilePushDispatchService, times(1)).dispatchBookingReminder(
                eq(TENANT_ID), eq(listed), any(String.class),
                eq(BookingReminderPushConstants.REMINDER_D1_SLOT_CODE));
    }

    @Test
    @DisplayName("일정은 예약인데 연결 상담이 취소면 D-1 푸시를 보내지 않는다")
    void consultationCancelledWhileScheduleBooked_doesNotDispatchD1Push() {
        // Given
        Schedule listed = d1Schedule(CONSULTATION_ID);
        stubD1List(listed);
        Schedule reread = d1Schedule(CONSULTATION_ID);
        reread.setStatus(ScheduleStatus.BOOKED);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(reread));
        Consultation consultation = new Consultation();
        consultation.setId(CONSULTATION_ID);
        consultation.setStatus(ConsultationStatus.CANCELLED);
        when(consultationRepository.findByTenantIdAndId(TENANT_ID, CONSULTATION_ID))
                .thenReturn(Optional.of(consultation));

        // When
        scheduler.runDailyReminder();

        // Then
        verify(consultationRepository).findByTenantIdAndId(TENANT_ID, CONSULTATION_ID);
        verify(mobilePushDispatchService, never()).dispatchBookingReminder(any(), any(), any(), any());
    }

    private void stubD1List(Schedule schedule) {
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_ID), eq(d1Date), anyList()))
                .thenReturn(List.of(schedule));
    }

    private Schedule d1Schedule(Long consultationId) {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(CLIENT_ID);
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setDate(d1Date);
        schedule.setStartTime(LocalTime.of(14, 30));
        schedule.setEndTime(LocalTime.of(15, 30));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        schedule.setConsultationId(consultationId);
        return schedule;
    }

    private Schedule cancelledCopy(Schedule listed) {
        Schedule cancelled = d1Schedule(null);
        cancelled.setDate(listed.getDate());
        cancelled.setStartTime(listed.getStartTime());
        cancelled.setStatus(ScheduleStatus.CANCELLED);
        return cancelled;
    }

    private void givenEligibleMapping() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .consultant(consultant)
                .client(client)
                .totalSessions(10)
                .remainingSessions(7)
                .usedSessions(3)
                .status(MappingStatus.ACTIVE)
                .build();
        mapping.setId(CONSULTANT_ID);
        mapping.setTenantId(TENANT_ID);
        when(mappingRepository.findActiveExhaustedOrPendingPaymentListByTenantIdAndConsultantIdAndClientId(
                TENANT_ID, CONSULTANT_ID, CLIENT_ID)).thenReturn(List.of(mapping));
    }

    private DispatchOutcome smsSuccess() {
        return new DispatchOutcome(DispatchOutcome.Status.ALIMTALK_SENT, "ALIMTALK", false, null, null, 901L);
    }
}
