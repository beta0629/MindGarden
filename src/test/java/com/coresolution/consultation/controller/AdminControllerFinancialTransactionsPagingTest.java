package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.FinancialTransactionResponse;
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
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.consultation.util.AdminListPaging;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.util.StatusCodeHelper;
import jakarta.servlet.http.HttpSession;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * GET /api/v1/admin/financial-transactions — AdminListPaging(200) 정렬.
 *
 * @author CoreSolution
 * @since 2026-10-18
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController — financial-transactions LIST pagination")
class AdminControllerFinancialTransactionsPagingTest {

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
    @Mock private ResourceOwnerAccessGuard resourceOwnerAccessGuard;
    @Mock private HttpSession session;

    @InjectMocks
    private AdminController adminController;

    private MockedStatic<SessionUtils> sessionUtilsMock;
    private User adminUser;

    @BeforeEach
    void setUp() {
        sessionUtilsMock = Mockito.mockStatic(SessionUtils.class);
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setEmail("admin@test.local");
        adminUser.setRole(UserRole.ADMIN);
        when(resourceOwnerAccessGuard.requireTenantAdminAccess(session)).thenReturn(adminUser);
        sessionUtilsMock.when(() -> SessionUtils.getTenantId(session)).thenReturn("tenant-1");
    }

    @AfterEach
    void tearDown() {
        sessionUtilsMock.close();
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    private void stubFilteredPage(Pageable expectedStyle) {
        when(financialTransactionService.getTransactionsFiltered(
                isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenAnswer(inv -> {
                    Pageable pageable = inv.getArgument(4);
                    return new PageImpl<FinancialTransactionResponse>(
                            Collections.emptyList(), pageable, 0L);
                });
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalIncome", 0);
        summary.put("totalExpense", 0);
        when(financialTransactionService.getTransactionsFilteredSummary(
                isNull(), isNull(), isNull(), isNull()))
                .thenReturn(summary);
    }

    @Test
    @DisplayName("size=200 은 AdminListPaging 상한으로 유지된다")
    void getFinancialTransactions_size200_stays200() {
        stubFilteredPage(null);

        ResponseEntity<Map<String, Object>> response =
                adminController.getFinancialTransactions(0, 200, null, null, null, null, session);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("success")).isEqualTo(true);
        assertThat(response.getBody().get("size")).isEqualTo(200);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(financialTransactionService).getTransactionsFiltered(
                isNull(), isNull(), isNull(), isNull(), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(AdminListPaging.MAX_PAGE_SIZE);
        assertThat(pageableCaptor.getValue().getPageNumber()).isEqualTo(0);
    }

    @Test
    @DisplayName("size>200 은 ADMIN_LIST_MAX_PAGE_SIZE(200)로 클램프")
    void getFinancialTransactions_oversized_clampsTo200() {
        stubFilteredPage(null);

        ResponseEntity<Map<String, Object>> response =
                adminController.getFinancialTransactions(0, 999, null, null, null, null, session);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("size")).isEqualTo(AdminListPaging.MAX_PAGE_SIZE);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(financialTransactionService).getTransactionsFiltered(
                isNull(), isNull(), isNull(), isNull(), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(AdminListPaging.MAX_PAGE_SIZE);
    }
}
