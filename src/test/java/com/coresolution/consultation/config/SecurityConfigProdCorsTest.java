package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * 운영(prod) CORS 가 개발 호스트 Origin 을 허용하지 않는지 검증한다.
 *
 * <p>재현: {@code https://*.core-solution.co.kr} 패턴이
 * {@code mindgarden-dev.core-solution.co.kr}·{@code mindgarden.dev.core-solution.co.kr} 에도
 * 매칭되어 운영에서 개발 Origin 이 통과하던 문제.</p>
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@DisplayName("SecurityConfig prod CORS — 비운영 호스트 제외")
class SecurityConfigProdCorsTest {

    private static final String PROD_TENANT_ORIGIN =
            "https://mindgarden.core-solution.co.kr";
    private static final String DEV_ALIAS_ORIGIN =
            "https://mindgarden-dev.core-solution.co.kr";
    private static final String DEV_PARENT_ORIGIN =
            "https://mindgarden.dev.core-solution.co.kr";
    private static final String E_TRINITY_ORIGIN =
            "https://e-trinity.co.kr";

    @Test
    @DisplayName("prod: 운영 테넌트 Origin 허용")
    void prod_allowsProductionTenantOrigin() throws Exception {
        CorsConfiguration configuration = prodCorsConfiguration();

        assertThat(configuration.checkOrigin(PROD_TENANT_ORIGIN)).isEqualTo(PROD_TENANT_ORIGIN);
    }

    @Test
    @DisplayName("prod: -dev 접미 별칭 Origin 거부")
    void prod_rejectsDevAliasOrigin() throws Exception {
        CorsConfiguration configuration = prodCorsConfiguration();

        assertThat(configuration.checkOrigin(DEV_ALIAS_ORIGIN)).isNull();
    }

    @Test
    @DisplayName("prod: .dev.core-solution.co.kr Origin 거부")
    void prod_rejectsDevParentOrigin() throws Exception {
        CorsConfiguration configuration = prodCorsConfiguration();

        assertThat(configuration.checkOrigin(DEV_PARENT_ORIGIN)).isNull();
    }

    @Test
    @DisplayName("prod: e-trinity exact Origin 유지")
    void prod_keepsETrinityExactOrigin() throws Exception {
        CorsConfiguration configuration = prodCorsConfiguration();

        assertThat(configuration.checkOrigin(E_TRINITY_ORIGIN)).isEqualTo(E_TRINITY_ORIGIN);
    }

    @Test
    @DisplayName("createProductionCorsConfiguration: util 비운영 Origin 은 super 매칭 전에 거부")
    void createProductionCorsConfiguration_rejectsNonProductionBeforePattern() {
        CorsConfiguration configuration = SecurityConfig.createProductionCorsConfiguration();
        configuration.setAllowedOriginPatterns(java.util.List.of("https://*.core-solution.co.kr"));

        assertThat(configuration.checkOrigin(PROD_TENANT_ORIGIN)).isEqualTo(PROD_TENANT_ORIGIN);
        assertThat(configuration.checkOrigin(DEV_ALIAS_ORIGIN)).isNull();
        assertThat(configuration.checkOrigin(DEV_PARENT_ORIGIN)).isNull();
    }

    private static CorsConfiguration prodCorsConfiguration() throws Exception {
        SecurityConfig securityConfig = new SecurityConfig(null, null, null, null);

        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        Field environmentField = SecurityConfig.class.getDeclaredField("environment");
        environmentField.setAccessible(true);
        environmentField.set(securityConfig, env);

        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        assertThat(source).isInstanceOf(UrlBasedCorsConfigurationSource.class);

        CorsConfiguration configuration = ((UrlBasedCorsConfigurationSource) source)
                .getCorsConfigurations()
                .get("/**");
        assertThat(configuration).isNotNull();
        return configuration;
    }
}
