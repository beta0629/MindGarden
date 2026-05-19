package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.constant.PointTenantPolicyKeys;
import com.coresolution.consultation.dto.shop.admin.PointTenantPoliciesResponse;
import com.coresolution.consultation.service.AdminPointTenantPolicyService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.shop.AdminPointTenantPolicyControllerMvcTestApplication;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * {@link com.coresolution.consultation.controller.AdminPointTenantPolicyController} slice MockMvc.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@SpringBootTest(classes = AdminPointTenantPolicyControllerMvcTestApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("AdminPointTenantPolicyController MockMvc")
class AdminPointTenantPolicyControllerMvcTest {

    private static final String POLICIES_PATH = "/api/v1/admin/shop/point-policies";

    private String tenantId;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminPointTenantPolicyService adminPointTenantPolicyService;

    @BeforeEach
    void setTenantContext() {
        tenantId = UUID.randomUUID().toString();
        TenantContextHolder.setTenantId(tenantId);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("GET 정책 — ADMIN 시 200·success·MVP 키")
    @WithMockUser(roles = {"ADMIN"})
    void getPolicies_whenAdmin_returns200() throws Exception {
        Map<String, Object> policies = PointTenantPolicyKeys.defaultPolicies();
        when(adminPointTenantPolicyService.getPolicies(tenantId))
                .thenReturn(new PointTenantPoliciesResponse(tenantId, policies));

        mockMvc.perform(get(POLICIES_PATH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tenantId").value(tenantId))
                .andExpect(jsonPath("$.data.policies.earn_rate").exists())
                .andExpect(jsonPath("$.data.policies.allow_points_only").exists());
    }

    @Test
    @DisplayName("GET 정책 — TenantContext tenantId로만 서비스 조회")
    @WithMockUser(roles = {"ADMIN"})
    void getPolicies_scopedToTenantContext() throws Exception {
        String otherTenantId = UUID.randomUUID().toString();
        Map<String, Object> policies = PointTenantPolicyKeys.defaultPolicies();
        when(adminPointTenantPolicyService.getPolicies(tenantId))
                .thenReturn(new PointTenantPoliciesResponse(tenantId, policies));

        mockMvc.perform(get(POLICIES_PATH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tenantId").value(tenantId));

        verify(adminPointTenantPolicyService).getPolicies(tenantId);
        verify(adminPointTenantPolicyService, never()).getPolicies(eq(otherTenantId));
    }
}
