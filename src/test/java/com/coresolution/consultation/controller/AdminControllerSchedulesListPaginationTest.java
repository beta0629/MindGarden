package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientPackagePaymentHistoryService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.MenuService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.util.PaginationUtils;
import com.coresolution.core.util.StatusCodeHelper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * GET /api/v1/admin/schedules — forced page/size defaults (never full dump).
 *
 * @author CoreSolution
 * @since 2026-09-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController — schedules LIST pagination")
class AdminControllerSchedulesListPaginationTest {

    @Mock private AdminService adminService;
    @Mock private ClientPackagePaymentHistoryService clientPackagePaymentHistoryService;
    @Mock private com.coresolution.consultation.service.ClientMappingListPayloadService
            clientMappingListPayloadService;
    @Mock private BranchService branchService;
    @Mock private ScheduleService scheduleService;
    @Mock private ConsultationRecordService consultationRecordService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private MenuService menuService;
    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private ErpService erpService;
    @Mock private ConsultantRatingService consultantRatingService;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private UserService userService;
    @Mock private StoredProcedureService storedProcedureService;
    @Mock private PersonalDataEncryptionUtil personalDataEncryptionUtil;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private ConsultantStatsService consultantStatsService;
    @Mock private ClientStatsService clientStatsService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private StatusCodeHelper statusCodeHelper;
    @Mock private OnboardingService onboardingService;
    @Mock private RealTimeStatisticsService realTimeStatisticsService;
    @Mock private UserRepository userRepository;
    @Mock private com.coresolution.consultation.service.ScheduleClientReminderSmsStatusService
            scheduleClientReminderSmsStatusService;
    @Mock private com.coresolution.consultation.repository.ClientRepository clientRepository;
    @Mock private com.coresolution.consultation.repository.ConsultantRepository consultantRepository;

    @InjectMocks
    private AdminController adminController;

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    private List<Map<String, Object>> buildStubSchedules(int count) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", (long) (i + 1));
            row.put("status", "TENTATIVE_PENDING_PAYMENT");
            list.add(row);
        }
        return list;
    }

    private void stubFilteredSchedules(int count) {
        when(adminService.getSchedulesFiltered(isNull(), isNull(), isNull(), isNull()))
                .thenReturn(buildStubSchedules(count));
    }

    @Test
    @DisplayName("page=0 size=20 → schedules.size==20, count==45 (slice << full)")
    void getSchedules_page0Size20_slicesBelowFullDump() {
        stubFilteredSchedules(45);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getSchedules(null, null, null, null, 0, 20);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("count")).isEqualTo(45);
        assertThat(data.get("page")).isEqualTo(0);
        assertThat(data.get("size")).isEqualTo(20);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> schedules = (List<Map<String, Object>>) data.get("schedules");
        assertThat(schedules).hasSize(20);
        assertThat(schedules.size()).isLessThan((Integer) data.get("count"));
    }

    @Test
    @DisplayName("page/size 없으면 기본 page=0 size=DEFAULT 로 슬라이스 (never full dump)")
    void getSchedules_missingPageSize_forcesDefaultSlice() {
        stubFilteredSchedules(45);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getSchedules(null, null, null, null, null, null);

        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("count")).isEqualTo(45);
        assertThat(data.get("page")).isEqualTo(0);
        assertThat(data.get("size")).isEqualTo(PaginationUtils.DEFAULT_PAGE_SIZE);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> schedules = (List<Map<String, Object>>) data.get("schedules");
        assertThat(schedules).hasSize(PaginationUtils.DEFAULT_PAGE_SIZE);
        assertThat(schedules.size()).isLessThan(45);
    }

    @Test
    @DisplayName("과도 size=999 는 hard max(MAX_PAGE_SIZE=50)로 클램프")
    void getSchedules_oversizedPage_clampsToHardMax() {
        stubFilteredSchedules(80);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getSchedules(null, null, null, null, 0, 999);

        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("count")).isEqualTo(80);
        assertThat(data.get("page")).isEqualTo(0);
        assertThat(data.get("size")).isEqualTo(PaginationUtils.MAX_PAGE_SIZE);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> schedules = (List<Map<String, Object>>) data.get("schedules");
        assertThat(schedules).hasSize(PaginationUtils.MAX_PAGE_SIZE);
        assertThat(schedules.size()).isLessThan(80);
    }

    @Test
    @DisplayName("필터 파라미터 유지 + 페이지 메타")
    void getSchedules_keepsFilters_andPageMeta() {
        when(adminService.getSchedulesFiltered(any(), any(), any(), any()))
                .thenReturn(buildStubSchedules(5));

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getSchedules(7L, "TENTATIVE_PENDING_PAYMENT",
                        "2026-09-01", "2026-09-30", 0, 20);

        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("consultantId")).isEqualTo(7L);
        assertThat(data.get("status")).isEqualTo("TENTATIVE_PENDING_PAYMENT");
        assertThat(data.get("startDate")).isEqualTo("2026-09-01");
        assertThat(data.get("endDate")).isEqualTo("2026-09-30");
        assertThat(data.get("count")).isEqualTo(5);
        assertThat(data.get("page")).isEqualTo(0);
        assertThat(data.get("size")).isEqualTo(20);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> schedules = (List<Map<String, Object>>) data.get("schedules");
        assertThat(schedules).hasSize(5);
    }
}
