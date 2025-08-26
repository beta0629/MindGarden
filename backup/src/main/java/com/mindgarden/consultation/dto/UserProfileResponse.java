package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
    private String gender;
    private LocalDate birthDate;
    private String ageGroup;
    private String role;
    private String grade;
    private Long experiencePoints;
    private Integer totalConsultations;
    private String profileImageUrl;
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
}
