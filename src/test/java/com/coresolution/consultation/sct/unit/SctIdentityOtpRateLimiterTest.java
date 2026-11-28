package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.consultation.sct.service.SctIdentityOtpRateLimiter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * SCT OTP 전용 rate limiter 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
class SctIdentityOtpRateLimiterTest {

    @Test
    @DisplayName("시간당 상한까지 허용 후 차단")
    void blocksAfterLimit() {
        SctIdentityOtpRateLimiter limiter = new SctIdentityOtpRateLimiter();
        String key = "invite:t1:1";
        assertTrue(limiter.tryAcquire(key, 2));
        assertTrue(limiter.tryAcquire(key, 2));
        assertFalse(limiter.tryAcquire(key, 2));
        assertFalse(limiter.hasCapacity(key, 2));
    }

    @Test
    @DisplayName("키 분리 — 다른 버킷 독립")
    void keysAreIsolated() {
        SctIdentityOtpRateLimiter limiter = new SctIdentityOtpRateLimiter();
        assertTrue(limiter.tryAcquire("a", 1));
        assertFalse(limiter.tryAcquire("a", 1));
        assertTrue(limiter.tryAcquire("b", 1));
    }

    @Test
    @DisplayName("한도 초과 시 남은 대기 초 > 0, 여유 있으면 0")
    void retryAfterSeconds() {
        SctIdentityOtpRateLimiter limiter = new SctIdentityOtpRateLimiter();
        String key = "invite:t1:2";
        org.junit.jupiter.api.Assertions.assertEquals(0L, limiter.retryAfterSeconds(key, 2));
        limiter.tryAcquire(key, 2);
        limiter.tryAcquire(key, 2);
        long wait = limiter.retryAfterSeconds(key, 2);
        assertTrue(wait > 0L && wait <= 3600L);
    }
}
