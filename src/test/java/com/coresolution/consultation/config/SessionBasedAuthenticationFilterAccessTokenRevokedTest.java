package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicBoolean;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.util.AccessTokenRevocationRequestMarker;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Access JWT 폐기 표시가 있으면 user_sessions / HttpSession hydrate 를 하지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-22
 */
@DisplayName("SessionBasedAuthenticationFilter — Access 토큰 폐기 표시")
class SessionBasedAuthenticationFilterAccessTokenRevokedTest {

    private static final String SESSION_ID = "AABBCCDDEEFF00112233445566778899";

    @Test
    @DisplayName("폐기 속성이 있으면 세션 사용자 있어도 Auth null 로 체인 통과")
    void revokedAttribute_skipsHydration() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated("user", "n/a", java.util.List.of()));

        User sessionUser = User.builder()
                .email("session-alive@example.com")
                .role(UserRole.CLIENT)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        sessionUser.setId(99L);
        sessionUser.setTenantId("tenant-revoked-attr");

        MockHttpSession httpSession = new MockHttpSession(null, SESSION_ID);
        httpSession.setAttribute(SessionConstants.USER_OBJECT, sessionUser);
        httpSession.setAttribute(SessionConstants.SESSION_ID, SESSION_ID);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/clients/me");
        request.setSession(httpSession);
        request.setCookies(new jakarta.servlet.http.Cookie("JSESSIONID", SESSION_ID));
        AccessTokenRevocationRequestMarker.mark(request);

        SessionBasedAuthenticationFilter filter = new SessionBasedAuthenticationFilter();
        ReflectionTestUtils.setField(
                filter,
                "sessionTimeoutProperties",
                new SessionTimeoutProperties(java.time.Duration.ofHours(4)));

        AtomicBoolean continued = new AtomicBoolean(false);
        filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> continued.set(true));

        assertThat(continued).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        SecurityContextHolder.clearContext();
    }
}
