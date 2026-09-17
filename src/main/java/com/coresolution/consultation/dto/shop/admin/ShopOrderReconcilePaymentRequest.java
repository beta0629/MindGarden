package com.coresolution.consultation.dto.shop.admin;

import com.coresolution.consultation.constant.ShopOrderReconcileConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 어드민 쇼핑 주문 PortOne 결제 정합 요청.
 *
 * @author MindGarden
 * @since 2026-09-17
 */
public record ShopOrderReconcilePaymentRequest(
        @NotBlank @Size(max = ShopOrderReconcileConstants.PAYMENT_ID_MAX_LENGTH) String paymentId
) {
}
