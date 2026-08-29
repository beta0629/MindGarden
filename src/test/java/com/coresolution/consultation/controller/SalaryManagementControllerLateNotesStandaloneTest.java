package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.SalaryExportService;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.consultation.service.SalaryScheduleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 늦은 회기 Recalc/Adjustment API 숫자·거절 시나리오 (standalone MockMvc).
 * SpringBootTest/logback 환경과 무관하게 컨트롤러 계약을 검증한다.
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SalaryManagementController 늦은 회기 Recalc/Adjustment")
class SalaryManagementControllerLateNotesStandaloneTest {

    private static final String TENANT_A = "sma-late-notes-standalone-tenant-01";

    @Mock
    private SalaryManagementService salaryManagementService;

    @Mock
    private PlSqlSalaryManagementService plSqlSalaryManagementService;

    @Mock
    private SalaryScheduleService salaryScheduleService;

    @Mock
    private CommonCodeService commonCodeService;

    @Mock
    private DynamicPermissionService dynamicPermissionService;

    @Mock
    private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;

    @Mock
    private SalaryExportService salaryExportService;

    @InjectMocks
    private SalaryManagementController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        lenient().when(dynamicPermissionService.hasPermission(any(User.class), eq("SALARY_MANAGE")))
                .thenReturn(true);
    }

    private User adminUser() {
        User user = new User();
        user.setId(1L);
        user.setUserId("admin-salary");
        user.setEmail("admin@salary.test");
        user.setName("급여관리자");
        user.setTenantId(TENANT_A);
        user.setRole(UserRole.ADMIN);
        return user;
    }

    @Test
    @DisplayName("I-LATE-01: Confirm 2×30000=60000 후 Recalc → completed=3, earnings=90000, same id")
    void postRecalc_afterLateSession_returns90000SameId() throws Exception {
        when(plSqlSalaryManagementService.processIntegratedSalaryCalculation(
                eq(1L), any(LocalDate.class), any(LocalDate.class), any()))
                .thenReturn(Map.of(
                        "success", true,
                        "calculationId", 501L,
                        "completedConsultations", 2,
                        "grossSalary", new BigDecimal("60000.00")));

        mockMvc.perform(post("/api/v1/admin/salary/confirm")
                        .param("consultantId", "1")
                        .param("periodStart", "2026-08-01")
                        .param("periodEnd", "2026-08-31")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.grossSalary").value(60000.00))
                .andExpect(jsonPath("$.data.calculationId").value(501));

        when(plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(eq(501L), eq(TENANT_A), any()))
                .thenReturn(Map.of(
                        "success", true,
                        "calculationId", 501L,
                        "completedConsultations", 3,
                        "grossSalary", new BigDecimal("90000.00"),
                        "netSalary", new BigDecimal("87030.00"),
                        "taxAmount", new BigDecimal("2970.00")));

        mockMvc.perform(post("/api/v1/admin/salary/recalc/501")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.calculationId").value(501))
                .andExpect(jsonPath("$.data.completedConsultations").value(3))
                .andExpect(jsonPath("$.data.grossSalary").value(90000.00));
    }

    @Test
    @DisplayName("I-LATE-02: PAID 후 Adjust → ADJUSTMENT 30000/tax990; 2nd adjust refuses")
    void postAdjustment_paidThenDelta_thenSecondRefuses() throws Exception {
        when(plSqlSalaryManagementService.insertSalaryAdjustmentForLateSessions(eq(901L), eq(TENANT_A), any()))
                .thenReturn(Map.of(
                        "success", true,
                        "calculationId", 902L,
                        "parentCalculationId", 901L,
                        "completedConsultations", 1,
                        "grossSalary", new BigDecimal("30000.00"),
                        "taxAmount", new BigDecimal("990.00"),
                        "netSalary", new BigDecimal("29010.00")));

        mockMvc.perform(post("/api/v1/admin/salary/adjustment/901")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.calculationId").value(902))
                .andExpect(jsonPath("$.data.parentCalculationId").value(901))
                .andExpect(jsonPath("$.data.completedConsultations").value(1))
                .andExpect(jsonPath("$.data.grossSalary").value(30000.00))
                .andExpect(jsonPath("$.data.taxAmount").value(990.00));

        when(plSqlSalaryManagementService.insertSalaryAdjustmentForLateSessions(eq(901L), eq(TENANT_A), any()))
                .thenReturn(Map.of("success", false, "message", "추가 완료 회기가 없습니다"));

        mockMvc.perform(post("/api/v1/admin/salary/adjustment/901")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("I-LATE-03: adjustment 존재 후에도 2nd PRIMARY confirm refuses")
    void postConfirm_secondPrimary_refuses() throws Exception {
        when(plSqlSalaryManagementService.processIntegratedSalaryCalculation(
                eq(1L), any(LocalDate.class), any(LocalDate.class), any()))
                .thenReturn(Map.of(
                        "success", false,
                        "message", "동일 상담사·동일 월(2026-08)에 급여 확정이 이미 있습니다. 중복 확정은 불가합니다."));

        mockMvc.perform(post("/api/v1/admin/salary/confirm")
                        .param("consultantId", "1")
                        .param("periodStart", "2026-08-01")
                        .param("periodEnd", "2026-08-31")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("I-LATE-04: Recalc on PAID refuses; Adjust on CALCULATED refuses")
    void postRecalcPaidAndAdjustCalculated_refuse() throws Exception {
        when(plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(eq(88L), eq(TENANT_A), any()))
                .thenReturn(Map.of(
                        "success", false,
                        "message", "지급 완료된 급여는 재계산할 수 없습니다. 추가 정산을 사용하세요."));

        mockMvc.perform(post("/api/v1/admin/salary/recalc/88")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                .andExpect(status().isBadRequest());

        when(plSqlSalaryManagementService.insertSalaryAdjustmentForLateSessions(eq(10L), eq(TENANT_A), any()))
                .thenReturn(Map.of(
                        "success", false,
                        "message", "추가 정산은 지급완료(PAID) 급여에만 가능합니다."));

        mockMvc.perform(post("/api/v1/admin/salary/adjustment/10")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("I-LATE-05: GET /pre-confirm-warning 정보만 반환")
    void getPreConfirmWarning_returnsCounts() throws Exception {
        when(plSqlSalaryManagementService.getSalaryPreConfirmWarning(
                eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Map.of(
                        "success", true,
                        "notCompletedCount", 2,
                        "missingRecordCount", 1,
                        "extraCompletedCount", 0,
                        "currentCompletedCount", 3,
                        "storedCompletedCount", 0));

        mockMvc.perform(get("/api/v1/admin/salary/pre-confirm-warning")
                        .param("consultantId", "1")
                        .param("periodStart", "2026-08-01")
                        .param("periodEnd", "2026-08-31")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.notCompletedCount").value(2))
                .andExpect(jsonPath("$.data.missingRecordCount").value(1));
    }
}
