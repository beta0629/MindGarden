package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.MonthlyConsultantCountsResponse;
import com.coresolution.consultation.dto.MonthlyConsultantCountsResponse.ConsultantCount;
import com.coresolution.consultation.entity.Consultant;
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
import com.coresolution.core.service.DashboardIntegrationService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
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

/**
 * {@link ScheduleServiceImpl#getMonthlyConsultantCompletedCounts(int, int)} 단위 테스트.
 *
 * <p>2026-06-09 신규 API ({@code GET /api/v1/schedules/monthly-consultant-counts}) 의 Service 계층
 * SSOT. 검증 매트릭스 (S1~S9):</p>
 * <ul>
 *   <li>S1: year 범위 위반(1899/10000) → IllegalArgumentException</li>
 *   <li>S2: month 범위 위반(0/13) → IllegalArgumentException</li>
 *   <li>S3: 테넌트 컨텍스트 미설정 → IllegalStateException (TenantContextHolder.getRequiredTenantId)</li>
 *   <li>S4: 활성 상담사 3명 + COMPLETED 카운트 2명만 → 응답에 3명 모두 포함, 카운트 없는 1명 count=0</li>
 *   <li>S5: 카운트 있으나 활성 목록에 없는(탈퇴) consultantId → batch fetch 후 응답 포함</li>
 *   <li>S6: 카운트 consultantId 가 완전 미존재(User 삭제) → 표시명 DISPLAY_NAME_UNKNOWN</li>
 *   <li>S7: 일정 0건 + 활성 상담사 0명 → counts: [] 빈 배열</li>
 *   <li>S8: 같은 user 가 Consultant + counseling-enabled ADMIN 양쪽 존재해도 중복 제거</li>
 *   <li>S9: Repository 가 ScheduleStatus.COMPLETED enum 으로 호출되는지 verify</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl.getMonthlyConsultantCompletedCounts — 월별 상담사 COMPLETED 카운트")
class ScheduleServiceImplMonthlyConsultantCountsTest {

    private static final String TENANT_ID = "tenant-monthly-1";

    @Mock private ScheduleRepository scheduleRepository;
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
        // resolveDisplayNameForScheduleList 는 활성 상담사 노출명에 폭넓게 호출되므로 기본 stub.
        when(scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(any(User.class)))
                .thenAnswer(inv -> {
                    User u = inv.getArgument(0);
                    return u != null && u.getId() != null ? "USER_" + u.getId() : "—";
                });
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    // ─── S1: year 범위 위반 ────────────────────────────────────────────

    @Test
    @DisplayName("S1: year 범위 위반(1899) → IllegalArgumentException")
    void s1_yearTooSmall_throws() {
        assertThatThrownBy(() -> scheduleService.getMonthlyConsultantCompletedCounts(1899, 6))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("year");
    }

    @Test
    @DisplayName("S1: year 범위 위반(10000) → IllegalArgumentException")
    void s1_yearTooLarge_throws() {
        assertThatThrownBy(() -> scheduleService.getMonthlyConsultantCompletedCounts(10000, 6))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("year");
    }

    // ─── S2: month 범위 위반 ───────────────────────────────────────────

    @Test
    @DisplayName("S2: month 범위 위반(0) → IllegalArgumentException")
    void s2_monthZero_throws() {
        assertThatThrownBy(() -> scheduleService.getMonthlyConsultantCompletedCounts(2026, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("month");
    }

    @Test
    @DisplayName("S2: month 범위 위반(13) → IllegalArgumentException")
    void s2_monthThirteen_throws() {
        assertThatThrownBy(() -> scheduleService.getMonthlyConsultantCompletedCounts(2026, 13))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("month");
    }

    // ─── S3: tenant context 미설정 ───────────────────────────────────────

    @Test
    @DisplayName("S3: 테넌트 컨텍스트 미설정 → IllegalStateException (TenantContextHolder.getRequiredTenantId 위임)")
    void s3_noTenantContext_throwsIllegalState() {
        TenantContextHolder.clear();
        assertThatThrownBy(() -> scheduleService.getMonthlyConsultantCompletedCounts(2026, 6))
                .isInstanceOf(IllegalStateException.class);
    }

    // ─── S4: 활성 상담사 + 일부 COMPLETED 카운트 ─────────────────────────

    @Test
    @DisplayName("S4: 활성 3명 + COMPLETED 2명만 → 응답에 3명 모두 포함, 카운트 없는 1명 count=0")
    void s4_zeroCountFallback() {
        Consultant c1 = consultant(11L);
        Consultant c2 = consultant(12L);
        Consultant c3 = consultant(13L);
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Arrays.asList(c1, c2, c3));
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Arrays.asList(
                        new Object[]{11L, 5L},
                        new Object[]{12L, 1L}));

        MonthlyConsultantCountsResponse response =
                scheduleService.getMonthlyConsultantCompletedCounts(2026, 6);

        assertThat(response.getYear()).isEqualTo(2026);
        assertThat(response.getMonth()).isEqualTo(6);
        assertThat(response.getCounts()).hasSize(3);
        assertThat(findById(response, 11L).getCount()).isEqualTo(5L);
        assertThat(findById(response, 12L).getCount()).isEqualTo(1L);
        assertThat(findById(response, 13L).getCount()).isEqualTo(0L);
    }

    // ─── S5: 카운트 있으나 활성 목록에 없는 (탈퇴) consultantId ────────────

    @Test
    @DisplayName("S5: 카운트 있으나 활성 목록에 없는(탈퇴) consultantId → batch fetch 후 응답 포함")
    void s5_inactiveConsultantBatchFetched() {
        Consultant active = consultant(11L);
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Collections.singletonList(active));
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        // 카운트는 있는데 활성 목록에는 없는 99L (탈퇴 상담사)
        when(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Arrays.asList(
                        new Object[]{11L, 3L},
                        new Object[]{99L, 2L}));
        // batch fetch 결과 — 99L 은 isDeleted=false 이지만 Consultant/ADMIN 어느 쪽에도 없음 (탈퇴 / 역할 변경)
        User retired = user(99L);
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.singletonList(retired));

        MonthlyConsultantCountsResponse response =
                scheduleService.getMonthlyConsultantCompletedCounts(2026, 6);

        assertThat(response.getCounts()).hasSize(2);
        assertThat(findById(response, 11L).getCount()).isEqualTo(3L);
        assertThat(findById(response, 99L).getCount()).isEqualTo(2L);
        assertThat(findById(response, 99L).getConsultantName()).isEqualTo("USER_99");
    }

    // ─── S6: 완전 미존재 consultantId → DISPLAY_NAME_UNKNOWN ───────────────

    @Test
    @DisplayName("S6: 카운트 consultantId 가 완전 미존재(User 삭제) → 표시명 DISPLAY_NAME_UNKNOWN")
    void s6_missingUser_fallbackUnknown() {
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(new Object[]{777L, 4L}));
        // batch fetch 도 빈 결과 — 사용자 자체가 isDeleted=true 또는 완전 삭제
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.emptyList());

        MonthlyConsultantCountsResponse response =
                scheduleService.getMonthlyConsultantCompletedCounts(2026, 6);

        assertThat(response.getCounts()).hasSize(1);
        ConsultantCount item = findById(response, 777L);
        assertThat(item.getCount()).isEqualTo(4L);
        assertThat(item.getConsultantName())
                .isEqualTo(AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN);
    }

    // ─── S7: 일정 0건 + 활성 상담사 0명 ──────────────────────────────────

    @Test
    @DisplayName("S7: 일정 0건 + 활성 상담사 0명 → counts: [] 빈 배열")
    void s7_emptyEverything() {
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        MonthlyConsultantCountsResponse response =
                scheduleService.getMonthlyConsultantCompletedCounts(2026, 6);

        assertThat(response.getYear()).isEqualTo(2026);
        assertThat(response.getMonth()).isEqualTo(6);
        assertThat(response.getCounts()).isNotNull().isEmpty();
        verify(userRepository, never()).findByTenantIdAndIdInAndIsDeletedFalse(anyString(), anyCollection());
    }

    // ─── S8: Consultant + ADMIN 중복 제거 ────────────────────────────────

    @Test
    @DisplayName("S8: 같은 userId 가 Consultant + counseling-enabled ADMIN 양쪽 존재 — 중복 제거 후 1 항목")
    void s8_dedupeConsultantAndAdmin() {
        Consultant dual = consultant(50L);
        User dualAsAdmin = user(50L);
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Collections.singletonList(dual));
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.singletonList(dualAsAdmin));
        when(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(new Object[]{50L, 7L}));

        MonthlyConsultantCountsResponse response =
                scheduleService.getMonthlyConsultantCompletedCounts(2026, 6);

        assertThat(response.getCounts()).hasSize(1);
        assertThat(findById(response, 50L).getCount()).isEqualTo(7L);
    }

    // ─── S9: Repository 호출이 ScheduleStatus.COMPLETED enum 인지 verify ──

    @Test
    @DisplayName("S9: Repository 가 ScheduleStatus.COMPLETED enum 으로 호출되는지 verify")
    void s9_verifyCompletedEnumPassedToRepository() {
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new ArrayList<>());

        scheduleService.getMonthlyConsultantCompletedCounts(2026, 7);

        verify(scheduleRepository, times(1)).countCompletedSchedulesByConsultantInDateRange(
                eq(TENANT_ID),
                eq(ScheduleStatus.COMPLETED),
                eq(LocalDate.of(2026, 7, 1)),
                eq(LocalDate.of(2026, 7, 31)));
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private Consultant consultant(Long id) {
        Consultant c = new Consultant();
        c.setId(id);
        c.setTenantId(TENANT_ID);
        return c;
    }

    private User user(Long id) {
        User u = new User();
        u.setId(id);
        u.setTenantId(TENANT_ID);
        return u;
    }

    private ConsultantCount findById(MonthlyConsultantCountsResponse response, Long id) {
        return response.getCounts().stream()
                .filter(c -> id.equals(c.getConsultantId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("consultantId=" + id + " 가 응답에 없습니다"));
    }
}
