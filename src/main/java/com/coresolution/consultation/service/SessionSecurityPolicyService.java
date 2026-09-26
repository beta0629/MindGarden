package com.coresolution.consultation.service;

import java.util.concurrent.ConcurrentHashMap;
import com.coresolution.consultation.constant.SessionSecurityFlagKeys;
import com.coresolution.consultation.dto.response.SessionSecurityFlagsResponse;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 세션 보안 플래그 조회·캐시 (재시작 없이 system_config 토글 반영).
 *
 * <p>우선순위: 테넌트 행 → 전역({@code tenant_id=''}) → DEFAULT 상수.
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionSecurityPolicyService {

    private static final java.util.Set<String> TRUTHY =
            java.util.Set.of("true", "1", "yes", "y", "on");

    private final SystemConfigRepository systemConfigRepository;

    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    /**
     * 테넌트(또는 전역) 세션 보안 플래그 스냅샷.
     *
     * @param tenantId 테넌트 ID (null/blank 이면 전역·DEFAULT 만)
     * @return 플래그 응답
     */
    @Transactional(readOnly = true)
    public SessionSecurityFlagsResponse resolveFlags(String tenantId) {
        String cacheKey = tenantId == null || tenantId.isBlank() ? "" : tenantId.trim();
        long now = System.currentTimeMillis();
        CacheEntry hit = cache.get(cacheKey);
        if (hit != null && now - hit.loadedAtMs < SessionSecurityFlagKeys.CACHE_TTL_MS) {
            return hit.flags;
        }
        SessionSecurityFlagsResponse flags = SessionSecurityFlagsResponse.builder()
                .oauthRequireServerVerify(resolveBoolean(
                        cacheKey,
                        SessionSecurityFlagKeys.OAUTH_REQUIRE_SERVER_VERIFY,
                        SessionSecurityFlagKeys.DEFAULT_OAUTH_REQUIRE_SERVER_VERIFY))
                .background401KeepUser(resolveBoolean(
                        cacheKey,
                        SessionSecurityFlagKeys.BACKGROUND_401_KEEP_USER,
                        SessionSecurityFlagKeys.DEFAULT_BACKGROUND_401_KEEP_USER))
                .softFailEnabled(resolveBoolean(
                        cacheKey,
                        SessionSecurityFlagKeys.SOFT_FAIL_ENABLED,
                        SessionSecurityFlagKeys.DEFAULT_SOFT_FAIL_ENABLED))
                .cacheTtlMs(SessionSecurityFlagKeys.CACHE_TTL_MS)
                .build();
        cache.put(cacheKey, new CacheEntry(now, flags));
        return flags;
    }

    /**
     * 어드민 저장 후 캐시 무효화 (즉시 반영).
     *
     * @param tenantId 테넌트 ID (null 이면 전체 클리어)
     */
    public void invalidateCache(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            cache.clear();
            return;
        }
        cache.remove(tenantId.trim());
        cache.remove("");
    }

    /**
     * 세션 보안 관련 키인지 여부.
     *
     * @param configKey 설정 키
     * @return 세션 보안 키이면 true
     */
    public boolean isSessionSecurityConfigKey(String configKey) {
        if (configKey == null || configKey.isBlank()) {
            return false;
        }
        return SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED.equals(configKey)
                || SessionSecurityFlagKeys.OAUTH_REQUIRE_SERVER_VERIFY.equals(configKey)
                || SessionSecurityFlagKeys.BACKGROUND_401_KEEP_USER.equals(configKey)
                || SessionSecurityFlagKeys.SOFT_FAIL_ENABLED.equals(configKey);
    }

    private boolean resolveBoolean(String tenantId, String configKey, boolean defaultValue) {
        try {
            if (tenantId != null && !tenantId.isBlank()) {
                var tenantRow = systemConfigRepository
                        .findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, configKey);
                if (tenantRow.isPresent()) {
                    return parseTruthy(tenantRow.get().getConfigValue(), defaultValue);
                }
            }
            var globalRow = systemConfigRepository.findGlobalByConfigKey(configKey);
            if (globalRow.isPresent()) {
                SystemConfig cfg = globalRow.get();
                if (Boolean.TRUE.equals(cfg.getIsActive())) {
                    return parseTruthy(cfg.getConfigValue(), defaultValue);
                }
            }
            return defaultValue;
        } catch (Exception e) {
            log.warn("세션 보안 플래그 조회 실패 — 기본값 사용: tenantId={}, key={}, default={}, error={}",
                    tenantId, configKey, defaultValue, e.getMessage());
            return defaultValue;
        }
    }

    private static boolean parseTruthy(String raw, boolean defaultValue) {
        if (raw == null || raw.isBlank()) {
            return defaultValue;
        }
        return TRUTHY.contains(raw.trim().toLowerCase());
    }

    private static final class CacheEntry {
        private final long loadedAtMs;
        private final SessionSecurityFlagsResponse flags;

        private CacheEntry(long loadedAtMs, SessionSecurityFlagsResponse flags) {
            this.loadedAtMs = loadedAtMs;
            this.flags = flags;
        }
    }
}
