package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mockStatic;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.CounselingEnabledUpdateRequest;
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
import java.util.Collections;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

/**
 * {@link AdminController} STAFF 매핑·사용자 권한 회귀 테스트 (1.0.5).
 *
 * <p>변경 ② — STAFF 로 다음 엔드포인트가 통과(200)되는지 검증:</p>
 * <ul>
 *   <li>GET /admin/mappings/pending-deposit — getPendingDepositMappings</li>
 *   <li>GET /admin/users — getUsers</li>
 *   <li>PUT /admin/users/{id}/counseling-enabled — updateCounselingEnabled</li>
 * </ul>
 *
 * <p>보류 회귀: STAFF 로 PUT /admin/users/{id}/role 은 403 유지.</p>
 *
 * @author MindGarden
 * @since 2026-06-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController — STAFF == ADMIN 매핑/사용자 권한")
class AdminControllerStaffMappingTest {

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
    @Mock private HttpSession session;

    @InjectMocks
    private AdminController controller;

    private MockedStatic<SessionUtils> sessionUtilsStatic;

    @BeforeEach
    void setUp() {
        sessionUtilsStatic = mockStatic(SessionUtils.class);
    }

    @AfterEach
    void tearDown() {
        sessionUtilsStatic.close();
    }

    private User userWithRole(UserRole role) {
        User user = new User();
        user.setId(100L);
        user.setUserId(role.name().toLowerCase() + "01");
        user.setEmail(role.name().toLowerCase() + "01@example.com");
        user.setName(role.getDisplayName());
        user.setPassword("encoded-password-1234");
        user.setRole(role);
        return user;
    }

    @Test
    @DisplayName("STAFF — GET /admin/mappings/pending-deposit — 200")
    void staff_pendingDeposit_200() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session))
                .thenReturn(userWithRole(UserRole.STAFF));
        lenient().when(adminService.getPendingDepositMappings())
                .thenReturn(Collections.emptyList());

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getPendingDepositMappings(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("STAFF — GET /admin/users — 200")
    void staff_getUsers_200() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session))
                .thenReturn(userWithRole(UserRole.STAFF));
        lenient().when(adminService.getUsers(anyBoolean(), eq((String) null), isNull()))
                .thenReturn(Collections.emptyList());

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getUsers(false, null, null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("STAFF — PUT /admin/users/{id}/counseling-enabled — 200")
    void staff_updateCounseling_200() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session))
                .thenReturn(userWithRole(UserRole.STAFF));
        User updated = userWithRole(UserRole.STAFF);
        updated.setCounselingEnabled(true);
        lenient().when(adminService.updateCounselingEnabled(eq(200L), anyBoolean()))
                .thenReturn(updated);

        CounselingEnabledUpdateRequest body = new CounselingEnabledUpdateRequest();
        body.setCounselingEnabled(true);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.updateCounselingEnabled(200L, body, session);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    @DisplayName("STAFF — PUT /admin/users/{id}/role — 403 (보류 회귀)")
    void staff_changeUserRole_forbidden() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session))
                .thenReturn(userWithRole(UserRole.STAFF));

        assertThatThrownBy(() -> controller.changeUserRole(300L, "STAFF", session))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("CONSULTANT — GET /admin/mappings/pending-deposit — 403")
    void consultant_pendingDeposit_forbidden() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session))
                .thenReturn(userWithRole(UserRole.CONSULTANT));

        assertThatThrownBy(() -> controller.getPendingDepositMappings(session))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("CONSULTANT — GET /admin/users — 403")
    void consultant_getUsers_forbidden() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session))
                .thenReturn(userWithRole(UserRole.CONSULTANT));

        assertThatThrownBy(() -> controller.getUsers(false, null, null, session))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("ADMIN — GET /admin/mappings/pending-deposit — 200 (회귀)")
    void admin_pendingDeposit_200() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session))
                .thenReturn(userWithRole(UserRole.ADMIN));
        lenient().when(adminService.getPendingDepositMappings())
                .thenReturn(Collections.emptyList());

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getPendingDepositMappings(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
