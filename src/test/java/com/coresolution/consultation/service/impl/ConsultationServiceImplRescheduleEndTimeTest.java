package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * 상담 재예약({@link ConsultationServiceImpl#rescheduleConsultation}) — 종료 시각이 기존 상담 길이를 유지해
 * 함께 이동하고, 연결 일정에도 같은 종료 시각이 저장되는지 검증.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("상담 재예약 — 종료 시각 길이 유지 이동")
class ConsultationServiceImplRescheduleEndTimeTest {

    private static final String TENANT_ID = "tenant-reschedule-end-test";
    private static final Long CONSULTATION_ID = 7201L;
    private static final Long SCHEDULE_ID = 7301L;
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
    @DisplayName("다른 날·다른 시각으로 재예약 → 종료 시각이 50분 길이를 유지해 이동, 연결 일정도 동일")
    void reschedule_shiftsEndTimePreservingDuration() {
        LocalDate newDate = OLD_DATE.plusDays(2);
        LocalTime newStart = LocalTime.of(10, 0);

        Consultation saved = service.rescheduleConsultation(CONSULTATION_ID, LocalDateTime.of(newDate, newStart));

        LocalTime expectedEnd = LocalTime.of(10, 50);
        assertThat(saved.getStartTime()).isEqualTo(newStart);
        assertThat(saved.getEndTime()).isEqualTo(expectedEnd);
        assertThat(linkedSchedule.getDate()).isEqualTo(newDate);
        assertThat(linkedSchedule.getStartTime()).isEqualTo(newStart);
        assertThat(linkedSchedule.getEndTime()).isEqualTo(expectedEnd);
    }

    @Test
    @DisplayName("같은 날 시각만 앞당김 → 종료 시각도 같은 길이로 앞당김")
    void reschedule_sameDayEarlier_shiftsEndTime() {
        Consultation saved = service.rescheduleConsultation(
            CONSULTATION_ID, LocalDateTime.of(OLD_DATE, LocalTime.of(9, 0)));

        assertThat(saved.getEndTime()).isEqualTo(LocalTime.of(9, 50));
        assertThat(linkedSchedule.getEndTime()).isEqualTo(LocalTime.of(9, 50));
    }
}
