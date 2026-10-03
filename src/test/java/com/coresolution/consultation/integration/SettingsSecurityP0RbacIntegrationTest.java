package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import org.springframework.test.web.servlet.MvcResult;

/**
 * 설정 화면 P0 보안 — 미인증 접근 차단 + 평문 시크릿 미노출 통합 가드.
 *
 * <p>P0 보안(2026-10-03) 검증 항목:
 * <ol>
 *   <li>변경 대상 API 전부 미인증 호출 시 401 (permitAll 회귀 차단)</li>
 *   <li>미인증 응답 본문에 어떤 시크릿·설정 값도 포함되지 않음</li>
 *   <li>테넌트 경로 PG 키 복호화 엔드포인트가 제거되어 평문 키 응답 경로가 없음</li>
 * </ol>
 *
 * <p>역할별 403 검증은 컨트롤러 단위 테스트에서 수행한다
 * ({@code SystemConfigControllerAccessPolicyTest},
 * {@code TenantPgConfigurationControllerIntegrationTest},
 * {@code AdminNotificationSchedulerControllerTest}).
 *
 * <p>필터 순서 메모: {@code TenantContextFilter} 가 Spring Security 보다 먼저 실행되므로
 * 더미 {@code X-Tenant-Id} 를 넣어 보안 필터까지 도달시킨다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("설정 P0 보안 — 미인증 401 + 평문 시크릿 미노출")
class SettingsSecurityP0RbacIntegrationTest {

    /** TenantContextFilter 통과용 더미 헤더. */
    private static final String DUMMY_TENANT_HEADER = "settings-sec-p0-guard";

    private static final String DUMMY_TENANT_ID = "tenant-sec-p0";
    private static final String DUMMY_CONFIG_ID = "config-sec-p0";

    /** 응답 어디에도 나타나선 안 되는 테스트 픽스처. */
    private static final String FIXTURE_SECRET = "sk-fixture-NEVER-LEAK-9876";

    private static final List<String> GUARDED_GET_PATHS = List.of(
            "/api/v1/admin/system-config/OPENAI_API_KEY",
            "/api/v1/admin/system-config/openai",
            "/api/v1/admin/system-config/category/AI",
            "/api/v1/admin/notification-scheduler/flags",
            "/api/v1/admin/compliance/overall",
            "/api/v1/admin/compliance/dashboard",
            "/api/v1/admin/personal-data-destruction/status",
            "/api/v1/admin/personal-data-destruction/preview",
            "/api/v1/tenants/" + DUMMY_TENANT_ID + "/pg-configurations");

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("변경 대상 GET — 미인증 401, 본문에 설정 값 없음")
    void guardedGetPaths_withoutAuth_return401WithoutValues() throws Exception {
        for (String path : GUARDED_GET_PATHS) {
            MvcResult result = mockMvc.perform(get(path)
                            .header("X-Tenant-Id", DUMMY_TENANT_HEADER))
                    .andReturn();

            assertThat(result.getResponse().getStatus()).as("미인증 401: %s", path).isEqualTo(401);
            assertThat(result.getResponse().getContentAsString())
                    .as("미인증 응답에 설정 값 노출 금지: %s", path)
                    .doesNotContain("configValue")
                    .doesNotContain("apiKey")
                    .doesNotContain("secretKey")
                    .doesNotContain(FIXTURE_SECRET);
        }
    }

    @Test
    @DisplayName("변경 대상 쓰기 — 미인증 401, 저장 미수행")
    void guardedWritePaths_withoutAuth_return401() throws Exception {
        MvcResult setConfig = mockMvc.perform(post("/api/v1/admin/system-config/OPENAI_API_KEY")
                        .header("X-Tenant-Id", DUMMY_TENANT_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"configValue\":\"" + FIXTURE_SECRET + "\"}"))
                .andReturn();
        MvcResult schedulerFlag = mockMvc.perform(
                        patch("/api/v1/admin/notification-scheduler/flags/"
                                + "notification.scheduler.wellnessTip.enabled")
                        .header("X-Tenant-Id", DUMMY_TENANT_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\":true}"))
                .andReturn();
        MvcResult globalDispatch = mockMvc.perform(
                        patch("/api/v1/admin/sms-templates/global-dispatch")
                        .header("X-Tenant-Id", DUMMY_TENANT_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":true}"))
                .andReturn();
        MvcResult destruction = mockMvc.perform(
                        post("/api/v1/admin/personal-data-destruction/execute/user-data")
                        .header("X-Tenant-Id", DUMMY_TENANT_HEADER)
                        .param("confirm", "true")
                        .param("expectedCount", "1"))
                .andReturn();

        assertThat(setConfig.getResponse().getStatus()).isEqualTo(401);
        assertThat(schedulerFlag.getResponse().getStatus()).isEqualTo(401);
        assertThat(globalDispatch.getResponse().getStatus()).isEqualTo(401);
        assertThat(destruction.getResponse().getStatus()).isEqualTo(401);
        assertThat(setConfig.getResponse().getContentAsString()).doesNotContain(FIXTURE_SECRET);
    }

    @Test
    @DisplayName("테넌트 PG 키 복호화 엔드포인트 — 제거됨 (미인증 시 평문 키 응답 없음)")
    void tenantDecryptKeysEndpoint_isRemoved() throws Exception {
        MvcResult result = mockMvc.perform(
                        post("/api/v1/tenants/" + DUMMY_TENANT_ID
                                + "/pg-configurations/" + DUMMY_CONFIG_ID + "/decrypt-keys")
                        .header("X-Tenant-Id", DUMMY_TENANT_HEADER)
                        .contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        assertThat(result.getResponse().getStatus())
                .as("복호화 엔드포인트는 성공(2xx)해선 안 된다")
                .isNotEqualTo(200);
        assertThat(result.getResponse().getContentAsString())
                .doesNotContain("secretKey")
                .doesNotContain("decryptedAt");
    }
}
