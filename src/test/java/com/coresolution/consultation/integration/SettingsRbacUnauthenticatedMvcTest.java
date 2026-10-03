package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 가드 대상 설정 API 의 미인증 401 검증 (필터 체인 포함).
 *
 * <p>역할별 403/200 매트릭스는 {@code SettingsRbacRoleMatrixMvcTest} 가 담당한다.
 * 여기서는 보안 필터가 실제로 동작해 토큰 없는 호출이 401 로 끊기는지만 본다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("설정 RBAC — 미인증 401")
class SettingsRbacUnauthenticatedMvcTest {

    /** TenantContextFilter 통과용 더미 헤더. */
    private static final String DUMMY_TENANT_HEADER = "tenant-rbac-anon";

    private static final List<String> GUARDED_GET_PATHS = List.of(
            "/api/v1/admin/compliance/personal-data-processing",
            "/api/v1/admin/compliance/impact-assessment",
            "/api/v1/admin/compliance/breach-response",
            "/api/v1/admin/compliance/education",
            "/api/v1/admin/compliance/policy",
            "/api/v1/admin/compliance/overall",
            "/api/v1/admin/compliance/dashboard",
            "/api/v1/admin/personal-data-destruction/status",
            "/api/v1/admin/personal-data-destruction/preview",
            "/api/v1/admin/notification-scheduler/flags");

    /** P1 보안(2026-10-03): system-config 운영자 전용 쓰기 경로. */
    private static final List<String> GUARDED_POST_PATHS = List.of(
            "/api/v1/admin/system-config/ai-default-provider",
            "/api/v1/admin/system-config/test-openai",
            "/api/v1/admin/system-config/test-gemini",
            "/api/v1/admin/system-config/OPENAI_API_KEY",
            "/api/v1/admin/system-config/security.session.soft-fail.enabled");

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("토큰 없이 호출하면 가드 대상 GET 10종 모두 401")
    void anonymousGets_return401() throws Exception {
        for (String path : GUARDED_GET_PATHS) {
            int status = mockMvc.perform(get(path).header("X-Tenant-Id", DUMMY_TENANT_HEADER))
                    .andReturn().getResponse().getStatus();
            assertThat(status).as("미인증 401: %s", path).isEqualTo(401);
        }
    }

    @Test
    @DisplayName("토큰 없이 system-config 운영자 전용 POST 를 호출하면 401")
    void anonymousSystemConfigPosts_return401() throws Exception {
        for (String path : GUARDED_POST_PATHS) {
            int status = mockMvc.perform(post(path)
                            .header("X-Tenant-Id", DUMMY_TENANT_HEADER)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"configValue\":\"true\"}"))
                    .andReturn().getResponse().getStatus();
            assertThat(status).as("미인증 401: %s", path).isEqualTo(401);
        }
    }
}
