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
import com.coresolution.consultation.dto.MonthlyMissingConsultationLogsResponse;
import com.coresolution.consultation.dto.MonthlyMissingConsultationLogsResponse.ConsultantMissingLogs;
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
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
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

/**
 * {@link ScheduleServiceImpl#getMonthlyMissingConsultationLogs(int, int)} 단위 테스트.
 *
 * <p>2026-06-09 R4 신규 API ({@code GET /api/v1/schedules/monthly-missing-consultation-logs})
 * 의 Service 계층 SSOT. 검증 매트릭스 (S1~S8):</p>
 * <ul>
 *   <li>S1: year 범위 위반(1899/10000) → IllegalArgumentException</li>
 *   <li>S2: month 범위 위반(0/13) → IllegalArgumentException</li>
 *   <li>S3: 테넌트 컨텍스트 미설정 → IllegalStateException</li>
 *   <li>S4: 누락 0건 → items: [] 빈 배열, batch fetch 호출 안 함</li>
 *   <li>S5: 다중 상담사 + 다중 일자 → 그룹화 정합 + 일자 오름차순 + 중복 제거</li>
 *   <li>S6: User 가 isDeleted/완전 삭제 → 표시명 DISPLAY_NAME_UNKNOWN</li>
 *   <li>S7: Repository 가 status 집합 {COMPLETED, CONFIRMED, BOOKED} + 월말 경계 + today
 *       파라미터로 호출되는지 verify (R5 도메인 SSOT 회귀 가드).</li>
 *   <li>S8: 동일 consultantId 가 row 에 중복으로 와도 missingDates 는 unique 보장</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl.getMonthlyMissingConsultationLogs — 월별 상담일지 누락")
class ScheduleServiceImplMonthlyMissingConsultationLogsTest {

    private static final String TENANT_ID = "tenant-monthly-missing-1";

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

    // ─── S1 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("S1: year 범위 위반(1899) → IllegalArgumentException")
    void s1_yearTooSmall_throws() {
        assertThatThrownBy(() -> scheduleService.getMonthlyMissingConsultationLogs(1899, 4))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("year");
    }

    @Test
    @DisplayName("S1: year 범위 위반(10000) → IllegalArgumentException")
    void s1_yearTooLarge_throws() {
        assertThatThrownBy(() -> scheduleService.getMonthlyMissingConsultationLogs(10000, 4))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("year");
    }

    // ─── S2 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("S2: month 범위 위반(0) → IllegalArgumentException")
    void s2_monthZero_throws() {
        assertThatThrownBy(() -> scheduleService.getMonthlyMissingConsultationLogs(2026, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("month");
    }

    @Test
    @DisplayName("S2: month 범위 위반(13) → IllegalArgumentException")
    void s2_monthThirteen_throws() {
        assertThatThrownBy(() -> scheduleService.getMonthlyMissingConsultationLogs(2026, 13))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("month");
    }

    // ─── S3 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("S3: 테넌트 컨텍스트 미설정 → IllegalStateException")
    void s3_noTenantContext_throwsIllegalState() {
        TenantContextHolder.clear();
        assertThatThrownBy(() -> scheduleService.getMonthlyMissingConsultationLogs(2026, 4))
                .isInstanceOf(IllegalStateException.class);
    }

    // ─── S4 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("S4: 누락 0건 → items: [] 빈 배열, User batch fetch 호출 안 함")
    void s4_noMissing_emptyItems() {
        when(scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                eq(TENANT_ID), anyCollection(),
                any(LocalDate.class), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        MonthlyMissingConsultationLogsResponse response =
                scheduleService.getMonthlyMissingConsultationLogs(2026, 4);

        assertThat(response.getYear()).isEqualTo(2026);
        assertThat(response.getMonth()).isEqualTo(4);
        assertThat(response.getItems()).isNotNull().isEmpty();
        verify(userRepository, never())
                .findByTenantIdAndIdInAndIsDeletedFalse(anyString(), anyCollection());
    }

    // ─── S5 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("S5: 다중 상담사 + 다중 일자 → 그룹화 정합 + missingDates 오름차순 정렬")
    void s5_multipleConsultants_groupedAndSorted() {
        when(scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                eq(TENANT_ID), anyCollection(),
                any(LocalDate.class), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Arrays.asList(
                        new Object[]{3L, LocalDate.of(2026, 4, 22)},
                        new Object[]{3L, LocalDate.of(2026, 4, 15)},
                        new Object[]{4L, LocalDate.of(2026, 4, 30)}));
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(Arrays.asList(user(3L), user(4L)));

        MonthlyMissingConsultationLogsResponse response =
                scheduleService.getMonthlyMissingConsultationLogs(2026, 4);

        assertThat(response.getItems()).hasSize(2);
        ConsultantMissingLogs first = findById(response, 3L);
        assertThat(first.getMissingDates()).containsExactly(
                LocalDate.of(2026, 4, 15),
                LocalDate.of(2026, 4, 22));
        assertThat(first.getConsultantName()).isEqualTo("USER_3");
        ConsultantMissingLogs second = findById(response, 4L);
        assertThat(second.getMissingDates()).containsExactly(LocalDate.of(2026, 4, 30));
    }

    // ─── S6 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("S6: User 완전 삭제 → 표시명 DISPLAY_NAME_UNKNOWN")
    void s6_missingUser_fallbackUnknown() {
        when(scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                eq(TENANT_ID), anyCollection(),
                any(LocalDate.class), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(
                        new Object[]{777L, LocalDate.of(2026, 4, 5)}));
        // batch fetch 가 빈 결과 — 사용자 자체가 isDeleted=true 또는 완전 삭제
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.emptyList());

        MonthlyMissingConsultationLogsResponse response =
                scheduleService.getMonthlyMissingConsultationLogs(2026, 4);

        assertThat(response.getItems()).hasSize(1);
        ConsultantMissingLogs item = findById(response, 777L);
        assertThat(item.getConsultantName())
                .isEqualTo(AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN);
        assertThat(item.getMissingDates()).containsExactly(LocalDate.of(2026, 4, 5));
    }

    // ─── S7 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("S7: Repository 가 {COMPLETED, CONFIRMED, BOOKED} + 월말 경계 + today (호출 시점 today) 로 호출 — R5 도메인 SSOT 회귀")
    void s7_verifyRepositoryArguments() {
        when(scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                eq(TENANT_ID), anyCollection(),
                any(LocalDate.class), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        LocalDate beforeCall = LocalDate.now();
        scheduleService.getMonthlyMissingConsultationLogs(2026, 4);
        LocalDate afterCall = LocalDate.now();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<ScheduleStatus>> statusesCaptor =
                ArgumentCaptor.forClass(Collection.class);
        ArgumentCaptor<LocalDate> todayCaptor = ArgumentCaptor.forClass(LocalDate.class);

        verify(scheduleRepository, times(1)).findMissingConsultationLogScheduleRowsInDateRange(
                eq(TENANT_ID),
                statusesCaptor.capture(),
                eq(LocalDate.of(2026, 4, 1)),
                eq(LocalDate.of(2026, 4, 30)),
                todayCaptor.capture());

        Set<ScheduleStatus> expectedStatuses =
                EnumSet.of(ScheduleStatus.COMPLETED, ScheduleStatus.CONFIRMED, ScheduleStatus.BOOKED);
        assertThat(statusesCaptor.getValue())
                .as("R5 SSOT: missing log 응답 대상 status 는 COMPLETED + CONFIRMED + BOOKED 모두 포함")
                .containsExactlyInAnyOrderElementsOf(expectedStatuses);
        assertThat(todayCaptor.getValue())
                .as("today 는 LocalDate.now() SSOT 패턴 — 호출 시점 today 와 동일해야 함")
                .isBetween(beforeCall, afterCall);
    }

    // ─── S8 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("S8: 동일 consultantId+date 가 row 중복으로 와도 missingDates 는 unique 보장")
    void s8_duplicateRows_uniqueDates() {
        when(scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                eq(TENANT_ID), anyCollection(),
                any(LocalDate.class), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Arrays.asList(
                        new Object[]{3L, LocalDate.of(2026, 4, 15)},
                        new Object[]{3L, LocalDate.of(2026, 4, 15)},
                        new Object[]{3L, LocalDate.of(2026, 4, 22)}));
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.singletonList(user(3L)));

        MonthlyMissingConsultationLogsResponse response =
                scheduleService.getMonthlyMissingConsultationLogs(2026, 4);

        assertThat(response.getItems()).hasSize(1);
        List<LocalDate> dates = findById(response, 3L).getMissingDates();
        assertThat(dates).containsExactly(
                LocalDate.of(2026, 4, 15),
                LocalDate.of(2026, 4, 22));
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private User user(Long id) {
        User u = new User();
        u.setId(id);
        u.setTenantId(TENANT_ID);
        return u;
    }

    private ConsultantMissingLogs findById(MonthlyMissingConsultationLogsResponse response, Long id) {
        return response.getItems().stream()
                .filter(i -> id.equals(i.getConsultantId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("consultantId=" + id + " 가 응답에 없습니다"));
    }
}
