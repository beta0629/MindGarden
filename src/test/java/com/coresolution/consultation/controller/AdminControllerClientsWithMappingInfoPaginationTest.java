package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
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
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.util.PaginationUtils;
import com.coresolution.core.util.StatusCodeHelper;
import jakarta.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

/**
 * GET /api/v1/admin/clients/with-mapping-info — forced page/size defaults (never full dump).
 *
 * @author CoreSolution
 * @since 2026-09-22
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController — clients/with-mapping-info pagination")
class AdminControllerClientsWithMappingInfoPaginationTest {

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
    @Mock private HttpSession session;

    @InjectMocks
    private AdminController adminController;

    private MockedStatic<SessionUtils> sessionUtilsMock;

    @BeforeEach
    void setUp() {
        sessionUtilsMock = Mockito.mockStatic(SessionUtils.class);
    }

    @AfterEach
    void tearDown() {
        sessionUtilsMock.close();
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("page/size 요청 시 count는 전체 건수, clients는 페이지 크기만 반환")
    void getAllClientsWithMappingInfo_paginated_countIsTotal() {
        User user = new User();
        user.setId(1L);
        user.setRole(UserRole.ADMIN);
        sessionUtilsMock.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
        sessionUtilsMock.when(() -> SessionUtils.getTenantId(session)).thenReturn("tenant-1");

        List<Map<String, Object>> fullList = new ArrayList<>();
        for (int i = 0; i < 25; i++) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", (long) i);
            fullList.add(row);
        }
        when(adminService.getAllClientsWithMappingInfo(eq("summary"))).thenReturn(fullList);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getAllClientsWithMappingInfo(session, "summary", 0, 20);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("count")).isEqualTo(25);
        assertThat(data.get("page")).isEqualTo(0);
        assertThat(data.get("size")).isEqualTo(20);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> clients = (List<Map<String, Object>>) data.get("clients");
        assertThat(clients).hasSize(20);
    }

    @Test
    @DisplayName("page/size 없으면 기본 page=0 size=DEFAULT 로 슬라이스 (전체 dump 금지)")
    void getAllClientsWithMappingInfo_missingPageSize_forcesDefaultSlice() {
        User user = new User();
        user.setId(2L);
        user.setRole(UserRole.ADMIN);
        sessionUtilsMock.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
        sessionUtilsMock.when(() -> SessionUtils.getTenantId(session)).thenReturn("tenant-1");

        List<Map<String, Object>> fullList = new ArrayList<>();
        for (int i = 0; i < 25; i++) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", (long) i);
            fullList.add(row);
        }
        when(adminService.getAllClientsWithMappingInfo(isNull())).thenReturn(fullList);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getAllClientsWithMappingInfo(session, null, null, null);

        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("count")).isEqualTo(25);
        assertThat(data.get("page")).isEqualTo(0);
        assertThat(data.get("size")).isEqualTo(PaginationUtils.DEFAULT_PAGE_SIZE);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> clients = (List<Map<String, Object>>) data.get("clients");
        assertThat(clients).hasSize(PaginationUtils.DEFAULT_PAGE_SIZE);
    }

    @Test
    @DisplayName("view=summary + page/size null 이어도 page=0 size=20 (prod #1197 absorb)")
    void getAllClientsWithMappingInfo_summary_missingPageSize_forcesDefault() {
        User user = new User();
        user.setId(3L);
        user.setRole(UserRole.ADMIN);
        sessionUtilsMock.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
        sessionUtilsMock.when(() -> SessionUtils.getTenantId(session)).thenReturn("tenant-1");

        List<Map<String, Object>> fullList = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", (long) i);
            fullList.add(row);
        }
        when(adminService.getAllClientsWithMappingInfo(eq("summary"))).thenReturn(fullList);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getAllClientsWithMappingInfo(session, "summary", null, null);

        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("count")).isEqualTo(3);
        assertThat(data.get("page")).isEqualTo(0);
        assertThat(data.get("size")).isEqualTo(PaginationUtils.DEFAULT_PAGE_SIZE);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> clients = (List<Map<String, Object>>) data.get("clients");
        assertThat(clients).hasSize(3);
    }

    @Test
    @DisplayName("view=summary 이고 page/size 미지정 시 fail-closed 기본 페이지 적용")
    void getAllClientsWithMappingInfo_summaryWithoutPageSize_forcesDefaultPagination() {
        User user = new User();
        user.setId(3L);
        user.setRole(UserRole.ADMIN);
        sessionUtilsMock.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
        sessionUtilsMock.when(() -> SessionUtils.getTenantId(session)).thenReturn("tenant-1");

        List<Map<String, Object>> fullList = new ArrayList<>();
        for (int i = 0; i < 25; i++) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", (long) i);
            fullList.add(row);
        }
        when(adminService.getAllClientsWithMappingInfo(eq("summary"))).thenReturn(fullList);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getAllClientsWithMappingInfo(session, "summary", null, null);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("count")).isEqualTo(25);
        assertThat(data.get("page")).isEqualTo(0);
        assertThat(data.get("size")).isEqualTo(PaginationUtils.DEFAULT_PAGE_SIZE);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> clients = (List<Map<String, Object>>) data.get("clients");
        assertThat(clients).hasSizeLessThanOrEqualTo(PaginationUtils.DEFAULT_PAGE_SIZE);
        assertThat(clients).hasSize(PaginationUtils.DEFAULT_PAGE_SIZE);
    }

    @Test
    @DisplayName("view=matching-queue + page/size null 이어도 page=0 size=DEFAULT (any-view SSOT)")
    void getAllClientsWithMappingInfo_matchingQueue_missingPageSize_forcesDefault() {
        User user = new User();
        user.setId(4L);
        user.setRole(UserRole.ADMIN);
        sessionUtilsMock.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
        sessionUtilsMock.when(() -> SessionUtils.getTenantId(session)).thenReturn("tenant-1");

        List<Map<String, Object>> fullList = new ArrayList<>();
        for (int i = 0; i < 25; i++) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", (long) i);
            fullList.add(row);
        }
        when(adminService.getAllClientsWithMappingInfo(eq("matching-queue"))).thenReturn(fullList);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getAllClientsWithMappingInfo(session, "matching-queue", null, null);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("count")).isEqualTo(25);
        assertThat(data.get("page")).isEqualTo(0);
        assertThat(data.get("size")).isEqualTo(PaginationUtils.DEFAULT_PAGE_SIZE);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> clients = (List<Map<String, Object>>) data.get("clients");
        assertThat(clients).hasSize(PaginationUtils.DEFAULT_PAGE_SIZE);
    }
}
