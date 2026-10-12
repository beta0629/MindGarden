package com.coresolution.consultation.service.support;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.coresolution.consultation.config.MindgardenSecurityProperties;

/**
 * 인증 코드 발송·검증 시도 제한기(인메모리). 이메일 단위·IP 단위 범위를 구분해 센다.
 * 수평 확장 시 공유 저장소가 필요하다(계정 연동 서비스 JavaDoc 과 동일 전제).
 *
 * @author CoreSolution
 * @since 2026-10-12
 */
@Component
public class VerificationAttemptLimiter {

    /** 제한 범위 */
    public enum Scope {
        VERIFY_EMAIL, VERIFY_IP, SEND_IP
    }

    private static final int CLEANUP_THRESHOLD = 10_000;
    private static final String KEY_SEPARATOR = ":";

    private final MindgardenSecurityProperties properties;
    private final LongSupplier nowMillis;
    private final Map<String, Entry> entries = new ConcurrentHashMap<>();

    @Autowired
    public VerificationAttemptLimiter(MindgardenSecurityProperties properties) {
        this(properties, System::currentTimeMillis);
    }

    VerificationAttemptLimiter(MindgardenSecurityProperties properties, LongSupplier nowMillis) {
        this.properties = properties;
        this.nowMillis = nowMillis;
    }

    /**
     * @return 잠금 중이면 true
     */
    public boolean isLocked(Scope scope, String key) {
        if (key == null) {
            return false;
        }
        Entry e = entries.get(compose(scope, key));
        return e != null && e.lockedUntil > nowMillis.getAsLong();
    }

    /**
     * 시도(실패 또는 요청)를 1회 기록한다. 한도에 도달하면 잠근다.
     *
     * @return 이 기록으로(또는 이미) 잠긴 상태면 true
     */
    public boolean recordAttempt(Scope scope, String key) {
        if (key == null) {
            return false;
        }
        Limit limit = limitOf(scope);
        long now = nowMillis.getAsLong();
        cleanupIfLarge(now);
        Entry updated = entries.compute(compose(scope, key), (k, cur) -> {
            Entry base = cur;
            boolean lockExpired = base != null && base.lockedUntil > 0 && base.lockedUntil <= now;
            boolean windowExpired = base != null && base.lockedUntil == 0
                && base.windowStart + limit.windowMillis <= now;
            if (base == null || lockExpired || windowExpired) {
                base = new Entry(now, 0, 0L);
            }
            if (base.lockedUntil > now) {
                return base;
            }
            int count = base.count + 1;
            long lockedUntil = count >= limit.max ? now + limit.lockMillis : 0L;
            return new Entry(base.windowStart, count, lockedUntil);
        });
        return updated.lockedUntil > now;
    }

    /**
     * 성공 시 해당 키의 카운터를 지운다.
     */
    public void reset(Scope scope, String key) {
        if (key != null) {
            entries.remove(compose(scope, key));
        }
    }

    private Limit limitOf(Scope scope) {
        MindgardenSecurityProperties.AccountIntegration ai = properties.getAccountIntegration();
        switch (scope) {
            case VERIFY_EMAIL:
                return new Limit(ai.getVerifyMaxAttemptsPerEmail(),
                    Duration.ofMinutes(ai.getVerifyLockMinutes()).toMillis(),
                    Duration.ofMinutes(ai.getVerifyLockMinutes()).toMillis());
            case VERIFY_IP:
                return new Limit(ai.getVerifyMaxFailuresPerIp(),
                    Duration.ofMinutes(ai.getIpWindowMinutes()).toMillis(),
                    Duration.ofMinutes(ai.getIpWindowMinutes()).toMillis());
            case SEND_IP:
            default:
                return new Limit(ai.getSendMaxRequestsPerIp(),
                    Duration.ofMinutes(ai.getIpWindowMinutes()).toMillis(),
                    Duration.ofMinutes(ai.getIpWindowMinutes()).toMillis());
        }
    }

    private void cleanupIfLarge(long now) {
        if (entries.size() < CLEANUP_THRESHOLD) {
            return;
        }
        long maxWindow = Duration.ofMinutes(Math.max(1, properties.getAccountIntegration().getIpWindowMinutes()
            + properties.getAccountIntegration().getVerifyLockMinutes())).toMillis();
        entries.entrySet().removeIf(en -> en.getValue().lockedUntil <= now
            && en.getValue().windowStart + maxWindow <= now);
    }

    private static String compose(Scope scope, String key) {
        return scope.name() + KEY_SEPARATOR + key;
    }

    private record Entry(long windowStart, int count, long lockedUntil) {
    }

    private record Limit(int max, long windowMillis, long lockMillis) {
    }
}
