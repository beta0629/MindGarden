package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.ImmediateReservationSmsDeferralService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 상담 재예약({@link ConsultationServiceImpl#rescheduleConsultation}) — 드래그·수정 모달과 동일하게
 * 이전 슬롯 D-2/D-1 PENDING 취소 + 일정 변경 안내 등록 + 연결 일정이 새 슬롯으로 저장되는지 검증.
 *
 * <p>SMS 발송기는 사용하지 않는다(취소·안내 등록 서비스는 mock).
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("상담 재예약 — 이전 슬롯 리마인드 PENDING 취소 + 변경 안내 + 새 슬롯 대상")
class ConsultationServiceImplRescheduleReminderTest {

    private static final String TENANT_ID = "tenant-reschedule-test";
    private static final Long CONSULTATION_ID = 7001L;
    private static final Long SCHEDULE_ID = 7101L;
    private static final LocalDate OLD_DATE = LocalDate.of(2026, 10, 1);
    private static final LocalTime OLD_START = LocalTime.of(14, 30);
    private static final LocalTime OLD_END = LocalTime.of(15, 20);

    @Mock
    private ConsultationRepository consultationRepository;
    @Mock
    private TenantAccessControlService accessControlService;
    @Mock
    private ImmediateReservationSmsDeferralService immediateReservationSmsDeferralService;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @Mock
    private MobilePushDispatchService mobilePushDispatchService;
    @Mock
    private EmailService emailService;

    private ConsultationServiceImpl service;
    private Consultation consultation;
    private Schedule linkedSchedule;

    @BeforeEach
    void setUp() {
        service = new ConsultationServiceImpl(
            consultationRepository, accessControlService, immediateReservationSmsDeferralService);
        ReflectionTestUtils.setField(service, "scheduleRepository", scheduleRepository);
        ReflectionTestUtils.setField(service, "scheduleChangeNotificationDebounceService",
            scheduleChangeNotificationDebounceService);
        ReflectionTestUtils.setField(service, "mobilePushDispatchService", mobilePushDispatchService);
        ReflectionTestUtils.setField(service, "emailService", emailService);

        TenantContextHolder.setTenantId(TENANT_ID);
        when(emailService.sendTemplateEmail(anyString(), anyString(), anyString(), any()))
            .thenReturn(EmailResponse.builder().success(true).build());

        consultation = new Consultation();
        consultation.setId(CONSULTATION_ID);
        consultation.setTenantId(TENANT_ID);
        consultation.setConsultationDate(OLD_DATE);
        consultation.setStartTime(OLD_START);
        consultation.setEndTime(OLD_END);
        consultation.setStatus("CONFIRMED");
        consultation.setVersion(1L);
        consultation.setIsDeleted(false);
        when(consultationRepository.findByTenantIdAndId(TENANT_ID, CONSULTATION_ID))
            .thenReturn(Optional.of(consultation));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(inv -> inv.getArgument(0));

        linkedSchedule = new Schedule();
        linkedSchedule.setId(SCHEDULE_ID);
        linkedSchedule.setTenantId(TENANT_ID);
        linkedSchedule.setConsultationId(CONSULTATION_ID);
        linkedSchedule.setDate(OLD_DATE);
        linkedSchedule.setStartTime(OLD_START);
        linkedSchedule.setEndTime(OLD_END);
        linkedSchedule.setStatus(ScheduleStatus.BOOKED);
        linkedSchedule.setIsDeleted(false);
        when(scheduleRepository.findByTenantIdAndConsultationId(TENANT_ID, CONSULTATION_ID))
            .thenReturn(List.of(linkedSchedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("다른 날로 재예약 → 이전 슬롯 D-2/D-1 PENDING 취소, 변경 안내 등록, 연결 일정 새 슬롯")
    void reschedule_toAnotherDay_cancelsOldSlotPending_enqueuesChangeNotice_movesSlot() {
        LocalDateTime newDateTime = OLD_DATE.plusDays(1).atTime(LocalTime.of(10, 0));

        service.rescheduleConsultation(CONSULTATION_ID, newDateTime);

        verify(immediateReservationSmsDeferralService).cancelPendingReservationReminders(
            TENANT_ID, SCHEDULE_ID, BatchNotificationTemplateCodes.RESERVATION_REMINDER_DN_CODES);
        ArgumentCaptor<Schedule> enqueued = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleChangeNotificationDebounceService).enqueueScheduleChanged(
            eq(TENANT_ID), enqueued.capture(), eq(OLD_DATE), eq(OLD_START));
        assertThat(enqueued.getValue().getId()).isEqualTo(SCHEDULE_ID);
        assertThat(linkedSchedule.getDate()).isEqualTo(newDateTime.toLocalDate());
        assertThat(linkedSchedule.getStartTime()).isEqualTo(newDateTime.toLocalTime());
        assertThat(BatchNotificationTemplateCodes.buildReminderSlotKey(
            linkedSchedule.getDate(), linkedSchedule.getStartTime()))
            .isEqualTo(BatchNotificationTemplateCodes.buildReminderSlotKey(
                newDateTime.toLocalDate(), newDateTime.toLocalTime()));
    }

    @Test
    @DisplayName("같은 날 시간만 재예약 → 이전 슬롯 PENDING 취소")
    void reschedule_sameDayTimeOnly_cancelsOldSlotPending() {
        service.rescheduleConsultation(CONSULTATION_ID, OLD_DATE.atTime(LocalTime.of(17, 0)));

        verify(immediateReservationSmsDeferralService).cancelPendingReservationReminders(
            TENANT_ID, SCHEDULE_ID, BatchNotificationTemplateCodes.RESERVATION_REMINDER_DN_CODES);
    }

    @Test
    @DisplayName("일시가 같은 재예약 → PENDING 취소하지 않음")
    void reschedule_sameSlot_doesNotCancelPending() {
        service.rescheduleConsultation(CONSULTATION_ID, OLD_DATE.atTime(OLD_START));

        verify(immediateReservationSmsDeferralService, never())
            .cancelPendingReservationReminders(anyString(), any(), any());
    }

    @Test
    @DisplayName("PENDING 취소 실패 → 재예약·변경 안내 등록은 계속 진행 (비차단)")
    void reschedule_cancelFailure_isNonBlocking() {
        when(immediateReservationSmsDeferralService.cancelPendingReservationReminders(anyString(), any(), any()))
            .thenThrow(new IllegalStateException("boom"));

        Consultation result = service.rescheduleConsultation(
            CONSULTATION_ID, OLD_DATE.plusDays(2).atTime(OLD_START));

        assertThat(result.getConsultationDate()).isEqualTo(OLD_DATE.plusDays(2));
        verify(scheduleChangeNotificationDebounceService).enqueueScheduleChanged(
            eq(TENANT_ID), any(Schedule.class), eq(OLD_DATE), eq(OLD_START));
    }
}
