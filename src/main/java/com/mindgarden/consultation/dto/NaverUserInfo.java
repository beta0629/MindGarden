package com.mindgarden.consultation.dto;

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
    
    /**
     * 네이버 계정 휴대폰 번호
     */
    private String mobile;
}
