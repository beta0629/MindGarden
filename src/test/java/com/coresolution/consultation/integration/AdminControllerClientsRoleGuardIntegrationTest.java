package com.coresolution.consultation.integration;

import java.util.Map;

import com.coresolution.consultation.service.AdminService;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * {@code /api/v1/admin/clients} 역할 가드 — 내담자(CLIENT)·상담사(CONSULTANT) 권한으로는 403 이고
 * 서비스(내담자 목록 조회·등록)가 호출되지 않는다. {@code @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")} 고정.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@DisplayName("AdminController /clients — ADMIN/STAFF 외 역할 403")
class AdminControllerClientsRoleGuardIntegrationTest {

    private static final String CLIENTS_PATH = "/api/v1/admin/clients";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminService adminService;

    @Test
    @WithMockUser(username = "client-guard", roles = "CLIENT")
    @DisplayName("CLIENT 권한 GET /clients → 403, 내담자 목록 조회 안 함")
    void client_getAllClients_forbidden() throws Exception {
        mockMvc.perform(get(CLIENTS_PATH))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"))
                .andExpect(content().string(not(containsString("\"clients\""))));

        verify(adminService, never()).getAllClients();
    }

    @Test
    @WithMockUser(username = "consultant-guard", roles = "CONSULTANT")
    @DisplayName("CONSULTANT 권한 GET /clients → 403")
    void consultant_getAllClients_forbidden() throws Exception {
        mockMvc.perform(get(CLIENTS_PATH))
                .andExpect(status().isForbidden());

        verify(adminService, never()).getAllClients();
    }

    @Test
    @WithMockUser(username = "client-guard", roles = "CLIENT")
    @DisplayName("CLIENT 권한 POST /clients(위젯 등록 경로) → 403, 등록 안 함")
    void client_registerClient_forbidden() throws Exception {
        mockMvc.perform(post(CLIENTS_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "guard-client@test.com", "name", "테스트내담자"))))
                .andExpect(status().isForbidden());

        verify(adminService, never()).registerClient(any());
    }
}
