package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.DefaultCorsProcessor;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * DEV CORS preflight 가 {@code https://ops-dev.core-solution.co.kr} 만 추가로 허용하는지 검증한다.
 *
 * <p>{@code *.dev.core-solution.co.kr} 은 {@code ops-dev.core-solution.co.kr} 에 매칭되지 않아
 * Spring {@link DefaultCorsProcessor} 가 403 {@code Invalid CORS request} 로 거부한다.
 * 와일드카드는 넓히지 않고 exact origin 한 건만 둔다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-15
 */
@DisplayName("SecurityConfig dev CORS — ops-dev preflight")
class SecurityConfigDevOpsCorsPreflightTest {

    private static final String OPS_DEV_ORIGIN = "https://ops-dev.core-solution.co.kr";
    private static final String UNRELATED_ORIGIN = "https://unrelated.example.com";
    private static final String EXISTING_OPS_ORIGIN = "https://ops.dev.e-trinity.co.kr";
    private static final String EXISTING_LOCAL_ORIGIN = "http://localhost:4300";

    @Test
    @DisplayName("preflight: ops-dev origin 허용, 무관 origin 은 403 Invalid CORS request")
    void preflightAllowsOpsDevOriginAndRejectsUnrelated() throws Exception {
        CorsConfiguration configuration = devCorsConfiguration();

        assertThat(configuration.getAllowedOriginPatterns())
                .contains(OPS_DEV_ORIGIN, EXISTING_OPS_ORIGIN, EXISTING_LOCAL_ORIGIN)
                .doesNotContain(
                        "http://ops-dev.core-solution.co.kr",
                        "https://*.core-solution.co.kr",
                        "https://ops-dev.*.core-solution.co.kr");

        assertPreflightAllowed(configuration, OPS_DEV_ORIGIN);
        assertPreflightAllowed(configuration, EXISTING_OPS_ORIGIN);
        assertPreflightAllowed(configuration, EXISTING_LOCAL_ORIGIN);
        assertPreflightRejected(configuration, UNRELATED_ORIGIN);
    }

    private static void assertPreflightAllowed(CorsConfiguration configuration, String origin) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean processed = new DefaultCorsProcessor()
                .processRequest(configuration, preflight(origin), response);

        assertThat(processed).isTrue();
        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN)).isEqualTo(origin);
        assertThat(response.getContentAsString()).doesNotContain("Invalid CORS request");
    }

    private static void assertPreflightRejected(CorsConfiguration configuration, String origin) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean processed = new DefaultCorsProcessor()
                .processRequest(configuration, preflight(origin), response);

        assertThat(processed).isFalse();
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).isEqualTo("Invalid CORS request");
        assertThat(response.getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN)).isNull();
    }

    private static MockHttpServletRequest preflight(String origin) {
        MockHttpServletRequest request = new MockHttpServletRequest(HttpMethod.OPTIONS.name(), "/api/v1/health");
        request.addHeader(HttpHeaders.ORIGIN, origin);
        request.addHeader(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, HttpMethod.GET.name());
        return request;
    }

    private static CorsConfiguration devCorsConfiguration() throws Exception {
        SecurityConfig securityConfig = new SecurityConfig(null, null, null, null);

        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
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
