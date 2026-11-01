package com.coresolution.consultation.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * 휴대폰 비밀번호 찾기용 opaque 토큰 저장소.
 *
 * <p>challengeToken·resetProofToken 을 JWT 가 아닌 랜덤 opaque 로 발급하고,
 * 서버에만 {@code kind/tenantId/otpId/expiresAt} 을 보관한다.
 * 평문 토큰·phone·phoneHash 는 저장·로그하지 않으며, 저장 키는 토큰 SHA-256 hex 다.</p>
 *
 * <p>Redis 빈이 있으면 Redis, 없거나 장애 시 {@link ConcurrentHashMap} 로컬 폴백.</p>
 *
 * @author MindGarden
 * @since 2026-11-01
 */
@Slf4j
@Service
public class PasswordResetOpaqueTokenStore {

    private static final String REDIS_KEY_PREFIX = "password-reset:opaque:";
    private static final String HASH_ALGORITHM = "SHA-256";
    private static final int TOKEN_BYTES = 32;

    /** proof 기본 TTL(분). challenge 는 {@link PhoneOtpAttempt#EXPIRY_MINUTES}. */
    public static final long DEFAULT_PROOF_TTL_MINUTES = 5L;

    private final ObjectProvider<RedisTemplate<String, Object>> redisTemplateProvider;
    private final SecureRandom secureRandom = new SecureRandom();
    private final ConcurrentHashMap<String, TokenEntry> localStore = new ConcurrentHashMap<>();

    private final long challengeTtlSeconds;
    private final long proofTtlSeconds;

    /**
     * @param redisTemplateProvider Redis (없을 수 있음)
     * @param challengeTtlSeconds   challenge TTL 초 (기본 OTP 만료와 동일)
     * @param proofTtlSeconds       proof TTL 초 (기본 5분)
     */
    public PasswordResetOpaqueTokenStore(
            ObjectProvider<RedisTemplate<String, Object>> redisTemplateProvider,
            @Value("${password-reset.opaque.challenge-ttl-seconds:180}") long challengeTtlSeconds,
            @Value("${password-reset.opaque.proof-ttl-seconds:300}") long proofTtlSeconds) {
        this.redisTemplateProvider = redisTemplateProvider;
        // 기본: challenge=PhoneOtpAttempt.EXPIRY_MINUTES(3분), proof=5분
        this.challengeTtlSeconds = challengeTtlSeconds > 0
            ? challengeTtlSeconds
            : Duration.ofMinutes(PhoneOtpAttempt.EXPIRY_MINUTES).getSeconds();
        this.proofTtlSeconds = proofTtlSeconds > 0
            ? proofTtlSeconds
            : Duration.ofMinutes(DEFAULT_PROOF_TTL_MINUTES).getSeconds();
    }

    /**
     * OTP challenge opaque 토큰을 발급·저장한다.
     *
     * @param tenantId 테넌트 ID
     * @param otpId    {@code phone_otp_attempts.id}
     * @return 클라이언트에 전달할 opaque 토큰 (JWT 형태 아님)
     */
    public String issueChallenge(String tenantId, Long otpId) {
        return issue(Kind.CHALLENGE, tenantId, otpId, challengeTtlSeconds);
    }

    /**
     * 임시 비밀번호 발송용 1회용 proof opaque 토큰을 발급·저장한다.
     *
     * @param tenantId 테넌트 ID
     * @param otpId    검증된 {@code phone_otp_attempts.id}
     * @return opaque proof 토큰
     */
    public String issueProof(String tenantId, Long otpId) {
        return issue(Kind.PROOF, tenantId, otpId, proofTtlSeconds);
    }

    /**
     * challenge 를 조회한다(삭제하지 않음). 만료·위변조·종류/테넌트 불일치면 empty.
     *
     * @param rawToken 클라이언트 제시 토큰
     * @param tenantId 현재 요청 테넌트
     * @return 저장된 엔트리
     */
    public Optional<TokenEntry> resolveChallenge(String rawToken, String tenantId) {
        return resolve(rawToken, Kind.CHALLENGE, tenantId, false);
    }

    /**
     * verify 성공 후 challenge 를 무효화한다.
     *
     * @param rawToken challenge 원문
     */
    public void invalidate(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            return;
        }
        String key = storageKey(rawToken.trim());
        RedisTemplate<String, Object> redis = redisTemplateProvider.getIfAvailable();
        if (redis != null) {
            try {
                redis.delete(key);
            } catch (Exception e) {
                log.warn("비밀번호 찾기 opaque invalidate Redis 실패 — 로컬 시도: {}", e.getMessage());
            }
        }
        localStore.remove(key);
    }

    /**
     * proof 를 조회한다(삭제하지 않음). 만료·위변조·종류/테넌트 불일치면 empty.
     *
     * @param rawToken proof 원문
     * @param tenantId 현재 요청 테넌트
     * @return 저장된 엔트리
     */
    public Optional<TokenEntry> resolveProof(String rawToken, String tenantId) {
        return resolve(rawToken, Kind.PROOF, tenantId, false);
    }

    /**
     * proof 를 1회 소비한다. 만료·위변조·종류/테넌트 불일치·이미 소비면 empty.
     *
     * @param rawToken proof 원문
     * @param tenantId 현재 요청 테넌트
     * @return 소비된 엔트리
     */
    public Optional<TokenEntry> consumeProof(String rawToken, String tenantId) {
        return resolve(rawToken, Kind.PROOF, tenantId, true);
    }

    private String issue(Kind kind, String tenantId, Long otpId, long ttlSeconds) {
        if (!StringUtils.hasText(tenantId) || otpId == null || otpId <= 0L) {
            throw new IllegalArgumentException("opaque token issue requires tenantId and otpId");
        }
        purgeExpiredLocalEntries();
        String token = generateOpaqueToken();
        String key = storageKey(token);
        long expiresAtEpochMs = Instant.now().plusSeconds(ttlSeconds).toEpochMilli();
        TokenEntry entry = new TokenEntry(kind, tenantId.trim(), otpId, expiresAtEpochMs);

        RedisTemplate<String, Object> redis = redisTemplateProvider.getIfAvailable();
        if (redis != null) {
            try {
                redis.opsForValue().set(key, entry, ttlSeconds, TimeUnit.SECONDS);
                log.info("비밀번호 찾기 opaque 발급(Redis): kind={}, otpId={}, ttlSec={}",
                    kind, otpId, ttlSeconds);
                return token;
            } catch (Exception e) {
                log.warn("비밀번호 찾기 opaque Redis 저장 실패 — 로컬 폴백: {}", e.getMessage());
            }
        }
        localStore.put(key, entry);
        log.info("비밀번호 찾기 opaque 발급(local): kind={}, otpId={}, ttlSec={}",
            kind, otpId, ttlSeconds);
        return token;
    }

    private Optional<TokenEntry> resolve(String rawToken, Kind expectedKind, String tenantId,
            boolean consume) {
        if (!StringUtils.hasText(rawToken) || !StringUtils.hasText(tenantId) || expectedKind == null) {
            return Optional.empty();
        }
        String trimmed = rawToken.trim();
        // JWT 형태(점 구분) 는 opaque 가 아님 — 오인·레거시 차단
        if (trimmed.indexOf('.') >= 0) {
            return Optional.empty();
        }
        String key = storageKey(trimmed);
        String expectedTenant = tenantId.trim();

        RedisTemplate<String, Object> redis = redisTemplateProvider.getIfAvailable();
        if (redis != null) {
            try {
                Object raw = redis.opsForValue().get(key);
                TokenEntry entry = coerceEntry(raw);
                if (entry == null || entry.isExpired() || entry.kind() != expectedKind
                        || !expectedTenant.equals(entry.tenantId())) {
                    if (consume && raw != null) {
                        redis.delete(key);
                    }
                    return Optional.empty();
                }
                if (consume) {
                    redis.delete(key);
                    localStore.remove(key);
                }
                return Optional.of(entry);
            } catch (Exception e) {
                log.warn("비밀번호 찾기 opaque Redis 조회 실패 — 로컬 시도: {}", e.getMessage());
            }
        }

        TokenEntry local = consume ? localStore.remove(key) : localStore.get(key);
        if (local == null || local.isExpired() || local.kind() != expectedKind
                || !expectedTenant.equals(local.tenantId())) {
            if (!consume && local != null && local.isExpired()) {
                localStore.remove(key);
            }
            return Optional.empty();
        }
        return Optional.of(local);
    }

    private String generateOpaqueToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        // URL-safe Base64 (padding 없음). '.' 미포함 → JWT 로 오해하지 않음
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String storageKey(String rawToken) {
        return REDIS_KEY_PREFIX + sha256Hex(rawToken);
    }

    private static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 미지원 — JRE 비정상", e);
        }
    }

    private void purgeExpiredLocalEntries() {
        Instant now = Instant.now();
        Iterator<Map.Entry<String, TokenEntry>> it = localStore.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, TokenEntry> e = it.next();
            if (e.getValue() == null || e.getValue().isExpired(now)) {
                it.remove();
            }
        }
    }

    private static TokenEntry coerceEntry(Object raw) {
        if (raw instanceof TokenEntry entry) {
            return entry;
        }
        if (raw instanceof Map<?, ?> map) {
            Object kindRaw = map.get("kind");
            Object tenantId = map.get("tenantId");
            Object otpId = map.get("otpId");
            Object expiresAt = map.get("expiresAtEpochMs");
            if (!(tenantId instanceof String t) || !StringUtils.hasText(t)
                    || !(otpId instanceof Number)
                    || !(expiresAt instanceof Number)) {
                return null;
            }
            Kind kind;
            try {
                kind = Kind.valueOf(String.valueOf(kindRaw));
            } catch (Exception ex) {
                return null;
            }
            return new TokenEntry(
                kind,
                t.trim(),
                ((Number) otpId).longValue(),
                ((Number) expiresAt).longValue());
        }
        return null;
    }

    /**
     * opaque 토큰 종류.
     */
    public enum Kind {
        /** OTP 검증용 challenge. */
        CHALLENGE,
        /** 임시 비밀번호 발송용 1회 proof. */
        PROOF
    }

    /**
     * 서버 저장 엔트리 — phone/phoneHash 절대 포함 금지.
     *
     * @param kind             CHALLENGE 또는 PROOF
     * @param tenantId         테넌트
     * @param otpId            phone_otp_attempts.id
     * @param expiresAtEpochMs 만료 epoch ms
     */
    public record TokenEntry(
            Kind kind,
            String tenantId,
            Long otpId,
            long expiresAtEpochMs) {

        boolean isExpired() {
            return isExpired(Instant.now());
        }

        boolean isExpired(Instant now) {
            return now.toEpochMilli() >= expiresAtEpochMs;
        }
    }
}
