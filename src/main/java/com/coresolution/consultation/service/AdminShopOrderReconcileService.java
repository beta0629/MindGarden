package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.admin.ShopOrderReconcilePaymentResponse;

/**
 * 어드민 쇼핑 주문 PortOne 결제 정합(reconcile).
 * <p>
 * 웹훅이 매칭하지 못한 미결제·만료 주문에 대해 Ops 가 아는 PortOne {@code paymentId}
 * 또는 카드 승인번호({@code cardApprovalNumber})로 V2 검증 후
 * 웹훅/verify 와 동일 SSOT({@code Payment APPROVED} → 주문 {@code PAID})로 반영한다.
 * </p>
 *
 * @author MindGarden
 * @since 2026-09-17
 */
public interface AdminShopOrderReconcileService {

    /**
     * PortOne V2 검증 후 결제 APPROVED·주문 PAID 정합.
     * <p>
     * {@code EXPIRED} 이어도 PortOne 이 PAID 이고 금액이 일치하면 복구한다.
     * {@code paymentId} 가 없으면 {@code cardApprovalNumber} 로 PortOne 다건 조회 후 paymentId 를 해석한다.
     * </p>
     *
     * @param tenantId             테넌트 ID ({@code TenantContextHolder} 와 동일 소스 — body 신뢰 금지)
     * @param orderPublicId        주문 공개 ID
     * @param paymentId            PortOne 결제 ID (nullable — 승인번호로 대체 가능)
     * @param cardApprovalNumber   카드 승인번호 (nullable — paymentId 로 대체 가능)
     * @return 정합 결과
     */
    ShopOrderReconcilePaymentResponse reconcilePayment(
            String tenantId, String orderPublicId, String paymentId, String cardApprovalNumber);
}
