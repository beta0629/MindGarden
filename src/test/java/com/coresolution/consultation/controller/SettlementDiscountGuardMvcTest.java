package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
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
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.controller.erp.SettlementController;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.settlement.Settlement;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.settlement.SettlementRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PackageDiscountService;
import com.coresolution.consultation.service.PackageDiscountService.DiscountCalculationResult;
import com.coresolution.consultation.service.PackageDiscountService.DiscountValidationResult;
import com.coresolution.consultation.service.PlSqlDiscountAccountingService;
import com.coresolution.consultation.service.erp.settlement.SettlementService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 정산 승인 · PL/SQL 할인 적용/환불/상태 변경 · 할인 관리(적용 가능 조회 등) — 관리자 + 세션 테넌트 공통 가드 매트릭스.
 *
 * <p>엔드포인트마다 미인증 401 · 내담자/상담사 403 · 다른 테넌트 관리자 공통 403(데이터 없음, 서비스 미호출) ·
 * 같은 테넌트 관리자 200 을 확인한다. 없는 id·숫자가 아닌 mappingId 도 같은 403 으로 수렴하고,
 * 예외 원문이 응답에 실리지 않는지 확인한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("정산 승인·할인 매핑 — 관리자 공통 가드 매트릭스")
class SettlementDiscountGuardMvcTest {

    private static final String TENANT_A = "tenant-settle-a";
    private static final String TENANT_B = "tenant-settle-b";
    private static final long ADMIN_A = 1L;
    private static final long CLIENT_A = 2L;
    private static final long CONSULTANT_A = 30L;
    private static final long ADMIN_B = 900L;
    private static final long ID = 501L;
    private static final long UNKNOWN_ID = 999_999L;
    private static final String SETTLEMENT_APPROVE = "/api/v1/erp/settlement/results/%d/approve";
    private static final String PLSQL = "/api/v1/admin/plsql-discount-accounting";
    private static final String DISCOUNTS = "/api/v1/admin/discounts";
    private static final String RAW_SERVICE_ERROR = "raw-service-error-detail";

    private SettlementService settlementService;
    private PlSqlDiscountAccountingService plSqlDiscountAccountingService;
    private PackageDiscountService packageDiscountService;
    private DynamicPermissionService dynamicPermissionService;
    private SettlementRepository settlementRepository;
    private ConsultantClientMappingRepository mappingRepository;
    private UserRepository userRepository;
    private ConsultantClientMapping mappingA;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        settlementService = mock(SettlementService.class);
        plSqlDiscountAccountingService = mock(PlSqlDiscountAccountingService.class);
        packageDiscountService = mock(PackageDiscountService.class);
        dynamicPermissionService = mock(DynamicPermissionService.class);
        settlementRepository = mock(SettlementRepository.class);
        mappingRepository = mock(ConsultantClientMappingRepository.class);
        userRepository = mock(UserRepository.class);

        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(mappingRepository, userRepository);
        ResourceOwnerAccessGuard ownerGuard = build(ResourceOwnerAccessGuard.class, clientGuard,
            settlementRepository, mappingRepository, userRepository);
        Object[] provided = {ownerGuard, settlementService, plSqlDiscountAccountingService, packageDiscountService,
            dynamicPermissionService};
        mockMvc = MockMvcBuilders.standaloneSetup(
                build(SettlementController.class, provided),
                build(PlSqlDiscountAccountingController.class, provided),
                build(DiscountController.class, provided))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        mappingA = mock(ConsultantClientMapping.class);
        when(mappingA.getId()).thenReturn(ID);
        when(settlementRepository.findByTenantIdAndId(TENANT_A, ID)).thenReturn(Optional.of(new Settlement()));
        when(mappingRepository.findByTenantIdAndId(TENANT_A, ID)).thenReturn(Optional.of(mappingA));
        stubServices();
        when(dynamicPermissionService.hasPermission(any(User.class), anyString()))
            .thenAnswer(inv -> ((User) inv.getArgument(0)).getRole().isAdmin());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("미인증 — 모든 엔드포인트 401, 데이터 없음, 서비스 미호출")
    void anonymous_unauthorized() throws Exception {
        for (String[] e : endpoints(ID)) {
            mockMvc.perform(req(e, null))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.data").doesNotExist());
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("같은 테넌트 내담자·상담사 — 모든 엔드포인트 403, 데이터 없음, 서비스 미호출")
    void clientAndConsultant_forbidden() throws Exception {
        for (User caller : List.of(user(CLIENT_A, UserRole.CLIENT, TENANT_A),
                user(CONSULTANT_A, UserRole.CONSULTANT, TENANT_A))) {
            for (String[] e : endpoints(ID)) {
                mockMvc.perform(req(e, caller))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.data").doesNotExist());
            }
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("ERP_ACCESS 동적 권한이 있는 상담사라도 정산 승인은 관리자 전용 — 공통 403, 서비스 미호출")
    void consultantWithErpAccess_settlementApprove_sharedDenial() throws Exception {
        when(dynamicPermissionService.hasPermission(any(User.class), eq("ERP_ACCESS"))).thenReturn(true);
        assertSharedDenial(mockMvc.perform(req(settlementApprove(ID), user(CONSULTANT_A, UserRole.CONSULTANT,
            TENANT_A))));
        verifyNoInteractions(settlementService);
    }

    @Test
    @DisplayName("다른 테넌트 관리자 — 모든 엔드포인트 공통 403, 데이터 없음, 서비스 미호출")
    void otherTenantAdmin_sharedDenial() throws Exception {
        for (String[] e : endpoints(ID)) {
            assertSharedDenial(mockMvc.perform(req(e, user(ADMIN_B, UserRole.ADMIN, TENANT_B))));
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("같은 테넌트 관리자라도 테넌트에 없는 id — 공통 403, 예외 원문(정산을 찾을 수 없습니다 등) 없음")
    void ownTenantAdmin_unknownId_sharedDenial() throws Exception {
        for (String[] e : endpoints(UNKNOWN_ID)) {
            assertSharedDenial(mockMvc.perform(req(e, user(ADMIN_A, UserRole.ADMIN, TENANT_A))))
                .andExpect(content().string(Matchers.not(Matchers.containsString("찾을 수 없습니다"))));
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("본문 mappingId 누락·숫자 아님 — 500 대신 공통 403, 서비스 미호출")
    void bodyMappingIdMissingOrInvalid_sharedDenial() throws Exception {
        User admin = user(ADMIN_A, UserRole.ADMIN, TENANT_A);
        for (String body : List.of("{}", "{\"mappingId\":\"" + ID + "\"}", "{\"mappingId\":null}")) {
            for (String path : List.of(PLSQL + "/apply", PLSQL + "/refund", PLSQL + "/update-status",
                    DISCOUNTS + "/apply", DISCOUNTS + "/validate", DISCOUNTS + "/preview")) {
                assertSharedDenial(mockMvc.perform(req(new String[] {"POST", path, body}, admin)));
            }
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("같은 테넌트 관리자 — 모든 엔드포인트 200")
    void ownTenantAdmin_ok() throws Exception {
        for (String[] e : endpoints(ID)) {
            mockMvc.perform(req(e, user(ADMIN_A, UserRole.ADMIN, TENANT_A)))
                .andExpect(status().isOk());
        }
    }

    @Test
    @DisplayName("정산 승인 — 본문 approverId 는 무시하고 세션 관리자를 승인자로 기록, 빈 본문도 허용")
    void settlementApprove_approverIsSessionAdmin() throws Exception {
        User admin = user(ADMIN_A, UserRole.ADMIN, TENANT_A);
        mockMvc.perform(req(new String[] {"POST", String.format(SETTLEMENT_APPROVE, ID), "{\"approverId\":77777}"},
                admin))
            .andExpect(status().isOk());
        mockMvc.perform(req(new String[] {"POST", String.format(SETTLEMENT_APPROVE, ID), null}, admin))
            .andExpect(status().isOk());
        verify(settlementService, org.mockito.Mockito.times(2)).approveSettlement(TENANT_A, ID, ADMIN_A);
        verify(settlementService, org.mockito.Mockito.never()).approveSettlement(any(), any(), eq(77777L));
    }

    @Test
    @DisplayName("할인 관리 — 서비스 예외 원문은 응답에 싣지 않는다")
    void discountService_failure_sanitized() throws Exception {
        RuntimeException raw = new RuntimeException(RAW_SERVICE_ERROR);
        when(packageDiscountService.getAvailableDiscounts(any())).thenThrow(raw);
        when(packageDiscountService.calculateDiscountWithCode(any(), any())).thenThrow(raw);
        when(packageDiscountService.validateDiscount(any(), any())).thenThrow(raw);
        User admin = user(ADMIN_A, UserRole.ADMIN, TENANT_A);
        for (String[] e : discountEndpoints(ID)) {
            mockMvc.perform(req(e, admin))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(content().string(Matchers.not(Matchers.containsString(RAW_SERVICE_ERROR))));
        }
    }

    private static List<String[]> endpoints(long id) {
        List<String[]> all = new java.util.ArrayList<>();
        all.add(settlementApprove(id));
        all.add(new String[] {"POST", PLSQL + "/apply", "{\"mappingId\":" + id + ",\"discountCode\":\"D\","
            + "\"originalAmount\":1000,\"discountAmount\":100,\"finalAmount\":900,\"branchCode\":\"B\","
            + "\"appliedBy\":\"a\"}"});
        all.add(new String[] {"POST", PLSQL + "/refund", "{\"mappingId\":" + id + ",\"refundAmount\":100,"
            + "\"refundReason\":\"r\",\"processedBy\":\"a\"}"});
        all.add(new String[] {"POST", PLSQL + "/update-status", "{\"mappingId\":" + id + ",\"newStatus\":\"S\","
            + "\"updatedBy\":\"a\",\"reason\":\"r\"}"});
        all.addAll(discountEndpoints(id));
        return all;
    }

    private static List<String[]> discountEndpoints(long id) {
        String body = "{\"mappingId\":" + id + ",\"discountCode\":\"D\"}";
        return List.of(
            new String[] {"GET", DISCOUNTS + "/available?mappingId=" + id, null},
            new String[] {"POST", DISCOUNTS + "/apply", body},
            new String[] {"POST", DISCOUNTS + "/validate", body},
            new String[] {"POST", DISCOUNTS + "/preview", body});
    }

    private static String[] settlementApprove(long id) {
        return new String[] {"POST", String.format(SETTLEMENT_APPROVE, id), "{}"};
    }

    private void stubServices() {
        when(settlementService.approveSettlement(eq(TENANT_A), eq(ID), anyLong())).thenReturn(new Settlement());
        Map<String, Object> procedureOk = Map.of("success", true);
        when(plSqlDiscountAccountingService.applyDiscountAccounting(eq(ID), any(), any(), any(), any(), any(), any()))
            .thenReturn(procedureOk);
        when(plSqlDiscountAccountingService.processDiscountRefund(eq(ID), any(), any(), any()))
            .thenReturn(procedureOk);
        when(plSqlDiscountAccountingService.updateDiscountStatus(eq(ID), any(), any(), any()))
            .thenReturn(procedureOk);
        when(packageDiscountService.getAvailableDiscounts(any())).thenReturn(List.of());
        when(packageDiscountService.calculateDiscountWithCode(any(), any())).thenReturn(new DiscountCalculationResult());
        when(packageDiscountService.validateDiscount(any(), any())).thenReturn(new DiscountValidationResult());
    }

    private void verifyNoServiceCalls() {
        verifyNoInteractions(settlementService, plSqlDiscountAccountingService, packageDiscountService);
    }

    private ResultActions assertSharedDenial(ResultActions result) throws Exception {
        return result.andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE))
            .andExpect(jsonPath("$.data").doesNotExist());
    }

    private static MockHttpServletRequestBuilder req(String[] endpoint, User caller) {
        MockHttpServletRequestBuilder builder = request(HttpMethod.valueOf(endpoint[0]), endpoint[1]);
        if (caller != null) {
            MockHttpSession session = new MockHttpSession();
            session.setAttribute(SessionConstants.USER_OBJECT, caller);
            session.setAttribute(SessionConstants.TENANT_ID, caller.getTenantId());
            builder.session(session).with(r -> {
                TenantContextHolder.setTenantId(caller.getTenantId());
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
