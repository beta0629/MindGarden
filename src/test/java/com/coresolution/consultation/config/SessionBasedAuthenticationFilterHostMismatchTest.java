package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicBoolean;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.coresolution.consultation.constant.SessionManagementConstants;

/**
 * Host/tenant 불일치 요청은 user_sessions 복원·duplicate-login 표시를 하지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@DisplayName("SessionBasedAuthenticationFilter — Host 불일치 재로그인")
class SessionBasedAuthenticationFilterHostMismatchTest {

    @Test
    @DisplayName("불일치 속성이 있으면 세션 복원 없이 체인을 통과한다")
    void mismatchAttribute_skipsHydration() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated("user", "n/a", java.util.List.of()));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(SessionManagementConstants.REQUEST_ATTR_HOST_TENANT_MISMATCH, Boolean.TRUE);
        request.addHeader("Cookie", "JSESSIONID=shared-session");
        AtomicBoolean continued = new AtomicBoolean(false);

        new SessionBasedAuthenticationFilter().doFilter(
                request, new MockHttpServletResponse(), (req, res) -> continued.set(true));

        assertThat(continued).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(request.getAttribute(
                SessionManagementConstants.REQUEST_ATTR_SESSION_TERMINATED_DUPLICATE)).isNull();
        SecurityContextHolder.clearContext();
    }
}
