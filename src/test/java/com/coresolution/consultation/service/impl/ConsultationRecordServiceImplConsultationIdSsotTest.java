package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * ConsultationRecordServiceImpl — 상담일지 쓰기/존재 판정 SSOT 회귀.
 *
 * <p>검증: create 시 Consultation.id → linked Schedule.id 정규화,
 * {@code hasConsultationRecordForSchedule} 는 monthly/cumulative/incomplete 와 동일 A|B SSOT
 * (A: scheduleId, B: consultant+client+sessionDate).</p>
 *
 * @author CoreSolution
 * @since 2026-09-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultationRecordServiceImpl — consultationId Schedule SSOT")
class ConsultationRecordServiceImplConsultationIdSsotTest {

    private static final String TENANT_ID = "tenant-record-ssot-1";

    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock private ConsultationRepository consultationRepository;
    @Mock private PlSqlConsultationRecordAlertService consultationRecordAlertService;
    @Mock private ScheduleRepository scheduleRepository;

    @InjectMocks
    private ConsultationRecordServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("create: Consultation.id 입력 → 저장된 consultationId 는 linked schedule.id")
    void create_consultationIdNormalizedToLinkedScheduleId() {
        Long consultationPk = 500L;
        Long scheduleId = 900L;
        Long clientId = 20L;
        Long consultantId = 10L;

        Consultation consultation = new Consultation();
        consultation.setId(consultationPk);
        consultation.setTenantId(TENANT_ID);
        consultation.setClientId(clientId);
        consultation.setConsultantId(consultantId);
        consultation.setStatus("CONFIRMED");

        Schedule linked = new Schedule();
        linked.setId(scheduleId);
        linked.setTenantId(TENANT_ID);
        linked.setClientId(clientId);
        linked.setConsultantId(consultantId);
        linked.setStatus(ScheduleStatus.COMPLETED);
        linked.setIsDeleted(false);
        linked.setConsultationId(consultationPk);

        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, consultationPk))
                .thenReturn(Optional.empty());
        when(consultationRepository.findByTenantIdAndId(TENANT_ID, consultationPk))
                .thenReturn(Optional.of(consultation));
        when(scheduleRepository.findByTenantIdAndConsultationId(TENANT_ID, consultationPk))
                .thenReturn(List.of(linked));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(consultationRecordAlertService.resolveConsultationRecordAlert(eq(scheduleId), any()))
                .thenReturn(Map.of("success", true));

        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", consultationPk);
        payload.put("clientId", clientId);
        payload.put("consultantId", consultantId);
        payload.put("sessionDate", "2026-09-01");
        payload.put("isSessionCompleted", true);

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);

            ConsultationRecord saved = service.createConsultationRecord(payload);

            assertThat(saved.getConsultationId()).isEqualTo(scheduleId);
        }

        ArgumentCaptor<ConsultationRecord> captor = ArgumentCaptor.forClass(ConsultationRecord.class);
        verify(consultationRecordRepository).save(captor.capture());
        assertThat(captor.getValue().getConsultationId()).isEqualTo(scheduleId);
        verify(consultationRecordAlertService)
                .resolveConsultationRecordAlert(eq(scheduleId), any());
    }

    @Test
    @DisplayName("create: Schedule.id 입력 → 그대로 저장")
    void create_scheduleIdKeptAsIs() {
        Long scheduleId = 900L;
        Long clientId = 20L;
        Long consultantId = 10L;

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(clientId);
        schedule.setConsultantId(consultantId);
        schedule.setStatus(ScheduleStatus.COMPLETED);
        schedule.setIsDeleted(false);

        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, scheduleId))
                .thenReturn(Optional.of(schedule));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(consultationRecordAlertService.resolveConsultationRecordAlert(eq(scheduleId), any()))
                .thenReturn(Map.of("success", true));

        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", scheduleId);
        payload.put("clientId", clientId);
        payload.put("consultantId", consultantId);
        payload.put("sessionDate", "2026-09-01");

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            ConsultationRecord saved = service.createConsultationRecord(payload);
            assertThat(saved.getConsultationId()).isEqualTo(scheduleId);
        }

        verify(consultationRepository, never()).findByTenantIdAndId(any(), any());
    }

    @Test
    @DisplayName("create: Consultation 에 링크 스케줄 0건 → 검증 예외")
    void create_consultationWithNoLinkedSchedule_throws() {
        Long consultationPk = 500L;
        Long clientId = 20L;
        Long consultantId = 10L;

        Consultation consultation = new Consultation();
        consultation.setId(consultationPk);
        consultation.setClientId(clientId);
        consultation.setConsultantId(consultantId);
        consultation.setStatus("CONFIRMED");

        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, consultationPk))
                .thenReturn(Optional.empty());
        when(consultationRepository.findByTenantIdAndId(TENANT_ID, consultationPk))
                .thenReturn(Optional.of(consultation));
        when(scheduleRepository.findByTenantIdAndConsultationId(TENANT_ID, consultationPk))
                .thenReturn(Collections.emptyList());

        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", consultationPk);
        payload.put("clientId", clientId);
        payload.put("consultantId", consultantId);

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            assertThatThrownBy(() -> service.createConsultationRecord(payload))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("연결된 일정");
        }
    }

    @Test
    @DisplayName("hasConsultationRecordForSchedule(A): scheduleId 기준 true")
    void hasRecord_trueWhenExistsForScheduleId() {
        Long scheduleA = 901L;
        Long consultantId = 10L;
        LocalDate sessionDate = LocalDate.of(2026, 9, 1);
        Long clientId = 20L;

        Schedule schedule = new Schedule();
        schedule.setId(scheduleA);
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(sessionDate);

        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, scheduleA))
                .thenReturn(Optional.of(schedule));
        when(consultationRecordRepository.existsActiveForSchedulePresence(
                TENANT_ID, scheduleA, consultantId, clientId, sessionDate))
                .thenReturn(true);

        boolean has = service.hasConsultationRecordForSchedule(
                scheduleA, consultantId, sessionDate);

        assertThat(has).isTrue();
        verify(consultationRecordRepository).existsActiveForSchedulePresence(
                TENANT_ID, scheduleA, consultantId, clientId, sessionDate);
        verify(consultationRecordRepository, never())
                .countByTenantIdAndConsultantIdAndSessionDateAndIsDeletedFalse(
                        any(), any(), any());
    }

    @Test
    @DisplayName("hasConsultationRecordForSchedule(B): orphan consultationId + B매칭 → true")
    void hasRecord_trueViaPathBWhenOrphanKeyMatchesConsultantClientDate() {
        Long scheduleId = 902L;
        Long consultantId = 10L;
        Long clientId = 20L;
        LocalDate sessionDate = LocalDate.of(2026, 9, 1);

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(sessionDate);

        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, scheduleId))
                .thenReturn(Optional.of(schedule));
        when(consultationRecordRepository.existsActiveForSchedulePresence(
                TENANT_ID, scheduleId, consultantId, clientId, sessionDate))
                .thenReturn(true);

        boolean has = service.hasConsultationRecordForSchedule(
                scheduleId, consultantId, sessionDate);

        assertThat(has).isTrue();
        verify(consultationRecordRepository).existsActiveForSchedulePresence(
                TENANT_ID, scheduleId, consultantId, clientId, sessionDate);
        verify(consultationRecordRepository, never())
                .countByTenantIdAndConsultantIdAndSessionDateAndIsDeletedFalse(
                        any(), any(), any());
    }

    @Test
    @DisplayName("hasConsultationRecordForSchedule: A·B 모두 없으면 false (날짜 건수 금지)")
    void hasRecord_falseWhenNeitherPathMatches_doesNotUseDateCount() {
        Long scheduleB = 903L;
        Long consultantId = 10L;
        Long clientId = 30L;
        LocalDate sessionDate = LocalDate.of(2026, 9, 1);

        Schedule schedule = new Schedule();
        schedule.setId(scheduleB);
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(sessionDate);

        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, scheduleB))
                .thenReturn(Optional.of(schedule));
        when(consultationRecordRepository.existsActiveForSchedulePresence(
                TENANT_ID, scheduleB, consultantId, clientId, sessionDate))
                .thenReturn(false);

        boolean has = service.hasConsultationRecordForSchedule(
                scheduleB, consultantId, sessionDate);

        assertThat(has).isFalse();
        verify(consultationRecordRepository, never())
                .countByTenantIdAndConsultantIdAndSessionDateAndIsDeletedFalse(
                        any(), any(), any());
    }
}
