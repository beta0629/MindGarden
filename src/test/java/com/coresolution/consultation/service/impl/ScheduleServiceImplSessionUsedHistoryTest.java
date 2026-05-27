package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.MappingHistoryEventType;
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
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
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
 * 옵션 B (예약 우선 매칭) — SESSION_USED 이력 wiring 검증.
 *
 * <p>합의서 §3.e (`docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md`):
 * 회기 차감 직후 동일 트랜잭션 안에서 {@code consultant_client_mapping_history.SESSION_USED}
 * row 1건이 기록되어야 한다.
 *
 * <p>검증 지점:
 * <ul>
 *   <li>가예약 확정 경로 ({@code useSessionForSpecificMapping}) — finalizeTentativeSchedulesAfterDepositConfirmed 진입</li>
 *   <li>일반 차감 경로 ({@code useSessionForMapping}) — 일반 BOOKED 일정 생성 시</li>
 * </ul>
 *
 * <p>before/after JSON 스냅샷은 핵심 필드(remainingSessions, usedSessions, totalSessions, status)만 캡처한다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl SESSION_USED 이력 wiring (옵션 B)")
class ScheduleServiceImplSessionUsedHistoryTest {

    private static final String TENANT_ID = "tenant-session-used-history";
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
    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock private PlSqlScheduleValidationService plSqlScheduleValidationService;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private NotificationService notificationService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private MobilePushDispatchService mobilePushDispatchService;
    @Mock private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private ConsultantClientMappingHistoryService consultantClientMappingHistoryService;

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
    @DisplayName("가예약 확정 경로: SESSION_USED 이력 1건 기록 + before/after 스냅샷에 회기 카운터 포함")
    void finalizeTentative_recordsSessionUsedHistoryWithSnapshots() {
        User consultant = new User();
        consultant.setId(CONSULTANT_USER_ID);
        User client = new User();
        client.setId(CLIENT_USER_ID);

        ConsultantClientMapping inputMapping = new ConsultantClientMapping();
        inputMapping.setId(MAPPING_ID);
        inputMapping.setTenantId(TENANT_ID);
        inputMapping.setConsultant(consultant);
        inputMapping.setClient(client);

        Schedule tentative = new Schedule();
        tentative.setId(501L);
        tentative.setTenantId(TENANT_ID);
        tentative.setConsultantId(CONSULTANT_USER_ID);
        tentative.setClientId(CLIENT_USER_ID);
        tentative.setDate(LocalDate.of(2026, 5, 28));
        tentative.setStartTime(LocalTime.of(10, 0));
        tentative.setEndTime(LocalTime.of(10, 50));
        tentative.setStatus(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        tentative.setIsDeleted(false);

        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndStatusAndIsDeletedFalse(
                eq(TENANT_ID), eq(CONSULTANT_USER_ID), eq(CLIENT_USER_ID),
                eq(ScheduleStatus.TENTATIVE_PENDING_PAYMENT)))
                .thenReturn(Collections.singletonList(tentative));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMapping freshMapping = new ConsultantClientMapping();
        freshMapping.setId(MAPPING_ID);
        freshMapping.setTenantId(TENANT_ID);
        freshMapping.setConsultant(consultant);
        freshMapping.setClient(client);
        freshMapping.setStatus(MappingStatus.DEPOSIT_PENDING);
        freshMapping.setTotalSessions(10);
        freshMapping.setRemainingSessions(10);
        freshMapping.setUsedSessions(0);
        freshMapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);

        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(freshMapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.finalizeTentativeSchedulesAfterDepositConfirmed(inputMapping);

        // 차감 결과: remaining 10 → 9, used 0 → 1
        assertThat(freshMapping.getRemainingSessions()).isEqualTo(9);
        assertThat(freshMapping.getUsedSessions()).isEqualTo(1);

        ArgumentCaptor<String> beforeCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> afterCaptor = ArgumentCaptor.forClass(String.class);
        verify(consultantClientMappingHistoryService, times(1)).record(
                eq(TENANT_ID),
                eq(MAPPING_ID),
                eq(CLIENT_USER_ID),
                eq(CONSULTANT_USER_ID),
                eq(MappingHistoryEventType.SESSION_USED),
                beforeCaptor.capture(),
                afterCaptor.capture(),
                eq(null),
                eq("SESSION_USED via schedule 501"));

        String beforeJson = beforeCaptor.getValue();
        String afterJson = afterCaptor.getValue();
        assertThat(beforeJson).contains("\"remainingSessions\":10");
        assertThat(beforeJson).contains("\"usedSessions\":0");
        assertThat(afterJson).contains("\"remainingSessions\":9");
        assertThat(afterJson).contains("\"usedSessions\":1");
        assertThat(afterJson).contains("\"totalSessions\":10");
    }
}
