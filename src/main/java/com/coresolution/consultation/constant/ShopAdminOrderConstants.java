package com.coresolution.consultation.constant;

import com.coresolution.consultation.entity.Payment;
import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/**
 * 어드민 쇼핑 주문 조회·삭제 상수.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public final class ShopAdminOrderConstants {

    /** 목록 기본 건수 */
    public static final int DEFAULT_LIST_LIMIT = 50;

    /** 목록 최대 건수 */
    public static final int MAX_LIST_LIMIT = 100;

    /** 감사 로그 entityType — shop_client_orders */
    public static final String AUDIT_ENTITY_TYPE = "SHOP_CLIENT_ORDER";

    /** 삭제 거부 — 결제 완료 */
    public static final String MSG_DELETE_DENIED_PAID = "결제 완료(PAID) 주문은 삭제할 수 없습니다.";

    /**
     * 삭제 거부 — 진행 중·승인된 결제(라이브 차지).
     * <p>PENDING / PROCESSING / APPROVED 결제 row 가 하나라도 있으면 fail-closed.</p>
     */
    public static final String MSG_DELETE_DENIED_LIVE_PAYMENT =
            "진행 중이거나 승인된 결제가 있는 주문은 삭제할 수 없습니다.";

    /** 삭제 거부 — 허용 상태 외 */
    public static final String MSG_DELETE_DENIED_STATUS =
            "현재 상태의 주문은 삭제할 수 없습니다.";

    /** 주문 없음 */
    public static final String MSG_ORDER_NOT_FOUND = "주문을 찾을 수 없습니다.";

    /**
     * 어드민 soft-delete 허용 주문 상태.
     * <p>PAID·unknown/null 거부. 결제 라이브/in-flight 가드는 {@link #LIVE_OR_IN_FLIGHT_PAYMENT_STATUSES}.</p>
     */
    public static final Set<ShopClientOrderStatus> DELETABLE_STATUSES =
            Collections.unmodifiableSet(EnumSet.of(
                    ShopClientOrderStatus.CREATED,
                    ShopClientOrderStatus.PENDING_PAYMENT,
                    ShopClientOrderStatus.EXPIRED,
                    ShopClientOrderStatus.CANCELLED,
                    ShopClientOrderStatus.REFUNDED));

    /**
     * soft-delete 거부 결제 상태 — in-flight 또는 라이브 차지.
     * <p>PENDING(결제 진행), PROCESSING(처리·환불 진행), APPROVED(승인·라이브 차지).</p>
     */
    public static final Set<Payment.PaymentStatus> LIVE_OR_IN_FLIGHT_PAYMENT_STATUSES =
            Collections.unmodifiableSet(EnumSet.of(
                    Payment.PaymentStatus.PENDING,
                    Payment.PaymentStatus.PROCESSING,
                    Payment.PaymentStatus.APPROVED));

    private ShopAdminOrderConstants() {
        throw new UnsupportedOperationException("utility");
    }

    /**
     * 주문 상태만으로 soft-delete 후보인지 판정 (결제 라이브/in-flight 여부는 별도 검사).
     *
     * @param status 주문 상태
     * @return 허용 상태이면 true
     */
    public static boolean isDeletableStatus(ShopClientOrderStatus status) {
        return status != null && DELETABLE_STATUSES.contains(status);
    }

    /**
     * 결제 상태가 라이브·진행 중인지 판정.
     *
     * @param status 결제 상태
     * @return PENDING/PROCESSING/APPROVED 이면 true
     */
    public static boolean isLiveOrInFlightPaymentStatus(Payment.PaymentStatus status) {
        return status != null && LIVE_OR_IN_FLIGHT_PAYMENT_STATUSES.contains(status);
    }
}
