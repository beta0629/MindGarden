package com.coresolution.consultation.constant;

/**
 * PG 결제 워크플로(인앱) 알림 카피. 내담자 단독 노출 전용.
 *
 * <p>P0 보안·역할 분리(2026-06-03): 상담사 메시지함에 결제 금액이 노출되지 않도록
 * 본문 템플릿은 {@code AlertType#SYSTEM} 발화에서만 사용한다.
 *
 * @author MindGarden
 * @since 2026-06-03
 */
public final class PaymentNotificationCopy {

    private PaymentNotificationCopy() {
    }

    /** PG 결제 완료 인앱 메시지 제목. */
    public static final String INAPP_TITLE_PAYMENT_COMPLETED = "결제 완료";

    /**
     * PG 결제 완료 인앱 메시지 본문 템플릿.
     * 인자 순서: 결제 금액, 결제 일시(yyyy-MM-dd HH:mm), 결제 내용.
     */
    public static final String INAPP_BODY_PAYMENT_COMPLETED_FMT = """
            결제가 완료되었습니다.
            💰 금액: %s원
            📅 결제일시: %s
            📝 내용: %s""";

    /** PG 결제 메시지 일시 포맷. */
    public static final String DATE_TIME_PATTERN = "yyyy-MM-dd HH:mm";
}
