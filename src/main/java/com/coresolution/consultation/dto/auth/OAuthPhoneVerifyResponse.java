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
     * 매칭된 계정 요약 — 다중 매칭 화면 및 OTP 직후 첫 진입 화면(홈/프로필) 표시용.
     *
     * <p>2026-06-10 P1: FE {@code useAuthStore} 가 OTP 검증 응답 직후 `/users/me` 를 별도 호출하지
     * 않고 본 객체로 user 상태를 채운다. name/email/phone 등이 누락되면 홈 화면 "님, 안녕하세요"
     * 빈 prefix 및 프로필 화면 "내담자 ㆍ ㅡ" 빈 이름이 노출되므로, 매칭 결과 user 의 표시 필드를
     * 모두 포함해 응답해야 한다. name·email 은 복호화 평문, phone 은 11자리 digits 평문
     * (FE 가 표시 시 마스킹 책임).</p>
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

        /**
         * 사용자 표시 이름 (복호화 평문, PII).
         *
         * <p>2026-06-10 P1: FE 홈 화면 `{user?.name ?? '내담자'}님, 안녕하세요` 의 prefix 채움.</p>
         */
        private String name;

        /** 사용자 이메일 (복호화 평문, PII). 없으면 null. */
        private String email;

        /** 사용자 닉네임 — 보통 name 과 동일하거나 짧은 표시명. */
        private String nickname;

        /**
         * 사용자 휴대폰 (11자리 digits 평문, PII).
         *
         * <p>FE 가 표시 시 반드시 `maskKoreanMobileForDisplay` 등으로 마스킹.</p>
         */
        private String phone;

        /** 사용자 프로필 이미지 URL (절대/상대). 없으면 null. */
        private String profileImageUrl;
    }
}
