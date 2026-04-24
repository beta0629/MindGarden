package com.coresolution.consultation.integration;

import com.coresolution.consultation.dto.TenantSmsSettingsResponse;
import com.coresolution.consultation.dto.TenantSmsSettingsUpdateRequest;
import com.coresolution.consultation.service.TenantSmsSettingsService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * {@code AdminTenantSmsSettingsController} MockMvc 테스트.
 *
 * @author CoreSolution
 * @since 2026-04-25
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@DisplayName("어드민 SMS 테넌트 설정 API")
class AdminTenantSmsSettingsControllerTest {

    private static final String TEST_TENANT_ID = UUID.randomUUID().toString();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TenantSmsSettingsService tenantSmsSettingsService;

    @BeforeEach
    void setTenantContext() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("GET — 테넌트 컨텍스트 없으면 400")
    @WithMockUser(roles = {"ADMIN"})
    void getSettings_whenTenantMissing_returns400() throws Exception {
        TenantContextHolder.clear();

        mockMvc.perform(get("/api/v1/admin/tenant-sms-settings"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.errorCode").value("TENANT_CONTEXT_MISSING"));
    }

    @Test
    @DisplayName("GET — ADMIN이면 200")
    @WithMockUser(roles = {"ADMIN"})
    void getSettings_whenAdmin_returns200() throws Exception {
        TenantSmsSettingsResponse body = TenantSmsSettingsResponse.builder()
            .tenantId(TEST_TENANT_ID)
            .smsEnabled(true)
            .provider("nhn")
            .senderNumber("01011112222")
            .apiKeyRef("ref-k")
            .apiSecretRef("ref-s")
            .build();
        when(tenantSmsSettingsService.getEffectiveSettings(TEST_TENANT_ID)).thenReturn(body);

        mockMvc.perform(get("/api/v1/admin/tenant-sms-settings"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.tenantId").value(TEST_TENANT_ID))
            .andExpect(jsonPath("$.data.smsEnabled").value(true))
            .andExpect(jsonPath("$.data.provider").value("nhn"));

        verify(tenantSmsSettingsService).getEffectiveSettings(TEST_TENANT_ID);
    }

    @Test
    @DisplayName("GET — STAFF이면 200")
    @WithMockUser(roles = {"STAFF"})
    void getSettings_whenStaff_returns200() throws Exception {
        TenantSmsSettingsResponse body = TenantSmsSettingsResponse.builder()
            .tenantId(TEST_TENANT_ID)
            .smsEnabled(false)
            .build();
        when(tenantSmsSettingsService.getEffectiveSettings(TEST_TENANT_ID)).thenReturn(body);

        mockMvc.perform(get("/api/v1/admin/tenant-sms-settings"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.smsEnabled").value(false));
    }

    @Test
    @DisplayName("GET — 상담사면 403")
    @WithMockUser(roles = {"CONSULTANT"})
    void getSettings_whenConsultant_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/tenant-sms-settings"))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT — ADMIN이면 200")
    @WithMockUser(roles = {"ADMIN"})
    void putSettings_whenAdmin_returns200() throws Exception {
        TenantSmsSettingsUpdateRequest request = TenantSmsSettingsUpdateRequest.builder()
            .smsEnabled(true)
            .provider("nhn")
            .senderNumber("01033334444")
            .apiKeyRef("vault-k")
            .apiSecretRef("vault-s")
            .build();

        TenantSmsSettingsResponse saved = TenantSmsSettingsResponse.builder()
            .tenantId(TEST_TENANT_ID)
            .smsEnabled(true)
            .provider("nhn")
            .build();

        when(tenantSmsSettingsService.upsert(eq(TEST_TENANT_ID), any(TenantSmsSettingsUpdateRequest.class)))
            .thenReturn(saved);

        mockMvc.perform(put("/api/v1/admin/tenant-sms-settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("수정되었습니다."))
            .andExpect(jsonPath("$.data.provider").value("nhn"));

        verify(tenantSmsSettingsService).upsert(eq(TEST_TENANT_ID), any(TenantSmsSettingsUpdateRequest.class));
    }

    @Test
    @DisplayName("PUT — 테넌트 없으면 400")
    @WithMockUser(roles = {"ADMIN"})
    void putSettings_whenTenantMissing_returns400() throws Exception {
        TenantContextHolder.clear();
        TenantSmsSettingsUpdateRequest request = TenantSmsSettingsUpdateRequest.builder()
            .smsEnabled(true)
            .build();

        mockMvc.perform(put("/api/v1/admin/tenant-sms-settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("TENANT_CONTEXT_MISSING"));
    }
}
