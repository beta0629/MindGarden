package com.coresolution.consultation.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * 웹 OAuth JWT 1회 교환용 opaque 코드 저장소.
 *
 * <p>쿠키 Domain 불일치로 HttpSession 이 비어도 SPA 가 JWT 를 수령할 수 있게 한다.
 * 코드만 쿼리에 넣고 <strong>장기 JWT 는 절대 넣지 않는다</strong>. 단일 사용·짧은 TTL.</p>
 *
 * <p>Redis 빈이 있으면 Redis, 없으면 프로세스 메모리({@link ConcurrentHashMap}).</p>
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@Slf4j
@Service
public class OAuthWebSessionExchangeCodeService {

    private static final String REDIS_KEY_PREFIX = "oauth:web-session-exchange:";
    private static final int CODE_BYTES = 32;

    private final ObjectProvider<RedisTemplate<String, Object>> redisTemplateProvider;
    private final SecureRandom secureRandom = new SecureRandom();
    private final ConcurrentHashMap<String, StashEntry> localStore = new ConcurrentHashMap<>();

    private final boolean enabled;
    private final long ttlSeconds;

    /**
     * @param redisTemplateProvider Redis (없을 수 있음)
     * @param enabled               {@code OAUTH_WEB_SESSION_EXCHANGE_CODE_ENABLED}
     * @param ttlSeconds            {@code OAUTH_WEB_SESSION_EXCHANGE_CODE_TTL_SECONDS}
     */
    public OAuthWebSessionExchangeCodeService(
            ObjectProvider<RedisTemplate<String, Object>> redisTemplateProvider,
            @Value("${OAUTH_WEB_SESSION_EXCHANGE_CODE_ENABLED:true}") boolean enabled,
            @Value("${OAUTH_WEB_SESSION_EXCHANGE_CODE_TTL_SECONDS:90}") long ttlSeconds) {
        this.redisTemplateProvider = redisTemplateProvider;
        this.enabled = enabled;
        this.ttlSeconds = ttlSeconds > 0 ? ttlSeconds : 90L;
    }

    /**
     * @return 기능 활성 여부
     */
    public boolean isEnabled() {
        return enabled;
    }

    /**
     * 일회용 교환 코드를 발급·저장한다.
     *
     * @param accessToken  access JWT
     * @param refreshToken refresh JWT
     * @param userId       사용자 ID
     * @param tenantId     테넌트 ID (nullable)
     * @return opaque 코드, 비활성이면 empty
     */
    public Optional<String> issue(String accessToken, String refreshToken, Long userId, String tenantId) {
        if (!enabled) {
            return Optional.empty();
        }
        if (!StringUtils.hasText(accessToken) || !StringUtils.hasText(refreshToken) || userId == null) {
            return Optional.empty();
        }
        purgeExpiredLocalEntries();
        String code = generateCode();
        StashEntry entry = new StashEntry(
                accessToken.trim(),
                refreshToken.trim(),
                userId,
                StringUtils.hasText(tenantId) ? tenantId.trim() : null,
                Instant.now().plusSeconds(ttlSeconds));
        RedisTemplate<String, Object> redis = redisTemplateProvider.getIfAvailable();
        if (redis != null) {
            try {
                redis.opsForValue().set(REDIS_KEY_PREFIX + code, entry, ttlSeconds, TimeUnit.SECONDS);
                log.info("웹 OAuth 교환 코드 발급(Redis): userId={}, ttlSec={}", userId, ttlSeconds);
                return Optional.of(code);
            } catch (Exception e) {
                log.warn("웹 OAuth 교환 코드 Redis 저장 실패 — 로컬 폴백: {}", e.getMessage());
            }
        }
        localStore.put(code, entry);
        log.info("웹 OAuth 교환 코드 발급(local): userId={}, ttlSec={}", userId, ttlSeconds);
        return Optional.of(code);
    }

    /**
     * 코드를 1회 소비한다. 만료·이미 사용·없음이면 empty.
     *
     * @param code opaque 교환 코드
     * @return JWT 스태시
     */
    public Optional<StashEntry> consume(String code) {
        if (!enabled || !StringUtils.hasText(code)) {
            return Optional.empty();
        }
        String trimmed = code.trim();
        RedisTemplate<String, Object> redis = redisTemplateProvider.getIfAvailable();
        if (redis != null) {
            try {
                String key = REDIS_KEY_PREFIX + trimmed;
                Object raw = redis.opsForValue().get(key);
                redis.delete(key);
                StashEntry entry = coerceEntry(raw);
                if (entry != null && !entry.isExpired()) {
                    log.info("웹 OAuth 교환 코드 소비(Redis): userId={}", entry.userId());
                    return Optional.of(entry);
                }
            } catch (Exception e) {
                log.warn("웹 OAuth 교환 코드 Redis 소비 실패 — 로컬 시도: {}", e.getMessage());
            }
        }
        StashEntry local = localStore.remove(trimmed);
        if (local == null || local.isExpired()) {
            return Optional.empty();
        }
        log.info("웹 OAuth 교환 코드 소비(local): userId={}", local.userId());
        return Optional.of(local);
    }

    private String generateCode() {
        byte[] bytes = new byte[CODE_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void purgeExpiredLocalEntries() {
        Instant now = Instant.now();
        Iterator<Map.Entry<String, StashEntry>> it = localStore.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, StashEntry> e = it.next();
            if (e.getValue() == null || e.getValue().isExpired(now)) {
                it.remove();
            }
        }
    }

    private static StashEntry coerceEntry(Object raw) {
        if (raw instanceof StashEntry entry) {
            return entry;
        }
        if (raw instanceof Map<?, ?> map) {
            Object access = map.get("accessToken");
            Object refresh = map.get("refreshToken");
            Object userId = map.get("userId");
            Object tenantId = map.get("tenantId");
            Object expiresAt = map.get("expiresAt");
            if (!(access instanceof String) || !(refresh instanceof String) || !(userId instanceof Number)) {
                return null;
            }
            Instant exp = Instant.now().plusSeconds(60);
            if (expiresAt instanceof String s && StringUtils.hasText(s)) {
                try {
                    exp = Instant.parse(s);
                } catch (Exception ignored) {
                    // keep fallback
                }
            } else if (expiresAt instanceof Number n) {
                exp = Instant.ofEpochMilli(n.longValue());
            }
            return new StashEntry(
                    ((String) access).trim(),
                    ((String) refresh).trim(),
                    ((Number) userId).longValue(),
                    tenantId instanceof String t && StringUtils.hasText(t) ? t.trim() : null,
                    exp);
        }
        return null;
    }

    /**
     * 일회용 교환 스태시.
     *
     * @param accessToken  access JWT
     * @param refreshToken refresh JWT
     * @param userId       사용자 ID
     * @param tenantId     테넌트 (nullable)
     * @param expiresAt    만료 시각
     */
    public record StashEntry(
            String accessToken,
            String refreshToken,
            Long userId,
            String tenantId,
            Instant expiresAt) {

        boolean isExpired() {
            return isExpired(Instant.now());
        }

        boolean isExpired(Instant now) {
            return expiresAt == null || !expiresAt.isAfter(now);
        }
    }
}
