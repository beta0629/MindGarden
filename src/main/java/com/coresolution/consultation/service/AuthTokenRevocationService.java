package com.coresolution.consultation.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import com.coresolution.consultation.constant.SessionManagementConstants;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * 현재 세션 로그아웃 시 개별 JWT 폐기 목록(denylist).
 *
 * <p>계정 전체가 아닌 <strong>요청을 보낸 세션의 토큰만</strong> 거부하기 위해 사용한다.
 * 원문 토큰은 저장·로그하지 않고 SHA-256 해시 또는 Refresh {@code tokenId} 만 키로 쓴다.
 * 항목은 원래 토큰 만료 시각까지만 유지된다.</p>
 *
 * <p>Redis 빈이 있으면 Redis(멀티 인스턴스 공유), 없거나 장애 시 프로세스 메모리로 폴백한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@Slf4j
@Service
public class AuthTokenRevocationService {

    private static final String REVOKED_MARKER = "1";
    private static final String HASH_ALGORITHM = "SHA-256";

    private final ObjectProvider<StringRedisTemplate> redisTemplateProvider;
    private final ConcurrentHashMap<String, Long> localStore = new ConcurrentHashMap<>();

    /**
     * @param redisTemplateProvider Redis (없을 수 있음)
     */
    public AuthTokenRevocationService(ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this.redisTemplateProvider = redisTemplateProvider;
    }

    /**
     * Access JWT 한 개를 만료 시각까지 거부 목록에 올린다.
     *
     * @param accessToken     Access JWT 원문
     * @param expiresAtEpochMs 토큰 만료 시각(ms)
     */
    public void revokeAccessToken(String accessToken, long expiresAtEpochMs) {
        if (!StringUtils.hasText(accessToken)) {
            return;
        }
        put(SessionManagementConstants.REVOKED_ACCESS_TOKEN_KEY_PREFIX + sha256(accessToken), expiresAtEpochMs);
    }

    /**
     * @param accessToken Access JWT 원문
     * @return 현재 세션 로그아웃으로 폐기된 토큰이면 true
     */
    public boolean isAccessTokenRevoked(String accessToken) {
        if (!StringUtils.hasText(accessToken)) {
            return false;
        }
        return contains(SessionManagementConstants.REVOKED_ACCESS_TOKEN_KEY_PREFIX + sha256(accessToken));
    }

    /**
     * Refresh JWT 원문 한 개를 만료 시각까지 거부 목록에 올린다 (sid 연결 없는 구 토큰용).
     *
     * @param refreshToken     Refresh JWT 원문
     * @param expiresAtEpochMs 토큰 만료 시각(ms)
     */
    public void revokeRefreshToken(String refreshToken, long expiresAtEpochMs) {
        if (!StringUtils.hasText(refreshToken)) {
            return;
        }
        put(SessionManagementConstants.REVOKED_REFRESH_TOKEN_KEY_PREFIX + sha256(refreshToken), expiresAtEpochMs);
    }

    /**
     * @param refreshToken Refresh JWT 원문
     * @return 폐기된 토큰이면 true
     */
    public boolean isRefreshTokenRevoked(String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            return false;
        }
        return contains(SessionManagementConstants.REVOKED_REFRESH_TOKEN_KEY_PREFIX + sha256(refreshToken));
    }

    /**
     * Refresh {@code tokenId} 를 만료 시각까지 거부 목록에 올린다.
     *
     * @param tokenId          {@code refresh_token_store.token_id} (= Access JWT sid)
     * @param expiresAtEpochMs 해당 Refresh JWT 만료 시각 상한(ms)
     */
    public void revokeRefreshTokenId(String tokenId, long expiresAtEpochMs) {
        if (!StringUtils.hasText(tokenId)) {
            return;
        }
        put(SessionManagementConstants.REVOKED_REFRESH_TOKEN_ID_KEY_PREFIX + tokenId.trim(), expiresAtEpochMs);
    }

    /**
     * @param tokenId Refresh {@code tokenId}
     * @return 폐기된 tokenId 이면 true
     */
    public boolean isRefreshTokenIdRevoked(String tokenId) {
        if (!StringUtils.hasText(tokenId)) {
            return false;
        }
        return contains(SessionManagementConstants.REVOKED_REFRESH_TOKEN_ID_KEY_PREFIX + tokenId.trim());
    }

    private void put(String key, long expiresAtEpochMs) {
        long ttlMs = expiresAtEpochMs - System.currentTimeMillis();
        if (ttlMs <= 0) {
            return;
        }
        purgeExpiredLocalEntries();
        localStore.put(key, expiresAtEpochMs);
        StringRedisTemplate redis = redisTemplateProvider.getIfAvailable();
        if (redis == null) {
            return;
        }
        try {
            redis.opsForValue().set(key, REVOKED_MARKER, ttlMs, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            log.warn("토큰 폐기 목록 Redis 저장 실패 — 로컬만 유지: {}", e.getMessage());
        }
    }

    private boolean contains(String key) {
        Long localExpiry = localStore.get(key);
        if (localExpiry != null) {
            if (localExpiry > System.currentTimeMillis()) {
                return true;
            }
            localStore.remove(key, localExpiry);
        }
        StringRedisTemplate redis = redisTemplateProvider.getIfAvailable();
        if (redis == null) {
            return false;
        }
        try {
            return Boolean.TRUE.equals(redis.hasKey(key));
        } catch (Exception e) {
            log.warn("토큰 폐기 목록 Redis 조회 실패 — 로컬 결과 사용: {}", e.getMessage());
            return false;
        }
    }

    private void purgeExpiredLocalEntries() {
        long now = System.currentTimeMillis();
        localStore.entrySet().removeIf(e -> e.getValue() == null || e.getValue() <= now);
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            return HexFormat.of().formatHex(digest.digest(value.trim().getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(HASH_ALGORITHM + " unavailable", e);
        }
    }
}
