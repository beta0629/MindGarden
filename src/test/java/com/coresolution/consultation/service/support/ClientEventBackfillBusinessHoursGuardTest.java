package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import com.coresolution.consultation.config.ClientEventBackfillProperties;
import com.coresolution.consultation.constant.ClientEventBackfillConstants;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * CLI 운영시간 창 가드 — KST 11≤h&lt;20 거부.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@DisplayName("ClientEventBackfillBusinessHoursGuard")
class ClientEventBackfillBusinessHoursGuardTest {

    private ClientEventBackfillProperties properties;
    private ClientEventBackfillBusinessHoursGuard guard;

    @BeforeEach
    void setUp() {
        properties = new ClientEventBackfillProperties();
        properties.setZone(ClientEventBackfillConstants.DEFAULT_ZONE);
        properties.setBlockedHourStart(ClientEventBackfillConstants.DEFAULT_BLOCKED_HOUR_START);
        properties.setBlockedHourEnd(ClientEventBackfillConstants.DEFAULT_BLOCKED_HOUR_END);
        guard = new ClientEventBackfillBusinessHoursGuard(properties);
    }

    @Test
    @DisplayName("KST 11:00 → 거부")
    void rejectsAtElevenKst() {
        // 2026-11-26 11:00 KST = 02:00 UTC
        guard.useClock(Clock.fixed(
                Instant.parse("2026-11-26T02:00:00Z"), ZoneId.of("UTC")));
        assertThatThrownBy(guard::requireOutsideBlockedWindow)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("business hours");
    }

    @Test
    @DisplayName("KST 19:59 → 거부")
    void rejectsAtNineteenFiftyNineKst() {
        guard.useClock(Clock.fixed(
                Instant.parse("2026-11-26T10:59:00Z"), ZoneId.of("UTC")));
        assertThatThrownBy(guard::requireOutsideBlockedWindow)
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("KST 10:59 → 허용")
    void allowsBeforeEleven() {
        guard.useClock(Clock.fixed(
                Instant.parse("2026-11-26T01:59:00Z"), ZoneId.of("UTC")));
        assertThatCode(guard::requireOutsideBlockedWindow).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("KST 20:00 → 허용")
    void allowsAtTwenty() {
        guard.useClock(Clock.fixed(
                Instant.parse("2026-11-26T11:00:00Z"), ZoneId.of("UTC")));
        assertThatCode(guard::requireOutsideBlockedWindow).doesNotThrowAnyException();
    }
}
