package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 계정 통합 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountIntegrationResponse {
    
    /**
     * 성공 여부
     */
    private boolean success;
    
    /**
     * 응답 메시지
     */
    private String message;
    
    /**
     * 통합된 사용자 ID
     */
    private Long userId;
    
    /**
     * 통합된 사용자 이메일
     */
    private String email;
    
    /**
     * 통합된 사용자 이름
     */
    private String name;
    
    /**
     * 통합된 사용자 닉네임
     */
    private String nickname;
    
    /**
     * 사용자 역할
     */
    private String role;
    
    /**
     * 프로필 이미지 URL
     */
    private String profileImageUrl;
    
    /**
     * JWT 액세스 토큰
     */
    private String accessToken;
    
    /**
     * JWT 리프레시 토큰
     */
    private String refreshToken;
    
    /**
     * 통합 상태
     */
    private IntegrationStatus status;
    
    /**
     * 연결된 소셜 계정 정보
     */
    private SocialAccountInfo socialAccountInfo;
    
    /**
     * 통합 상태 열거형
     */
    public enum IntegrationStatus {
        SUCCESS,                    // 통합 성공
        EMAIL_VERIFICATION_REQUIRED, // 이메일 인증 필요
        PASSWORD_VERIFICATION_REQUIRED, // 비밀번호 검증 필요
        ACCOUNT_NOT_FOUND,          // 계정을 찾을 수 없음
        ALREADY_INTEGRATED,         // 이미 통합됨
        VERIFICATION_FAILED,        // 인증 실패
        INTEGRATION_FAILED          // 통합 실패
    }
    
    /**
     * 소셜 계정 정보
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
    
    /**
     * 성공 응답 생성
     */
    public static AccountIntegrationResponse success(String message, Long userId, String email, 
                                                   String name, String nickname, String role,
                                                   String accessToken, String refreshToken) {
        return AccountIntegrationResponse.builder()
            .success(true)
            .message(message)
            .userId(userId)
            .email(email)
            .name(name)
            .nickname(nickname)
            .role(role)
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .status(IntegrationStatus.SUCCESS)
            .build();
    }
    
    /**
     * 실패 응답 생성
     */
    public static AccountIntegrationResponse failure(String message, IntegrationStatus status) {
        return AccountIntegrationResponse.builder()
            .success(false)
            .message(message)
            .status(status)
            .build();
    }
    
    /**
     * 이메일 인증 필요 응답 생성
     */
    public static AccountIntegrationResponse emailVerificationRequired(String message) {
        return AccountIntegrationResponse.builder()
            .success(false)
            .message(message)
            .status(IntegrationStatus.EMAIL_VERIFICATION_REQUIRED)
            .build();
    }
    
    /**
     * 비밀번호 검증 필요 응답 생성
     */
    public static AccountIntegrationResponse passwordVerificationRequired(String message) {
        return AccountIntegrationResponse.builder()
            .success(false)
            .message(message)
            .status(IntegrationStatus.PASSWORD_VERIFICATION_REQUIRED)
            .build();
    }
}
