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

    private PortOneV2WebhookConstants() {
    }
}
