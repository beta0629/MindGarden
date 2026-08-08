package com.coresolution.consultation.config;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * 중복 로그인 정리 직후 구 Access JWT 를 짧게 거부하기 위한 인메모리 힌트.
 *
 * <p>refresh_token 은 {@code cleanupUserSessions} 에서 revoke 되지만 Access JWT 는 TTL 끝까지
 * 유효할 수 있어, 동일 인스턴스에서 Expo 등 Bearer 요청을 즉시 차단한다.
 * 멀티 인스턴스·재시작 시에는 Access TTL 만료·refresh 거부에 의존한다.</p>
 *
 * @author MindGarden
 * @since 2026-08-07
 */
@Slf4j
@Component
public class DuplicateLoginAccessBlockRegistry {

    private final ConcurrentMap<Long, Long> blockedUntilEpochMs = new ConcurrentHashMap<>();

    private final long defaultBlockDurationMs;

    public DuplicateLoginAccessBlockRegistry(
            @Value("${jwt.expiration:3600000}") long jwtExpirationMs) {
        this.defaultBlockDurationMs = Math.max(jwtExpirationMs, 1L);
    }

    /**
     * 사용자 Access JWT 를 Access TTL 동안 차단한다.
     *
     * @param userId 사용자 PK
     */
    public void blockUser(Long userId) {
        blockUser(userId, defaultBlockDurationMs);
    }

    /**
     * @param userId     사용자 PK
     * @param durationMs 차단 기간(ms)
     */
    public void blockUser(Long userId, long durationMs) {
        if (userId == null) {
            return;
        }
        long until = System.currentTimeMillis() + Math.max(durationMs, 1L);
        blockedUntilEpochMs.put(userId, until);
        log.info("🚫 중복로그인 Access 차단 등록: userId={}, untilEpochMs={}", userId, until);
        purgeExpired();
    }

    /**
     * @param userId 사용자 PK
     * @return 현재 차단 중이면 true
     */
    public boolean isBlocked(Long userId) {
        if (userId == null) {
            return false;
        }
        Long until = blockedUntilEpochMs.get(userId);
        if (until == null) {
            return false;
        }
        if (until <= System.currentTimeMillis()) {
            blockedUntilEpochMs.remove(userId, until);
            return false;
        }
        return true;
    }

    /**
     * 재로그인 성공 시 차단을 해제한다.
     *
     * @param userId 사용자 PK
     */
    public void clearBlock(Long userId) {
        if (userId == null) {
            return;
        }
        blockedUntilEpochMs.remove(userId);
    }

    private void purgeExpired() {
        long now = System.currentTimeMillis();
        blockedUntilEpochMs.entrySet().removeIf(e -> e.getValue() == null || e.getValue() <= now);
    }
}
