package com.mindgarden.consultation.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 마이페이지 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyPageResponse {

    private Long id;
    private String username;
    private String email;
    private String name;
    private String nickname;
    private String phone;
    private String gender;
    private String address;
    private String addressDetail;
    private String postalCode;
    private String profileImage;
    private String profileImageType; // USER_PROFILE, SOCIAL_IMAGE, DEFAULT_ICON
    private String socialProvider; // 소셜 제공자 (KAKAO, NAVER 등)
    private String socialProfileImage; // 소셜 프로필 이미지 URL
    private String role;
    private String grade;
    private Long experiencePoints;
    private Integer totalConsultations;
    private LocalDateTime lastLoginAt;
    private Boolean isActive;
    private Boolean isEmailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
