package com.coresolution.consultation.dto.shop.admin;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.entity.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 쇼핑 주문 PortOne 결제 정합 결과.
 *
 * @author MindGarden
 * @since 2026-09-17
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderReconcilePaymentResponse {

    private String orderPublicId;
    private String paymentId;
    private ShopClientOrderStatus orderStatus;
    private Payment.PaymentStatus paymentStatus;
    /**
     * {@code EXPIRED} 주문이 PortOne 검증 후 {@code PAID} 로 복구되었으면 {@code true}.
     */
    private boolean recovered;
}
