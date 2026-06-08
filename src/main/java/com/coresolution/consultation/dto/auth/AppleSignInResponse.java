package com.coresolution.consultation.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Sign in with Apple (SIWA) 로그인/가입 응답 본문.
 *
 * <p>기존 카카오·네이버 소셜 로그인과 동일하게 JWT(access/refresh)·사용자 요약을 반환한다.
 * 신규 사용자 가입 분기에서는 {@code requiresSignup=true} 와 함께 {@link AppleSocialUserInfo} 가 채워진다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppleSignInResponse {

    /** 인증 결과 (true = 로그인 성공 또는 가입 필요 신호 정상 반환, false = 검증 실패). */
    private boolean success;

    /**
     * @deprecated 2026-06-08 — Apple SIWA 흐름 재정렬 후 사용하지 않는다. 휴대폰 매칭으로 통일됐기 때문에
     * 클라이언트는 {@link #requiresPhoneVerification} 를 참고해야 한다. 기존 클라이언트 호환을 위해 필드는 유지.
     */
    @Deprecated
    private boolean requiresSignup;

    /**
     * Apple SIWA 휴대폰 매칭 1단계 신호. apple_sub 매칭 사용자가 없을 때 true.
     * 이 경우 클라이언트는 phone 입력 화면으로 이동, OTP send/verify 를 호출한다.
     */
    private boolean requiresPhoneVerification;

    /**
     * {@link #requiresPhoneVerification} 가 true 일 때 함께 발급되는 단기 JWT.
     * verify 단계에서 함께 전송한다.
     */
    private String phoneVerificationToken;

    /**
     * 휴대폰 인증 성공 후 phone 매칭 결과 후보가 2명+ (역할 혼재) 일 때 true.
     * 클라이언트는 기존 OAuth 계정 선택 화면(`oauth-account-selection`) 으로 라우팅한다.
     */
    private boolean requiresPhoneAccountSelection;

    /** {@link #requiresPhoneAccountSelection} 가 true 일 때 함께 발급되는 기존 OAuth 계정 선택 토큰. */
    private String phoneAccountSelectionToken;

    /** 사용자 알림용 메시지. */
    private String message;

    /** JWT access token (기존 로그인 흐름과 동일). */
    private String accessToken;

    /** JWT refresh token. */
    private String refreshToken;

    /** 로그인한 사용자 요약 (가입이 완료된 경우에만 채워짐). */
    private AppleUserSummary user;

    /** 신규 가입 분기에서 클라이언트가 사용할 social user 정보. */
    private AppleSocialUserInfo socialUserInfo;
}
