package com.coresolution.consultation.entity.auth;

import java.util.Locale;

/**
 * OAuth 휴대폰 매칭(OTP) 흐름에서 사용하는 provider enum.
 *
 * <p>{@code phone_otp_attempts.provider} 컬럼·{@code OAuthPhoneVerificationService} 입력·
 * {@code OAuthPhoneOtpChallengeClaims} / {@code OAuthPhoneVerificationClaims} 의 provider 클레임에
 * 동일하게 사용한다. {@code name()} 결과는 항상 대문자 문자열이며 DB·JWT·로그에도 그대로 사용한다.</p>
 *
 * <p>2026-06-09: Apple SIWA P1 OTP 인프라(PR #158/#161) 를 provider-agnostic 으로 일반화하면서 도입.
 * 기존 {@code SocialProvider} 유틸은 이메일·문자열 정규화만 담당하므로 본 enum 과 역할이 분리된다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
public enum OAuthProvider {

    /** Sign in with Apple. */
    APPLE,

    /** Google OAuth2. */
    GOOGLE,

    /** Kakao OAuth2. */
    KAKAO,

    /** Naver OAuth2. */
    NAVER;

    /**
     * 입력 문자열을 enum 으로 안전 변환. 공백·대소문자 정규화 후 매칭하고, 알 수 없는 값은 예외.
     *
     * @param raw 외부 입력(헤더·바디·DB 컬럼 등)
     * @return 매칭된 enum
     * @throws IllegalArgumentException null·공백·미지원 provider
     */
    public static OAuthProvider fromString(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("oauthProvider 는 필수입니다.");
        }
        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("oauthProvider 는 필수입니다.");
        }
        for (OAuthProvider provider : values()) {
            if (provider.name().equals(normalized)) {
                return provider;
            }
        }
        throw new IllegalArgumentException("지원하지 않는 OAuth provider 입니다: " + raw);
    }
}
