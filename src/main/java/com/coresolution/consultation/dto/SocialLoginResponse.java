package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 소셜 로그인 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialLoginResponse {
    
    /**
     * 로그인 성공 여부
     */
    private boolean success;
    
    /**
     * 응답 메시지
     */
    private String message;
    
    /**
     * JWT 액세스 토큰
     */
    private String accessToken;
    
    /**
     * JWT 리프레시 토큰
     */
    private String refreshToken;
    
    /**
     * 사용자 정보
     */
    private UserInfo userInfo;
    
    /**
     * 소셜 계정 정보
     */
    private SocialAccountInfo socialAccountInfo;
    
    /**
     * 간편 회원가입 필요 여부
     */
    private boolean requiresSignup;
    
    /**
     * 소셜 사용자 정보 (간편 회원가입 시 사용)
     */
    private SocialUserInfo socialUserInfo;
    
    /**
     * 계정 통합 필요 여부
     */
    private boolean requiresAccountIntegration;

    /**
     * 동일 전화에 관리자·상담사·스태프·내담자 등 서로 다른 역할이 2종 이상 있어 사용자가 계정을 고르기 전에는 소셜 연동하지 않는다.
     */
    @lombok.Builder.Default
    private boolean requiresPhoneAccountSelection = false;

    /**
     * {@link #requiresPhoneAccountSelection} 일 때만 설정. 완료 API·미리보기에 사용.
     */
    private String phoneAccountSelectionToken;

    /**
     * provider-agnostic OAuth 휴대폰 OTP 단계 진입 여부.
     *
     * <p>2026-06-09 OAuth 휴대폰 SSOT 정책: OAuth 콜백 시 provider sub·전화·이메일·user_id 매칭이 모두 실패하고
     * {@code oauth2Service.requiresPhoneOtp(...)} 가 {@code true} 인 경우에 본 플래그를 {@code true} 로
     * 설정한다. 클라이언트는 {@link #phoneVerificationToken} 을 가지고 OTP 입력 화면
     * ({@code /api/v1/auth/oauth/phone/{send,verify}}) 으로 dispatch 한다.</p>
     *
     * <p>Apple 흐름은 본 플래그를 사용하지 않는다 — 기존 {@code ApplePhoneVerificationService} alias 라우팅 유지.</p>
     */
    @lombok.Builder.Default
    private boolean requiresOAuthPhoneVerification = false;

    /**
     * {@link #requiresOAuthPhoneVerification} 일 때만 설정. OAuth 콜백 직후 발급되는 단기 JWT
     * ({@link com.coresolution.consultation.service.JwtService#generateOAuthPhoneVerificationToken}).
     */
    private String phoneVerificationToken;
    
    /**
     * 사용자 정보 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String email;
        private String name;
        private String nickname;
        private String role;
        private String profileImageUrl;
        private com.coresolution.consultation.entity.Branch branch;
        /**
         * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
         */
        @Deprecated        private String branchCode;
        /**
         * SNS 제공자 측 사용자 식별자(앱 User PK와 별개). 계정 연동(link) 시 {@code updateOrCreateSocialAccount}에 전달한다.
         * 과거 링크 버그로 User PK가 들어간 레거시 행은 별도 마이그레이션으로 정리한다.
         */
        private String providerUserId;
    }
    
    /**
     * 소셜 계정 정보 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SocialAccountInfo {
        private String provider;
        private String providerUserId;
        private String providerUsername;
        private String providerProfileImage;
        private boolean isPrimary;
        private boolean isVerified;
    }
}
