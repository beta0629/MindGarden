package com.coresolution.consultation.scheduler;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.SessionRecoveryAlert;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.SessionRecoveryAlertRepository;
import com.coresolution.consultation.scheduler.SessionDeductionRecoveryBatch.RecoveryResult;
import com.coresolution.consultation.service.ScheduleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link SessionDeductionRecoveryBatch} 단위 테스트.
 *
 * <p>케이스 A~E (위임 명세 §7) 모두 통과해야 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionDeductionRecoveryBatch — 회기 차감 누락 보정 배치 단위 테스트 (P1 #93)")
class SessionDeductionRecoveryBatchTest {

    private static final String TENANT_A = "tenant-A";
    private static final String TENANT_B = "tenant-B";
    private static final Long CONSULTANT_ID = 11L;
    private static final Long CLIENT_ID = 22L;
    private static final Long MAPPING_ID = 93L;

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ScheduleService scheduleService;
    @Mock
    private SessionRecoveryAlertRepository alertRepository;

    @InjectMocks
    private SessionDeductionRecoveryBatch batch;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(batch, "pageSize", 200);
    }

    private Schedule buildSchedule(Long id, String tenantId, ScheduleStatus status) {
        Schedule s = new Schedule();
        s.setId(id);
        s.setTenantId(tenantId);
        s.setConsultantId(CONSULTANT_ID);
        s.setClientId(CLIENT_ID);
        s.setStatus(status);
        s.setIsDeleted(false);
        s.setDate(LocalDate.of(2026, 6, 2));
        s.setStartTime(LocalTime.of(10, 0));
        s.setEndTime(LocalTime.of(10, 50));
        // sessionSequence == null
        return s;
    }

    private ConsultantClientMapping buildMapping(Long mappingId, String tenantId,
            MappingStatus status, PaymentStatus payment, int total, int remaining, int used) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(mappingId);
        m.setTenantId(tenantId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setStatus(status);
        m.setPaymentStatus(payment);
        m.setTotalSessions(total);
        m.setRemainingSessions(remaining);
        m.setUsedSessions(used);
        return m;
    }

    @Test
    @DisplayName("케이스 A: 매핑 결제 확정 직후 미차감 COMPLETED 일정 1건 → 보정 차감 성공 (#93 재현)")
    void caseA_completedScheduleBeforePaymentConfirmation_isDeductedByBatch() {
        Schedule completed = buildSchedule(107L, TENANT_A, ScheduleStatus.COMPLETED);
        ConsultantClientMapping mapping = buildMapping(
                MAPPING_ID, TENANT_A, MappingStatus.ACTIVE, PaymentStatus.APPROVED, 1, 1, 0);

        when(scheduleRepository.findRecoveryCandidates(anyCollection(), any(Pageable.class)))
                .thenReturn(List.of(completed));
        when(mappingRepository.findActiveByConsultantAndClient(
                eq(TENANT_A), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(mapping));

        RecoveryResult result = batch.runRecovery();

        assertThat(result.candidates()).isEqualTo(1);
        assertThat(result.success()).isEqualTo(1);
        assertThat(result.skipped()).isZero();
        assertThat(result.alerted()).isZero();
        verify(scheduleService).useSessionForSpecificMapping(
                eq(TENANT_A), eq(MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), eq(completed));
        verify(alertRepository, never()).save(any(SessionRecoveryAlert.class));
    }

    @Test
    @DisplayName("케이스 B: 후보 일정 없음 → no-op")
    void caseB_noCandidates_noOp() {
        when(scheduleRepository.findRecoveryCandidates(anyCollection(), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        RecoveryResult result = batch.runRecovery();

        assertThat(result.candidates()).isZero();
        assertThat(result.success()).isZero();
        verify(scheduleService, never()).useSessionForSpecificMapping(
                anyString(), anyLong(), anyLong(), anyLong(), any(Schedule.class));
        verify(alertRepository, never()).save(any(SessionRecoveryAlert.class));
    }

    @Test
    @DisplayName("케이스 C: 매핑 SESSIONS_EXHAUSTED + 미차감 일정 1건 → alert 적재 + 차감 시도 X")
    void caseC_remainingZero_savesAlert_noDeduction() {
        Schedule schedule = buildSchedule(200L, TENANT_A, ScheduleStatus.COMPLETED);
        ConsultantClientMapping exhausted = buildMapping(
                MAPPING_ID, TENANT_A, MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10, 0, 10);

        when(scheduleRepository.findRecoveryCandidates(anyCollection(), any(Pageable.class)))
                .thenReturn(List.of(schedule));
        when(mappingRepository.findActiveByConsultantAndClient(
                eq(TENANT_A), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(exhausted));
        when(alertRepository.existsUnresolvedByTenantIdAndScheduleId(eq(TENANT_A), eq(200L)))
                .thenReturn(false);

        RecoveryResult result = batch.runRecovery();

        assertThat(result.candidates()).isEqualTo(1);
        assertThat(result.success()).isZero();
        assertThat(result.alerted()).isEqualTo(1);
        verify(scheduleService, never()).useSessionForSpecificMapping(
                anyString(), anyLong(), anyLong(), anyLong(), any(Schedule.class));
        ArgumentCaptor<SessionRecoveryAlert> alertCaptor =
                ArgumentCaptor.forClass(SessionRecoveryAlert.class);
        verify(alertRepository).save(alertCaptor.capture());
        SessionRecoveryAlert saved = alertCaptor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(TENANT_A);
        assertThat(saved.getScheduleId()).isEqualTo(200L);
        assertThat(saved.getMappingId()).isEqualTo(MAPPING_ID);
        assertThat(saved.getReason()).isEqualTo(SessionRecoveryAlert.REASON_REMAINING_SESSIONS_ZERO);
    }

    @Test
    @DisplayName("케이스 C-2: 활성 매핑 없음 → ACTIVE_MAPPING_NOT_FOUND alert 적재")
    void caseC2_noActiveMapping_savesAlert() {
        Schedule schedule = buildSchedule(201L, TENANT_A, ScheduleStatus.COMPLETED);

        when(scheduleRepository.findRecoveryCandidates(anyCollection(), any(Pageable.class)))
                .thenReturn(List.of(schedule));
        when(mappingRepository.findActiveByConsultantAndClient(
                eq(TENANT_A), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.empty());
        when(alertRepository.existsUnresolvedByTenantIdAndScheduleId(eq(TENANT_A), eq(201L)))
                .thenReturn(false);

        RecoveryResult result = batch.runRecovery();

        assertThat(result.alerted()).isEqualTo(1);
        ArgumentCaptor<SessionRecoveryAlert> alertCaptor =
                ArgumentCaptor.forClass(SessionRecoveryAlert.class);
        verify(alertRepository).save(alertCaptor.capture());
        assertThat(alertCaptor.getValue().getReason())
                .isEqualTo(SessionRecoveryAlert.REASON_ACTIVE_MAPPING_NOT_FOUND);
        assertThat(alertCaptor.getValue().getMappingId()).isNull();
    }

    @Test
    @DisplayName("케이스 D: 동시성 — sessionSequence 이미 채워진 일정은 멱등 skip")
    void caseD_alreadyDeducted_isIdempotentSkip() {
        Schedule alreadyDeducted = buildSchedule(300L, TENANT_A, ScheduleStatus.COMPLETED);
        alreadyDeducted.setSessionSequence(1);

        when(scheduleRepository.findRecoveryCandidates(anyCollection(), any(Pageable.class)))
                .thenReturn(List.of(alreadyDeducted));

        RecoveryResult result = batch.runRecovery();

        assertThat(result.candidates()).isEqualTo(1);
        assertThat(result.skipped()).isEqualTo(1);
        assertThat(result.success()).isZero();
        verify(scheduleService, never()).useSessionForSpecificMapping(
                anyString(), anyLong(), anyLong(), anyLong(), any(Schedule.class));
    }

    @Test
    @DisplayName("케이스 E: 멀티테넌트 — 각 일정의 tenantId 로 매핑 조회 (다른 테넌트 처리 격리)")
    void caseE_multiTenant_perScheduleTenantContext() {
        Schedule s1 = buildSchedule(401L, TENANT_A, ScheduleStatus.COMPLETED);
        Schedule s2 = buildSchedule(402L, TENANT_B, ScheduleStatus.COMPLETED);

        ConsultantClientMapping mappingA = buildMapping(
                501L, TENANT_A, MappingStatus.ACTIVE, PaymentStatus.APPROVED, 5, 3, 2);
        ConsultantClientMapping mappingB = buildMapping(
                502L, TENANT_B, MappingStatus.ACTIVE, PaymentStatus.APPROVED, 8, 1, 7);

        when(scheduleRepository.findRecoveryCandidates(anyCollection(), any(Pageable.class)))
                .thenReturn(List.of(s1, s2));
        when(mappingRepository.findActiveByConsultantAndClient(
                eq(TENANT_A), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(mappingA));
        when(mappingRepository.findActiveByConsultantAndClient(
                eq(TENANT_B), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(mappingB));

        RecoveryResult result = batch.runRecovery();

        assertThat(result.candidates()).isEqualTo(2);
        assertThat(result.success()).isEqualTo(2);
        verify(scheduleService).useSessionForSpecificMapping(
                eq(TENANT_A), eq(501L), eq(CONSULTANT_ID), eq(CLIENT_ID), eq(s1));
        verify(scheduleService).useSessionForSpecificMapping(
                eq(TENANT_B), eq(502L), eq(CONSULTANT_ID), eq(CLIENT_ID), eq(s2));
    }

    @Test
    @DisplayName("멱등 alert: 동일 schedule 미해결 알림 이미 있으면 중복 적재하지 않음")
    void alertSavedOnlyOnce_perScheduleUnresolved() {
        Schedule s = buildSchedule(500L, TENANT_A, ScheduleStatus.COMPLETED);
        when(scheduleRepository.findRecoveryCandidates(anyCollection(), any(Pageable.class)))
                .thenReturn(List.of(s));
        when(mappingRepository.findActiveByConsultantAndClient(
                eq(TENANT_A), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.empty());
        when(alertRepository.existsUnresolvedByTenantIdAndScheduleId(eq(TENANT_A), eq(500L)))
                .thenReturn(true);

        RecoveryResult result = batch.runRecovery();

        assertThat(result.alerted()).isEqualTo(1);
        verify(alertRepository, never()).save(any(SessionRecoveryAlert.class));
    }

    @Test
    @DisplayName("useSessionForSpecificMapping 가 IllegalStateException 던지면 MAPPING_STATUS_INVALID alert 적재")
    void mappingStatusGuardViolation_savesAlert() {
        Schedule s = buildSchedule(600L, TENANT_A, ScheduleStatus.COMPLETED);
        ConsultantClientMapping mapping = buildMapping(
                MAPPING_ID, TENANT_A, MappingStatus.ACTIVE, PaymentStatus.APPROVED, 5, 3, 2);

        when(scheduleRepository.findRecoveryCandidates(anyCollection(), any(Pageable.class)))
                .thenReturn(List.of(s));
        when(mappingRepository.findActiveByConsultantAndClient(
                eq(TENANT_A), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(mapping));
        doThrow(new IllegalStateException("매핑 status 가드 위반"))
                .when(scheduleService).useSessionForSpecificMapping(
                        anyString(), anyLong(), anyLong(), anyLong(), any(Schedule.class));
        when(alertRepository.existsUnresolvedByTenantIdAndScheduleId(eq(TENANT_A), eq(600L)))
                .thenReturn(false);

        RecoveryResult result = batch.runRecovery();

        assertThat(result.alerted()).isEqualTo(1);
        assertThat(result.success()).isZero();
        ArgumentCaptor<SessionRecoveryAlert> captor =
                ArgumentCaptor.forClass(SessionRecoveryAlert.class);
        verify(alertRepository).save(captor.capture());
        assertThat(captor.getValue().getReason())
                .isEqualTo(SessionRecoveryAlert.REASON_MAPPING_STATUS_INVALID);
    }
}
