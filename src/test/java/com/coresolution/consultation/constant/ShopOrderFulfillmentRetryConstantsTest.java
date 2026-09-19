package com.coresolution.consultation.constant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ShopOrderFulfillmentRetryConstants#isRetryableFailed} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-09-19
 */
@DisplayName("ShopOrderFulfillmentRetryConstants")
class ShopOrderFulfillmentRetryConstantsTest {

    @Test
    @DisplayName("ERP sync FAILED 메시지 — retryable true")
    void isRetryableFailed_erpSyncFailedMessage_true() {
        assertTrue(ShopOrderFulfillmentRetryConstants.isRetryableFailed(
                ShopOrderFulfillmentStatus.FAILED,
                ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED));
    }

    @Test
    @DisplayName("COMPLETED — false")
    void isRetryableFailed_completed_false() {
        assertFalse(ShopOrderFulfillmentRetryConstants.isRetryableFailed(
                ShopOrderFulfillmentStatus.COMPLETED,
                ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED));
    }

    @Test
    @DisplayName("FAILED 이지만 retryable 없음 — false")
    void isRetryableFailed_failedWithoutMarker_false() {
        assertFalse(ShopOrderFulfillmentRetryConstants.isRetryableFailed(
                ShopOrderFulfillmentStatus.FAILED,
                "Consultation ERP sync failed permanently"));
    }

    @Test
    @DisplayName("status/message null — false")
    void isRetryableFailed_nulls_false() {
        assertFalse(ShopOrderFulfillmentRetryConstants.isRetryableFailed(null, null));
        assertFalse(ShopOrderFulfillmentRetryConstants.isRetryableFailed(
                ShopOrderFulfillmentStatus.FAILED, null));
        assertFalse(ShopOrderFulfillmentRetryConstants.isRetryableFailed(
                null, ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED));
    }
}
