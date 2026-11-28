package com.coresolution.consultation.sct.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
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
 * SCT 공개 verify 세션(단말 세션) — Redis 전용(fail-closed).
 *
 * <p>키: {@code sct:verify-session:} + SHA-256(sessionId). 값: invitationId·tenantId JSON(PII 없음).
 * 본인확인(OTP) 성공 시 1회 발급되며 유휴(idle) 만료가 없다. 수명은 초대 {@code tokenExpiresAt}
 * (절대 만료)까지다. 취소·재발급·제출완료는 초대/토큰 해석 단계에서 거부된다.
 * 같은 단말 재진입은 이 세션 ID 를 담은 HttpOnly 쿠키로만 이어진다
 * ({@link SctDeviceSessionCookieSupport}).</p>
 *
 * <p>ConcurrentHashMap 폴백 없음. Redis 부재·장애 시 issue 는 실패, validate 는 empty.</p>
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Slf4j
@Service
public class SctVerifySessionStore {

    private static final String REDIS_KEY_PREFIX = "sct:verify-session:";
    private static final ObjectMapper JSON = new ObjectMapper();

    private final ObjectProvider<StringRedisTemplate> redisTemplateProvider;
    private final Clock clock;

    /**
     * Spring 주입.
     *
     * @param redisTemplateProvider Redis (필수; 없으면 issue fail-closed)
     */
    @Autowired
    public SctVerifySessionStore(ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this(redisTemplateProvider, Clock.systemUTC());
    }

    /**
     * 단위 테스트용.
     *
     * @param redisTemplateProvider Redis
     * @param clock                 시각
     */
    public SctVerifySessionStore(
            ObjectProvider<StringRedisTemplate> redisTemplateProvider,
            Clock clock) {
        this.redisTemplateProvider = redisTemplateProvider;
        this.clock = clock == null ? Clock.systemUTC() : clock;
    }

    /**
     * 절대 만료까지 남은 초(응답 {@code expiresInSeconds}·쿠키 Max-Age 용). 최소 1.
     *
     * @param absoluteExpiresAt 절대 만료
     * @return 남은 초
     */
    public int remainingSeconds(Instant absoluteExpiresAt) {
        if (absoluteExpiresAt == null) {
            return 1;
        }
        long seconds = Duration.between(clock.instant(), absoluteExpiresAt).getSeconds();
        return (int) Math.max(1L, Math.min(seconds, Integer.MAX_VALUE));
    }

    /**
     * verify 세션 발급.
     *
     * @param invitationId      초대 ID
     * @param tenantId          테넌트
     * @param absoluteExpiresAt 절대 만료(초대 tokenExpiresAt). null/과거면 거부
     * @return session id
     */
    public String issue(Long invitationId, String tenantId, Instant absoluteExpiresAt) {
        if (invitationId == null || !StringUtils.hasText(tenantId) || absoluteExpiresAt == null) {
            throw new IllegalArgumentException(
                    "verify session issue requires invitationId, tenantId, absoluteExpiresAt");
        }
        Instant now = clock.instant();
        if (!absoluteExpiresAt.isAfter(now)) {
            throw new IllegalArgumentException("verify session absolute expiry already passed");
        }
        StringRedisTemplate redis = requireRedis("issue");
        String id = UUID.randomUUID().toString().replace("-", "");
        String key = storageKey(id);
        long ttlSeconds = computeTtlSeconds(now, absoluteExpiresAt);
        SessionEntry entry = new SessionEntry(
                invitationId,
                tenantId.trim(),
                absoluteExpiresAt.toEpochMilli());
        try {
            String json = JSON.writeValueAsString(entry);
            redis.opsForValue().set(key, json, ttlSeconds, TimeUnit.SECONDS);
            log.debug("SCT verify session issued: invitationId={}, ttlSec={}", invitationId, ttlSeconds);
            return id;
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.warn("SCT verify session Redis issue 실패(fail-closed): {}", e.getMessage());
            throw new IllegalStateException("본인 확인 세션을 발급할 수 없습니다.", e);
        }
    }

    /**
     * 세션 검증. 유휴 만료·TTL 연장 없음 — 절대 만료(초대 tokenExpiresAt)까지 유효.
     *
     * @param sessionId         세션
     * @param invitationId      초대
     * @param absoluteExpiresAt 절대 만료(초대 tokenExpiresAt)
     * @return 테넌트 ID
     */
    public Optional<String> validate(String sessionId, Long invitationId, Instant absoluteExpiresAt) {
        if (!StringUtils.hasText(sessionId) || invitationId == null || absoluteExpiresAt == null) {
            return Optional.empty();
        }
        StringRedisTemplate redis = redisTemplateProvider.getIfAvailable();
        if (redis == null) {
            log.warn("SCT verify session validate — Redis 없음(fail-closed)");
            return Optional.empty();
        }
        Instant now = clock.instant();
        if (!absoluteExpiresAt.isAfter(now)) {
            return Optional.empty();
        }
        String key = storageKey(sessionId.trim());
        try {
            String raw = redis.opsForValue().get(key);
            SessionEntry entry = parseEntry(raw);
            if (entry == null) {
                return Optional.empty();
            }
            if (!invitationId.equals(entry.invitationId())) {
                return Optional.empty();
            }
            Instant storedAbsolute = Instant.ofEpochMilli(entry.absoluteExpiresAtEpochMs());
            Instant effectiveAbsolute = storedAbsolute.isBefore(absoluteExpiresAt)
                    ? storedAbsolute
                    : absoluteExpiresAt;
            if (!effectiveAbsolute.isAfter(now)) {
                redis.delete(key);
                return Optional.empty();
            }
            return Optional.of(entry.tenantId());
        } catch (Exception e) {
            log.warn("SCT verify session Redis validate 실패(fail-closed): {}", e.getMessage());
            return Optional.empty();
        }
    }

    private StringRedisTemplate requireRedis(String action) {
        StringRedisTemplate redis = redisTemplateProvider.getIfAvailable();
        if (redis == null) {
            log.error("SCT verify session {} — Redis 없음(fail-closed)", action);
            throw new IllegalStateException("본인 확인 세션 저장소를 사용할 수 없습니다.");
        }
        return redis;
    }

    private long computeTtlSeconds(Instant now, Instant absoluteExpiresAt) {
        long seconds = Duration.between(now, absoluteExpiresAt).getSeconds();
        if (seconds < 1L) {
            throw new IllegalArgumentException("verify session TTL would be empty");
        }
        return seconds;
    }

    static String storageKey(String rawSessionId) {
        return REDIS_KEY_PREFIX + sha256Hex(rawSessionId);
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

    private static SessionEntry parseEntry(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            SessionEntry entry = JSON.readValue(raw, SessionEntry.class);
            if (entry == null
                    || entry.invitationId() == null
                    || !StringUtils.hasText(entry.tenantId())
                    || entry.absoluteExpiresAtEpochMs() <= 0L) {
                return null;
            }
            return entry;
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * Redis JSON 엔트리 — phone/email 등 PII 절대 금지.
     *
     * @param invitationId             초대
     * @param tenantId                 테넌트
     * @param absoluteExpiresAtEpochMs 절대 만료 epoch ms
     */
    public record SessionEntry(
            Long invitationId,
            String tenantId,
            long absoluteExpiresAtEpochMs) {
    }
}
