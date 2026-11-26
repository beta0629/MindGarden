package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 통일 멱등 키 팩토리 검증.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@DisplayName("ClientEventIdempotencyKeys")
class ClientEventIdempotencyKeysTest {

    @Test
    @DisplayName("통일 형식: TYPE:tenant:kind:id")
    void unifiedFormats() {
        assertThat(ClientEventIdempotencyKeys.forPayment(
                        ClientEventType.PAYMENT_COMPLETED, "t1", 3L))
                .isEqualTo("PAYMENT_COMPLETED:t1:payment:3");
        assertThat(ClientEventIdempotencyKeys.forMapping(
                        ClientEventType.MAPPING_CREATED, "t1", 9L))
                .isEqualTo("MAPPING_CREATED:t1:mapping:9");
        assertThat(ClientEventIdempotencyKeys.forSchedule(
                        ClientEventType.SCHEDULE_CREATED, "t1", 8L))
                .isEqualTo("SCHEDULE_CREATED:t1:schedule:8");
        assertThat(ClientEventIdempotencyKeys.forSession(
                        ClientEventType.SESSION_DEDUCTED, "t1", 88L, 12L))
                .isEqualTo("SESSION_DEDUCTED:t1:schedule:88");
        assertThat(ClientEventIdempotencyKeys.forSession(
                        ClientEventType.SESSION_DEDUCTED, "t1", null, 12L))
                .isEqualTo("SESSION_DEDUCTED:t1:ccmh:12");
        assertThat(ClientEventIdempotencyKeys.forSchedule(
                        ClientEventType.MAPPING_REASSIGNED, "t1", 5L))
                .isEqualTo("MAPPING_REASSIGNED:t1:schedule:5");
    }

    @Test
    @DisplayName("tenantId 누락 시 예외")
    void requiresTenantId() {
        assertThatThrownBy(() -> ClientEventIdempotencyKeys.forMapping(
                        ClientEventType.MAPPING_CREATED, " ", 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tenantId");
    }

    @Test
    @DisplayName("롤백 후보: 레거시 BACKFILL: + 통일 패턴")
    void rollbackEligible() {
        assertThat(ClientEventIdempotencyKeys.isLegacyBackfillKey(
                        "BACKFILL:MAPPING_CREATED:t1:9"))
                .isTrue();
        assertThat(ClientEventIdempotencyKeys.isRollbackEligibleKey(
                        "MAPPING_CREATED:t1:mapping:9", "t1"))
                .isTrue();
        assertThat(ClientEventIdempotencyKeys.isRollbackEligibleKey(
                        "MAPPING_CREATED:other:mapping:9", "t1"))
                .isFalse();
        assertThat(ClientEventIdempotencyKeys.isRollbackEligibleKey(
                        "PAYMENT_COMPLETED:payment:3", "t1"))
                .isFalse();
    }
}
