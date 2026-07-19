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
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
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
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * P0 핫픽스 2026-05-28 — 옵션 B SAME_DAY_CARD 매핑의 일정 생성 가드 분기 매트릭스 단위 테스트.
 *
 * <p>매트릭스 (매핑 상태 × paymentTiming × 회기수 × tentativeBeforeDeposit):
 * <ul>
 *   <li>ACTIVE / PENDING_PAYMENT(SAME_DAY_CARD) / PENDING_PAYMENT(ADVANCE) / PENDING_PAYMENT(NULL) / TERMINATED</li>
 *   <li>회기수: 0 / null / >0</li>
 *   <li>tentativeBeforeDeposit: true / false (false 시 백엔드 자동 강제 분기 fallback 검증 포함)</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl 옵션 B SAME_DAY_CARD 일정 생성 가드 매트릭스")
class ScheduleServiceImplCreateConsultantScheduleSameDayCardTest {

    private static final String TENANT_ID = "tenant-sdc-1";
    private static final Long CONSULTANT_ID = 301L;
    private static final Long CLIENT_ID = 402L;
    private static final String PAYMENT_TIMING_SAME_DAY_CARD = "SAME_DAY_CARD";
    private static final String PAYMENT_TIMING_ADVANCE = "ADVANCE";

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
    private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock
    private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @Mock
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        // 시간 충돌 검증 우회 — 모든 시나리오 공통.
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
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private ConsultantClientMapping buildMapping(MappingStatus status, String paymentTiming,
            Integer remainingSessions) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(status);
        mapping.setPaymentTiming(paymentTiming);
        mapping.setRemainingSessions(remainingSessions);
        return mapping;
    }

    private void stubMappingsByStatus(List<ConsultantClientMapping> activeMappings,
            List<ConsultantClientMapping> pendingPaymentMappings) {
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(activeMappings);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.PENDING_PAYMENT))
                .thenReturn(pendingPaymentMappings);
    }

    private void stubScheduleSave() {
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(invocation -> {
            Schedule s = invocation.getArgument(0);
            s.setId(999L);
            return s;
        });
    }

    private Schedule callCreate(boolean tentativeBeforeDeposit) {
        return scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID,
                LocalDate.of(2026, 7, 15),
                LocalTime.of(10, 0), LocalTime.of(11, 0),
                "제목", "설명", "VIDEO", null, tentativeBeforeDeposit);
    }

    // ===== 1. PENDING_PAYMENT + SAME_DAY_CARD + 회기 0 + tentative=true → TENTATIVE 저장 =====
    @Test
    @DisplayName("[1] PENDING_PAYMENT + SAME_DAY_CARD + 회기=0 + tentative=true → TENTATIVE_PENDING_PAYMENT 저장 (회기 차감 없음)")
    void sameDayCardPendingZeroRemaining_tentativeTrue_savesTentativeWithoutSessionUsage() {
        ConsultantClientMapping mapping = buildMapping(
                MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_SAME_DAY_CARD, 0);
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));
        stubScheduleSave();

        Schedule saved = callCreate(true);

        assertThat(saved.getId()).isEqualTo(999L);
        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        verify(sessionSyncService, never()).syncAfterSessionUsage(anyLong(), anyLong(), anyLong());
    }

    // ===== 2. PENDING_PAYMENT + SAME_DAY_CARD + 회기 null + tentative=true → TENTATIVE 저장 =====
    @Test
    @DisplayName("[2] PENDING_PAYMENT + SAME_DAY_CARD + 회기=null + tentative=true → TENTATIVE_PENDING_PAYMENT 저장")
    void sameDayCardPendingNullRemaining_tentativeTrue_savesTentative() {
        ConsultantClientMapping mapping = buildMapping(
                MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_SAME_DAY_CARD, null);
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));
        stubScheduleSave();

        Schedule saved = callCreate(true);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        verify(sessionSyncService, never()).syncAfterSessionUsage(anyLong(), anyLong(), anyLong());
    }

    // ===== 3. PENDING_PAYMENT + SAME_DAY_CARD + tentative=false → 자동 강제 분기 (fallback) =====
    @Test
    @DisplayName("[3] PENDING_PAYMENT + SAME_DAY_CARD + tentative=false → 자동 강제 분기 fallback → TENTATIVE 저장")
    void sameDayCardPending_tentativeFalse_autoFallbackToTentative() {
        ConsultantClientMapping mapping = buildMapping(
                MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_SAME_DAY_CARD, 0);
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));
        stubScheduleSave();

        Schedule saved = callCreate(false);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        verify(sessionSyncService, never()).syncAfterSessionUsage(anyLong(), anyLong(), anyLong());
    }

    // ===== 4. PENDING_PAYMENT + SAME_DAY_CARD (소문자) — 대소문자 안전 =====
    @Test
    @DisplayName("[4] PENDING_PAYMENT + paymentTiming='same_day_card' (소문자) → 대소문자 무시하여 TENTATIVE 허용")
    void sameDayCardPending_lowercase_acceptedCaseInsensitive() {
        ConsultantClientMapping mapping = buildMapping(
                MappingStatus.PENDING_PAYMENT, "same_day_card", 0);
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));
        stubScheduleSave();

        Schedule saved = callCreate(true);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
    }

    // ===== 5. PENDING_PAYMENT + ADVANCE + tentative=true → 차단 (옵션 A 회귀 0) =====
    @Test
    @DisplayName("[5] PENDING_PAYMENT + ADVANCE + tentative=true → 가드 차단 (입금 대기 매칭 일정 생성 불가)")
    void advancePending_tentativeTrue_blocked() {
        ConsultantClientMapping mapping = buildMapping(
                MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_ADVANCE, 0);
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));

        assertThatThrownBy(() -> callCreate(true))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("가예약");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    // ===== 6. PENDING_PAYMENT + ADVANCE + tentative=false → 차단 + 자동 fallback 미적용 =====
    @Test
    @DisplayName("[6] PENDING_PAYMENT + ADVANCE + tentative=false → 자동 fallback 미적용, 매칭 가드로 차단 (옵션 A 회귀 0)")
    void advancePending_tentativeFalse_blockedNoFallback() {
        ConsultantClientMapping mapping = buildMapping(
                MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_ADVANCE, 0);
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));

        assertThatThrownBy(() -> callCreate(false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("유효한 매칭");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    // ===== 7. PENDING_PAYMENT + paymentTiming=null (레거시) + tentative=true → 차단 =====
    @Test
    @DisplayName("[7] PENDING_PAYMENT + paymentTiming=null (레거시) + tentative=true → 차단")
    void legacyPending_tentativeTrue_blocked() {
        ConsultantClientMapping mapping = buildMapping(
                MappingStatus.PENDING_PAYMENT, null, 0);
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));

        assertThatThrownBy(() -> callCreate(true))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("가예약");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    // ===== 8. ACTIVE + 회기=0 + tentative=false → 차단 =====
    @Test
    @DisplayName("[8] ACTIVE + 회기=0 + tentative=false → 회기 부족 가드로 차단")
    void activeZeroRemaining_tentativeFalse_blocked() {
        ConsultantClientMapping mapping = buildMapping(MappingStatus.ACTIVE, PAYMENT_TIMING_ADVANCE, 0);
        stubMappingsByStatus(List.of(mapping), Collections.emptyList());

        assertThatThrownBy(() -> callCreate(false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("회기");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    // ===== 9. validateRemainingSessions 직접 호출 — PENDING_PAYMENT + SAME_DAY_CARD → true (우회) =====
    @Test
    @DisplayName("[9] validateRemainingSessions: PENDING_PAYMENT + SAME_DAY_CARD → true (회기 검증 우회)")
    void validateRemainingSessions_sameDayCardPending_returnsTrue() {
        ConsultantClientMapping mapping = buildMapping(
                MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_SAME_DAY_CARD, 0);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.PENDING_PAYMENT))
                .thenReturn(List.of(mapping));

        assertThat(scheduleService.validateRemainingSessions(CONSULTANT_ID, CLIENT_ID)).isTrue();
    }

    // ===== 10. validateRemainingSessions — PENDING_PAYMENT + ADVANCE → false =====
    @Test
    @DisplayName("[10] validateRemainingSessions: PENDING_PAYMENT + ADVANCE → false (옵션 A 미통과)")
    void validateRemainingSessions_advancePending_returnsFalse() {
        ConsultantClientMapping mapping = buildMapping(
                MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_ADVANCE, 5);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.PENDING_PAYMENT))
                .thenReturn(List.of(mapping));

        assertThat(scheduleService.validateRemainingSessions(CONSULTANT_ID, CLIENT_ID)).isFalse();
    }

    // ===== 11. TERMINATED + tentative=true/false → 모두 차단 =====
    @Test
    @DisplayName("[11] TERMINATED 매핑 (PENDING_PAYMENT/ACTIVE 모두 없음) + tentative=true → 차단")
    void terminatedMapping_tentativeTrue_blocked() {
        // TERMINATED는 ACTIVE/PENDING_PAYMENT 결과 집합에 포함되지 않음.
        stubMappingsByStatus(Collections.emptyList(), Collections.emptyList());

        assertThatThrownBy(() -> callCreate(true))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("가예약");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }
}
