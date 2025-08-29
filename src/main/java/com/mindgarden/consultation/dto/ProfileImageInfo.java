package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 프로필 사진 우선순위 정보 DTO
 * 1. 사용자 프로필 사진 2. SNS 이미지 3. 기본 아이콘
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileImageInfo {
    
    /**
     * 사용자 ID
     */
    private Long userId;
    
    /**
     * 사용자 이름
     */
    private String userName;
    
    /**
     * 사용자 이메일
     */
    private String userEmail;
    
    /**
     * 사용자 역할
     */
    private String userRole;
    
    /**
     * 사용자 프로필 사진 URL (1순위)
     */
    private String userProfileImageUrl;
    
    /**
     * SNS 제공자 (KAKAO, NAVER 등)
     */
    private String socialProvider;
    
    /**
     * SNS 프로필 이미지 URL (2순위)
     */
    private String socialProfileImageUrl;
    
    /**
     * 최종 프로필 이미지 URL (우선순위 적용)
     */
    private String finalProfileImageUrl;
    
    /**
     * 프로필 이미지 타입 (USER_PROFILE, SOCIAL_IMAGE, DEFAULT_ICON)
     */
    private String profileImageType;
}
