package com.coresolution.consultation.dto;

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
    private String userId;
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
    /** 휴대폰 OTP 소유 확인 여부 — {@code phone_otp_attempts} PROFILE verified_at 에서 계산. SNS claim ≠ verified. */
    private Boolean isPhoneVerified;
    /** 휴대폰 OTP 소유 확인 시각 — PROFILE 장부 {@code verified_at} (API 파생 필드). */
    private LocalDateTime phoneVerifiedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String notificationChannelPreference;
    private Boolean tenantNotificationChannelKakaoAvailable;
    private Boolean tenantNotificationChannelSmsAvailable;
    private String tenantDefaultNotificationChannelHint;
    private Boolean notificationChannelPreferenceUiAdjusted;
}
