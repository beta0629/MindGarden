package com.coresolution.core.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;

/**
 * HTTP 요청에서 클라이언트 IP를 추출한다. 프록시 환경에서는 {@code X-Forwarded-For} 첫 번째 값을 우선한다.
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
public final class HttpRequestClientIp {

    private HttpRequestClientIp() {
    }

    /**
     * 클라이언트 IP 문자열을 반환한다. 요청이 없으면 {@code null}.
     *
     * @param request HTTP 요청
     * @return 클라이언트 IP 또는 {@code null}
     */
    public static String resolve(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(xRealIp)) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }
}
