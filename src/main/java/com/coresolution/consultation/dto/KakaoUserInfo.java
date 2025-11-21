package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 카카오 사용자 정보 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KakaoUserInfo {
    
    /**
     * 카카오 사용자 ID
     */
    private String id;
    
    /**
     * 카카오 계정 이메일
     */
    private String email;
    
    /**
     * 카카오 닉네임
     */
    private String nickname;
    
    /**
     * 카카오 프로필 이미지 URL
     */
    private String profileImageUrl;
    
    /**
     * 카카오 계정 타입 (카카오계정, 카카오톡)
     */
    private String accountType;
    
    /**
     * 카카오 계정 연령대
     */
    private String ageRange;
    
    /**
     * 카카오 계정 성별
     */
    private String gender;
    
    /**
     * 카카오 계정 생일
     */
    private String birthday;
}
