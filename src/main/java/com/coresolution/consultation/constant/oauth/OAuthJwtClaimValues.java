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

    /**
     * provider-agnostic OAuth 휴대폰 매칭 흐름 1단계 — OAuth 콜백 직후 발급되는 단기 JWT 의 purpose.
     * 4 종 provider(Apple/Google/Kakao/Naver) 가 공통으로 사용. Apple 전용
     * {@link #PURPOSE_APPLE_PHONE_VERIFICATION} 는 alias 로 유지된다(FE PR #161 호환).
     */
    public static final String PURPOSE_OAUTH_PHONE_VERIFICATION = "OAUTH_PHONE_VERIFICATION";

    /**
     * provider-agnostic OAuth 휴대폰 매칭 흐름 2단계 — OTP 발송 시 발급되는 challenge 토큰의 purpose.
     */
    public static final String PURPOSE_OAUTH_PHONE_OTP_CHALLENGE = "OAUTH_PHONE_OTP_CHALLENGE";

    /**
     * 일반 로그인(전화 + 비밀번호) 다중 매치 시 발급되는 5분 TTL 단기 JWT 의 purpose.
     *
     * <p>OAuth {@link #PURPOSE_OAUTH_PHONE_ACCOUNT_SELECTION} 와 패턴은 동일하나, SNS 액세스 토큰·이메일·이름
     * 등 OAuth 전용 클레임은 보유하지 않는다(보안 — 노출 최소화).</p>
     *
     * @since 2026-06-11 — P1 silent first 차단
     */
    public static final String PURPOSE_PASSWORD_LOGIN_ACCOUNT_SELECTION = "PASSWORD_LOGIN_ACCOUNT_SELECTION";

    private OAuthJwtClaimValues() {
    }
}
