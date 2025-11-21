package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 계정 통합 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountIntegrationRequest {
    
    /**
     * 기존 계정 이메일
     */
    private String existingEmail;
    
    /**
     * 기존 계정 비밀번호 (검증용)
     */
    private String existingPassword;
    
    /**
     * SNS 제공자 (GOOGLE, KAKAO, NAVER 등)
     */
    private String provider;
    
    /**
     * SNS 제공자 사용자 ID
     */
    private String providerUserId;
    
    /**
     * SNS 이메일
     */
    private String socialEmail;
    
    /**
     * 이메일 인증 코드
     */
    private String verificationCode;
    
    /**
     * 통합 후 사용할 이메일 (기존 이메일 또는 SNS 이메일)
     */
    private String finalEmail;
    
    /**
     * 통합 후 사용할 이름
     */
    private String finalName;
    
    /**
     * 통합 후 사용할 닉네임
     */
    private String finalNickname;
}
