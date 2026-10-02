package com.coresolution.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * TenantHostSubdomainUtil 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-10
 */
@DisplayName("TenantHostSubdomainUtil")
class TenantHostSubdomainUtilTest {

    /** 운영 vhost regex server_name. 요청 호스트가 아니다. */
    private static final String NGINX_REGEX_SERVER_NAME =
            "~^" + "[^.]" + "+\\.core-solution\\.co\\.kr$";

    @Test
    @DisplayName("dev 테넌트 호스트에서 라벨 추출")
    void extractsDevTenantLabel() {
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain("clinic-a.dev.core-solution.co.kr"))
                .isEqualTo("clinic-a");
    }

    @Test
    @DisplayName("운영 테넌트 호스트에서 라벨 추출")
    void extractsProdTenantLabel() {
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain("clinic-a.core-solution.co.kr:443"))
                .isEqualTo("clinic-a");
    }

    @Test
    @DisplayName("예약·apex 호스트는 null")
    void reservedAndApexReturnNull() {
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain("app.core-solution.co.kr")).isNull();
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain("dev.core-solution.co.kr")).isNull();
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain("core-solution.co.kr")).isNull();
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain("ops.dev.core-solution.co.kr")).isNull();
    }

    @Test
    @DisplayName("X-Forwarded-Host 우선")
    void prefersXForwardedHost() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", "app.core-solution.co.kr");
        request.addHeader("X-Forwarded-Host", "clinic-a.dev.core-solution.co.kr");
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(request)).isEqualTo("clinic-a");
    }

    @Test
    @DisplayName("nginx regex server_name 은 테넌트가 아니다")
    void nginxRegexServerNameIsNotATenant() {
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(NGINX_REGEX_SERVER_NAME)).isNull();
        assertThat(TenantHostSubdomainUtil.isNginxRegexServerName(
                NGINX_REGEX_SERVER_NAME.substring(1))).isTrue();
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(
                NGINX_REGEX_SERVER_NAME.substring(1))).isNull();
        assertThat(TenantHostSubdomainUtil.resolveRequestHost(regexOnlyRequest())).isNull();

        MockHttpServletRequest forwardedOnly = new MockHttpServletRequest();
        forwardedOnly.setServerName(NGINX_REGEX_SERVER_NAME);
        forwardedOnly.addHeader("X-Forwarded-Host", NGINX_REGEX_SERVER_NAME);
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(forwardedOnly)).isNull();
        assertThat(TenantHostSubdomainUtil.resolveRequestHost(forwardedOnly)).isNull();
    }

    @Test
    @DisplayName("regex 전달 호스트는 건너뛰고 요청 Host 의 라벨을 쓴다")
    void regexForwardedHostFallsBackToRequestHost() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServerName(NGINX_REGEX_SERVER_NAME);
        request.addHeader("X-Forwarded-Host", NGINX_REGEX_SERVER_NAME);
        request.addHeader("Host", "mindgarden.core-solution.co.kr");

        assertThat(TenantHostSubdomainUtil.resolveRequestHost(request))
                .isEqualTo("mindgarden.core-solution.co.kr");
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(request)).isEqualTo("mindgarden");
    }

    @Test
    @DisplayName("regex 를 건너뛴 뒤 다른 호스트는 mindgarden 라벨이 아니다")
    void regexForwardedHostDoesNotBecomeMindgardenLabel() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServerName(NGINX_REGEX_SERVER_NAME);
        request.addHeader("X-Forwarded-Host", NGINX_REGEX_SERVER_NAME);
        request.addHeader("Host", "clinic-a.dev.core-solution.co.kr");

        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(request)).isEqualTo("clinic-a");
        assertThat(TenantHostSubdomainUtil.resolveRequestHost(request))
                .doesNotContain("~");
    }

    private static MockHttpServletRequest regexOnlyRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServerName(NGINX_REGEX_SERVER_NAME);
        request.addHeader("Host", NGINX_REGEX_SERVER_NAME);
        request.addHeader("X-Forwarded-Host", NGINX_REGEX_SERVER_NAME);
        return request;
    }
}
