package com.coresolution.consultation.util;

import com.coresolution.consultation.dto.PaymentSource;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import org.springframework.util.StringUtils;

/**
 * 결제 채널 fail-closed 판정.
 *
 * <p>{@code paymentMethod == CARD} 만으로 ONLINE 판정하지 않는다.
 * SSOT: {@code docs/project-management/PAYMENT_SOURCE_ONLINE_MANUAL_MAPPING_RULES_20260318.md}</p>
 *
 * @author MindGarden
 * @since 2026-03-18
 */
public final class PaymentSourceResolver {

    private PaymentSourceResolver() {
    }

    /**
     * PG provider 여부. {@link Payment.PaymentProvider} 값은 모두 PG 슬롯이다.
     *
     * @param provider 결제 대행사
     * @return PG이면 true
     */
    public static boolean isPgProvider(Payment.PaymentProvider provider) {
        return provider != null;
    }

    /**
     * Payment 행 + 어드민 결제 단서로 채널을 판정한다.
     *
     * @param payment                 payments 행 (nullable)
     * @param hasAdminPaymentEvidence 어드민 등록 단서 (method/확정 상태 등)
     * @return ONLINE / MANUAL / UNKNOWN
     */
    public static PaymentSource resolve(Payment payment, boolean hasAdminPaymentEvidence) {
        if (payment != null) {
            if (isPgProvider(payment.getProvider())) {
                return PaymentSource.ONLINE;
            }
            return PaymentSource.UNKNOWN;
        }
        if (hasAdminPaymentEvidence) {
            return PaymentSource.MANUAL;
        }
        return PaymentSource.UNKNOWN;
    }

    /**
     * 매핑 행 단서 — method 또는 확정계 paymentStatus. reference만으로는 MANUAL 금지.
     *
     * @param paymentMethod 결제 수단 코드
     * @param paymentStatus 매핑 결제 상태
     * @return 어드민 단서 있으면 true
     */
    public static boolean hasAdminPaymentEvidence(
            String paymentMethod,
            ConsultantClientMapping.PaymentStatus paymentStatus) {
        if (StringUtils.hasText(paymentMethod)) {
            return true;
        }
        if (paymentStatus == null) {
            return false;
        }
        return paymentStatus == ConsultantClientMapping.PaymentStatus.CONFIRMED
                || paymentStatus == ConsultantClientMapping.PaymentStatus.APPROVED
                || paymentStatus == ConsultantClientMapping.PaymentStatus.PAY
                || paymentStatus == ConsultantClientMapping.PaymentStatus.DEP;
    }

    /**
     * 회기추가 등 method 문자열만 있는 경우.
     *
     * @param paymentMethod 결제 수단
     * @return method가 있으면 true
     */
    public static boolean hasAdminPaymentEvidence(String paymentMethod) {
        return StringUtils.hasText(paymentMethod);
    }

    /**
     * 쇼핑 주문 목록 — PG/checkout 경로이므로 ONLINE.
     *
     * @return {@link PaymentSource#ONLINE}
     */
    public static PaymentSource forShopOrder() {
        return PaymentSource.ONLINE;
    }

    /**
     * Payment 엔티티만으로 채널 추론 (PaymentResponse용).
     *
     * @param payment 결제
     * @return ONLINE 또는 UNKNOWN
     */
    public static PaymentSource fromPaymentEntity(Payment payment) {
        if (payment == null) {
            return PaymentSource.UNKNOWN;
        }
        return resolve(payment, false);
    }
}
