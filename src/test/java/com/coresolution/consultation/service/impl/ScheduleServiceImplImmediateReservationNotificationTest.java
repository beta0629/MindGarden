package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
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
import com.coresolution.consultation.service.ConsultantClientMappingHistoryService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
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
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@code ScheduleServiceImpl.createConsultantSchedule} 등록 시점의
 * D-2/D-1/D-0 즉시 SMS 발송 + TENTATIVE_PENDING_PAYMENT 즉시 발송 매트릭스 검증.
 *
 * <p>2026-06-04 사용자 정책 SSOT:
 * "스케줄에 등록된 상태면 발송이 되어야 해. D-2, D-1, 당일은 스케줄에 등록이 되면 바로 발송.
 *  알림톡은 사용 안 함, 현장결제도 예약이 취소된 게 아니면 문자 발송."
 *
 * <p>매트릭스:
 * <ul>
 *   <li>BOOKED 다회기 + D-2 → {@code RESERVATION_REMINDER_D2}</li>
 *   <li>BOOKED 다회기 + D-1 → {@code RESERVATION_IMMEDIATE_LATE}</li>
 *   <li>BOOKED 다회기 + D-0 → {@code RESERVATION_IMMEDIATE_LATE}</li>
 *   <li>BOOKED 다회기 + D-3 이상 → 즉시 발송 없음 (09:00 D-2 배치 처리)</li>
 *   <li>BOOKED 단발성({@code totalSessions==1}) → {@code RESERVATION_IMMEDIATE_SINGLE}</li>
 *   <li>TENTATIVE_PENDING_PAYMENT 다회기 + D-2 → {@code RESERVATION_REMINDER_D2}</li>
 *   <li>TENTATIVE + PENDING_PAYMENT(SAME_DAY) 단발성 → {@code RESERVATION_IMMEDIATE_SINGLE}</li>
 *   <li>TENTATIVE + PENDING_PAYMENT 다회기 + D-0/D-1/D-2 → LATE / D2</li>
 *   <li>활성 트랜잭션 동기화가 있으면 afterCommit 이후 디스패치 (TARGET_NOT_FOUND 방지)</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl 즉시 SMS 발송 매트릭스 (2026-06-04 사용자 정책)")
class ScheduleServiceImplImmediateReservationNotificationTest {

    private static final String TENANT_ID = "tenant-sched-imm-" + UUID.randomUUID();
    private static final Long CONSULTANT_ID = 401L;
    private static final Long CLIENT_ID = 402L;
    private static final Long MAPPING_ID = 9101L;
    private static final Long SAVED_SCHEDULE_ID = 7001L;

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
    @Mock
    private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private ConsultantClientMappingHistoryService consultantClientMappingHistoryService;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(commonCodeService.getCodeValue("ROLE", UserRole.CONSULTANT.name())).thenReturn("CONSULTANT");
        when(commonCodeService.getCodeValue("ROLE", UserRole.CLIENT.name())).thenReturn("CLIENT");
        when(commonCodeService.getCodeValue("MESSAGE_TYPE", "APPOINTMENT")).thenReturn("APPOINTMENT");
        when(commonCodeService.getCodeValue("MESSAGE_TYPE", "NEW_APPOINTMENT")).thenReturn("NEW_APPOINTMENT");
        stubConflictCheckAndAutoComplete();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    @DisplayName("D-2 다회기 BOOKED 등록 → RESERVATION_REMINDER_D2 SMS 발송 (09:00 배치와 멱등 키 공유)")
    void createConsultantSchedule_whenD2MultiSession_dispatchesReminderD2() {
        stubMappingMultiSession();
        stubScheduleSave();

        LocalDate dPlus2 = LocalDate.now().plusDays(2);
        scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, dPlus2,
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "상담", "설명", "VIDEO", null, false);

        verify(batchNotificationDispatchService).dispatchReservationReminderD2(SAVED_SCHEDULE_ID);
        verify(batchNotificationDispatchService, never())
            .dispatchReservationImmediateLate(anyLong());
        verify(batchNotificationDispatchService, never())
            .dispatchReservationImmediateSingle(anyLong());
    }

    @Test
    @DisplayName("D-1 다회기 BOOKED 등록 → RESERVATION_IMMEDIATE_LATE SMS 발송")
    void createConsultantSchedule_whenD1MultiSession_dispatchesImmediateLate() {
        stubMappingMultiSession();
        stubScheduleSave();

        LocalDate dPlus1 = LocalDate.now().plusDays(1);
        scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, dPlus1,
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "상담", "설명", "VIDEO", null, false);

        verify(batchNotificationDispatchService).dispatchReservationImmediateLate(SAVED_SCHEDULE_ID);
        verify(batchNotificationDispatchService, never())
            .dispatchReservationReminderD2(anyLong());
    }

    @Test
    @DisplayName("당일(D-0) 다회기 BOOKED 등록 → RESERVATION_IMMEDIATE_LATE SMS 발송")
    void createConsultantSchedule_whenD0MultiSession_dispatchesImmediateLate() {
        stubMappingMultiSession();
        stubScheduleSave();

        scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, LocalDate.now(),
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "상담", "설명", "VIDEO", null, false);

        verify(batchNotificationDispatchService).dispatchReservationImmediateLate(SAVED_SCHEDULE_ID);
        verify(batchNotificationDispatchService, never())
            .dispatchReservationReminderD2(anyLong());
    }

    @Test
    @DisplayName("D-3 이상 다회기 BOOKED 등록 → 즉시 발송 없음 (09:00 D-2 배치 처리)")
    void createConsultantSchedule_whenD3OrLaterMultiSession_doesNotDispatchImmediate() {
        stubMappingMultiSession();
        stubScheduleSave();

        LocalDate dPlus5 = LocalDate.now().plusDays(5);
        scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, dPlus5,
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "상담", "설명", "VIDEO", null, false);

        verify(batchNotificationDispatchService, never())
            .dispatchReservationReminderD2(anyLong());
        verify(batchNotificationDispatchService, never())
            .dispatchReservationImmediateLate(anyLong());
        verify(batchNotificationDispatchService, never())
            .dispatchReservationImmediateSingle(anyLong());
    }

    @Test
    @DisplayName("단발성(totalSessions==1) BOOKED 등록 → RESERVATION_IMMEDIATE_SINGLE SMS 발송 (D-N 무관, 기존 동작 유지)")
    void createConsultantSchedule_whenSingleSession_dispatchesImmediateSingle() {
        stubMappingSingleSession();
        stubScheduleSave();

        LocalDate dPlus5 = LocalDate.now().plusDays(5);
        scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, dPlus5,
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "상담", "설명", "VIDEO", null, false);

        verify(batchNotificationDispatchService).dispatchReservationImmediateSingle(SAVED_SCHEDULE_ID);
        verify(batchNotificationDispatchService, never())
            .dispatchReservationReminderD2(anyLong());
        verify(batchNotificationDispatchService, never())
            .dispatchReservationImmediateLate(anyLong());
    }

    @Test
    @DisplayName("D-2 다회기 TENTATIVE_PENDING_PAYMENT 등록 → RESERVATION_REMINDER_D2 SMS 발송 (CANCELLED 미적용)")
    void createConsultantSchedule_whenTentativeD2MultiSession_dispatchesReminderD2() {
        // ACTIVE 매핑 lookup 으로 validateMappingForTentativeBeforeDepositSchedule 통과.
        stubMappingMultiSession();
        stubScheduleSave();

        LocalDate dPlus2 = LocalDate.now().plusDays(2);
        Schedule saved = scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, dPlus2,
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "상담", "설명", "VIDEO", null, true);

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        verify(batchNotificationDispatchService).dispatchReservationReminderD2(SAVED_SCHEDULE_ID);
        // TENTATIVE 는 인앱/푸시 helper 미호출 — 외부 채널(SMS) 만 발송.
        verify(scheduleCreatedNotificationHelper, never())
            .notifyScheduleCreated(any(Schedule.class), org.mockito.ArgumentMatchers.anyBoolean());
    }

    @Test
    @DisplayName("TENTATIVE + PENDING_PAYMENT(SAME_DAY) 단발성 → RESERVATION_IMMEDIATE_SINGLE SMS 발송")
    void createConsultantSchedule_whenTentativePendingPaymentSingle_dispatchesImmediateSingle() {
        stubMappingPendingPaymentSingleSession();
        stubScheduleSave();

        LocalDate dPlus5 = LocalDate.now().plusDays(5);
        Schedule saved = scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, dPlus5,
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "상담", "설명", "VIDEO", null, true);

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        verify(batchNotificationDispatchService).dispatchReservationImmediateSingle(SAVED_SCHEDULE_ID);
        verify(batchNotificationDispatchService, never())
            .dispatchReservationReminderD2(anyLong());
        verify(batchNotificationDispatchService, never())
            .dispatchReservationImmediateLate(anyLong());
        verify(scheduleCreatedNotificationHelper, never())
            .notifyScheduleCreated(any(Schedule.class), org.mockito.ArgumentMatchers.anyBoolean());
    }

    @Test
    @DisplayName("TENTATIVE + PENDING_PAYMENT 다회기 D-0 → RESERVATION_IMMEDIATE_LATE SMS 발송")
    void createConsultantSchedule_whenTentativePendingPaymentD0_dispatchesImmediateLate() {
        stubMappingPendingPaymentMultiSession();
        stubScheduleSave();

        Schedule saved = scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, LocalDate.now(),
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "상담", "설명", "VIDEO", null, true);

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        verify(batchNotificationDispatchService).dispatchReservationImmediateLate(SAVED_SCHEDULE_ID);
        verify(batchNotificationDispatchService, never())
            .dispatchReservationReminderD2(anyLong());
        verify(batchNotificationDispatchService, never())
            .dispatchReservationImmediateSingle(anyLong());
    }

    @Test
    @DisplayName("TENTATIVE + PENDING_PAYMENT 다회기 D-1 → RESERVATION_IMMEDIATE_LATE SMS 발송")
    void createConsultantSchedule_whenTentativePendingPaymentD1_dispatchesImmediateLate() {
        stubMappingPendingPaymentMultiSession();
        stubScheduleSave();

        LocalDate dPlus1 = LocalDate.now().plusDays(1);
        Schedule saved = scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, dPlus1,
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "상담", "설명", "VIDEO", null, true);

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        verify(batchNotificationDispatchService).dispatchReservationImmediateLate(SAVED_SCHEDULE_ID);
    }

    @Test
    @DisplayName("TENTATIVE + PENDING_PAYMENT 다회기 D-2 → RESERVATION_REMINDER_D2 SMS 발송")
    void createConsultantSchedule_whenTentativePendingPaymentD2_dispatchesReminderD2() {
        stubMappingPendingPaymentMultiSession();
        stubScheduleSave();

        LocalDate dPlus2 = LocalDate.now().plusDays(2);
        Schedule saved = scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, dPlus2,
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "상담", "설명", "VIDEO", null, true);

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        verify(batchNotificationDispatchService).dispatchReservationReminderD2(SAVED_SCHEDULE_ID);
        verify(batchNotificationDispatchService, never())
            .dispatchReservationImmediateLate(anyLong());
        verify(batchNotificationDispatchService, never())
            .dispatchReservationImmediateSingle(anyLong());
    }

    @Test
    @DisplayName("활성 트랜잭션 동기화 시 — afterCommit 전후에만 즉시 SMS 디스패치 (비동기화 시 동기 경로 회귀)")
    void createConsultantSchedule_whenTxnSyncActive_dispatchesAfterCommit() {
        stubMappingMultiSession();
        stubScheduleSave();
        TransactionSynchronizationManager.initSynchronization();

        LocalDate dPlus2 = LocalDate.now().plusDays(2);
        scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, dPlus2,
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "상담", "설명", "VIDEO", null, false);

        // 커밋 전 — 예약 즉시 안내(D2/LATE/SINGLE)는 아직 디스패치되지 않음
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(anyLong());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateLate(anyLong());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateSingle(anyLong());

        // afterCommit 시뮬레이션
        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCommit();
        }

        verify(batchNotificationDispatchService).dispatchReservationReminderD2(SAVED_SCHEDULE_ID);
        verify(batchNotificationDispatchService, never())
            .dispatchReservationImmediateLate(anyLong());
        verify(batchNotificationDispatchService, never())
            .dispatchReservationImmediateSingle(anyLong());
    }

    // ---------------------------------------------------------------- fixtures

    private void stubConflictCheckAndAutoComplete() {
        when(consultantAvailabilityService.isConsultantOnVacation(
                eq(CONSULTANT_ID), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(false);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(
                eq(TENANT_ID), eq(CONSULTANT_ID), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findExpiredConfirmedSchedules(anyString(), any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findByDateBeforeAndStatus(anyString(), any(LocalDate.class), any()))
                .thenReturn(Collections.emptyList());
    }

    private void stubScheduleSave() {
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(invocation -> {
            Schedule s = invocation.getArgument(0);
            s.setId(SAVED_SCHEDULE_ID);
            return s;
        });
    }

    private void stubMappingMultiSession() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setRemainingSessions(7);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(3);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setTenantId(TENANT_ID);

        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(mapping));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID)).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        // dispatchImmediateReservationNotification → SMS 전용 ACTIVE/EXHAUSTED/PENDING_PAYMENT lookup
        when(mappingRepository.findActiveExhaustedOrPendingPaymentListByTenantIdAndConsultantIdAndClientId(
                TENANT_ID, CONSULTANT_ID, CLIENT_ID))
                .thenReturn(java.util.List.of(mapping));
    }

    private void stubMappingSingleSession() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setRemainingSessions(1);
        mapping.setTotalSessions(1);
        mapping.setUsedSessions(0);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setTenantId(TENANT_ID);

        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(mapping));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID)).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findActiveExhaustedOrPendingPaymentListByTenantIdAndConsultantIdAndClientId(
                TENANT_ID, CONSULTANT_ID, CLIENT_ID))
                .thenReturn(java.util.List.of(mapping));
    }

    /**
     * 실무 SAME_DAY 현장결제: PENDING_PAYMENT + paymentTiming=SAME_DAY_CARD, ACTIVE 없음.
     */
    private ConsultantClientMapping buildPendingPaymentMapping(int totalSessions, int remainingSessions) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setRemainingSessions(remainingSessions);
        mapping.setTotalSessions(totalSessions);
        mapping.setUsedSessions(Math.max(0, totalSessions - remainingSessions));
        mapping.setStatus(MappingStatus.PENDING_PAYMENT);
        mapping.setPaymentTiming("SAME_DAY_CARD");
        mapping.setTenantId(TENANT_ID);
        return mapping;
    }

    private void stubMappingPendingPaymentSingleSession() {
        ConsultantClientMapping mapping = buildPendingPaymentMapping(1, 1);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.PENDING_PAYMENT))
                .thenReturn(List.of(mapping));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID)).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findActiveExhaustedOrPendingPaymentListByTenantIdAndConsultantIdAndClientId(
                TENANT_ID, CONSULTANT_ID, CLIENT_ID))
                .thenReturn(List.of(mapping));
    }

    private void stubMappingPendingPaymentMultiSession() {
        ConsultantClientMapping mapping = buildPendingPaymentMapping(10, 10);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.PENDING_PAYMENT))
                .thenReturn(List.of(mapping));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID)).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findActiveExhaustedOrPendingPaymentListByTenantIdAndConsultantIdAndClientId(
                TENANT_ID, CONSULTANT_ID, CLIENT_ID))
                .thenReturn(List.of(mapping));
    }

}
