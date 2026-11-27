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

    /**
     * 본인확인 세션 유휴 TTL(분). form/draft/consent/submit 성공 validate 시 sliding.
     * absolute cap = invitation.tokenExpiresAt — 초대 링크 만료를 넘기지 않음.
     */
    public static final int VERIFY_SESSION_IDLE_MINUTES = 30;

    /**
     * 호환 alias — {@link #VERIFY_SESSION_IDLE_MINUTES} 와 동일(고정 절대 TTL 아님).
     */
    public static final int VERIFY_SESSION_TTL_MINUTES = VERIFY_SESSION_IDLE_MINUTES;

    public static final String SMS_RESULT_SENT = "SENT";
    public static final String SMS_RESULT_TEST_MODE_SKIP = "TEST_MODE_SKIP";
    public static final String SMS_RESULT_FAILED = "FAILED";
    public static final String SMS_RESULT_NO_PHONE = "NO_PHONE";

    public static final String CONSENT_SENSITIVE_INFO = "SENSITIVE_INFO";
    public static final String CONSENT_GUARDIAN_UNDER_14 = "GUARDIAN_UNDER_14";
    /** 본인확인용 연락처(휴대폰/이메일) 수집·이용 동의. */
    public static final String CONSENT_IDENTITY_CONTACT = "IDENTITY_CONTACT";
    public static final String ENTITY_TYPE_CONSENT = "SCT_CONSENT";

    public static final String ACCESS_VIEW_BODY = "VIEW_BODY";
    public static final String ACCESS_VIEW_LIST = "VIEW_LIST";
    public static final String ACCESS_SESSION_VIEW = "SESSION_VIEW";
    public static final String ACCESS_EXPORT = "EXPORT";
    public static final String ACCESS_PRINT = "PRINT";
    public static final String ACCESS_MEMO_VIEW = "MEMO_VIEW";
    public static final String ACCESS_MEMO_SAVE = "MEMO_SAVE";

    public static final String ENTITY_TYPE_INVITATION = "SCT_INVITATION";
    public static final String ENTITY_TYPE_SETTINGS = "SCT_SETTINGS";
    public static final String ENTITY_TYPE_DOMAIN_MEMO = "SCT_DOMAIN_MEMO";

    public static final String MATCH_CHANNEL_PHONE = "PHONE";
    public static final String MATCH_CHANNEL_EMAIL = "EMAIL";
    public static final String MATCH_CHANNEL_BOTH = "BOTH";

    public static final String PUBLIC_API_PREFIX = "/api/v1/public/sct";

    public static final String HASH_ALGORITHM = "SHA-256";

    /** 관리번호 접두사(PII 없음). */
    public static final String MANAGEMENT_NO_PREFIX = "SCT-";

    /** 관리번호 숫자 자릿수. */
    public static final int MANAGEMENT_NO_DIGITS = 6;

    /** 아동용 온라인 미제공 안내. */
    public static final String MSG_CHILD_ONLINE_UNSUPPORTED =
            "아동용 질문지는 온라인으로 실시하지 않습니다.";

    /** 파기 대상이 아닐 때. */
    public static final String MSG_DESTROY_NOT_ELIGIBLE =
            "보관 기간이 지나지 않아 파기할 수 없습니다.";

    /** 공개 본인확인 세션 없음·만료·불일치. */
    public static final String MSG_VERIFY_REQUIRED = "본인 확인이 필요합니다.";

    /** 본인확인용 개인정보 수집·이용 동의 없음. */
    public static final String MSG_IDENTITY_CONTACT_CONSENT_REQUIRED =
            "본인확인용 개인정보 수집·이용 동의가 필요합니다.";

    private SctConstants() {
    }
}
