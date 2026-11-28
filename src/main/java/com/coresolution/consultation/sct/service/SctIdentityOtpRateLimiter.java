package com.coresolution.consultation.sct.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * SCT 본인확인 SMS OTP 전용 Rate-Limiter.
 *
 * <p>AdminTestNotificationRateLimiter / admin.test-notification.* 와 테이블·import·호출 공유 금지.
 * 키: tenantId+invitationId / phoneHash / ipHash — 시간당 상한(슬라이딩 윈도우).</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Component
public class SctIdentityOtpRateLimiter {

    private final Clock clock;
    private final ConcurrentHashMap<String, SlidingWindow> windows = new ConcurrentHashMap<>();

    /**
     * 시스템 시계 기본 생성자.
     */
    public SctIdentityOtpRateLimiter() {
        this(Clock.systemUTC());
    }

    /**
     * @param clock 테스트용 시계
     */
    public SctIdentityOtpRateLimiter(Clock clock) {
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    /**
     * 시간당 상한 판정.
     *
     * @param bucketKey 고유 키(테넌트+초대 / phoneHash / ipHash)
     * @param limitPerHour 시간당 상한
     * @return 허용 여부
     */
    public boolean tryAcquire(String bucketKey, int limitPerHour) {
        Objects.requireNonNull(bucketKey, "bucketKey");
        if (limitPerHour <= 0) {
            return false;
        }
        Instant now = clock.instant();
        SlidingWindow window = windows.computeIfAbsent(bucketKey, k -> new SlidingWindow());
        synchronized (window) {
            window.evictOlderThan(now.minus(Duration.ofHours(1)));
            if (window.size() >= limitPerHour) {
                return false;
            }
            window.add(now);
            return true;
        }
    }

    /**
     * 판정만(카운터 미증가).
     *
     * @param bucketKey 키
     * @param limitPerHour 상한
     * @return 여유 있으면 true
     */
    public boolean hasCapacity(String bucketKey, int limitPerHour) {
        Objects.requireNonNull(bucketKey, "bucketKey");
        if (limitPerHour <= 0) {
            return false;
        }
        Instant now = clock.instant();
        SlidingWindow window = windows.computeIfAbsent(bucketKey, k -> new SlidingWindow());
        synchronized (window) {
            window.evictOlderThan(now.minus(Duration.ofHours(1)));
            return window.size() < limitPerHour;
        }
    }

    /**
     * 상한에 걸렸을 때 다시 시도 가능해질 때까지 남은 초(슬라이딩 1시간 창). 여유가 있으면 0.
     *
     * @param bucketKey    키
     * @param limitPerHour 상한
     * @return 남은 초
     */
    public long retryAfterSeconds(String bucketKey, int limitPerHour) {
        Objects.requireNonNull(bucketKey, "bucketKey");
        if (limitPerHour <= 0) {
            return 0L;
        }
        Instant now = clock.instant();
        SlidingWindow window = windows.computeIfAbsent(bucketKey, k -> new SlidingWindow());
        synchronized (window) {
            window.evictOlderThan(now.minus(Duration.ofHours(1)));
            return window.secondsUntilBelow(limitPerHour, now);
        }
    }

    /**
     * 성공·실패 무관 시도 기록.
     *
     * @param bucketKey 키
     */
    public void recordAttempt(String bucketKey) {
        Objects.requireNonNull(bucketKey, "bucketKey");
        Instant now = clock.instant();
        SlidingWindow window = windows.computeIfAbsent(bucketKey, k -> new SlidingWindow());
        synchronized (window) {
            window.add(now);
            window.evictOlderThan(now.minus(Duration.ofHours(1)));
        }
    }

    private static final class SlidingWindow {
        private final Deque<Instant> timestamps = new ArrayDeque<>();

        void add(Instant ts) {
            timestamps.addLast(ts);
        }

        void evictOlderThan(Instant cutoff) {
            Iterator<Instant> it = timestamps.iterator();
            while (it.hasNext()) {
                if (it.next().isBefore(cutoff)) {
                    it.remove();
                } else {
                    return;
                }
            }
        }

        int size() {
            return timestamps.size();
        }

        long secondsUntilBelow(int limit, Instant now) {
            int excess = timestamps.size() - limit;
            if (excess < 0) {
                return 0L;
            }
            Iterator<Instant> it = timestamps.iterator();
            Instant pivot = null;
            for (int i = 0; i <= excess && it.hasNext(); i++) {
                pivot = it.next();
            }
            if (pivot == null) {
                return 0L;
            }
            return Math.max(1L, Duration.between(now, pivot.plus(Duration.ofHours(1))).getSeconds());
        }
    }
}
