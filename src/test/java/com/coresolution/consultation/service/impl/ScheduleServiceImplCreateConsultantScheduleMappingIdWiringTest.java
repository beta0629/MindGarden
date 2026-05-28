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
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

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
 * 옵션 B v2.0 Path 2 P1 — 결함 B (캘린더 점선 미적용) 단위 테스트.
 *
 * <p>매트릭스 §2 케이스 16~24 — {@code createConsultantSchedule} 3 오버로드의 {@code mapping_id} wiring
 * 검증.</p>
 *
 * <ul>
 *   <li>[16] setMappingId 호출 검증 (3 오버로드)</li>
 *   <li>[17] mapping NULL 보존 (매칭 없음 — non-tentative 경로 차단 회귀 0)</li>
 *   <li>[18] 매칭 다수 후보 → 가장 최근 PENDING_PAYMENT + SAME_DAY_CARD</li>
 *   <li>[19] TENTATIVE_PENDING_PAYMENT + 매핑 자동 연결 → mapping_id auto wiring</li>
 *   <li>[20] ACTIVE + SAME_DAY_CARD 후보 없음 → ACTIVE fallback wiring</li>
 *   <li>[21] PENDING_PAYMENT + ADVANCE 차단 (회귀 0)</li>
 *   <li>[22] 자동 강제 분기 (tentative=false → 백엔드 자동 진입) → mapping_id 정상</li>
 *   <li>[23] paymentTiming 대소문자 안전 wiring</li>
 *   <li>[24] 일정 status 매트릭스: TENTATIVE_PENDING_PAYMENT/BOOKED 각 mapping_id 동작</li>
 * </ul>
 *
 * <p>참조:
 * <ul>
 *   <li>{@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN_V2.md} §4·§5</li>
 *   <li>{@code docs/project-management/2026-05-28/OPTION_B_V2_TEST_MATRIX.md} §2 (cases 16~24)</li>
 * </ul>
 * </p>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl 옵션 B v2.0 Path 2 — createConsultantSchedule mapping_id wiring")
class ScheduleServiceImplCreateConsultantScheduleMappingIdWiringTest {

    private static final String TENANT_ID = "tenant-mapwire-1";
    private static final Long CONSULTANT_ID = 511L;
    private static final Long CLIENT_ID = 622L;
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
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
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

    private ConsultantClientMapping buildMapping(Long id, MappingStatus status, String paymentTiming,
            Integer remainingSessions, LocalDateTime createdAt) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(status);
        mapping.setPaymentTiming(paymentTiming);
        mapping.setRemainingSessions(remainingSessions);
        // AuditableTenantBase.createdAt 은 @CreatedDate 로만 채워지므로 단위 테스트에서는 리플렉션으로 주입.
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
            throw new IllegalStateException(
                    "테스트용 createdAt 주입 실패: " + ex.getMessage(), ex);
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
            if (s.getId() == null) {
                s.setId(999L);
            }
            return s;
        });
    }

    private Schedule callCreateOverload1(boolean tentativeBeforeDeposit) {
        return scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID,
                LocalDate.of(2026, 7, 15),
                LocalTime.of(10, 0), LocalTime.of(11, 0),
                "제목", "설명", tentativeBeforeDeposit);
    }

    private Schedule callCreateOverload2(boolean tentativeBeforeDeposit) {
        return scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID,
                LocalDate.of(2026, 7, 15),
                LocalTime.of(10, 0), LocalTime.of(11, 0),
                "제목", "설명", "VIDEO", null, tentativeBeforeDeposit);
    }

    // ===== [16-1] 오버로드 1 (8 params): SAME_DAY_CARD pending + tentative=true → setMappingId 호출 =====
    @Test
    @DisplayName("[16-1] 오버로드 1 (8 params): SAME_DAY_CARD pending + tentative=true → schedule.mapping_id = 매칭 ID")
    void overload1_sameDayCardPending_tentativeTrue_wiresMappingId() {
        ConsultantClientMapping mapping = buildMapping(
                111L, MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_SAME_DAY_CARD, 0,
                LocalDateTime.of(2026, 5, 28, 10, 0));
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));
        stubScheduleSave();

        Schedule saved = callCreateOverload1(true);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(captor.getValue().getMappingId()).isEqualTo(111L);
        assertThat(saved.getMappingId()).isEqualTo(111L);
    }

    // ===== [16-2] 오버로드 2 (10 params): SAME_DAY_CARD pending + tentative=true → setMappingId 호출 =====
    @Test
    @DisplayName("[16-2] 오버로드 2 (10 params): SAME_DAY_CARD pending + tentative=true → schedule.mapping_id = 매칭 ID")
    void overload2_sameDayCardPending_tentativeTrue_wiresMappingId() {
        ConsultantClientMapping mapping = buildMapping(
                222L, MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_SAME_DAY_CARD, 0,
                LocalDateTime.of(2026, 5, 28, 10, 0));
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));
        stubScheduleSave();

        Schedule saved = callCreateOverload2(true);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(captor.getValue().getMappingId()).isEqualTo(222L);
        assertThat(saved.getMappingId()).isEqualTo(222L);
    }

    // ===== [17] mapping NULL 보존 (non-tentative 흐름에서 매칭 없으면 차단 — 회귀 0) =====
    @Test
    @DisplayName("[17] 매칭 0건 + tentative=false → 매칭 가드로 차단 (mapping_id NULL 보존 회귀 0)")
    void noMapping_tentativeFalse_blocked_mappingIdNotSet() {
        stubMappingsByStatus(Collections.emptyList(), Collections.emptyList());

        assertThatThrownBy(() -> callCreateOverload2(false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("유효한 매칭");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    // ===== [18] 매칭 다수 후보 → 가장 최근 PENDING_PAYMENT + SAME_DAY_CARD =====
    @Test
    @DisplayName("[18] 다수 후보 (SAME_DAY_CARD 2건) → 가장 최근 createdAt 의 매칭 ID 사용")
    void multipleSameDayCardCandidates_picksMostRecent() {
        ConsultantClientMapping older = buildMapping(
                301L, MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_SAME_DAY_CARD, 0,
                LocalDateTime.of(2026, 5, 26, 9, 0));
        ConsultantClientMapping newer = buildMapping(
                302L, MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_SAME_DAY_CARD, 0,
                LocalDateTime.of(2026, 5, 28, 14, 0));
        stubMappingsByStatus(Collections.emptyList(), List.of(older, newer));
        stubScheduleSave();

        Schedule saved = callCreateOverload2(true);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getMappingId()).isEqualTo(302L);
        assertThat(saved.getMappingId()).isEqualTo(302L);
    }

    // ===== [19] TENTATIVE_PENDING_PAYMENT + 매핑 자동 연결 → mapping_id auto wiring =====
    @Test
    @DisplayName("[19] TENTATIVE_PENDING_PAYMENT 분기 진입 → mapping_id 자동 wiring + status 정합")
    void tentativeFlow_autoWiringWithStatus() {
        ConsultantClientMapping mapping = buildMapping(
                401L, MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_SAME_DAY_CARD, null,
                LocalDateTime.of(2026, 5, 28, 12, 0));
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));
        stubScheduleSave();

        Schedule saved = callCreateOverload2(true);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        Schedule persisted = captor.getValue();
        assertThat(persisted.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(persisted.getMappingId()).isEqualTo(401L);
        assertThat(persisted.getTenantId()).isEqualTo(TENANT_ID);
    }

    // ===== [20] ACTIVE + SAME_DAY_CARD 후보 없음 → ACTIVE fallback wiring (helper 정책) =====
    @Test
    @DisplayName("[20] ACTIVE 매핑만 존재 + tentative=true → ACTIVE fallback 으로 mapping_id wiring")
    void tentativeFlow_activeFallback_wiresMappingId() {
        ConsultantClientMapping active = buildMapping(
                501L, MappingStatus.ACTIVE, PAYMENT_TIMING_ADVANCE, 5,
                LocalDateTime.of(2026, 5, 28, 11, 0));
        stubMappingsByStatus(List.of(active), Collections.emptyList());
        stubScheduleSave();

        Schedule saved = callCreateOverload2(true);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        Schedule persisted = captor.getValue();
        assertThat(persisted.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(persisted.getMappingId()).isEqualTo(501L);
    }

    // ===== [21] PENDING_PAYMENT + ADVANCE 차단 (옵션 A 회귀 0) — 가드 통과 0 =====
    @Test
    @DisplayName("[21] PENDING_PAYMENT + ADVANCE + tentative=true → 가드 차단 + setMappingId 호출 0 (회귀 0)")
    void advancePending_blocked_noSetMappingId() {
        ConsultantClientMapping mapping = buildMapping(
                601L, MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_ADVANCE, 0,
                LocalDateTime.of(2026, 5, 28, 10, 0));
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));

        assertThatThrownBy(() -> callCreateOverload2(true))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("가예약");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    // ===== [22] 자동 강제 분기 (tentative=false + SAME_DAY_CARD pending) → mapping_id 정상 =====
    @Test
    @DisplayName("[22] tentative=false + SAME_DAY_CARD pending → 백엔드 자동 강제 분기 + mapping_id wiring 정상")
    void autoFallback_tentativeFalse_wiresMappingId() {
        ConsultantClientMapping mapping = buildMapping(
                701L, MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_SAME_DAY_CARD, 0,
                LocalDateTime.of(2026, 5, 28, 13, 0));
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));
        stubScheduleSave();

        Schedule saved = callCreateOverload2(false);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        Schedule persisted = captor.getValue();
        assertThat(persisted.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(persisted.getMappingId()).isEqualTo(701L);
        verify(sessionSyncService, never()).syncAfterSessionUsage(anyLong(), anyLong(), anyLong());
    }

    // ===== [23] paymentTiming 대소문자 안전 wiring (resolveMappingId 정합) =====
    @Test
    @DisplayName("[23] paymentTiming='same_day_card' (소문자) → 대소문자 무시하여 mapping_id wiring")
    void caseInsensitivePaymentTiming_wiresMappingId() {
        ConsultantClientMapping mapping = buildMapping(
                801L, MappingStatus.PENDING_PAYMENT, "same_day_card", 0,
                LocalDateTime.of(2026, 5, 28, 12, 0));
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));
        stubScheduleSave();

        Schedule saved = callCreateOverload2(true);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getMappingId()).isEqualTo(801L);
    }

    // ===== [24] 일정 status 매트릭스: TENTATIVE_PENDING_PAYMENT (가예약) 와 BOOKED (확정) 분기별 mapping_id =====
    @Test
    @DisplayName("[24a] tentative=true → status=TENTATIVE_PENDING_PAYMENT + mapping_id 설정")
    void statusMatrix_tentative_setsTentativeStatusAndMappingId() {
        ConsultantClientMapping mapping = buildMapping(
                901L, MappingStatus.PENDING_PAYMENT, PAYMENT_TIMING_SAME_DAY_CARD, 0,
                LocalDateTime.of(2026, 5, 28, 9, 0));
        stubMappingsByStatus(Collections.emptyList(), List.of(mapping));
        stubScheduleSave();

        Schedule saved = callCreateOverload2(true);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(captor.getValue().getMappingId()).isEqualTo(901L);
    }
}
