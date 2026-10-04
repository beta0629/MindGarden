package com.coresolution.consultation.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Constructor;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.controller.erp.ErpController;
import com.coresolution.consultation.dto.FinancialTransactionResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 재무 거래 단건·상담사 급여 단건 API 의 다른 테넌트 자원 id 차단 ({@link ResourceOwnerAccessGuard}).
 *
 * <p>.dev(d0f4882) 측정: 다른 테넌트 거래 id 단건 조회는 500, 다른 테넌트 상담사 급여 프로필은 200(빈 본문).
 * 두 경로 모두 공통 가드의 403 「접근할 수 없는 자료입니다.」로 수렴해야 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("재무 거래·급여 단건 — 공통 자원 가드")
class ErpSalaryResourceOwnerGuardMvcTest {

    private static final String TENANT_A = "tenant-erp-guard-a";
    private static final String TENANT_B = "tenant-erp-guard-b";
    private static final long ADMIN_A = 1L;
    private static final long ADMIN_B = 900L;
    private static final long CONSULTANT_A = 30L;
    private static final long CONSULTANT_OTHER_A = 31L;
    private static final long TX_A = 7001L;
    private static final long UNKNOWN_ID = 999_999L;
    private static final String TX_URI = "/api/v1/erp/finance/transactions/";
    private static final String PROFILE_URI = "/api/v1/admin/salary/profiles/";
    private static final String CALC_URI = "/api/v1/admin/salary/calculations/";
    private static final String TX_BODY = "{\"transactionType\":\"EXPENSE\",\"category\":\"OFFICE\","
        + "\"amount\":1000,\"transactionDate\":\"2026-10-04\"}";

    private FinancialTransactionRepository financialTransactionRepository;
    private FinancialTransactionService financialTransactionService;
    private SalaryManagementService salaryManagementService;
    private UserRepository userRepository;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        financialTransactionRepository = mock(FinancialTransactionRepository.class);
        financialTransactionService = mock(FinancialTransactionService.class);
        salaryManagementService = mock(SalaryManagementService.class);
        userRepository = mock(UserRepository.class);
        DynamicPermissionService dynamicPermissionService = mock(DynamicPermissionService.class);
        Environment environment = mock(Environment.class);

        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), userRepository);
        ResourceOwnerAccessGuard ownerGuard = new ResourceOwnerAccessGuard(clientGuard,
            mock(com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository.class),
            mock(com.coresolution.consultation.repository.ConsultantRatingRepository.class),
            mock(com.coresolution.consultation.repository.ConsultationRecordRepository.class),
            mock(com.coresolution.consultation.repository.ConsultationAudioFileRepository.class),
            mock(com.coresolution.consultation.repository.MultimodalEmotionReportRepository.class),
            mock(com.coresolution.consultation.repository.ConsultantAvailabilityRepository.class),
            financialTransactionRepository,
            mock(com.coresolution.consultation.repository.ItemRepository.class),
            mock(com.coresolution.consultation.repository.PurchaseRequestRepository.class),
            mock(com.coresolution.consultation.repository.PurchaseOrderRepository.class),
            mock(com.coresolution.consultation.repository.BudgetRepository.class),
            mock(com.coresolution.consultation.repository.RecurringExpenseRepository.class),
            mock(com.coresolution.consultation.repository.ConsultantSalaryProfileRepository.class),
            mock(com.coresolution.consultation.repository.SalaryCalculationRepository.class),
            mock(com.coresolution.core.repository.ErdDiagramRepository.class),
            mock(com.coresolution.consultation.repository.erp.accounting.AccountingEntryRepository.class),
            mock(com.coresolution.consultation.repository.AccountRepository.class),
            mock(com.coresolution.consultation.repository.ConsultantClientMappingRepository.class),
            mock(com.coresolution.consultation.repository.erp.settlement.SettlementRepository.class));
        Object[] provided = {ownerGuard, financialTransactionService, salaryManagementService, userRepository,
            dynamicPermissionService, environment};

        mockMvc = MockMvcBuilders.standaloneSetup(
                build(ErpController.class, provided),
                build(SalaryManagementController.class, provided))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        when(financialTransactionRepository.findByTenantIdAndId(TENANT_A, TX_A))
            .thenReturn(Optional.of(new FinancialTransaction()));
        when(financialTransactionService.getTransaction(TX_A))
            .thenReturn(FinancialTransactionResponse.builder().id(TX_A).build());
        when(financialTransactionService.updateTransaction(eq(TX_A), any(), any()))
            .thenReturn(FinancialTransactionResponse.builder().id(TX_A).build());
        for (long id : new long[] {ADMIN_A, CONSULTANT_A, CONSULTANT_OTHER_A}) {
            when(userRepository.findByTenantIdAndId(TENANT_A, id)).thenReturn(Optional.of(new User()));
        }
        when(salaryManagementService.getSalaryCalculations(anyLong())).thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    // ---- 재무 거래 단건 ----

    @Test
    @DisplayName("거래 단건 GET — 같은 테넌트 관리자 200")
    void transaction_get_ownTenant_ok() throws Exception {
        call(HttpMethod.GET, TX_URI + TX_A, null, user(ADMIN_A, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(TX_A));
        verify(financialTransactionService).getTransaction(TX_A);
    }

    @Test
    @DisplayName("거래 단건 GET — 다른 테넌트 관리자 → 공통 403, 데이터 없음, 500 아님")
    void transaction_get_otherTenant_forbidden() throws Exception {
        assertSharedDenial(call(HttpMethod.GET, TX_URI + TX_A, null, user(ADMIN_B, UserRole.ADMIN, TENANT_B)));
        verifyNoInteractions(financialTransactionService);
    }

    @Test
    @DisplayName("거래 단건 GET — 테넌트 안에 없는 id → 같은 공통 403")
    void transaction_get_unknownId_forbidden() throws Exception {
        assertSharedDenial(call(HttpMethod.GET, TX_URI + UNKNOWN_ID, null, user(ADMIN_A, UserRole.ADMIN, TENANT_A)));
        verifyNoInteractions(financialTransactionService);
    }

    @Test
    @DisplayName("거래 단건 GET — 조회 중 DB 오류 → 500 대신 공통 403")
    void transaction_get_lookupFailure_forbidden() throws Exception {
        when(financialTransactionRepository.findByTenantIdAndId(TENANT_A, TX_A))
            .thenThrow(new InvalidDataAccessResourceUsageException("schema mismatch"));
        assertSharedDenial(call(HttpMethod.GET, TX_URI + TX_A, null, user(ADMIN_A, UserRole.ADMIN, TENANT_A)))
            .andExpect(content().string(not(containsString("schema mismatch"))));
        verifyNoInteractions(financialTransactionService);
    }

    @Test
    @DisplayName("거래 PUT — 다른 테넌트 → 공통 403 / 같은 테넌트 200")
    void transaction_put_tenantScoped() throws Exception {
        assertSharedDenial(call(HttpMethod.PUT, TX_URI + TX_A, TX_BODY, user(ADMIN_B, UserRole.ADMIN, TENANT_B)));
        verifyNoInteractions(financialTransactionService);
        call(HttpMethod.PUT, TX_URI + TX_A, TX_BODY, user(ADMIN_A, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("거래 DELETE — 다른 테넌트 → 공통 403 (500 아님), 삭제 미호출")
    void transaction_delete_otherTenant_forbidden() throws Exception {
        assertSharedDenial(call(HttpMethod.DELETE, TX_URI + TX_A, null, user(ADMIN_B, UserRole.ADMIN, TENANT_B)));
        verifyNoInteractions(financialTransactionService);
    }

    // ---- 상담사 급여 단건 ----

    @Test
    @DisplayName("급여 프로필 GET — 같은 테넌트 관리자 200")
    void salaryProfile_ownTenant_ok() throws Exception {
        call(HttpMethod.GET, PROFILE_URI + CONSULTANT_A, null, user(ADMIN_A, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isOk());
        verify(salaryManagementService).getSalaryProfileDetailForConsultant(CONSULTANT_A);
    }

    @Test
    @DisplayName("급여 프로필 GET — 다른 테넌트 상담사 id → 공통 403 (200 빈 본문 아님)")
    void salaryProfile_otherTenant_forbidden() throws Exception {
        assertSharedDenial(call(HttpMethod.GET, PROFILE_URI + CONSULTANT_A, null,
            user(ADMIN_B, UserRole.ADMIN, TENANT_B)));
        verifyNoInteractions(salaryManagementService);
    }

    @Test
    @DisplayName("상담사별 급여 계산 GET — 다른 테넌트 → 공통 403 / 같은 테넌트 200")
    void salaryCalculations_tenantScoped() throws Exception {
        assertSharedDenial(call(HttpMethod.GET, CALC_URI + CONSULTANT_A, null,
            user(ADMIN_B, UserRole.ADMIN, TENANT_B)));
        verifyNoInteractions(salaryManagementService);
        call(HttpMethod.GET, CALC_URI + CONSULTANT_A, null, user(ADMIN_A, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("급여 프로필 GET — 미인증 → 4xx(기존 권한 검사), 데이터 없음, 서비스 미호출")
    void salaryProfile_unauthenticated() throws Exception {
        mockMvc.perform(request(HttpMethod.GET, PROFILE_URI + CONSULTANT_A))
            .andExpect(status().is4xxClientError())
            .andExpect(jsonPath("$.data").doesNotExist());
        verifyNoInteractions(salaryManagementService);
    }

    private ResultActions assertSharedDenial(ResultActions result) throws Exception {
        return result.andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE))
            .andExpect(jsonPath("$.data").doesNotExist());
    }

    private ResultActions call(HttpMethod method, String uri, String body, User caller) throws Exception {
        MockHttpServletRequestBuilder builder = request(method, uri).session(session(caller))
            .with(tenant(caller.getTenantId()));
        if (body != null) {
            builder.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mockMvc.perform(builder);
    }

    private static RequestPostProcessor tenant(String tenantId) {
        return r -> {
            TenantContextHolder.setTenantId(tenantId);
            return r;
        };
    }

    private static User user(long id, UserRole role, String tenantId) {
        User u = new User();
        u.setId(id);
        u.setUserId("u-" + id);
        u.setRole(role);
        u.setTenantId(tenantId);
        return u;
    }

    private static MockHttpSession session(User u) {
        MockHttpSession s = new MockHttpSession();
        s.setAttribute(SessionConstants.USER_OBJECT, u);
        s.setAttribute(SessionConstants.TENANT_ID, u.getTenantId());
        return s;
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
