package com.coresolution.consultation.config.security;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.stereotype.Component;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

/**
 * {@link BearerTokenAuthCsrfMatcher} 가 Spring Security CSRF 필터에 정상 결합되어
 * 운영 회귀 시나리오를 보호/면제하는지 검증한다.
 *
 * <p>운영 프로파일·DB 의존 없이 SecurityFilterChain 만 격리해 빠르게 검증한다.
 *
 * <p>{@code ConsultationManagementApplication} 이 {@link org.springframework.context.annotation.ComponentScan}
 * 으로 base package 를 명시 지정하면서 Spring Boot 의 {@code TypeExcludeFilter}
 * 가 비활성화된다. 그래서 본 테스트의 inner config·controller 는 다른 테스트의
 * 메인 컴포넌트 스캔에 우발 등록되지 않도록 {@link ConditionalOnProperty} 로 보호한다.
 *
 * <ul>
 *   <li>모바일(Bearer) PUT → CSRF 면제 → 200 (회귀 차단 핵심)</li>
 *   <li>웹(세션 쿠키만) PUT → CSRF 보호 유지 → 403</li>
 *   <li>웹(세션 쿠키 + 유효 CSRF 토큰) PUT → 200</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-02
 */
@ExtendWith(SpringExtension.class)
@WebAppConfiguration
@ContextConfiguration(classes = {
        BearerTokenAuthCsrfMatcherIntegrationTest.IsolatedSecurityConfig.class,
        BearerTokenAuthCsrfMatcherIntegrationTest.TestProfileController.class
})
@TestPropertySource(properties = "mindgarden.test.bearer-csrf-matcher.enabled=true")
@DisplayName("BearerTokenAuthCsrfMatcher — SecurityFilterChain 통합 CSRF 면제/보호")
class BearerTokenAuthCsrfMatcherIntegrationTest {

    /** 본 통합 테스트에서만 활성화되는 inner config/controller 활성화 프로퍼티 키. */
    static final String ENABLED_PROPERTY = "mindgarden.test.bearer-csrf-matcher.enabled";

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("Bearer 헤더 PUT + CSRF 토큰 없음 → 200 (모바일 정상 흐름, 회귀 차단)")
    void putWithBearerWithoutCsrf_passes() throws Exception {
        mockMvc.perform(put("/test-csrf/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer expo-mobile-jwt"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Bearer 없음 + CSRF 토큰 없음 PUT → 403 (웹 세션 흐름 CSRF 보호 유지)")
    void putWithoutBearerWithoutCsrf_isBlocked() throws Exception {
        mockMvc.perform(put("/test-csrf/profile"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Bearer 없음 + 유효 CSRF 토큰 PUT → 200 (웹 정상 흐름)")
    void putWithoutBearerWithValidCsrf_passes() throws Exception {
        MvcResult issueTokenResult = mockMvc.perform(get("/test-csrf/profile"))
                .andExpect(status().isOk())
                .andReturn();

        CsrfToken token = (CsrfToken) issueTokenResult.getRequest().getAttribute(CsrfToken.class.getName());

        mockMvc.perform(put("/test-csrf/profile")
                        .session((org.springframework.mock.web.MockHttpSession) issueTokenResult.getRequest().getSession())
                        .header(token.getHeaderName(), token.getToken()))
                .andExpect(status().isOk());
    }

    /**
     * 운영 SecurityConfig CSRF 블록을 본떠 만든 격리 보안 설정.
     * 본 통합 테스트의 {@link TestPropertySource} 가 활성화될 때만 등록된다.
     */
    @Configuration
    @EnableWebSecurity
    @EnableWebMvc
    @ConditionalOnProperty(name = ENABLED_PROPERTY, havingValue = "true")
    static class IsolatedSecurityConfig {

        @Bean
        SecurityFilterChain testCsrfFilterChain(HttpSecurity http) throws Exception {
            http
                    .csrf(csrf -> csrf
                            .csrfTokenRepository(new HttpSessionCsrfTokenRepository())
                            .ignoringRequestMatchers(new BearerTokenAuthCsrfMatcher())
                    )
                    .authorizeHttpRequests(authz -> authz.anyRequest().permitAll());
            return http.build();
        }
    }

    @Component
    @RestController
    @RequestMapping("/test-csrf")
    @ConditionalOnProperty(name = ENABLED_PROPERTY, havingValue = "true")
    static class TestProfileController {

        @GetMapping("/profile")
        String issueToken() {
            return "issued";
        }

        @PutMapping("/profile")
        String updateProfile() {
            return "ok";
        }
    }
}
