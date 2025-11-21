package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 소셜 회원가입 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialSignupRequest {
    
    /**
     * 이름
     */
    private String name;
    
    /**
     * 닉네임
     */
    private String nickname;
    
    /**
     * 이메일
     */
    private String email;
    
    /**
     * 비밀번호
     */
    private String password;
    
    /**
     * 비밀번호 확인
     */
    private String confirmPassword;
    
    /**
     * 휴대폰 번호
     */
    private String phone;
    
    /**
     * 이용약관 동의 여부
     */
    private boolean agreeTerms;
    
    /**
     * 마케팅 정보 수신 동의 여부
     */
    private boolean agreeMarketing;
    
    /**
     * 개인정보 처리방침 동의 여부
     */
    private boolean privacyConsent;
    
    /**
     * 이용약관 동의 여부 (새로운 필드명)
     */
    private boolean termsConsent;
    
    /**
     * 마케팅 정보 수신 동의 여부 (새로운 필드명)
     */
    private boolean marketingConsent;
    
    /**
     * 소셜 계정 제공자 (KAKAO, NAVER 등)
     */
    private String provider;
    
    /**
     * 소셜 계정 사용자 ID
     */
    private String providerUserId;
    
    /**
     * 소셜 계정 사용자명
     */
    private String providerUsername;
    
    /**
     * 소셜 계정 프로필 이미지 URL
     */
    private String providerProfileImage;
    
    /**
     * 지점 코드 (지점별 사용자 등록 시)
     */
    private String branchCode;
}
