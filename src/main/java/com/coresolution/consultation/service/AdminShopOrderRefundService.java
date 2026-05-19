package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundResponse;

/**
 * 어드민 쇼핑 주문 전액 환불(이행 전 MVP).
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public interface AdminShopOrderRefundService {

    /**
     * PAID 주문 전액 환불 — 포인트 복원·적립 clawback·주문 REFUNDED. 멱등(이미 REFUNDED면 동일 응답).
     *
     * @param tenantId      테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @param reasonCode    환불 사유 코드
     * @return 환불 결과
     */
    ShopOrderRefundResponse refundPaidOrder(String tenantId, String orderPublicId, String reasonCode);
}
