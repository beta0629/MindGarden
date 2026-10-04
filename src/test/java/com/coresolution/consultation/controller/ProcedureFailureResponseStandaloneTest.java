package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import com.coresolution.consultation.constant.ProcedureUserFacingMessages;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PayrollPeriodConfirmService;
import com.coresolution.consultation.service.PlSqlDiscountAccountingService;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.consultation.service.PlSqlStatisticsService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.SalaryExportService;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.consultation.service.SalaryScheduleService;
import com.coresolution.consultation.service.StatisticsSchedulerService;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 통계·할인 프로시저가 내부 success:false 를 주거나 예외를 던지면 바깥 응답도 success:false + 한글 문구인지.
 * 실제 컨트롤러 + {@link GlobalExceptionHandler} 로 검증한다(standalone MockMvc).
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("프로시저 실패 → 바깥 success:false")
class ProcedureFailureResponseStandaloneTest {

    private static final String TENANT = "proc-failure-standalone-tenant-01";
    private static final String RAW_SQL_ERROR = "Parameter number 4 is not an OUT parameter";

    @Mock
    private SalaryManagementService salaryManagementService;
    @Mock
    private PlSqlSalaryManagementService plSqlSalaryManagementService;
    @Mock
    private PayrollPeriodConfirmService payrollPeriodConfirmService;
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
    @Mock
    private com.coresolution.consultation.service.AuditLogService auditLogService;
    @Mock
    private com.coresolution.consultation.repository.SalaryCalculationRepository salaryCalculationRepository;
    @Mock
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    @Mock
    private PlSqlDiscountAccountingService plSqlDiscountAccountingService;
    @Mock
    private PlSqlStatisticsService plSqlStatisticsService;
    @Mock
    private StatisticsSchedulerService statisticsSchedulerService;

    @Mock
    private ResourceOwnerAccessGuard resourceOwnerAccessGuard;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        SalaryManagementController salaryController = new SalaryManagementController(
                salaryManagementService, plSqlSalaryManagementService, salaryScheduleService,
                commonCodeService, dynamicPermissionService, roleCommonCodeAuthorizationService,
                salaryExportService, auditLogService, salaryCalculationRepository, objectMapper,
                payrollPeriodConfirmService, resourceOwnerAccessGuard);
        mockMvc = MockMvcBuilders.standaloneSetup(
                        salaryController,
                        new PlSqlDiscountAccountingController(plSqlDiscountAccountingService),
                        new StatisticsManagementController(plSqlStatisticsService, statisticsSchedulerService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        lenient().when(dynamicPermissionService.hasPermission(any(User.class), eq("SALARY_MANAGE")))
                .thenReturn(true);
    }

    private User adminUser() {
        User user = new User();
        user.setId(1L);
        user.setUserId("admin-proc-failure");
        user.setEmail("admin@proc-failure.test");
        user.setName("통계관리자");
        user.setTenantId(TENANT);
        user.setRole(UserRole.ADMIN);
        return user;
    }

    private static Map<String, Object> innerFailure() {
        Map<String, Object> failed = new HashMap<>();
        failed.put("success", false);
        failed.put("message", "급여 통계 조회 중 오류가 발생했습니다: " + RAW_SQL_ERROR);
        return failed;
    }

    @Test
    @DisplayName("급여 통계: 내부 success:false → 500, 바깥 success:false, 한글 문구, SQL 원문 없음")
    void salaryStatistics_innerFalse_outerFalse() throws Exception {
        when(plSqlSalaryManagementService.getIntegratedSalaryStatistics(isNull(), any(LocalDate.class),
                any(LocalDate.class))).thenReturn(innerFailure());

        mockMvc.perform(get("/api/v1/admin/salary/statistics")
                        .param("startDate", "2026-09-01")
                        .param("endDate", "2026-09-30")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("PROCEDURE_FAILED"))
                .andExpect(jsonPath("$.message").value(ProcedureUserFacingMessages.SALARY_STATISTICS_FAILED))
                .andExpect(content().string(not(containsString(RAW_SQL_ERROR))));
    }

    @Test
    @DisplayName("급여 통계: 서비스가 SQLException 을 감싸 던지면 바깥 success:false")
    void salaryStatistics_sqlException_outerFalse() throws Exception {
        when(plSqlSalaryManagementService.getIntegratedSalaryStatistics(isNull(), any(LocalDate.class),
                any(LocalDate.class))).thenThrow(new RuntimeException(RAW_SQL_ERROR, new SQLException(RAW_SQL_ERROR)));

        mockMvc.perform(get("/api/v1/admin/salary/statistics")
                        .param("startDate", "2026-09-01")
                        .param("endDate", "2026-09-30")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(ProcedureUserFacingMessages.SALARY_STATISTICS_FAILED))
                .andExpect(content().string(not(containsString(RAW_SQL_ERROR))));
    }

    @Test
    @DisplayName("급여 통계: 성공 경로는 기존과 같이 200 + data")
    void salaryStatistics_success_unchanged() throws Exception {
        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        ok.put("message", "급여 통계 조회 완료");
        ok.put("totalCalculations", 4);
        ok.put("totalNetSalary", new BigDecimal("120000.00"));
        when(plSqlSalaryManagementService.getIntegratedSalaryStatistics(isNull(), any(LocalDate.class),
                any(LocalDate.class))).thenReturn(ok);

        mockMvc.perform(get("/api/v1/admin/salary/statistics")
                        .param("startDate", "2026-09-01")
                        .param("endDate", "2026-09-30")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.totalCalculations").value(4));
    }

    @Test
    @DisplayName("할인 통계: 내부 success:false → 바깥 success:false + 한글 문구")
    void discountStatistics_innerFalse_outerFalse() throws Exception {
        when(plSqlDiscountAccountingService.getDiscountStatistics(anyString(), anyString(), anyString()))
                .thenReturn(innerFailure());

        mockMvc.perform(get("/api/v1/admin/plsql-discount-accounting/statistics")
                        .param("branchCode", "B1")
                        .param("startDate", "2026-09-01")
                        .param("endDate", "2026-09-30"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(ProcedureUserFacingMessages.DISCOUNT_STATISTICS_FAILED))
                .andExpect(content().string(not(containsString(RAW_SQL_ERROR))));
    }

    @Test
    @DisplayName("할인 통계: 예외 → 바깥 success:false, 예외 원문 없음")
    void discountStatistics_exception_outerFalse() throws Exception {
        when(plSqlDiscountAccountingService.getDiscountStatistics(anyString(), anyString(), anyString()))
                .thenThrow(new IllegalStateException(RAW_SQL_ERROR));

        mockMvc.perform(get("/api/v1/admin/plsql-discount-accounting/statistics")
                        .param("branchCode", "B1")
                        .param("startDate", "2026-09-01")
                        .param("endDate", "2026-09-30"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(ProcedureUserFacingMessages.DISCOUNT_STATISTICS_FAILED))
                .andExpect(content().string(not(containsString(RAW_SQL_ERROR))));
    }

    @Test
    @DisplayName("할인 통계: 성공 경로는 서비스 결과 그대로 200")
    void discountStatistics_success_unchanged() throws Exception {
        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        ok.put("totalDiscounts", 1000);
        when(plSqlDiscountAccountingService.getDiscountStatistics(anyString(), anyString(), anyString()))
                .thenReturn(ok);

        mockMvc.perform(get("/api/v1/admin/plsql-discount-accounting/statistics")
                        .param("branchCode", "B1")
                        .param("startDate", "2026-09-01")
                        .param("endDate", "2026-09-30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.totalDiscounts").value(1000));
    }

    @Test
    @DisplayName("상담사 성과 갱신: 서비스가 ERROR 문자열 → 바깥 success:false")
    void consultantPerformance_errorText_outerFalse() throws Exception {
        when(plSqlStatisticsService.updateAllConsultantPerformance(any(LocalDate.class)))
                .thenReturn("ERROR: " + RAW_SQL_ERROR);

        mockMvc.perform(post("/api/v1/admin/statistics-management/consultant-performance/update")
                        .param("date", "2026-09-30"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(ProcedureUserFacingMessages.CONSULTANT_PERFORMANCE_FAILED))
                .andExpect(content().string(not(containsString(RAW_SQL_ERROR))));
    }

    @Test
    @DisplayName("상담사 성과 갱신: SUCCESS 문자열은 기존과 같이 200 + success:true")
    void consultantPerformance_success_unchanged() throws Exception {
        when(plSqlStatisticsService.updateAllConsultantPerformance(any(LocalDate.class)))
                .thenReturn("SUCCESS: 3건");

        mockMvc.perform(post("/api/v1/admin/statistics-management/consultant-performance/update")
                        .param("date", "2026-09-30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.result").value("SUCCESS: 3건"));
    }
}
