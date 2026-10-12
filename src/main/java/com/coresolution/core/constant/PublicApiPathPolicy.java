package com.coresolution.core.constant;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import jakarta.servlet.http.HttpServletRequest;

/**
 * 비로그인 공개 API 경로 분류 SSOT. {@code TenantContextFilter} 와 {@code SecurityConfig} 가 함께 쓴다.
 *
 * <ul>
 *   <li>공개 경로: 테넌트 검증을 건너뛰는 경로 (SecurityConfig permitAll 과 정합)</li>
 *   <li>STRICT 호스트 경로: 비로그인일 때 테넌트를 Host(서브도메인)로만 해석하는 읽기 전용 공개 데이터 경로.
 *       X-Tenant-Id·X-Tenant-Subdomain 헤더는 무시한다.</li>
 *   <li>공통코드 공개 그룹: 비로그인 GET 으로 열어 두는 코드 그룹 화이트리스트</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-10-12
 */
public final class PublicApiPathPolicy {

    /** 공통코드 API 기본 경로 (표준·레거시). */
    public static final List<String> COMMON_CODE_BASES =
            List.of("/api/v1/common-codes", "/api/common-codes");

    /** 비로그인 GET 으로 허용하는 공통코드 그룹 (로그인 전 온보딩 화면). */
    public static final Set<String> PUBLIC_COMMON_CODE_GROUPS =
            Set.of("RISK_LEVEL", "ONBOARDING_STATUS");

    /** 비-API 경로는 테넌트 강제 검증에서 제외한다. */
    private static final String API_PREFIX = "/api/";
    private static final String API_ROOT = "/api";

    /** 공개 API 경로 접두어 (SecurityConfig permitAll 과 일치해야 한다). */
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/v1/mobile/app-version",
            "/api/v1/onboarding",
            "/api/v1/public/kr-public-data",
            "/api/v1/ops",
            "/api/v1/ops/plans/active",
            "/api/v1/ops/plans/code",
            "/api/v1/ops/auth",
            "/api/v1/auth",
            "/api/auth",
            "/api/v1/accounts/integration",
            "/api/v1/common-codes",
            "/api/common-codes",
            "/api/v1/business-categories",
            "/api/business-categories",
            "/api/v1/admin/css-themes",
            "/api/v1/health",
            "/api/health",
            "/api/v1/test",
            "/api/v1/payments/webhooks",
            "/api/v1/shop/catalog",
            "/api/v1/files",
            "/actuator/health",
            "/actuator/info");

    /** 비로그인일 때 Host 로만 테넌트를 해석하는 공개 데이터 경로. */
    private static final List<String> STRICT_HOST_PATHS = List.of(
            "/api/v1/shop/catalog",
            "/api/v1/files",
            "/api/v1/common-codes",
            "/api/common-codes",
            "/api/v1/admin/css-themes",
            "/api/v1/business-categories",
            "/api/business-categories");

    private static final String HTTP_GET = "GET";
    private static final String PARAM_CODE_GROUP = "codeGroup";
    private static final String PARAM_GROUPS = "groups";
    private static final String SEG_GROUPS = "groups";
    private static final String SEG_BY_GROUP = "by-group";
    private static final String SEG_BY_GROUP_VALUE = "by-group-value";
    private static final String SEG_GROUP = "group";
    private static final String SEG_CORE = "core";
    private static final String SEG_TENANT = "tenant";
    private static final String SEG_ACTIVE = "active";
    private static final String UNSAFE_PATH_CHARS = ";%\\";

    private PublicApiPathPolicy() {
    }

    /**
     * 테넌트 검증을 건너뛰는 공개 경로인지.
     *
     * @param requestUri 요청 URI (쿼리 포함 가능)
     */
    public static boolean isPublicApi(String requestUri) {
        String path = stripQuery(requestUri);
        if (!path.startsWith(API_PREFIX) && !API_ROOT.equals(path)) {
            return true;
        }
        return matchesAnyPrefix(path, PUBLIC_PATHS);
    }

    /**
     * 비로그인일 때 Host 로만 테넌트를 해석해야 하는 경로인지.
     *
     * @param requestUri 요청 URI (쿼리 포함 가능)
     */
    public static boolean isStrictHostPath(String requestUri) {
        return matchesAnyPrefix(stripQuery(requestUri), STRICT_HOST_PATHS);
    }

    /**
     * 비로그인 공개 공통코드 조회(GET)인지. 요청한 그룹이 모두 화이트리스트 안일 때만 true.
     * 그룹을 특정할 수 없는 조회(전체 목록·ID 조회·groups/list 등)는 false.
     *
     * @param request HTTP 요청
     */
    public static boolean isPublicCommonCodeRead(HttpServletRequest request) {
        if (request == null || !HTTP_GET.equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String path = stripQuery(request.getRequestURI());
        if (containsUnsafeChars(path)) {
            return false;
        }
        String base = COMMON_CODE_BASES.stream().filter(b -> path.equals(b) || path.startsWith(b + "/"))
                .findFirst().orElse(null);
        if (base == null) {
            return false;
        }
        String rest = path.substring(base.length());
        if (rest.endsWith("/")) {
            rest = rest.substring(0, rest.length() - 1);
        }
        String[] seg = rest.isEmpty() ? new String[0] : rest.substring(1).split("/", -1);
        return resolveRequestedGroups(seg, request).map(PublicApiPathPolicy::allPublicGroups).orElse(false);
    }

    private static Optional<List<String>> resolveRequestedGroups(String[] seg,
            HttpServletRequest request) {
        if (seg.length == 0) {
            return Optional.of(splitGroups(request.getParameterValues(PARAM_CODE_GROUP)));
        }
        String first = seg[0];
        if (seg.length == 1 && (SEG_GROUPS.equals(first) || SEG_ACTIVE.equals(first))) {
            return Optional.of(splitGroups(request.getParameterValues(PARAM_GROUPS)));
        }
        if (seg.length == 2 && (SEG_GROUPS.equals(first) || SEG_BY_GROUP.equals(first))) {
            return Optional.of(List.of(seg[1]));
        }
        if (seg.length == 3 && SEG_GROUP.equals(first) && SEG_ACTIVE.equals(seg[2])) {
            return Optional.of(List.of(seg[1]));
        }
        if (seg.length == 3 && SEG_BY_GROUP_VALUE.equals(first)) {
            return Optional.of(List.of(seg[1]));
        }
        if (seg.length == 3 && (SEG_CORE.equals(first) || SEG_TENANT.equals(first))
                && SEG_GROUPS.equals(seg[1])) {
            return Optional.of(List.of(seg[2]));
        }
        return Optional.empty();
    }

    private static List<String> splitGroups(String[] values) {
        if (values == null || values.length == 0) {
            return List.of();
        }
        ArrayList<String> groups = new ArrayList<>();
        for (String value : values) {
            if (value == null) {
                continue;
            }
            for (String part : value.split(",", -1)) {
                groups.add(part.trim());
            }
        }
        return groups;
    }

    private static boolean allPublicGroups(List<String> groups) {
        return !groups.isEmpty() && groups.stream().allMatch(PUBLIC_COMMON_CODE_GROUPS::contains);
    }

    private static boolean containsUnsafeChars(String path) {
        for (char c : UNSAFE_PATH_CHARS.toCharArray()) {
            if (path.indexOf(c) >= 0) {
                return true;
            }
        }
        return path.contains("..") || path.contains("//");
    }

    private static boolean matchesAnyPrefix(String path, List<String> prefixes) {
        for (String prefix : prefixes) {
            if (path.equals(prefix) || path.startsWith(prefix + "/")) {
                return true;
            }
        }
        return false;
    }

    private static String stripQuery(String requestUri) {
        if (requestUri == null) {
            return "";
        }
        int q = requestUri.indexOf('?');
        return q >= 0 ? requestUri.substring(0, q) : requestUri;
    }
}
