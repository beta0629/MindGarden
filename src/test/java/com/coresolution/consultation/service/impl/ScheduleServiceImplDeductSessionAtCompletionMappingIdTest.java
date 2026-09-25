package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.VacationRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantClientMappingHistoryService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
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

/**
 * 완료 시 회기 차감 — 1-session mapping + mappingId 우선 + sessionSequence 멱등.
 *
 * @author CoreSolution
 * @since 2026-09-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl deductSessionAtCompletionIfNeeded mappingId 우선")
class ScheduleServiceImplDeductSessionAtCompletionMappingIdTest {

    @Mock private ScheduleRepository scheduleRepository;
    @Mock private TenantAccessControlService accessControlService;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private ConsultantRepository consultantRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private UserRepository userRepository;
    @Mock private VacationRepository vacationRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private CommonCodeService commonCodeService;
    @Mock private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private SessionSyncService sessionSyncService;
    @Mock private StatisticsService statisticsService;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private DashboardIntegrationService dashboardIntegrationService;
    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock private PlSqlScheduleValidationService plSqlScheduleValidationService;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private NotificationService notificationService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private MobilePushDispatchService mobilePushDispatchService;
    @Mock private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private ConsultantClientMappingHistoryService consultantClientMappingHistoryService;
    @Mock private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    private String tenantId;
    private Long scheduleId;
    private Long mappingId;
    private Long consultantId;
    private Long clientId;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-deduct-map-" + UUID.randomUUID();
        scheduleId = nextId();
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
    @DisplayName("1-session ACTIVE rem=1 + sessionSequence null + mappingId → used/rem/SESSIONS_EXHAUSTED 정합")
    void oneSessionMapping_completedWithoutSequence_deductsViaMappingId() {
        Schedule schedule = consultationWithoutSequence();
        ConsultantClientMapping mapping = oneSessionActiveMapping();

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.deductSessionAtCompletionIfNeeded(schedule);

        ArgumentCaptor<ConsultantClientMapping> captor = ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository).save(captor.capture());
        ConsultantClientMapping saved = captor.getValue();
        assertThat(saved.getRemainingSessions()).isZero();
        assertThat(saved.getUsedSessions()).isEqualTo(1);
        assertThat(saved.getTotalSessions()).isEqualTo(1);
        assertThat(saved.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(schedule.getSessionSequence()).isNotNull();
        assertThat(schedule.getMappingId()).isEqualTo(mappingId);
        // consultant+client 목록 조회 경로를 타지 않음
        verify(mappingRepository, never())
                .findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(any(), any(), any());
    }

    @Test
    @DisplayName("sessionSequence 있으면 leftover 아닌 일반 완료는 rem 불변(멱등)")
    void sessionSequencePresent_regularComplete_idempotent() {
        Schedule schedule = consultationWithoutSequence();
        schedule.setSessionSequence(1);
        ConsultantClientMapping mapping = oneSessionActiveMapping();
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(1);
        mapping.setStatus(MappingStatus.SESSIONS_EXHAUSTED);

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));

        scheduleService.deductSessionAtCompletionIfNeeded(schedule);

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
    }

    @Test
    @DisplayName("단회기 회차만 있고 used=0 remaining=1 이면 일지 완료 시 잔여 0")
    void oneSession_labeledSequence_unconsumed_deductsOnCompletion() {
        Schedule schedule = consultationWithoutSequence();
        schedule.setSessionSequence(1);
        ConsultantClientMapping mapping = oneSessionActiveMapping();

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.deductSessionAtCompletionIfNeeded(schedule);

        ArgumentCaptor<ConsultantClientMapping> captor = ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository).save(captor.capture());
        ConsultantClientMapping saved = captor.getValue();
        assertThat(saved.getRemainingSessions()).isZero();
        assertThat(saved.getUsedSessions()).isEqualTo(1);
        assertThat(saved.getTotalSessions()).isEqualTo(1);
        assertThat(saved.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
    }

    @Test
    @DisplayName("다회기 패키지는 회차가 있어도 완료 시 잔여를 다시 깎지 않는다")
    void multiSession_labeledSequence_doesNotDeductAgain() {
        Schedule schedule = consultationWithoutSequence();
        schedule.setSessionSequence(2);
        ConsultantClientMapping mapping = oneSessionActiveMapping();
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(1);
        mapping.setRemainingSessions(9);

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));

        scheduleService.deductSessionAtCompletionIfNeeded(schedule);

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        assertThat(mapping.getRemainingSessions()).isEqualTo(9);
        assertThat(mapping.getUsedSessions()).isEqualTo(1);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    @Test
    @DisplayName("기관연동 단회기 표기는 일지 완료로 회기 잔여를 깎지 않는다")
    void institutionLink_singleSessionLabel_doesNotDeduct() {
        Schedule schedule = consultationWithoutSequence();
        schedule.setSessionSequence(1);
        ConsultantClientMapping mapping = oneSessionActiveMapping();
        mapping.setPaymentTiming(PaymentTimingConstants.INSTITUTION_LINK);

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));

        scheduleService.deductSessionAtCompletionIfNeeded(schedule);

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);
        assertThat(mapping.getUsedSessions()).isZero();
    }

    private Schedule consultationWithoutSequence() {
        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(tenantId);
        schedule.setStatus(ScheduleStatus.COMPLETED);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setMappingId(mappingId);
        return schedule;
    }

    private ConsultantClientMapping oneSessionActiveMapping() {
        User consultant = new User();
        consultant.setId(consultantId);
        User client = new User();
        client.setId(clientId);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTenantId(tenantId);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setTotalSessions(1);
        mapping.setUsedSessions(0);
        mapping.setRemainingSessions(1);
        return mapping;
    }

    private static long nextId() {
        return ThreadLocalRandom.current().nextLong(1_000L, 9_000_000L);
    }
}
