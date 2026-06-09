package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 네이버 사용자 정보 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NaverUserInfo {
    
    /**
     * 네이버 사용자 ID
     */
    private String id;
    
    /**
     * 네이버 계정 이메일
     */
    private String email;
    
    /**
     * 네이버 닉네임
     */
    private String nickname;
    
    /**
     * 네이버 이름
     */
    private String name;
    
    /**
     * 네이버 프로필 이미지 URL
     */
    private String profileImageUrl;
    
    /**
     * 네이버 계정 연령대
     */
    private String age;
    
    /**
     * 네이버 계정 성별
     */
    private String gender;
    
    /**
     * 네이버 계정 생일
     */
    private String birthday;

    // 2026-06-09 (docs/project-management/2026-06-08/NAVER_LOGIN_REVIEW_REJECTION_RESPONSE_2026_06_05.md):
    // 네이버 휴대폰 scope 미사용 정책으로 휴대폰 필드 제거. 휴대폰 정보는 OAuth 응답이 아닌
    // /api/v1/auth/oauth/phone/{send,verify} OTP 흐름으로 사용자 입력 + 검증한다.
}
