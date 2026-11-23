package com.coresolution.core.util;

import com.coresolution.consultation.sct.constant.SctConsentKeys;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Enumeration;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpHeaders;

/**
 * HTTP 요청 헤더를 로그에 출력할 때 민감 값을 마스킹한다.
 *
 * @author CoreSolution
 * @since 2026-11-23
 */
public final class HttpRequestHeadersForLog {

    /** 로그에 남길 민감 헤더 값 대체 문자열. */
    public static final String REDACTED_VALUE = "[REDACTED]";

    private static final Set<String> SENSITIVE_HEADER_NAMES_LOWER = Set.of(
            HttpHeaders.AUTHORIZATION.toLowerCase(Locale.ROOT),
            HttpHeaders.COOKIE.toLowerCase(Locale.ROOT),
            HttpHeaders.SET_COOKIE.toLowerCase(Locale.ROOT),
            SctConsentKeys.VERIFY_SESSION_HEADER.toLowerCase(Locale.ROOT));

    private HttpRequestHeadersForLog() {
    }

    /**
     * 로그 출력 시 값을 마스킹해야 하는 헤더인지 여부.
     *
     * @param headerName 헤더 이름
     * @return 민감 헤더이면 true
     */
    public static boolean isSensitiveHeader(String headerName) {
        if (headerName == null || headerName.isEmpty()) {
            return false;
        }
        return SENSITIVE_HEADER_NAMES_LOWER.contains(headerName.toLowerCase(Locale.ROOT));
    }

    /**
     * 단일 헤더 값을 로그용 문자열로 변환한다.
     *
     * @param headerName 헤더 이름
     * @param headerValue 원본 값 (null 허용)
     * @return 마스킹된 값 또는 원본
     */
    public static String headerValueForLog(String headerName, String headerValue) {
        if (isSensitiveHeader(headerName)) {
            return REDACTED_VALUE;
        }
        return headerValue;
    }

    /**
     * 요청의 모든 헤더를 {@code {name=value, ...}} 형태로 반환한다. 민감 헤더 값은 {@link #REDACTED_VALUE}.
     *
     * @param request HTTP 요청
     * @return 헤더 맵 문자열
     */
    public static String formatAllHeaders(HttpServletRequest request) {
        StringBuilder sb = new StringBuilder("{");
        Enumeration<String> headerNames = request.getHeaderNames();
        boolean first = true;
        while (headerNames != null && headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            if (!first) {
                sb.append(", ");
            }
            sb.append(headerName)
                    .append("=")
                    .append(headerValueForLog(headerName, request.getHeader(headerName)));
            first = false;
        }
        sb.append("}");
        return sb.toString();
    }
}