package com.coresolution.core.util;

import com.coresolution.consultation.sct.constant.SctConstants;

/**
 * API URI 경로 정규화 — 성능 통계·Micrometer·로그에서 동적 세그먼트(ID, UUID, opaque 토큰)를 플레이스홀더로 치환.
 *
 * @author CoreSolution
 * @since 2026-11-23
 */
public final class ApiUriSanitizer {

    private static final String PLACEHOLDER_ID = "{id}";
    private static final String PLACEHOLDER_UUID = "{uuid}";
    private static final String PLACEHOLDER_TOKEN = "{token}";

    private static final String UUID_REGEX =
            "/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
    private static final String NUMERIC_ID_REGEX = "/\\d+";

    private static final String SCT_PUBLIC_PATH_PREFIX = SctConstants.PUBLIC_API_PREFIX + "/";

    private ApiUriSanitizer() {
    }

    /**
     * {@link com.coresolution.core.interceptor.ApiPerformanceInterceptor} 통계 키용.
     * UUID → {@value #PLACEHOLDER_UUID}, 숫자 ID → {@value #PLACEHOLDER_ID}.
     *
     * @param path 요청 URI 경로
     * @return 정규화된 경로
     */
    public static String forPerformanceStats(String path) {
        return sanitize(path, PLACEHOLDER_UUID);
    }

    /**
     * {@link com.coresolution.consultation.interceptor.MetricsInterceptor} Micrometer uri 태그용.
     * UUID·숫자 ID 모두 → {@value #PLACEHOLDER_ID}.
     *
     * @param uri 요청 URI 경로
     * @return 정규화된 URI
     */
    public static String forMetrics(String uri) {
        return sanitize(uri, PLACEHOLDER_ID);
    }

    /**
     * Rate limit 등 로그 출력용.
     *
     * @param uri 요청 URI 경로
     * @return 정규화된 URI
     */
    public static String forLogging(String uri) {
        return sanitize(uri, PLACEHOLDER_ID);
    }

    private static String sanitize(String path, String uuidPlaceholder) {
        if (path == null || path.isEmpty()) {
            return path;
        }
        String normalized = redactSctOpaqueTokenSegment(path);
        normalized = normalized.replaceAll(UUID_REGEX, "/" + uuidPlaceholder);
        normalized = normalized.replaceAll(NUMERIC_ID_REGEX, "/" + PLACEHOLDER_ID);
        return normalized;
    }

    /**
     * {@code /api/v1/public/sct/{opaque}/...} 의 opaque 세그먼트를 {@value #PLACEHOLDER_TOKEN} 로 치환.
     */
    static String redactSctOpaqueTokenSegment(String path) {
        if (path == null || !path.regionMatches(0, SCT_PUBLIC_PATH_PREFIX, 0, SCT_PUBLIC_PATH_PREFIX.length())) {
            return path;
        }
        String remainder = path.substring(SCT_PUBLIC_PATH_PREFIX.length());
        if (remainder.isEmpty()) {
            return path;
        }
        int slash = remainder.indexOf('/');
        if (slash < 0) {
            return SCT_PUBLIC_PATH_PREFIX + PLACEHOLDER_TOKEN;
        }
        String afterToken = remainder.substring(slash);
        return SCT_PUBLIC_PATH_PREFIX + PLACEHOLDER_TOKEN + afterToken;
    }
}