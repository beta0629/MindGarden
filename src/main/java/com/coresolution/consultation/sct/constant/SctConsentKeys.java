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
