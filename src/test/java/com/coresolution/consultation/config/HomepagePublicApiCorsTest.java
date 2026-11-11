package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * 홈페이지 공개 tenants 경로 CORS — HomepagePublicApiProperties 허용 Origin만 통과.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@DisplayName("HomepagePublicApi CORS")
class HomepagePublicApiCorsTest {

    private static final String ALLOWED = "https://m-garden.co.kr";
    private static final String DENIED = "https://evil.example.com";

    @Test
    @DisplayName("허용 Origin 은 checkOrigin 통과, 거부 Origin 은 null")
    void homepagePublicTenantsCors_allowsConfiguredOriginsOnly() throws Exception {
        SecurityConfig securityConfig = new SecurityConfig(null, null, null, null);

        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("local");
        Field environmentField = SecurityConfig.class.getDeclaredField("environment");
        environmentField.setAccessible(true);
        environmentField.set(securityConfig, env);

        HomepagePublicApiProperties props = new HomepagePublicApiProperties();
        props.setAllowedOrigins(List.of(ALLOWED, "https://www.m-garden.co.kr"));
        Field propsField = SecurityConfig.class.getDeclaredField("homepagePublicApiProperties");
        propsField.setAccessible(true);
        propsField.set(securityConfig, props);

        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        assertThat(source).isInstanceOf(UrlBasedCorsConfigurationSource.class);

        CorsConfiguration configuration = ((UrlBasedCorsConfigurationSource) source)
                .getCorsConfigurations()
                .get("/api/v1/public/tenants/**");
        assertThat(configuration).isNotNull();
        assertThat(configuration.checkOrigin(ALLOWED)).isEqualTo(ALLOWED);
        assertThat(configuration.checkOrigin(DENIED)).isNull();
        assertThat(configuration.getAllowedMethods()).containsExactlyInAnyOrder("GET", "OPTIONS");
        assertThat(configuration.getAllowCredentials()).isFalse();
    }
}
