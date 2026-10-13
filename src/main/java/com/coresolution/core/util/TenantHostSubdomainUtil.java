package com.coresolution.core.util;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Host / X-Forwarded-Host 에서 테넌트 서브도메인 라벨을 추출한다.
 * {@code TenantContextFilter.extractTenantSubdomain} · {@code OAuth2DomainUtil} 과 동일 suffix·예약 라벨 규칙.
 *
 * <p>DEV Cloudflare 프록시 별칭 등 {@code TENANT_HOST_ALIASES}({@code host:subdomain[,...]}) 는
 * suffix 파싱보다 먼저 적용한다. {@code @Profile("dev")} {@code TenantHostAliasesInitializer} 가 {@link #configureHostAliases(String)} 로만 주입한다.
 * 환경변수·시스템 프로퍼티는 자동으로 읽지 않는다(운영 프로필에서는 항상 꺼짐).</p>
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

    /** hostname(소문자, 포트 없음) → 테넌트 라벨. dev Initializer 만 설정. 기본 비어 있음. */
    private static volatile Map<String, String> hostAliases = Collections.emptyMap();

    static {
        Set<String> labels = new HashSet<>();
        Collections.addAll(labels, "dev", "app", "api", "staging", "www", "admin", "ops", "apply");
        NON_TENANT_SUBDOMAIN_LABELS = Collections.unmodifiableSet(labels);
    }

    private TenantHostSubdomainUtil() {
    }

    /**
     * {@code host:subdomain[,host:subdomain...]} 형식의 별칭을 설정한다.
     * null/blank 이면 별칭을 비운다 (운영·미설정 동작).
     *
     * @param raw 별칭 설정 문자열
     */
    public static void configureHostAliases(String raw) {
        hostAliases = Collections.unmodifiableMap(parseHostAliases(raw));
    }

    /**
     * 별칭 설정 문자열을 맵으로 파싱한다.
     *
     * @param raw {@code host:subdomain[,...]} 또는 null/blank
     * @return hostname → tenant label (소문자). 불변이 아닐 수 있음(호출측에서 wrap)
     */
    public static Map<String, String> parseHostAliases(String raw) {
        Map<String, String> map = new HashMap<>();
        if (raw == null || raw.isBlank()) {
            return map;
        }
        for (String part : raw.split(",")) {
            if (part == null) {
                continue;
            }
            String entry = part.trim();
            if (entry.isEmpty()) {
                continue;
            }
            int colon = entry.indexOf(':');
            if (colon <= 0 || colon >= entry.length() - 1) {
                continue;
            }
            String host = entry.substring(0, colon).trim().toLowerCase(Locale.ROOT);
            String label = entry.substring(colon + 1).trim().toLowerCase(Locale.ROOT);
            if (host.isEmpty() || label.isEmpty() || label.contains(".")) {
                continue;
            }
            map.put(host, label);
        }
        return map;
    }

    /**
     * 호스트가 설정된 별칭인지 여부.
     *
     * @param host Host 또는 hostname (포트·콤마 허용)
     * @return 별칭이면 true
     */
    public static boolean isConfiguredAliasHost(String host) {
        return resolveConfiguredAliasLabel(host) != null;
    }

    /**
     * 별칭 호스트에 매핑된 테넌트 라벨을 반환한다 (suffix 파싱 없음).
     *
     * @param host Host 또는 hostname (포트·콤마 허용)
     * @return 테넌트 라벨 또는 null
     */
    public static String resolveConfiguredAliasLabel(String host) {
        String hostWithoutPort = normalizeHostWithoutPort(host);
        if (hostWithoutPort == null) {
            return null;
        }
        return hostAliases.get(hostWithoutPort);
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
     * 별칭({@code TENANT_HOST_ALIASES})이 있으면 suffix 파싱보다 먼저 적용한다.
     *
     * @param host Host 또는 X-Forwarded-Host (포트·콤마 허용)
     * @return 테넌트 라벨 또는 null
     */
    public static String extractTenantSubdomain(String host) {
        if (host == null || host.isBlank() || isNginxRegexServerName(host)) {
            return null;
        }
        String hostWithoutPort = normalizeHostWithoutPort(host);
        if (hostWithoutPort == null || isNginxRegexServerName(hostWithoutPort)) {
            return null;
        }

        String aliasLabel = hostAliases.get(hostWithoutPort);
        if (aliasLabel != null && !aliasLabel.isBlank()) {
            return aliasLabel;
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

    private static String normalizeHostWithoutPort(String host) {
        if (host == null || host.isBlank() || isNginxRegexServerName(host)) {
            return null;
        }
        String hostWithoutPort = host.split(",")[0].trim().split(":")[0].trim().toLowerCase(Locale.ROOT);
        if (hostWithoutPort.isEmpty()) {
            return null;
        }
        return hostWithoutPort;
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
