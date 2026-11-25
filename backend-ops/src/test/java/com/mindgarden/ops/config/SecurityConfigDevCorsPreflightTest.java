package com.mindgarden.ops.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.DefaultCorsProcessor;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * backend-ops 개발 프로필 CORS preflight.
 *
 * <p>{@code application-dev.yml} 의 {@code OPS_CORS_ALLOWED_ORIGINS} 기본값에
 * {@code https://ops-dev.core-solution.co.kr} 가 exact origin 으로 들어 있는지,
 * 그 기본값으로 만든 {@link CorsConfiguration} 이 preflight 를 허용·거부하는지 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-10-15
 */
@DisplayName("Ops SecurityConfig dev CORS preflight")
class SecurityConfigDevCorsPreflightTest {

    private static final Path DEV_YML = Path.of("src/main/resources/application-dev.yml");
    private static final Pattern DEFAULT_ORIGINS = Pattern.compile(
            "\\$\\{OPS_CORS_ALLOWED_ORIGINS:([^}]+)}");
    private static final String OPS_DEV_ORIGIN = "https://ops-dev.core-solution.co.kr";
    private static final String UNRELATED_ORIGIN = "https://unrelated.example.com";
    private static final String JWT_UNUSED = "test-jwt-secret-not-used";

    @Test
    @DisplayName("preflight: yml 기본값의 ops-dev origin 허용, 무관 origin 거부")
    void preflightAllowsConfiguredOpsDevOriginAndRejectsUnrelated() throws Exception {
        String yml = Files.readString(DEV_YML, StandardCharsets.UTF_8);
        Matcher matcher = DEFAULT_ORIGINS.matcher(yml);
        assertThat(matcher.find()).isTrue();
        String defaults = matcher.group(1);

        assertThat(defaults.split(","))
                .contains(
                        OPS_DEV_ORIGIN,
                        "http://localhost:4300",
                        "https://ops.dev.e-trinity.co.kr")
                .doesNotContain("http://ops-dev.core-solution.co.kr", "*");

        SecurityConfig securityConfig = new SecurityConfig(JWT_UNUSED, defaults);
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        assertThat(source).isInstanceOf(UrlBasedCorsConfigurationSource.class);
        CorsConfiguration configuration = ((UrlBasedCorsConfigurationSource) source)
                .getCorsConfigurations()
                .get("/**");
        assertThat(configuration).isNotNull();

        assertPreflightAllowed(configuration, OPS_DEV_ORIGIN);
        assertPreflightRejected(configuration, UNRELATED_ORIGIN);
    }

    private static void assertPreflightAllowed(CorsConfiguration configuration, String origin) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean processed = new DefaultCorsProcessor()
                .processRequest(configuration, preflight(origin), response);

        assertThat(processed).isTrue();
        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN)).isEqualTo(origin);
    }

    private static void assertPreflightRejected(CorsConfiguration configuration, String origin) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean processed = new DefaultCorsProcessor()
                .processRequest(configuration, preflight(origin), response);

        assertThat(processed).isFalse();
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).isEqualTo("Invalid CORS request");
    }

    private static MockHttpServletRequest preflight(String origin) {
        MockHttpServletRequest request = new MockHttpServletRequest(HttpMethod.OPTIONS.name(), "/api/v1/ops/auth/login");
        request.addHeader(HttpHeaders.ORIGIN, origin);
        request.addHeader(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, HttpMethod.POST.name());
        return request;
    }
}
