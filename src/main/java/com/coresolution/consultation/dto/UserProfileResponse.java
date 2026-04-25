package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 유저 프로필 조회 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    
    private Long userId;
    private String email;
    private String name;
    private String nickname;
    private String phone;
    /**
     * 우편번호. {@code user_addresses} 기본 주소 우선, 없으면 {@code users.postal_code}.
     */
    private String postalCode;
    /**
     * 기본 주소 한 줄. {@code user_addresses} 기본 주소 우선, 없으면 {@code users.address}.
     */
    private String address;
    /**
     * 상세 주소. {@code user_addresses} 기본 주소 우선, 없으면 {@code users.address_detail}.
     */
    private String addressDetail;
    private String gender;
    private LocalDate birthDate;
    private String ageGroup;
    private com.coresolution.consultation.constant.UserRole role;
    private String grade;
    private Long experiencePoints;
    private Integer totalConsultations;
    private String profileImageUrl;
    private String profileImageType;
    private String memo;
    private Boolean isEmailVerified;
    private Boolean isActive;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 내담자/상담사 공통 추가 정보
    private String preferredCounselingArea;
    private String preferredCounselingMethod;
    private String counselingNeeds;
    
    // 상담사 전용 정보
    private String specialty;
    private String qualifications;
    private String experience;
    private String availableTime;
    private String detailedIntroduction;
    private String education;
    private String awards;
    private String research;
    private Integer hourlyRate;
    
    // 관리자 전용 정보
    private String assignedTasks;
    private String managementScope;
    private String department;
    
    // 프로필 완성도
    private int profileCompletionRate;
    
    // 상담사 자격 요건 충족 여부
    private boolean consultantEligible;
    
    // 관리자 자격 요건 충족 여부
    private boolean adminEligible;
    
    // 추가 정보 등록 가능 여부
    private boolean canAddMoreInfo;
    
    // 현재 프로필 등록 단계
    private Integer currentProfileStep;
    
    // 다음 단계 안내 메시지
    private String nextStepMessage;
    
    // 역할별 추가 정보 등록 필요 여부
    private boolean needsRoleSpecificInfo;

    // --- 알림 수신 채널 선호(Phase1, 내담자·상담사 중심) ---
    /** DB 저장값: TENANT_DEFAULT | KAKAO | SMS */
    private String notificationChannelPreference;
    /** 테넌트 알림톡 인프라 사용 가능 여부 */
    private Boolean tenantNotificationChannelKakaoAvailable;
    /** 테넌트 SMS 인프라 사용 가능 여부 */
    private Boolean tenantNotificationChannelSmsAvailable;
    /** HIGH 우선순위 기준 테넌트 기본 1순위 힌트(KAKAO|SMS|NONE) */
    private String tenantDefaultNotificationChannelHint;
    /** 저장값이 테넌트와 충돌해 UI에서 테넌트 기본으로 안내할 때 true */
    private Boolean notificationChannelPreferenceUiAdjusted;
    /**
     * 호출자 기준으로 알림 채널 선호 UI를 수정할 수 있는지(본인 내담자·상담사 또는 동일 테넌트 ADMIN이 타인 CLIENT/CONSULTANT 수정 시).
     * STAFF가 타인을 조회한 경우 false.
     */
    private Boolean notificationChannelPreferenceEditableByCaller;
}
