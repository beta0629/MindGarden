package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

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
    @DisplayName("ofAction / forMappingAction: TYPE:tenant:kind:id:actionUnit")
    void actionUnitFormats() {
        assertThat(ClientEventIdempotencyKeys.ofAction(
                        ClientEventType.SESSION_ADJUSTED, "t1", "mapping", 9L, "rem8-u2_rem5-u2"))
                .isEqualTo("SESSION_ADJUSTED:t1:mapping:9:rem8-u2_rem5-u2");
        assertThat(ClientEventIdempotencyKeys.forMappingAction(
                        ClientEventType.PAYMENT_COMPLETED,
                        "t1",
                        9L,
                        "ref:REF-1:amt:90000"))
                .isEqualTo("PAYMENT_COMPLETED:t1:mapping:9:ref:REF-1:amt:90000");
        assertThat(ClientEventIdempotencyKeys.sessionAdjustedActionUnit(8, 2, 5, 2))
                .isEqualTo("rem8-u2_rem5-u2");
        assertThat(ClientEventIdempotencyKeys.sessionAdjustedActionUnit(null, null, 1, 0))
                .isEqualTo("remn-un_rem1-u0");
        assertThat(ClientEventIdempotencyKeys.paymentCompletedActionUnit("REF-1", new BigDecimal("90000.00")))
                .isEqualTo("ref:REF-1:amt:90000");
        assertThat(ClientEventIdempotencyKeys.paymentCompletedActionUnit(null, null))
                .isEqualTo("ref:noref:amt:n");
        assertThat(ClientEventIdempotencyKeys.paymentRefundedActionUnit(new BigDecimal("50000"), null))
                .isEqualTo("amt:50000:r:");
        String withReason = ClientEventIdempotencyKeys.paymentRefundedActionUnit(
                new BigDecimal("10000"), "부분환불");
        assertThat(withReason).startsWith("amt:10000:r:");
        assertThat(withReason.length()).isGreaterThan("amt:10000:r:".length());
    }

    @Test
    @DisplayName("동일 SESSION_ADJUSTED fingerprint · 다른 정정은 다른 키")
    void sessionAdjustedFingerprintStableAndDistinct() {
        String first = ClientEventIdempotencyKeys.forMappingAction(
                ClientEventType.SESSION_ADJUSTED,
                "t1",
                9L,
                ClientEventIdempotencyKeys.sessionAdjustedActionUnit(8, 2, 5, 2));
        String retry = ClientEventIdempotencyKeys.forMappingAction(
                ClientEventType.SESSION_ADJUSTED,
                "t1",
                9L,
                ClientEventIdempotencyKeys.sessionAdjustedActionUnit(8, 2, 5, 2));
        String other = ClientEventIdempotencyKeys.forMappingAction(
                ClientEventType.SESSION_ADJUSTED,
                "t1",
                9L,
                ClientEventIdempotencyKeys.sessionAdjustedActionUnit(5, 2, 3, 2));
        assertThat(first).isEqualTo(retry);
        assertThat(first).isNotEqualTo(other);
    }

    @Test
    @DisplayName("tenantId 누락 시 예외")
    void requiresTenantId() {
        assertThatThrownBy(() -> ClientEventIdempotencyKeys.forMapping(
                        ClientEventType.MAPPING_CREATED, " ", 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tenantId");
        assertThatThrownBy(() -> ClientEventIdempotencyKeys.ofAction(
                        ClientEventType.SESSION_ADJUSTED, "t1", "mapping", 1L, " "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("actionUnit");
    }

    @Test
    @DisplayName("롤백 후보: 레거시 BACKFILL: + 통일 패턴(+ optional actionUnit)")
    void rollbackEligible() {
        assertThat(ClientEventIdempotencyKeys.isLegacyBackfillKey(
                        "BACKFILL:MAPPING_CREATED:t1:9"))
                .isTrue();
        assertThat(ClientEventIdempotencyKeys.isRollbackEligibleKey(
                        "MAPPING_CREATED:t1:mapping:9", "t1"))
                .isTrue();
        assertThat(ClientEventIdempotencyKeys.matchesUnifiedPattern(
                        "SESSION_ADJUSTED:t1:mapping:9:rem8-u2_rem5-u2", "t1"))
                .isTrue();
        assertThat(ClientEventIdempotencyKeys.matchesUnifiedPattern(
                        "PAYMENT_COMPLETED:t1:mapping:9:ref:REF-1:amt:90000", "t1"))
                .isTrue();
        assertThat(ClientEventIdempotencyKeys.isRollbackEligibleKey(
                        "MAPPING_CREATED:other:mapping:9", "t1"))
                .isFalse();
        assertThat(ClientEventIdempotencyKeys.isRollbackEligibleKey(
                        "PAYMENT_COMPLETED:payment:3", "t1"))
                .isFalse();
    }
}
