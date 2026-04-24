package com.coresolution.consultation.integration;

import com.coresolution.consultation.dto.TenantKakaoAlimtalkSettingsResponse;
import com.coresolution.consultation.dto.TenantKakaoAlimtalkSettingsUpdateRequest;
import com.coresolution.consultation.service.TenantKakaoAlimtalkSettingsService;
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
 * {@code AdminTenantKakaoAlimtalkSettingsController} MockMvc 테스트.
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@DisplayName("어드민 카카오 알림톡 설정 API")
class AdminTenantKakaoAlimtalkSettingsControllerTest {

    private static final String TEST_TENANT_ID = UUID.randomUUID().toString();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TenantKakaoAlimtalkSettingsService tenantKakaoAlimtalkSettingsService;

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

        mockMvc.perform(get("/api/v1/admin/kakao-alimtalk-settings"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.errorCode").value("TENANT_CONTEXT_MISSING"));
    }

    @Test
    @DisplayName("GET — ADMIN이면 200")
    @WithMockUser(roles = {"ADMIN"})
    void getSettings_whenAdmin_returns200() throws Exception {
        TenantKakaoAlimtalkSettingsResponse body = TenantKakaoAlimtalkSettingsResponse.builder()
            .tenantId(TEST_TENANT_ID)
            .alimtalkEnabled(true)
            .templateConsultationConfirmed("TPL_CONFIRM")
            .templateConsultationReminder("")
            .templateConsultationCancelled("")
            .templateRefundCompleted("")
            .templateScheduleChanged("")
            .templatePaymentCompleted("")
            .templateDepositPendingReminder("")
            .kakaoApiKeyRef("ref-api")
            .kakaoSenderKeyRef("ref-sender")
            .build();
        when(tenantKakaoAlimtalkSettingsService.getEffectiveSettings(TEST_TENANT_ID)).thenReturn(body);

        mockMvc.perform(get("/api/v1/admin/kakao-alimtalk-settings"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.tenantId").value(TEST_TENANT_ID))
            .andExpect(jsonPath("$.data.alimtalkEnabled").value(true))
            .andExpect(jsonPath("$.data.templateConsultationConfirmed").value("TPL_CONFIRM"));

        verify(tenantKakaoAlimtalkSettingsService).getEffectiveSettings(TEST_TENANT_ID);
    }

    @Test
    @DisplayName("GET — STAFF이면 200")
    @WithMockUser(roles = {"STAFF"})
    void getSettings_whenStaff_returns200() throws Exception {
        TenantKakaoAlimtalkSettingsResponse body = TenantKakaoAlimtalkSettingsResponse.builder()
            .tenantId(TEST_TENANT_ID)
            .alimtalkEnabled(false)
            .build();
        when(tenantKakaoAlimtalkSettingsService.getEffectiveSettings(TEST_TENANT_ID)).thenReturn(body);

        mockMvc.perform(get("/api/v1/admin/kakao-alimtalk-settings"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.alimtalkEnabled").value(false));
    }

    @Test
    @DisplayName("GET — 상담사(CONSULTANT)면 403")
    @WithMockUser(roles = {"CONSULTANT"})
    void getSettings_whenConsultant_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/kakao-alimtalk-settings"))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT — ADMIN이면 200 및 upsert 호출")
    @WithMockUser(roles = {"ADMIN"})
    void putSettings_whenAdmin_returns200() throws Exception {
        TenantKakaoAlimtalkSettingsUpdateRequest request = TenantKakaoAlimtalkSettingsUpdateRequest.builder()
            .alimtalkEnabled(true)
            .templateConsultationConfirmed("NEW_TPL")
            .templateConsultationReminder(null)
            .templateConsultationCancelled(null)
            .templateRefundCompleted(null)
            .templateScheduleChanged(null)
            .templatePaymentCompleted(null)
            .templateDepositPendingReminder(null)
            .kakaoApiKeyRef("vault-ref-1")
            .kakaoSenderKeyRef("vault-ref-2")
            .build();

        TenantKakaoAlimtalkSettingsResponse saved = TenantKakaoAlimtalkSettingsResponse.builder()
            .tenantId(TEST_TENANT_ID)
            .alimtalkEnabled(true)
            .templateConsultationConfirmed("NEW_TPL")
            .build();

        when(tenantKakaoAlimtalkSettingsService.upsert(eq(TEST_TENANT_ID), any(TenantKakaoAlimtalkSettingsUpdateRequest.class)))
            .thenReturn(saved);

        mockMvc.perform(put("/api/v1/admin/kakao-alimtalk-settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("수정되었습니다."))
            .andExpect(jsonPath("$.data.templateConsultationConfirmed").value("NEW_TPL"));

        verify(tenantKakaoAlimtalkSettingsService).upsert(eq(TEST_TENANT_ID), any(TenantKakaoAlimtalkSettingsUpdateRequest.class));
    }

    @Test
    @DisplayName("PUT — 상담사면 403")
    @WithMockUser(roles = {"CONSULTANT"})
    void putSettings_whenConsultant_returns403() throws Exception {
        TenantKakaoAlimtalkSettingsUpdateRequest request = TenantKakaoAlimtalkSettingsUpdateRequest.builder()
            .alimtalkEnabled(true)
            .build();

        mockMvc.perform(put("/api/v1/admin/kakao-alimtalk-settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT — 테넌트 없으면 400")
    @WithMockUser(roles = {"ADMIN"})
    void putSettings_whenTenantMissing_returns400() throws Exception {
        TenantContextHolder.clear();
        TenantKakaoAlimtalkSettingsUpdateRequest request = TenantKakaoAlimtalkSettingsUpdateRequest.builder()
            .alimtalkEnabled(true)
            .build();

        mockMvc.perform(put("/api/v1/admin/kakao-alimtalk-settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("TENANT_CONTEXT_MISSING"));
    }
}
