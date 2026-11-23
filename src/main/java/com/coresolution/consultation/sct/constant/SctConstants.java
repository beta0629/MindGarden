package com.coresolution.consultation.sct.constant;

/**
 * SCT 도메인 상수.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public final class SctConstants {

    public static final String FORM_VERSION_V3 = "v3";
    public static final String CORE_TENANT_ID = "";

    public static final int VERIFY_MAX_FAILURES = 5;
    public static final int VERIFY_LOCK_MINUTES = 15;
    public static final int VERIFY_SESSION_TTL_MINUTES = 30;

    public static final String SMS_RESULT_SENT = "SENT";
    public static final String SMS_RESULT_TEST_MODE_SKIP = "TEST_MODE_SKIP";
    public static final String SMS_RESULT_FAILED = "FAILED";
    public static final String SMS_RESULT_NO_PHONE = "NO_PHONE";

    public static final String CONSENT_SENSITIVE_INFO = "SENSITIVE_INFO";
    public static final String CONSENT_GUARDIAN_UNDER_14 = "GUARDIAN_UNDER_14";

    public static final String ACCESS_VIEW_BODY = "VIEW_BODY";
    public static final String ACCESS_VIEW_LIST = "VIEW_LIST";
    public static final String ACCESS_SESSION_VIEW = "SESSION_VIEW";
    public static final String ACCESS_EXPORT = "EXPORT";

    public static final String ENTITY_TYPE_INVITATION = "SCT_INVITATION";
    public static final String ENTITY_TYPE_SETTINGS = "SCT_SETTINGS";

    public static final String PUBLIC_API_PREFIX = "/api/v1/public/sct";

    public static final String HASH_ALGORITHM = "SHA-256";

    private SctConstants() {
    }
}
