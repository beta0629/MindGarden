package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.BranchService;
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
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.util.StatusCodeHelper;
import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

/**
 * GET /api/v1/admin/user-management/kpi-counts — tenant 격리·인증 fail-closed.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController — user-management KPI count-only")
class AdminControllerUserManagementKpiCountsTest {

    @Mock private AdminService adminService;
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
    @Mock private com.coresolution.consultation.service.ClientPackagePaymentHistoryService
            clientPackagePaymentHistoryService;
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
        if (sessionUtilsMock != null) {
            sessionUtilsMock.close();
        }
    }

    @Test
    @DisplayName("로그인 없으면 AccessDeniedException")
    void rejectsWhenNotLoggedIn() {
        sessionUtilsMock.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

        assertThatThrownBy(() -> adminController.getUserManagementKpiCounts(session))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("tenantId 없으면 IllegalArgumentException")
    void rejectsWhenTenantMissing() {
        User user = User.builder().id(1L).role(UserRole.ADMIN).build();
        sessionUtilsMock.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
        sessionUtilsMock.when(() -> SessionUtils.getTenantId(session)).thenReturn(null);

        assertThatThrownBy(() -> adminController.getUserManagementKpiCounts(session))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("테넌트");
    }

    @Test
    @DisplayName("세션 tenantId로 count-only KPI 반환")
    void returnsCountsForSessionTenant() {
        User user = User.builder().id(7L).role(UserRole.ADMIN).build();
        sessionUtilsMock.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
        sessionUtilsMock.when(() -> SessionUtils.getTenantId(session)).thenReturn("tenant-a");

        Map<String, Object> counts = new HashMap<>();
        counts.put("activeMappings", 3L);
        counts.put("totalMappings", 5L);
        counts.put("totalSchedules", 40L);
        counts.put("todaySchedules", 2L);
        when(adminService.getUserManagementKpiCounts(eq("tenant-a"))).thenReturn(counts);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                adminController.getUserManagementKpiCounts(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData()).containsEntry("activeMappings", 3L);
        assertThat(response.getBody().getData()).containsEntry("todaySchedules", 2L);
        verify(adminService).getUserManagementKpiCounts("tenant-a");
    }
}
