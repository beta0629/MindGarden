package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 매핑 회차를 날짜순으로 다시 매길 때 차감 횟수·다른 매핑·과거 이동 금지가 유지되는지.
 *
 * @author MindGarden
 * @since 2026-10-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl 회차 날짜순 재정렬")
class ScheduleServiceImplSessionSequenceReorderTest {

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private TenantAccessControlService accessControlService;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private com.coresolution.consultation.repository.UserRepository userRepository;
    @Mock
    private com.coresolution.consultation.repository.VacationRepository vacationRepository;
    @Mock
    private com.coresolution.consultation.repository.BranchRepository branchRepository;
    @Mock
    private com.coresolution.consultation.service.CommonCodeService commonCodeService;
    @Mock
    private com.coresolution.consultation.service.ConsultantAvailabilityService consultantAvailabilityService;
    @Mock
    private SessionSyncService sessionSyncService;
    @Mock
    private com.coresolution.consultation.service.StatisticsService statisticsService;
    @Mock
    private com.coresolution.consultation.service.ConsultationMessageService consultationMessageService;
    @Mock
    private com.coresolution.core.service.DashboardIntegrationService dashboardIntegrationService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private com.coresolution.consultation.service.MobilePushDispatchService mobilePushDispatchService;
    @Mock
    private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock
    private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @Mock
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock
    private ConsultationRecordRepository consultationRecordRepository;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    private String tenantId;
    private Long mappingId;
    private Long consultantId;
    private Long clientId;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-reorder-" + UUID.randomUUID();
        mappingId = nextId();
        consultantId = nextId();
        clientId = nextId();
        today = LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL);
        TenantContextHolder.setTenantId(tenantId);
        ReflectionTestUtils.setField(scheduleService, "consultationRecordRepository", consultationRecordRepository);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("취소로 비운 번호 — 이른 완료가 1, 나중 예약이 2. 차감 횟수는 재정렬만으로 안 변한다")
    void reorder_invertedSequences_followDateWithoutChangingUsage() {
        ConsultantClientMapping mapping = activeMapping(10, 2, 8);
        Schedule completed = schedule(nextId(), ScheduleStatus.COMPLETED, 2, today.minusDays(2), LocalTime.of(10, 0));
        Schedule booked = schedule(nextId(), ScheduleStatus.BOOKED, 1, today.plusDays(1), LocalTime.of(19, 0));
        ConsultationRecord record = record(completed.getId(), 2);

        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(tenantId), eq(mappingId), eq(consultantId), eq(clientId),
                eq(ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())))
                .thenReturn(List.of(booked, completed));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(consultationRecordRepository.findByTenantIdAndConsultationIdAndIsDeletedFalse(
                eq(tenantId), any()))
                .thenAnswer(inv -> completed.getId().equals(inv.getArgument(1))
                        ? List.of(record)
                        : List.of());
        when(consultationRecordRepository.save(any(ConsultationRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        Integer focusSequence = scheduleService.reorderOccupyingSessionSequences(mapping, null);

        assertThat(focusSequence).isNull();
        assertThat(completed.getSessionSequence()).isEqualTo(1);
        assertThat(booked.getSessionSequence()).isEqualTo(2);
        assertThat(record.getSessionNumber()).isEqualTo(1);
        assertThat(mapping.getUsedSessions()).isEqualTo(2);
        assertThat(mapping.getRemainingSessions()).isEqualTo(8);
        verify(mappingRepository, never()).save(any());
    }

    @Test
    @DisplayName("취소 — 해당 일정 회차만 비우고 남은 일정은 날짜순. 복원은 1회")
    void cancel_clearsSequenceAndRenumbersSiblingOnce() {
        ConsultantClientMapping mapping = activeMapping(10, 2, 8);
        Schedule completed = schedule(nextId(), ScheduleStatus.COMPLETED, 2, today.minusDays(2), LocalTime.of(10, 0));
        Schedule booked = schedule(nextId(), ScheduleStatus.BOOKED, 1, today.plusDays(1), LocalTime.of(19, 0));

        when(scheduleRepository.findByTenantIdAndId(eq(tenantId), eq(booked.getId())))
                .thenReturn(Optional.of(booked));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(tenantId), eq(mappingId), eq(consultantId), eq(clientId),
                eq(ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())))
                .thenReturn(List.of(completed, booked));

        Schedule cancelled = scheduleService.cancelSchedule(booked.getId(), "일정 취소");

        assertThat(cancelled.getSessionSequence()).isNull();
        assertThat(cancelled.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(completed.getSessionSequence()).isEqualTo(1);
        assertThat(mapping.getUsedSessions()).isEqualTo(1);
        assertThat(mapping.getRemainingSessions()).isEqualTo(9);
    }

    @Test
    @DisplayName("이동 — 날짜를 앞으로 당기면 회차가 앞선다. 가예약 재등록 차단 조회는 하지 않는다")
    void move_reordersByNewDateWithoutProvisionalReregistrationGuard() {
        ConsultantClientMapping mapping = activeMapping(10, 2, 8);
        Schedule earlier = schedule(10L, ScheduleStatus.BOOKED, 1, today.plusDays(2), LocalTime.of(10, 0));
        Schedule later = schedule(11L, ScheduleStatus.BOOKED, 2, today.plusDays(5), LocalTime.of(19, 0));

        when(scheduleRepository.findByTenantIdAndId(eq(tenantId), eq(later.getId())))
                .thenReturn(Optional.of(later));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(tenantId), eq(mappingId), eq(consultantId), eq(clientId),
                eq(ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())))
                .thenReturn(List.of(earlier, later));

        Schedule patch = new Schedule();
        patch.setDate(today.plusDays(1));
        patch.setStartTime(LocalTime.of(9, 0));
        patch.setEndTime(LocalTime.of(9, 50));
        // Schedule 생성자는 status 를 AVAILABLE 로 둔다. 복사되면 점유 상태가 아니게 되어 재정렬이 빠진다.
        patch.setStatus(ScheduleStatus.BOOKED);

        scheduleService.updateSchedule(later.getId(), patch);

        assertThat(later.getDate()).isEqualTo(today.plusDays(1));
        assertThat(later.getSessionSequence()).isEqualTo(1);
        assertThat(earlier.getSessionSequence()).isEqualTo(2);
        assertThat(mapping.getUsedSessions()).isEqualTo(2);
        assertThat(mapping.getRemainingSessions()).isEqualTo(8);
        verify(mappingRepository, never()).save(any());
        verify(scheduleRepository, never()).countOccupyingConsultationSchedulesForMapping(
                any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("과거 일정 이동은 거부되고 회차는 그대로다")
    void move_pastSchedule_rejectedAndSequenceUnchanged() {
        Schedule past = schedule(80L, ScheduleStatus.BOOKED, 4, today.minusDays(1), LocalTime.of(10, 0));
        when(scheduleRepository.findByTenantIdAndId(eq(tenantId), eq(past.getId())))
                .thenReturn(Optional.of(past));

        Schedule patch = new Schedule();
        patch.setDate(today.plusDays(3));
        patch.setStartTime(LocalTime.of(11, 0));
        patch.setEndTime(LocalTime.of(11, 50));

        assertThatThrownBy(() -> scheduleService.updateSchedule(past.getId(), patch))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_SCHEDULE_MOVE_FROM_PAST);
        assertThat(past.getSessionSequence()).isEqualTo(4);
        assertThat(past.getDate()).isEqualTo(today.minusDays(1));
        verify(scheduleRepository, never()).findDeductedConsultationSchedulesForMapping(
                any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("가예약 — 더 이른 일정에 번호를 줘도 잔여·사용 회기는 그대로")
    void provisional_assignsByDateWithoutDeduction() {
        ConsultantClientMapping mapping = activeMapping(4, 0, 0);
        mapping.setStatus(MappingStatus.PENDING_PAYMENT);
        mapping.setPaymentTiming(PaymentTimingConstants.SAME_DAY_CARD);
        Schedule later = schedule(70L, ScheduleStatus.BOOKED, 1, today.plusDays(4), LocalTime.of(19, 0));
        Schedule earlier = schedule(71L, ScheduleStatus.BOOKED, null, today.plusDays(1), LocalTime.of(10, 0));

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(tenantId), eq(mappingId), eq(consultantId), eq(clientId),
                eq(ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())))
                .thenReturn(List.of(later));

        boolean granted = scheduleService.assignProvisionalSessionSequenceWithoutDeduction(earlier);

        assertThat(granted).isTrue();
        assertThat(earlier.getSessionSequence()).isEqualTo(1);
        assertThat(later.getSessionSequence()).isEqualTo(2);
        assertThat(mapping.getUsedSessions()).isZero();
        assertThat(mapping.getRemainingSessions()).isZero();
        verify(mappingRepository, never()).save(any());
    }

    @Test
    @DisplayName("다른 매핑 일정의 회차는 바꾸지 않는다")
    void reorder_leavesOtherMappingUntouched() {
        ConsultantClientMapping mapping = activeMapping(10, 1, 9);
        Schedule mine = schedule(1L, ScheduleStatus.COMPLETED, 3, today.minusDays(1), LocalTime.of(10, 0));
        Schedule other = schedule(99L, ScheduleStatus.COMPLETED, 7, today.minusDays(3), LocalTime.of(9, 0));
        other.setMappingId(mappingId + 1);

        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(tenantId), eq(mappingId), eq(consultantId), eq(clientId),
                eq(ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())))
                .thenReturn(List.of(mine));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.reorderOccupyingSessionSequences(mapping, null);

        assertThat(mine.getSessionSequence()).isEqualTo(1);
        assertThat(other.getSessionSequence()).isEqualTo(7);
    }

    @Test
    @DisplayName("총 회기를 넘는 신규 차감 회차는 거절하고 사용 회기를 올리지 않는다")
    void deduction_overTotal_doesNotConsumeSession() {
        ConsultantClientMapping mapping = activeMapping(1, 0, 1);
        Schedule existing = schedule(1L, ScheduleStatus.COMPLETED, 1, today.minusDays(1), LocalTime.of(10, 0));
        Schedule extra = schedule(2L, ScheduleStatus.BOOKED, null, today.plusDays(1), LocalTime.of(10, 0));

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(tenantId), eq(mappingId), eq(consultantId), eq(clientId),
                eq(ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())))
                .thenReturn(List.of(existing));

        assertThatThrownBy(() -> scheduleService.useSessionForSpecificMapping(
                tenantId, mappingId, consultantId, clientId, extra))
                .isInstanceOf(IllegalStateException.class);
        assertThat(mapping.getUsedSessions()).isZero();
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);
        assertThat(existing.getSessionSequence()).isEqualTo(1);
        assertThat(extra.getSessionSequence()).isNull();
        verify(mappingRepository, never()).save(any());
    }

    private ConsultantClientMapping activeMapping(int total, int used, int remaining) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTenantId(tenantId);
        mapping.setConsultant(user(consultantId));
        mapping.setClient(user(clientId));
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        mapping.setStatus(MappingStatus.ACTIVE);
        return mapping;
    }

    private Schedule schedule(Long id, ScheduleStatus status, Integer sequence, LocalDate date, LocalTime start) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setTenantId(tenantId);
        schedule.setStatus(status);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setMappingId(mappingId);
        schedule.setSessionSequence(sequence);
        schedule.setDate(date);
        schedule.setStartTime(start);
        schedule.setEndTime(start == null ? null : start.plusMinutes(50));
        schedule.setIsDeleted(false);
        return schedule;
    }

    private static ConsultationRecord record(Long scheduleId, int sessionNumber) {
        ConsultationRecord record = new ConsultationRecord();
        record.setId(scheduleId + 1000);
        record.setConsultationId(scheduleId);
        record.setSessionNumber(sessionNumber);
        record.setIsDeleted(false);
        return record;
    }

    private static User user(Long id) {
        User user = new User();
        user.setId(id);
        return user;
    }

    private static long nextId() {
        return ThreadLocalRandom.current().nextLong(1_000L, 1_000_000_000L);
    }
}
