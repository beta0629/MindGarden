package com.coresolution.consultation.config;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Field;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * {@link SecurityConfig#corsConfigurationSource()} P0 회귀 방지 — Apple SIWA form_post 콜백 시
 * 브라우저가 보내는 {@code Origin: https://appleid.apple.com} (Safari 는 {@code null}) 에 대해
 * Spring {@code DefaultCorsProcessor} 가 {@code 403 "Invalid CORS request"} 로 거부하던
 * 문제를 path 별 분기로 우회하는 변경의 단위 테스트.
 *
 * <p>배경: PR #211 (Apple server-side auth-code, response_mode=form_post) 적용 후
 * dev 환경 (mindgarden.dev.core-solution.co.kr) 에서 Apple 동의 → 콜백 페이지에
 * "Invalid CORS request" 본문이 표시되어 로그인 불가. 디버거 진단(750dbaba)에서
 * SecurityConfig 단일 origin 화이트리스트가 root-cause 로 확정되어 callback path 에 한해
 * origin 가드를 우회한다.</p>
 *
 * <p>본 테스트는 {@link CorsFilter} 를 standalone {@link MockMvc} 에 주입해 실제
 * {@link CorsConfigurationSource} 의 path 별 분기 효과만 검증한다. SecurityFilterChain·세션·DB
 * 의존성을 끌어오지 않으므로 빠르게 회귀를 잡을 수 있다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
class SecurityConfigCorsCallbackTest {

    private static final String APPLE_ORIGIN = "https://appleid.apple.com";
    private static final String SAFARI_NULL_ORIGIN = "null";
    private static final String EVIL_ORIGIN = "https://evil.example.com";

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        SecurityConfig securityConfig = new SecurityConfig(null, null, null, null);

        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        Field environmentField = SecurityConfig.class.getDeclaredField("environment");
        environmentField.setAccessible(true);
        environmentField.set(securityConfig, env);

        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        mockMvc = MockMvcBuilders.standaloneSetup(new DummyController())
                .addFilter(new CorsFilter(source))
                .build();
    }

    @Test
    @DisplayName("Apple form_post POST 가 CorsFilter 에서 거부되지 않아야 한다 (P0 회귀 방지)")
    void appleCallback_acceptsAppleOriginFormPost() throws Exception {
        mockMvc.perform(post("/api/v1/auth/apple/callback")
                .header(HttpHeaders.ORIGIN, APPLE_ORIGIN)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("code", "dummy-code")
                .param("state", "dummy-state"))
            .andExpect(status().is(not(403)))
            .andExpect(content().string(not(containsString("Invalid CORS request"))));
    }

    @Test
    @DisplayName("Safari null Origin 도 callback 에서 통과해야 한다")
    void appleCallback_acceptsNullOriginFormPost() throws Exception {
        mockMvc.perform(post("/api/v1/auth/apple/callback")
                .header(HttpHeaders.ORIGIN, SAFARI_NULL_ORIGIN)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("code", "dummy-code")
                .param("state", "dummy-state"))
            .andExpect(status().is(not(403)))
            .andExpect(content().string(not(containsString("Invalid CORS request"))));
    }

    @Test
    @DisplayName("Google GET callback 는 그대로 통과해야 한다 (회귀 방어)")
    void googleCallback_acceptsLegitOriginGet() throws Exception {
        mockMvc.perform(get("/api/v1/auth/google/callback")
                .header(HttpHeaders.ORIGIN, "https://accounts.google.com")
                .param("code", "dummy-code")
                .param("state", "dummy-state"))
            .andExpect(status().is(not(403)))
            .andExpect(content().string(not(containsString("Invalid CORS request"))));
    }

    @Test
    @DisplayName("프론트 공통 OAuth2 callback (/api/v1/auth/oauth2/callback) 도 우회되어야 한다")
    void frontendOauth2Callback_acceptsAppleOrigin() throws Exception {
        mockMvc.perform(post("/api/v1/auth/oauth2/callback")
                .header(HttpHeaders.ORIGIN, APPLE_ORIGIN)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("code", "dummy-code")
                .param("state", "dummy-state"))
            .andExpect(status().is(not(403)))
            .andExpect(content().string(not(containsString("Invalid CORS request"))));
    }

    @Test
    @DisplayName("Apple oauth/apple/callback (레거시 경로) 도 우회되어야 한다")
    void appleOauthCallback_acceptsAppleOrigin() throws Exception {
        mockMvc.perform(post("/api/v1/auth/oauth/apple/callback")
                .header(HttpHeaders.ORIGIN, APPLE_ORIGIN)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("code", "dummy-code")
                .param("state", "dummy-state"))
            .andExpect(status().is(not(403)))
            .andExpect(content().string(not(containsString("Invalid CORS request"))));
    }

    @Test
    @DisplayName("비-callback endpoint 의 unknown origin 은 여전히 403 \"Invalid CORS request\" (보안 회귀 방지)")
    void nonCallbackEndpoint_rejectsUnknownOrigin() throws Exception {
        mockMvc.perform(post("/api/v1/admin/users")
                .header(HttpHeaders.ORIGIN, EVIL_ORIGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isForbidden())
            .andExpect(content().string(containsString("Invalid CORS request")));
    }

    /**
     * 회귀 검증용 더미 컨트롤러. 컨트롤러 도달 여부보다는 {@link CorsFilter} 의 거부/통과만이 본 테스트의 관심사다.
     */
    @RestController
    static class DummyController {

        @PostMapping("/api/v1/auth/apple/callback")
        String appleCallbackPost() {
            return "{\"ok\":true}";
        }

        @GetMapping("/api/v1/auth/google/callback")
        String googleCallbackGet() {
            return "{\"ok\":true}";
        }

        @PostMapping("/api/v1/auth/oauth2/callback")
        String frontendOauth2Callback() {
            return "{\"ok\":true}";
        }

        @PostMapping("/api/v1/auth/oauth/apple/callback")
        String appleOauthCallbackPost() {
            return "{\"ok\":true}";
        }

        @PostMapping("/api/v1/admin/users")
        String adminUsersPost() {
            return "{\"ok\":true}";
        }
    }
}
