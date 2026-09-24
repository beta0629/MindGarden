package com.coresolution.consultation.constant;

/**
 * 쇼핑 주문 이행 재시도(fulfill-retry) 메시지·판별 상수.
 *
 * @author MindGarden
 * @since 2026-09-19
 */
public final class ShopOrderFulfillmentRetryConstants {

    /** 주문 없음 */
    public static final String MSG_ORDER_NOT_FOUND = "주문을 찾을 수 없습니다.";

    /** 내담자·주문 소유권 불일치 */
    public static final String MSG_ORDER_ACCESS_DENIED = "주문에 접근할 수 없습니다.";

    /** PAID 가 아닌 주문 */
    public static final String MSG_ORDER_NOT_PAID = "결제 완료(PAID) 주문만 이행을 재시도할 수 있습니다.";

    /** 재시도 가능한 FAILED 이행 없음 */
    public static final String MSG_NO_RETRYABLE_FULFILLMENT = "재시도 가능한 이행 실패가 없습니다.";

    /** 내담자 fulfill-retry 성공 1회 이미 소진 (클릭이 아니라 성공 재이행 완료) */
    public static final String MSG_CLIENT_RETRY_ALREADY_USED = "이미 재이행을 한 번 요청했습니다.";

    /** 호출자: 내담자(성공 재이행 1회) / 어드민(반복) */
    public enum Caller {
        CLIENT,
        ADMIN
    }

    private static final String RETRYABLE_MARKER = "retryable";

    private ShopOrderFulfillmentRetryConstants() {
    }

    /**
     * FAILED 이면서 메시지에 retryable 표기가 있으면 재시도 가능.
     *
     * @param status  이행 이벤트 상태
     * @param message 이행 이벤트 메시지
     * @return 재시도 가능 여부
     */
    public static boolean isRetryableFailed(String status, String message) {
        if (!ShopOrderFulfillmentStatus.FAILED.equals(status)) {
            return false;
        }
        if (message == null || message.isBlank()) {
            return false;
        }
        return message.toLowerCase().contains(RETRYABLE_MARKER);
    }
}
