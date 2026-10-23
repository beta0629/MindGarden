package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.ConsultationStatus;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * {@link ScheduleNotificationEligibility} 발송 자격 재조회.
 *
 * @author MindGarden
 * @since 2026-10-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("예약 알림 발송 자격 — 일정·상담 재조회")
class ScheduleNotificationEligibilityTest {

    private static final String TENANT_ID = "tenant-eligibility";
    private static final Long SCHEDULE_ID = 8_810_230L;
    private static final Long CONSULTATION_ID = 8_810_231L;
    private static final LocalDate SLOT_DATE = LocalDate.of(2026, 10, 23);
    private static final LocalTime SLOT_START = LocalTime.of(10, 15);

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ConsultationRepository consultationRepository;

    private ScheduleNotificationEligibility eligibility;

    @BeforeEach
    void setUp() {
        eligibility = new ScheduleNotificationEligibility(scheduleRepository, consultationRepository);
    }

    @Test
    @DisplayName("일정이 없으면 발송하지 않고 테넌트 조회로만 읽는다")
    void missingSchedule_returnsFalseAndUsesTenantLookup() {
        // Given
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.empty());

        // When
        boolean sendable = eligibility.isSendable(TENANT_ID, SCHEDULE_ID, SLOT_DATE, SLOT_START);

        // Then
        assertThat(sendable).isFalse();
        verify(scheduleRepository).findByTenantIdAndId(TENANT_ID, SCHEDULE_ID);
        verify(scheduleRepository, never()).findById(org.mockito.ArgumentMatchers.any());
        verifyNoInteractions(consultationRepository);
    }

    @Test
    @DisplayName("소프트 삭제된 일정이 조회되면 발송하지 않는다")
    void softDeletedSchedule_returnsFalse() {
        // Given
        Schedule schedule = bookedSchedule();
        schedule.setIsDeleted(true);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(schedule));

        // When
        boolean sendable = eligibility.isSendable(TENANT_ID, SCHEDULE_ID, SLOT_DATE, SLOT_START);

        // Then
        assertThat(sendable).isFalse();
    }

    @Test
    @DisplayName("일정 상태가 취소·완료·휴가이면 발송하지 않는다")
    void blockedScheduleStatuses_returnFalse() {
        for (ScheduleStatus status : List.of(
                ScheduleStatus.CANCELLED, ScheduleStatus.COMPLETED, ScheduleStatus.VACATION)) {
            // Given
            Schedule schedule = bookedSchedule();
            schedule.setStatus(status);
            when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(schedule));

            // When
            boolean sendable = eligibility.isSendable(TENANT_ID, SCHEDULE_ID, SLOT_DATE, SLOT_START);

            // Then
            assertThat(sendable).as("status=%s", status).isFalse();
        }
    }

    @Test
    @DisplayName("예약·확정이고 슬롯이 같으며 상담이 없으면 발송한다")
    void bookedAndConfirmedWithoutConsultation_returnTrue() {
        for (ScheduleStatus status : List.of(ScheduleStatus.BOOKED, ScheduleStatus.CONFIRMED)) {
            // Given
            Schedule schedule = bookedSchedule();
            schedule.setStatus(status);
            schedule.setEndTime(SLOT_START.plusMinutes(50));
            when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(schedule));

            // When
            boolean sendable = eligibility.isSendable(TENANT_ID, SCHEDULE_ID, SLOT_DATE, SLOT_START);

            // Then
            assertThat(sendable).as("status=%s", status).isTrue();
        }
        verifyNoInteractions(consultationRepository);
    }

    @Test
    @DisplayName("상담일이 기대 값과 다르면 발송하지 않는다")
    void dateChanged_returnsFalse() {
        // Given
        Schedule schedule = bookedSchedule();
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(schedule));

        // When
        boolean sendable = eligibility.isSendable(TENANT_ID, SCHEDULE_ID, SLOT_DATE.plusDays(1), SLOT_START);

        // Then
        assertThat(sendable).isFalse();
        verifyNoInteractions(consultationRepository);
    }

    @Test
    @DisplayName("시작 시각이 기대 값과 다르면 발송하지 않는다")
    void startTimeChanged_returnsFalse() {
        // Given
        Schedule schedule = bookedSchedule();
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(schedule));

        // When
        boolean sendable = eligibility.isSendable(TENANT_ID, SCHEDULE_ID, SLOT_DATE, SLOT_START.plusMinutes(30));

        // Then
        assertThat(sendable).isFalse();
    }

    @Test
    @DisplayName("테넌트·일정·기대 슬롯이 없으면 발송하지 않는다")
    void nullOrBlankInputs_returnFalse() {
        // When / Then
        assertThat(eligibility.isSendable(null, SCHEDULE_ID, SLOT_DATE, SLOT_START)).isFalse();
        assertThat(eligibility.isSendable("  ", SCHEDULE_ID, SLOT_DATE, SLOT_START)).isFalse();
        assertThat(eligibility.isSendable("", SCHEDULE_ID, SLOT_DATE, SLOT_START)).isFalse();
        assertThat(eligibility.isSendable(TENANT_ID, null, SLOT_DATE, SLOT_START)).isFalse();
        assertThat(eligibility.isSendable(TENANT_ID, SCHEDULE_ID, null, SLOT_START)).isFalse();
        assertThat(eligibility.isSendable(TENANT_ID, SCHEDULE_ID, SLOT_DATE, null)).isFalse();
        verifyNoInteractions(scheduleRepository);
        verifyNoInteractions(consultationRepository);
    }

    @Test
    @DisplayName("일정 상태가 없으면 발송하지 않는다")
    void nullScheduleStatus_returnsFalse() {
        // Given
        Schedule schedule = bookedSchedule();
        schedule.setStatus(null);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(schedule));

        // When
        boolean sendable = eligibility.isSendable(TENANT_ID, SCHEDULE_ID, SLOT_DATE, SLOT_START);

        // Then
        assertThat(sendable).isFalse();
    }

    @Test
    @DisplayName("연결 상담이 취소되면 일정이 예약 상태여도 발송하지 않는다")
    void cancelledConsultation_returnsFalse() {
        // Given
        Schedule schedule = bookedSchedule();
        schedule.setConsultationId(CONSULTATION_ID);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(schedule));
        Consultation consultation = consultation(ConsultationStatus.CANCELLED);
        when(consultationRepository.findByTenantIdAndId(TENANT_ID, CONSULTATION_ID))
                .thenReturn(Optional.of(consultation));

        // When
        boolean sendable = eligibility.isSendable(TENANT_ID, SCHEDULE_ID, SLOT_DATE, SLOT_START);

        // Then
        assertThat(sendable).isFalse();
        verify(consultationRepository).findByTenantIdAndId(TENANT_ID, CONSULTATION_ID);
    }

    @Test
    @DisplayName("연결 상담이 확정이면 발송한다")
    void confirmedConsultation_returnsTrue() {
        // Given
        Schedule schedule = bookedSchedule();
        schedule.setConsultationId(CONSULTATION_ID);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(schedule));
        when(consultationRepository.findByTenantIdAndId(TENANT_ID, CONSULTATION_ID))
                .thenReturn(Optional.of(consultation(ConsultationStatus.CONFIRMED)));

        // When
        boolean sendable = eligibility.isSendable(TENANT_ID, SCHEDULE_ID, SLOT_DATE, SLOT_START);

        // Then
        assertThat(sendable).isTrue();
    }

    @Test
    @DisplayName("연결 상담 ID는 있으나 상담이 없으면 발송하지 않는다")
    void missingConsultation_returnsFalse() {
        // Given
        Schedule schedule = bookedSchedule();
        schedule.setConsultationId(CONSULTATION_ID);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(schedule));
        when(consultationRepository.findByTenantIdAndId(TENANT_ID, CONSULTATION_ID)).thenReturn(Optional.empty());

        // When
        boolean sendable = eligibility.isSendable(TENANT_ID, SCHEDULE_ID, SLOT_DATE, SLOT_START);

        // Then
        assertThat(sendable).isFalse();
    }

    private Schedule bookedSchedule() {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_ID);
        schedule.setDate(SLOT_DATE);
        schedule.setStartTime(SLOT_START);
        schedule.setEndTime(SLOT_START.plusHours(1));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        return schedule;
    }

    private Consultation consultation(String status) {
        Consultation consultation = new Consultation();
        consultation.setId(CONSULTATION_ID);
        consultation.setTenantId(TENANT_ID);
        consultation.setStatus(status);
        return consultation;
    }
}
