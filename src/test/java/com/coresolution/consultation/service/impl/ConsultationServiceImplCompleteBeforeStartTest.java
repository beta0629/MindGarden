package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.exception.ScheduleSessionNotStartedException;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ImmediateReservationSmsDeferralService;
import com.coresolution.consultation.service.SalaryLateSessionAutoSyncService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
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

/**
 * 상담 완료(관리자) → 연동 일정 완료 경로의 시작 전 차단.
 *
 * <p>시작 전: 400 예외, 상담·일정 상태·회기·급여 변화 0. 시작 후: 일정 완료·차감 훅 1회.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ConsultationServiceImpl.completeConsultation — 연동 일정 시작 전 차단")
class ConsultationServiceImplCompleteBeforeStartTest {

    private static final String TENANT_ID = "tenant-consultation-complete-gate";
    private static final Long CONSULTATION_ID = 7501L;
    private static final Long SCHEDULE_ID = 7502L;

    @Mock private ConsultationRepository consultationRepository;
    @Mock private TenantAccessControlService accessControlService;
    @Mock private ImmediateReservationSmsDeferralService immediateReservationSmsDeferralService;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ScheduleService scheduleService;
    @Mock private SalaryLateSessionAutoSyncService salaryLateSessionAutoSyncService;

    private ConsultationServiceImpl service;
    private Consultation consultation;
    private Schedule linkedSchedule;

    @BeforeEach
    void setUp() {
        service = new ConsultationServiceImpl(
            consultationRepository, accessControlService, immediateReservationSmsDeferralService);
        ReflectionTestUtils.setField(service, "scheduleRepository", scheduleRepository);
        ReflectionTestUtils.setField(service, "scheduleService", scheduleService);
        ReflectionTestUtils.setField(service, "salaryLateSessionAutoSyncService", salaryLateSessionAutoSyncService);
        TenantContextHolder.setTenantId(TENANT_ID);

        consultation = new Consultation();
        consultation.setId(CONSULTATION_ID);
        consultation.setTenantId(TENANT_ID);
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
        linkedSchedule.setDate(LocalDate.of(2026, 10, 20));
        linkedSchedule.setStartTime(LocalTime.of(10, 0));
        linkedSchedule.setStatus(ScheduleStatus.BOOKED);
        linkedSchedule.setIsDeleted(false);
        when(scheduleRepository.findByTenantIdAndConsultationId(TENANT_ID, CONSULTATION_ID))
            .thenReturn(List.of(linkedSchedule));
        when(scheduleRepository.findByConsultationId(CONSULTATION_ID)).thenReturn(List.of(linkedSchedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("연동 일정 시작 전 → 400 예외, 상담·일정 상태·회기·급여 변화 0")
    void completeConsultation_beforeStart_rejected() {
        doThrow(new ScheduleSessionNotStartedException(SCHEDULE_ID))
            .when(scheduleService).requireSessionStartedForCompletion(linkedSchedule);

        assertThatThrownBy(() -> service.completeConsultation(CONSULTATION_ID, "note", 5))
            .isInstanceOf(ScheduleSessionNotStartedException.class);

        assertThat(consultation.getStatus()).isEqualTo("CONFIRMED");
        assertThat(linkedSchedule.getStatus()).isEqualTo(ScheduleStatus.BOOKED);
        verify(consultationRepository, never()).save(any(Consultation.class));
        verify(scheduleRepository, never()).save(any(Schedule.class));
        verify(scheduleService, never()).deductSessionAtCompletionIfNeeded(any());
        verify(salaryLateSessionAutoSyncService, never()).syncAfterScheduleCompleted(any());
    }

    @Test
    @DisplayName("연동 일정 시작 후 → 일정 COMPLETED, 차감 훅·급여 동기 각 1회")
    void completeConsultation_afterStart_completesOnce() {
        service.completeConsultation(CONSULTATION_ID, "note", 5);

        assertThat(linkedSchedule.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        verify(scheduleService, times(1)).requireSessionStartedForCompletion(linkedSchedule);
        verify(scheduleService, times(1)).deductSessionAtCompletionIfNeeded(linkedSchedule);
        verify(salaryLateSessionAutoSyncService, times(1)).syncAfterScheduleCompleted(linkedSchedule);
    }

    @Test
    @DisplayName("이미 완료된 연동 일정은 판정·재차감 대상이 아니다")
    void completeConsultation_alreadyCompletedSchedule_noRecheckNoDeduct() {
        linkedSchedule.setStatus(ScheduleStatus.COMPLETED);

        service.completeConsultation(CONSULTATION_ID, "note", 5);

        verify(scheduleService, never()).requireSessionStartedForCompletion(any());
        verify(scheduleService, never()).deductSessionAtCompletionIfNeeded(any());
        verify(salaryLateSessionAutoSyncService, never()).syncAfterScheduleCompleted(any());
    }
}
