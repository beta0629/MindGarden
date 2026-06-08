package com.coresolution.consultation.constant.oauth;

/**
 * OAuth 보조 JWT 클레임 키 이름.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
public final class OAuthJwtClaimKeys {

    public static final String PURPOSE = "purpose";
    public static final String TENANT_ID = "tenantId";
    public static final String PROVIDER = "provider";
    public static final String PROVIDER_USER_ID = "providerUserId";
    public static final String ALLOWED_USER_IDS = "allowedUserIds";
    public static final String SNS_ACCESS_TOKEN = "snsAccessToken";
    public static final String SNS_EMAIL = "snsEmail";
    public static final String SNS_NAME = "snsName";
    public static final String SNS_NICKNAME = "snsNickname";
    public static final String SNS_PHONE = "snsPhone";
    public static final String SNS_PROFILE_IMAGE_URL = "snsProfileImageUrl";

    /** Apple SIWA 휴대폰 매칭 흐름용 — OTP 발송 시 발급된 DB row 의 식별자(otp_id). */
    public static final String OTP_ID = "otpId";

    /** Apple SIWA 휴대폰 매칭 흐름용 — 정규화 phone 의 SHA-256 해시(소문자 hex). */
    public static final String PHONE_HASH = "phoneHash";

    private OAuthJwtClaimKeys() {
    }
}
