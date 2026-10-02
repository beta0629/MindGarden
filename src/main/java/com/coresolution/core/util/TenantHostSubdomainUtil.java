package com.coresolution.core.util;

import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Host / X-Forwarded-Host 에서 테넌트 서브도메인 라벨을 추출한다.
 * {@code TenantContextFilter.extractTenantSubdomain} · {@code OAuth2DomainUtil} 과 동일 suffix·예약 라벨 규칙.
 *
 * @author CoreSolution
 * @since 2026-09-10
 */
public final class TenantHostSubdomainUtil {

    /** 긴 접미사 우선 — TenantContextFilter · OAuth2DomainUtil 과 동기 */
    private static final String[] TENANT_PARENT_DOMAIN_SUFFIXES = {
            ".dev.core-solution.co.kr",
            ".staging.core-solution.co.kr",
            ".core-solution.co.kr"
    };

    /** nginx regex server_name 에만 있는 문자. 호스트 이름에는 없다. */
    private static final String NGINX_REGEX_SERVER_NAME_MARKERS = "^\\$[]()+*?|{}";

    /** 인프라·온보딩 예약 라벨 (테넌트 아님) */
    private static final Set<String> NON_TENANT_SUBDOMAIN_LABELS;

    static {
        Set<String> labels = new HashSet<>();
        Collections.addAll(labels, "dev", "app", "api", "staging", "www", "admin", "ops", "apply");
        NON_TENANT_SUBDOMAIN_LABELS = Collections.unmodifiableSet(labels);
    }

    private TenantHostSubdomainUtil() {
    }

    /**
     * 요청에서 테넌트 서브도메인 라벨을 추출한다.
     * 쓸 수 있는 X-Forwarded-Host, Host, 서버 이름 순. nginx regex server_name 은 호스트가 아니다.
     *
     * @param request HTTP 요청
     * @return 테넌트 라벨 또는 null (apex·예약·비매칭·regex)
     */
    public static String extractTenantSubdomain(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        return extractTenantSubdomain(resolveRequestHost(request));
    }

    /**
     * canonical·테넌트에 쓸 요청 호스트.
     * nginx regex {@code server_name} 이 X-Forwarded-Host 나 서버 이름에 있으면 건너뛰고
     * 다음 실제 호스트를 쓴다.
     *
     * @param request HTTP 요청
     * @return 호스트(포트 허용) 또는 null
     */
    public static String resolveRequestHost(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String forwarded = usableHostToken(request.getHeader("X-Forwarded-Host"));
        if (forwarded != null) {
            return forwarded;
        }
        String hostHeader = usableHostToken(request.getHeader("Host"));
        if (hostHeader != null) {
            return hostHeader;
        }
        return usableHostToken(request.getServerName());
    }

    /**
     * Host 값에서 테넌트 서브도메인 라벨을 추출한다.
     *
     * @param host Host 또는 X-Forwarded-Host (포트·콤마 허용)
     * @return 테넌트 라벨 또는 null
     */
    public static String extractTenantSubdomain(String host) {
        if (host == null || host.isBlank() || isNginxRegexServerName(host)) {
            return null;
        }
        String hostWithoutPort = host.split(",")[0].trim().split(":")[0].trim().toLowerCase(Locale.ROOT);
        if (hostWithoutPort.isEmpty() || isNginxRegexServerName(hostWithoutPort)) {
            return null;
        }

        for (String suffix : TENANT_PARENT_DOMAIN_SUFFIXES) {
            if (!hostWithoutPort.endsWith(suffix)) {
                continue;
            }
            String label = hostWithoutPort.substring(0, hostWithoutPort.length() - suffix.length());
            if (label.isEmpty() || label.contains(".")) {
                return null;
            }
            if (NON_TENANT_SUBDOMAIN_LABELS.contains(label)) {
                return null;
            }
            return label;
        }
        return null;
    }

    private static String usableHostToken(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String candidate = raw.split(",")[0].trim();
        if (candidate.isEmpty() || isNginxRegexServerName(candidate)) {
            return null;
        }
        return candidate;
    }

    /**
     * nginx regex {@code server_name} 값(예: {@code ~^...$})은 요청 호스트가 아니다.
     *
     * @param candidate 헤더 또는 서버 이름 토큰
     * @return 정규식 서버 이름이면 true
     */
    static boolean isNginxRegexServerName(String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return false;
        }
        String value = candidate.split(",")[0].trim();
        if (value.startsWith("~")) {
            return true;
        }
        for (int i = 0; i < value.length(); i++) {
            if (NGINX_REGEX_SERVER_NAME_MARKERS.indexOf(value.charAt(i)) >= 0) {
                return true;
            }
        }
        return false;
    }
}
