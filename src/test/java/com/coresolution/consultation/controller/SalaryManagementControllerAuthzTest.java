package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.TaxCalculateRequest;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.SalaryTaxCalculation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ForbiddenException;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.SalaryExportService;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.consultation.service.SalaryScheduleService;
import com.coresolution.consultation.utils.SessionUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * SalaryManagementController tax/config 경로 SALARY_MANAGE 가드 회귀 방어.
 *
 * @author MindGarden
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SalaryManagementController — SALARY_MANAGE tax/config 가드")
class SalaryManagementControllerAuthzTest {

    @Mock private SalaryManagementService salaryManagementService;
    @Mock private PlSqlSalaryManagementService plSqlSalaryManagementService;
    @Mock private SalaryScheduleService salaryScheduleService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private SalaryExportService salaryExportService;
    @Mock private AuditLogService auditLogService;
    @Mock private SalaryCalculationRepository salaryCalculationRepository;
    @Mock private ObjectMapper objectMapper;
    @Mock private HttpSession session;

    private MockedStatic<SessionUtils> sessionUtilsStatic;
    private SalaryManagementController controller;

    @BeforeEach
    void setUp() {
        sessionUtilsStatic = mockStatic(SessionUtils.class);
        controller = new SalaryManagementController(
                salaryManagementService,
                plSqlSalaryManagementService,
                salaryScheduleService,
                commonCodeService,
                dynamicPermissionService,
                roleCommonCodeAuthorizationService,
                salaryExportService,
                auditLogService,
                salaryCalculationRepository,
                objectMapper);
        SecurityContextHolder.clearContext();

        // STAFF + SALARY_MANAGE 는 ErpRestrictedPermissions fail-closed 로 동적 권한까지 떨어질 수 있음
        lenient().when(dynamicPermissionService.hasPermission(any(User.class), eq("SALARY_MANAGE")))
                .thenReturn(false);
    }

    @AfterEach
    void tearDown() {
        sessionUtilsStatic.close();
        SecurityContextHolder.clearContext();
    }

    private User userWithRole(UserRole role) {
        User user = new User();
        user.setId(role == UserRole.ADMIN ? 1L : 500L);
        user.setUserId(role.name().toLowerCase() + "-salary");
        user.setEmail(role.name().toLowerCase() + "-salary@example.com");
        user.setName(role.name());
        user.setPassword("encoded-password-1234");
        user.setRole(role);
        return user;
    }

    private TaxCalculateRequest sampleTaxRequest() {
        return TaxCalculateRequest.builder()
                .calculationId(10L)
                .grossAmount(new BigDecimal("1000000"))
                .taxType("ADDITIONAL_TAX")
                .taxRate(new BigDecimal("0.03"))
                .taxName("추가세금")
                .build();
    }

    @Test
    @DisplayName("getTaxDetails — STAFF + SALARY_MANAGE 없음 → ForbiddenException")
    void getTaxDetails_staff_forbidden() {
        User staff = userWithRole(UserRole.STAFF);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(staff);

        assertThatThrownBy(() -> controller.getTaxDetails(10L, session))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("급여 관리 권한이 없습니다");
        verify(salaryManagementService, never()).getTaxDetails(any());
    }

    @Test
    @DisplayName("calculateTax — STAFF + SALARY_MANAGE 없음 → ForbiddenException")
    void calculateTax_staff_forbidden() {
        User staff = userWithRole(UserRole.STAFF);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(staff);

        assertThatThrownBy(() -> controller.calculateTax(sampleTaxRequest(), session))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("급여 관리 권한이 없습니다");
        verify(salaryManagementService, never()).calculateAdditionalTax(any());
    }

    @Test
    @DisplayName("getTaxStatistics — STAFF + SALARY_MANAGE 없음 → ForbiddenException")
    void getTaxStatistics_staff_forbidden() {
        User staff = userWithRole(UserRole.STAFF);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(staff);

        assertThatThrownBy(() -> controller.getTaxStatistics("2026-09", null, session))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("급여 관리 권한이 없습니다");
        verify(salaryManagementService, never()).getTaxStatistics(any(), any());
    }

    @Test
    @DisplayName("saveSalaryConfig — STAFF + SALARY_MANAGE 없음 → ForbiddenException")
    void saveSalaryConfig_staff_forbidden() {
        User staff = userWithRole(UserRole.STAFF);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(staff);

        Map<String, Object> body = new HashMap<>();
        body.put("configType", "TAX_RATE");
        body.put("configValue", "0.033");
        body.put("description", "세율");

        assertThatThrownBy(() -> controller.saveSalaryConfig(body, session))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("급여 관리 권한이 없습니다");
        verify(commonCodeService, never()).getCommonCodeByGroupAndValue(any(), any());
    }

    @Test
    @DisplayName("getTaxDetails — ADMIN → 허용 (role.isAdmin 단락)")
    void getTaxDetails_admin_allowed() {
        User admin = userWithRole(UserRole.ADMIN);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);
        when(salaryManagementService.getTaxDetails(10L)).thenReturn(Map.of("calculationId", 10L));

        ResponseEntity<?> response = controller.getTaxDetails(10L, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(salaryManagementService).getTaxDetails(10L);
    }

    @Test
    @DisplayName("calculateTax — ADMIN → 허용 (서비스 호출)")
    void calculateTax_admin_allowed() {
        User admin = userWithRole(UserRole.ADMIN);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);

        SalaryTaxCalculation created = new SalaryTaxCalculation();
        created.setId(99L);
        created.setCalculationId(10L);
        created.setTaxType("ADDITIONAL_TAX");
        created.setTaxAmount(new BigDecimal("30000"));
        created.setTaxRate(new BigDecimal("0.03"));
        when(salaryManagementService.calculateAdditionalTax(any(TaxCalculateRequest.class)))
                .thenReturn(created);

        ResponseEntity<?> response = controller.calculateTax(sampleTaxRequest(), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        verify(salaryManagementService).calculateAdditionalTax(any(TaxCalculateRequest.class));
    }

    @Test
    @DisplayName("saveSalaryConfig — ADMIN → 허용 (공통코드 저장)")
    void saveSalaryConfig_admin_allowed() {
        User admin = userWithRole(UserRole.ADMIN);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);

        CommonCode existing = new CommonCode();
        existing.setId(7L);
        existing.setCodeGroup("SALARY_CONFIG");
        existing.setCodeValue("TAX_RATE");
        existing.setCodeLabel("세율");
        existing.setCodeDescription("0.03");
        existing.setSortOrder(1);
        when(commonCodeService.getCommonCodeByGroupAndValue("SALARY_CONFIG", "TAX_RATE"))
                .thenReturn(existing);

        Map<String, Object> body = new HashMap<>();
        body.put("configType", "TAX_RATE");
        body.put("configValue", "0.033");
        body.put("description", "세율");

        ResponseEntity<?> response = controller.saveSalaryConfig(body, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(commonCodeService).updateCommonCode(eq(7L), any());
    }
}
