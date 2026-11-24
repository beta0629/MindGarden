package com.coresolution.consultation.sct.unit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.UUID;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.sct.dto.SctSettingsResponse;
import com.coresolution.consultation.sct.dto.SctSettingsUpdateRequest;
import com.coresolution.consultation.sct.service.SctSettingsService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * SCT 설정 API — feature OFF 에서도 ADMIN GET/PUT 200, STAFF PUT 403.
 *
 * @author MindGarden
 * @since 2026-11-24
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("AdminSctSettingsController API")
class AdminSctSettingsControllerTest {

    private static final String TENANT_ID = UUID.randomUUID().toString();
    private static final Long TEST_USER_ID = 901L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SctSettingsService sctSettingsService;

    @BeforeEach
    void setTenantContext() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("GET /api/v1/admin/sct-settings — ADMIN, feature OFF 여도 200")
    @WithMockUser(roles = {"ADMIN"})
    void get_whenAdminAndFeatureDisabled_returns200() throws Exception {
        when(sctSettingsService.getSettings(TENANT_ID)).thenReturn(
                SctSettingsResponse.builder()
                        .linkExpiryDays(14)
                        .retentionDays(365)
                        .featureEnabled(false)
                        .build());

        mockMvc.perform(get("/api/v1/admin/sct-settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.featureEnabled").value(false))
                .andExpect(jsonPath("$.data.linkExpiryDays").value(14));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/sct-settings — ADMIN, feature OFF 에서 ON 전환 200")
    @WithMockUser(roles = {"ADMIN"})
    void put_whenAdminAndFeatureDisabled_returns200() throws Exception {
        User actor = new User();
        actor.setId(TEST_USER_ID);
        actor.setRole(UserRole.ADMIN);
        when(sctSettingsService.updateSettings(
                eq(TENANT_ID), any(SctSettingsUpdateRequest.class), eq(TEST_USER_ID), anyString()))
                .thenReturn(SctSettingsResponse.builder()
                        .linkExpiryDays(14)
                        .retentionDays(365)
                        .featureEnabled(true)
                        .build());

        try (MockedStatic<SessionUtils> sessions = mockStatic(SessionUtils.class)) {
            sessions.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class))).thenReturn(actor);

            String body = objectMapper.writeValueAsString(Map.of(
                    "featureEnabled", true,
                    "linkExpiryDays", 14,
                    "retentionDays", 365));

            mockMvc.perform(put("/api/v1/admin/sct-settings")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.featureEnabled").value(true));
        }
    }

    @Test
    @DisplayName("PUT /api/v1/admin/sct-settings — STAFF 403")
    @WithMockUser(roles = {"STAFF"})
    void put_whenStaff_returns403() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("featureEnabled", true));

        mockMvc.perform(put("/api/v1/admin/sct-settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());

        verify(sctSettingsService, never())
                .updateSettings(anyString(), any(), anyLong(), anyString());
    }
}
