package com.coresolution.core.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link ApiUriSanitizer} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-11-23
 */
class ApiUriSanitizerTest {

    private static final String OPAQUE_TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_.";
    private static final String SCT_META = "/api/v1/public/sct/" + OPAQUE_TOKEN + "/meta";

    @Test
    @DisplayName("forPerformanceStats: SCT opaque 토큰 세그먼트 → {token}, 원문 미포함")
    void forPerformanceStats_sctOpaqueToken_redacted() {
        String normalized = ApiUriSanitizer.forPerformanceStats(SCT_META);
        assertThat(normalized).isEqualTo("/api/v1/public/sct/{token}/meta");
        assertThat(normalized).doesNotContain(OPAQUE_TOKEN);
    }

    @Test
    @DisplayName("forMetrics: SCT opaque 토큰 세그먼트 → {token}")
    void forMetrics_sctOpaqueToken_redacted() {
        String normalized = ApiUriSanitizer.forMetrics(SCT_META);
        assertThat(normalized).isEqualTo("/api/v1/public/sct/{token}/meta");
        assertThat(normalized).doesNotContain(OPAQUE_TOKEN);
    }

    @Test
    @DisplayName("forLogging: SCT opaque 토큰 세그먼트 → {token}")
    void forLogging_sctOpaqueToken_redacted() {
        String normalized = ApiUriSanitizer.forLogging(SCT_META);
        assertThat(normalized).isEqualTo("/api/v1/public/sct/{token}/meta");
        assertThat(normalized).doesNotContain(OPAQUE_TOKEN);
    }

    @Test
    @DisplayName("forPerformanceStats: 숫자 ID → {id}")
    void forPerformanceStats_numericId_placeholder() {
        assertThat(ApiUriSanitizer.forPerformanceStats("/api/v1/users/12345"))
                .isEqualTo("/api/v1/users/{id}");
    }

    @Test
    @DisplayName("forPerformanceStats: UUID → {uuid}")
    void forPerformanceStats_uuid_placeholder() {
        String path = "/api/v1/resources/550e8400-e29b-41d4-a716-446655440000";
        assertThat(ApiUriSanitizer.forPerformanceStats(path))
                .isEqualTo("/api/v1/resources/{uuid}");
    }

    @Test
    @DisplayName("forMetrics: UUID → {id} (기존 Micrometer 태그 규칙)")
    void forMetrics_uuid_mapsToIdPlaceholder() {
        String path = "/api/v1/resources/550e8400-e29b-41d4-a716-446655440000";
        assertThat(ApiUriSanitizer.forMetrics(path))
                .isEqualTo("/api/v1/resources/{id}");
    }

    @Test
    @DisplayName("forPerformanceStats: SCT verify/draft/submit 등 하위 경로 유지")
    void forPerformanceStats_sctSubpaths_preserved() {
        String raw = "url-safe-base64-token";
        assertThat(ApiUriSanitizer.forPerformanceStats("/api/v1/public/sct/" + raw + "/verify"))
                .isEqualTo("/api/v1/public/sct/{token}/verify");
        assertThat(ApiUriSanitizer.forPerformanceStats("/api/v1/public/sct/" + raw + "/draft"))
                .isEqualTo("/api/v1/public/sct/{token}/draft");
    }

    @Test
    @DisplayName("redactSctOpaqueTokenSegment: 접두어만일 때 토큰-only 경로")
    void redactSct_tokenOnlyPath() {
        assertThat(ApiUriSanitizer.redactSctOpaqueTokenSegment("/api/v1/public/sct/" + OPAQUE_TOKEN))
                .isEqualTo("/api/v1/public/sct/{token}");
    }

    @Test
    @DisplayName("SPA /public/sct/{token} → {token}")
    void forLogging_publicSctWebPath_redacted() {
        String raw = "opaque-web-token";
        assertThat(ApiUriSanitizer.forLogging("/public/sct/" + raw))
                .isEqualTo("/public/sct/{token}");
        assertThat(ApiUriSanitizer.forLogging("/public/sct/" + raw + "/extra"))
                .isEqualTo("/public/sct/{token}/extra");
    }

    @Test
    @DisplayName("비 SCT 경로는 변경하지 않음")
    void forPerformanceStats_nonSctPath_unchangedExceptKnownPatterns() {
        assertThat(ApiUriSanitizer.forPerformanceStats("/api/v1/admin/performance/stats"))
                .isEqualTo("/api/v1/admin/performance/stats");
    }
}