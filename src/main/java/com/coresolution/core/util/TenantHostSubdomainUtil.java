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
     * X-Forwarded-Host 우선, 없으면 Host.
     *
     * @param request HTTP 요청
     * @return 테넌트 라벨 또는 null (apex·예약·비매칭)
     */
    public static String extractTenantSubdomain(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String host = firstForwardedOrHost(request);
        return extractTenantSubdomain(host);
    }

    /**
     * Host 값에서 테넌트 서브도메인 라벨을 추출한다.
     *
     * @param host Host 또는 X-Forwarded-Host (포트·콤마 허용)
     * @return 테넌트 라벨 또는 null
     */
    public static String extractTenantSubdomain(String host) {
        if (host == null || host.isBlank()) {
            return null;
        }
        String hostWithoutPort = host.split(",")[0].trim().split(":")[0].trim().toLowerCase(Locale.ROOT);
        if (hostWithoutPort.isEmpty()) {
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

    private static String firstForwardedOrHost(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-Host");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded;
        }
        return request.getHeader("Host");
    }
}
