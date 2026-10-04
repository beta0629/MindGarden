package com.coresolution.core.controller.ops;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.constants.SecurityRoleConstants;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.service.ops.TenantOpsService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * {@code /api/v1/ops/tenants} — Ops 운영자 전용 회귀.
 *
 * <p>.dev(d0f4882) 측정: 테넌트 관리자(ROLE_ADMIN)가 전 테넌트 목록·단건을 200 으로 받음
 * ({@code requireAdminOrOps}). 테넌트 관리자는 403, Ops 운영자만 200 이어야 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("Ops 테넌트 API — Ops 운영자 전용")
class TenantOpsControllerOpsOnlyMvcTest {

    private static final String BASE = "/api/v1/ops/tenants";
    private static final String TENANT_ID = "tenant-ops-only-a";

    private TenantOpsService tenantOpsService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        tenantOpsService = mock(TenantOpsService.class);
        TenantOpsController controller = new TenantOpsController(tenantOpsService,
            mock(TenantRepository.class), mock(UserRepository.class), mock(TenantRoleRepository.class),
            mock(UserRoleAssignmentRepository.class));
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        when(tenantOpsService.listTenants()).thenReturn(List.of(Map.of("tenantId", TENANT_ID)));
        when(tenantOpsService.getTenantDetail(TENANT_ID)).thenReturn(Map.of("tenantId", TENANT_ID));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("미인증(익명) — 목록·단건 401, 서비스 미호출")
    void anonymous_unauthorized() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken("key", "anonymous",
            List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));
        mockMvc.perform(get(BASE)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(BASE + "/" + TENANT_ID)).andExpect(status().isUnauthorized());
        verifyNoInteractions(tenantOpsService);
    }

    @Test
    @DisplayName("인증 객체 없음 — 401")
    void noAuthentication_unauthorized() throws Exception {
        mockMvc.perform(get(BASE)).andExpect(status().isUnauthorized());
        verifyNoInteractions(tenantOpsService);
    }

    @Test
    @DisplayName("테넌트 관리자(ROLE_ADMIN) — 목록·단건·정지·재개·관리자조회 403, 데이터 없음")
    void tenantAdmin_forbidden() throws Exception {
        authenticate(SecurityRoleConstants.ROLE_ADMIN);
        mockMvc.perform(get(BASE)).andExpect(status().isForbidden()).andExpect(jsonPath("$.data").doesNotExist());
        mockMvc.perform(get(BASE + "/" + TENANT_ID))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.data").doesNotExist());
        mockMvc.perform(post(BASE + "/" + TENANT_ID + "/suspend")).andExpect(status().isForbidden());
        mockMvc.perform(post(BASE + "/" + TENANT_ID + "/resume")).andExpect(status().isForbidden());
        mockMvc.perform(get(BASE + "/" + TENANT_ID + "/admins")).andExpect(status().isForbidden());
        verifyNoInteractions(tenantOpsService);
    }

    @Test
    @DisplayName("사무원·내담자 역할 — 403")
    void otherRoles_forbidden() throws Exception {
        authenticate(SecurityRoleConstants.ROLE_STAFF);
        mockMvc.perform(get(BASE)).andExpect(status().isForbidden());
        authenticate("ROLE_CLIENT");
        mockMvc.perform(get(BASE + "/" + TENANT_ID)).andExpect(status().isForbidden());
        verifyNoInteractions(tenantOpsService);
    }

    @Test
    @DisplayName("Ops 운영자(ROLE_OPS) — 목록·단건 200")
    void ops_ok() throws Exception {
        authenticate(SecurityRoleConstants.ROLE_OPS);
        mockMvc.perform(get(BASE)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].tenantId").value(TENANT_ID));
        mockMvc.perform(get(BASE + "/" + TENANT_ID)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.tenantId").value(TENANT_ID));
        verify(tenantOpsService).listTenants();
        verify(tenantOpsService).getTenantDetail(TENANT_ID);
    }

    private static void authenticate(String authority) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            "user-" + authority, null, List.of(new SimpleGrantedAuthority(authority))));
    }
}
