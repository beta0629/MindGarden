package com.coresolution.consultation.service.impl;

import java.time.Clock;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.coresolution.consultation.dto.auth.SmsOtpSendStatus;
import com.coresolution.consultation.service.SmsOtpVerificationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

/**
 * 메모리 기반 SMS OTP 저장·검증 구현체.
 *
 * <p>Redis 미부착 환경(개발·테스트·소규모 운영)을 위한 {@link ConcurrentHashMap} 기반 store.
 * 운영 멀티 인스턴스 환경에서는 별도 Redis 백엔드 구현으로 교체할 수 있도록 인터페이스만
 * SSOT 로 의존한다.</p>
 *
 * <p>저장 키는 정규화된 한국 휴대폰 숫자열(예: {@code 01012345678}). TTL 은 5분, 단일 사용.
 * 틀린 코드가 {@code mindgarden.otp.sms.max-failed-attempts} 회 누적되면 코드를 폐기하고
 * {@code mindgarden.otp.sms.lock-seconds} 동안 그 번호를 잠근다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Slf4j
@Service
public class SmsOtpVerificationServiceImpl implements SmsOtpVerificationService {

    /** OTP TTL — 5분(ms). */
    static final long OTP_TTL_MS = 5L * 60L * 1000L;

    /** 테스트 생성자 기본값 — 재발송 권장 대기(초). */
    static final long DEFAULT_RESEND_COOLDOWN_SECONDS = 30L;

    /** 테스트 생성자 기본값 — 잠기기 전 허용 실패 횟수. */
    static final int DEFAULT_MAX_FAILED_ATTEMPTS = 5;

    /** 테스트 생성자 기본값 — 잠김 시간(초). */
    static final long DEFAULT_LOCK_SECONDS = 600L;

    private static final long MILLIS_PER_SECOND = 1000L;

    private final Map<String, Entry> store = new ConcurrentHashMap<>();
    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();
    private final Clock clock;
    private final long resendCooldownSeconds;
    private final int maxFailedAttempts;
    private final long lockMs;

    /**
     * Spring 주입 생성자.
     *
     * @param resendCooldownSeconds 재발송 권장 대기(초)
     * @param maxFailedAttempts     잠기기 전 허용 실패 횟수
     * @param lockSeconds           잠김 시간(초)
     */
    @Autowired
    public SmsOtpVerificationServiceImpl(
            @Value("${mindgarden.otp.sms.resend-cooldown-seconds:30}") long resendCooldownSeconds,
            @Value("${mindgarden.otp.sms.max-failed-attempts:5}") int maxFailedAttempts,
            @Value("${mindgarden.otp.sms.lock-seconds:600}") long lockSeconds) {
        this(Clock.systemUTC(), resendCooldownSeconds, maxFailedAttempts, lockSeconds);
    }

    /**
     * 테스트 전용 — 가짜 {@link Clock} 주입, 정책은 기본값.
     */
    SmsOtpVerificationServiceImpl(Clock clock) {
        this(clock, DEFAULT_RESEND_COOLDOWN_SECONDS, DEFAULT_MAX_FAILED_ATTEMPTS, DEFAULT_LOCK_SECONDS);
    }

    /**
     * 테스트 전용 — 가짜 {@link Clock} 과 정책 주입.
     */
    SmsOtpVerificationServiceImpl(
            Clock clock, long resendCooldownSeconds, int maxFailedAttempts, long lockSeconds) {
        this.clock = clock;
        this.resendCooldownSeconds = Math.max(0L, resendCooldownSeconds);
        this.maxFailedAttempts = Math.max(1, maxFailedAttempts);
        this.lockMs = Math.max(0L, lockSeconds) * MILLIS_PER_SECOND;
    }

    @Override
    public void storeCode(String normalizedPhone, String code) {
        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            throw new IllegalArgumentException("normalizedPhone is blank");
        }
        if (code == null || !code.matches("^\\d{6}$")) {
            throw new IllegalArgumentException("OTP code must be 6 digits");
        }
        store.put(normalizedPhone, new Entry(code, clock.millis()));
        log.debug("SMS OTP 저장: phone={}, expiresInMs={}", normalizedPhone, OTP_TTL_MS);
    }

    @Override
    public boolean verifyAndConsume(String normalizedPhone, String code) {
        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            return false;
        }
        if (code == null || !code.matches("^\\d{6}$")) {
            return false;
        }
        long now = clock.millis();
        if (activeLockUntil(normalizedPhone, now) > 0L) {
            log.debug("SMS OTP 잠김 상태 검증 거부: phone={}", normalizedPhone);
            return false;
        }
        Entry entry = store.get(normalizedPhone);
        if (entry == null) {
            log.debug("SMS OTP 미존재: phone={}", normalizedPhone);
            return false;
        }
        if (now - entry.createdAtMs > OTP_TTL_MS) {
            store.remove(normalizedPhone);
            log.debug("SMS OTP 만료: phone={}, ageMs={}", normalizedPhone, now - entry.createdAtMs);
            return false;
        }
        if (!entry.code.equals(code)) {
            registerFailure(normalizedPhone, now);
            log.debug("SMS OTP 코드 불일치: phone={}", normalizedPhone);
            return false;
        }
        store.remove(normalizedPhone);
        attempts.remove(normalizedPhone);
        log.debug("SMS OTP 검증·소비 완료: phone={}", normalizedPhone);
        return true;
    }

    @Override
    public SmsOtpSendStatus getSendStatus(String normalizedPhone) {
        long expiresInSeconds = OTP_TTL_MS / MILLIS_PER_SECOND;
        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            return SmsOtpSendStatus.available(expiresInSeconds, resendCooldownSeconds, maxFailedAttempts);
        }
        long now = clock.millis();
        long lockedUntil = activeLockUntil(normalizedPhone, now);
        if (lockedUntil > 0L) {
            long retryAfterSeconds = ceilSeconds(lockedUntil - now);
            return SmsOtpSendStatus.locked(retryAfterSeconds, expiresInSeconds, resendCooldownSeconds);
        }
        AttemptState state = attempts.get(normalizedPhone);
        int failures = state == null ? 0 : state.failures;
        int remaining = Math.max(0, maxFailedAttempts - failures);
        return SmsOtpSendStatus.available(expiresInSeconds, resendCooldownSeconds, remaining);
    }

    @Override
    public void evictExpired() {
        long now = clock.millis();
        Iterator<Map.Entry<String, Entry>> it = store.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Entry> e = it.next();
            if (now - e.getValue().createdAtMs > OTP_TTL_MS) {
                it.remove();
            }
        }
        attempts.entrySet().removeIf(e -> e.getValue().lockedUntilMs > 0L && e.getValue().lockedUntilMs <= now);
    }

    /**
     * 잠김이 유효하면 해제 시각(ms), 아니면 0. 만료된 잠김은 정리한다.
     */
    private long activeLockUntil(String normalizedPhone, long now) {
        AttemptState state = attempts.get(normalizedPhone);
        if (state == null || state.lockedUntilMs <= 0L) {
            return 0L;
        }
        if (state.lockedUntilMs <= now) {
            attempts.remove(normalizedPhone, state);
            return 0L;
        }
        return state.lockedUntilMs;
    }

    private void registerFailure(String normalizedPhone, long now) {
        AttemptState next = attempts.compute(normalizedPhone, (key, prev) -> {
            int failures = (prev == null ? 0 : prev.failures) + 1;
            long lockedUntil = failures >= maxFailedAttempts ? now + lockMs : 0L;
            return new AttemptState(failures, lockedUntil);
        });
        if (next.lockedUntilMs > 0L) {
            store.remove(normalizedPhone);
            log.info("SMS OTP 실패 한도 초과로 잠김: phone={}, lockMs={}", normalizedPhone, lockMs);
        }
    }

    private static long ceilSeconds(long millis) {
        return (millis + MILLIS_PER_SECOND - 1L) / MILLIS_PER_SECOND;
    }

    private static final class Entry {
        private final String code;
        private final long createdAtMs;

        Entry(String code, long createdAtMs) {
            this.code = code;
            this.createdAtMs = createdAtMs;
        }
    }

    private static final class AttemptState {
        private final int failures;
        private final long lockedUntilMs;

        AttemptState(int failures, long lockedUntilMs) {
            this.failures = failures;
            this.lockedUntilMs = lockedUntilMs;
        }
    }
}
