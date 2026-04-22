package com.coresolution.consultation.constant.oauth;

/**
 * OAuth 보조 JWT 등에 사용하는 클레임 값(문자열 상수).
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
public final class OAuthJwtClaimValues {

    /** 전화 매칭 애매(상담사·내담자 동시) 시 계정 선택용 단기 JWT purpose */
    public static final String PURPOSE_OAUTH_PHONE_ACCOUNT_SELECTION = "OAUTH_PHONE_ACCOUNT_SELECTION";

    private OAuthJwtClaimValues() {
    }
}
