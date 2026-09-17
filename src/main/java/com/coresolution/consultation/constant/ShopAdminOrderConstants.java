package com.coresolution.consultation.constant;

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

    /** 삭제 거부 — 환불 진행 중 */
    public static final String MSG_DELETE_DENIED_REFUND_IN_PROGRESS =
            "환불이 진행 중인 주문은 삭제할 수 없습니다.";

    /** 삭제 거부 — 허용 상태 외 */
    public static final String MSG_DELETE_DENIED_STATUS =
            "현재 상태의 주문은 삭제할 수 없습니다.";

    /** 주문 없음 */
    public static final String MSG_ORDER_NOT_FOUND = "주문을 찾을 수 없습니다.";

    /**
     * 어드민 soft-delete 허용 상태.
     * <p>PAID·환불 진행 중은 거부. 환불 완료({@link ShopClientOrderStatus#REFUNDED})는 허용.</p>
     */
    public static final Set<ShopClientOrderStatus> DELETABLE_STATUSES =
            Collections.unmodifiableSet(EnumSet.of(
                    ShopClientOrderStatus.CREATED,
                    ShopClientOrderStatus.PENDING_PAYMENT,
                    ShopClientOrderStatus.EXPIRED,
                    ShopClientOrderStatus.CANCELLED,
                    ShopClientOrderStatus.REFUNDED));

    private ShopAdminOrderConstants() {
        throw new UnsupportedOperationException("utility");
    }

    /**
     * 주문 상태만으로 soft-delete 후보인지 판정 (환불 진행 중 여부는 별도 검사).
     *
     * @param status 주문 상태
     * @return 허용 상태이면 true
     */
    public static boolean isDeletableStatus(ShopClientOrderStatus status) {
        return status != null && DELETABLE_STATUSES.contains(status);
    }
}
