package com.coresolution.consultation.service.impl;

import java.security.SecureRandom;
import java.time.Clock;
import java.util.Base64;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import com.coresolution.consultation.service.OtpCurrentTokenService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

/**
 * 메모리 기반 OTP 1회 조회 토큰 구현체.
 *
 * <p>2026-06-11 PR #224 후속 (보안 강화) — push body 평문 OTP 노출 차단 정책의 SSOT 저장소.</p>
 *
 * <p>Token 생성: 192bit SecureRandom → URL-safe Base64 (32 chars). 충돌 확률 무시 가능.
 * TTL 5분, 단일 사용. lazy eviction(verify 시 만료 항목 삭제) + 명시적 {@link #evictExpired()}.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Slf4j
@Service
public class OtpCurrentTokenServiceImpl implements OtpCurrentTokenService {

    /** OTP 조회 토큰 TTL — 5분(ms). {@code SmsOtpVerificationServiceImpl.OTP_TTL_MS} 와 동일. */
    static final long TOKEN_TTL_MS = 5L * 60L * 1000L;

    /** Token 생성 시 SecureRandom 바이트 길이 (24 = 192bit, URL-safe Base64 32자). */
    private static final int TOKEN_BYTES = 24;

    private final Map<String, Entry> store = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final Clock clock;

    /**
     * Spring DI 운영용 생성자. {@code @Autowired} 명시 — 다중 생성자(아래 테스트 전용 패키지 가시성
     * 생성자) 존재 시 Spring 이 단일 생성자 자동 선택을 하지 않고 default constructor 로 fallback
     * 시도하다 {@link NoSuchMethodException} 으로 ApplicationContext 로딩이 실패할 수 있다.
     * PR #227 cascade fix({@code SmsGatewayServiceImpl}) 패턴을 동일 정책으로 확장하여 B5 표준
     * (다중 생성자 명시) 적용 — 2026-06-12.
     */
    @Autowired
    public OtpCurrentTokenServiceImpl() {
        this(Clock.systemUTC());
    }

    /**
     * 테스트 전용 — 가짜 {@link Clock} 주입.
     *
     * @param clock 테스트용 Clock
     */
    OtpCurrentTokenServiceImpl(Clock clock) {
        this.clock = clock;
    }

    @Override
    public String issue(Long userId, String code) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is null");
        }
        if (code == null || !code.matches("^\\d{6}$")) {
            throw new IllegalArgumentException("OTP code must be 6 digits");
        }
        String token = generateToken();
        store.put(token, new Entry(userId, code, clock.millis()));
        log.debug("OtpCurrentToken 발급: userId={} ttlMs={}", userId, TOKEN_TTL_MS);
        return token;
    }

    @Override
    public Optional<String> fetchAndConsume(String otpToken, Long userId) {
        if (otpToken == null || otpToken.isBlank() || userId == null) {
            return Optional.empty();
        }
        Entry entry = store.get(otpToken);
        if (entry == null) {
            log.debug("OtpCurrentToken 미존재 또는 이미 소비됨");
            return Optional.empty();
        }
        long now = clock.millis();
        if (now - entry.createdAtMs > TOKEN_TTL_MS) {
            store.remove(otpToken);
            log.debug("OtpCurrentToken 만료: ageMs={}", now - entry.createdAtMs);
            return Optional.empty();
        }
        if (!entry.userId.equals(userId)) {
            log.warn("OtpCurrentToken userId 불일치: expected={} actual={}", entry.userId, userId);
            return Optional.empty();
        }
        store.remove(otpToken);
        log.debug("OtpCurrentToken 검증·소비 완료: userId={}", userId);
        return Optional.of(entry.code);
    }

    @Override
    public void evictExpired() {
        long now = clock.millis();
        Iterator<Map.Entry<String, Entry>> it = store.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Entry> e = it.next();
            if (now - e.getValue().createdAtMs > TOKEN_TTL_MS) {
                it.remove();
            }
        }
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static final class Entry {
        private final Long userId;
        private final String code;
        private final long createdAtMs;

        Entry(Long userId, String code, long createdAtMs) {
            this.userId = userId;
            this.code = code;
            this.createdAtMs = createdAtMs;
        }
    }
}
