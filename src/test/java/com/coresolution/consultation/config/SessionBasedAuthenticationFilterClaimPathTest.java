package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link SessionBasedAuthenticationFilter#isWebOAuthSessionTokenClaimPath} 회귀.
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@DisplayName("SessionBasedAuthenticationFilter — web-session-tokens 스킵")
class SessionBasedAuthenticationFilterClaimPathTest {

    @Test
    @DisplayName("v1·레거시 claim 경로만 true")
    void claimPaths() {
        assertThat(SessionBasedAuthenticationFilter.isWebOAuthSessionTokenClaimPath(
                "/api/v1/auth/oauth2/web-session-tokens")).isTrue();
        assertThat(SessionBasedAuthenticationFilter.isWebOAuthSessionTokenClaimPath(
                "/api/auth/oauth2/web-session-tokens")).isTrue();
        assertThat(SessionBasedAuthenticationFilter.isWebOAuthSessionTokenClaimPath(
                "/api/v1/auth/current-user")).isFalse();
        assertThat(SessionBasedAuthenticationFilter.isWebOAuthSessionTokenClaimPath(null)).isFalse();
    }
}
