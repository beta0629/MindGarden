package com.coresolution.consultation.exception;

import com.coresolution.consultation.constant.ShopRefundConstants;

/**
 * 쇼핑 주문 전액 환불 — 같은 주문의 PG 환불이 진행 중이거나 자동 재시도하면 이중 환불 위험이 있어 거부 (409).
 * PG 취소를 호출하지 않은 상태에서만 던진다.
 *
 * @author MindGarden
 * @since 2026-10-04
 */
public class ShopRefundInProgressException extends IllegalStateException {

    private final String orderPublicId;

    private ShopRefundInProgressException(String orderPublicId, String message) {
        super(message);
        this.orderPublicId = orderPublicId;
    }

    /**
     * @param orderPublicId 주문 공개 ID
     * @return 진행 중 예외
     */
    public static ShopRefundInProgressException inProgress(String orderPublicId) {
        return new ShopRefundInProgressException(orderPublicId,
                String.format(ShopRefundConstants.MSG_REFUND_IN_PROGRESS_FMT, displayId(orderPublicId)));
    }

    /**
     * @param orderPublicId 주문 공개 ID
     * @return PortOne 외 결제의 자동 재시도 거부 예외
     */
    public static ShopRefundInProgressException manualCheckRequired(String orderPublicId) {
        return new ShopRefundInProgressException(orderPublicId,
                String.format(ShopRefundConstants.MSG_REFUND_PG_RETRY_MANUAL_CHECK_FMT, displayId(orderPublicId)));
    }

    private static String displayId(String orderPublicId) {
        return orderPublicId != null && !orderPublicId.isBlank() ? orderPublicId.trim() : "-";
    }

    public String getOrderPublicId() {
        return orderPublicId;
    }

    public String getErrorCode() {
        return ShopRefundConstants.ERROR_CODE_REFUND_IN_PROGRESS;
    }
}
