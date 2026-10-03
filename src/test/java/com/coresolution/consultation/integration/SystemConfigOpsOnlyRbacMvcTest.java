package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.coresolution.consultation.constant.SessionSecurityFlagKeys;
import com.coresolution.consultation.constant.SystemConfigAccessPolicy;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
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
import org.springframework.test.web.servlet.MvcResult;

/**
 * system-config 운영자 전용 쓰기 RBAC 매트릭스 MockMvc 테스트.
 *
 * <p>P1 보안(2026-10-03):
 * <table>
 *   <caption>역할별 기대 결과</caption>
 *   <tr><th>엔드포인트</th><th>ADMIN</th><th>STAFF</th><th>CONSULTANT</th><th>CLIENT</th></tr>
 *   <tr><td>POST AI 기본 provider·키 테스트·모델 목록</td><td>403(ops)</td><td>403</td><td>403</td><td>403</td></tr>
 *   <tr><td>POST /{AI 키·URL·모델·AI_DEFAULT_PROVIDER}</td><td>403(ops)</td><td>403</td><td>403</td><td>403</td></tr>
 *   <tr><td>POST /{플랫폼 세션 스위치 3종}</td><td>403(ops)</td><td>403</td><td>403</td><td>403</td></tr>
 *   <tr><td>POST /{중복 로그인 허용}</td><td>200</td><td>403</td><td>403</td><td>403</td></tr>
 * </table>
 *
 * <p>미인증 401 은 필터 체인이 필요해 {@code SettingsRbacUnauthenticatedMvcTest} 가 담당한다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("system-config — 운영자 전용 쓰기 역할 매트릭스")
class SystemConfigOpsOnlyRbacMvcTest {

    private static final String BASE = "/api/v1/admin/system-config/";

    private static final String SESSION_TENANT = "tenant-sysconfig-a";

    private static final String OTHER_TENANT = "tenant-sysconfig-b";

    private static final String PLAIN_SECRET = "sk-plain-secret-value-9876";

    private static final String OPS_ONLY_MESSAGE = "운영자 전용 설정입니다";

    /** 운영자 전용 POST 경로 (본문 무관하게 403). */
    private static final List<String> OPS_ONLY_POST_PATHS = List.of(
            BASE + "ai-default-provider",
            BASE + "test-openai",
            BASE + "test-gemini",
            BASE + "openai-models",
            BASE + "gemini-models",
            BASE + "OPENAI_API_KEY",
            BASE + "OPENAI_API_URL",
            BASE + "GEMINI_MODEL",
            BASE + SystemConfigAccessPolicy.AI_DEFAULT_PROVIDER,
            BASE + SessionSecurityFlagKeys.OAUTH_REQUIRE_SERVER_VERIFY,
            BASE + SessionSecurityFlagKeys.BACKGROUND_401_KEEP_USER,
            BASE + SessionSecurityFlagKeys.SOFT_FAIL_ENABLED);

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SystemConfigService systemConfigService;

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    private static User sessionUser(UserRole role, String tenantId) {
        User user = User.builder().email("someone@example.com").build();
        user.setId(91001L);
        user.setRole(role);
        user.setTenantId(tenantId);
        return user;
    }

    private MvcResult postJson(String path, String tenantHeader) throws Exception {
        return mockMvc.perform(post(path)
                        .header("X-Tenant-Id", tenantHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"configValue\":\"true\",\"providerId\":\"openai\","
                                + "\"apiUrl\":\"https://attacker.example.test/collect\"}"))
                .andReturn();
    }

    private void assertAllOpsOnlyPathsForbidden(UserRole role, boolean expectOpsMessage) throws Exception {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(sessionUser(role, SESSION_TENANT));

            for (String path : OPS_ONLY_POST_PATHS) {
                MvcResult result = postJson(path, SESSION_TENANT);
                assertThat(result.getResponse().getStatus()).as("%s 403: %s", role, path).isEqualTo(403);
                String body = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
                if (expectOpsMessage) {
                    assertThat(body).as("운영자 전용 메시지: %s", path).contains(OPS_ONLY_MESSAGE);
                } else {
                    assertThat(body).as("권한 없음: %s", path).doesNotContain(OPS_ONLY_MESSAGE);
                }
            }
        }
        verify(systemConfigService, never()).setConfigValue(anyString(), anyString(), any(), any());
        verify(systemConfigService, never()).setAiDefaultProvider(anyString());
        verify(systemConfigService, never()).getOpenAIApiKey();
    }

    @Test
    @DisplayName("ADMIN — 운영자 전용 POST 12종 모두 403(운영자 전용), 저장·키 조회 없음")
    @WithMockUser(roles = {"ADMIN"})
    void admin_opsOnlyPosts_return403() throws Exception {
        assertAllOpsOnlyPathsForbidden(UserRole.ADMIN, true);
    }

    @Test
    @DisplayName("STAFF — 운영자 전용 POST 12종 모두 403")
    @WithMockUser(roles = {"STAFF"})
    void staff_opsOnlyPosts_return403() throws Exception {
        assertAllOpsOnlyPathsForbidden(UserRole.STAFF, false);
    }

    @Test
    @DisplayName("CONSULTANT — 운영자 전용 POST 12종 모두 403")
    @WithMockUser(roles = {"CONSULTANT"})
    void consultant_opsOnlyPosts_return403() throws Exception {
        assertAllOpsOnlyPathsForbidden(UserRole.CONSULTANT, false);
    }

    @Test
    @DisplayName("CLIENT — 운영자 전용 POST 12종 모두 403")
    @WithMockUser(roles = {"CLIENT"})
    void client_opsOnlyPosts_return403() throws Exception {
        assertAllOpsOnlyPathsForbidden(UserRole.CLIENT, false);
    }

    @Test
    @DisplayName("중복 로그인 허용 — ADMIN 200, 저장은 헤더가 아닌 세션 테넌트로 스코프")
    @WithMockUser(roles = {"ADMIN"})
    void duplicateLogin_admin_savesUnderSessionTenantOnly() throws Exception {
        AtomicReference<String> tenantAtSave = new AtomicReference<>();
        doAnswer(invocation -> {
            tenantAtSave.set(TenantContextHolder.getTenantId());
            return null;
        }).when(systemConfigService).setConfigValue(
                eq(SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED), eq("true"), any(), any());

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(sessionUser(UserRole.ADMIN, SESSION_TENANT));

            MvcResult result = postJson(BASE + SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED, OTHER_TENANT);
            assertThat(result.getResponse().getStatus()).isEqualTo(200);
        }
        assertThat(tenantAtSave.get()).isEqualTo(SESSION_TENANT);
    }

    @Test
    @DisplayName("중복 로그인 허용 — STAFF 403, 저장 없음")
    @WithMockUser(roles = {"STAFF"})
    void duplicateLogin_staff_returns403() throws Exception {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(sessionUser(UserRole.STAFF, SESSION_TENANT));

            MvcResult result = postJson(BASE + SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED, SESSION_TENANT);
            assertThat(result.getResponse().getStatus()).isEqualTo(403);
        }
        verify(systemConfigService, never()).setConfigValue(anyString(), anyString(), any(), any());
    }

    @Test
    @DisplayName("ADMIN GET AI 키 — 평문 없이 마스킹 값과 opsOnly=true, 세션 테넌트로 조회")
    @WithMockUser(roles = {"ADMIN"})
    void admin_getAiKey_isMaskedAndOpsOnly() throws Exception {
        AtomicReference<String> tenantAtRead = new AtomicReference<>();
        when(systemConfigService.getConfigValue(eq("OPENAI_API_KEY"), anyString())).thenAnswer(invocation -> {
            tenantAtRead.set(TenantContextHolder.getTenantId());
            return PLAIN_SECRET;
        });

        String body;
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(sessionUser(UserRole.ADMIN, SESSION_TENANT));

            MvcResult result = mockMvc.perform(get(BASE + "OPENAI_API_KEY").header("X-Tenant-Id", OTHER_TENANT))
                    .andReturn();
            assertThat(result.getResponse().getStatus()).isEqualTo(200);
            body = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        }
        assertThat(body).doesNotContain(PLAIN_SECRET);
        assertThat(body).contains("\"opsOnly\":true");
        assertThat(tenantAtRead.get()).isEqualTo(SESSION_TENANT);
    }
}
