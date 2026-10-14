package com.coresolution.consultation.util;

import java.net.URI;

/**
 * OPS diff 등 표시용 URL 마스킹.
 * scheme·host·port·path 는 평문으로 두고 query·fragment 만 가린다.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
public final class UrlDisplayMasking {

    /** query 값이 있을 때 치환하는 마스킹 상수. */
    public static final String QUERY_MASK = "****";

    /** fragment 값이 있을 때 치환하는 마스킹 상수. */
    public static final String FRAGMENT_MASK = "****";

    private UrlDisplayMasking() {
    }

    /**
     * URL 의 민감 가능 부분(query·fragment)만 마스킹한다.
     * 파싱 실패 시 {@link SecretValueMasking#mask(String)} 로 fallback 하여 원문 dump 를 막는다.
     *
     * @param url 원본 URL (null 허용)
     * @return 마스킹된 표시 문자열 (null/blank → empty)
     */
    public static String maskQueryAndFragment(String url) {
        if (url == null || url.isBlank()) {
            return SecretValueMasking.EMPTY;
        }
        String trimmed = url.trim();
        try {
            URI uri = URI.create(trimmed);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (scheme == null || scheme.isBlank() || host == null || host.isBlank()) {
                return SecretValueMasking.mask(trimmed);
            }

            StringBuilder masked = new StringBuilder();
            masked.append(scheme).append("://");
            masked.append(host);
            if (uri.getPort() >= 0) {
                masked.append(':').append(uri.getPort());
            }
            String path = uri.getRawPath();
            if (path != null && !path.isEmpty()) {
                masked.append(path);
            }
            if (uri.getRawQuery() != null) {
                masked.append('?').append(QUERY_MASK);
            }
            if (uri.getRawFragment() != null) {
                masked.append('#').append(FRAGMENT_MASK);
            }
            return masked.toString();
        } catch (IllegalArgumentException ex) {
            return SecretValueMasking.mask(trimmed);
        }
    }
}
