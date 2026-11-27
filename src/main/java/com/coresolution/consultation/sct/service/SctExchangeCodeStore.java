package com.coresolution.consultation.sct.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * SCT 단축 링크 → 공개 SPA 일회성 교환 코드(Redis).
 *
 * <p>평문 초대 토큰을 Location/로그에 넣지 않기 위해 opaque 교환 코드를 발급한다.
 * TTL 내 SPA meta/verify 등 복수 API 호출을 허용하며, 최초 resolve 시 used 플래그만 기록한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Slf4j
@Service
public class SctExchangeCodeStore {

    private static final String REDIS_KEY_PREFIX = "sct:short-exchange:";
    private static final int EXCHANGE_BYTES = 24;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final ObjectMapper JSON = new ObjectMapper();

    private final ObjectProvider<StringRedisTemplate> redisTemplateProvider;
    private final long ttlSeconds;

    /**
     * Spring 주입.
     *
     * @param redisTemplateProvider Redis
     */
    @Autowired
    public SctExchangeCodeStore(ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this(redisTemplateProvider, SctConstants.SHORT_LINK_EXCHANGE_TTL_MINUTES * 60L);
    }

    /**
     * 테스트용.
     *
     * @param redisTemplateProvider Redis
     * @param ttlSeconds            TTL 초
     */
    public SctExchangeCodeStore(
            ObjectProvider<StringRedisTemplate> redisTemplateProvider, long ttlSeconds) {
        this.redisTemplateProvider = redisTemplateProvider;
        this.ttlSeconds = ttlSeconds > 0
                ? ttlSeconds
                : SctConstants.SHORT_LINK_EXCHANGE_TTL_MINUTES * 60L;
    }

    /**
     * 교환 코드 발급.
     *
     * @param invitationId   초대
     * @param tenantId       테넌트
     * @param landingStatus  null이면 초대 status 사용. REISSUED 등 오버라이드
     * @return opaque 교환 코드
     */
    public String issue(Long invitationId, String tenantId, String landingStatus) {
        if (invitationId == null || !StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("exchange issue requires invitationId and tenantId");
        }
        StringRedisTemplate redis = requireRedis("issue");
        String code = generateOpaqueCode();
        String key = storageKey(code);
        ExchangeEntry entry = new ExchangeEntry(
                invitationId,
                tenantId.trim(),
                StringUtils.hasText(landingStatus) ? landingStatus.trim() : null,
                false);
        try {
            String json = JSON.writeValueAsString(entry);
            redis.opsForValue().set(key, json, ttlSeconds, TimeUnit.SECONDS);
            log.debug("SCT short-link exchange issued: invitationId={} ttlSec={}",
                    invitationId, ttlSeconds);
            return code;
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.warn("SCT short-link exchange Redis issue 실패(fail-closed): {}", e.getMessage());
            throw new IllegalStateException("단축 링크 교환 코드를 발급할 수 없습니다.", e);
        }
    }

    /**
     * 교환 코드 해석. TTL 내 재조회 허용. 최초 성공 시 used=true 마킹.
     *
     * @param exchangeCode opaque 코드
     * @return 엔트리
     */
    public Optional<ExchangeEntry> resolve(String exchangeCode) {
        if (!StringUtils.hasText(exchangeCode)) {
            return Optional.empty();
        }
        StringRedisTemplate redis = redisTemplateProvider.getIfAvailable();
        if (redis == null) {
            log.warn("SCT short-link exchange resolve — Redis 없음(fail-closed)");
            return Optional.empty();
        }
        String key = storageKey(exchangeCode.trim());
        try {
            String raw = redis.opsForValue().get(key);
            ExchangeEntry entry = parseEntry(raw);
            if (entry == null) {
                return Optional.empty();
            }
            if (!entry.used()) {
                ExchangeEntry marked = new ExchangeEntry(
                        entry.invitationId(),
                        entry.tenantId(),
                        entry.landingStatus(),
                        true);
                Long ttl = redis.getExpire(key, TimeUnit.SECONDS);
                String json = JSON.writeValueAsString(marked);
                if (ttl != null && ttl > 0) {
                    redis.opsForValue().set(key, json, ttl, TimeUnit.SECONDS);
                } else {
                    redis.opsForValue().set(key, json, ttlSeconds, TimeUnit.SECONDS);
                }
                return Optional.of(marked);
            }
            return Optional.of(entry);
        } catch (Exception e) {
            log.warn("SCT short-link exchange resolve 실패(fail-closed): {}", e.getMessage());
            return Optional.empty();
        }
    }

    private StringRedisTemplate requireRedis(String action) {
        StringRedisTemplate redis = redisTemplateProvider.getIfAvailable();
        if (redis == null) {
            log.error("SCT short-link exchange {} — Redis 없음(fail-closed)", action);
            throw new IllegalStateException("단축 링크 교환 저장소를 사용할 수 없습니다.");
        }
        return redis;
    }

    static String storageKey(String rawCode) {
        return REDIS_KEY_PREFIX + sha256Hex(rawCode);
    }

    private static String generateOpaqueCode() {
        byte[] bytes = new byte[EXCHANGE_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance(SctConstants.HASH_ALGORITHM);
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 미지원 — JRE 비정상", e);
        }
    }

    private static ExchangeEntry parseEntry(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            ExchangeEntry entry = JSON.readValue(raw, ExchangeEntry.class);
            if (entry == null
                    || entry.invitationId() == null
                    || !StringUtils.hasText(entry.tenantId())) {
                return null;
            }
            return entry;
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * Redis JSON — PII 금지.
     *
     * @param invitationId  초대
     * @param tenantId      테넌트
     * @param landingStatus 상태 오버라이드(REISSUED 등) 또는 null
     * @param used          최초 resolve 여부
     */
    public record ExchangeEntry(
            Long invitationId,
            String tenantId,
            String landingStatus,
            boolean used) {
    }
}
