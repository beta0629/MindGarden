package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Constructor;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.PlSqlDiscountAccountingService;
import com.coresolution.consultation.service.SalaryBatchService;
import com.coresolution.consultation.service.SalaryScheduleService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 테넌트 단위 관리자 API(PL/SQL 할인 상태·통계·무결성 검증, 급여 배치 상태·실행 가능 여부, 급여 계산 방식 변경) 가드 매트릭스.
 *
 * <p>미인증 401 · 내담자/상담사 403 · 다른 테넌트 관리자 403 · 같은 테넌트 관리자 200 을 확인한다.
 * 거부 경로에서는 서비스(프로시저 포함)가 한 번도 호출되지 않는지 확인한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("할인 통계·급여 배치 — 테넌트 관리자 공통 가드 매트릭스")
class TenantAdminDiscountSalaryGuardMvcTest {

    private static final String TENANT_A = "tenant-stats-a";
    private static final String TENANT_B = "tenant-stats-b";
    private static final String TENANT_NO_BRANCH = "tenant-stats-no-branch";
    private static final long ADMIN_NO_BRANCH = 950L;
    private static final String BRANCH_A = "BR-A";
    private static final long ADMIN_A = 1L;
    private static final long CLIENT_A = 2L;
    private static final long CONSULTANT_A = 30L;
    private static final long ADMIN_B = 900L;
    private static final String PLSQL = "/api/v1/admin/plsql-discount-accounting";
    private static final String SALARY_BATCH = "/api/v1/admin/salary-batch";
    private static final String SALARY_CONFIG = "/api/v1/admin/salary-config";
    private static final String TARGET_DATE = "2026-09-30";

    private PlSqlDiscountAccountingService plSqlDiscountAccountingService;
    private SalaryBatchService salaryBatchService;
    private CommonCodeService commonCodeService;
    private SalaryScheduleService salaryScheduleService;
    private BranchRepository branchRepository;
    private MockMvc mockMvc;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        plSqlDiscountAccountingService = mock(PlSqlDiscountAccountingService.class);
        salaryBatchService = mock(SalaryBatchService.class);
        commonCodeService = mock(CommonCodeService.class);
        salaryScheduleService = mock(SalaryScheduleService.class);
        branchRepository = mock(BranchRepository.class);
        ObjectProvider<BranchRepository> branchProvider = mock(ObjectProvider.class);
        when(branchProvider.getIfAvailable()).thenReturn(branchRepository);

        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), mock(UserRepository.class));
        ResourceOwnerAccessGuard ownerGuard = build(ResourceOwnerAccessGuard.class, clientGuard, branchProvider);
        Object[] provided = {ownerGuard, plSqlDiscountAccountingService, salaryBatchService, commonCodeService,
            salaryScheduleService};
        mockMvc = MockMvcBuilders.standaloneSetup(
                build(PlSqlDiscountAccountingController.class, provided),
                build(SalaryBatchController.class, provided),
                build(SalaryConfigController.class, provided))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        Branch branchA = mock(Branch.class);
        when(branchA.getBranchCode()).thenReturn(BRANCH_A);
        when(branchRepository.findByTenantIdAndBranchCodeAndIsDeletedFalse(TENANT_A, BRANCH_A))
            .thenReturn(Optional.of(branchA));
        when(branchRepository.existsByTenantIdAndIsDeletedFalse(TENANT_A)).thenReturn(true);
        when(branchRepository.existsByTenantIdAndIsDeletedFalse(TENANT_B)).thenReturn(true);
        stubServices();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("미인증 — 모든 엔드포인트 401, 서비스·프로시저 미호출")
    void anonymous_unauthorized() throws Exception {
        for (String[] e : endpoints()) {
            mockMvc.perform(req(e, null, null))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.data").doesNotExist());
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("같은 테넌트 내담자·상담사 — 모든 엔드포인트 403, 데이터 없음, 서비스·프로시저 미호출")
    void clientAndConsultant_forbidden() throws Exception {
        for (User caller : List.of(user(CLIENT_A, UserRole.CLIENT, TENANT_A),
                user(CONSULTANT_A, UserRole.CONSULTANT, TENANT_A))) {
            for (String[] e : endpoints()) {
                assertSharedDenial(mockMvc.perform(req(e, caller, null)));
            }
        }
        verifyNoServiceCalls();
        verifyNoInteractions(branchRepository);
    }

    @Test
    @DisplayName("다른 테넌트 관리자 — A 테넌트 지점 무결성 검증 403, 요청 컨텍스트 테넌트가 세션과 다르면 전부 403")
    void otherTenantAdmin_forbidden() throws Exception {
        User adminB = user(ADMIN_B, UserRole.ADMIN, TENANT_B);
        assertSharedDenial(mockMvc.perform(req(validateIntegrity(BRANCH_A), adminB, null)));
        for (String[] e : endpoints()) {
            mockMvc.perform(req(e, adminB, TENANT_A))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data").doesNotExist());
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("같은 테넌트 관리자라도 세션 테넌트에 없는 지점·지점 누락 — 무결성 검증 공통 403, 프로시저 미호출")
    void ownTenantAdmin_unknownBranch_sharedDenial() throws Exception {
        User adminA = user(ADMIN_A, UserRole.ADMIN, TENANT_A);
        assertSharedDenial(mockMvc.perform(req(validateIntegrity("BR-OTHER"), adminA, null)));
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("같은 테넌트 관리자 — 모든 엔드포인트 200, 무결성 검증은 세션 테넌트에서 확인한 지점 코드로 호출")
    void ownTenantAdmin_ok() throws Exception {
        User adminA = user(ADMIN_A, UserRole.ADMIN, TENANT_A);
        for (String[] e : endpoints()) {
            mockMvc.perform(req(e, adminA, null)).andExpect(status().isOk());
        }
        verify(plSqlDiscountAccountingService).validateDiscountIntegrity(BRANCH_A);
        verify(plSqlDiscountAccountingService).getDiscountStatistics(anyString(), anyString(), anyString());
        verify(salaryBatchService).executeMonthlySalaryBatch(eq(2026), eq(9), isNull());
        verify(commonCodeService).updateCodeExtraData(eq("SALARY_CALCULATION_METHOD"), eq("HOURLY_RATE"),
            anyString());
    }

    @Test
    @DisplayName("지점이 0개인 테넌트 관리자 — 무결성 검증 200(지점 범위 없음), 지점 코드만 받는 프로시저는 미호출")
    void zeroBranchTenantAdmin_okWithoutProcedure() throws Exception {
        User admin = user(ADMIN_NO_BRANCH, UserRole.ADMIN, TENANT_NO_BRANCH);
        for (String code : List.of(BRANCH_A, "ANY")) {
            mockMvc.perform(req(validateIntegrity(code), admin, null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.branchScoped").value(false))
                .andExpect(jsonPath("$.errorCount").value(0));
        }
        verify(plSqlDiscountAccountingService, never()).validateDiscountIntegrity(any());
        verify(branchRepository, never()).findByTenantIdAndBranchCodeAndIsDeletedFalse(anyString(), anyString());
    }

    @Test
    @DisplayName("지점 존재 조회가 DB 오류(지점 뷰 권한 없음 등) — 500·예외 문구 없이 200(지점 범위 없음), 프로시저 미호출")
    void branchLookupDbError_okWithoutProcedure() throws Exception {
        String dbError = "Access denied for user 'leak-check'";
        when(branchRepository.existsByTenantIdAndIsDeletedFalse(TENANT_NO_BRANCH))
            .thenThrow(new JpaSystemException(new RuntimeException(dbError)));
        User admin = user(ADMIN_NO_BRANCH, UserRole.ADMIN, TENANT_NO_BRANCH);
        String body = mockMvc.perform(req(validateIntegrity(BRANCH_A), admin, null))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.branchScoped").value(false))
            .andExpect(jsonPath("$.errorCount").value(0))
            .andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain(dbError).doesNotContain("JpaSystemException");
        verify(plSqlDiscountAccountingService, never()).validateDiscountIntegrity(any());
        verify(branchRepository, never()).findByTenantIdAndBranchCodeAndIsDeletedFalse(anyString(), anyString());
    }

    @Test
    @DisplayName("지점이 0개인 테넌트의 내담자 — 무결성 검증 403 (관리자 확인이 먼저)")
    void zeroBranchTenantClient_forbidden() throws Exception {
        assertSharedDenial(mockMvc.perform(
            req(validateIntegrity("ANY"), user(951L, UserRole.CLIENT, TENANT_NO_BRANCH), null)));
        verifyNoServiceCalls();
        verifyNoInteractions(branchRepository);
    }

    @Test
    @DisplayName("급여 배치 상태 — 마지막 실행일·메시지가 null 이어도 200 (Map.of NPE → 500 회귀)")
    void salaryBatchStatus_nullFields_ok() throws Exception {
        SalaryBatchService.BatchStatus empty = new SalaryBatchService.BatchStatus("PENDING");
        when(salaryBatchService.getBatchStatus(anyInt(), anyInt())).thenReturn(empty);
        mockMvc.perform(req(new String[] {"GET", SALARY_BATCH + "/status?targetDate=" + TARGET_DATE, null},
                user(ADMIN_A, UserRole.ADMIN, TENANT_A), null))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("PENDING"))
            .andExpect(jsonPath("$.data.lastExecuted").doesNotExist())
            .andExpect(jsonPath("$.data.message").doesNotExist());
    }

    @Test
    @DisplayName("급여 배치 실행 — 비관리자는 본문이 비었거나 틀려도 403(입력 검증보다 권한 먼저), 서비스 미호출")
    void salaryBatchExecute_nonAdmin_forbiddenBeforeValidation() throws Exception {
        List<String> bodies = Arrays.asList(null, "{}", "{\"targetMonth\":\"bad\"}", "{\"targetMonth\":7}");
        for (User caller : List.of(user(CLIENT_A, UserRole.CLIENT, TENANT_A),
                user(CONSULTANT_A, UserRole.CONSULTANT, TENANT_A))) {
            for (String body : bodies) {
                assertSharedDenial(mockMvc.perform(req(new String[] {"POST", SALARY_BATCH + "/execute", body},
                    caller, null)));
            }
        }
        for (String body : bodies) {
            mockMvc.perform(req(new String[] {"POST", SALARY_BATCH + "/execute", body}, null, null))
                .andExpect(status().isUnauthorized());
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("급여 배치 실행 — 관리자라도 대상 월 형식이 틀리면 400 공용 문구, 서비스 미호출")
    void salaryBatchExecute_admin_invalidMonth_badRequest() throws Exception {
        User adminA = user(ADMIN_A, UserRole.ADMIN, TENANT_A);
        for (String body : Arrays.asList(null, "{}", "{\"targetMonth\":\"2026-13\"}", "{\"targetMonth\":\"x-y\"}")) {
            mockMvc.perform(req(new String[] {"POST", SALARY_BATCH + "/execute", body}, adminA, null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(SalaryBatchController.INVALID_TARGET_MONTH));
        }
        verifyNoInteractions(salaryBatchService);
    }

    private static List<String[]> endpoints() {
        return List.of(
            new String[] {"GET", PLSQL + "/status", null},
            new String[] {"GET", PLSQL + "/statistics?branchCode=x&startDate=2026-09-01&endDate=2026-09-30", null},
            validateIntegrity(BRANCH_A),
            new String[] {"GET", SALARY_BATCH + "/status?targetDate=" + TARGET_DATE, null},
            new String[] {"GET", SALARY_BATCH + "/can-execute?targetDate=" + TARGET_DATE, null},
            new String[] {"POST", SALARY_BATCH + "/execute", "{\"targetMonth\":\"2026-09\"}"},
            new String[] {"PUT", SALARY_CONFIG + "/calculation-method",
                "{\"methodCode\":\"HOURLY_RATE\",\"ratePerConsultation\":1,\"defaultHourlyRate\":1}"});
    }

    private static String[] validateIntegrity(String branchCode) {
        return new String[] {"GET", PLSQL + "/validate-integrity?branchCode=" + branchCode, null};
    }

    private void stubServices() {
        Map<String, Object> procedureOk = Map.of("success", true);
        when(plSqlDiscountAccountingService.getDiscountStatistics(anyString(), anyString(), anyString()))
            .thenReturn(procedureOk);
        when(plSqlDiscountAccountingService.validateDiscountIntegrity(anyString())).thenReturn(procedureOk);
        SalaryBatchService.BatchStatus batchStatus = new SalaryBatchService.BatchStatus("PENDING");
        batchStatus.setLastExecuted(LocalDate.parse(TARGET_DATE));
        batchStatus.setMessage("ok");
        when(salaryBatchService.getBatchStatus(anyInt(), anyInt())).thenReturn(batchStatus);
        when(salaryBatchService.canExecuteBatch(any())).thenReturn(true);
        when(salaryBatchService.executeMonthlySalaryBatch(anyInt(), anyInt(), any()))
            .thenReturn(new SalaryBatchService.BatchResult(true, "ok", 0, 0, 0));
    }

    private void verifyNoServiceCalls() {
        verifyNoInteractions(plSqlDiscountAccountingService, salaryBatchService, commonCodeService,
            salaryScheduleService);
    }

    private ResultActions assertSharedDenial(ResultActions result) throws Exception {
        return result.andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE))
            .andExpect(jsonPath("$.data").doesNotExist());
    }

    /** contextTenantId 가 있으면 필터가 세션과 다른 테넌트 컨텍스트를 잡은 상황(헤더 위조 등)을 흉내 낸다. */
    private static MockHttpServletRequestBuilder req(String[] endpoint, User caller, String contextTenantId) {
        String[] pathAndQuery = endpoint[1].split("\\?", 2);
        MockHttpServletRequestBuilder builder = request(HttpMethod.valueOf(endpoint[0]), pathAndQuery[0]);
        if (pathAndQuery.length > 1) {
            for (String pair : pathAndQuery[1].split("&")) {
                String[] kv = pair.split("=", 2);
                builder.param(kv[0], kv.length > 1 ? kv[1] : "");
            }
        }
        if (caller != null) {
            MockHttpSession session = new MockHttpSession();
            session.setAttribute(SessionConstants.USER_OBJECT, caller);
            session.setAttribute(SessionConstants.TENANT_ID, caller.getTenantId());
            String tenant = contextTenantId != null ? contextTenantId : caller.getTenantId();
            builder.session(session).with(r -> {
                TenantContextHolder.setTenantId(tenant);
                return r;
            });
        }
        if (endpoint[2] != null) {
            builder.contentType(MediaType.APPLICATION_JSON).content(endpoint[2]);
        }
        return builder;
    }

    private static User user(long id, UserRole role, String tenantId) {
        User u = new User();
        u.setId(id);
        u.setUserId("u-" + id);
        u.setRole(role);
        u.setTenantId(tenantId);
        return u;
    }

    private static <T> T build(Class<T> type, Object... provided) throws Exception {
        Constructor<?> ctor = Arrays.stream(type.getDeclaredConstructors())
            .max(Comparator.comparingInt(Constructor::getParameterCount))
            .orElseThrow();
        Object[] args = Arrays.stream(ctor.getParameterTypes())
            .map(p -> Arrays.stream(provided).filter(p::isInstance).findFirst().orElseGet(() -> mock(p)))
            .toArray();
        ctor.setAccessible(true);
        return type.cast(ctor.newInstance(args));
    }
}
