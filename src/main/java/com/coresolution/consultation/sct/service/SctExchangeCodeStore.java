package com.coresolution.consultation.sct.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * SCT 단축 링크 → 공개 SPA 교환 코드(Redis) = 공개 링크 세션.
 *
 * <p>평문 초대 토큰을 Location/로그에 넣지 않기 위해 opaque 교환 코드를 발급한다.
 * 수명 규칙(시계 주입, Redis TTL 에 의존하지 않음):</p>
 * <ul>
 *   <li>발급 → 첫 사용: 착지 창 {@link SctConstants#SHORT_LINK_EXCHANGE_TTL_MINUTES}</li>
 *   <li>첫 사용 뒤: 작성 중 시간 제한 없음 — 초대 {@code tokenExpiresAt} 까지 유지
 *       (제출·취소·만료·재발급은 resolver 가 초대 상태·tokenHash 바인딩으로 거부)</li>
 * </ul>
 * <p>Redis 키는 절대 상한까지 남겨 「만료」와 「없음」을 구분한다. 본인확인(OTP) 상태는
 * 이 저장소와 무관하게 {@link SctVerifySessionStore} 가 그대로 판정한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Slf4j
@Service
public class SctExchangeCodeStore {

    private static final String REDIS_KEY_PREFIX = "sct:short-exchange:";
    private static final int EXCHANGE_BYTES = 24;
    /** 로그용 SHA-256 hex 접두 길이(원문·전체 해시 비노출). */
    private static final int LOG_REF_HEX_LENGTH = 8;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final ObjectMapper JSON = new ObjectMapper();

    private final ObjectProvider<StringRedisTemplate> redisTemplateProvider;
    private final Clock clock;
    private final long defaultTtlSeconds;

    /**
     * Spring 주입.
     *
     * @param redisTemplateProvider Redis
     */
    @Autowired
    public SctExchangeCodeStore(ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this(
                redisTemplateProvider,
                Clock.systemUTC(),
                SctConstants.SHORT_LINK_EXCHANGE_TTL_MINUTES * 60L);
    }

    /**
     * 테스트용(시스템 시계).
     *
     * @param redisTemplateProvider Redis
     * @param defaultTtlSeconds     착지 TTL 초(초대 잔여로 캡)
     */
    public SctExchangeCodeStore(
            ObjectProvider<StringRedisTemplate> redisTemplateProvider, long defaultTtlSeconds) {
        this(redisTemplateProvider, Clock.systemUTC(), defaultTtlSeconds);
    }

    /**
     * 테스트용(시계 주입).
     *
     * @param redisTemplateProvider Redis
     * @param clock                 시각
     * @param defaultTtlSeconds     착지 TTL 초
     */
    public SctExchangeCodeStore(
            ObjectProvider<StringRedisTemplate> redisTemplateProvider,
            Clock clock,
            long defaultTtlSeconds) {
        this.redisTemplateProvider = redisTemplateProvider;
        this.clock = clock == null ? Clock.systemUTC() : clock;
        this.defaultTtlSeconds = defaultTtlSeconds > 0
                ? defaultTtlSeconds
                : SctConstants.SHORT_LINK_EXCHANGE_TTL_MINUTES * 60L;
    }

    /**
     * 교환 코드 발급. 착지 창 = min(기본 착지 TTL, absoluteExpiresAt 잔여).
     *
     * @param invitationId      초대
     * @param tenantId          테넌트
     * @param landingStatus     null이면 초대 status 사용. REISSUED 등 오버라이드
     * @param tokenHash         발급 시점 초대 tokenHash(재발급·재발송 무효화용)
     * @param absoluteExpiresAt 초대 tokenExpiresAt(절대 상한). null/과거면 거부
     * @return opaque 교환 코드
     */
    public String issue(
            Long invitationId,
            String tenantId,
            String landingStatus,
            String tokenHash,
            Instant absoluteExpiresAt) {
        if (invitationId == null || !StringUtils.hasText(tenantId) || !StringUtils.hasText(tokenHash)) {
            throw new IllegalArgumentException(
                    "exchange issue requires invitationId, tenantId and tokenHash");
        }
        if (absoluteExpiresAt == null) {
            throw new IllegalArgumentException("exchange issue requires absoluteExpiresAt");
        }
        Instant now = clock.instant();
        if (!absoluteExpiresAt.isAfter(now)) {
            throw new IllegalArgumentException("exchange absolute expiry already passed");
        }
        long landingSeconds = computeTtlSeconds(now, absoluteExpiresAt);
        StringRedisTemplate redis = requireRedis("issue");
        String code = generateOpaqueCode();
        String key = storageKey(code);
        StoredEntry stored = new StoredEntry(
                invitationId,
                tenantId.trim(),
                StringUtils.hasText(landingStatus) ? landingStatus.trim() : null,
                false,
                tokenHash.trim(),
                now.plusSeconds(landingSeconds).toEpochMilli(),
                absoluteExpiresAt.toEpochMilli());
        try {
            write(redis, key, stored, now);
            log.debug("SCT short-link exchange issued: invitationId={} landingSec={}",
                    invitationId, landingSeconds);
            return code;
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.warn("SCT short-link exchange Redis issue 실패(fail-closed): {}", e.getMessage());
            throw new IllegalStateException("단축 링크 교환 코드를 발급할 수 없습니다.", e);
        }
    }

    /**
     * 교환 코드 해석. 첫 사용 시 사용 가능 마감을 초대 절대 만료로 연장(작성 중 시간 제한 없음).
     * 착지 창 밖(첫 사용 전 만료)·절대 만료·없음은 empty.
     *
     * @param exchangeCode opaque 코드
     * @return 엔트리(used=true)
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
            StoredEntry stored = parseEntry(redis.opsForValue().get(key));
            if (stored == null) {
                return Optional.empty();
            }
            Instant now = clock.instant();
            if (stored.isLegacy()) {
                return Optional.of(resolveLegacy(redis, key, stored));
            }
            if (isOutsideWindow(stored, now)) {
                return Optional.empty();
            }
            if (stored.used()) {
                return Optional.of(stored.toExchangeEntry());
            }
            StoredEntry opened = stored.openUntilAbsolute();
            write(redis, key, opened, now);
            return Optional.of(opened.toExchangeEntry());
        } catch (Exception e) {
            log.warn("SCT short-link exchange resolve 실패(fail-closed): {}", e.getClass().getSimpleName());
            return Optional.empty();
        }
    }

    /**
     * 발급됐지만 사용 가능 창(첫 사용 전 착지 창·초대 절대 만료)이 지난 코드인지. 없음/Redis 장애는 false.
     *
     * @param exchangeCode opaque 코드
     * @return 만료 여부
     */
    public boolean isExpired(String exchangeCode) {
        if (!StringUtils.hasText(exchangeCode)) {
            return false;
        }
        StringRedisTemplate redis = redisTemplateProvider.getIfAvailable();
        if (redis == null) {
            return false;
        }
        try {
            StoredEntry stored = parseEntry(redis.opsForValue().get(storageKey(exchangeCode.trim())));
            if (stored == null || stored.isLegacy()) {
                return false;
            }
            return isOutsideWindow(stored, clock.instant());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 착지 TTL = min(기본 착지 TTL, 초대 잔여 초).
     *
     * @param now               현재
     * @param absoluteExpiresAt 초대 절대 만료
     * @return TTL 초(≥1)
     */
    public long computeTtlSeconds(Instant now, Instant absoluteExpiresAt) {
        long remaining = Duration.between(now, absoluteExpiresAt).getSeconds();
        long capped = Math.min(defaultTtlSeconds, remaining);
        if (capped < 1L) {
            throw new IllegalArgumentException("exchange TTL would be empty");
        }
        return capped;
    }

    /**
     * 로그용 참조 — SHA-256 hex 앞 8자. 토큰·코드 원문은 절대 로그에 쓰지 않는다.
     *
     * @param raw 토큰 또는 교환 코드
     * @return 해시 접두(빈 값이면 "-")
     */
    public static String logRef(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "-";
        }
        return sha256Hex(raw.trim()).substring(0, LOG_REF_HEX_LENGTH);
    }

    private static boolean isOutsideWindow(StoredEntry stored, Instant now) {
        return !now.isBefore(Instant.ofEpochMilli(stored.activeUntilEpochMs()))
                || !now.isBefore(Instant.ofEpochMilli(stored.absoluteExpiresAtEpochMs()));
    }

    /**
     * 배포 전 발급분(시각 필드 없음) — 기존 Redis TTL 그대로, used 만 기록.
     */
    private ExchangeEntry resolveLegacy(StringRedisTemplate redis, String key, StoredEntry stored)
            throws Exception {
        if (!stored.used()) {
            StoredEntry marked = stored.markUsed();
            Long ttl = redis.getExpire(key, TimeUnit.SECONDS);
            long keep = ttl != null && ttl > 0 ? ttl : defaultTtlSeconds;
            redis.opsForValue().set(key, JSON.writeValueAsString(marked), keep, TimeUnit.SECONDS);
            return marked.toExchangeEntry();
        }
        return stored.toExchangeEntry();
    }

    /** Redis 보존 = 절대 상한까지(만료/없음 구분). */
    private static void write(StringRedisTemplate redis, String key, StoredEntry stored, Instant now)
            throws Exception {
        long keepSeconds = Duration.between(
                now, Instant.ofEpochMilli(stored.absoluteExpiresAtEpochMs())).getSeconds();
        if (keepSeconds < 1L) {
            throw new IllegalArgumentException("exchange retention would be empty");
        }
        redis.opsForValue().set(key, JSON.writeValueAsString(stored), keepSeconds, TimeUnit.SECONDS);
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

    private static StoredEntry parseEntry(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            StoredEntry entry = JSON.readValue(raw, StoredEntry.class);
            if (entry == null
                    || entry.invitationId() == null
                    || !StringUtils.hasText(entry.tenantId())
                    || !StringUtils.hasText(entry.tokenHash())) {
                return null;
            }
            return entry;
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * 해석 결과 — PII 금지.
     *
     * @param invitationId  초대
     * @param tenantId      테넌트
     * @param landingStatus 상태 오버라이드(REISSUED 등) 또는 null
     * @param used          최초 resolve 여부
     * @param tokenHash     발급 시점 초대 tokenHash
     */
    public record ExchangeEntry(
            Long invitationId,
            String tenantId,
            String landingStatus,
            boolean used,
            String tokenHash) {
    }

    /**
     * Redis JSON — PII 금지. 시각 필드 0 = 배포 전 발급분(legacy).
     *
     * @param invitationId             초대
     * @param tenantId                 테넌트
     * @param landingStatus            상태 오버라이드
     * @param used                     최초 resolve 여부
     * @param tokenHash                발급 시점 초대 tokenHash
     * @param activeUntilEpochMs       사용 가능 마감(첫 사용 전 착지 창, 사용 후 = 절대 만료)
     * @param absoluteExpiresAtEpochMs 절대 상한(초대 tokenExpiresAt)
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record StoredEntry(
            Long invitationId,
            String tenantId,
            String landingStatus,
            boolean used,
            String tokenHash,
            long activeUntilEpochMs,
            long absoluteExpiresAtEpochMs) {

        boolean isLegacy() {
            return activeUntilEpochMs <= 0L || absoluteExpiresAtEpochMs <= 0L;
        }

        StoredEntry openUntilAbsolute() {
            return new StoredEntry(invitationId, tenantId, landingStatus, true, tokenHash,
                    absoluteExpiresAtEpochMs, absoluteExpiresAtEpochMs);
        }

        StoredEntry markUsed() {
            return new StoredEntry(invitationId, tenantId, landingStatus, true, tokenHash,
                    activeUntilEpochMs, absoluteExpiresAtEpochMs);
        }

        ExchangeEntry toExchangeEntry() {
            return new ExchangeEntry(invitationId, tenantId, landingStatus, used, tokenHash);
        }
    }
}
