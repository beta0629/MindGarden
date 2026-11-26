package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 백필 상수·멱등 키(통일 형식)·모드 검증.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@DisplayName("ClientEventBackfillConstants")
class ClientEventBackfillConstantsTest {

    @Test
    @DisplayName("idempotency 키 포맷(통일, BACKFILL: 접두 없음)")
    void idempotencyKeyFormats() {
        assertThat(ClientEventBackfillConstants.idempotencyMappingCreated("t1", 9L))
                .isEqualTo("MAPPING_CREATED:t1:mapping:9");
        assertThat(ClientEventBackfillConstants.idempotencyPaymentCompleted("t1", 3L))
                .isEqualTo("PAYMENT_COMPLETED:t1:payment:3");
        assertThat(ClientEventBackfillConstants.idempotencyPaymentCancelled("t1", 3L))
                .isEqualTo("PAYMENT_CANCELLED:t1:payment:3");
        assertThat(ClientEventBackfillConstants.idempotencyPaymentRefunded("t1", 3L))
                .isEqualTo("PAYMENT_REFUNDED:t1:payment:3");
        assertThat(ClientEventBackfillConstants.idempotencySchedule(
                        "t1", ClientEventType.SCHEDULE_CREATED, 8L))
                .isEqualTo("SCHEDULE_CREATED:t1:schedule:8");
        assertThat(ClientEventBackfillConstants.idempotencyHistory(
                        "t1", ClientEventType.SESSION_DEDUCTED, 12L))
                .isEqualTo("SESSION_DEDUCTED:t1:ccmh:12");
    }

    @Test
    @DisplayName("mode fromCode 기본값 dry-run · rollback")
    void modeFromCode() {
        assertThat(ClientEventBackfillMode.fromCode(null)).isEqualTo(ClientEventBackfillMode.DRY_RUN);
        assertThat(ClientEventBackfillMode.fromCode("apply")).isEqualTo(ClientEventBackfillMode.APPLY);
        assertThat(ClientEventBackfillMode.fromCode("DRY-RUN")).isEqualTo(ClientEventBackfillMode.DRY_RUN);
        assertThat(ClientEventBackfillMode.fromCode("rollback"))
                .isEqualTo(ClientEventBackfillMode.ROLLBACK);
    }

    @Test
    @DisplayName("공유 시크릿 헤더·env·CLI confirm 상수")
    void backfillTokenConstants() {
        assertThat(ClientEventBackfillConstants.BACKFILL_TOKEN_HEADER)
                .isEqualTo("X-Client-Event-Backfill-Token");
        assertThat(ClientEventBackfillConstants.BACKFILL_TOKEN_ENV)
                .isEqualTo("CLIENT_EVENT_BACKFILL_TOKEN");
        assertThat(ClientEventBackfillConstants.API_PATH)
                .isEqualTo("/api/v1/admin/client-events/backfill");
        assertThat(ClientEventBackfillConstants.CONFIRM_APPLY).isEqualTo("APPLY");
        assertThat(ClientEventBackfillConstants.CONFIRM_ROLLBACK).isEqualTo("ROLLBACK");
        assertThat(ClientEventBackfillConstants.IDEMPOTENCY_PREFIX).isEqualTo("BACKFILL:");
    }
}
