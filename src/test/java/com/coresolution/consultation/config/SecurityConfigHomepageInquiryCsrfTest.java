package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * 홈페이지 공개 tenants 경로 CSRF ignore 등록 검증.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
class SecurityConfigHomepageInquiryCsrfTest {

    @Test
    void csrfIgnoredMatchersIncludePublicTenantsPath() {
        RequestMatcher[] matchers = SecurityConfig.csrfIgnoredRequestMatchers();
        String path = "/api/v1/public/tenants/mindgarden/inquiries";
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRequestURI(path);
        request.setServletPath(path);

        boolean matched = false;
        for (RequestMatcher matcher : matchers) {
            if (matcher.matches(request)) {
                matched = true;
                break;
            }
        }
        assertThat(matched)
                .as("CSRF ignore must include /api/v1/public/tenants/**")
                .isTrue();
    }
}
