package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.util.Collection;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * 홈페이지 공개 Origin 이 credentialed 전역 {@code /**} CORS 에 섞이지 않고
 * {@code /api/v1/public/tenants/**} path-scoped(credentials=false) 로만 등록되는지 검증한다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@DisplayName("SecurityConfig homepage public CORS — path-scoped only")
class SecurityConfigHomepagePublicCorsTest {

    private static final String HOMEPAGE_ORIGIN = "https://m-garden.co.kr";
    private static final String HOMEPAGE_WWW_ORIGIN = "https://www.m-garden.co.kr";
    private static final String HOMEPAGE_STAGING_ORIGIN = "https://staging.m-garden.co.kr";
    private static final String PUBLIC_TENANTS_PATH = "/api/v1/public/tenants/**";

    @Test
    @DisplayName("local: 전역 /** 에 m-garden Origin 없음")
    void local_globalCors_excludesHomepageOrigins() throws Exception {
        CorsConfiguration global = corsForProfile("local").get("/**");
        assertThat(global).isNotNull();
        assertThat(global.getAllowCredentials()).isTrue();
        assertOriginsDoNotContainHomepage(collectOrigins(global));
    }

    @Test
    @DisplayName("dev: 전역 /** 에 m-garden Origin 없음")
    void dev_globalCors_excludesHomepageOrigins() throws Exception {
        CorsConfiguration global = corsForProfile("dev").get("/**");
        assertThat(global).isNotNull();
        assertThat(global.getAllowCredentials()).isTrue();
        assertOriginsDoNotContainHomepage(collectOrigins(global));
    }

    @Test
    @DisplayName("prod: 전역 /** 에 m-garden Origin 없음")
    void prod_globalCors_excludesHomepageOrigins() throws Exception {
        CorsConfiguration global = corsForProfile("prod").get("/**");
        assertThat(global).isNotNull();
        assertThat(global.getAllowCredentials()).isTrue();
        assertOriginsDoNotContainHomepage(collectOrigins(global));
    }

    @Test
    @DisplayName("path-scoped /api/v1/public/tenants/** 는 homepage origins + credentials=false")
    void publicTenantsPath_hasHomepageOriginsWithoutCredentials() throws Exception {
        CorsConfiguration publicConfig = corsForProfile("prod").get(PUBLIC_TENANTS_PATH);

        assertThat(publicConfig).isNotNull();
        assertThat(publicConfig.getAllowCredentials()).isFalse();
        assertThat(publicConfig.getAllowedOrigins())
                .contains(HOMEPAGE_ORIGIN, HOMEPAGE_WWW_ORIGIN, HOMEPAGE_STAGING_ORIGIN);
        assertThat(publicConfig.getAllowedMethods())
                .contains("POST", "OPTIONS");
        assertThat(publicConfig.checkOrigin(HOMEPAGE_ORIGIN)).isEqualTo(HOMEPAGE_ORIGIN);
        assertThat(publicConfig.checkOrigin(HOMEPAGE_STAGING_ORIGIN)).isEqualTo(HOMEPAGE_STAGING_ORIGIN);
    }

    @Test
    @DisplayName("HOMEPAGE_PUBLIC_CORS_ALLOWED_ORIGINS 추가분은 path-scoped 에만 병합")
    void envExtraOrigin_mergesOnlyIntoPublicPath() throws Exception {
        String extra = "https://extra.m-garden.co.kr";
        UrlBasedCorsConfigurationSource source = corsSourceForProfile("dev", env -> {
            env.setProperty("HOMEPAGE_PUBLIC_CORS_ALLOWED_ORIGINS", extra);
        });

        assertThat(source.getCorsConfigurations().get(PUBLIC_TENANTS_PATH).getAllowedOrigins())
                .contains(extra);
        assertOriginsDoNotContainHomepage(collectOrigins(source.getCorsConfigurations().get("/**")));
        assertThat(collectOrigins(source.getCorsConfigurations().get("/**"))).doesNotContain(extra);
    }

    private static void assertOriginsDoNotContainHomepage(Collection<String> origins) {
        assertThat(origins)
                .doesNotContain(HOMEPAGE_ORIGIN, HOMEPAGE_WWW_ORIGIN, HOMEPAGE_STAGING_ORIGIN);
    }

    private static List<String> collectOrigins(CorsConfiguration configuration) {
        java.util.ArrayList<String> all = new java.util.ArrayList<>();
        if (configuration.getAllowedOrigins() != null) {
            all.addAll(configuration.getAllowedOrigins());
        }
        if (configuration.getAllowedOriginPatterns() != null) {
            all.addAll(configuration.getAllowedOriginPatterns());
        }
        return all;
    }

    private static java.util.Map<String, CorsConfiguration> corsForProfile(String profile)
            throws Exception {
        return corsSourceForProfile(profile, null).getCorsConfigurations();
    }

    @FunctionalInterface
    private interface EnvCustomizer {
        void customize(MockEnvironment env);
    }

    private static UrlBasedCorsConfigurationSource corsSourceForProfile(
            String profile, EnvCustomizer customizer) throws Exception {
        SecurityConfig securityConfig = new SecurityConfig(null, null, null, null);

        MockEnvironment env = new MockEnvironment();
        if ("local".equals(profile)) {
            // activeProfiles empty → local branch
        } else {
            env.setActiveProfiles(profile);
        }
        if (customizer != null) {
            customizer.customize(env);
        }

        Field environmentField = SecurityConfig.class.getDeclaredField("environment");
        environmentField.setAccessible(true);
        environmentField.set(securityConfig, env);

        HomepageInquiryProperties props = new HomepageInquiryProperties();
        Field propsField = SecurityConfig.class.getDeclaredField("homepageInquiryProperties");
        propsField.setAccessible(true);
        propsField.set(securityConfig, props);

        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        assertThat(source).isInstanceOf(UrlBasedCorsConfigurationSource.class);
        return (UrlBasedCorsConfigurationSource) source;
    }
}
