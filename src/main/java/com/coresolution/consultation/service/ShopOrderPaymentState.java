package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.entity.Payment;

/**
 * 쇼핑 주문·결제 건의 커밋된 최신 상태 스냅샷 (응답 조립용, 엔티티 캐시와 무관).
 *
 * @param orderStatus   주문 상태
 * @param paymentStatus 결제 건 상태 (결제 건이 없으면 null)
 * @author MindGarden
 * @since 2026-09-30
 */
public record ShopOrderPaymentState(ShopClientOrderStatus orderStatus, Payment.PaymentStatus paymentStatus) {
}
