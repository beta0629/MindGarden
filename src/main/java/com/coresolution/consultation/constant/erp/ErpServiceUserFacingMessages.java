package com.coresolution.consultation.constant.erp;

/**
 * {@code ErpService}에서 사용자에게 노출될 수 있는 메시지 문자열.
 *
 * @author CoreSolution
 * @since 2026-04-21
 */
public final class ErpServiceUserFacingMessages {

    public static final String MSG_ITEM_NOT_FOUND_FMT = "아이템을 찾을 수 없습니다: %d";

    public static final String MSG_REQUESTER_NOT_FOUND_FMT = "요청자를 찾을 수 없습니다: %d";

    public static final String MSG_PURCHASE_REQUEST_NOT_FOUND_FMT = "구매 요청을 찾을 수 없습니다: %d";

    public static final String MSG_ADMIN_NOT_FOUND_FMT = "관리자를 찾을 수 없습니다: %d";

    public static final String MSG_CANNOT_APPROVE_STATUS_FMT = "승인할 수 없는 상태입니다: %s";

    public static final String MSG_CANNOT_REJECT_STATUS_FMT = "거부할 수 없는 상태입니다: %s";

    public static final String MSG_SUPER_ADMIN_NOT_FOUND_FMT = "수퍼 관리자를 찾을 수 없습니다: %d";

    public static final String MSG_ONLY_OWN_PURCHASE_REQUEST_CANCEL = "본인의 구매 요청만 취소할 수 있습니다";

    public static final String MSG_CANNOT_CANCEL_STATUS_FMT = "취소할 수 없는 상태입니다: %s";

    public static final String MSG_PURCHASER_NOT_FOUND_FMT = "구매자를 찾을 수 없습니다: %d";

    public static final String MSG_ONLY_APPROVED_PURCHASE_ORDER_FMT = "승인된 구매 요청만 주문할 수 있습니다: %s";

    public static final String MSG_PURCHASE_ORDER_NOT_FOUND_FMT = "구매 주문을 찾을 수 없습니다: %d";

    public static final String MSG_BUDGET_NOT_FOUND_FMT = "예산을 찾을 수 없습니다: %d";

    public static final String MSG_BUDGET_INSUFFICIENT_REMAINING_FMT = "예산이 부족합니다. 남은 예산: %s";

    public static final String MSG_FINANCE_DASHBOARD_QUERY_FAILED_FMT = "재무 대시보드 데이터 조회에 실패했습니다: %s";

    public static final String MSG_FINANCE_STATS_QUERY_FAILED_FMT = "재무 통계 조회에 실패했습니다: %s";

    private ErpServiceUserFacingMessages() {
    }
}
