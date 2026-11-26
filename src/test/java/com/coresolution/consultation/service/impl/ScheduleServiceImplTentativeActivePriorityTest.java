package com.coresolution.consultation.service.impl;

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
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultationMessageService;
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
import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 박혜선 케이스 재발 방지 — ACTIVE remaining≥1 이 있으면 가예약 자동 강제·PENDING 우선 resolve 금지.
 *
 * <p>시나리오: 초기상담(또는 N회기 ACTIVE) + 단회기 PENDING SAME_DAY_CARD 가 공존할 때
 * 일정 생성이 PENDING 가예약으로 붙지 않고 ACTIVE 잔여를 쓰도록 한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl ACTIVE 잔여 우선 — 가예약 자동진입·PENDING resolve 가드")
class ScheduleServiceImplTentativeActivePriorityTest {

    private static final String TENANT_ID = "tenant-active-priority-1";
    private static final Long CONSULTANT_ID = 701L;
    private static final Long CLIENT_ID = 802L;
    private static final Long ACTIVE_MAPPING_ID = 1001L;
    private static final Long PENDING_MAPPING_ID = 1002L;

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
    @Mock private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        ScheduleSessionClockFixtures.pinBeforeFixtures(scheduleService);
        when(consultantAvailabilityService.isConsultantOnVacation(
                eq(CONSULTANT_ID), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(false);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(
                eq(TENANT_ID), eq(CONSULTANT_ID), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findExpiredConfirmedSchedules(
                anyString(), any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findByDateBeforeAndStatus(anyString(), any(LocalDate.class), any()))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(TENANT_ID), any(), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(0L);
        when(scheduleRepository.countOccupyingConsultationSchedulesForConsultantClient(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(0L);
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), anyLong(), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(invocation -> {
            Schedule s = invocation.getArgument(0);
            if (s.getId() == null) {
                s.setId(999L);
            }
            return s;
        });
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("박혜선: ACTIVE rem=5 + PENDING 단회기 SAME_DAY — tentative=false → BOOKED(ACTIVE), 가예약 자동진입 금지")
    void parkHyeseon_activeRemainingPlusPendingSameDay_tentativeFalse_booksOnActive() {
        ConsultantClientMapping active = buildMapping(
                ACTIVE_MAPPING_ID, MappingStatus.ACTIVE, PaymentTimingConstants.ADVANCE, 5, 10,
                LocalDateTime.of(2026, 5, 1, 10, 0));
        ConsultantClientMapping pending = buildMapping(
                PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT, PaymentTimingConstants.SAME_DAY_CARD, 0, 1,
                LocalDateTime.of(2026, 5, 20, 10, 0));
        stubPair(active, pending);
        stubActiveConsume(active);

        Schedule saved = callCreate(false);

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.BOOKED);
        assertThat(saved.getMappingId()).isEqualTo(ACTIVE_MAPPING_ID);
        assertThat(active.getRemainingSessions()).isEqualTo(4);
        verify(sessionSyncService).syncAfterSessionUsage(
                eq(ACTIVE_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID));
        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository, atLeastOnce()).save(captor.capture());
        assertThat(captor.getAllValues()).anySatisfy(s -> {
            assertThat(s.getStatus()).isEqualTo(ScheduleStatus.BOOKED);
            assertThat(s.getMappingId()).isEqualTo(ACTIVE_MAPPING_ID);
        });
    }

    @Test
    @DisplayName("박혜선: ACTIVE rem≥1 + PENDING SAME_DAY — tentative=true 라도 PENDING 보다 ACTIVE mapping_id 우선")
    void parkHyeseon_activeRemaining_tentativeTrue_resolvesActiveNotPending() {
        ConsultantClientMapping active = buildMapping(
                ACTIVE_MAPPING_ID, MappingStatus.ACTIVE, PaymentTimingConstants.ADVANCE, 5, 10,
                LocalDateTime.of(2026, 5, 1, 10, 0));
        ConsultantClientMapping pending = buildMapping(
                PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT, PaymentTimingConstants.SAME_DAY_CARD, 0, 1,
                LocalDateTime.of(2026, 5, 20, 10, 0));
        stubPair(active, pending);

        Schedule saved = callCreate(true);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(captor.getValue().getMappingId()).isEqualTo(ACTIVE_MAPPING_ID);
        assertThat(saved.getMappingId()).isEqualTo(ACTIVE_MAPPING_ID);
        verify(sessionSyncService, never()).syncAfterSessionUsage(anyLong(), anyLong(), anyLong());
    }

    @ParameterizedTest(name = "ACTIVE rem={0} + PENDING SAME_DAY — tentative=false → BOOKED on ACTIVE")
    @ValueSource(ints = {10, 20, 30})
    @DisplayName("10·20·30회기 ACTIVE 잔여 — 가예약 자동진입 금지·ACTIVE 사용")
    void multiSessionPackages_activeRemaining_blocksAutoTentative(int remaining) {
        ConsultantClientMapping active = buildMapping(
                ACTIVE_MAPPING_ID, MappingStatus.ACTIVE, PaymentTimingConstants.ADVANCE, remaining, remaining,
                LocalDateTime.of(2026, 5, 1, 10, 0));
        ConsultantClientMapping pending = buildMapping(
                PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT, PaymentTimingConstants.SAME_DAY_CARD, 0, 1,
                LocalDateTime.of(2026, 5, 20, 10, 0));
        stubPair(active, pending);
        stubActiveConsume(active);

        Schedule saved = callCreate(false);

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.BOOKED);
        assertThat(saved.getMappingId()).isEqualTo(ACTIVE_MAPPING_ID);
        assertThat(active.getRemainingSessions()).isEqualTo(remaining - 1);
    }

    @Test
    @DisplayName("ACTIVE rem=0 + PENDING SAME_DAY — 자동 가예약 강제 진입은 유지 (단회기 회귀)")
    void activeZeroRemaining_pendingSameDay_autoTentativeStillApplies() {
        ConsultantClientMapping active = buildMapping(
                ACTIVE_MAPPING_ID, MappingStatus.ACTIVE, PaymentTimingConstants.ADVANCE, 0, 10,
                LocalDateTime.of(2026, 5, 1, 10, 0));
        ConsultantClientMapping pending = buildMapping(
                PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT, PaymentTimingConstants.SAME_DAY_CARD, 0, 1,
                LocalDateTime.of(2026, 5, 20, 10, 0));
        stubPair(active, pending);

        Schedule saved = callCreate(false);

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(saved.getMappingId()).isEqualTo(PENDING_MAPPING_ID);
        verify(sessionSyncService, never()).syncAfterSessionUsage(anyLong(), anyLong(), anyLong());
    }

    @Test
    @DisplayName("PENDING SAME_DAY만 존재 — 자동 가예약 강제 진입 회귀 유지")
    void pendingOnly_autoTentativeStillApplies() {
        ConsultantClientMapping pending = buildMapping(
                PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT, PaymentTimingConstants.SAME_DAY_CARD, 0, 1,
                LocalDateTime.of(2026, 5, 20, 10, 0));
        stubPair(Collections.emptyList(), List.of(pending));

        Schedule saved = callCreate(false);

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(saved.getMappingId()).isEqualTo(PENDING_MAPPING_ID);
    }

    private Schedule callCreate(boolean tentativeBeforeDeposit) {
        return scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID,
                LocalDate.of(2026, 7, 15),
                LocalTime.of(10, 0), LocalTime.of(11, 0),
                "제목", "설명", "VIDEO", null, tentativeBeforeDeposit);
    }

    private void stubPair(ConsultantClientMapping active, ConsultantClientMapping pending) {
        stubPair(List.of(active), List.of(pending));
    }

    private void stubPair(List<ConsultantClientMapping> actives, List<ConsultantClientMapping> pendings) {
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(actives);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.PENDING_PAYMENT))
                .thenReturn(pendings);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.SESSIONS_EXHAUSTED))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.CANCELLED))
                .thenReturn(Collections.emptyList());
    }

    private void stubActiveConsume(ConsultantClientMapping active) {
        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(List.of(active));
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(active.getId())))
                .thenReturn(Optional.of(active));
    }

    private ConsultantClientMapping buildMapping(Long id, MappingStatus status, String paymentTiming,
            Integer remainingSessions, Integer totalSessions, LocalDateTime createdAt) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setTenantId(TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(status);
        mapping.setPaymentTiming(paymentTiming);
        mapping.setRemainingSessions(remainingSessions);
        mapping.setTotalSessions(totalSessions);
        mapping.setUsedSessions(totalSessions != null && remainingSessions != null
                ? Math.max(0, totalSessions - remainingSessions) : 0);
        if (createdAt != null) {
            injectCreatedAt(mapping, createdAt);
        }
        return mapping;
    }

    private void injectCreatedAt(ConsultantClientMapping mapping, LocalDateTime createdAt) {
        try {
            Field field = findCreatedAtField(mapping.getClass());
            field.setAccessible(true);
            field.set(mapping, createdAt);
        } catch (Exception ex) {
            throw new IllegalStateException("테스트용 createdAt 주입 실패: " + ex.getMessage(), ex);
        }
    }

    private Field findCreatedAtField(Class<?> clazz) throws NoSuchFieldException {
        Class<?> current = clazz;
        while (current != null) {
            try {
                return current.getDeclaredField("createdAt");
            } catch (NoSuchFieldException ignored) {
                current = current.getSuperclass();
            }
        }
        throw new NoSuchFieldException("createdAt");
    }
}
