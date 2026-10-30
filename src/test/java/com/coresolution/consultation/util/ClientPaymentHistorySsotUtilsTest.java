package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.MappingStatusConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ClientPaymentHistorySsotUtils} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-18
 */
@DisplayName("ClientPaymentHistorySsotUtils")
class ClientPaymentHistorySsotUtilsTest {

    @Test
    @DisplayName("resolveAmount — pgAmount 우선")
    void resolveAmount_prefersPgAmount() {
        Map<String, Object> row = new HashMap<>();
        row.put("pgAmount", 100_000L);
        row.put("paymentAmount", 1L);
        row.put("packagePrice", 10_000L);
        assertThat(ClientPaymentHistorySsotUtils.resolveAmount(row)).isEqualTo(100_000L);
    }

    @Test
    @DisplayName("isRefundedOrCancelled — effectivePaymentStatus REFUNDED")
    void isRefundedOrCancelled_effectiveRefunded() {
        Map<String, Object> row = new HashMap<>();
        row.put("effectivePaymentStatus", "REFUNDED");
        row.put("packagePrice", 10_000L);
        assertThat(ClientPaymentHistorySsotUtils.isRefundedOrCancelled(row)).isTrue();
    }

    @Test
    @DisplayName("isRefundedOrCancelled — orderStatus CANCELLED")
    void isRefundedOrCancelled_orderCancelled() {
        Map<String, Object> row = new HashMap<>();
        row.put("orderStatus", "CANCELLED");
        assertThat(ClientPaymentHistorySsotUtils.isRefundedOrCancelled(row)).isTrue();
    }

    @Test
    @DisplayName("isRefundedOrCancelled — 대기 PENDING 은 false")
    void isRefundedOrCancelled_pendingFalse() {
        Map<String, Object> row = new HashMap<>();
        row.put("effectivePaymentStatus", "PENDING");
        row.put("pgAmount", 100_000L);
        assertThat(ClientPaymentHistorySsotUtils.isRefundedOrCancelled(row)).isFalse();
    }

    @Test
    @DisplayName("isRefundedOrCancelledPaymentStatus(String) — REFUNDED/CANCELLED true · PENDING/null false")
    void isRefundedOrCancelledPaymentStatus_string() {
        assertThat(ClientPaymentHistorySsotUtils.isRefundedOrCancelledPaymentStatus(
                MappingStatusConstants.REFUNDED)).isTrue();
        assertThat(ClientPaymentHistorySsotUtils.isRefundedOrCancelledPaymentStatus(
                MappingStatusConstants.CANCELLED)).isTrue();
        assertThat(ClientPaymentHistorySsotUtils.isRefundedOrCancelledPaymentStatus(
                MappingStatusConstants.PENDING)).isFalse();
        assertThat(ClientPaymentHistorySsotUtils.isRefundedOrCancelledPaymentStatus((String) null))
                .isFalse();
    }

    @Test
    @DisplayName("isRefundedOrCancelledPaymentStatus(PaymentStatus) — REFUNDED true · PENDING/null false")
    void isRefundedOrCancelledPaymentStatus_enum() {
        assertThat(ClientPaymentHistorySsotUtils.isRefundedOrCancelledPaymentStatus(
                PaymentStatus.REFUNDED)).isTrue();
        assertThat(ClientPaymentHistorySsotUtils.isRefundedOrCancelledPaymentStatus(
                PaymentStatus.PENDING)).isFalse();
        assertThat(ClientPaymentHistorySsotUtils.isRefundedOrCancelledPaymentStatus(
                (PaymentStatus) null)).isFalse();
    }
}
