package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.admin.ShopOrderReconcilePaymentResponse;

/**
 * 어드민 쇼핑 주문 PortOne 결제 정합(reconcile).
 * <p>
 * 웹훅이 매칭하지 못한 미결제·만료 주문에 대해 Ops 가 아는 PortOne {@code paymentId}
 * 또는 카드 승인번호({@code cardApprovalNumber})로 V2 검증 후
 * 웹훅/verify 와 동일 SSOT({@code Payment APPROVED} → 주문 {@code PAID})로 반영한다.
 * </p>
 * <p>
 * PortOne 취소는 됐으나 Clinic 이 APPROVED/PAID 로 남은 경우
 * {@link #reconcileRefund} 로 PG cancel 없이 clinic 환불 체인을 맞춘다.
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

    /**
     * PortOne 이미 취소된 결제에 대해 Clinic 환불 체인만 정합한다 (PG cancel 생략).
     * <p>
     * PortOne status 가 CANCELLED/PARTIAL_CANCELLED 이면
     * {@code PaymentService.refundPayment} 또는 {@code updatePaymentStatus(REFUNDED/CANCELLED)}
     * → {@code reconcileOrderOnPaymentCancelOrRefund}
     * → {@code reversePaidOrderFulfillment}(회기·EXPENSE·주문 REFUNDED).
     * 이미 REFUNDED 이면 멱등 수리.
     * </p>
     *
     * @param tenantId      테넌트 ID (fail-closed)
     * @param orderPublicId 주문 공개 ID
     * @return 정합 결과 ({@code recovered=true} 이면 APPROVED/PAID 불일치에서 복구)
     */
    default ShopOrderReconcilePaymentResponse reconcileRefund(String tenantId, String orderPublicId) {
        return reconcileRefund(tenantId, orderPublicId, false);
    }

    /**
     * PortOne 기취소 Clinic 환불 정합.
     * <p>
     * {@code force=false}(기본): PortOne CANCELLED/PARTIAL_CANCELLED 아니면 fail-closed.
     * {@code force=true}(ADMIN): PortOne 이 PAID 여도 관리자 기취소 attest 로 PG cancel 생략 후
     * clinic 체인 실행. 감사 로그 필수.
     * </p>
     *
     * @param tenantId      테넌트 ID (fail-closed)
     * @param orderPublicId 주문 공개 ID
     * @param force         관리자 기취소 attest (true 이면 PortOne 상태 검사 생략)
     * @return 정합 결과
     */
    ShopOrderReconcilePaymentResponse reconcileRefund(String tenantId, String orderPublicId, boolean force);
}
