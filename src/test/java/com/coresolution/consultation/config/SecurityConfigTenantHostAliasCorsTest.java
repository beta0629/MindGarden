package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.coresolution.core.util.TenantHostSubdomainUtil;

/**
 * DEV CORS 가 {@code tenant.host-aliases} 호스트를 exact origin 으로 합류하는지 검증한다.
 *
 * <p>재현: {@code Origin: https://mindgarden-dev.core-solution.co.kr} 이
 * {@code *.dev.core-solution.co.kr} 패턴에 안 맞아 403 Invalid CORS request 가 나던 회귀.</p>
 *
 * <p>MockMvc·{@code @Controller} 더미는 쓰지 않는다 — 컴포넌트 스캔에 잡히면
 * {@code OAuth2ConfigController} 등과 ambiguous mapping 충돌이 난다.
 * {@link CorsConfigurationSource} 의 allowedOriginPatterns 만 단언한다.</p>
 *
 * <p>Dev 프로필은 CSRF disable — 별칭 호스트 로그인 POST 게이트는 CORS 이며 CSRF 가 아니다.
 * 세션 쿠키는 DEV host-only({@code SessionCookieSupport}) 이므로 Domain 변경 불필요.</p>
 *
 * @author CoreSolution
 * @since 2026-10-13
 */
@DisplayName("SecurityConfig DEV CORS — tenant.host-aliases 합류")
class SecurityConfigTenantHostAliasCorsTest {

    private static final String ALIAS_RAW =
            "mindgarden-dev.core-solution.co.kr:mindgarden";
    private static final String ALIAS_HTTPS =
            "https://mindgarden-dev.core-solution.co.kr";
    private static final String ALIAS_HTTP =
            "http://mindgarden-dev.core-solution.co.kr";

    @AfterEach
    void clearAliases() {
        TenantHostSubdomainUtil.configureHostAliases(null);
    }

    @Test
    @DisplayName("mergeTenantHostAliasOrigins: 별칭 호스트에 https/http exact origin 추가")
    void mergeTenantHostAliasOrigins_addsHttpsAndHttpExactOrigins() {
        List<String> patterns = new ArrayList<>();
        patterns.add("https://*.dev.core-solution.co.kr");

        int added = SecurityConfig.mergeTenantHostAliasOrigins(patterns, ALIAS_RAW);

        assertThat(added).isEqualTo(2);
        assertThat(patterns).contains(ALIAS_HTTPS, ALIAS_HTTP);
        assertThat(patterns).contains("https://*.dev.core-solution.co.kr");
    }

    @Test
    @DisplayName("mergeTenantHostAliasOrigins: 이미 있으면 중복 추가하지 않음")
    void mergeTenantHostAliasOrigins_skipsDuplicates() {
        List<String> patterns = new ArrayList<>();
        patterns.add(ALIAS_HTTPS);

        int added = SecurityConfig.mergeTenantHostAliasOrigins(patterns, ALIAS_RAW);

        assertThat(added).isEqualTo(1);
        assertThat(patterns).filteredOn(ALIAS_HTTPS::equals).hasSize(1);
        assertThat(patterns).contains(ALIAS_HTTP);
    }

    @Test
    @DisplayName("mergeTenantHostAliasOrigins: null/blank 이면 0 추가")
    void mergeTenantHostAliasOrigins_blankIsNoOp() {
        List<String> patterns = new ArrayList<>();
        patterns.add("https://*.dev.core-solution.co.kr");

        assertThat(SecurityConfig.mergeTenantHostAliasOrigins(patterns, null)).isZero();
        assertThat(SecurityConfig.mergeTenantHostAliasOrigins(patterns, "  ")).isZero();
        assertThat(patterns).containsExactly("https://*.dev.core-solution.co.kr");
    }

    @Test
    @DisplayName("corsConfigurationSource(dev): tenant.host-aliases Origin 패턴 포함 (CORS_ALLOWED_ORIGINS 비어 있음)")
    void corsConfigurationSource_includesAliasOriginFromTenantHostAliasesProperty() throws Exception {
        SecurityConfig securityConfig = new SecurityConfig(null, null, null, null);

        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        env.setProperty("tenant.host-aliases", ALIAS_RAW);
        // CORS_ALLOWED_ORIGINS 미설정 — 재시작 후 env 비어 있던 재현 조건
        Field environmentField = SecurityConfig.class.getDeclaredField("environment");
        environmentField.setAccessible(true);
        environmentField.set(securityConfig, env);

        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        assertThat(source).isInstanceOf(UrlBasedCorsConfigurationSource.class);

        CorsConfiguration configuration = ((UrlBasedCorsConfigurationSource) source)
                .getCorsConfigurations()
                .get("/**");
        assertThat(configuration).isNotNull();
        assertThat(configuration.getAllowedOriginPatterns())
                .contains(ALIAS_HTTPS, ALIAS_HTTP, "https://*.dev.core-solution.co.kr");
        assertThat(configuration.checkOrigin(ALIAS_HTTPS)).isEqualTo(ALIAS_HTTPS);
        assertThat(configuration.checkOrigin("https://mindgarden.dev.core-solution.co.kr"))
                .isEqualTo("https://mindgarden.dev.core-solution.co.kr");
    }

    @Test
    @DisplayName("getConfiguredAliasHosts: configure 후 hostname 조회")
    void getConfiguredAliasHosts_returnsConfiguredHostnames() {
        TenantHostSubdomainUtil.configureHostAliases(ALIAS_RAW);

        assertThat(TenantHostSubdomainUtil.getConfiguredAliasHosts())
                .containsExactly("mindgarden-dev.core-solution.co.kr");
    }
}
