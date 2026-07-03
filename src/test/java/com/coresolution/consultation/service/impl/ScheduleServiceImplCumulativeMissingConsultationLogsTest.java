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
import com.coresolution.consultation.dto.CumulativeMissingConsultationLogsResponse;
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
 * {@link ScheduleServiceImpl#getCumulativeMissingConsultationLogs()} 단위 테스트.
 *
 * <p>2026-07-03 — 어드민 대시보드 «상담일지 누락» 섹션이 현재 월만 조회하여 이전 달
 * (예: 7/3 접속 시 6/30) 누락 건을 놓치던 버그 보정. 누적(전체 기간) API
 * ({@code GET /api/v1/schedules/cumulative-missing-consultation-logs}) 의 Service 계층
 * SSOT. 검증 매트릭스 (C1~C6):</p>
 * <ul>
 *   <li>C1: 테넌트 컨텍스트 미설정 → IllegalStateException</li>
 *   <li>C2: 누락 0건 → items: [] 빈 배열, batch fetch 호출 안 함</li>
 *   <li>C3: 다중 상담사 + 다중 일자(월 경계 넘는 6/30·7/1) → 그룹화 + 오름차순 정합</li>
 *   <li>C4: User 완전 삭제 → 표시명 DISPLAY_NAME_UNKNOWN</li>
 *   <li>C5: Repository 가 {COMPLETED, CONFIRMED, BOOKED} + today(월 범위 없음) 로 호출</li>
 *   <li>C6: 동일 consultantId+date 중복 row → missingDates unique 보장</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-07-03
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl.getCumulativeMissingConsultationLogs — 누적 상담일지 누락")
class ScheduleServiceImplCumulativeMissingConsultationLogsTest {

    private static final String TENANT_ID = "tenant-cumulative-missing-1";

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

    // ─── C1 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("C1: 테넌트 컨텍스트 미설정 → IllegalStateException")
    void c1_noTenantContext_throwsIllegalState() {
        TenantContextHolder.clear();
        assertThatThrownBy(() -> scheduleService.getCumulativeMissingConsultationLogs())
                .isInstanceOf(IllegalStateException.class);
    }

    // ─── C2 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("C2: 누락 0건 → items: [] 빈 배열, User batch fetch 호출 안 함")
    void c2_noMissing_emptyItems() {
        when(scheduleRepository.findMissingConsultationLogScheduleRowsBeforeDate(
                eq(TENANT_ID), anyCollection(), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        CumulativeMissingConsultationLogsResponse response =
                scheduleService.getCumulativeMissingConsultationLogs();

        assertThat(response.getItems()).isNotNull().isEmpty();
        verify(userRepository, never())
                .findByTenantIdAndIdInAndIsDeletedFalse(anyString(), anyCollection());
    }

    // ─── C3 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("C3: 월 경계를 넘는 누락(6/30·7/1)도 함께 집계 + 그룹화 + 오름차순 정렬")
    void c3_crossMonthMissing_groupedAndSorted() {
        when(scheduleRepository.findMissingConsultationLogScheduleRowsBeforeDate(
                eq(TENANT_ID), anyCollection(), any(LocalDate.class)))
                .thenReturn(Arrays.asList(
                        new Object[]{3L, LocalDate.of(2026, 7, 1)},
                        new Object[]{3L, LocalDate.of(2026, 6, 30)},
                        new Object[]{4L, LocalDate.of(2026, 6, 30)}));
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(Arrays.asList(user(3L), user(4L)));

        CumulativeMissingConsultationLogsResponse response =
                scheduleService.getCumulativeMissingConsultationLogs();

        assertThat(response.getItems()).hasSize(2);
        ConsultantMissingLogs first = findById(response, 3L);
        assertThat(first.getMissingDates())
                .as("이전 달(6/30)과 이번 달(7/1) 누락이 월 경계 없이 함께 집계·정렬")
                .containsExactly(LocalDate.of(2026, 6, 30), LocalDate.of(2026, 7, 1));
        assertThat(first.getConsultantName()).isEqualTo("USER_3");
        ConsultantMissingLogs second = findById(response, 4L);
        assertThat(second.getMissingDates()).containsExactly(LocalDate.of(2026, 6, 30));
    }

    // ─── C4 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("C4: User 완전 삭제 → 표시명 DISPLAY_NAME_UNKNOWN")
    void c4_missingUser_fallbackUnknown() {
        when(scheduleRepository.findMissingConsultationLogScheduleRowsBeforeDate(
                eq(TENANT_ID), anyCollection(), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(
                        new Object[]{777L, LocalDate.of(2026, 6, 30)}));
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.emptyList());

        CumulativeMissingConsultationLogsResponse response =
                scheduleService.getCumulativeMissingConsultationLogs();

        assertThat(response.getItems()).hasSize(1);
        ConsultantMissingLogs item = findById(response, 777L);
        assertThat(item.getConsultantName())
                .isEqualTo(AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN);
        assertThat(item.getMissingDates()).containsExactly(LocalDate.of(2026, 6, 30));
    }

    // ─── C5 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("C5: Repository 가 {COMPLETED, CONFIRMED, BOOKED} + today (월 범위 인자 없음) 로 호출")
    void c5_verifyRepositoryArguments() {
        when(scheduleRepository.findMissingConsultationLogScheduleRowsBeforeDate(
                eq(TENANT_ID), anyCollection(), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        LocalDate beforeCall = LocalDate.now();
        scheduleService.getCumulativeMissingConsultationLogs();
        LocalDate afterCall = LocalDate.now();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<ScheduleStatus>> statusesCaptor =
                ArgumentCaptor.forClass(Collection.class);
        ArgumentCaptor<LocalDate> todayCaptor = ArgumentCaptor.forClass(LocalDate.class);

        verify(scheduleRepository, times(1)).findMissingConsultationLogScheduleRowsBeforeDate(
                eq(TENANT_ID),
                statusesCaptor.capture(),
                todayCaptor.capture());

        Set<ScheduleStatus> expectedStatuses =
                EnumSet.of(ScheduleStatus.COMPLETED, ScheduleStatus.CONFIRMED, ScheduleStatus.BOOKED);
        assertThat(statusesCaptor.getValue())
                .as("SSOT: 누락 대상 status 는 COMPLETED + CONFIRMED + BOOKED 모두 포함")
                .containsExactlyInAnyOrderElementsOf(expectedStatuses);
        assertThat(todayCaptor.getValue())
                .as("today 는 LocalDate.now() SSOT 패턴 — 호출 시점 today 와 동일해야 함")
                .isBetween(beforeCall, afterCall);
    }

    // ─── C6 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("C6: 동일 consultantId+date 중복 row → missingDates unique 보장")
    void c6_duplicateRows_uniqueDates() {
        when(scheduleRepository.findMissingConsultationLogScheduleRowsBeforeDate(
                eq(TENANT_ID), anyCollection(), any(LocalDate.class)))
                .thenReturn(Arrays.asList(
                        new Object[]{3L, LocalDate.of(2026, 6, 30)},
                        new Object[]{3L, LocalDate.of(2026, 6, 30)},
                        new Object[]{3L, LocalDate.of(2026, 7, 1)}));
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.singletonList(user(3L)));

        CumulativeMissingConsultationLogsResponse response =
                scheduleService.getCumulativeMissingConsultationLogs();

        assertThat(response.getItems()).hasSize(1);
        List<LocalDate> dates = findById(response, 3L).getMissingDates();
        assertThat(dates).containsExactly(LocalDate.of(2026, 6, 30), LocalDate.of(2026, 7, 1));
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private User user(Long id) {
        User u = new User();
        u.setId(id);
        u.setTenantId(TENANT_ID);
        return u;
    }

    private ConsultantMissingLogs findById(CumulativeMissingConsultationLogsResponse response, Long id) {
        return response.getItems().stream()
                .filter(i -> id.equals(i.getConsultantId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("consultantId=" + id + " 가 응답에 없습니다"));
    }
}
