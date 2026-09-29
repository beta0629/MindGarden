package com.coresolution.consultation.constant;

import java.util.EnumSet;
import java.util.Set;

/**
 * 취소·만료로 닫힌 쇼핑 주문에 늦게 들어온 PG 승인(늦은 결제) 방어 상수.
 * <p>닫힌 주문은 되살리지 않는다. PortOne 전액 취소 후 결제 건을 {@code REFUNDED} 로 두고,
 * 취소 API 가 실패하면 {@code REFUND_REQUIRED} 로 두어 관리자 재처리·웹훅 재시도에 맡긴다.</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public final class ShopLatePaymentConstants {

    /** 늦은 결제로 보는 주문 상태 — 이 상태의 주문은 PAID 로 되살리지 않는다 */
    public static final Set<ShopClientOrderStatus> CLOSED_ORDER_STATUSES =
            EnumSet.of(ShopClientOrderStatus.CANCELLED, ShopClientOrderStatus.EXPIRED);

    /** 결제 건 failure_reason — 늦은 결제 자동 취소(성공·실패 공통) */
    public static final String FAILURE_REASON_LATE_PAYMENT_ON_CLOSED_ORDER = "LATE_PAYMENT_ON_CLOSED_ORDER";

    /** PortOne 결제 취소 API 사유 */
    public static final String PORTONE_CANCEL_REASON = "주문이 이미 닫혀 결제를 자동 취소합니다";

    /** 관리자(운영) 알림 채널 구분명 */
    public static final String ADMIN_ALERT_SOURCE = "ShopLatePayment";

    /** 관리자 알림 단계 — 자동 환불 완료 */
    public static final String ADMIN_ALERT_STEP_REFUNDED = "AUTO_REFUNDED";

    /** 관리자 알림 단계 — 자동 환불 실패(재처리 필요) */
    public static final String ADMIN_ALERT_STEP_REFUND_REQUIRED = "REFUND_REQUIRED";

    /** 관리자 알림 본문 — outcome, orderPublicId, orderStatus, paymentId */
    public static final String ADMIN_ALERT_MESSAGE_FMT =
            "닫힌 주문에 늦은 결제 승인: outcome=%s, orderPublicId=%s, orderStatus=%s, paymentId=%s";

    /** 웹훅·검증 응답 status 값 — 늦은 결제 자동 취소 처리됨 */
    public static final String WEBHOOK_STATUS_LATE_PAYMENT_REFUNDED = "late_payment_refunded";

    /** 웹훅 응답 message — 자동 취소 실패(재시도 유도) */
    public static final String WEBHOOK_MESSAGE_REFUND_REQUIRED = "닫힌 주문 늦은 결제 — PG 자동 취소 실패(재시도 필요)";

    /** 승인 거부 예외 메시지 — orderPublicId, orderStatus */
    public static final String MSG_ORDER_CLOSED_FOR_PAYMENT_FMT =
            "이미 닫힌 주문에는 결제를 승인할 수 없습니다: orderPublicId=%s, status=%s";

    /** 어드민 정합 — 닫힌 주문의 재처리 대상 결제 없음 */
    public static final String MSG_RECONCILE_LATE_PAYMENT_NOT_FOUND =
            "닫힌 주문에서 자동 환불을 재시도할 결제를 찾을 수 없습니다.";

    private ShopLatePaymentConstants() {
    }

    /**
     * @param status 주문 상태
     * @return 취소·만료로 닫힌 주문이면 true
     */
    public static boolean isClosedOrder(ShopClientOrderStatus status) {
        return status != null && CLOSED_ORDER_STATUSES.contains(status);
    }
}
