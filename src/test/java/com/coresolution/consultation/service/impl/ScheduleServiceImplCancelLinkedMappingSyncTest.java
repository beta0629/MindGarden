package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * ScheduleServiceImpl — 일정 CANCELLED 전이 시 연결 매칭 동기 취소 회귀 테스트.
 *
 * @author MindGarden
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl 일정 CANCELLED → 매칭 동기 취소")
class ScheduleServiceImplCancelLinkedMappingSyncTest {

    private static final String TENANT_ID = "tenant-schedule-cancel-sync";
    private static final Long SCHEDULE_ID = 501L;
    private static final Long MAPPING_ID = 601L;
    private static final Long CONSULTANT_ID = 11L;
    private static final Long CLIENT_ID = 21L;

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
    private com.coresolution.consultation.service.SessionSyncService sessionSyncService;
    @Mock
    private com.coresolution.consultation.service.StatisticsService statisticsService;
    @Mock
    private com.coresolution.consultation.service.ConsultationMessageService consultationMessageService;
    @Mock
    private com.coresolution.core.service.DashboardIntegrationService dashboardIntegrationService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private com.coresolution.consultation.service.ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock
    private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @Mock
    private com.coresolution.consultation.service.MobilePushDispatchService mobilePushDispatchService;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("cancelSchedule — PENDING_PAYMENT 매칭을 CANCELLED + REJECTED 로 닫는다")
    void cancelSchedule_closesLinkedPendingPaymentMapping() {
        Schedule schedule = buildSchedule(SCHEDULE_ID, MAPPING_ID, ScheduleStatus.BOOKED);
        ConsultantClientMapping mapping = pendingPaymentMapping(MAPPING_ID);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any(LocalDate.class)))
                .thenReturn(List.of(schedule));

        Schedule result = scheduleService.cancelSchedule(SCHEDULE_ID, "캘린더 취소");

        assertThat(result.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.CANCELLED);
        assertThat(mapping.getPaymentStatus()).isEqualTo(PaymentStatus.REJECTED);
        assertThat(mapping.getTerminatedAt()).isNotNull();
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getNotes()).contains("일정 취소로 매칭 동기 취소");
        verify(mappingRepository, atLeastOnce()).save(mapping);
    }

    @Test
    @DisplayName("updateSchedule — CANCELLED 전이 시 PENDING_PAYMENT 매칭 동기 취소")
    void updateSchedule_toCancelled_closesLinkedPendingPaymentMapping() {
        Schedule existing = buildSchedule(SCHEDULE_ID, MAPPING_ID, ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        existing.setTenantId(TENANT_ID);
        ConsultantClientMapping mapping = pendingPaymentMapping(MAPPING_ID);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any(LocalDate.class)))
                .thenReturn(List.of(existing));

        Schedule updateData = new Schedule();
        updateData.setStatus(ScheduleStatus.CANCELLED);

        Schedule result = scheduleService.updateSchedule(SCHEDULE_ID, updateData);

        assertThat(result.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.CANCELLED);
        assertThat(mapping.getPaymentStatus()).isEqualTo(PaymentStatus.REJECTED);
        verify(mappingRepository, atLeastOnce()).save(mapping);
    }

    @Test
    @DisplayName("cancelSchedule — 이미 CANCELLED 매칭이면 예외 없이 멱등 no-op")
    void cancelSchedule_alreadyCancelledMapping_isIdempotent() {
        Schedule schedule = buildSchedule(SCHEDULE_ID, MAPPING_ID, ScheduleStatus.BOOKED);
        ConsultantClientMapping mapping = pendingPaymentMapping(MAPPING_ID);
        mapping.setStatus(MappingStatus.CANCELLED);
        mapping.setPaymentStatus(PaymentStatus.REJECTED);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));

        assertThatCode(() -> scheduleService.cancelSchedule(SCHEDULE_ID, "재취소"))
                .doesNotThrowAnyException();

        // 이미 닫힌 매핑은 재저장하지 않음 (멱등)
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("cancelSchedule — CANCELLED 슬롯은 점유하지 않음 (#913 SSOT 유지)")
    void cancelSchedule_resultIsNotOccupying() {
        Schedule schedule = buildSchedule(SCHEDULE_ID, MAPPING_ID, ScheduleStatus.CONFIRMED);
        ConsultantClientMapping mapping = pendingPaymentMapping(MAPPING_ID);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any(LocalDate.class)))
                .thenReturn(List.of(schedule));

        Schedule result = scheduleService.cancelSchedule(SCHEDULE_ID, "취소");

        assertThat(result.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(result.getStatus().occupiesTimeForConflictCheck()).isFalse();
    }

    private ConsultantClientMapping pendingPaymentMapping(Long mappingId) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        consultant.setTenantId(TENANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        client.setTenantId(TENANT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTenantId(TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(MappingStatus.PENDING_PAYMENT);
        mapping.setPaymentStatus(PaymentStatus.PENDING);
        mapping.setTotalSessions(10);
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);
        return mapping;
    }

    private Schedule buildSchedule(Long id, Long mappingId, ScheduleStatus status) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setTenantId(TENANT_ID);
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);
        schedule.setMappingId(mappingId);
        schedule.setDate(LocalDate.now().plusDays(1));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(status);
        return schedule;
    }
}
