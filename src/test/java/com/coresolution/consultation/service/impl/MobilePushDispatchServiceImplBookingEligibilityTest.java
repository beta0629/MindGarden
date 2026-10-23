package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.config.ExpoPushProperties;
import com.coresolution.consultation.constant.ConsultationStatus;
import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.MobilePushToken;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.MobilePushSettingsRepository;
import com.coresolution.consultation.repository.MobilePushTokenRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MobilePushDispatchDedupService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleNotificationEligibility;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 푸시 디스패치가 연결 상담 취소를 재조회해 리마인더·변경 팬아웃을 막는지 검증한다.
 *
 * @author MindGarden
 * @since 2026-10-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("예약 푸시 디스패치 — 연결 상담 취소")
class MobilePushDispatchServiceImplBookingEligibilityTest {

    private static final String TENANT_ID = "tenant-eligibility";
    private static final Long SCHEDULE_ID = 8_810_401L;
    private static final Long CLIENT_ID = 8_810_402L;
    private static final Long CONSULTANT_ID = 8_810_403L;
    private static final Long CONSULTATION_ID = 8_810_404L;
    private static final LocalDate SLOT_DATE = LocalDate.of(2026, 10, 24);
    private static final LocalTime SLOT_START = LocalTime.of(11, 0);

    @Mock
    private RestTemplate restTemplate;
    @Mock
    private ExpoPushProperties expoPushProperties;
    @Mock
    private MobilePushTokenRepository mobilePushTokenRepository;
    @Mock
    private MobilePushSettingsRepository mobilePushSettingsRepository;
    @Mock
    private MobilePushDispatchDedupService mobilePushDispatchDedupService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock
    private MobilePushInboxPersister mobilePushInboxPersister;
    @Mock
    private ConsultationRepository consultationRepository;

    private MobilePushDispatchServiceImpl service;

    @BeforeEach
    void setUp() {
        ScheduleNotificationEligibility eligibility =
                new ScheduleNotificationEligibility(scheduleRepository, consultationRepository);
        service = new MobilePushDispatchServiceImpl(
                restTemplate,
                new ObjectMapper(),
                expoPushProperties,
                mobilePushTokenRepository,
                mobilePushSettingsRepository,
                mobilePushDispatchDedupService,
                userRepository,
                scheduleRepository,
                scheduleListUserFieldsResolver,
                mobilePushInboxPersister,
                eligibility);
    }

    @Test
    @DisplayName("일정은 예약인데 연결 상담이 취소면 리마인더·변경 푸시를 보내지 않는다")
    void cancelledConsultation_doesNotFanoutReminderOrReschedule() {
        // Given
        Schedule schedule = bookedSchedule();
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(schedule));
        Consultation consultation = new Consultation();
        consultation.setId(CONSULTATION_ID);
        consultation.setStatus(ConsultationStatus.CANCELLED);
        when(consultationRepository.findByTenantIdAndId(TENANT_ID, CONSULTATION_ID))
                .thenReturn(Optional.of(consultation));

        // When
        service.dispatchBookingReminder(TENANT_ID, schedule, "상담이 곧 시작됩니다.", "T60");
        service.dispatchBookingRescheduled(
                TENANT_ID,
                schedule,
                SLOT_DATE.minusDays(1),
                SLOT_START.minusHours(2),
                SLOT_START.minusHours(1),
                null);

        // Then
        verify(consultationRepository, atLeastOnce()).findByTenantIdAndId(TENANT_ID, CONSULTATION_ID);
        verify(mobilePushDispatchDedupService, never()).tryClaim(anyString(), anyString(), anyString(), anyString());
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    @DisplayName("예약 일정 — 리마인더 푸시를 내담자와 상담사에게 보낸다")
    void bookedSchedule_reminderFansOutToClientAndConsultant() {
        // Given
        Schedule schedule = bookedSchedule();
        stubSendableBooked(schedule);

        // When
        service.dispatchBookingReminder(TENANT_ID, schedule, "상담이 곧 시작됩니다.", "T60");

        // Then
        verify(consultationRepository).findByTenantIdAndId(TENANT_ID, CONSULTATION_ID);
        verifyFanout(MobilePushCanonicalTypes.BOOKING_REMINDER);
    }

    @Test
    @DisplayName("예약 일정 — 일정 변경 푸시를 내담자와 상담사에게 보낸다")
    void bookedSchedule_rescheduleFansOutToClientAndConsultant() {
        // Given
        Schedule schedule = bookedSchedule();
        stubSendableBooked(schedule);

        // When
        service.dispatchBookingRescheduled(
                TENANT_ID,
                schedule,
                SLOT_DATE.minusDays(1),
                SLOT_START.minusHours(2),
                SLOT_START.minusHours(1),
                null);

        // Then
        verify(consultationRepository).findByTenantIdAndId(TENANT_ID, CONSULTATION_ID);
        verifyFanout(MobilePushCanonicalTypes.BOOKING_RESCHEDULED);
    }

    private void stubSendableBooked(Schedule schedule) {
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(schedule));
        Consultation consultation = new Consultation();
        consultation.setId(CONSULTATION_ID);
        consultation.setStatus(ConsultationStatus.CONFIRMED);
        when(consultationRepository.findByTenantIdAndId(TENANT_ID, CONSULTATION_ID))
                .thenReturn(Optional.of(consultation));
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");
        when(userRepository.findByTenantIdAndId(TENANT_ID, CLIENT_ID)).thenReturn(Optional.empty());
        when(userRepository.findByTenantIdAndId(TENANT_ID, CONSULTANT_ID)).thenReturn(Optional.empty());
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(TENANT_ID, CLIENT_ID))
                .thenReturn(Optional.empty());
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(TENANT_ID, CONSULTANT_ID))
                .thenReturn(Optional.empty());

        MobilePushToken clientToken = pushToken(CLIENT_ID, "ExponentPushToken[booked-client]");
        MobilePushToken consultantToken = pushToken(CONSULTANT_ID, "ExponentPushToken[booked-consultant]");
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq(TENANT_ID), eq(List.of(CLIENT_ID)))).thenReturn(List.of(clientToken));
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq(TENANT_ID), eq(List.of(CONSULTANT_ID)))).thenReturn(List.of(consultantToken));
        when(mobilePushDispatchDedupService.tryClaim(eq(TENANT_ID), anyString(), anyString(), anyString()))
                .thenReturn(true);
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");
    }

    private void verifyFanout(String canonicalType) {
        verify(mobilePushTokenRepository).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq(TENANT_ID), eq(List.of(CLIENT_ID)));
        verify(mobilePushTokenRepository).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq(TENANT_ID), eq(List.of(CONSULTANT_ID)));
        verify(mobilePushDispatchDedupService, times(2)).tryClaim(
                eq(TENANT_ID), eq(canonicalType), eq(String.valueOf(SCHEDULE_ID)), anyString());
        verify(restTemplate, times(2)).postForObject(anyString(), any(), eq(String.class));
    }

    private MobilePushToken pushToken(Long userId, String token) {
        MobilePushToken pushToken = new MobilePushToken();
        pushToken.setUserId(userId);
        pushToken.setPushToken(token);
        return pushToken;
    }

    private Schedule bookedSchedule() {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(CLIENT_ID);
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setConsultationId(CONSULTATION_ID);
        schedule.setDate(SLOT_DATE);
        schedule.setStartTime(SLOT_START);
        schedule.setEndTime(SLOT_START.plusHours(1));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        return schedule;
    }
}
