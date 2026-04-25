package com.coresolution.consultation.dto;

import java.time.LocalDate;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 유저 프로필 추가 정보 등록 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileUpdateRequest {
    
    @Size(max = 10, message = "성별은 10자 이하여야 합니다.")
    private String gender;
    
    private LocalDate birthDate;
    
    @Size(max = 20, message = "나이대는 20자 이하여야 합니다.")
    private String ageGroup;
    
    @Size(max = 500, message = "자기소개는 500자 이하여야 합니다.")
    private String memo;
    
    @Size(max = 500, message = "프로필 이미지 URL은 500자 이하여야 합니다.")
    private String profileImageUrl;

    /** 표시명 등 수정 시 (암호화 저장). 마이페이지와 동일 정책. */
    @Size(max = 100, message = "이름은 100자 이하여야 합니다.")
    private String name;

    @Size(max = 50, message = "닉네임은 50자 이하여야 합니다.")
    private String nickname;

    @Size(max = 50, message = "전화번호는 50자 이하여야 합니다.")
    private String phone;

    /** {@code user_addresses} upsert 시 주소 유형 (예: HOME). */
    @Size(max = 20, message = "주소 유형은 20자 이하여야 합니다.")
    private String addressType;

    @Size(max = 20, message = "우편번호는 20자 이하여야 합니다.")
    private String postalCode;

    @Size(max = 500, message = "주소는 500자 이하여야 합니다.")
    private String address;

    @Size(max = 500, message = "상세 주소는 500자 이하여야 합니다.")
    private String addressDetail;

    /** 기본 주소로 설정 여부 ({@code user_addresses}) */
    private Boolean isPrimary;
    
    // 내담자/상담사 공통 추가 정보
    @Size(max = 100, message = "상담 선호 분야는 100자 이하여야 합니다.")
    private String preferredCounselingArea;
    
    @Size(max = 50, message = "상담 선호 방식은 50자 이하여야 합니다.")
    private String preferredCounselingMethod; // 대면/비대면/혼합
    
    @Size(max = 500, message = "상담 받고 싶은 내용은 500자 이하여야 합니다.")
    private String counselingNeeds;
    
    // 상담사 전용 정보 (역할이 CONSULTANT인 경우)
    @Size(max = 100, message = "전문 분야는 100자 이하여야 합니다.")
    private String specialty;
    
    @Size(max = 500, message = "자격증 정보는 500자 이하여야 합니다.")
    private String qualifications;
    
    @Size(max = 1000, message = "경력 사항은 1000자 이하여야 합니다.")
    private String experience;
    
    @Size(max = 500, message = "상담 가능 시간은 500자 이하여야 합니다.")
    private String availableTime;
    
    @Size(max = 2000, message = "상세 자기소개는 2000자 이하여야 합니다.")
    private String detailedIntroduction;
    
    @Size(max = 500, message = "학력 정보는 500자 이하여야 합니다.")
    private String education;
    
    @Size(max = 500, message = "수상 경력은 500자 이하여야 합니다.")
    private String awards;
    
    @Size(max = 1000, message = "연구 실적은 1000자 이하여야 합니다.")
    private String research;
    
    // 상담료 (시간당) - 상담사 전용
    private Integer hourlyRate;
    
    // 관리자 전용 정보 (역할이 ADMIN/SUPER_ADMIN인 경우)
    @Size(max = 100, message = "담당 업무는 100자 이하여야 합니다.")
    private String assignedTasks;
    
    @Size(max = 500, message = "관리 권한 범위는 500자 이하여야 합니다.")
    private String managementScope;
    
    @Size(max = 200, message = "부서/팀은 200자 이하여야 합니다.")
    private String department;
    
    // 역할 변경 요청
    private com.coresolution.consultation.constant.UserRole requestedRole;
    
    // 추가 정보 등록 단계 (1: 기본정보, 2: 역할별추가정보, 3: 완료)
    private Integer profileStep;

    /** 알림 수신 채널 선호: TENANT_DEFAULT | KAKAO | SMS (내담자·상담사만 적용) */
    @Size(max = 32, message = "알림 채널 선호 값이 너무 깁니다.")
    private String notificationChannelPreference;
}
