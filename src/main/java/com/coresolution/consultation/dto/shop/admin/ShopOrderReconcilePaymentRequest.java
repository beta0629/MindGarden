package com.coresolution.consultation.dto.shop.admin;

import com.coresolution.consultation.constant.ShopOrderReconcileConstants;
import jakarta.validation.constraints.Size;

/**
 * 어드민 쇼핑 주문 PortOne 결제 정합 요청.
 * <p>
 * {@code paymentId} 또는 {@code cardApprovalNumber} 중 하나 이상 필요 (서비스에서 검증).
 * </p>
 *
 * @author MindGarden
 * @since 2026-09-17
 */
public record ShopOrderReconcilePaymentRequest(
        @Size(max = ShopOrderReconcileConstants.PAYMENT_ID_MAX_LENGTH) String paymentId,
        @Size(max = ShopOrderReconcileConstants.CARD_APPROVAL_NUMBER_MAX_LENGTH) String cardApprovalNumber
) {
}
