package com.coresolution.consultation.service.impl;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * {@link OtpCurrentTokenServiceImpl} 단위 테스트.
 *
 * <p>2026-06-11 PR #224 후속 — push body 평문 OTP 차단 정책의 1회 조회 토큰 SSOT 검증:
 * <ul>
 *   <li>발급 후 TTL 내 + userId 일치 → 1회 OTP 반환, 즉시 invalidate.</li>
 *   <li>TTL(5분) 경과 후 → 빈 결과 + 메모리 정리.</li>
 *   <li>userId 불일치 → 빈 결과 (다른 사용자가 토큰 가로채도 무용).</li>
 *   <li>blank/null otpToken or userId → 빈 결과.</li>
 *   <li>1회 사용 — 동일 토큰 두 번째 조회 시 빈 결과.</li>
 *   <li>발급 입력 검증 — userId null 또는 OTP 형식 비정상 시 IllegalArgumentException.</li>
 * </ul></p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
class OtpCurrentTokenServiceImplTest {

    private static final Long USER_ID = 42L;
    private static final Long OTHER_USER_ID = 99L;
    private static final String CODE = "123456";

    @Test
    @DisplayName("발급 후 TTL 내 + userId 일치 → OTP 반환, 즉시 invalidate")
    void issueAndFetch_withinTtl_returnsOtp_andInvalidates() {
        MutableClock clock = new MutableClock(Instant.parse("2026-06-11T00:00:00Z"));
        OtpCurrentTokenServiceImpl sut = new OtpCurrentTokenServiceImpl(clock);

        String token = sut.issue(USER_ID, CODE);
        clock.advanceMs(60_000); // 1분 경과

        Optional<String> result = sut.fetchAndConsume(token, USER_ID);

        assertThat(result).contains(CODE);
        assertThat(sut.fetchAndConsume(token, USER_ID))
                .as("두 번째 조회는 빈 결과 — 1회 사용 정책")
                .isEmpty();
    }

    @Test
    @DisplayName("TTL(5분) 경과 후 → 빈 결과 + 메모리에서 제거")
    void fetch_whenExpired_returnsEmpty() {
        MutableClock clock = new MutableClock(Instant.parse("2026-06-11T00:00:00Z"));
        OtpCurrentTokenServiceImpl sut = new OtpCurrentTokenServiceImpl(clock);

        String token = sut.issue(USER_ID, CODE);
        clock.advanceMs(OtpCurrentTokenServiceImpl.TOKEN_TTL_MS + 1L);

        assertThat(sut.fetchAndConsume(token, USER_ID)).isEmpty();
    }

    @Test
    @DisplayName("userId 불일치 → 빈 결과 (다른 사용자가 토큰을 가로채도 무용)")
    void fetch_whenUserIdMismatch_returnsEmpty_andDoesNotConsume() {
        MutableClock clock = new MutableClock(Instant.parse("2026-06-11T00:00:00Z"));
        OtpCurrentTokenServiceImpl sut = new OtpCurrentTokenServiceImpl(clock);

        String token = sut.issue(USER_ID, CODE);

        assertThat(sut.fetchAndConsume(token, OTHER_USER_ID)).isEmpty();
        assertThat(sut.fetchAndConsume(token, USER_ID))
                .as("불일치 조회는 토큰을 소비하지 않으므로 본인은 여전히 조회 가능")
                .contains(CODE);
    }

    @Test
    @DisplayName("blank/null 입력 → 빈 결과 (NPE 방지)")
    void fetch_whenBlankInputs_returnsEmpty() {
        OtpCurrentTokenServiceImpl sut = new OtpCurrentTokenServiceImpl();

        assertThat(sut.fetchAndConsume(null, USER_ID)).isEmpty();
        assertThat(sut.fetchAndConsume("", USER_ID)).isEmpty();
        assertThat(sut.fetchAndConsume("any", null)).isEmpty();
    }

    @Test
    @DisplayName("발급 시 userId null 또는 OTP 6자리 미만 → IllegalArgumentException")
    void issue_whenInvalidInputs_throws() {
        OtpCurrentTokenServiceImpl sut = new OtpCurrentTokenServiceImpl();

        assertThatThrownBy(() -> sut.issue(null, CODE))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> sut.issue(USER_ID, "12345"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> sut.issue(USER_ID, "abcdef"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("evictExpired 는 만료 항목만 정리한다")
    void evictExpired_removesOnlyExpired() {
        MutableClock clock = new MutableClock(Instant.parse("2026-06-11T00:00:00Z"));
        OtpCurrentTokenServiceImpl sut = new OtpCurrentTokenServiceImpl(clock);

        String oldToken = sut.issue(USER_ID, CODE);
        clock.advanceMs(OtpCurrentTokenServiceImpl.TOKEN_TTL_MS + 1L);
        String freshToken = sut.issue(USER_ID, "999111");

        sut.evictExpired();

        assertThat(sut.fetchAndConsume(oldToken, USER_ID)).isEmpty();
        assertThat(sut.fetchAndConsume(freshToken, USER_ID)).contains("999111");
    }

    /** 테스트 전용 mutable Clock. */
    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant initial) {
            this.now = initial;
        }

        void advanceMs(long ms) {
            this.now = this.now.plusMillis(ms);
        }

        @Override
        public ZoneId getZone() { return ZoneId.of("UTC"); }

        @Override
        public Clock withZone(ZoneId zone) { return this; }

        @Override
        public Instant instant() { return now; }
    }
}
