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

    /**
     * Apple SIWA 휴대폰 매칭 흐름 1단계 — apple_sub 인증 직후 발급되는 단기 JWT 의 purpose.
     * 클라이언트는 이 토큰을 가지고 phone 입력 화면으로 이동, OTP send/verify 호출 시 함께 전송한다.
     */
    public static final String PURPOSE_APPLE_PHONE_VERIFICATION = "APPLE_PHONE_VERIFICATION";

    /**
     * Apple SIWA 휴대폰 매칭 흐름 2단계 — OTP 발송 시 응답으로 발급되는 challenge 토큰의 purpose.
     * verify 호출 시 phone_hash + otp_id 를 묶어 다른 phone 으로의 verify 를 차단한다.
     */
    public static final String PURPOSE_APPLE_PHONE_OTP_CHALLENGE = "APPLE_PHONE_OTP_CHALLENGE";

    private OAuthJwtClaimValues() {
    }
}
