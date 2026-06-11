package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * {@link XssFilter} 의 OAuth 콜백/authorize 경로 sanitize 우회 회귀 방지.
 *
 * <p>P0 회귀: PR #204 (Google server-side auth-code) 도입 후
 * {@link XssFilter.XssRequestWrapper#getParameter(String)} 가 Google authorization code
 * (예: {@code 4/0Adk...}) 의 슬래시(/) 를 {@code &#x2F;} 로 변형해
 * Google {@code /token} 이 {@code "Malformed auth code."} 로 거부.
 * 디버거 9067073e 확정. 옵션 A (path 화이트리스트) 적용 후 회귀 방지.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
class XssFilterOAuthBypassTest {

    private final XssFilter filter = new XssFilter();

    @Test
    @DisplayName("Google 콜백 경로: code 의 슬래시(/) 가 원본 그대로 보존된다")
    void googleCallback_slashInCode_isPreserved() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET",
                "/api/v1/auth/google/callback");
        request.setRequestURI("/api/v1/auth/google/callback");
        String rawCode = "4/0Adk_test_with_slash_and_more/segments";
        request.setParameter("code", rawCode);
        request.setParameter("state", "tenant.nonce-value");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<ServletRequest> captor = ArgumentCaptor.forClass(ServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        ServletRequest delivered = captor.getValue();

        // 우회 경로에서는 XssRequestWrapper 가 씌워지지 않고 원본 request 가 그대로 통과해야 한다.
        assertThat(delivered).isNotInstanceOf(XssFilter.XssRequestWrapper.class);
        assertThat(delivered.getParameter("code")).isEqualTo(rawCode);
        assertThat(delivered.getParameter("code")).doesNotContain("&#x2F;");
    }

    @Test
    @DisplayName("Apple 콜백 경로 (oauth/apple/callback) 도 sanitize 우회")
    void appleCallback_bypassesSanitize() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST",
                "/api/v1/auth/oauth/apple/callback");
        request.setRequestURI("/api/v1/auth/oauth/apple/callback");
        String rawCode = "c1.0.adk/with/slash";
        request.setParameter("code", rawCode);

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<ServletRequest> captor = ArgumentCaptor.forClass(ServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        assertThat(captor.getValue().getParameter("code")).isEqualTo(rawCode);
    }

    @Test
    @DisplayName("카카오 콜백 경로도 sanitize 우회 (회귀 방지 carry-over)")
    void kakaoCallback_bypassesSanitize() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET",
                "/api/v1/auth/kakao/callback");
        request.setRequestURI("/api/v1/auth/kakao/callback");
        request.setParameter("code", "test_code_without_slash");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<ServletRequest> captor = ArgumentCaptor.forClass(ServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        assertThat(captor.getValue()).isNotInstanceOf(XssFilter.XssRequestWrapper.class);
        assertThat(captor.getValue().getParameter("code")).isEqualTo("test_code_without_slash");
    }

    @Test
    @DisplayName("네이버 콜백 경로도 sanitize 우회")
    void naverCallback_bypassesSanitize() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET",
                "/api/v1/auth/naver/callback");
        request.setRequestURI("/api/v1/auth/naver/callback");
        request.setParameter("code", "naver_test_code");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<ServletRequest> captor = ArgumentCaptor.forClass(ServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        assertThat(captor.getValue()).isNotInstanceOf(XssFilter.XssRequestWrapper.class);
    }

    @Test
    @DisplayName("Apple 콜백 경로 (apple/callback) 도 sanitize 우회 — server-side auth-code (Google PR #204 패턴)")
    void appleServerSideCallback_bypassesSanitize() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST",
                "/api/v1/auth/apple/callback");
        request.setRequestURI("/api/v1/auth/apple/callback");
        String rawCode = "c1.0.adk/with/slash";
        request.setParameter("code", rawCode);
        request.setParameter("state", "tenant.nonce-value");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<ServletRequest> captor = ArgumentCaptor.forClass(ServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        ServletRequest delivered = captor.getValue();
        assertThat(delivered).isNotInstanceOf(XssFilter.XssRequestWrapper.class);
        assertThat(delivered.getParameter("code")).isEqualTo(rawCode);
        assertThat(delivered.getParameter("code")).doesNotContain("&#x2F;");
    }

    @Test
    @DisplayName("Apple authorize 경로 (oauth2/apple/authorize) 도 sanitize 우회")
    void appleAuthorize_bypassesSanitize() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET",
                "/api/v1/auth/oauth2/apple/authorize");
        request.setRequestURI("/api/v1/auth/oauth2/apple/authorize");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<ServletRequest> captor = ArgumentCaptor.forClass(ServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        assertThat(captor.getValue()).isNotInstanceOf(XssFilter.XssRequestWrapper.class);
    }

    @Test
    @DisplayName("Google authorize 경로도 sanitize 우회 (state 보존)")
    void googleAuthorize_bypassesSanitize() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET",
                "/api/v1/auth/oauth2/google/authorize");
        request.setRequestURI("/api/v1/auth/oauth2/google/authorize");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<ServletRequest> captor = ArgumentCaptor.forClass(ServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        assertThat(captor.getValue()).isNotInstanceOf(XssFilter.XssRequestWrapper.class);
    }

    @Test
    @DisplayName("프론트 공통 OAuth2 callback (/api/v1/auth/oauth2/callback) 도 sanitize 우회")
    void frontendOauth2Callback_bypassesSanitize() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST",
                "/api/v1/auth/oauth2/callback");
        request.setRequestURI("/api/v1/auth/oauth2/callback");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<ServletRequest> captor = ArgumentCaptor.forClass(ServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        assertThat(captor.getValue()).isNotInstanceOf(XssFilter.XssRequestWrapper.class);
    }

    @Test
    @DisplayName("레거시 prefix (/api/auth/google/callback) 도 sanitize 우회")
    void legacyAuthPrefix_bypassesSanitize() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET",
                "/api/auth/google/callback");
        request.setRequestURI("/api/auth/google/callback");
        String rawCode = "4/0Adk_legacy/path";
        request.setParameter("code", rawCode);

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<ServletRequest> captor = ArgumentCaptor.forClass(ServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        assertThat(captor.getValue().getParameter("code")).isEqualTo(rawCode);
    }

    @Test
    @DisplayName("비-OAuth 경로 (/api/v1/users/profile) 는 sanitize 정상 동작 (XSS 차단)")
    void nonOAuthPath_appliesSanitize() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET",
                "/api/v1/users/profile");
        request.setRequestURI("/api/v1/users/profile");
        request.setParameter("name", "<script>alert(1)</script>");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<ServletRequest> captor = ArgumentCaptor.forClass(ServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        ServletRequest delivered = captor.getValue();

        // 비-OAuth 경로는 XssRequestWrapper 가 씌워져 sanitize 가 적용되어야 한다.
        assertThat(delivered).isInstanceOf(XssFilter.XssRequestWrapper.class);
        String sanitized = delivered.getParameter("name");
        assertThat(sanitized).doesNotContain("<script>");
        assertThat(sanitized).doesNotContain("</script>");
    }

    @Test
    @DisplayName("비-OAuth 경로에서는 슬래시도 여전히 &#x2F; 로 이스케이프 (보안 본질 유지)")
    void nonOAuthPath_slashIsEscaped() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET",
                "/api/v1/users/search");
        request.setRequestURI("/api/v1/users/search");
        request.setParameter("query", "path/with/slash");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<ServletRequest> captor = ArgumentCaptor.forClass(ServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        ServletRequest delivered = captor.getValue();

        // 일반 경로는 sanitize 동작이 그대로 유지되어 / 가 &#x2F; 로 변환된다.
        assertThat(delivered).isInstanceOf(XssFilter.XssRequestWrapper.class);
        assertThat(delivered.getParameter("query")).contains("&#x2F;");
    }

    @Test
    @DisplayName("/api/v1/auth/login 처럼 callback/authorize 가 아닌 경로는 sanitize 적용")
    void authNonCallbackPath_appliesSanitize() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST",
                "/api/v1/auth/login");
        request.setRequestURI("/api/v1/auth/login");
        request.setParameter("username", "user/with/slash");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<ServletRequest> captor = ArgumentCaptor.forClass(ServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        ServletRequest delivered = captor.getValue();

        assertThat(delivered).isInstanceOf(XssFilter.XssRequestWrapper.class);
        assertThat(delivered.getParameter("username")).contains("&#x2F;");
    }
}
