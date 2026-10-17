package com.coresolution.consultation.service.portone;

import com.coresolution.core.constants.TenantPgSettingsJsonKeys;

/**
 * 포트원 V2 웹훅 설정 키 및 이벤트 타입 상수.
 *
 * @author CoreSolution
 * @since 2026-04-15
 */
public final class PortOneV2WebhookConstants {

    /** {@code tenant_pg_configurations.settings_json} 내 웹훅 시크릿 키 (저장 시 암호화 권장). */
    public static final String SETTINGS_KEY_PORTONE_WEBHOOK_SECRET = TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET;

    public static final String EVENT_TRANSACTION_PAID = "Transaction.Paid";
    public static final String EVENT_TRANSACTION_VIRTUAL_ACCOUNT_ISSUED = "Transaction.VirtualAccountIssued";
    public static final String EVENT_TRANSACTION_FAILED = "Transaction.Failed";
    public static final String EVENT_TRANSACTION_CANCELLED = "Transaction.Cancelled";
    public static final String EVENT_TRANSACTION_PARTIAL_CANCELLED = "Transaction.PartialCancelled";
    public static final String EVENT_TRANSACTION_PAY_PENDING = "Transaction.PayPending";
    public static final String EVENT_TRANSACTION_READY = "Transaction.Ready";

    /** 웹훅 응답 status — 쇼핑 금액·주문 불일치로 전액 취소됨 */
    public static final String STATUS_MISMATCH_CANCELLED = "mismatch_cancelled";

    /** 웹훅 응답 status — 불일치 취소 실패(재시도) */
    public static final String STATUS_MISMATCH_CANCEL_FAILED = "mismatch_cancel_failed";

    /** 웹훅 응답 status — PortOne 검증 UNKNOWN(조회 실패 등, 재시도) */
    public static final String STATUS_VERIFY_UNKNOWN = "verify_unknown";

    /**
     * 웹훅 응답 status — UNKNOWN 재시도 소진(비재시도, PortOne 재전송 중단용 200).
     */
    public static final String STATUS_VERIFY_UNKNOWN_EXHAUSTED = "verify_unknown_exhausted";

    private PortOneV2WebhookConstants() {
    }
}
