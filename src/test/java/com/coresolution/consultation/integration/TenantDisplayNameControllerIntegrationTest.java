package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.core.dto.TenantNameUpdateRequest;
import com.coresolution.core.dto.TenantNameUpdateResponse;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.TenantService;
import com.coresolution.integrationtest.tenantdisplayname.TenantDisplayNameMvcTestApplication;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * {@link TenantDisplayNameController} MockMvc 테스트.
 * 서비스·접근 제어는 목으로 고정하고 HTTP 계약·{@code @PreAuthorize}와의 정합만 검증합니다.
 * 공유 MySQL·Flyway 없이 동작하도록 데이터소스·JPA·Flyway 자동설정을 제외한 최소 컨텍스트를 사용합니다.
 *
 * @author CoreSolution
 * @since 2026-04-01
 */
@SpringBootTest(classes = TenantDisplayNameMvcTestApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("TenantDisplayNameController 통합 테스트")
class TenantDisplayNameControllerIntegrationTest {

    private static final String TENANT_ID = "test-tenant-display-name";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TenantService tenantService;

    @MockBean
    private TenantAccessControlService tenantAccessControlService;

    private TenantNameUpdateResponse stubResponse;

    @BeforeEach
    void setUp() {
        doNothing().when(tenantAccessControlService).validateTenantAccess(anyString());
        stubResponse = TenantNameUpdateResponse.builder()
                .tenantId(TENANT_ID)
                .name("Renamed Tenant")
                .businessType("CONSULTATION")
                .status("ACTIVE")
                .build();
        when(tenantService.updateTenantDisplayName(eq(TENANT_ID), any(TenantNameUpdateRequest.class)))
                .thenReturn(stubResponse);
    }

    @Test
    @DisplayName("ADMIN: PUT 이름 변경 → 200, ApiResponse 메시지·data")
    @WithMockUser(roles = {"ADMIN"})
    void updateDisplayName_admin_returns200AndApiResponse() throws Exception {
        TenantNameUpdateRequest body = TenantNameUpdateRequest.builder().name("Renamed Tenant").build();

        mockMvc.perform(put("/api/v1/tenants/{tenantId}/name", TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("테넌트명이 변경되었습니다."))
                .andExpect(jsonPath("$.data.tenantId").value(TENANT_ID))
                .andExpect(jsonPath("$.data.name").value("Renamed Tenant"))
                .andExpect(jsonPath("$.data.businessType").value("CONSULTATION"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("OPS: PUT 이름 변경 → 200")
    @WithMockUser(roles = {"OPS"})
    void updateDisplayName_ops_returns200() throws Exception {
        TenantNameUpdateRequest body = TenantNameUpdateRequest.builder().name("Renamed Tenant").build();

        mockMvc.perform(put("/api/v1/tenants/{tenantId}/name", TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("테넌트명이 변경되었습니다."))
                .andExpect(jsonPath("$.data.name").value("Renamed Tenant"));
    }

    @Test
    @DisplayName("STAFF: PUT 이름 변경 → 403")
    @WithMockUser(roles = {"STAFF"})
    void updateDisplayName_staff_returns403() throws Exception {
        TenantNameUpdateRequest body = TenantNameUpdateRequest.builder().name("X").build();

        mockMvc.perform(put("/api/v1/tenants/{tenantId}/name", TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }
}
