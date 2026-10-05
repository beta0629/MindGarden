package com.coresolution.core.filter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.session.web.http.SessionRepositoryFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.coresolution.consultation.config.SessionCookieSupport;
import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.util.TenantHostSubdomainUtil;

import lombok.extern.slf4j.Slf4j;

/**
 * 요청 Host 의 테넌트와 세션에 묶인 tenantId 가 다르면 세션을 끊는다.
 *
 * <p>parent Domain 쿠키가 다른 테넌트 Host 로 넘어오면 같은 Redis 세션이 재사용된다.
 * 그 경우를 중복 로그인으로 오인하지 않고, 쿠키를 만료한 뒤 그 Host 에서 다시 로그인하게 한다.
 * apex(테넌트 라벨 없음)는 OAuth 콜백이므로 세션을 유지한다.</p>
 *
 * <p>{@code dev} 에서 {@code SESSION_COOKIE_DOMAIN} 이 남아 있으면 parent 쿠키만
 * {@code Max-Age=0} 으로 지우고, 같은 Host 세션은 host-only 쿠키로 다시 심는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Slf4j
@Component
@Order(SessionRepositoryFilter.DEFAULT_ORDER + 1)
public class SessionTenantHostBindingFilter extends OncePerRequestFilter implements Ordered {

    private final TenantRepository tenantRepository;
    private final SessionCookieSupport sessionCookieSupport;
    private final SessionTimeoutProperties sessionTimeoutProperties;

    /**
     * @param tenantRepository         Host 라벨 → tenantId
     * @param sessionCookieSupport     쿠키 Domain·만료 SSOT
     * @param sessionTimeoutProperties host-only 재발급 Max-Age
     */
    public SessionTenantHostBindingFilter(TenantRepository tenantRepository,
                                          SessionCookieSupport sessionCookieSupport,
                                          SessionTimeoutProperties sessionTimeoutProperties) {
        this.tenantRepository = tenantRepository;
        this.sessionCookieSupport = sessionCookieSupport;
        this.sessionTimeoutProperties = sessionTimeoutProperties;
    }

    @Override
    public int getOrder() {
        return SessionRepositoryFilter.DEFAULT_ORDER + 1;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        appendLegacyParentCookieExpiry(request, response);

        HttpSession session = openSession(request);
        if (session == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String boundTenantId = readBoundTenantId(session);
        String hostTenantId = resolveHostTenantId(request);
        if (boundTenantId == null || hostTenantId == null || boundTenantId.equals(hostTenantId)) {
            reissueHostOnlyCookieIfLegacyParentConfigured(request, response, session);
            filterChain.doFilter(request, response);
            return;
        }

        log.info("Host/tenant 불일치 — 세션 무효화 후 재로그인: hostTenantId={}", hostTenantId);
        SecurityContextHolder.clearContext();
        invalidateQuietly(session);
        appendHostCookieExpiry(request, response);
        filterChain.doFilter(new HostMismatchRequest(request), response);
    }

    private void appendLegacyParentCookieExpiry(HttpServletRequest request, HttpServletResponse response) {
        String header = sessionCookieSupport.buildLegacySharedDomainExpiryHeader(request);
        if (header != null) {
            response.addHeader(HttpHeaders.SET_COOKIE, header);
        }
    }

    private void appendHostCookieExpiry(HttpServletRequest request, HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE,
                sessionCookieSupport.buildExpiredJsessionSetCookieHeader(request));
    }

    /**
     * parent 쿠키를 지운 뒤에도 같은 Host 재접속이 유지되도록 host-only 쿠키를 다시 쓴다.
     * dev 가 아니면 {@link SessionCookieSupport#resolveLegacySharedDomain()} 이 null 이라 아무 것도 하지 않는다.
     */
    private void reissueHostOnlyCookieIfLegacyParentConfigured(HttpServletRequest request,
                                                               HttpServletResponse response,
                                                               HttpSession session) {
        if (sessionCookieSupport.resolveLegacySharedDomain() == null) {
            return;
        }
        int maxAge = sessionTimeoutProperties.getTimeoutSeconds();
        if (maxAge <= 0) {
            return;
        }
        response.addHeader(HttpHeaders.SET_COOKIE,
                sessionCookieSupport.buildJsessionCookie(session.getId(), maxAge, request).toString());
    }

    private HttpSession openSession(HttpServletRequest request) {
        try {
            return request.getSession(false);
        } catch (IllegalStateException ex) {
            return null;
        }
    }

    private void invalidateQuietly(HttpSession session) {
        try {
            session.invalidate();
        } catch (IllegalStateException ex) {
            log.debug("세션이 이미 무효화됨");
        }
    }

    private String readBoundTenantId(HttpSession session) {
        try {
            Object attr = session.getAttribute(SessionConstants.TENANT_ID);
            if (attr != null && !attr.toString().isBlank()) {
                return attr.toString().trim();
            }
            User user = SessionUtils.getCurrentUser(session);
            if (user != null && user.getTenantId() != null && !user.getTenantId().isBlank()) {
                return user.getTenantId().trim();
            }
        } catch (IllegalStateException ex) {
            return null;
        }
        return null;
    }

    /**
     * @return Host 테넌트 ID. apex·예약 라벨·조회 실패면 null (세션 유지)
     */
    private String resolveHostTenantId(HttpServletRequest request) {
        String subdomain = TenantHostSubdomainUtil.extractTenantSubdomain(request);
        if (subdomain == null || subdomain.isBlank()) {
            return null;
        }
        try {
            return tenantRepository.findBySubdomainIgnoreCase(subdomain)
                    .map(Tenant::getTenantId)
                    .filter(id -> id != null && !id.isBlank())
                    .orElse(null);
        } catch (RuntimeException ex) {
            log.warn("Host 테넌트 조회 실패 — 세션 유지: {}", ex.getMessage());
            return null;
        }
    }

    /**
     * 불일치 요청에서 JSESSIONID 를 숨겨 이후 필터가 같은 세션을 복원하지 않게 한다.
     */
    static final class HostMismatchRequest extends HttpServletRequestWrapper {

        HostMismatchRequest(HttpServletRequest request) {
            super(request);
            request.setAttribute(SessionManagementConstants.REQUEST_ATTR_HOST_TENANT_MISMATCH, Boolean.TRUE);
        }

        @Override
        public HttpSession getSession(boolean create) {
            if (!create) {
                return null;
            }
            return super.getSession(true);
        }

        @Override
        public HttpSession getSession() {
            return getSession(true);
        }

        @Override
        public Cookie[] getCookies() {
            Cookie[] cookies = super.getCookies();
            if (cookies == null) {
                return null;
            }
            List<Cookie> kept = new ArrayList<>();
            for (Cookie cookie : cookies) {
                if (!SessionConstants.SESSION_COOKIE_NAME.equals(cookie.getName())) {
                    kept.add(cookie);
                }
            }
            return kept.isEmpty() ? null : kept.toArray(Cookie[]::new);
        }

        @Override
        public String getHeader(String name) {
            if ("Cookie".equalsIgnoreCase(name)) {
                return stripSessionCookie(super.getHeader(name));
            }
            return super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            if ("Cookie".equalsIgnoreCase(name)) {
                String stripped = stripSessionCookie(super.getHeader(name));
                if (stripped == null || stripped.isBlank()) {
                    return Collections.emptyEnumeration();
                }
                return Collections.enumeration(List.of(stripped));
            }
            return super.getHeaders(name);
        }

        private static String stripSessionCookie(String cookieHeader) {
            if (cookieHeader == null || cookieHeader.isBlank()) {
                return cookieHeader;
            }
            StringBuilder kept = new StringBuilder();
            for (String part : cookieHeader.split(";")) {
                String trimmed = part.trim();
                if (trimmed.isEmpty() || trimmed.startsWith(SessionConstants.SESSION_COOKIE_NAME + "=")) {
                    continue;
                }
                if (kept.length() > 0) {
                    kept.append("; ");
                }
                kept.append(trimmed);
            }
            return kept.length() == 0 ? null : kept.toString();
        }
    }
}
