package com.coresolution.consultation.service.impl;

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
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
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
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 입금 확인 후 가예약(TENTATIVE_PENDING_PAYMENT) 일괄 확정 및 회기 차감 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl 가예약 입금 확정 후 확정")
class ScheduleServiceImplFinalizeTentativeAfterDepositTest {

    private static final String TENANT_ID = "tenant-finalize-1";
    private static final Long MAPPING_ID = 500L;
    private static final Long CONSULTANT_USER_ID = 11L;
    private static final Long CLIENT_USER_ID = 22L;

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private TenantAccessControlService accessControlService;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ConsultantRepository consultantRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VacationRepository vacationRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock
    private SessionSyncService sessionSyncService;
    @Mock
    private StatisticsService statisticsService;
    @Mock
    private ConsultationMessageService consultationMessageService;
    @Mock
    private DashboardIntegrationService dashboardIntegrationService;
    @Mock
    private ConsultationRecordRepository consultationRecordRepository;
    @Mock
    private PlSqlScheduleValidationService plSqlScheduleValidationService;
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private MobilePushDispatchService mobilePushDispatchService;
    @Mock
    private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;

    @Mock
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;

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
    @DisplayName("finalizeTentativeSchedulesAfterDepositConfirmed: 가예약 2건 BOOKED 전환 및 회기 2회 차감·동기화")
    void finalize_twoTentatives_booksAndUsesSessionsTwice() {
        User consultant = new User();
        consultant.setId(CONSULTANT_USER_ID);
        User client = new User();
        client.setId(CLIENT_USER_ID);

        ConsultantClientMapping inputMapping = new ConsultantClientMapping();
        inputMapping.setId(MAPPING_ID);
        inputMapping.setTenantId(TENANT_ID);
        inputMapping.setConsultant(consultant);
        inputMapping.setClient(client);

        Schedule t1 = new Schedule();
        t1.setId(1L);
        t1.setTenantId(TENANT_ID);
        t1.setConsultantId(CONSULTANT_USER_ID);
        t1.setClientId(CLIENT_USER_ID);
        t1.setDate(LocalDate.of(2026, 5, 10));
        t1.setStartTime(LocalTime.of(10, 0));
        t1.setEndTime(LocalTime.of(10, 50));
        t1.setStatus(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        t1.setIsDeleted(false);

        Schedule t2 = new Schedule();
        t2.setId(2L);
        t2.setTenantId(TENANT_ID);
        t2.setConsultantId(CONSULTANT_USER_ID);
        t2.setClientId(CLIENT_USER_ID);
        t2.setDate(LocalDate.of(2026, 5, 11));
        t2.setStartTime(LocalTime.of(14, 0));
        t2.setEndTime(LocalTime.of(14, 50));
        t2.setStatus(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        t2.setIsDeleted(false);

        List<Schedule> tentatives = Arrays.asList(t2, t1);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndStatusAndIsDeletedFalse(
                eq(TENANT_ID), eq(CONSULTANT_USER_ID), eq(CLIENT_USER_ID),
                eq(ScheduleStatus.TENTATIVE_PENDING_PAYMENT)))
                .thenReturn(tentatives);

        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMapping fresh = new ConsultantClientMapping();
        fresh.setId(MAPPING_ID);
        fresh.setTenantId(TENANT_ID);
        fresh.setConsultant(consultant);
        fresh.setClient(client);
        fresh.setStatus(MappingStatus.DEPOSIT_PENDING);
        fresh.setTotalSessions(10);
        fresh.setRemainingSessions(5);
        fresh.setUsedSessions(0);

        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(fresh));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.finalizeTentativeSchedulesAfterDepositConfirmed(inputMapping);

        ArgumentCaptor<Schedule> scheduleCaptor = ArgumentCaptor.forClass(Schedule.class);
        // BOOKED 전환 2회 + persistSessionSequenceBeforeDeduction 저장 2회
        verify(scheduleRepository, times(4)).save(scheduleCaptor.capture());
        assertThat(scheduleCaptor.getAllValues()).allMatch(s -> s.getStatus() == ScheduleStatus.BOOKED);

        assertThat(t1.getSessionSequence()).isEqualTo(6);
        assertThat(t2.getSessionSequence()).isEqualTo(7);
        assertThat(t1.getMappingId()).isEqualTo(MAPPING_ID);
        assertThat(t2.getMappingId()).isEqualTo(MAPPING_ID);

        assertThat(fresh.getRemainingSessions()).isEqualTo(3);
        assertThat(fresh.getUsedSessions()).isEqualTo(2);

        verify(sessionSyncService, times(2)).syncAfterSessionUsage(
                eq(MAPPING_ID), eq(CONSULTANT_USER_ID), eq(CLIENT_USER_ID));
        verify(mobilePushDispatchService, times(2)).dispatchBookingConfirmed(eq(TENANT_ID), any(Schedule.class));
    }
}
