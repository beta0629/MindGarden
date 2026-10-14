package com.coresolution.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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

    @BeforeEach
    void clearAliases() {
        TenantHostSubdomainUtil.configureHostAliases(null);
    }

    @AfterEach
    void resetAliases() {
        TenantHostSubdomainUtil.configureHostAliases(null);
    }

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

    @Test
    @DisplayName("별칭 호스트는 suffix 파싱 전 mindgarden 으로 해석")
    void aliasHostResolvesToMindgardenBeforeSuffixParse() {
        TenantHostSubdomainUtil.configureHostAliases(
                "mindgarden-dev.core-solution.co.kr:mindgarden");

        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(
                "mindgarden-dev.core-solution.co.kr")).isEqualTo("mindgarden");
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(
                "mindgarden-dev.core-solution.co.kr:443")).isEqualTo("mindgarden");
        assertThat(TenantHostSubdomainUtil.isConfiguredAliasHost(
                "mindgarden-dev.core-solution.co.kr")).isTrue();
        assertThat(TenantHostSubdomainUtil.resolveConfiguredAliasLabel(
                "MindGarden-Dev.core-solution.co.kr")).isEqualTo("mindgarden");
        assertThat(TenantHostSubdomainUtil.getConfiguredAliasHosts())
                .containsExactly("mindgarden-dev.core-solution.co.kr");
    }

    @Test
    @DisplayName("별칭 미설정 시 mindgarden-dev 라벨은 mindgarden-dev (prod suffix)")
    void withoutAliasesMindgardenDevLabelIsNotMindgarden() {
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(
                "mindgarden-dev.core-solution.co.kr")).isEqualTo("mindgarden-dev");
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(
                "mindgarden.dev.core-solution.co.kr")).isEqualTo("mindgarden");
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(
                "mindgarden.core-solution.co.kr")).isEqualTo("mindgarden");
    }

    @Test
    @DisplayName("별칭이 있어도 일반 suffix 호스트 동작은 유지")
    void aliasesDoNotBreakNormalSuffixHosts() {
        TenantHostSubdomainUtil.configureHostAliases(
                "mindgarden-dev.core-solution.co.kr:mindgarden");

        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(
                "clinic-a.dev.core-solution.co.kr")).isEqualTo("clinic-a");
        assertThat(TenantHostSubdomainUtil.extractTenantSubdomain(
                "clinic-a.core-solution.co.kr")).isEqualTo("clinic-a");
    }

    @Test
    @DisplayName("isNonProductionHost: -dev 접미·dev/staging parent 는 비운영")
    void isNonProductionHost_detectsDevAliasAndNonProdParents() {
        assertThat(TenantHostSubdomainUtil.isNonProductionHost(
                "mindgarden-dev.core-solution.co.kr")).isTrue();
        assertThat(TenantHostSubdomainUtil.isNonProductionHost(
                "https://mindgarden-dev.core-solution.co.kr")).isTrue();
        assertThat(TenantHostSubdomainUtil.isNonProductionHost(
                "mindgarden.dev.core-solution.co.kr")).isTrue();
        assertThat(TenantHostSubdomainUtil.isNonProductionHost(
                "https://mindgarden.dev.core-solution.co.kr")).isTrue();
        assertThat(TenantHostSubdomainUtil.isNonProductionHost(
                "clinic.staging.core-solution.co.kr")).isTrue();
        assertThat(TenantHostSubdomainUtil.isNonProductionHost(
                "dev.core-solution.co.kr")).isTrue();
    }

    @Test
    @DisplayName("isProductionTenantHost: 운영 테넌트만 true")
    void isProductionTenantHost_allowsOnlyProdTenantHosts() {
        assertThat(TenantHostSubdomainUtil.isProductionTenantHost(
                "mindgarden.core-solution.co.kr")).isTrue();
        assertThat(TenantHostSubdomainUtil.isProductionTenantHost(
                "https://mindgarden.core-solution.co.kr")).isTrue();
        assertThat(TenantHostSubdomainUtil.isProductionTenantHost(
                "mindgarden-dev.core-solution.co.kr")).isFalse();
        assertThat(TenantHostSubdomainUtil.isProductionTenantHost(
                "mindgarden.dev.core-solution.co.kr")).isFalse();
        assertThat(TenantHostSubdomainUtil.isProductionTenantHost(
                "app.core-solution.co.kr")).isFalse();
        assertThat(TenantHostSubdomainUtil.isProductionTenantHost(
                "core-solution.co.kr")).isFalse();
    }

    private static MockHttpServletRequest regexOnlyRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServerName(NGINX_REGEX_SERVER_NAME);
        request.addHeader("Host", NGINX_REGEX_SERVER_NAME);
        request.addHeader("X-Forwarded-Host", NGINX_REGEX_SERVER_NAME);
        return request;
    }
}
