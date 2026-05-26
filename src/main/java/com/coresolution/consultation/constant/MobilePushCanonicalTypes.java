package com.coresolution.consultation.constant;

/**
 * Expo 앱 {@code pushScenarios.ts} 및 기획서 3.7절과 동일한 canonical 푸시 type 문자열.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
public final class MobilePushCanonicalTypes {

    private MobilePushCanonicalTypes() {
    }

    public static final String BOOKING_REMINDER = "booking_reminder";
    public static final String BOOKING_CONFIRMED = "booking_confirmed";
    public static final String BOOKING_CANCELLED = "booking_cancelled";
    public static final String BOOKING_RESCHEDULED = "booking_rescheduled";
    public static final String PAYMENT_COMPLETED = "payment_completed";
    public static final String PAYMENT_FAILED = "payment_failed";
    public static final String SESSION_LOW = "session_low";
    /** 내담자 마음 날씨 카드 상담사 공유 */
    public static final String MIND_WEATHER_SHARED = "mind_weather_shared";
    /** 내담자 감정 일기 상담사 공유 */
    public static final String MOOD_JOURNAL_SHARED = "mood_journal_shared";
    /** 어드민 매칭 승인(approve) — PG 결제와 분리 */
    public static final String MAPPING_APPROVED = "mapping_approved";

    /** 쇼핑몰 주문 PAID 확정 — 내담자 */
    public static final String SHOP_ORDER_PAID = "shop_order_paid";
    /** 쇼핑몰 PG 결제 실패·주문 CREATED 복귀 — 내담자 */
    public static final String SHOP_PAYMENT_FAILED = "shop_payment_failed";
    /** 쇼핑몰 구매 적립 포인트 — 내담자 */
    public static final String POINT_EARNED = "point_earned";
    /** 쇼핑몰 결제 대기 hold TTL 만료 — 내담자 */
    public static final String SHOP_ORDER_HOLD_EXPIRED = "shop_order_hold_expired";
    /** 쇼핑몰 어드민 전액 환불 — 내담자 */
    public static final String SHOP_ORDER_REFUNDED = "shop_order_refunded";
    /** 쇼핑몰 CONSULTATION fulfillment COMPLETED — 내담자(·상담사) */
    public static final String SHOP_FULFILLMENT_COMPLETED = "shop_fulfillment_completed";
    /**
     * 어드민 수동 다중 발송 broadcast 푸시(2026-05-25).
     *
     * <p>{@code AdminManualNotificationService.sendBulkPush(...)} 가 사용하는 canonical type 으로,
     * 별도 dispatch 경로({@code MobilePushDispatchService.dispatchAdminAnnouncement(...)}) 가
     * dedup·토큰·카테고리(SYSTEM 재사용)·Expo POST 를 모두 자체 수행한다. 기존 fanout 화이트리스트
     * 외 추가 푸시 이벤트 정착 없이도 별도 admin broadcast 경로 1종만 사용.
     */
    public static final String ADMIN_ANNOUNCEMENT = "admin_announcement";

    /**
     * 부분 환불 / 강제 종료로 회기 소진(remaining&lt;=0) 시 자동 일괄 취소된 미래 예약 통지(2026-05-26 Phase 0).
     *
     * <p>회기관리 운영 정책 합의서 v2 Q3=3A (자동 일괄 취소) + Q3 보조=C (4채널 의무 통지) 결정에 따라
     * 인앱·이메일·푸시·알림톡 4채널 의무 발송을 수행한다. 환불 처리 통보는 약관·전자상거래법상 의무
     * 통지에 해당하므로 사용자 채널 선호도({@code MobilePushSettings}/{@code NotificationChannelPreference})
     * 와 일반 카테고리 게이트를 우회한다. dispatch 경로는
     * {@code MobilePushDispatchService.dispatchAutoCancellation(...)} 1종만 사용한다.
     */
    public static final String REFUND_AUTO_CANCEL = "refund_auto_cancel";
}
