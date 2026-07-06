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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
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
    private static final String TRINITY_DEV_APEX_ORIGIN = "https://dev.e-trinity.co.kr";
    private static final String TRINITY_PROD_APEX_ORIGIN = "https://e-trinity.co.kr";

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

    @Test
    @DisplayName("Trinity dev apex origin (dev.e-trinity.co.kr) 은 SMS API CORS 통과해야 한다")
    void trinityDevApexOrigin_acceptsSmsSendPost() throws Exception {
        mockMvc.perform(post("/api/v1/auth/sms/send")
                .header(HttpHeaders.ORIGIN, TRINITY_DEV_APEX_ORIGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"phone\":\"01012345678\"}"))
            .andExpect(status().is(not(403)))
            .andExpect(content().string(not(containsString("Invalid CORS request"))));
    }

    @Test
    @DisplayName("Trinity prod apex origin (e-trinity.co.kr) 은 dev 프로파일 CORS 에서 거부되어야 한다")
    void trinityProdApexOrigin_rejectedInDevProfile() throws Exception {
        mockMvc.perform(post("/api/v1/auth/sms/send")
                .header(HttpHeaders.ORIGIN, TRINITY_PROD_APEX_ORIGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"phone\":\"01012345678\"}"))
            .andExpect(status().isForbidden())
            .andExpect(content().string(containsString("Invalid CORS request")));
    }

    @Test
    @DisplayName("Trinity prod apex origin (e-trinity.co.kr) 은 prod 프로파일 CORS 통과해야 한다")
    void trinityProdApexOrigin_acceptsSmsSendPostInProdProfile() throws Exception {
        SecurityConfig securityConfig = new SecurityConfig(null, null, null, null);
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        Field environmentField = SecurityConfig.class.getDeclaredField("environment");
        environmentField.setAccessible(true);
        environmentField.set(securityConfig, env);

        MockMvc prodMockMvc = MockMvcBuilders.standaloneSetup(new DummyController())
                .addFilter(new CorsFilter(securityConfig.corsConfigurationSource()))
                .build();

        prodMockMvc.perform(post("/api/v1/auth/sms/send")
                .header(HttpHeaders.ORIGIN, TRINITY_PROD_APEX_ORIGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"phone\":\"01012345678\"}"))
            .andExpect(status().is(not(403)))
            .andExpect(content().string(not(containsString("Invalid CORS request"))));
    }

    /**
     * 회귀 검증용 더미 컨트롤러. 컨트롤러 도달 여부보다는 {@link CorsFilter} 의 거부/통과만이 본 테스트의 관심사다.
     *
     * <p><strong>중요:</strong> {@code @RestController} 를 의도적으로 사용하지 않는다.
     * {@code @RestController} 는 메타 어노테이션 {@code @Controller} → {@code @Component} 를 통해
     * Spring 컴포넌트 스캔에 포함되어, {@code @SpringBootTest} 가 ApplicationContext 를 부팅할 때
     * 운영 컨트롤러(예: {@code AppleSignInController}) 와 {@code RequestMappingHandlerMapping} 에서
     * ambiguous mapping 충돌을 일으킨다 (PR #215 회귀).</p>
     *
     * <p>대신 {@code @RequestMapping("")} (메타에 {@code @Component} 없음) 만 사용해
     * {@link org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping
     * #isHandler(Class)} 의 매핑 인식은 유지하면서 컴포넌트 스캔에서는 제외시킨다.
     * 메서드 단위 응답 직렬화는 {@link ResponseBody} 로 보존한다.</p>
     */
    @RequestMapping("")
    static class DummyController {

        @PostMapping("/api/v1/auth/apple/callback")
        @ResponseBody
        String appleCallbackPost() {
            return "{\"ok\":true}";
        }

        @GetMapping("/api/v1/auth/google/callback")
        @ResponseBody
        String googleCallbackGet() {
            return "{\"ok\":true}";
        }

        @PostMapping("/api/v1/auth/oauth2/callback")
        @ResponseBody
        String frontendOauth2Callback() {
            return "{\"ok\":true}";
        }

        @PostMapping("/api/v1/auth/oauth/apple/callback")
        @ResponseBody
        String appleOauthCallbackPost() {
            return "{\"ok\":true}";
        }

        @PostMapping("/api/v1/admin/users")
        @ResponseBody
        String adminUsersPost() {
            return "{\"ok\":true}";
        }

        @PostMapping("/api/v1/auth/sms/send")
        @ResponseBody
        String smsSendPost() {
            return "{\"ok\":true}";
        }
    }
}
