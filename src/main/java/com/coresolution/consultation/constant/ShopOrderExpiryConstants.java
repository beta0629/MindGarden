package com.coresolution.consultation.constant;

/**
 * 쇼핑 주문 사용 기한 — 조회 시 판정 상태·한도·문구.
 *
 * <p>만료일 = 결제일 + 주문 라인 유효기간 스냅샷(개월), 당일 포함. 연장 이력이 있으면 최신 새 만료일.
 * 판정만 하고 회기·결제 원장은 바꾸지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-29
 */
public final class ShopOrderExpiryConstants {

    /** 기한 없음 (스냅샷 없음·결제 완료 아님) */
    public static final String STATE_NONE = "NONE";

    /** 사용 가능 */
    public static final String STATE_ACTIVE = "ACTIVE";

    /** 만료 임박 ({@link #EXPIRING_SOON_DAYS}일 이내, 당일 포함) */
    public static final String STATE_EXPIRING_SOON = "EXPIRING_SOON";

    /** 기한 만료 */
    public static final String STATE_EXPIRED = "EXPIRED";

    /** 만료 임박 판정 일수 */
    public static final int EXPIRING_SOON_DAYS = 7;

    /** 연장 사유 최대 길이 (DB 컬럼과 동일) */
    public static final int EXTEND_REASON_MAX_LENGTH = 500;

    public static final String MSG_EXTEND_REASON_REQUIRED = "연장 사유를 적어 주세요.";

    public static final String MSG_EXTEND_REASON_TOO_LONG = "연장 사유는 500자 이하로 적어 주세요.";

    public static final String MSG_EXTEND_DATE_REQUIRED = "새 만료일을 골라 주세요.";

    public static final String MSG_EXTEND_NOT_PAID = "결제 완료 주문만 기한을 늘릴 수 있어요.";

    public static final String MSG_EXTEND_NO_EXPIRY = "사용 기한이 없는 주문은 연장할 수 없어요.";

    public static final String MSG_EXTEND_DATE_NOT_AFTER_CURRENT = "새 만료일은 현재 만료일 다음 날부터 고를 수 있어요.";

    public static final String MSG_EXTEND_DATE_NOT_AFTER_TODAY = "기한이 지난 주문은 오늘 다음 날부터 고를 수 있어요.";

    private ShopOrderExpiryConstants() {
    }
}
