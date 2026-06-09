package com.coresolution.consultation.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * provider-agnostic OAuth 휴대폰 매칭 흐름 — OTP 검증 응답 본문.
 *
 * <p>기존 {@code AppleSignInResponse} 와 동일한 정보를 담되 스키마는 디자이너
 * 산출물(docs/design-system/OAUTH_PHONE_VERIFICATION_UX_SPEC.md §3) 에 맞춰
 * provider-agnostic 으로 단순화한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OAuthPhoneVerifyResponse {

    /** 인증 결과 성공 여부. */
    private boolean success;

    /** 사용자 알림용 메시지. */
    private String message;

    /** 실패 코드 (OTP_INVALID / OTP_EXPIRED / DAILY_LIMIT_EXCEEDED / TOKEN_EXPIRED 등). */
    private String code;

    /** 휴대폰 인증 성공 후 phone 매칭 결과 후보가 2명+ (역할 혼재) 일 때 true. */
    private boolean requiresPhoneAccountSelection;

    /** {@link #requiresPhoneAccountSelection} true 일 때 함께 발급되는 기존 OAuth 계정 선택 토큰. */
    private String phoneAccountSelectionToken;

    /** OTP 검증 후 발급되는 단기 토큰 — 후속 로그인/매칭 단계 호출 시 사용. */
    private String phoneVerificationToken;

    /** {@link #phoneVerificationToken} 만료(초). */
    private Long expiresInSeconds;

    /** JWT access token (로그인 완료 시). */
    private String accessToken;

    /** JWT refresh token. */
    private String refreshToken;

    /** 로그인 완료된 사용자 요약. */
    private MatchedAccount matchedAccount;

    /**
     * 매칭된 계정 요약 — 다중 매칭 화면에서 사용.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchedAccount {

        /** 사용자 PK. */
        private Long userId;

        /** 멀티테넌트 격리 id. */
        private String tenantId;

        /** 사용자 역할 문자열 (UserRole.name()). */
        private String role;
    }
}
