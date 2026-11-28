package com.coresolution.consultation.sct.constant;

/**
 * SCT 동의·서명 주체·설정 키 SSOT.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public final class SctConsentKeys {

    /** web-handoff 동의 문구 버전. */
    public static final String TEMPLATE_VERSION_HANDOFF = "handoff-2026-11-23";

    /** 본인확인용 연락처 수집·이용 동의 문구 버전. */
    public static final String TEMPLATE_VERSION_IDENTITY_CONTACT = "identity-contact-2026-11-27";

    public static final String VERIFY_SESSION_HEADER = "X-Sct-Verify-Session";

    /**
     * 단말 바인딩 쿠키 이름(HttpOnly). 값 = verify 세션 ID(서버는 SHA-256 해시로만 저장).
     * Path 는 {@code /api/v1/public/sct/{token}} 로 좁혀 초대·링크 단위로 격리한다.
     */
    public static final String DEVICE_SESSION_COOKIE = "SCT_DEVICE_SESSION";

    public static final String CONFIG_GUARDIAN_VERIFY_MODE = "sct.guardian.verify.mode";
    public static final String GUARDIAN_VERIFY_CHECK_NAME_RELATION = "CHECK_NAME_RELATION";

    public static final String SIGNER_BAND_ADULT = "ADULT";
    public static final String SIGNER_BAND_TEEN_14_PLUS = "TEEN_14_PLUS";
    public static final String SIGNER_BAND_UNDER_14 = "UNDER_14";

    public static final String CHANNEL_PHONE = "PHONE";
    public static final String CHANNEL_EMAIL = "EMAIL";

    public static final int UNDER_14_AGE = 14;
    public static final int ADULT_AGE = 19;

    private SctConsentKeys() {
    }
}
