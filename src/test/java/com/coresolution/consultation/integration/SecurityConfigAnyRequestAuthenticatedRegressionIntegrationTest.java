package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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
 *   <li>Public 화이트리스트 핵심 5 종 (auth, actuator/health, error, openapi, onboarding)
 *       → 인증 없이 호출 시 401 이 *나오지 않아야* 한다 (= 화이트리스트 누락 시 fail)</li>
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

    @Autowired
    private MockMvc mockMvc;

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
    @DisplayName("/api/v1/onboarding/** 는 인증 없이도 401 이 아니다 (온보딩 화이트리스트)")
    void onboarding_withoutAuth_isNotUnauthorized() throws Exception {
        int status = mockMvc.perform(get("/api/v1/onboarding/__pr3d_probe__"))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("PR-3d Public 화이트리스트 회귀: /api/v1/onboarding/** 가 401 입니다. "
                        + "온보딩 API 는 로그인 전 접근이 필수입니다. "
                        + "SecurityConfig.filterChain 의 .requestMatchers(\"/api/v1/onboarding/**\").permitAll() 를 복원하세요.")
                .isNotEqualTo(401);
    }
}
