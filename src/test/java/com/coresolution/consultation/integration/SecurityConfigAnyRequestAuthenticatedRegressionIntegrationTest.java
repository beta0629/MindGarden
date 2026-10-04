package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.util.List;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.controller.AdminSessionForceLogoutController;
import com.coresolution.consultation.dto.auth.AdminForceLogoutRequest;
import com.coresolution.consultation.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * PR-3d (B8) 회귀 가드 — {@link com.coresolution.consultation.config.SecurityConfig}
 * {@code .anyRequest().authenticated()} 정책이 운영·개발 두 분기 모두에서 유지되는지,
 * 그리고 Public 화이트리스트가 누락되지 않았는지 행위 기반으로 검증한다.
 *
 * <p><strong>설계 근거</strong>: Spring Security {@code FilterChainProxy} 의 내부 매처는
 * 리플렉션이 깨지기 쉽고 Spring 버전 업그레이드 시 재작성 비용이 높다. 행위 기반 검증
 * (실제 HTTP 호출 → 401 / Non-401 분류) 은 정책 변경의 *효과* 를 직접 보장하므로
 * 회귀 안전성이 가장 높다.</p>
 *
 * <p><strong>필터 순서 메모</strong>:
 * {@link com.coresolution.core.filter.TenantContextFilter} 가 Spring Security 보다 먼저
 * 실행되어 비공개 경로에 {@code X-Tenant-Id} 가 없으면 400 을 즉시 반환한다. 따라서 본
 * 테스트에서 401 회귀를 검증하려면 더미 {@code X-Tenant-Id} 를 포함해
 * TenantContextFilter 를 통과시킨 뒤 SecurityFilter 까지 도달하도록 한다.</p>
 *
 * <p><strong>검증 매트릭스</strong>:
 * <ol>
 *   <li>매트릭스 미정의 임의 경로(예: {@code /api/v1/__random_unmapped_xyz_})
 *       → 인증 없이 호출 시 반드시 401 (anyRequest authenticated 정합)</li>
 *   <li>Public 화이트리스트 핵심 (auth, actuator/health, error, openapi, onboarding 공개 경로)
 *       → 인증 없이 호출 시 401 이 *나오지 않아야* 한다 (= 화이트리스트 누락 시 fail)</li>
 *   <li>민감 온보딩·ops 온보딩 → 미인증 시 401 (SecurityConfig authenticated + ops/** 매트릭스)</li>
 * </ol>
 *
 * @author MindGarden
 * @since 2026-06-14
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("SecurityConfig anyRequest().authenticated() 회귀 가드 (PR-3d)")
class SecurityConfigAnyRequestAuthenticatedRegressionIntegrationTest {

    /** TenantContextFilter 통과용 더미 헤더(매트릭스 미정의 경로 호출 시 보안 필터까지 도달시키기 위함). */
    private static final String DUMMY_TENANT_HEADER = "pr3d-regression-guard";

    private static final String ADMIN_FORCE_LOGOUT_PATH = "/api/v1/admin/sessions/force-logout";
    private static final String LEGACY_FORCE_LOGOUT_PATH = "/api/v1/auth/force-logout";
    private static final String FORCE_LOGOUT_BODY = "{\"email\":\"probe@example.com\"}";
    private static final String CSS_THEMES_PATH = "/api/v1/admin/css-themes/themes";
    private static final String CSS_THEME_PROBE_PATH = CSS_THEMES_PATH + "/__pr_css_theme_probe__";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminSessionForceLogoutController adminSessionForceLogoutController;

    /**
     * 매트릭스에 정의되지 않은 임의 경로는 인증이 없으면 401 이어야 한다.
     * permitAll 회귀 시 200/404 가 반환되어 본 테스트가 명시적으로 fail 한다.
     */
    @Test
    @DisplayName("매트릭스 미정의 경로 + 인증 없음 → 401 (permitAll 회귀 차단)")
    void unmatchedPath_withoutAuth_returns401() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/__pr3d_regression_guard__")
                        .header("X-Tenant-Id", DUMMY_TENANT_HEADER))
                .andReturn();

        int status = result.getResponse().getStatus();
        assertThat(status)
                .as("PR-3d 회귀: anyRequest().authenticated() 가 permitAll() 로 되돌아갔습니다. "
                        + "/api/v1/__pr3d_regression_guard__ 호출은 401 이어야 합니다. "
                        + "SecurityConfig#filterChain 의 .anyRequest() 호출을 .authenticated() 로 복원하세요.")
                .isEqualTo(401);
    }

    /**
     * Public 화이트리스트 핵심 경로는 인증 없이도 401 이 *아니어야* 한다.
     * 401 이 반환되면 화이트리스트 누락 또는 매처 순서 회귀를 의미한다.
     */
    @Test
    @DisplayName("/api/v1/auth/** 는 인증 없이도 401 이 아니다 (인증 API 화이트리스트)")
    void authPath_withoutAuth_isNotUnauthorized() throws Exception {
        int status = mockMvc.perform(get("/api/v1/auth/__pr3d_probe__"))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("PR-3d Public 화이트리스트 회귀: /api/v1/auth/** 가 401 입니다. "
                        + "SecurityConfig.filterChain 의 .requestMatchers(\"/api/v1/auth/**\").permitAll() 매처를 복원하세요.")
                .isNotEqualTo(401);
    }

    @Test
    @DisplayName("/actuator/health 는 인증 없이도 401 이 아니다 (관측성 화이트리스트)")
    void actuatorHealth_withoutAuth_isNotUnauthorized() throws Exception {
        int status = mockMvc.perform(get("/actuator/health"))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("PR-3d Public 화이트리스트 회귀: /actuator/health 가 401 입니다. "
                        + "SecurityConfig.filterChain 의 .requestMatchers(\"/actuator/health\", \"/actuator/health/**\").permitAll() 를 복원하세요.")
                .isNotEqualTo(401);
    }

    @Test
    @DisplayName("/error 는 인증 없이도 401 이 아니다 (에러 핸들러 화이트리스트)")
    void errorPath_withoutAuth_isNotUnauthorized() throws Exception {
        int status = mockMvc.perform(get("/error"))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("PR-3d Public 화이트리스트 회귀: /error 가 401 입니다. "
                        + "Spring Boot 에러 디스패치가 차단되면 사용자에게 빈 응답이 반환됩니다. "
                        + "SecurityConfig.filterChain 의 .requestMatchers(\"/error\").permitAll() 를 복원하세요.")
                .isNotEqualTo(401);
    }

    @Test
    @DisplayName("/v3/api-docs 는 인증 없이도 401 이 아니다 (OpenAPI 화이트리스트)")
    void openApiDocs_withoutAuth_isNotUnauthorized() throws Exception {
        int status = mockMvc.perform(get("/v3/api-docs"))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("PR-3d Public 화이트리스트 회귀: /v3/api-docs 가 401 입니다. "
                        + "SecurityConfig.filterChain 의 .requestMatchers(\"/v3/api-docs\", \"/v3/api-docs/**\").permitAll() 를 복원하세요.")
                .isNotEqualTo(401);
    }

    @Test
    @DisplayName("/api/v1/onboarding/captcha/site-key 는 인증 없이도 401 이 아니다 (공개 온보딩 화이트리스트)")
    void onboardingPublicPath_withoutAuth_isNotUnauthorized() throws Exception {
        int status = mockMvc.perform(get("/api/v1/onboarding/captcha/site-key"))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("PR-3d Public 화이트리스트 회귀: /api/v1/onboarding/captcha/site-key 가 401 입니다. "
                        + "공개 온보딩(생성·captcha) 은 로그인 전 접근이 필수입니다. "
                        + "SecurityConfig.filterChain 의 .requestMatchers(\"/api/v1/onboarding/**\").permitAll() 를 복원하세요.")
                .isNotEqualTo(401);
    }

    @Test
    @DisplayName("공개 온보딩 GET /api/v1/onboarding/requests/public 미인증 → 401 아님")
    void onboardingPublicList_withoutAuth_isNotUnauthorized() throws Exception {
        int status = mockMvc.perform(get("/api/v1/onboarding/requests/public")
                        .param("email", "probe@example.com"))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("공개 온보딩 requests/public 이 401 이면 민감 매처({id})가 public 을 잘못 가로챈 것입니다.")
                .isNotEqualTo(401);
    }

    @Test
    @DisplayName("민감 온보딩 GET /api/v1/onboarding/requests/pending 미인증 → 401 (SecurityConfig authenticated)")
    void onboardingSensitivePending_withoutAuth_isUnauthorizedOrForbidden() throws Exception {
        int status = mockMvc.perform(get("/api/v1/onboarding/requests/pending"))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("P0: 민감 온보딩 pending 은 SecurityConfig authenticated 매처로 미인증 시 401 이어야 합니다.")
                .isEqualTo(401);
    }

    @Test
    @DisplayName("민감 온보딩 GET /api/v1/onboarding/requests (list) 미인증 → 401")
    void onboardingSensitiveList_withoutAuth_isUnauthorized() throws Exception {
        int status = mockMvc.perform(get("/api/v1/onboarding/requests"))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("P0: GET /api/v1/onboarding/requests (exact list) 는 authenticated 이어야 합니다.")
                .isEqualTo(401);
    }

    @Test
    @DisplayName("민감 온보딩 GET /api/v1/onboarding/requests/{numericId} 미인증 → 401")
    void onboardingSensitiveGetById_withoutAuth_isUnauthorized() throws Exception {
        int status = mockMvc.perform(get("/api/v1/onboarding/requests/1"))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("P0: GET /api/v1/onboarding/requests/{id:\\d+} 는 authenticated 이어야 합니다.")
                .isEqualTo(401);
    }

    @Test
    @DisplayName("민감 온보딩 PUT /api/v1/onboarding/requests/{numericId} 미인증 → 401")
    void onboardingSensitivePutById_withoutAuth_isUnauthorized() throws Exception {
        int status = mockMvc.perform(put("/api/v1/onboarding/requests/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tenantName\":\"probe\"}"))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("P0: PUT /api/v1/onboarding/requests/{id:\\d+} 는 authenticated 이어야 합니다.")
                .isEqualTo(401);
    }

    @Test
    @DisplayName("민감 온보딩 POST /api/v1/onboarding/requests/{id}/decision 미인증 → 401")
    void onboardingSensitiveDecision_withoutAuth_isUnauthorizedOrForbidden() throws Exception {
        int status = mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .post("/api/v1/onboarding/requests/1/decision")
                                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                                .content("{\"status\":\"APPROVED\",\"actorId\":\"x\"}"))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("P0: 민감 온보딩 decision 은 SecurityConfig authenticated 매처로 미인증 시 401 이어야 합니다.")
                .isEqualTo(401);
    }

    @Test
    @DisplayName("/api/v1/ops/onboarding/requests/pending 미인증 → 401 (ops permitAll 제거)")
    void opsOnboardingPending_withoutAuth_returns401() throws Exception {
        int status = mockMvc.perform(get("/api/v1/ops/onboarding/requests/pending")
                        .header("X-Tenant-Id", DUMMY_TENANT_HEADER))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("P0: /api/v1/ops/onboarding/** 는 permitAll 이 아니며 미인증 시 401 이어야 합니다.")
                .isEqualTo(401);
    }

    @Test
    @DisplayName("POST /api/v1/admin/sessions/force-logout 미인증 → 401")
    void adminForceLogout_withoutAuth_returns401() throws Exception {
        int status = mockMvc.perform(post(ADMIN_FORCE_LOGOUT_PATH)
                        .header("X-Tenant-Id", DUMMY_TENANT_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(FORCE_LOGOUT_BODY))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("P0: 관리자 강제 로그아웃은 미인증 시 401 이어야 합니다.")
                .isEqualTo(401);
    }

    @Test
    @DisplayName("관리자 강제 로그아웃 빈(@PreAuthorize) — ROLE_CLIENT 인증 호출 → AccessDenied(403)")
    void adminForceLogout_asClient_isAccessDenied() {
        User client = new User();
        client.setId(900_001L);
        client.setEmail("client-probe@example.com");
        client.setRole(UserRole.CLIENT);
        client.setTenantId(DUMMY_TENANT_HEADER);
        MockHttpSession clientSession = new MockHttpSession();
        clientSession.setAttribute(SessionConstants.USER_OBJECT, client);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                client.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CLIENT"))));
        try {
            assertThatThrownBy(() -> adminSessionForceLogoutController.forceLogout(
                    AdminForceLogoutRequest.builder().email("target@example.com").build(), clientSession))
                    .as("P0: 관리자 강제 로그아웃은 ADMIN 외 역할에 403(AccessDenied) 이어야 합니다.")
                    .isInstanceOf(AccessDeniedException.class);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    @DisplayName("구 경로 POST /api/v1/auth/force-logout 미인증 → 2xx 아님 (엔드포인트 삭제)")
    void legacyAuthForceLogout_withoutAuth_isNotSuccessful() throws Exception {
        int status = mockMvc.perform(post(LEGACY_FORCE_LOGOUT_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(FORCE_LOGOUT_BODY))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("P0: 구 공개 경로 /api/v1/auth/force-logout 은 제거되어 성공 응답이 나오면 안 됩니다.")
                .isNotIn(200, 201, 202, 204);
    }

    @Test
    @DisplayName("CSS 테마 조회 GET 미인증 → 401/403 아님 (로그인 전 화면 테마 로딩)")
    void cssThemeRead_withoutAuth_isPublic() throws Exception {
        int status = mockMvc.perform(get(CSS_THEMES_PATH)).andReturn().getResponse().getStatus();

        assertThat(status)
                .as("CSS 테마 조회는 GET permitAll 이어야 합니다.")
                .isNotIn(401, 403);
    }

    @Test
    @DisplayName("CSS 테마 저장·색상 저장·삭제 미인증 → 401/403 (GET 만 permitAll)")
    void cssThemeWrites_withoutAuth_areRejected() throws Exception {
        Integer[] statuses = {
            mockMvc.perform(post(CSS_THEMES_PATH).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"themeName\":\"__pr_css_theme_probe__\",\"displayName\":\"probe\"}"))
                .andReturn().getResponse().getStatus(),
            mockMvc.perform(post(CSS_THEME_PROBE_PATH + "/colors").contentType(MediaType.APPLICATION_JSON)
                    .content("[]"))
                .andReturn().getResponse().getStatus(),
            mockMvc.perform(delete(CSS_THEME_PROBE_PATH)).andReturn().getResponse().getStatus(),
        };

        assertThat(statuses)
                .as("P0: CSS 테마 쓰기는 미인증 시 401/403 이어야 합니다(permitAll 은 GET 만).")
                .allSatisfy(code -> assertThat(code).isIn(401, 403));
    }
}
