package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link EmailOtpVerificationServiceImpl} 단위 테스트 — 저장·5분 TTL·단일 사용 정책 검증.
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@DisplayName("EmailOtpVerificationServiceImpl OTP 저장·검증")
class EmailOtpVerificationServiceImplTest {

    private static final String EMAIL = "user@example.com";

    @Test
    @DisplayName("저장 후 즉시 verify → true 반환 & 다음 호출은 단일 사용으로 false")
    void storedCode_verifyAndConsume_singleUse() {
        Clock fixed = Clock.fixed(Instant.parse("2026-06-11T12:00:00Z"), ZoneOffset.UTC);
        EmailOtpVerificationServiceImpl service = new EmailOtpVerificationServiceImpl(fixed);
        service.storeCode(EMAIL, "123456");

        assertThat(service.verifyAndConsume(EMAIL, "123456")).isTrue();
        assertThat(service.verifyAndConsume(EMAIL, "123456")).isFalse();
    }

    @Test
    @DisplayName("TTL 5분 초과 시 verify → false 반환 & 만료 항목 제거")
    void expiredAfterTtl_returnsFalse() {
        long t0 = Instant.parse("2026-06-11T12:00:00Z").toEpochMilli();
        long[] now = { t0 };
        Clock movingClock = new Clock() {
            @Override
            public Instant instant() { return Instant.ofEpochMilli(now[0]); }
            @Override
            public java.time.ZoneId getZone() { return ZoneOffset.UTC; }
            @Override
            public Clock withZone(java.time.ZoneId zone) { return this; }
            @Override
            public long millis() { return now[0]; }
        };
        EmailOtpVerificationServiceImpl service = new EmailOtpVerificationServiceImpl(movingClock);
        service.storeCode(EMAIL, "654321");

        now[0] = t0 + EmailOtpVerificationServiceImpl.OTP_TTL_MS + 1L;

        assertThat(service.verifyAndConsume(EMAIL, "654321")).isFalse();
    }

    @Test
    @DisplayName("코드 불일치 → false 반환 (단일 사용 정책 위배 없이 다음 정상 코드 가능)")
    void wrongCode_returnsFalse_keepsEntry() {
        Clock fixed = Clock.fixed(Instant.parse("2026-06-11T12:00:00Z"), ZoneOffset.UTC);
        EmailOtpVerificationServiceImpl service = new EmailOtpVerificationServiceImpl(fixed);
        service.storeCode(EMAIL, "111111");

        assertThat(service.verifyAndConsume(EMAIL, "000000")).isFalse();
        assertThat(service.verifyAndConsume(EMAIL, "111111")).isTrue();
    }

    @Test
    @DisplayName("빈 입력 / 6자리 미만 코드 → 저장은 IllegalArgumentException, verify 는 false")
    void invalidInput_storeThrows_verifyReturnsFalse() {
        Clock fixed = Clock.fixed(Instant.parse("2026-06-11T12:00:00Z"), ZoneOffset.UTC);
        EmailOtpVerificationServiceImpl service = new EmailOtpVerificationServiceImpl(fixed);

        assertThatThrownBy(() -> service.storeCode(EMAIL, "12345"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.storeCode("", "123456"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(service.verifyAndConsume(EMAIL, "12345")).isFalse();
        assertThat(service.verifyAndConsume("", "123456")).isFalse();
        assertThat(service.verifyAndConsume(EMAIL, null)).isFalse();
    }
}
