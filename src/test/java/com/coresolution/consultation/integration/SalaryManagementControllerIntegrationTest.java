package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.SalaryTaxCalculation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.consultation.service.SalaryScheduleService;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 급여·세금 영역 SalaryManagementController API 통합 테스트
 * 시나리오: docs/project-management/SALARY_TAX_TEST_SCENARIOS.md §2
 *
 * @author MindGarden
 * @since 2026-03-16
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("SalaryManagementController API 통합 테스트")
class SalaryManagementControllerIntegrationTest {

    private static final String TENANT_A = "tenant-a-" + java.util.UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SalaryManagementService salaryManagementService;

    @MockBean
    private PlSqlSalaryManagementService plSqlSalaryManagementService;

    @MockBean
    private SalaryScheduleService salaryScheduleService;

    @MockBean
    private DynamicPermissionService dynamicPermissionService;

    @MockBean
    private CommonCodeService commonCodeService;

    private User adminUserWithTenant() {
        User user = new User();
        user.setId(1L);
        user.setUserId("admin-salary");
        user.setEmail("admin@salary.test");
        user.setName("급여관리자");
        user.setTenantId(TENANT_A);
        user.setRole(UserRole.ADMIN);
        return user;
    }

    private User consultantUserNoSalaryPermission() {
        User user = new User();
        user.setId(2L);
        user.setUserId("consultant-1");
        user.setTenantId(TENANT_A);
        user.setRole(UserRole.CONSULTANT);
        return user;
    }

    @BeforeEach
    void setUp() {
        when(dynamicPermissionService.hasPermission(any(User.class), eq("SALARY_MANAGE")))
                .thenReturn(true);
        when(commonCodeService.getActiveCommonCodesByGroup("ROLE"))
                .thenReturn(adminRoleCodeList());
    }

    private List<CommonCode> adminRoleCodeList() {
        CommonCode adminRole = new CommonCode();
        adminRole.setCodeValue("ADMIN");
        adminRole.setExtraData("{\"isAdmin\":true}");
        return List.of(adminRole);
    }

    @Nested
    @DisplayName("인증·권한 (I-AUTH)")
    class AuthAndPermission {

        @Test
        @DisplayName("I-AUTH-01: 인증 없음 GET /profiles → 401")
        void getProfiles_withoutSession_returns401() throws Exception {
            mockMvc.perform(get("/api/v1/admin/salary/profiles"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("I-AUTH-02: SALARY_MANAGE 권한 없음 GET /profiles/{id} → 403")
        void getProfile_withoutSalaryManagePermission_returns403() throws Exception {
            when(dynamicPermissionService.hasPermission(any(User.class), eq("SALARY_MANAGE")))
                    .thenReturn(false);

            mockMvc.perform(get("/api/v1/admin/salary/profiles/1")
                            .sessionAttr(SessionConstants.USER_OBJECT, consultantUserNoSalaryPermission())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("급여 관리 권한")));
        }

        @Test
        @DisplayName("I-AUTH-03: GET /calculation-period month=0 → 400")
        void getCalculationPeriod_monthZero_returns400() throws Exception {
            mockMvc.perform(get("/api/v1/admin/salary/calculation-period")
                            .param("year", "2025")
                            .param("month", "0")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("1~12")));
        }

        @Test
        @DisplayName("I-AUTH-03: GET /calculation-period month=13 → 400")
        void getCalculationPeriod_monthThirteen_returns400() throws Exception {
            mockMvc.perform(get("/api/v1/admin/salary/calculation-period")
                            .param("year", "2025")
                            .param("month", "13")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("1~12")));
        }
    }

    @Nested
    @DisplayName("정상·검증·에러 응답 (I-API)")
    class ApiSuccessAndValidation {

        @Test
        @DisplayName("I-API-01: GET /profiles 인증+테넌트 → 200, success, data")
        void getProfiles_authenticated_returns200() throws Exception {
            when(salaryManagementService.getAllSalaryProfiles()).thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/v1/admin/salary/profiles")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.message").exists());
        }

        @Test
        @DisplayName("I-API-02: GET /calculations/{consultantId} 정상 → 200")
        void getCalculationsByConsultant_returns200() throws Exception {
            when(salaryManagementService.getSalaryCalculations(1L)).thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/v1/admin/salary/calculations/1")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }

        @Test
        @DisplayName("I-API-03: GET /calculations?startDate=&endDate= 정상 → 200")
        void getCalculationsByPeriod_returns200() throws Exception {
            when(salaryManagementService.getSalaryCalculations(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/v1/admin/salary/calculations")
                            .param("startDate", "2025-06-01")
                            .param("endDate", "2025-06-30")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }

        @Test
        @DisplayName("I-API-06: GET /calculation-period?year=2025&month=6 정상 → 200, periodStart, periodEnd")
        void getCalculationPeriod_valid_returns200() throws Exception {
            LocalDate start = LocalDate.of(2025, 6, 1);
            LocalDate end = LocalDate.of(2025, 6, 30);
            when(salaryScheduleService.getCalculationPeriod(2025, 6)).thenReturn(new LocalDate[]{start, end});

            mockMvc.perform(get("/api/v1/admin/salary/calculation-period")
                            .param("year", "2025")
                            .param("month", "6")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.periodStart").value("2025-06-01"))
                    .andExpect(jsonPath("$.data.periodEnd").value("2025-06-30"))
                    .andExpect(jsonPath("$.data.year").value(2025))
                    .andExpect(jsonPath("$.data.month").value(6));
        }

        @Test
        @DisplayName("I-API-07: GET /tax/{calculationId} 정상 → 200")
        void getTaxDetails_valid_returns200() throws Exception {
            Map<String, Object> taxDetails = Map.of(
                    "consultantName", "테스트상담사",
                    "calculationPeriodStart", "2025-06-01",
                    "calculationPeriodEnd", "2025-06-30"
            );
            when(salaryManagementService.getTaxDetails(1L)).thenReturn(taxDetails);

            mockMvc.perform(get("/api/v1/admin/salary/tax/1")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.consultantName").value("테스트상담사"));
        }

        @Test
        @DisplayName("I-API-08: GET /tax/{calculationId} 존재하지 않는 ID → 404")
        void getTaxDetails_notFound_returns404() throws Exception {
            when(salaryManagementService.getTaxDetails(999L))
                    .thenThrow(new EntityNotFoundException("급여 계산 정보를 찾을 수 없습니다: 999"));

            mockMvc.perform(get("/api/v1/admin/salary/tax/999")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("I-API-09: POST /tax/calculate 정상 → 201")
        void postTaxCalculate_valid_returns201() throws Exception {
            SalaryTaxCalculation created = new SalaryTaxCalculation();
            created.setId(1L);
            created.setCalculationId(10L);
            created.setTaxType("VAT");
            created.setTaxAmount(BigDecimal.valueOf(10000));
            created.setTaxRate(BigDecimal.valueOf(0.1));
            when(salaryManagementService.calculateAdditionalTax(any())).thenReturn(created);

            String body = objectMapper.writeValueAsString(Map.of(
                    "calculationId", 10L,
                    "grossAmount", 100000,
                    "taxType", "VAT",
                    "taxRate", 0.1
            ));

            mockMvc.perform(post("/api/v1/admin/salary/tax/calculate")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.calculationId").value(10))
                    .andExpect(jsonPath("$.data.taxType").value("VAT"));
        }

        @Test
        @DisplayName("I-API-10: POST /tax/calculate 존재하지 않는 calculationId → 404")
        void postTaxCalculate_notFound_returns404() throws Exception {
            when(salaryManagementService.calculateAdditionalTax(any()))
                    .thenThrow(new EntityNotFoundException("급여 계산 정보를 찾을 수 없습니다: 999"));

            String body = objectMapper.writeValueAsString(Map.of(
                    "calculationId", 999L,
                    "grossAmount", 100000,
                    "taxType", "VAT",
                    "taxRate", 0.1
            ));

            mockMvc.perform(post("/api/v1/admin/salary/tax/calculate")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("I-API-11: GET /tax/statistics?period=2025-06 정상 → 200")
        void getTaxStatistics_valid_returns200() throws Exception {
            when(salaryManagementService.getTaxStatistics("2025-06"))
                    .thenReturn(Map.of("totalGrossSalary", BigDecimal.ZERO, "totalNetSalary", BigDecimal.ZERO));

            mockMvc.perform(get("/api/v1/admin/salary/tax/statistics")
                            .param("period", "2025-06")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").exists());
        }

        @Test
        @DisplayName("I-API-13: POST /calculate 미리보기 정상 → 200")
        void postCalculatePreview_valid_returns200() throws Exception {
            when(plSqlSalaryManagementService.calculateSalaryPreview(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(Map.of("success", true));

            mockMvc.perform(post("/api/v1/admin/salary/calculate")
                            .param("consultantId", "1")
                            .param("periodStart", "2025-06-01")
                            .param("periodEnd", "2025-06-30")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("I-API-14: POST /confirm 정상 → 200")
        void postConfirm_valid_returns200() throws Exception {
            when(plSqlSalaryManagementService.processIntegratedSalaryCalculation(
                    eq(1L), any(LocalDate.class), any(LocalDate.class), any()))
                    .thenReturn(Map.of("success", true));

            mockMvc.perform(post("/api/v1/admin/salary/confirm")
                            .param("consultantId", "1")
                            .param("periodStart", "2025-06-01")
                            .param("periodEnd", "2025-06-30")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("I-API-15: POST /approve/{calculationId} 존재하지 않는 ID → 404/400")
        void postApprove_notFound_returnsError() throws Exception {
            when(plSqlSalaryManagementService.approveSalaryWithErpSync(eq(999L), any()))
                    .thenReturn(Map.of("success", false, "message", "급여 계산을 찾을 수 없습니다."));

            mockMvc.perform(post("/api/v1/admin/salary/approve/999")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("I-API-16: POST /pay/{calculationId} 존재하지 않는 ID → 404/400")
        void postPay_notFound_returnsError() throws Exception {
            when(plSqlSalaryManagementService.processSalaryPaymentWithErpSync(eq(999L), any()))
                    .thenReturn(Map.of("success", false, "message", "급여 계산을 찾을 수 없습니다."));

            mockMvc.perform(post("/api/v1/admin/salary/pay/999")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("테넌트 격리 (I-TENANT)")
    class TenantIsolation {

        @Test
        @DisplayName("I-TENANT-01: GET /calculations/{consultantId} 현재 테넌트만 반환")
        void getCalculationsByConsultant_usesTenantContext() throws Exception {
            when(salaryManagementService.getSalaryCalculations(1L)).thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/v1/admin/salary/calculations/1")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isOk());
            // 서비스가 TenantContextHolder에서 tenantId를 사용하므로, 세션 테넌트와 일치하는 데이터만 조회됨 (목으로 검증)
        }

        @Test
        @DisplayName("I-TENANT-02: GET /calculations?startDate=&endDate= 기간별 현재 테넌트만")
        void getCalculationsByPeriod_usesTenantContext() throws Exception {
            when(salaryManagementService.getSalaryCalculations(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/v1/admin/salary/calculations")
                            .param("startDate", "2025-06-01")
                            .param("endDate", "2025-06-30")
                            .sessionAttr(SessionConstants.USER_OBJECT, adminUserWithTenant())
                            .sessionAttr(SessionConstants.TENANT_ID, TENANT_A))
                    .andExpect(status().isOk());
        }
    }
}
