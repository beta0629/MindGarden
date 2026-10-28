package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.SessionManagementConstants;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Access JWT 폐기 요청 표시 — 필터 간 request attribute 공유.
 *
 * <p>{@link com.coresolution.consultation.config.filter.JwtAuthenticationFilter} 가
 * denylist·컷오프·중복로그인 차단으로 Bearer 를 거부할 때 mark 하고,
 * {@link com.coresolution.consultation.config.SessionBasedAuthenticationFilter} 가
 * 동일 요청에서 JSESSIONID 세션 hydrate 를 건너뛴다.</p>
 *
 * @author MindGarden
 * @since 2026-10-22
 */
public final class AccessTokenRevocationRequestMarker {

    private AccessTokenRevocationRequestMarker() {
    }

    /**
     * 현재 요청에 Access 토큰 폐기 표시를 남긴다.
     *
     * @param request 현재 HTTP 요청
     */
    public static void mark(HttpServletRequest request) {
        if (request == null) {
            return;
        }
        request.setAttribute(SessionManagementConstants.REQUEST_ATTR_ACCESS_TOKEN_REVOKED, Boolean.TRUE);
    }

    /**
     * Access 토큰 폐기 표시가 있는지 확인한다.
     *
     * @param request 현재 HTTP 요청
     * @return 표시되어 있으면 true
     */
    public static boolean isMarked(HttpServletRequest request) {
        if (request == null) {
            return false;
        }
        return Boolean.TRUE.equals(
                request.getAttribute(SessionManagementConstants.REQUEST_ATTR_ACCESS_TOKEN_REVOKED));
    }
}
