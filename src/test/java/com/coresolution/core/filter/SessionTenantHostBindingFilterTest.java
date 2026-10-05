package com.coresolution.core.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;

import com.coresolution.consultation.config.SessionCookieSupport;
import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Host 테넌트와 세션 tenantId 불일치 시 세션을 끊고, 같은 Host·apex 는 유지한다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("SessionTenantHostBindingFilter — Host 세션 격리")
class SessionTenantHostBindingFilterTest {

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";
    private static final String HOST_A = "clinic-a.dev.core-solution.co.kr";
    private static final String HOST_B = "clinic-b.dev.core-solution.co.kr";
    private static final String APEX = "dev.core-solution.co.kr";

    private TenantRepository tenantRepository;
    private SessionTenantHostBindingFilter filter;

    @BeforeEach
    void setUp() {
        tenantRepository = mock(TenantRepository.class);
        when(tenantRepository.findBySubdomainIgnoreCase("clinic-a"))
                .thenReturn(Optional.of(tenant(TENANT_A)));
        when(tenantRepository.findBySubdomainIgnoreCase("clinic-b"))
                .thenReturn(Optional.of(tenant(TENANT_B)));

        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        env.setProperty("SESSION_COOKIE_DOMAIN", "parent.example");
        env.setProperty("server.servlet.session.cookie.http-only", "true");
        env.setProperty("server.servlet.session.cookie.secure", "true");
        env.setProperty("server.servlet.session.cookie.same-site", "Lax");

        SessionTimeoutProperties timeouts = mock(SessionTimeoutProperties.class);
        when(timeouts.getTimeoutSeconds()).thenReturn(3600);

        filter = new SessionTenantHostBindingFilter(
                tenantRepository, new SessionCookieSupport(env), timeouts);
    }

    @Test
    @DisplayName("같은 Host 재접속은 세션을 유지하고 host-only 쿠키만 다시 심는다")
    void sameHost_keepsSession_andReissuesHostOnlyCookie() throws Exception {
        MockHttpServletRequest request = request(HOST_A, TENANT_A);
        MockHttpSession session = (MockHttpSession) request.getSession(false);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<ServletRequest> seen = new AtomicReference<>();

        filter.doFilter(request, response, (req, res) -> seen.set(req));

        assertThat(session.isInvalid()).isFalse();
        assertThat(seen.get()).isSameAs(request);
        assertThat(request.getAttribute(SessionManagementConstants.REQUEST_ATTR_HOST_TENANT_MISMATCH))
                .isNull();
        assertThat(request.getAttribute(
                SessionManagementConstants.REQUEST_ATTR_SESSION_TERMINATED_DUPLICATE)).isNull();

        String headers = String.join("\n", response.getHeaders(HttpHeaders.SET_COOKIE));
        assertThat(headers).contains("Domain=parent.example");
        assertThat(headers).contains("Max-Age=0");
        assertThat(headers).contains(session.getId());
        assertThat(headers).doesNotContain("Domain=parent.example; Path=/; Max-Age=3600");
        boolean hostOnlyRenewal = response.getHeaders(HttpHeaders.SET_COOKIE).stream()
                .anyMatch(header -> header.contains(session.getId()) && !header.contains("Domain="));
        assertThat(hostOnlyRenewal).isTrue();
    }

    @Test
    @DisplayName("다른 서브도메인 Host 는 세션을 끊고 duplicate-login 으로 표시하지 않는다")
    void otherHost_invalidatesWithoutDuplicateLoginFlag() throws Exception {
        MockHttpServletRequest request = request(HOST_B, TENANT_A);
        request.setCookies(new jakarta.servlet.http.Cookie(SessionConstants.SESSION_COOKIE_NAME, "shared"));
        HttpServletRequest withCookieHeader = new jakarta.servlet.http.HttpServletRequestWrapper(request) {
            @Override
            public String getHeader(String name) {
                if ("Cookie".equalsIgnoreCase(name)) {
                    return SessionConstants.SESSION_COOKIE_NAME + "=shared; other=1";
                }
                return super.getHeader(name);
            }
        };
        MockHttpSession session = (MockHttpSession) request.getSession(false);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<HttpServletRequest> seen = new AtomicReference<>();

        FilterChain chain = (req, res) -> seen.set((HttpServletRequest) req);
        filter.doFilter(withCookieHeader, response, chain);

        assertThat(session.isInvalid()).isTrue();
        assertThat(seen.get().getSession(false)).isNull();
        assertThat(seen.get().getAttribute(SessionManagementConstants.REQUEST_ATTR_HOST_TENANT_MISMATCH))
                .isEqualTo(Boolean.TRUE);
        assertThat(seen.get().getAttribute(
                SessionManagementConstants.REQUEST_ATTR_SESSION_TERMINATED_DUPLICATE)).isNull();
        assertThat(seen.get().getHeader("Cookie")).isEqualTo("other=1");
        jakarta.servlet.http.Cookie[] cookies = seen.get().getCookies();
        if (cookies != null) {
            for (jakarta.servlet.http.Cookie cookie : cookies) {
                assertThat(cookie.getName()).isNotEqualTo(SessionConstants.SESSION_COOKIE_NAME);
            }
        }

        String headers = String.join("\n", response.getHeaders(HttpHeaders.SET_COOKIE));
        assertThat(headers).contains("Domain=parent.example");
        assertThat(headers).contains("Max-Age=0");
        boolean leakedLiveSession = response.getHeaders(HttpHeaders.SET_COOKIE).stream()
                .anyMatch(header -> header.contains(session.getId()) && !header.contains("Max-Age=0"));
        assertThat(leakedLiveSession).isFalse();
    }

    @Test
    @DisplayName("apex Host 는 OAuth 콜백 세션을 유지한다")
    void apexHost_keepsSession() throws Exception {
        MockHttpServletRequest request = request(APEX, TENANT_A);
        MockHttpSession session = (MockHttpSession) request.getSession(false);
        AtomicReference<ServletRequest> seen = new AtomicReference<>();

        filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> seen.set(req));

        assertThat(session.isInvalid()).isFalse();
        assertThat(seen.get()).isSameAs(request);
        assertThat(request.getAttribute(SessionManagementConstants.REQUEST_ATTR_HOST_TENANT_MISMATCH))
                .isNull();
    }

    private static MockHttpServletRequest request(String host, String tenantId) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", host);
        request.setSecure(true);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.TENANT_ID, tenantId);
        request.setSession(session);
        return request;
    }

    private static Tenant tenant(String tenantId) {
        return Tenant.builder().tenantId(tenantId).build();
    }
}
