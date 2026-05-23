package com.coresolution.consultation.service.ai;

import com.coresolution.consultation.repository.SystemConfigRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 테넌트별 AI 프로바이더 해석 — system_config 기반 TTL 캐시.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiProviderResolver {

    private static final String CONFIG_KEY_AI_PROVIDER = "AI_DEFAULT_PROVIDER";
    private static final String DEFAULT_PROVIDER = "openai";
    private static final Duration TTL = Duration.ofSeconds(60);

    private static final Map<String, String> PROVIDER_PREFIX = Map.of(
            "openai", "OPENAI",
            "gemini", "GEMINI",
            "claude", "CLAUDE",
            "replicate", "REPLICATE"
    );

    private final SystemConfigRepository systemConfigRepository;

    private final Map<String, CachedProvider> cache = new ConcurrentHashMap<>();

    /**
     * 테넌트별 활성 AI 프로바이더를 해석한다.
     *
     * @param tenantId 테넌트 ID (필수)
     * @return 프로바이더 ID (openai | gemini | claude | replicate)
     * @throws IllegalArgumentException tenantId 가 null 또는 빈 값인 경우
     */
    public String resolveProvider(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId 는 필수입니다 (멀티테넌트 격리).");
        }
        CachedProvider cached = cache.get(tenantId);
        if (cached != null && cached.expiresAt.isAfter(Instant.now())) {
            return cached.provider;
        }
        String provider = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, CONFIG_KEY_AI_PROVIDER)
                .map(c -> c.getConfigValue())
                .filter(StringUtils::hasText)
                .map(v -> v.trim().toLowerCase())
                .filter(PROVIDER_PREFIX::containsKey)
                .orElse(DEFAULT_PROVIDER);
        cache.put(tenantId, new CachedProvider(provider, Instant.now().plus(TTL)));
        log.debug("AI provider resolved: tenantId={}, provider={}", tenantId, provider);
        return provider;
    }

    /**
     * 지정 테넌트의 프로바이더 캐시를 무효화한다.
     *
     * @param tenantId 테넌트 ID
     */
    public void invalidate(String tenantId) {
        if (tenantId != null) {
            cache.remove(tenantId);
        }
    }

    /**
     * 지정 테넌트에 프로바이더 API 키가 등록되어 있는지 확인한다.
     *
     * @param tenantId 테넌트 ID
     * @param provider 프로바이더 ID (OPENAI, GEMINI 등 — 대소문자 무관)
     * @return 키가 등록되어 있으면 true
     */
    public boolean isProviderKeyRegistered(String tenantId, String provider) {
        if (tenantId == null || tenantId.isBlank() || provider == null || provider.isBlank()) {
            return false;
        }
        String prefix = PROVIDER_PREFIX.get(provider.trim().toLowerCase());
        if (prefix == null) {
            return false;
        }
        String keyName = prefix + "_API_KEY";
        return systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, keyName)
                .map(c -> c.getConfigValue() != null && !c.getConfigValue().isBlank())
                .orElse(false);
    }

    private record CachedProvider(String provider, Instant expiresAt) {
    }
}
