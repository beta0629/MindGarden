package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.dto.PaymentSource;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * PaymentSource fail-closed 매핑 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-03-18
 */
@DisplayName("PaymentSourceResolver")
class PaymentSourceResolverTest {

    @Test
    @DisplayName("PG Payment 행 + IAMPORT → ONLINE (CARD method와 무관)")
    void onlineWhenPgPaymentExists() {
        Payment payment = Payment.builder()
                .provider(Payment.PaymentProvider.IAMPORT)
                .build();
        PaymentSource source = PaymentSourceResolver.resolve(payment, false);
        assertThat(source).isEqualTo(PaymentSource.ONLINE);
    }

    @Test
    @DisplayName("Payment 없음 + admin method → MANUAL (CARD만으로 ONLINE 금지)")
    void manualWhenAdminMethodWithoutPayment() {
        PaymentSource source = PaymentSourceResolver.resolve(
                null,
                PaymentSourceResolver.hasAdminPaymentEvidence(
                        "CARD", ConsultantClientMapping.PaymentStatus.CONFIRMED));
        assertThat(source).isEqualTo(PaymentSource.MANUAL);
        assertThat(source).isNotEqualTo(PaymentSource.ONLINE);
    }

    @Test
    @DisplayName("Payment·admin 단서 없음 → UNKNOWN")
    void unknownWhenNoEvidence() {
        PaymentSource source = PaymentSourceResolver.resolve(null, false);
        assertThat(source).isEqualTo(PaymentSource.UNKNOWN);
    }

    @Test
    @DisplayName("reference만 있고 Payment 미조회·method 없음 → UNKNOWN")
    void unknownWhenOrphanReferenceWithoutMethod() {
        boolean evidence = PaymentSourceResolver.hasAdminPaymentEvidence(
                null, ConsultantClientMapping.PaymentStatus.PENDING);
        PaymentSource source = PaymentSourceResolver.resolve(null, evidence);
        assertThat(source).isEqualTo(PaymentSource.UNKNOWN);
    }

    @Test
    @DisplayName("shop order → ONLINE")
    void shopOrderIsOnline() {
        assertThat(PaymentSourceResolver.forShopOrder()).isEqualTo(PaymentSource.ONLINE);
    }
}
