package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * 운영 CSRF 면제 목록 회귀 가드 — 관리자 강제 로그아웃은 CSRF 보호 대상이어야 한다.
 *
 * @author CoreSolution
 * @since 2026-09-30
 */
@DisplayName("SecurityConfig 운영 CSRF 면제 목록")
class SecurityConfigCsrfIgnoredMatchersTest {

    private static final String ADMIN_FORCE_LOGOUT_PATH = "/api/v1/admin/sessions/force-logout";

    private static boolean isCsrfIgnored(String method, String path) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setServletPath(path);
        RequestMatcher[] matchers = SecurityConfig.csrfIgnoredRequestMatchers();
        return Arrays.stream(matchers).anyMatch(matcher -> matcher.matches(request));
    }

    @Test
    @DisplayName("세션 쿠키 POST /api/v1/admin/sessions/force-logout 는 CSRF 면제 아님")
    void adminForceLogout_isNotCsrfIgnored() {
        assertThat(isCsrfIgnored("POST", ADMIN_FORCE_LOGOUT_PATH)).isFalse();
    }

    @Test
    @DisplayName("기존 인증 API(/api/v1/auth/login) 면제는 유지 — 목록 자체 무력화 방지")
    void authLogin_remainsCsrfIgnored() {
        assertThat(isCsrfIgnored("POST", "/api/v1/auth/login")).isTrue();
    }
}
