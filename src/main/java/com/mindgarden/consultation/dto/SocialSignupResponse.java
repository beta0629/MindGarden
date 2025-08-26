package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 소셜 회원가입 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialSignupResponse {
    
    /**
     * 회원가입 성공 여부
     */
    private boolean success;
    
    /**
     * 응답 메시지
     */
    private String message;
    
    /**
     * 생성된 사용자 ID
     */
    private Long userId;
    
    /**
     * 사용자 이메일
     */
    private String email;
    
    /**
     * 사용자 이름
     */
    private String name;
    
        /**
     * 사용자 닉네임
     */
    private String nickname;
    
    /**
     * 리다이렉트 URL (로그인 페이지)
     */
    private String redirectUrl;
    
    /**
     * 상담사 신청 가능 여부
     */
    private boolean canApplyConsultant;
    
    /**
     * 상담사 신청 안내 메시지
     */
    private String consultantApplicationMessage;
    
    /**
     * 프로필 완성도 (0-100%)
     */
    private int profileCompletionRate;
}
