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

    private OAuthJwtClaimKeys() {
    }
}
