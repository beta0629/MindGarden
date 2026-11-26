package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.VacationRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantClientMappingHistoryService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.ImmediateReservationSmsDeferralService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.consultation.service.SalaryLateSessionAutoSyncService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListBatchLoader;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.support.ClientEventWriteSupport;
import com.coresolution.consultation.service.ConsultationLogExistenceSsot;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * ScheduleServiceImpl client_event 훅 — 회기 차감 검증·예외 전파(롤백).
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl client_event 훅")
class ScheduleServiceImplClientEventHookTest {

    private static final String TENANT_ID = "tenant-ce-hook";
    private static final Long MAPPING_ID = 700L;
    private static final Long CONSULTANT_USER_ID = 31L;
    private static final Long CLIENT_USER_ID = 42L;

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
    @Mock private ConsultationLogExistenceSsot consultationLogExistenceSsot;
    @Mock private PlSqlScheduleValidationService plSqlScheduleValidationService;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private NotificationService notificationService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private ScheduleListBatchLoader scheduleListBatchLoader;
    @Mock private MobilePushDispatchService mobilePushDispatchService;
    @Mock private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private ConsultantClientMappingHistoryService consultantClientMappingHistoryService;
    @Mock private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @Mock private ImmediateReservationSmsDeferralService immediateReservationSmsDeferralService;
    @Mock private SalaryLateSessionAutoSyncService salaryLateSessionAutoSyncService;
    @Mock private ClientEventWriteSupport clientEventWriteSupport;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        ReflectionTestUtils.setField(scheduleService, "clientEventWriteSupport", clientEventWriteSupport);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("회기 차감 성공 시 SESSION_DEDUCTED + sessions before/after 전달")
    void useSessionForSpecificMapping_recordsSessionDeducted() {
        User consultant = new User();
        consultant.setId(CONSULTANT_USER_ID);
        User client = new User();
        client.setId(CLIENT_USER_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setTenantId(TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(1);
        mapping.setRemainingSessions(9);

        Schedule schedule = new Schedule();
        schedule.setId(501L);
        schedule.setTenantId(TENANT_ID);
        schedule.setConsultantId(CONSULTANT_USER_ID);
        schedule.setClientId(CLIENT_USER_ID);
        schedule.setMappingId(MAPPING_ID);
        schedule.setStatus(ScheduleStatus.BOOKED);

        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findByTenantIdAndMappingIdAndStatusIn(eq(TENANT_ID), eq(MAPPING_ID), any()))
                .thenReturn(Collections.emptyList());

        scheduleService.useSessionForSpecificMapping(
                TENANT_ID, MAPPING_ID, CONSULTANT_USER_ID, CLIENT_USER_ID, schedule);

        verify(clientEventWriteSupport).recordSessionDeducted(
                eq(TENANT_ID),
                eq(CLIENT_USER_ID),
                eq(MAPPING_ID),
                eq(501L),
                eq(9),
                eq(8),
                eq(1),
                eq(2),
                any(),
                any());
    }

    @Test
    @DisplayName("client_event record 실패 시 RuntimeException 전파(삼키지 않음)")
    void useSessionForSpecificMapping_propagatesClientEventFailure() {
        User consultant = new User();
        consultant.setId(CONSULTANT_USER_ID);
        User client = new User();
        client.setId(CLIENT_USER_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setTenantId(TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(0);
        mapping.setRemainingSessions(10);

        Schedule schedule = new Schedule();
        schedule.setId(502L);
        schedule.setTenantId(TENANT_ID);
        schedule.setConsultantId(CONSULTANT_USER_ID);
        schedule.setClientId(CLIENT_USER_ID);
        schedule.setMappingId(MAPPING_ID);
        schedule.setStatus(ScheduleStatus.BOOKED);

        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findByTenantIdAndMappingIdAndStatusIn(eq(TENANT_ID), eq(MAPPING_ID), any()))
                .thenReturn(Collections.emptyList());
        doThrow(new RuntimeException("client_event write failed"))
                .when(clientEventWriteSupport)
                .recordSessionDeducted(
                        any(), anyLong(), anyLong(), anyLong(),
                        any(), any(), any(), any(), any(), any());

        assertThatThrownBy(() -> scheduleService.useSessionForSpecificMapping(
                TENANT_ID, MAPPING_ID, CONSULTANT_USER_ID, CLIENT_USER_ID, schedule))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("client_event write failed");
    }
}
