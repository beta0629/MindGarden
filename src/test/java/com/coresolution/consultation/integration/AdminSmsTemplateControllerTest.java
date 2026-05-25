package com.coresolution.consultation.integration;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import com.coresolution.consultation.dto.SmsTemplateAdminItem;
import com.coresolution.consultation.dto.SmsTemplatePreviewResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SmsTemplateService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * {@code AdminSmsTemplateController} MockMvc 테스트.
 *
 * <p>RBAC 검증: GET/preview = ADMIN/STAFF, PUT/DELETE = ADMIN.
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("어드민 SMS 템플릿 관리 API")
class AdminSmsTemplateControllerTest {

    private static final String TENANT_ID = UUID.randomUUID().toString();
    private static final Long TEST_USER_ID = 999L;
    private static final String TEMPLATE_KEY = "PAYMENT_COMPLETED";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SmsTemplateService smsTemplateService;

    @BeforeEach
    void setTenantContext() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("GET /api/v1/admin/sms-templates — ADMIN 200")
    @WithMockUser(roles = {"ADMIN"})
    void list_whenAdmin_returns200() throws Exception {
        SmsTemplateAdminItem item = SmsTemplateAdminItem.builder()
            .key(TEMPLATE_KEY)
            .label("결제 완료")
            .globalContent("[마인드가든] 결제 완료")
            .tenantOverride(false)
            .updatedAt(LocalDateTime.now())
            .build();
        when(smsTemplateService.listForAdmin(TENANT_ID)).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/admin/sms-templates"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data[0].key").value(TEMPLATE_KEY));
    }

    @Test
    @DisplayName("GET /api/v1/admin/sms-templates — STAFF 200 (READ-ONLY)")
    @WithMockUser(roles = {"STAFF"})
    void list_whenStaff_returns200() throws Exception {
        when(smsTemplateService.listForAdmin(TENANT_ID)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/admin/sms-templates"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/v1/admin/sms-templates/{key} — STAFF 권한이면 403")
    @WithMockUser(roles = {"STAFF"})
    void update_whenStaff_returns403() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("content", "수정 본문"));

        mockMvc.perform(put("/api/v1/admin/sms-templates/" + TEMPLATE_KEY)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isForbidden());

        verify(smsTemplateService, never())
            .upsertTenantOverride(anyString(), anyString(), anyString(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/admin/sms-templates/{key} — ADMIN + 정상 본문이면 200")
    @WithMockUser(roles = {"ADMIN"})
    void update_whenAdmin_returns200() throws Exception {
        SmsTemplateAdminItem item = SmsTemplateAdminItem.builder()
            .key(TEMPLATE_KEY)
            .tenantOverride(true)
            .tenantContent("새 본문")
            .build();
        when(smsTemplateService.upsertTenantOverride(eq(TEMPLATE_KEY), eq("새 본문"), eq(TENANT_ID), any()))
            .thenReturn(item);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(buildCurrentUser());

            mockMvc.perform(put("/api/v1/admin/sms-templates/" + TEMPLATE_KEY)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of("content", "새 본문"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tenantContent").value("새 본문"));
        }

        verify(smsTemplateService).upsertTenantOverride(eq(TEMPLATE_KEY), eq("새 본문"), eq(TENANT_ID), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/sms-templates/{key}/tenant-override — ADMIN 200")
    @WithMockUser(roles = {"ADMIN"})
    void deleteOverride_whenAdmin_returns200() throws Exception {
        SmsTemplateAdminItem item = SmsTemplateAdminItem.builder()
            .key(TEMPLATE_KEY)
            .tenantOverride(false)
            .build();
        when(smsTemplateService.deleteTenantOverride(eq(TEMPLATE_KEY), eq(TENANT_ID), any()))
            .thenReturn(item);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(buildCurrentUser());

            mockMvc.perform(delete("/api/v1/admin/sms-templates/" + TEMPLATE_KEY + "/tenant-override"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        }
    }

    @Test
    @DisplayName("POST /api/v1/admin/sms-templates/{key}/preview — ADMIN 200")
    @WithMockUser(roles = {"ADMIN"})
    void preview_whenAdmin_returns200() throws Exception {
        SmsTemplatePreviewResponse response = SmsTemplatePreviewResponse.builder()
            .key(TEMPLATE_KEY)
            .sourceContent("[마인드가든] {{paymentAmount}}원 결제")
            .previewContent("[마인드가든] 500,000원 결제")
            .byteLength(40)
            .charLength(20)
            .missingVariables(List.of())
            .fromTenantOverride(false)
            .build();
        when(smsTemplateService.preview(eq(TEMPLATE_KEY), eq(TENANT_ID), any(), eq(true)))
            .thenReturn(Optional.of(response));

        String body = objectMapper.writeValueAsString(Map.of(
            "variables", Map.of("paymentAmount", "500,000"),
            "preferTenantOverride", true));

        mockMvc.perform(post("/api/v1/admin/sms-templates/" + TEMPLATE_KEY + "/preview")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.previewContent").value("[마인드가든] 500,000원 결제"))
            .andExpect(jsonPath("$.data.byteLength").value(40));
    }

    @Test
    @DisplayName("POST /api/v1/admin/sms-templates/{key}/preview — 존재하지 않는 키면 404")
    @WithMockUser(roles = {"ADMIN"})
    void preview_whenKeyMissing_returns404() throws Exception {
        when(smsTemplateService.preview(anyString(), anyString(), any(), any(Boolean.class)))
            .thenReturn(Optional.empty());

        mockMvc.perform(post("/api/v1/admin/sms-templates/UNKNOWN_KEY/preview")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isNotFound());
    }

    private User buildCurrentUser() {
        User user = new User();
        user.setId(TEST_USER_ID);
        user.setUserId("admin_tester");
        user.setTenantId(TENANT_ID);
        return user;
    }
}
