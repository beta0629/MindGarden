package com.coresolution.consultation.constant;

/**
 * 내담자 맥락 프로필(SSOT) API 응답 필드·코드값.
 *
 * @author CoreSolution
 * @since 2026-04-08
 */
public final class ClientProfileContextFields {

    private ClientProfileContextFields() {
    }

    /** 응답 맵 키: 표시 등급 */
    public static final String VISIBILITY_TIER = "visibilityTier";

    /** 응답 맵 키: 접근 근거 */
    public static final String ACCESS_REASON = "accessReason";

    public static final String TIER_FULL = "FULL";

    public static final String TIER_STANDARD = "STANDARD";

    public static final String TIER_MINIMAL = "MINIMAL";

    public static final String REASON_ADMIN_SCOPE = "ADMIN_SCOPE";

    public static final String REASON_STAFF_SCOPE = "STAFF_SCOPE";

    public static final String REASON_MAPPING_ACTIVE = "MAPPING_ACTIVE";

    public static final String REASON_SESSIONS_EXHAUSTED = "SESSIONS_EXHAUSTED";

    public static final String REASON_SCHEDULE_LINKED = "SCHEDULE_LINKED";

    public static final String REASON_RECORD_LINKED = "RECORD_LINKED";
}
