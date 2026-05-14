package com.coresolution.consultation.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@code SecurityConfig} 기준 {@code /api/v1/meditations/**} 는 인증 필요.
 * {@link com.coresolution.core.filter.TenantContextFilter} 가 먼저 실행되므로,
 * 익명 요청은 {@code X-Tenant-Id} 헤더로 테넌트 힌트를 준 뒤 Spring Security 가 401을 내는지 검증한다.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("GET /api/v1/meditations 익명 시 Spring Security 401")
class MeditationsUnauthenticatedSecurityMvcIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("테넌트 헤더만 있고 인증 없으면 Spring Security 401")
    void listMeditations_anonymousWithTenantHeader_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/meditations")
                        .header("X-Tenant-Id", "tenant-meditations-security-smoke"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }
}
