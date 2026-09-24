package com.coresolution.consultation.exception;

import com.coresolution.consultation.constant.ShopRefundConstants;

/**
 * 쇼핑 전액 환불 — PG(PortOne) 취소 이후 Clinic 체인(회기 원복·ERP·주문 REFUNDED) 실패.
 *
 * <p>외부 PG 는 롤백할 수 없으므로 부분 성공을 성공으로 반환하지 않고,
 * 재시도·{@code reconcile-refund} 로 정합 가능한 fail-closed 오류로 표면화한다.
 * 이메일 중복 UX 로 오매핑되지 않도록 전용 예외·코드를 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-22
 */
public class ShopRefundClinicChainException extends IllegalStateException {

    private final String orderPublicId;
    private final boolean pgCancelCompleted;

    public ShopRefundClinicChainException(String orderPublicId, boolean pgCancelCompleted, Throwable cause) {
        super(buildMessage(orderPublicId), cause);
        this.orderPublicId = orderPublicId;
        this.pgCancelCompleted = pgCancelCompleted;
    }

    public ShopRefundClinicChainException(String orderPublicId, boolean pgCancelCompleted, String detail) {
        super(buildMessage(orderPublicId)
                + (detail != null && !detail.isBlank() ? " 원인: " + detail.trim() : ""));
        this.orderPublicId = orderPublicId;
        this.pgCancelCompleted = pgCancelCompleted;
    }

    private static String buildMessage(String orderPublicId) {
        String id = orderPublicId != null && !orderPublicId.isBlank() ? orderPublicId.trim() : "-";
        return String.format(ShopRefundConstants.MSG_PG_CANCELLED_CLINIC_INCOMPLETE_FMT, id);
    }

    public String getOrderPublicId() {
        return orderPublicId;
    }

    public boolean isPgCancelCompleted() {
        return pgCancelCompleted;
    }

    public String getErrorCode() {
        return ShopRefundConstants.ERROR_CODE_CLINIC_INCOMPLETE;
    }
}
