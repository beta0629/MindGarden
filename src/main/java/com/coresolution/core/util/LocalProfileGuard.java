package com.coresolution.core.util;

import org.springframework.core.env.Environment;

/**
 * 로컬 프로파일 SSOT 가드.
 *
 * <p>{@code spring.profiles.active=local} 만 true. 공유 .dev({@code dev})·운영은
 * Host/서브도메인·X-Forwarded-Host 기반 테넌트 해석만 사용한다.
 * {@code LOCAL_DEFAULT_TENANT_ID} 폴백은 이 가드가 true일 때만 허용한다.</p>
 *
 * <p>컨트롤러/필터에 {@code "local" || "dev"} 복제 금지 — 본 유틸만 사용.</p>
 *
 * @author CoreSolution
 * @since 2026-09-04
 */
public final class LocalProfileGuard {

    private LocalProfileGuard() {
    }

    /**
     * @param environment Spring Environment (null이면 false)
     * @return active profiles에 {@code local}이 있으면 true
     */
    public static boolean isTrueLocalProfile(Environment environment) {
        if (environment == null) {
            return false;
        }
        for (String profile : environment.getActiveProfiles()) {
            if ("local".equals(profile)) {
                return true;
            }
        }
        return false;
    }
}
