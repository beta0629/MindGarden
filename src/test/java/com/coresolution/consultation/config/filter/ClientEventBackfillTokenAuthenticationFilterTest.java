package com.coresolution.consultation.config.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.stream.Collectors;

import com.coresolution.consultation.constant.ClientEventBackfillConstants;
import com.coresolution.core.constants.SecurityRoleConstants;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 백필 공유 시크릿 필터 — 유효 토큰만 ROLE_ADMIN, 그 외 no-op.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@DisplayName("ClientEventBackfillTokenAuthenticationFilter")
class ClientEventBackfillTokenAuthenticationFilterTest {

    private static final String TOKEN = "unit-test-backfill-token-value";

    private Environment environment;
    private ClientEventBackfillTokenAuthenticationFilter filter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        environment = mock(Environment.class);
        filter = new ClientEventBackfillTokenAuthenticationFilter(environment);
        filterChain = mock(FilterChain.class);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("env 미설정 → SecurityContext 미설정(no-op)")
    void unsetEnv_noop() throws Exception {
        when(environment.getProperty(ClientEventBackfillConstants.BACKFILL_TOKEN_ENV)).thenReturn(null);

        MockHttpServletRequest request = postBackfill();
        request.addHeader(ClientEventBackfillConstants.BACKFILL_TOKEN_HEADER, TOKEN);

        filter.doFilter(request, new MockHttpServletResponse(), filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("env 빈 문자열 → no-op")
    void blankEnv_noop() throws Exception {
        when(environment.getProperty(ClientEventBackfillConstants.BACKFILL_TOKEN_ENV)).thenReturn("  ");

        MockHttpServletRequest request = postBackfill();
        request.addHeader(ClientEventBackfillConstants.BACKFILL_TOKEN_HEADER, TOKEN);

        filter.doFilter(request, new MockHttpServletResponse(), filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("유효 토큰 → ROLE_ADMIN 부여")
    void validToken_setsAdmin() throws Exception {
        when(environment.getProperty(ClientEventBackfillConstants.BACKFILL_TOKEN_ENV)).thenReturn(TOKEN);

        MockHttpServletRequest request = postBackfill();
        request.addHeader(ClientEventBackfillConstants.BACKFILL_TOKEN_HEADER, TOKEN);

        filter.doFilter(request, new MockHttpServletResponse(), filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.isAuthenticated()).isTrue();
        assertThat(auth.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toSet()))
                .containsExactly(SecurityRoleConstants.ROLE_ADMIN);
    }

    @Test
    @DisplayName("잘못된 토큰 → SecurityContext 미설정(거부 유도 no-op)")
    void wrongToken_noop() throws Exception {
        when(environment.getProperty(ClientEventBackfillConstants.BACKFILL_TOKEN_ENV)).thenReturn(TOKEN);

        MockHttpServletRequest request = postBackfill();
        request.addHeader(ClientEventBackfillConstants.BACKFILL_TOKEN_HEADER, "wrong-token");

        filter.doFilter(request, new MockHttpServletResponse(), filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("헤더 누락 → no-op")
    void missingHeader_noop() throws Exception {
        when(environment.getProperty(ClientEventBackfillConstants.BACKFILL_TOKEN_ENV)).thenReturn(TOKEN);

        filter.doFilter(postBackfill(), new MockHttpServletResponse(), filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("다른 경로 → shouldNotFilter, 컨텍스트 미변경")
    void otherPath_skipped() throws Exception {
        when(environment.getProperty(ClientEventBackfillConstants.BACKFILL_TOKEN_ENV)).thenReturn(TOKEN);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/admin/other");
        request.addHeader(ClientEventBackfillConstants.BACKFILL_TOKEN_HEADER, TOKEN);

        filter.doFilter(request, new MockHttpServletResponse(), filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("constantTimeEquals — 일치/불일치")
    void constantTimeEquals() {
        assertThat(ClientEventBackfillTokenAuthenticationFilter.constantTimeEquals("abc", "abc"))
                .isTrue();
        assertThat(ClientEventBackfillTokenAuthenticationFilter.constantTimeEquals("abc", "abd"))
                .isFalse();
        assertThat(ClientEventBackfillTokenAuthenticationFilter.constantTimeEquals("abc", "ab"))
                .isFalse();
        assertThat(ClientEventBackfillTokenAuthenticationFilter.constantTimeEquals(null, "a"))
                .isFalse();
    }

    private static MockHttpServletRequest postBackfill() {
        return new MockHttpServletRequest("POST", ClientEventBackfillConstants.API_PATH);
    }
}
