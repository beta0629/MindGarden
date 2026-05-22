package com.coresolution.consultation.service.impl;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import com.coresolution.consultation.config.AdminTestNotificationProperties;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 어드민 테스트 발송 Rate-Limiter.
 *
 * <p>방식: <strong>in-memory sliding window + DB cross-check</strong>.
 * <ul>
 *   <li>1차: 사용자·테넌트 키 기준 1분/1일 슬라이딩 윈도우(in-memory). 빠른 응답·과부하 방지.</li>
 *   <li>2차: 1차 통과 시 {@link AdminTestNotificationLogRepository#countByTenantIdAndSentByUserIdAndSentAtAfter}
 *       로 DB 카운트 cross-check. 애플리케이션 재시작·다중 인스턴스에서도 한도 보장.</li>
 * </ul>
 *
 * <p>발송 직전 {@link #tryAcquire(String, Long)} 호출 → 한도 초과 시 {@link Decision#exceeded()} == true.
 * 메모리 카운터는 호출자가 {@link #recordAttempt(String, Long)}로 명시적으로 증가시킨다(차단 분기와 분리).
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminTestNotificationRateLimiter {

    static final String LIMIT_KIND_PER_MINUTE = "PER_MINUTE";
    static final String LIMIT_KIND_PER_DAY = "PER_DAY";

    private final AdminTestNotificationProperties properties;
    private final AdminTestNotificationLogRepository logRepository;
    private final Clock clock = Clock.systemDefaultZone();

    private final ConcurrentHashMap<Key, SlidingWindow> windows = new ConcurrentHashMap<>();

    /**
     * 발송 가능 여부 판정. 1·2차 모두 통과해야 {@code allowed=true}.
     *
     * @param tenantId 테넌트 ID
     * @param userId   발송 사용자 PK
     * @return 결과(잔여 한도 포함)
     */
    public Decision tryAcquire(String tenantId, Long userId) {
        Objects.requireNonNull(tenantId, "tenantId");
        Objects.requireNonNull(userId, "userId");

        int perMinuteLimit = properties.getRateLimit().getPerMinute();
        int perDayLimit = properties.getRateLimit().getPerDay();

        Key key = new Key(tenantId, userId);
        SlidingWindow window = windows.computeIfAbsent(key, k -> new SlidingWindow());

        Instant now = clock.instant();
        int memMinute;
        int memDay;
        synchronized (window) {
            window.evictOlderThan(now.minus(Duration.ofDays(1)));
            memMinute = window.countAfter(now.minus(Duration.ofMinutes(1)));
            memDay = window.size();
        }

        if (memMinute >= perMinuteLimit) {
            return Decision.exceeded(LIMIT_KIND_PER_MINUTE,
                perMinuteLimit - memMinute, perDayLimit - memDay, 60L);
        }
        if (memDay >= perDayLimit) {
            return Decision.exceeded(LIMIT_KIND_PER_DAY,
                perMinuteLimit - memMinute, perDayLimit - memDay, retryAfterUntilNextDay(now));
        }

        ZoneId zone = clock.getZone();
        LocalDateTime nowLdt = LocalDateTime.ofInstant(now, zone);
        long dbMinute = logRepository.countByTenantIdAndSentByUserIdAndSentAtAfter(
            tenantId, userId, nowLdt.minusMinutes(1));
        long dbDay = logRepository.countByTenantIdAndSentByUserIdAndSentAtAfter(
            tenantId, userId, nowLdt.minusDays(1));

        int remainingMinute = perMinuteLimit - (int) Math.max(memMinute, dbMinute);
        int remainingDay = perDayLimit - (int) Math.max(memDay, dbDay);

        if (dbMinute >= perMinuteLimit) {
            return Decision.exceeded(LIMIT_KIND_PER_MINUTE, remainingMinute, remainingDay, 60L);
        }
        if (dbDay >= perDayLimit) {
            return Decision.exceeded(LIMIT_KIND_PER_DAY,
                remainingMinute, remainingDay, retryAfterUntilNextDay(now));
        }

        return Decision.allowed(remainingMinute, remainingDay);
    }

    /**
     * 발송 시도를 in-memory 카운터에 기록한다(성공·실패 무관).
     * DB 로그는 {@code AdminTestNotificationLogger}가 별도 트랜잭션으로 기록한다.
     *
     * @param tenantId 테넌트 ID
     * @param userId   발송 사용자 PK
     */
    public void recordAttempt(String tenantId, Long userId) {
        Key key = new Key(tenantId, userId);
        SlidingWindow window = windows.computeIfAbsent(key, k -> new SlidingWindow());
        synchronized (window) {
            window.add(clock.instant());
            window.evictOlderThan(clock.instant().minus(Duration.ofDays(1)));
        }
    }

    private long retryAfterUntilNextDay(Instant now) {
        return Duration.ofDays(1).getSeconds();
    }

    /**
     * 키 — 테넌트+사용자.
     */
    private record Key(String tenantId, Long userId) {
    }

    /**
     * 슬라이딩 윈도우 카운터(1일 보존).
     */
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

        int countAfter(Instant after) {
            int count = 0;
            Iterator<Instant> it = timestamps.descendingIterator();
            while (it.hasNext()) {
                Instant ts = it.next();
                if (ts.isAfter(after)) {
                    count++;
                } else {
                    break;
                }
            }
            return count;
        }

        int size() {
            return timestamps.size();
        }
    }

    /**
     * Rate-limit 판정 결과.
     *
     * @param allowed          발송 허용 여부
     * @param limitKind        초과 종류({@code PER_MINUTE}|{@code PER_DAY}|null)
     * @param remainingPerMinute 분당 잔여
     * @param remainingPerDay    일당 잔여
     * @param retryAfterSeconds  재시도 권장 초(허용 시 0)
     */
    public record Decision(boolean allowed, String limitKind,
            int remainingPerMinute, int remainingPerDay, long retryAfterSeconds) {

        /**
         * @param remainingMinute 잔여 분당 한도(음수 가능)
         * @param remainingDay 잔여 일당 한도(음수 가능)
         * @return 허용 결정
         */
        public static Decision allowed(int remainingMinute, int remainingDay) {
            return new Decision(true, null,
                Math.max(0, remainingMinute), Math.max(0, remainingDay), 0L);
        }

        /**
         * @param limitKind 초과 종류
         * @param remainingMinute 잔여 분당 한도
         * @param remainingDay 잔여 일당 한도
         * @param retryAfterSeconds 재시도 권장 초
         * @return 초과 결정
         */
        public static Decision exceeded(String limitKind, int remainingMinute, int remainingDay,
                long retryAfterSeconds) {
            return new Decision(false, limitKind,
                Math.max(0, remainingMinute), Math.max(0, remainingDay), retryAfterSeconds);
        }

        /**
         * @return 한도 초과 여부
         */
        public boolean exceeded() {
            return !allowed;
        }
    }
}
