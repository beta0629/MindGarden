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
 * paid 회기 차감 경로의 sessionSequence 유일성(가용 순번) 단위 테스트.
 *
 * <p>cancel→rebook 시 카운터식({@code total-rem+1})만 쓰면 형제 CONFIRMED가 유지한 순번과
 * 충돌할 수 있다. 점유 집합 기준 다음 가용 순번 부여를 검증한다.</p>
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
    @DisplayName("cancel 후 rebook — 형제 CONFIRMED seq=6이 있으면 신규는 6이 아닌 가용 순번")
    void cancelThenRebook_skipsOccupiedSequenceSix() {
        // given: 총 10회, rem 기준으로 카운터식이 6을 내더라도(used=5, rem=5) 형제 CONFIRMED가 6 점유
        User consultant = user(consultantId);
        User client = user(clientId);

        Schedule confirmedSix = consultationSchedule(nextId(), ScheduleStatus.CONFIRMED, 6);
        Schedule cancelledFive = consultationSchedule(nextId(), ScheduleStatus.CANCELLED, null);

        Schedule rebook = consultationSchedule(nextId(), ScheduleStatus.BOOKED, null);

        ConsultantClientMapping mapping = activeMapping(10, 5, 5, consultant, client);

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(tenantId), eq(mappingId), eq(consultantId), eq(clientId),
                eq(ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())))
                .thenReturn(List.of(confirmedSix, cancelledFive));

        // when
        scheduleService.useSessionForSpecificMapping(
                tenantId, mappingId, consultantId, clientId, rebook);

        // then: 가용 최소 순번 1.. 중 6 제외 → 1 (CANCELLED는 점유 아님)
        assertThat(rebook.getSessionSequence()).isEqualTo(1);
        assertThat(rebook.getSessionSequence()).isNotEqualTo(6);
        assertThat(rebook.getMappingId()).isEqualTo(mappingId);
        assertThat(confirmedSix.getSessionSequence()).isEqualTo(6);
        assertThat(mapping.getRemainingSessions()).isEqualTo(4);
        assertThat(mapping.getUsedSessions()).isEqualTo(6);

        ArgumentCaptor<Schedule> scheduleCaptor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository, atLeastOnce()).save(scheduleCaptor.capture());
        assertThat(scheduleCaptor.getAllValues())
                .anySatisfy(s -> assertThat(s.getSessionSequence()).isEqualTo(1));
    }

    @Test
    @DisplayName("두 활성 일정이 동일 seq=6을 가질 수 없음 — rem 카운터식이 6이어도 점유 회피")
    void twoActiveSchedules_cannotBothReceiveSequenceSix() {
        User consultant = user(consultantId);
        User client = user(clientId);

        Schedule existingConfirmed = consultationSchedule(nextId(), ScheduleStatus.CONFIRMED, 6);
        Schedule newBooked = consultationSchedule(nextId(), ScheduleStatus.BOOKED, null);

        // total=10, rem=5 → 구 카운터식 = 6. 이미 6이 점유되면 신규는 다른 값.
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

        assertThat(newBooked.getSessionSequence()).isNotNull();
        assertThat(newBooked.getSessionSequence()).isNotEqualTo(6);
        assertThat(existingConfirmed.getSessionSequence()).isEqualTo(6);
        assertThat(newBooked.getSessionSequence()).isEqualTo(1);
    }

    @Test
    @DisplayName("seq 1~5 점유 + 6 빈자리 — rem 복원 후 재예약은 가용 5 또는 6이 아닌 빈 순번 중 최소")
    void rebookAfterCancelSeqFive_assignsLowestGapNotOccupiedSix() {
        User consultant = user(consultantId);
        User client = user(clientId);

        Schedule seq1 = consultationSchedule(nextId(), ScheduleStatus.COMPLETED, 1);
        Schedule seq2 = consultationSchedule(nextId(), ScheduleStatus.COMPLETED, 2);
        Schedule seq3 = consultationSchedule(nextId(), ScheduleStatus.COMPLETED, 3);
        Schedule seq4 = consultationSchedule(nextId(), ScheduleStatus.COMPLETED, 4);
        Schedule confirmedSix = consultationSchedule(nextId(), ScheduleStatus.CONFIRMED, 6);
        // BOOKED seq=5 취소됨 → seq null, rem 복원됨. 점유 조회에는 포함되지 않음(CANCELLED/seq null).

        Schedule rebook = consultationSchedule(nextId(), ScheduleStatus.BOOKED, null);

        // 취소 복원 후: used=5, rem=5 → 구 카운터식=6(충돌). 가용 gap=5.
        ConsultantClientMapping mapping = activeMapping(10, 5, 5, consultant, client);

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(tenantId), eq(mappingId), eq(consultantId), eq(clientId),
                eq(ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())))
                .thenReturn(List.of(seq1, seq2, seq3, seq4, confirmedSix));

        scheduleService.useSessionForSpecificMapping(
                tenantId, mappingId, consultantId, clientId, rebook);

        assertThat(rebook.getSessionSequence()).isEqualTo(5);
        assertThat(rebook.getSessionSequence()).isNotEqualTo(6);
        assertThat(confirmedSix.getSessionSequence()).isEqualTo(6);
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
