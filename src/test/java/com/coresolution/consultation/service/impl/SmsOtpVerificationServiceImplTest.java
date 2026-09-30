package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import com.coresolution.consultation.dto.auth.SmsOtpSendStatus;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link SmsOtpVerificationServiceImpl} 단위 테스트 — 저장·5분 TTL·단일 사용 정책 검증.
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@DisplayName("SmsOtpVerificationServiceImpl OTP 저장·검증")
class SmsOtpVerificationServiceImplTest {

    private static final String PHONE = "01012345678";

    @Test
    @DisplayName("저장 후 즉시 verify → true 반환 & 다음 호출은 단일 사용으로 false")
    void storedCode_verifyAndConsume_singleUse() {
        Clock fixed = Clock.fixed(Instant.parse("2026-06-11T12:00:00Z"), ZoneOffset.UTC);
        SmsOtpVerificationServiceImpl service = new SmsOtpVerificationServiceImpl(fixed);
        service.storeCode(PHONE, "123456");

        assertThat(service.verifyAndConsume(PHONE, "123456")).isTrue();
        assertThat(service.verifyAndConsume(PHONE, "123456")).isFalse();
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
        SmsOtpVerificationServiceImpl service = new SmsOtpVerificationServiceImpl(movingClock);
        service.storeCode(PHONE, "654321");

        now[0] = t0 + SmsOtpVerificationServiceImpl.OTP_TTL_MS + 1L;

        assertThat(service.verifyAndConsume(PHONE, "654321")).isFalse();
    }

    @Test
    @DisplayName("코드 불일치 → false 반환 (단일 사용 정책 위배 없이 다음 정상 코드 가능)")
    void wrongCode_returnsFalse_keepsEntry() {
        Clock fixed = Clock.fixed(Instant.parse("2026-06-11T12:00:00Z"), ZoneOffset.UTC);
        SmsOtpVerificationServiceImpl service = new SmsOtpVerificationServiceImpl(fixed);
        service.storeCode(PHONE, "111111");

        assertThat(service.verifyAndConsume(PHONE, "000000")).isFalse();
        assertThat(service.verifyAndConsume(PHONE, "111111")).isTrue();
    }

    @Test
    @DisplayName("빈 입력 / 6자리 미만 코드 → 저장은 IllegalArgumentException, verify 는 false")
    void invalidInput_storeThrows_verifyReturnsFalse() {
        Clock fixed = Clock.fixed(Instant.parse("2026-06-11T12:00:00Z"), ZoneOffset.UTC);
        SmsOtpVerificationServiceImpl service = new SmsOtpVerificationServiceImpl(fixed);

        assertThatThrownBy(() -> service.storeCode(PHONE, "12345")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.storeCode("", "123456")).isInstanceOf(IllegalArgumentException.class);
        assertThat(service.verifyAndConsume(PHONE, "12345")).isFalse();
        assertThat(service.verifyAndConsume("", "123456")).isFalse();
        assertThat(service.verifyAndConsume(PHONE, null)).isFalse();
    }

    @Test
    @DisplayName("발송 상태 — 유효시간·재발송 대기·남은 시도, 실패할수록 남은 시도 감소")
    void sendStatus_reportsPolicy_andRemainingAttemptsDecrease() {
        Clock fixed = Clock.fixed(Instant.parse("2026-06-11T12:00:00Z"), ZoneOffset.UTC);
        SmsOtpVerificationServiceImpl service = new SmsOtpVerificationServiceImpl(fixed, 30L, 3, 600L);

        SmsOtpSendStatus initial = service.getSendStatus(PHONE);
        assertThat(initial.locked()).isFalse();
        assertThat(initial.retryAfterSeconds()).isNull();
        assertThat(initial.expiresInSeconds()).isEqualTo(SmsOtpVerificationServiceImpl.OTP_TTL_MS / 1000L);
        assertThat(initial.resendCooldownSeconds()).isEqualTo(30L);
        assertThat(initial.remainingAttempts()).isEqualTo(3);

        service.storeCode(PHONE, "111111");
        service.verifyAndConsume(PHONE, "000000");
        assertThat(service.getSendStatus(PHONE).remainingAttempts()).isEqualTo(2);
    }

    @Test
    @DisplayName("실패 한도 도달 → 잠김(코드 폐기·retryAfterSeconds), 잠김 해제 후 다시 사용 가능")
    void maxFailures_locksPhone_untilLockExpires() {
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
        SmsOtpVerificationServiceImpl service = new SmsOtpVerificationServiceImpl(movingClock, 30L, 2, 600L);
        service.storeCode(PHONE, "111111");

        assertThat(service.verifyAndConsume(PHONE, "000000")).isFalse();
        assertThat(service.verifyAndConsume(PHONE, "000001")).isFalse();
        assertThat(service.verifyAndConsume(PHONE, "111111")).isFalse();

        SmsOtpSendStatus locked = service.getSendStatus(PHONE);
        assertThat(locked.locked()).isTrue();
        assertThat(locked.remainingAttempts()).isZero();
        assertThat(locked.retryAfterSeconds()).isEqualTo(600L);

        now[0] = t0 + 600_000L + 1L;
        SmsOtpSendStatus released = service.getSendStatus(PHONE);
        assertThat(released.locked()).isFalse();
        assertThat(released.remainingAttempts()).isEqualTo(2);

        service.storeCode(PHONE, "222222");
        assertThat(service.verifyAndConsume(PHONE, "222222")).isTrue();
    }

    @Test
    @DisplayName("성공하면 실패 누적 초기화")
    void success_resetsFailures() {
        Clock fixed = Clock.fixed(Instant.parse("2026-06-11T12:00:00Z"), ZoneOffset.UTC);
        SmsOtpVerificationServiceImpl service = new SmsOtpVerificationServiceImpl(fixed, 30L, 3, 600L);
        service.storeCode(PHONE, "111111");
        service.verifyAndConsume(PHONE, "000000");
        assertThat(service.verifyAndConsume(PHONE, "111111")).isTrue();

        assertThat(service.getSendStatus(PHONE).remainingAttempts()).isEqualTo(3);
    }
}
