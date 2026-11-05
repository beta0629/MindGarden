package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.MappingStatusConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
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
 * sessionDate 는 Schedule.date 강제,
 * {@code hasConsultationRecordForSchedule} 는 schedule id only SSOT.</p>
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
    @Mock private ConsultantClientMappingRepository mappingRepository;

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
        LocalDate scheduleDate = LocalDate.of(2026, 9, 1);

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
        linked.setDate(scheduleDate);
        linked.setSessionSequence(3);

        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, consultationPk))
                .thenReturn(Optional.empty());
        when(consultationRepository.findByTenantIdAndId(TENANT_ID, consultationPk))
                .thenReturn(Optional.of(consultation));
        when(scheduleRepository.findByTenantIdAndConsultationId(TENANT_ID, consultationPk))
                .thenReturn(List.of(linked));
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, scheduleId))
                .thenReturn(Optional.of(linked));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(consultationRecordAlertService.resolveConsultationRecordAlert(eq(scheduleId), any()))
                .thenReturn(Map.of("success", true));

        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", consultationPk);
        payload.put("clientId", clientId);
        payload.put("consultantId", consultantId);
        payload.put("sessionNumber", 3);
        payload.put("sessionDate", "2026-09-01");
        payload.put("isSessionCompleted", true);

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);

            ConsultationRecord saved = service.createConsultationRecord(payload);

            assertThat(saved.getConsultationId()).isEqualTo(scheduleId);
            assertThat(saved.getSessionDate()).isEqualTo(scheduleDate);
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
        LocalDate scheduleDate = LocalDate.of(2026, 9, 1);

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(clientId);
        schedule.setConsultantId(consultantId);
        schedule.setStatus(ScheduleStatus.COMPLETED);
        schedule.setIsDeleted(false);
        schedule.setDate(scheduleDate);
        schedule.setSessionSequence(2);

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
        payload.put("sessionNumber", 2);
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
    @DisplayName("create: sessionDate 생략 → Schedule.date 저장 (LocalDate.now 금지)")
    void create_omittedSessionDate_usesScheduleDate() {
        Long scheduleId = 900L;
        Long clientId = 20L;
        Long consultantId = 10L;
        LocalDate scheduleDate = LocalDate.of(2026, 9, 1);

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(clientId);
        schedule.setConsultantId(consultantId);
        schedule.setStatus(ScheduleStatus.COMPLETED);
        schedule.setIsDeleted(false);
        schedule.setDate(scheduleDate);
        schedule.setSessionSequence(1);

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
        payload.put("sessionNumber", 1);
        // sessionDate 생략

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            ConsultationRecord saved = service.createConsultationRecord(payload);
            assertThat(saved.getSessionDate()).isEqualTo(scheduleDate);
            assertThat(saved.getSessionDate()).isNotEqualTo(LocalDate.now());
        }
    }

    @Test
    @DisplayName("create: sessionDate 불일치 → Schedule.date 강제")
    void create_mismatchedSessionDate_forcedToScheduleDate() {
        Long scheduleId = 900L;
        Long clientId = 20L;
        Long consultantId = 10L;
        LocalDate scheduleDate = LocalDate.of(2026, 9, 1);

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(clientId);
        schedule.setConsultantId(consultantId);
        schedule.setStatus(ScheduleStatus.COMPLETED);
        schedule.setIsDeleted(false);
        schedule.setDate(scheduleDate);
        schedule.setSessionSequence(4);

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
        payload.put("sessionNumber", 4);
        payload.put("sessionDate", "2026-08-01");

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            ConsultationRecord saved = service.createConsultationRecord(payload);
            assertThat(saved.getSessionDate()).isEqualTo(scheduleDate);
        }
    }

    @Test
    @DisplayName("create: sessionNumber 불일치 vs Schedule.sessionSequence → fail-closed (silent overwrite 금지)")
    void create_sessionNumberMismatchVsScheduleSequence_failClosed() {
        Long scheduleId = 902L;
        Long clientId = 20L;
        Long consultantId = 10L;
        LocalDate scheduleDate = LocalDate.of(2026, 9, 1);
        Integer scheduleSequence = 7;

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(clientId);
        schedule.setConsultantId(consultantId);
        schedule.setStatus(ScheduleStatus.COMPLETED);
        schedule.setIsDeleted(false);
        schedule.setDate(scheduleDate);
        schedule.setSessionSequence(scheduleSequence);

        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, scheduleId))
                .thenReturn(Optional.of(schedule));

        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", scheduleId);
        payload.put("clientId", clientId);
        payload.put("consultantId", consultantId);
        payload.put("sessionNumber", 1);

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            assertThatThrownBy(() -> service.createConsultationRecord(payload))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("sessionSequence");
        }

        verify(consultationRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: sessionNumber 누락 + 일정 회차 있음 → Schedule.sessionSequence 로 저장")
    void create_missingSessionNumber_usesScheduleSequence() {
        Long scheduleId = 904L;
        Long clientId = 20L;
        Long consultantId = 10L;
        Integer scheduleSequence = 7;

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(clientId);
        schedule.setConsultantId(consultantId);
        schedule.setStatus(ScheduleStatus.COMPLETED);
        schedule.setIsDeleted(false);
        schedule.setDate(LocalDate.of(2026, 9, 1));
        schedule.setSessionSequence(scheduleSequence);

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

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            ConsultationRecord saved = service.createConsultationRecord(payload);
            assertThat(saved.getSessionNumber()).isEqualTo(scheduleSequence);
        }
    }

    @Test
    @DisplayName("create: sessionNumber 일치 → Schedule.sessionSequence 로 저장")
    void create_matchingSessionNumber_persistsScheduleSequence() {
        Long scheduleId = 905L;
        Long clientId = 20L;
        Long consultantId = 10L;
        Integer scheduleSequence = 7;

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(clientId);
        schedule.setConsultantId(consultantId);
        schedule.setStatus(ScheduleStatus.COMPLETED);
        schedule.setIsDeleted(false);
        schedule.setDate(LocalDate.of(2026, 9, 1));
        schedule.setSessionSequence(scheduleSequence);

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
        payload.put("sessionNumber", scheduleSequence);

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            ConsultationRecord saved = service.createConsultationRecord(payload);
            assertThat(saved.getSessionNumber()).isEqualTo(scheduleSequence);
            assertThat(saved.getConsultationId()).isEqualTo(scheduleId);
        }
    }

    @Test
    @DisplayName("create: sessionSequence null → fail-closed")
    void create_nullSessionSequence_failClosed() {
        Long scheduleId = 903L;
        Long clientId = 20L;
        Long consultantId = 10L;

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(clientId);
        schedule.setConsultantId(consultantId);
        schedule.setStatus(ScheduleStatus.COMPLETED);
        schedule.setIsDeleted(false);
        schedule.setDate(LocalDate.of(2026, 9, 1));
        schedule.setSessionSequence(null);

        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, scheduleId))
                .thenReturn(Optional.of(schedule));

        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", scheduleId);
        payload.put("clientId", clientId);
        payload.put("consultantId", consultantId);
        payload.put("sessionNumber", 1);

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            assertThatThrownBy(() -> service.createConsultationRecord(payload))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("sessionSequence");
        }
    }

    @Test
    @DisplayName("create: 가예약 SAME_DAY_CARD rem=0 + sessionNumber 누락 → 회차 부여, remaining 미차감")
    void create_provisionalSameDayCardRemZero_grantsSequenceWithoutDeduction() {
        Long scheduleId = 9101L;
        Long mappingId = 8101L;
        Long clientId = 220L;
        Long consultantId = 110L;

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(clientId);
        schedule.setConsultantId(consultantId);
        schedule.setStatus(ScheduleStatus.CONFIRMED);
        schedule.setIsDeleted(false);
        schedule.setDate(LocalDate.of(2026, 9, 14));
        schedule.setSessionSequence(null);
        schedule.setMappingId(mappingId);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTenantId(TENANT_ID);
        mapping.setStatus(MappingStatus.PENDING_PAYMENT);
        mapping.setPaymentTiming(MappingStatusConstants.PAYMENT_TIMING_SAME_DAY_CARD);
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);
        mapping.setTotalSessions(1);

        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, scheduleId))
                .thenReturn(Optional.of(schedule));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, mappingId))
                .thenReturn(Optional.of(mapping));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(consultationRecordAlertService.resolveConsultationRecordAlert(eq(scheduleId), any()))
                .thenReturn(Map.of("success", true));

        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", scheduleId);
        payload.put("clientId", clientId);
        payload.put("consultantId", consultantId);

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            ConsultationRecord saved = service.createConsultationRecord(payload);
            assertThat(saved.getSessionNumber()).isEqualTo(1);
            assertThat(schedule.getSessionSequence()).isEqualTo(1);
            assertThat(mapping.getRemainingSessions()).isZero();
            assertThat(mapping.getUsedSessions()).isZero();
        }

        verify(mappingRepository, never()).save(any());
        ArgumentCaptor<Schedule> scheduleCaptor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(scheduleCaptor.capture());
        assertThat(scheduleCaptor.getValue().getSessionSequence()).isEqualTo(1);
    }

    @Test
    @DisplayName("create: 일반 ACTIVE rem=0 + sessionSequence null → 차단, remaining 불변")
    void create_regularActiveRemZero_stillBlocked() {
        Long scheduleId = 910L;
        Long mappingId = 400L;
        Long clientId = 20L;
        Long consultantId = 10L;

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(clientId);
        schedule.setConsultantId(consultantId);
        schedule.setStatus(ScheduleStatus.CONFIRMED);
        schedule.setIsDeleted(false);
        schedule.setDate(LocalDate.of(2026, 9, 14));
        schedule.setSessionSequence(null);
        schedule.setMappingId(mappingId);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTenantId(TENANT_ID);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setPaymentTiming("ADVANCE");
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(10);
        mapping.setTotalSessions(10);

        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, scheduleId))
                .thenReturn(Optional.of(schedule));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, mappingId))
                .thenReturn(Optional.of(mapping));

        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", scheduleId);
        payload.put("clientId", clientId);
        payload.put("consultantId", consultantId);
        payload.put("sessionNumber", 1);

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            assertThatThrownBy(() -> service.createConsultationRecord(payload))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("sessionSequence");
        }

        verify(consultationRecordRepository, never()).save(any());
        verify(mappingRepository, never()).save(any());
        assertThat(mapping.getRemainingSessions()).isZero();
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
        payload.put("sessionNumber", 1);

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
    @DisplayName("update: sessionNumber 누락 → fail-closed")
    void update_missingSessionNumber_failClosed() {
        Long recordId = 370L;
        Long scheduleId = 901L;
        ConsultationRecord existing = new ConsultationRecord();
        existing.setId(recordId);
        existing.setTenantId(TENANT_ID);
        existing.setConsultationId(scheduleId);
        existing.setConsultantId(10L);
        existing.setClientId(20L);
        existing.setSessionNumber(3);
        existing.setIsDeleted(false);

        when(consultationRecordRepository.findByTenantIdAndId(TENANT_ID, recordId))
                .thenReturn(Optional.of(existing));

        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", scheduleId);
        payload.put("clientCondition", "ok");

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            assertThatThrownBy(() -> service.updateConsultationRecord(recordId, payload))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("sessionNumber");
        }

        verify(consultationRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("update: sessionNumber 불일치(레코드) → fail-closed")
    void update_sessionNumberMismatchVsRecord_failClosed() {
        Long recordId = 371L;
        Long scheduleId = 901L;
        ConsultationRecord existing = new ConsultationRecord();
        existing.setId(recordId);
        existing.setTenantId(TENANT_ID);
        existing.setConsultationId(scheduleId);
        existing.setConsultantId(10L);
        existing.setClientId(20L);
        existing.setSessionNumber(3);
        existing.setIsDeleted(false);

        when(consultationRecordRepository.findByTenantIdAndId(TENANT_ID, recordId))
                .thenReturn(Optional.of(existing));

        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", scheduleId);
        payload.put("sessionNumber", 5);

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            assertThatThrownBy(() -> service.updateConsultationRecord(recordId, payload))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("sessionNumber");
        }

        verify(consultationRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("update: sessionNumber 불일치 vs Schedule.sessionSequence → fail-closed")
    void update_sessionNumberMismatchVsScheduleSequence_failClosed() {
        Long recordId = 372L;
        Long scheduleId = 901L;
        ConsultationRecord existing = new ConsultationRecord();
        existing.setId(recordId);
        existing.setTenantId(TENANT_ID);
        existing.setConsultationId(scheduleId);
        existing.setConsultantId(10L);
        existing.setClientId(20L);
        existing.setSessionNumber(5);
        existing.setIsDeleted(false);

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TENANT_ID);
        schedule.setSessionSequence(3);

        when(consultationRecordRepository.findByTenantIdAndId(TENANT_ID, recordId))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, scheduleId))
                .thenReturn(Optional.of(schedule));

        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", scheduleId);
        payload.put("sessionNumber", 5);

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            assertThatThrownBy(() -> service.updateConsultationRecord(recordId, payload))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("sessionSequence");
        }

        verify(consultationRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("update: 동일일자 다른 일정(consultationId) 행은 수정되지 않음")
    void update_wrongConsultationId_siblingSameDayUntouched() {
        Long recordIdA = 381L;
        Long scheduleA = 901L;
        Long scheduleB = 902L;

        ConsultationRecord recordA = new ConsultationRecord();
        recordA.setId(recordIdA);
        recordA.setTenantId(TENANT_ID);
        recordA.setConsultationId(scheduleA);
        recordA.setConsultantId(10L);
        recordA.setClientId(20L);
        recordA.setSessionNumber(1);
        recordA.setIsDeleted(false);

        when(consultationRecordRepository.findByTenantIdAndId(TENANT_ID, recordIdA))
                .thenReturn(Optional.of(recordA));

        Map<String, Object> payloadForB = new HashMap<>();
        payloadForB.put("consultationId", scheduleB);
        payloadForB.put("sessionNumber", 2);
        payloadForB.put("clientCondition", "should-not-apply");

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            assertThatThrownBy(() -> service.updateConsultationRecord(recordIdA, payloadForB))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("consultationId");
        }

        verify(consultationRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("delete: sessionNumber 누락 → fail-closed")
    void delete_missingSessionNumber_failClosed() {
        assertThatThrownBy(() -> service.deleteConsultationRecord(370L, 901L, null))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("sessionNumber");
        verify(consultationRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("delete: consultationId 누락 → fail-closed")
    void delete_missingConsultationId_failClosed() {
        assertThatThrownBy(() -> service.deleteConsultationRecord(370L, null, 1))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("consultationId");
        verify(consultationRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("delete: 동일일자 다른 일정 행은 삭제되지 않음")
    void delete_wrongConsultationId_siblingSameDayUntouched() {
        Long recordIdA = 382L;
        Long scheduleA = 901L;
        Long scheduleB = 902L;

        ConsultationRecord recordA = new ConsultationRecord();
        recordA.setId(recordIdA);
        recordA.setTenantId(TENANT_ID);
        recordA.setConsultationId(scheduleA);
        recordA.setConsultantId(10L);
        recordA.setClientId(20L);
        recordA.setSessionNumber(1);
        recordA.setIsDeleted(false);

        when(consultationRecordRepository.findByTenantIdAndId(TENANT_ID, recordIdA))
                .thenReturn(Optional.of(recordA));

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            assertThatThrownBy(() -> service.deleteConsultationRecord(recordIdA, scheduleB, 2))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("consultationId");
        }

        assertThat(recordA.getIsDeleted()).isFalse();
        verify(consultationRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("delete: sessionNumber 불일치 → fail-closed, 레코드 미삭제")
    void delete_wrongSessionNumber_failClosed() {
        Long recordId = 383L;
        Long scheduleId = 901L;

        ConsultationRecord existing = new ConsultationRecord();
        existing.setId(recordId);
        existing.setTenantId(TENANT_ID);
        existing.setConsultationId(scheduleId);
        existing.setConsultantId(10L);
        existing.setClientId(20L);
        existing.setSessionNumber(3);
        existing.setIsDeleted(false);

        when(consultationRecordRepository.findByTenantIdAndId(TENANT_ID, recordId))
                .thenReturn(Optional.of(existing));

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            assertThatThrownBy(() -> service.deleteConsultationRecord(recordId, scheduleId, 1))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("sessionNumber");
        }

        assertThat(existing.getIsDeleted()).isFalse();
        verify(consultationRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("delete: 일치 시 soft-delete")
    void delete_matchingTarget_softDeletes() {
        Long recordId = 384L;
        Long scheduleId = 901L;
        Integer sessionNumber = 3;

        ConsultationRecord existing = new ConsultationRecord();
        existing.setId(recordId);
        existing.setTenantId(TENANT_ID);
        existing.setConsultationId(scheduleId);
        existing.setConsultantId(10L);
        existing.setClientId(20L);
        existing.setSessionNumber(sessionNumber);
        existing.setIsDeleted(false);

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TENANT_ID);
        schedule.setSessionSequence(sessionNumber);

        when(consultationRecordRepository.findByTenantIdAndId(TENANT_ID, recordId))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, scheduleId))
                .thenReturn(Optional.of(schedule));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            service.deleteConsultationRecord(recordId, scheduleId, sessionNumber);
        }

        assertThat(existing.getIsDeleted()).isTrue();
        verify(consultationRecordRepository).save(existing);
    }

    @Test
    @DisplayName("hasConsultationRecordForSchedule: schedule id only → repository(tenant, scheduleId)")
    void hasRecord_scheduleIdOnly_delegatesToExistsSsot() {
        Long scheduleB = 902L;
        Long consultantId = 10L;
        LocalDate sessionDate = LocalDate.of(2026, 9, 1);

        when(consultationRecordRepository.existsActiveForScheduleSsot(TENANT_ID, scheduleB))
                .thenReturn(false);

        boolean has = service.hasConsultationRecordForSchedule(
                scheduleB, consultantId, sessionDate);

        assertThat(has).isFalse();
        verify(consultationRecordRepository).existsActiveForScheduleSsot(TENANT_ID, scheduleB);
        verify(consultationRecordRepository, never())
                .existsByTenantIdAndConsultationIdAndIsDeletedFalse(any(), any());
        verify(consultationRecordRepository, never())
                .countByTenantIdAndConsultantIdAndSessionDateAndIsDeletedFalse(
                        any(), any(), any());
    }

    @Test
    @DisplayName("hasConsultationRecordForSchedule(A): scheduleId 기준 true")
    void hasRecord_trueWhenExistsForScheduleId() {
        Long scheduleA = 901L;
        when(consultationRecordRepository.existsActiveForScheduleSsot(TENANT_ID, scheduleA))
                .thenReturn(true);

        boolean has = service.hasConsultationRecordForSchedule(
                scheduleA, 10L, LocalDate.of(2026, 9, 1));

        assertThat(has).isTrue();
        verify(consultationRecordRepository).existsActiveForScheduleSsot(TENANT_ID, scheduleA);
    }

    @Test
    @DisplayName("hasConsultationRecordForSchedule: scheduleId null → false")
    void hasRecord_nullScheduleId_false() {
        boolean has = service.hasConsultationRecordForSchedule(
                null, 10L, LocalDate.of(2026, 9, 1));

        assertThat(has).isFalse();
        verify(consultationRecordRepository, never())
                .existsActiveForScheduleSsot(any(), any());
    }
}
