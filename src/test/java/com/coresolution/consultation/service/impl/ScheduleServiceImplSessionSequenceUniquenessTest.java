package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * paid 회기 차감 경로의 sessionSequence 유일성 단위 테스트.
 *
 * <p>차감은 1회만 하고, 같은 매핑의 점유 회차는 날짜·시작 시각 순 1..N으로 다시 매긴다.
 * 비어 있는 낮은 번호를 나중 일정이 가져가지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-18
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl sessionSequence 유일성")
class ScheduleServiceImplSessionSequenceUniquenessTest {

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

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    private String tenantId;
    private Long mappingId;
    private Long consultantId;
    private Long clientId;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-seq-" + UUID.randomUUID();
        mappingId = nextId();
        consultantId = nextId();
        clientId = nextId();
        TenantContextHolder.setTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("cancel 후 rebook — 더 이른 신규가 1, 늦은 형제는 2. 차감은 1회")
    void cancelThenRebook_ordersByDateNotGap() {
        User consultant = user(consultantId);
        User client = user(clientId);

        Schedule confirmedLater = consultationSchedule(nextId(), ScheduleStatus.CONFIRMED, 6);
        confirmedLater.setDate(LocalDate.of(2026, 12, 1));
        confirmedLater.setStartTime(LocalTime.of(19, 0));
        Schedule cancelled = consultationSchedule(nextId(), ScheduleStatus.CANCELLED, null);

        Schedule rebook = consultationSchedule(nextId(), ScheduleStatus.BOOKED, null);
        rebook.setDate(LocalDate.of(2026, 11, 1));
        rebook.setStartTime(LocalTime.of(10, 0));

        ConsultantClientMapping mapping = activeMapping(10, 5, 5, consultant, client);

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(tenantId), eq(mappingId), eq(consultantId), eq(clientId),
                eq(ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())))
                .thenReturn(List.of(confirmedLater, cancelled));

        scheduleService.useSessionForSpecificMapping(
                tenantId, mappingId, consultantId, clientId, rebook);

        assertThat(rebook.getSessionSequence()).isEqualTo(1);
        assertThat(confirmedLater.getSessionSequence()).isEqualTo(2);
        assertThat(rebook.getMappingId()).isEqualTo(mappingId);
        assertThat(cancelled.getSessionSequence()).isNull();
        assertThat(mapping.getRemainingSessions()).isEqualTo(4);
        assertThat(mapping.getUsedSessions()).isEqualTo(6);

        ArgumentCaptor<Schedule> scheduleCaptor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository, atLeastOnce()).save(scheduleCaptor.capture());
        assertThat(scheduleCaptor.getAllValues())
                .anySatisfy(s -> assertThat(s.getSessionSequence()).isEqualTo(1));
    }

    @Test
    @DisplayName("두 활성 일정은 날짜순으로 서로 다른 회차를 가진다")
    void twoActiveSchedules_receiveDistinctChronologicalSequences() {
        User consultant = user(consultantId);
        User client = user(clientId);

        Schedule existingConfirmed = consultationSchedule(nextId(), ScheduleStatus.CONFIRMED, 6);
        existingConfirmed.setDate(LocalDate.of(2026, 12, 2));
        existingConfirmed.setStartTime(LocalTime.of(11, 0));
        Schedule newBooked = consultationSchedule(nextId(), ScheduleStatus.BOOKED, null);
        newBooked.setDate(LocalDate.of(2026, 11, 2));
        newBooked.setStartTime(LocalTime.of(9, 0));

        ConsultantClientMapping mapping = activeMapping(10, 5, 5, consultant, client);

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(tenantId), eq(mappingId), eq(consultantId), eq(clientId),
                eq(ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())))
                .thenReturn(List.of(existingConfirmed));

        scheduleService.useSessionForSpecificMapping(
                tenantId, mappingId, consultantId, clientId, newBooked);

        assertThat(newBooked.getSessionSequence()).isEqualTo(1);
        assertThat(existingConfirmed.getSessionSequence()).isEqualTo(2);
        assertThat(newBooked.getSessionSequence()).isNotEqualTo(existingConfirmed.getSessionSequence());
        assertThat(mapping.getUsedSessions()).isEqualTo(6);
        assertThat(mapping.getRemainingSessions()).isEqualTo(4);
    }

    @Test
    @DisplayName("취소로 비운 번호 — 나중 일정은 1을 가져가지 않고 날짜순 다음 번호")
    void rebookAfterCancel_laterScheduleFollowsEarlierCompleted() {
        User consultant = user(consultantId);
        User client = user(clientId);

        Schedule completed = consultationSchedule(nextId(), ScheduleStatus.COMPLETED, 2);
        completed.setDate(LocalDate.of(2026, 10, 9));
        completed.setStartTime(LocalTime.of(10, 0));
        Schedule rebook = consultationSchedule(nextId(), ScheduleStatus.BOOKED, null);
        rebook.setDate(LocalDate.of(2026, 10, 12));
        rebook.setStartTime(LocalTime.of(19, 0));

        ConsultantClientMapping mapping = activeMapping(10, 5, 5, consultant, client);

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(tenantId), eq(mappingId), eq(consultantId), eq(clientId),
                eq(ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())))
                .thenReturn(List.of(completed));

        scheduleService.useSessionForSpecificMapping(
                tenantId, mappingId, consultantId, clientId, rebook);

        assertThat(completed.getSessionSequence()).isEqualTo(1);
        assertThat(rebook.getSessionSequence()).isEqualTo(2);
        assertThat(mapping.getUsedSessions()).isEqualTo(6);
        assertThat(mapping.getRemainingSessions()).isEqualTo(4);
    }

    private ConsultantClientMapping activeMapping(
            int total, int used, int remaining, User consultant, User client) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTenantId(tenantId);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        mapping.setStatus(MappingStatus.ACTIVE);
        return mapping;
    }

    private Schedule consultationSchedule(Long id, ScheduleStatus status, Integer sessionSequence) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setTenantId(tenantId);
        schedule.setStatus(status);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setMappingId(mappingId);
        schedule.setSessionSequence(sessionSequence);
        return schedule;
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
