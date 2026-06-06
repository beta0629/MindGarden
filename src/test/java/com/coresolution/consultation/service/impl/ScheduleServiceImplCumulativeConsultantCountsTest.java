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
import com.coresolution.consultation.dto.CumulativeConsultantCountsResponse;
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
 * {@link ScheduleServiceImpl#getCumulativeConsultantCompletedCounts(String)} 단위 테스트.
 *
 * <p>R6 (2026-06-06) 신규 API ({@code GET /api/v1/schedules/cumulative-consultant-counts}) 의
 * Service 계층 SSOT. 검증 매트릭스 (S1~S4):</p>
 * <ul>
 *   <li>S1: Repository row 가 응답 ConsultantCount 로 정확히 매핑된다 (consultantId·count).</li>
 *   <li>S2: 활성 상담사 중 Repository 응답 없는 자 → count=0 으로 머지 (0건 톤다운 시각화 지원).</li>
 *   <li>S3: 정렬 — count DESC, 동률 시 consultantName ASC.</li>
 *   <li>S4: Repository 호출이 {@link ScheduleStatus#COMPLETED} enum 으로 전달되는지 verify
 *       (BOOKED/CONFIRMED/CANCELLED/IN_PROGRESS 등 비대상 status 제외 보장 — Repository status
 *       필터로 가드).</li>
 *   <li>S5(추가): tenantId 가 null/빈 문자열이면 IllegalArgumentException.</li>
 *   <li>S6(추가): 카운트 있으나 활성 목록에 없는 (탈퇴) consultantId → batch fetch 후 응답 포함.</li>
 *   <li>S7(추가): 카운트 consultantId 가 완전 미존재 (User 삭제) → 표시명 DISPLAY_NAME_UNKNOWN.</li>
 *   <li>S8(추가): 일정 0건 + 활성 상담사 0명 → counts: [] 빈 배열, batch fetch 미호출.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl.getCumulativeConsultantCompletedCounts — 누적 상담사 COMPLETED 카운트")
class ScheduleServiceImplCumulativeConsultantCountsTest {

    private static final String TENANT_ID = "tenant-cumulative-1";

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

    // ─── S1: Repository row 정확히 매핑 ────────────────────────────────

    @Test
    @DisplayName("S1: Repository row → ConsultantCount 매핑 (consultantId·count 정확)")
    void s1_mapsRepositoryRowsCorrectly() {
        Consultant c1 = consultant(11L);
        Consultant c2 = consultant(12L);
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Arrays.asList(c1, c2));
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countCompletedSchedulesByConsultantCumulative(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED)))
                .thenReturn(Arrays.asList(
                        new Object[]{11L, 42L},
                        new Object[]{12L, 7L}));

        CumulativeConsultantCountsResponse response =
                scheduleService.getCumulativeConsultantCompletedCounts(TENANT_ID);

        assertThat(response.getCounts()).hasSize(2);
        assertThat(findById(response, 11L).getCount()).isEqualTo(42L);
        assertThat(findById(response, 12L).getCount()).isEqualTo(7L);
        assertThat(findById(response, 11L).getConsultantName()).isEqualTo("USER_11");
        assertThat(findById(response, 12L).getConsultantName()).isEqualTo("USER_12");
    }

    // ─── S2: 0건 폴백 ───────────────────────────────────────────────────

    @Test
    @DisplayName("S2: 활성 3명 + Repository 응답 2명만 → 응답에 3명 포함, 없는 1명 count=0")
    void s2_zeroCountFallback() {
        Consultant c1 = consultant(11L);
        Consultant c2 = consultant(12L);
        Consultant c3 = consultant(13L);
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Arrays.asList(c1, c2, c3));
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countCompletedSchedulesByConsultantCumulative(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED)))
                .thenReturn(Arrays.asList(
                        new Object[]{11L, 5L},
                        new Object[]{12L, 1L}));

        CumulativeConsultantCountsResponse response =
                scheduleService.getCumulativeConsultantCompletedCounts(TENANT_ID);

        assertThat(response.getCounts()).hasSize(3);
        assertThat(findById(response, 11L).getCount()).isEqualTo(5L);
        assertThat(findById(response, 12L).getCount()).isEqualTo(1L);
        assertThat(findById(response, 13L).getCount()).isEqualTo(0L);
    }

    // ─── S3: 정렬 — count DESC, name ASC ─────────────────────────────────

    @Test
    @DisplayName("S3: 정렬 — count DESC 우선, 동률 시 consultantName ASC")
    void s3_sortByCountDescThenNameAsc() {
        // 표시명을 명시적으로 stub 하여 ASC 정렬 결정성 확보.
        when(scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(any(User.class)))
                .thenAnswer(inv -> {
                    User u = inv.getArgument(0);
                    Long id = u != null ? u.getId() : null;
                    if (id == null) return "—";
                    if (id == 10L) return "다상담사"; // count=5
                    if (id == 20L) return "가상담사"; // count=5 (동률 → ASC 우선)
                    if (id == 30L) return "나상담사"; // count=10 (최상위)
                    if (id == 40L) return "라상담사"; // count=0
                    return "USER_" + id;
                });

        Consultant c10 = consultant(10L);
        Consultant c20 = consultant(20L);
        Consultant c30 = consultant(30L);
        Consultant c40 = consultant(40L);
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Arrays.asList(c10, c20, c30, c40));
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countCompletedSchedulesByConsultantCumulative(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED)))
                .thenReturn(Arrays.asList(
                        new Object[]{10L, 5L},
                        new Object[]{20L, 5L},
                        new Object[]{30L, 10L}
                        // 40L 은 응답 없음 → count=0 폴백.
                ));

        CumulativeConsultantCountsResponse response =
                scheduleService.getCumulativeConsultantCompletedCounts(TENANT_ID);

        List<ConsultantCount> counts = response.getCounts();
        assertThat(counts).hasSize(4);
        // [0] count=10 (나상담사, 30L)
        assertThat(counts.get(0).getConsultantId()).isEqualTo(30L);
        assertThat(counts.get(0).getCount()).isEqualTo(10L);
        // [1] count=5 → name ASC → 가상담사 (20L)
        assertThat(counts.get(1).getConsultantId()).isEqualTo(20L);
        assertThat(counts.get(1).getCount()).isEqualTo(5L);
        // [2] count=5 → 다상담사 (10L)
        assertThat(counts.get(2).getConsultantId()).isEqualTo(10L);
        assertThat(counts.get(2).getCount()).isEqualTo(5L);
        // [3] count=0 → 라상담사 (40L)
        assertThat(counts.get(3).getConsultantId()).isEqualTo(40L);
        assertThat(counts.get(3).getCount()).isEqualTo(0L);
    }

    // ─── S4: ScheduleStatus.COMPLETED enum 전달 verify ──────────────────

    @Test
    @DisplayName("S4: Repository 호출이 ScheduleStatus.COMPLETED enum 으로 — 비대상 status 제외 보장")
    void s4_verifyCompletedEnumPassedToRepository() {
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countCompletedSchedulesByConsultantCumulative(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED)))
                .thenReturn(new ArrayList<>());

        scheduleService.getCumulativeConsultantCompletedCounts(TENANT_ID);

        verify(scheduleRepository, times(1)).countCompletedSchedulesByConsultantCumulative(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED));
    }

    // ─── S5: tenantId 가드 ───────────────────────────────────────────────

    @Test
    @DisplayName("S5: tenantId null → IllegalArgumentException")
    void s5_nullTenantId_throws() {
        assertThatThrownBy(() -> scheduleService.getCumulativeConsultantCompletedCounts(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tenantId");
    }

    @Test
    @DisplayName("S5: tenantId 빈 문자열 → IllegalArgumentException")
    void s5_emptyTenantId_throws() {
        assertThatThrownBy(() -> scheduleService.getCumulativeConsultantCompletedCounts(""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tenantId");
    }

    // ─── S6: 탈퇴 상담사 batch fetch ─────────────────────────────────────

    @Test
    @DisplayName("S6: 카운트 있으나 활성 목록에 없는(탈퇴) consultantId → batch fetch 후 응답 포함")
    void s6_inactiveConsultantBatchFetched() {
        Consultant active = consultant(11L);
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Collections.singletonList(active));
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countCompletedSchedulesByConsultantCumulative(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED)))
                .thenReturn(Arrays.asList(
                        new Object[]{11L, 3L},
                        new Object[]{99L, 2L}));
        User retired = user(99L);
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.singletonList(retired));

        CumulativeConsultantCountsResponse response =
                scheduleService.getCumulativeConsultantCompletedCounts(TENANT_ID);

        assertThat(response.getCounts()).hasSize(2);
        assertThat(findById(response, 11L).getCount()).isEqualTo(3L);
        assertThat(findById(response, 99L).getCount()).isEqualTo(2L);
        assertThat(findById(response, 99L).getConsultantName()).isEqualTo("USER_99");
    }

    // ─── S7: User 완전 미존재 → DISPLAY_NAME_UNKNOWN ─────────────────────

    @Test
    @DisplayName("S7: 카운트 consultantId 가 완전 미존재(User 삭제) → 표시명 DISPLAY_NAME_UNKNOWN")
    void s7_missingUser_fallbackUnknown() {
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countCompletedSchedulesByConsultantCumulative(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED)))
                .thenReturn(Collections.singletonList(new Object[]{777L, 4L}));
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.emptyList());

        CumulativeConsultantCountsResponse response =
                scheduleService.getCumulativeConsultantCompletedCounts(TENANT_ID);

        assertThat(response.getCounts()).hasSize(1);
        ConsultantCount item = findById(response, 777L);
        assertThat(item.getCount()).isEqualTo(4L);
        assertThat(item.getConsultantName())
                .isEqualTo(AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN);
    }

    // ─── S8: 빈 케이스 ───────────────────────────────────────────────────

    @Test
    @DisplayName("S8: 일정 0건 + 활성 상담사 0명 → counts: [] 빈 배열, batch fetch 미호출")
    void s8_emptyEverything() {
        when(consultantRepository.findActiveConsultantsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countCompletedSchedulesByConsultantCumulative(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());

        CumulativeConsultantCountsResponse response =
                scheduleService.getCumulativeConsultantCompletedCounts(TENANT_ID);

        assertThat(response.getCounts()).isNotNull().isEmpty();
        verify(userRepository, never()).findByTenantIdAndIdInAndIsDeletedFalse(anyString(), anyCollection());
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

    private ConsultantCount findById(CumulativeConsultantCountsResponse response, Long id) {
        return response.getCounts().stream()
                .filter(c -> id.equals(c.getConsultantId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("consultantId=" + id + " 가 응답에 없습니다"));
    }
}
