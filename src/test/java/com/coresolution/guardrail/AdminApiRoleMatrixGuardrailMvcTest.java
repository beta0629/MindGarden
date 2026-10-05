package com.coresolution.guardrail;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Constructor;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.function.BiFunction;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.controller.AdminController;
import com.coresolution.consultation.controller.ConsultationRecordAccessLogAdminController;
import com.coresolution.consultation.controller.SalaryManagementController;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordAccessLogRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.MappingTerminationService;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 가드레일 1 대표 엔드포인트 — 돈(환불·재무 거래)·상담일지 감사 로그·급여 API 가 내담자·상담사·다른 테넌트
 * 관리자 세션에 403 을 돌려주는지 MockMvc 로 고정한다. 실제 공통 가드(ClientPathAccessGuard·ResourceOwnerAccessGuard)를
 * 쓰고 서비스만 mock 한다. 거부 경로에서는 서비스가 호출되지 않아야 한다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("[가드레일1] 대표 관리자 API(돈·상담일지·급여) — 내담자/상담사/타 테넌트 관리자 403")
class AdminApiRoleMatrixGuardrailMvcTest {

    private static final String TENANT_A = "tenant-guardrail-a";
    private static final String TENANT_B = "tenant-guardrail-b";
    private static final long ADMIN_A = 1L;
    private static final long CLIENT_A = 2L;
    private static final long CONSULTANT_A = 30L;
    private static final long ADMIN_B = 900L;
    private static final long CALCULATION_A = 7001L;
    private static final long STAFF_A = 40L;
    private static final long MAPPING_A = 8001L;

    private static final String REFUND_HISTORY = "/api/v1/admin/refund-history";
    private static final String REFUND_STATISTICS = "/api/v1/admin/refund-statistics";
    private static final String FINANCIAL_TRANSACTIONS = "/api/v1/admin/financial-transactions";
    private static final String CONSULTATION_LOG_AUDIT = "/api/v1/admin/consultation-record-access-logs";
    private static final String SALARY_CALCULATIONS =
        "/api/v1/admin/salary/calculations?startDate=2026-09-01&endDate=2026-09-30";
    private static final String SALARY_TAX = "/api/v1/admin/salary/tax/" + CALCULATION_A;
    private static final String MAPPING_TERMINATE = "/api/v1/admin/mappings/" + MAPPING_A + "/terminate";
    private static final String MAPPING_PAYMENT_CANCEL = "/api/v1/admin/mapping/payment/cancel";

    private AdminService adminService;
    private MappingTerminationService mappingTerminationService;
    private ConsultationRecordAccessLogRepository accessLogRepository;
    private SalaryManagementService salaryManagementService;
    private ConsultantClientMappingRepository mappingRepository;
    private MockMvc mockMvc;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        adminService = mock(AdminService.class);
        mappingTerminationService = mock(MappingTerminationService.class);
        accessLogRepository = mock(ConsultationRecordAccessLogRepository.class);
        salaryManagementService = mock(SalaryManagementService.class);
        ObjectProvider<BranchRepository> branchProvider = mock(ObjectProvider.class);
        when(branchProvider.getIfAvailable()).thenReturn(mock(BranchRepository.class));
        mappingRepository = mock(ConsultantClientMappingRepository.class);
        ConsultantClientMapping mappingA = new ConsultantClientMapping();
        mappingA.setId(MAPPING_A);
        when(mappingRepository.findByTenantIdAndId(TENANT_A, MAPPING_A)).thenReturn(Optional.of(mappingA));
        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(mappingRepository, mock(UserRepository.class));
        ResourceOwnerAccessGuard ownerGuard =
            build(ResourceOwnerAccessGuard.class, clientGuard, branchProvider, mappingRepository);
        Object[] provided = {clientGuard, ownerGuard, adminService, mappingTerminationService, accessLogRepository,
            salaryManagementService};
        mockMvc = MockMvcBuilders.standaloneSetup(
                build(AdminController.class, provided),
                build(ConsultationRecordAccessLogAdminController.class, provided),
                build(SalaryManagementController.class, provided))
            .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("같은 테넌트 내담자·상담사 — 돈·상담일지·급여 대표 엔드포인트 전부 403, 서비스 미호출")
    void clientAndConsultant_forbidden() throws Exception {
        for (User caller : List.of(user(CLIENT_A, UserRole.CLIENT, TENANT_A),
                user(CONSULTANT_A, UserRole.CONSULTANT, TENANT_A))) {
            for (String uri : allEndpoints()) {
                mockMvc.perform(req(uri, caller, null))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.data").doesNotExist());
            }
        }
        verifyNoInteractions(adminService, accessLogRepository, salaryManagementService);
    }

    @Test
    @DisplayName("다른 테넌트 관리자 — A 테넌트 컨텍스트 요청 403, A 테넌트 급여 계산 id 403, 서비스 미호출")
    void otherTenantAdmin_forbidden() throws Exception {
        User adminB = user(ADMIN_B, UserRole.ADMIN, TENANT_B);
        for (String uri : List.of(REFUND_HISTORY, REFUND_STATISTICS, FINANCIAL_TRANSACTIONS, CONSULTATION_LOG_AUDIT)) {
            mockMvc.perform(req(uri, adminB, TENANT_A))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data").doesNotExist());
        }
        mockMvc.perform(req(SALARY_TAX, adminB, null))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.data").doesNotExist());
        verifyNoInteractions(adminService, accessLogRepository, salaryManagementService);
    }

    @Test
    @DisplayName("대조군: 같은 테넌트 관리자는 목록 엔드포인트에서 가드를 통과한다 (401/403 아님)")
    void ownTenantAdmin_passesGuard() throws Exception {
        User adminA = user(ADMIN_A, UserRole.ADMIN, TENANT_A);
        for (String uri : List.of(REFUND_HISTORY, REFUND_STATISTICS, CONSULTATION_LOG_AUDIT, SALARY_CALCULATIONS)) {
            MvcResult result = mockMvc.perform(req(uri, adminA, null)).andReturn();
            assertThat(result.getResponse().getStatus()).as(uri).isNotIn(401, 403);
        }
    }

    @Test
    @DisplayName("미인증 — 대표 엔드포인트 전부 401")
    void anonymous_unauthorized() throws Exception {
        for (String uri : allEndpoints()) {
            mockMvc.perform(req(uri, null, null)).andExpect(status().isUnauthorized());
        }
        verifyNoInteractions(adminService, accessLogRepository, salaryManagementService);
    }

    @Test
    @DisplayName("매칭 강제 종료(전액 환불) — 사무원·상담사·내담자·다른 테넌트 관리자 403·서비스 미호출, 미인증 401, 같은 테넌트 관리자만 통과")
    void terminateMapping_sameTenantAdminOnly() throws Exception {
        assertMappingTerminationAdminOnly(AdminApiRoleMatrixGuardrailMvcTest::terminate);
        mockMvc.perform(terminate(user(ADMIN_A, UserRole.ADMIN, TENANT_A), null)).andExpect(status().isOk());
        verify(mappingTerminationService).terminate(MAPPING_A, "guardrail");
    }

    @Test
    @DisplayName("일괄 결제 취소(매칭 종료 우회 경로) — 강제 종료와 같은 관리자 전용 가드")
    void bulkPaymentCancel_sameTenantAdminOnly() throws Exception {
        assertMappingTerminationAdminOnly(AdminApiRoleMatrixGuardrailMvcTest::bulkCancel);
        MvcResult result = mockMvc.perform(bulkCancel(user(ADMIN_A, UserRole.ADMIN, TENANT_A), null)).andReturn();
        assertThat(result.getResponse().getStatus()).isNotIn(401, 403);
    }

    private void assertMappingTerminationAdminOnly(
            BiFunction<User, String, MockHttpServletRequestBuilder> request) throws Exception {
        for (User caller : List.of(user(STAFF_A, UserRole.STAFF, TENANT_A),
                user(CONSULTANT_A, UserRole.CONSULTANT, TENANT_A),
                user(CLIENT_A, UserRole.CLIENT, TENANT_A))) {
            mockMvc.perform(request.apply(caller, null))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data").doesNotExist());
        }
        User adminB = user(ADMIN_B, UserRole.ADMIN, TENANT_B);
        for (String contextTenant : new String[] {TENANT_A, null}) {
            mockMvc.perform(request.apply(adminB, contextTenant))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data").doesNotExist());
        }
        mockMvc.perform(request.apply(null, null)).andExpect(status().isUnauthorized());
        verify(adminService, never()).terminateMapping(anyLong(), any());
        verify(mappingTerminationService, never()).terminate(anyLong(), any());
    }

    private static MockHttpServletRequestBuilder terminate(User caller, String contextTenantId) {
        return withCaller(post(MAPPING_TERMINATE).contentType(MediaType.APPLICATION_JSON)
            .content("{\"reason\":\"guardrail\"}"), caller, contextTenantId);
    }

    private static MockHttpServletRequestBuilder bulkCancel(User caller, String contextTenantId) {
        return withCaller(post(MAPPING_PAYMENT_CANCEL).contentType(MediaType.APPLICATION_JSON)
            .content("{\"mappingIds\":[" + MAPPING_A + "]}"), caller, contextTenantId);
    }

    private static List<String> allEndpoints() {
        return List.of(REFUND_HISTORY, REFUND_STATISTICS, FINANCIAL_TRANSACTIONS, CONSULTATION_LOG_AUDIT,
            SALARY_CALCULATIONS, SALARY_TAX);
    }

    /** contextTenantId 가 있으면 필터가 세션과 다른 테넌트 컨텍스트를 잡은 상황(헤더 위조 등)을 흉내 낸다. */
    private static MockHttpServletRequestBuilder req(String uri, User caller, String contextTenantId) {
        return withCaller(get(uri), caller, contextTenantId);
    }

    private static MockHttpServletRequestBuilder withCaller(MockHttpServletRequestBuilder builder, User caller,
            String contextTenantId) {
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
