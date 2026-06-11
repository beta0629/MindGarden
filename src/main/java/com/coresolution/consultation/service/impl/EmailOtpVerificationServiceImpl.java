package com.coresolution.consultation.service.impl;

import java.time.Clock;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.coresolution.consultation.service.EmailOtpVerificationService;
import com.coresolution.consultation.util.EmailLogMasking;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

/**
 * 메모리 기반 이메일 OTP 저장·검증 구현체.
 *
 * <p>Redis 미부착 환경(개발·테스트·소규모 운영)을 위한 {@link ConcurrentHashMap} 기반 store.
 * 운영 멀티 인스턴스 환경에서는 별도 Redis 백엔드 구현으로 교체할 수 있도록 인터페이스만
 * SSOT 로 의존한다. SMS 측 {@link SmsOtpVerificationServiceImpl} 과 동일한 5분 TTL · 단일
 * 사용 정책을 적용한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Slf4j
@Service
public class EmailOtpVerificationServiceImpl implements EmailOtpVerificationService {

    /** OTP TTL — 5분(ms). */
    static final long OTP_TTL_MS = 5L * 60L * 1000L;

    private final Map<String, Entry> store = new ConcurrentHashMap<>();
    private final Clock clock;

    public EmailOtpVerificationServiceImpl() {
        this(Clock.systemUTC());
    }

    /**
     * 테스트 전용 — 가짜 {@link Clock} 주입.
     */
    EmailOtpVerificationServiceImpl(Clock clock) {
        this.clock = clock;
    }

    @Override
    public void storeCode(String normalizedEmail, String code) {
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            throw new IllegalArgumentException("normalizedEmail is blank");
        }
        if (code == null || !code.matches("^\\d{6}$")) {
            throw new IllegalArgumentException("OTP code must be 6 digits");
        }
        store.put(normalizedEmail, new Entry(code, clock.millis()));
        log.debug("Email OTP 저장: email={}, expiresInMs={}",
                EmailLogMasking.maskForLog(normalizedEmail), OTP_TTL_MS);
    }

    @Override
    public boolean verifyAndConsume(String normalizedEmail, String code) {
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            return false;
        }
        if (code == null || !code.matches("^\\d{6}$")) {
            return false;
        }
        Entry entry = store.get(normalizedEmail);
        if (entry == null) {
            log.debug("Email OTP 미존재: email={}", EmailLogMasking.maskForLog(normalizedEmail));
            return false;
        }
        long now = clock.millis();
        if (now - entry.createdAtMs > OTP_TTL_MS) {
            store.remove(normalizedEmail);
            log.debug("Email OTP 만료: email={}, ageMs={}",
                    EmailLogMasking.maskForLog(normalizedEmail), now - entry.createdAtMs);
            return false;
        }
        if (!entry.code.equals(code)) {
            log.debug("Email OTP 코드 불일치: email={}", EmailLogMasking.maskForLog(normalizedEmail));
            return false;
        }
        store.remove(normalizedEmail);
        log.debug("Email OTP 검증·소비 완료: email={}", EmailLogMasking.maskForLog(normalizedEmail));
        return true;
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
    }

    private static final class Entry {
        private final String code;
        private final long createdAtMs;

        Entry(String code, long createdAtMs) {
            this.code = code;
            this.createdAtMs = createdAtMs;
        }
    }
}
