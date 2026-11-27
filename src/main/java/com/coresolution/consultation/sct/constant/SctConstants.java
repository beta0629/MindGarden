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
    /** EUC-KR 단문 90B 초과 — 발송 차단(fail-closed). */
    public static final String SMS_RESULT_BODY_TOO_LONG = "SMS_BODY_TOO_LONG";
    /** 단축 링크 없음·생성 실패 후 LMS 폴백 발송. */
    public static final String SMS_RESULT_LMS_FALLBACK = "LMS_FALLBACK";
    /** 단축 링크 생성 실패. */
    public static final String SMS_RESULT_SHORT_LINK_FAILED = "SHORT_LINK_FAILED";

    /** SMS 단문 EUC-KR 바이트 상한. */
    public static final int SMS_EUC_KR_MAX_BYTES = 90;

    /** 단축 코드 길이. */
    public static final int SHORT_CODE_LENGTH = 6;

    /** 단축 코드 충돌 재시도 상한. */
    public static final int SHORT_CODE_MAX_RETRIES = 12;

    /**
     * 단축 코드 문자셋 — 0/O/1/l/I 등 혼동 문자 제외.
     */
    public static final String SHORT_CODE_ALPHABET =
            "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    /** 단축 경로 접두. */
    public static final String SHORT_LINK_WEB_PREFIX = "/s/";

    /** 공개 SPA 경로 접두. */
    public static final String PUBLIC_SCT_WEB_PREFIX = "/public/sct/";

    /** 단축 링크 무효·만료·미존재 시 동일 리다이렉트 경로(존재 여부 누출 방지). */
    public static final String SHORT_LINK_INVALID_REDIRECT_PATH = PUBLIC_SCT_WEB_PREFIX + "invalid";

    /** Redis 교환 코드 TTL(분). */
    public static final int SHORT_LINK_EXCHANGE_TTL_MINUTES = 10;

    /** 공개 메타 — 재발급으로 무효화된 이전 토큰/단축 코드. */
    public static final String PUBLIC_STATUS_REISSUED = "REISSUED";

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

    /** PHONE 채널은 SMS OTP 확인 후 세션 발급. */
    public static final String MSG_OTP_REQUIRED =
            "휴대폰 본인확인은 인증번호 확인이 필요합니다.";

    /** OTP 요청 한도 초과. */
    public static final String MSG_OTP_RATE_LIMITED =
            "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";

    /** OTP 코드 오답·형식 오류(일치 여부·실번호·코드 비노출). */
    public static final String MSG_OTP_INVALID =
            "인증번호가 올바르지 않습니다.";

    /** OTP 만료. */
    public static final String MSG_OTP_EXPIRED =
            "인증번호가 만료되었습니다. 다시 받아 주세요.";

    /** OTP 오답 잠금. */
    public static final String MSG_OTP_LOCKED =
            "인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.";

    private SctConstants() {
    }
}
