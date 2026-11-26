package com.coresolution.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.ClientEventBackfillConstants;
import com.coresolution.consultation.sct.constant.SctConsentKeys;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * {@link HttpRequestHeadersForLog} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-11-23
 */
@DisplayName("HttpRequestHeadersForLog — 민감 헤더 로그 마스킹")
class HttpRequestHeadersForLogTest {

    private static final String SECRET_VERIFY_SESSION = "sct-verify-session-capability-secret-uuid";
    private static final String SECRET_BACKFILL_TOKEN = "client-event-backfill-shared-secret-token";
    private static final String BEARER_TOKEN = "Bearer eyJhbGciOiJIUzI1NiJ9.secret.payload";
    private static final String COOKIE_VALUE = "JSESSIONID=abc123def456; Path=/";

    @Test
    @DisplayName("formatAllHeaders: X-Sct-Verify-Session 원문 미포함·[REDACTED]")
    void formatAllHeaders_redactsVerifySessionHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(SctConsentKeys.VERIFY_SESSION_HEADER, SECRET_VERIFY_SESSION);
        request.addHeader("X-Tenant-Id", "tenant-demo-001");

        String formatted = HttpRequestHeadersForLog.formatAllHeaders(request);

        assertThat(formatted).contains(SctConsentKeys.VERIFY_SESSION_HEADER + "=[REDACTED]");
        assertThat(formatted).doesNotContain(SECRET_VERIFY_SESSION);
        assertThat(formatted).contains("X-Tenant-Id=tenant-demo-001");
    }

    @Test
    @DisplayName("formatAllHeaders: X-Client-Event-Backfill-Token 원문 미포함·[REDACTED]")
    void formatAllHeaders_redactsClientEventBackfillTokenHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ClientEventBackfillConstants.BACKFILL_TOKEN_HEADER, SECRET_BACKFILL_TOKEN);
        request.addHeader("X-Tenant-Id", "tenant-demo-001");

        String formatted = HttpRequestHeadersForLog.formatAllHeaders(request);

        assertThat(formatted)
                .contains(ClientEventBackfillConstants.BACKFILL_TOKEN_HEADER + "=[REDACTED]");
        assertThat(formatted).doesNotContain(SECRET_BACKFILL_TOKEN);
        assertThat(formatted).contains("X-Tenant-Id=tenant-demo-001");
    }

    @Test
    @DisplayName("formatAllHeaders: Authorization·Cookie 마스킹")
    void formatAllHeaders_redactsAuthAndCookie() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, BEARER_TOKEN);
        request.addHeader(HttpHeaders.COOKIE, COOKIE_VALUE);

        String formatted = HttpRequestHeadersForLog.formatAllHeaders(request);

        assertThat(formatted).contains("Authorization=[REDACTED]");
        assertThat(formatted).contains("Cookie=[REDACTED]");
        assertThat(formatted).doesNotContain(BEARER_TOKEN);
        assertThat(formatted).doesNotContain(COOKIE_VALUE);
    }

    @Test
    @DisplayName("headerValueForLog: 대소문자 무관 Set-Cookie 마스킹")
    void headerValueForLog_setCookieCaseInsensitive() {
        assertThat(HttpRequestHeadersForLog.headerValueForLog("set-cookie", "MGSESSION=live"))
                .isEqualTo(HttpRequestHeadersForLog.REDACTED_VALUE);
    }
}