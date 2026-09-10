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
}
