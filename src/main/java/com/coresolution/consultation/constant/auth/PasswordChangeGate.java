package com.coresolution.consultation.constant.auth;

import java.io.IOException;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 비밀번호 변경 전 토큰이 호출할 수 있는 API.
 *
 * <p>클레임 {@code pwd_change_required=true} 인 Access/Refresh 와
 * {@code isPasswordChanged=false} 세션은 여기 없는 경로에서 403
 * {@code PASSWORD_CHANGE_REQUIRED} 를 받는다.</p>
 *
 * @author MindGarden
 * @since 2026-10-14
 */
public final class PasswordChangeGate {

    /** JWT 클레임 이름. true 이면 비밀번호 변경 전 제한 토큰. */
    public static final String CLAIM = "pwd_change_required";

    /** 403 응답 errorCode·message. 화면은 errorCode 로 변경 모달을 연다. */
    public static final String ERROR_CODE = "PASSWORD_CHANGE_REQUIRED";

    private static final String METHOD_GET = "GET";
    private static final String METHOD_POST = "POST";
    private static final String METHOD_OPTIONS = "OPTIONS";

    private static final List<AllowedRoute> ALLOWED = List.of(
            new AllowedRoute(METHOD_POST, "/api/v1/auth/password/change"),
            new AllowedRoute(METHOD_GET, "/api/v1/auth/password/requirements"),
            new AllowedRoute(METHOD_POST, "/api/v1/auth/password/validate"),
            new AllowedRoute(METHOD_POST, "/api/v1/auth/logout"),
            new AllowedRoute(METHOD_GET, "/api/v1/auth/current-user"),
            new AllowedRoute(METHOD_POST, "/api/v1/auth/refresh-token"));

    private PasswordChangeGate() {
    }

    /**
     * @param request 현재 요청
     * @return 변경 전 토큰에 허용된 경로이면 true
     */
    public static boolean isAllowed(HttpServletRequest request) {
        if (request == null) {
            return false;
        }
        String method = request.getMethod();
        if (method != null && METHOD_OPTIONS.equalsIgnoreCase(method)) {
            return true;
        }
        String path = requestPath(request);
        for (AllowedRoute route : ALLOWED) {
            if (route.matches(method, path)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 403 JSON. 본문에 토큰·비밀번호를 넣지 않는다.
     *
     * @param response HTTP 응답
     * @throws IOException 응답 기록 실패
     */
    public static void writeForbidden(HttpServletResponse response) throws IOException {
        if (response == null || response.isCommitted()) {
            return;
        }
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
                "{\"success\":false,\"errorCode\":\"" + ERROR_CODE + "\",\"message\":\"" + ERROR_CODE + "\"}");
    }

    private static String requestPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null || uri.isEmpty()) {
            return "";
        }
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath)) {
            uri = uri.substring(contextPath.length());
        }
        if (uri.length() > 1 && uri.endsWith("/")) {
            uri = uri.substring(0, uri.length() - 1);
        }
        return uri;
    }

    private static final class AllowedRoute {
        private final String method;
        private final String path;

        private AllowedRoute(String method, String path) {
            this.method = method;
            this.path = path;
        }

        private boolean matches(String requestMethod, String requestPath) {
            return method.equalsIgnoreCase(requestMethod) && path.equals(requestPath);
        }
    }
}
