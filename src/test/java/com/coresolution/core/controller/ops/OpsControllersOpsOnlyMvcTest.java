package com.coresolution.core.controller.ops;

import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Method;
import java.util.Collection;
import java.util.List;

import com.coresolution.consultation.config.filter.JwtAuthenticationFilter;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.core.constants.SecurityRoleConstants;
import com.coresolution.core.service.ops.DashboardService;
import com.coresolution.core.service.ErdGenerationService;
import com.coresolution.core.service.ErdHistoryService;
import com.coresolution.core.service.ErdValidationReportService;
import com.coresolution.core.service.ErdValidationService;
import com.coresolution.core.service.ops.FeatureFlagService;
import com.coresolution.core.service.ops.PricingPlanService;
import com.coresolution.core.service.SchemaService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * Ops 대시보드·요금제·ERD·Feature Flag API — Ops 운영자 전용 회귀.
 *
 * <p>이전에는 {@code requireAdminOrOps} 로 테넌트 관리자(ROLE_ADMIN)도 전 테넌트 운영 데이터를 받았다.
 * 미인증 401, 테넌트 관리자·사무원·내담자 403(서비스 미호출), Ops 운영자 200 이어야 한다.
 * 공개 요금제 조회(/plans/active 등)는 원래 권한 검사가 없는 공개 경로라 대상이 아니다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("Ops 컨트롤러 4종 — Ops 운영자 전용")
class OpsControllersOpsOnlyMvcTest {

    /** 메서드 · 경로 (본문 없는 엔드포인트. 본문 검증이 권한 검사보다 먼저 400 을 내지 않도록) */
    private static final List<String[]> GUARDED = List.of(
        new String[] {"GET", "/api/v1/ops/dashboard/metrics"},
        new String[] {"GET", "/api/v1/ops/plans"},
        new String[] {"GET", "/api/v1/ops/plans/addons"},
        new String[] {"DELETE", "/api/v1/ops/plans/plan-1"},
        new String[] {"GET", "/api/v1/ops/feature-flags"},
        new String[] {"GET", "/api/v1/ops/feature-flags/enabled"},
        new String[] {"GET", "/api/v1/ops/feature-flags/key/flag-1"},
        new String[] {"GET", "/api/v1/ops/erd"},
        new String[] {"GET", "/api/v1/ops/erd/erd-1"},
        new String[] {"POST", "/api/v1/ops/erd/generate/full-system"},
        new String[] {"POST", "/api/v1/ops/erd/generate/tenant/tenant-1"},
        new String[] {"POST", "/api/v1/ops/erd/generate/module/CONSULTATION"},
        new String[] {"POST", "/api/v1/ops/erd/erd-1/validate"},
        new String[] {"GET", "/api/v1/ops/erd/erd-1/validation-report/json"},
        new String[] {"GET", "/api/v1/ops/erd/erd-1/validation-report/html"},
        new String[] {"GET", "/api/v1/ops/erd/erd-1/validation-report/markdown"},
        new String[] {"GET", "/api/v1/ops/erd/tables"},
        new String[] {"GET", "/api/v1/ops/erd/erd-1/compare?fromVersion=1&toVersion=2"});

    /** Ops 운영자 200 확인용 조회 엔드포인트 */
    private static final List<String> OPS_READS = List.of(
        "/api/v1/ops/dashboard/metrics",
        "/api/v1/ops/plans",
        "/api/v1/ops/plans/addons",
        "/api/v1/ops/feature-flags",
        "/api/v1/ops/feature-flags/enabled",
        "/api/v1/ops/erd",
        "/api/v1/ops/erd/tables");

    private DashboardService dashboardService;
    private PricingPlanService pricingPlanService;
    private FeatureFlagService featureFlagService;
    private ErdGenerationService erdGenerationService;
    private ErdValidationService erdValidationService;
    private SchemaService schemaService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        dashboardService = mock(DashboardService.class);
        pricingPlanService = mock(PricingPlanService.class);
        featureFlagService = mock(FeatureFlagService.class);
        erdGenerationService = mock(ErdGenerationService.class);
        erdValidationService = mock(ErdValidationService.class);
        schemaService = mock(SchemaService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(
                new DashboardOpsController(dashboardService),
                new PricingPlanOpsController(pricingPlanService),
                new FeatureFlagOpsController(featureFlagService),
                new ErdOpsController(erdGenerationService, mock(ErdHistoryService.class), erdValidationService,
                    mock(ErdValidationReportService.class), schemaService))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("미인증(익명·인증 없음) — 전부 401, 서비스 미호출")
    void anonymous_unauthorized() throws Exception {
        for (String[] e : GUARDED) {
            SecurityContextHolder.clearContext();
            mockMvc.perform(request(HttpMethod.valueOf(e[0]), e[1])).andExpect(status().isUnauthorized());
            SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken("key",
                "anonymous", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));
            mockMvc.perform(request(HttpMethod.valueOf(e[0]), e[1])).andExpect(status().isUnauthorized());
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("테넌트 관리자(ROLE_ADMIN) — 전부 403, 데이터 없음, 서비스 미호출")
    void tenantAdmin_forbidden() throws Exception {
        assertAllForbidden(SecurityRoleConstants.ROLE_ADMIN);
    }

    @Test
    @DisplayName("사무원·상담사·내담자 — 전부 403, 서비스 미호출")
    void otherRoles_forbidden() throws Exception {
        assertAllForbidden(SecurityRoleConstants.ROLE_STAFF);
        assertAllForbidden(SecurityRoleConstants.ROLE_PREFIX + UserRole.CONSULTANT.name());
        assertAllForbidden(SecurityRoleConstants.ROLE_PREFIX + UserRole.CLIENT.name());
    }

    @Test
    @DisplayName("Ops 포털 계정(ops_core, 기본 actorRole HQ_ADMIN) — JWT 필터가 주는 권한 그대로 조회 200")
    void opsPortalAccount_ok() throws Exception {
        Collection<GrantedAuthority> authorities = authoritiesFromActorRole(SecurityRoleConstants.ACTOR_ROLE_HQ_ADMIN);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("ops_core", null, authorities));
        for (String uri : OPS_READS) {
            mockMvc.perform(request(HttpMethod.GET, uri)).andExpect(status().isOk());
        }
    }

    @Test
    @DisplayName("Ops 토큰이라도 actorRole ADMIN 이면 ROLE_OPS 가 없어 403")
    void opsTokenWithAdminActorRole_forbidden() throws Exception {
        Collection<GrantedAuthority> authorities = authoritiesFromActorRole(SecurityRoleConstants.ACTOR_ROLE_ADMIN);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("ops-admin-actor", null, authorities));
        for (String[] e : GUARDED) {
            mockMvc.perform(request(HttpMethod.valueOf(e[0]), e[1])).andExpect(status().isForbidden());
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("Ops 운영자(ROLE_OPS) — 조회 200")
    void ops_ok() throws Exception {
        authenticate(SecurityRoleConstants.ROLE_OPS);
        for (String uri : OPS_READS) {
            mockMvc.perform(request(HttpMethod.GET, uri)).andExpect(status().isOk());
        }
    }

    private void assertAllForbidden(String authority) throws Exception {
        authenticate(authority);
        for (String[] e : GUARDED) {
            mockMvc.perform(request(HttpMethod.valueOf(e[0]), e[1]))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data").doesNotExist());
        }
        verifyNoServiceCalls();
    }

    private void verifyNoServiceCalls() {
        verifyNoInteractions(dashboardService, pricingPlanService, featureFlagService, erdGenerationService,
            erdValidationService, schemaService);
    }

    @SuppressWarnings("unchecked")
    private static Collection<GrantedAuthority> authoritiesFromActorRole(String actorRole) throws Exception {
        JwtAuthenticationFilter filter = mock(JwtAuthenticationFilter.class, CALLS_REAL_METHODS);
        Method method = JwtAuthenticationFilter.class.getDeclaredMethod(
            "createAuthoritiesFromActorRole", String.class, String.class);
        method.setAccessible(true);
        return (Collection<GrantedAuthority>) method.invoke(filter, "ops_core", actorRole);
    }

    private static void authenticate(String authority) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            "user-" + authority, null, List.of(new SimpleGrantedAuthority(authority))));
    }
}
