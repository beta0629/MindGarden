package com.mindgarden.consultation.dto;

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
