package com.coresolution.consultation.sct.constant;

/**
 * SCT system_config 키 SSOT.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public final class SctFeatureFlagKeys {

    /** 테넌트 SCT 기능 ON/OFF. 기본 false(fail-closed). */
    public static final String FEATURE_SCT_ENABLED = "feature.sct.enabled";

    /** 링크 만료 일수. 기본 14, 허용 1~30. 새 발송부터 적용. */
    public static final String LINK_EXPIRY_DAYS = "sct.link.expiry.days";

    /** 응답 보관 일수. null/미설정 = 자동 파기 없음. */
    public static final String RETENTION_DAYS = "sct.retention.days";

    public static final int DEFAULT_LINK_EXPIRY_DAYS = 14;
    public static final int MIN_LINK_EXPIRY_DAYS = 1;
    public static final int MAX_LINK_EXPIRY_DAYS = 30;

    public static final String CONFIG_CATEGORY = "SCT";
    public static final String FEATURE_CATEGORY = "FEATURE";

    private SctFeatureFlagKeys() {
    }
}
