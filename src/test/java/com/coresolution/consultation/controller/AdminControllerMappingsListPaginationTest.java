package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
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
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

/**
 * GET /api/v1/admin/mappings — ALWAYS paginate fail-closed (P0).
 *
 * @author CoreSolution
 * @since 2026-09-22
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController — mappings LIST pagination fail-closed")
class AdminControllerMappingsListPaginationTest {

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
    @DisplayName("resolveMappingsListPageable: null/null → page=0 size=DEFAULT")
    void resolveMappingsListPageable_nullDefaults() {
        Pageable pageable = AdminController.resolveMappingsListPageable(null, null);
        assertThat(pageable.getPageNumber()).isEqualTo(0);
        assertThat(pageable.getPageSize()).isEqualTo(PaginationUtils.DEFAULT_PAGE_SIZE);
    }

    @Test
    @DisplayName("resolveMappingsListPageable: size=999 → clamp ≤50")
    void resolveMappingsListPageable_clampsHardMax() {
        Pageable pageable = AdminController.resolveMappingsListPageable(0, 999);
        assertThat(pageable.getPageNumber()).isEqualTo(0);
        assertThat(pageable.getPageSize()).isLessThanOrEqualTo(50);
        assertThat(pageable.getPageSize()).isEqualTo(50);
    }

    @Test
    @DisplayName("page=null,size=null → mappings ≤20, data.page=0, data.size=20, count=total")
    void getAllMappings_nullPageSize_forcesDefaultPagination() {
        stubAdminSession();
        List<ConsultantClientMapping> fullList = buildMappings(25);
        when(adminService.getAllMappings()).thenReturn(fullList);
        stubEnrichmentEmpty();

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getAllMappings(session, null, null);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("count")).isEqualTo(25);
        assertThat(data.get("page")).isEqualTo(0);
        assertThat(data.get("size")).isEqualTo(PaginationUtils.DEFAULT_PAGE_SIZE);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> mappings = (List<Map<String, Object>>) data.get("mappings");
        assertThat(mappings).hasSizeLessThanOrEqualTo(PaginationUtils.DEFAULT_PAGE_SIZE);
        assertThat(mappings).hasSize(PaginationUtils.DEFAULT_PAGE_SIZE);
    }

    @Test
    @DisplayName("page=0,size=20 이고 25건 → len=20, count=25")
    void getAllMappings_paginated_countIsTotal() {
        stubAdminSession();
        List<ConsultantClientMapping> fullList = buildMappings(25);
        when(adminService.getAllMappings()).thenReturn(fullList);
        stubEnrichmentEmpty();

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getAllMappings(session, 0, 20);

        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("count")).isEqualTo(25);
        assertThat(data.get("page")).isEqualTo(0);
        assertThat(data.get("size")).isEqualTo(20);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> mappings = (List<Map<String, Object>>) data.get("mappings");
        assertThat(mappings).hasSize(20);
    }

    @Test
    @DisplayName("page=0,size=999 → clamped size ≤50")
    void getAllMappings_oversizedRequest_clampedToHardMax() {
        stubAdminSession();
        List<ConsultantClientMapping> fullList = buildMappings(60);
        when(adminService.getAllMappings()).thenReturn(fullList);
        stubEnrichmentEmpty();

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getAllMappings(session, 0, 999);

        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("count")).isEqualTo(60);
        assertThat(data.get("page")).isEqualTo(0);
        assertThat((Integer) data.get("size")).isLessThanOrEqualTo(50);
        assertThat(data.get("size")).isEqualTo(50);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> mappings = (List<Map<String, Object>>) data.get("mappings");
        assertThat(mappings).hasSize(50);
    }

    private void stubAdminSession() {
        User user = new User();
        user.setId(1L);
        user.setRole(UserRole.ADMIN);
        user.setEmail("admin@test.local");
        sessionUtilsMock.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
        sessionUtilsMock.when(() -> SessionUtils.getTenantId(session)).thenReturn("tenant-1");
    }

    private static List<ConsultantClientMapping> buildMappings(int count) {
        List<ConsultantClientMapping> list = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            ConsultantClientMapping mapping = new ConsultantClientMapping();
            mapping.setId((long) (i + 1));
            list.add(mapping);
        }
        return list;
    }

    /**
     * getAllMappings enrich 경로 — 슬라이스 후 호출되는 배치 조회를 빈 값으로 stub.
     */
    private void stubEnrichmentEmpty() {
        lenient().when(adminService.getConsultantClientKeysWithOccupyingSchedulesOnOrAfter(
                        anyString(), any(LocalDate.class)))
                .thenReturn(Collections.emptySet());
        lenient().when(adminService.getMappingIdsWithOccupyingConsultationSchedules(anyString()))
                .thenReturn(Collections.emptySet());
        lenient().when(adminService.getConsultantClientKeysWithOccupyingConsultationSchedules(
                        anyString()))
                .thenReturn(Collections.emptySet());
        lenient().when(adminService.getMappingIdsWithOpenOccupyingConsultationSchedules(anyString()))
                .thenReturn(Collections.emptySet());
        lenient().when(adminService.getNextConsultationDateByMappingId(
                        anyString(), any(LocalDate.class)))
                .thenReturn(Collections.emptyMap());
        lenient().when(adminService.getConsultationSchedulesByMappingId(anyString(), anyList()))
                .thenReturn(Collections.emptyMap());
        lenient().when(scheduleClientReminderSmsStatusService
                        .resolveForNextConsultationByMappingIds(
                                anyString(), any(LocalDate.class), anyList()))
                .thenReturn(Collections.emptyMap());
        lenient().when(adminService.getCompletedConsultationCountByClientId(anyString(), anyList()))
                .thenReturn(Collections.emptyMap());
        lenient().when(adminService.getConsultationSchedulesByClientId(anyString(), anyList()))
                .thenReturn(Collections.emptyMap());
        lenient().when(adminService.getInitialConsultationPaymentByClientId(
                        anyString(), anyMap(), anySet()))
                .thenReturn(Collections.emptyMap());
        lenient().when(adminService.getInstitutionLinkMonthlyAmountByClientId(
                        anyString(), anySet()))
                .thenReturn(Collections.emptyMap());
        lenient().when(clientRepository.findByTenantIdAndIdInAndIsDeletedFalse(
                        anyString(), anyList()))
                .thenReturn(Collections.emptyList());
        lenient().when(consultantRepository.findByTenantIdAndIdInAndIsDeletedFalse(
                        anyString(), anyList()))
                .thenReturn(Collections.emptyList());
    }
}
