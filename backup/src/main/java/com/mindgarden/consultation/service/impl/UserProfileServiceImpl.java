package com.mindgarden.consultation.service.impl;

import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.UserProfileUpdateRequest;
import com.mindgarden.consultation.dto.UserProfileResponse;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.UserProfileService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.Arrays;
import java.util.List;

/**
 * 유저 프로필 관리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {
    
    private final UserRepository userRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserProfileResponse updateUserProfile(Long userId, UserProfileUpdateRequest request) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
            
            log.info("유저 프로필 업데이트 시작: userId={}", userId);
            
            // 개인정보 암호화하여 저장
            if (request.getGender() != null) {
                user.setGender(encryptionUtil.encrypt(request.getGender()));
            }
            
            if (request.getBirthDate() != null) {
                user.setBirthDate(request.getBirthDate());
                // 나이대 자동 계산
                String ageGroup = calculateAgeGroup(request.getBirthDate());
                user.setAgeGroup(ageGroup);
            }
            
            if (request.getMemo() != null) {
                user.setMemo(request.getMemo());
            }
            
            if (request.getProfileImageUrl() != null) {
                user.setProfileImageUrl(request.getProfileImageUrl());
            }
            
            // 역할 변경 요청 처리
            if (request.getRequestedRole() != null && !request.getRequestedRole().equals(user.getRole())) {
                if (isValidRoleTransition(user.getRole(), request.getRequestedRole())) {
                    if (UserRole.CONSULTANT.equals(request.getRequestedRole()) && !checkConsultantEligibility(userId)) {
                        throw new RuntimeException("상담사 자격 요건을 충족하지 못합니다.");
                    } else if (UserRole.ADMIN.equals(request.getRequestedRole()) && !checkAdminEligibility(userId)) {
                        throw new RuntimeException("관리자 자격 요건을 충족하지 못합니다.");
                    } else if (UserRole.SUPER_ADMIN.equals(request.getRequestedRole()) && !checkSuperAdminEligibility(userId)) {
                        throw new RuntimeException("수퍼관리자 자격 요건을 충족하지 못합니다.");
                    }
                    
                    user.setRole(request.getRequestedRole());
                    log.info("사용자 역할 변경: userId={}, oldRole={}, newRole={}", 
                            userId, user.getRole(), request.getRequestedRole());
                } else {
                    throw new RuntimeException("유효하지 않은 역할 변경입니다.");
                }
            }
            
            // 역할별 추가 정보 저장
            saveRoleSpecificInfo(user, request);
            
            user = userRepository.save(user);
            log.info("유저 프로필 업데이트 완료: userId={}", userId);
            
            return buildUserProfileResponse(user);
            
        } catch (Exception e) {
            log.error("유저 프로필 업데이트 중 오류 발생: userId={}, error={}", userId, e.getMessage(), e);
            throw new RuntimeException("프로필 업데이트 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        return buildUserProfileResponse(user);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean changeUserRole(Long userId, String newRole) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
            
            // 역할 변경 가능 여부 확인
            if (!isValidRoleTransition(user.getRole(), newRole)) {
                throw new RuntimeException("유효하지 않은 역할 변경입니다.");
            }
            
            // 상담사로 변경하는 경우 자격 요건 확인
            if (UserRole.CONSULTANT.equals(newRole) && !checkConsultantEligibility(userId)) {
                throw new RuntimeException("상담사 자격 요건을 충족하지 못합니다.");
            }
            
            user.setRole(newRole);
            userRepository.save(user);
            
            log.info("사용자 역할 변경 완료: userId={}, oldRole={}, newRole={}", 
                    userId, user.getRole(), newRole);
            
            return true;
            
        } catch (Exception e) {
            log.error("사용자 역할 변경 중 오류 발생: userId={}, newRole={}, error={}", 
                    userId, newRole, e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public int getProfileCompletionRate(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        int completedFields = 0;
        int totalFields = 6; // 기본 필드 수
        
        // 필수 필드 확인
        if (user.getEmail() != null) completedFields++;
        if (user.getName() != null) completedFields++;
        if (user.getPhone() != null) completedFields++;
        if (user.getGender() != null) completedFields++;
        if (user.getBirthDate() != null) completedFields++;
        if (user.getProfileImageUrl() != null) completedFields++;
        
        // 상담사인 경우 추가 필드 확인
        if (UserRole.CONSULTANT.equals(user.getRole())) {
            totalFields += 5; // 상담사 전용 필드
            // 상담사 전용 필드 확인 로직 추가
        }
        
        return (int) Math.round((double) completedFields / totalFields * 100);
    }
    
    @Override
    public boolean checkConsultantEligibility(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 상담사 자격 요건 확인
        // 1. 이메일 인증 완료
        if (!user.getIsEmailVerified()) {
            return false;
        }
        
        // 2. 기본 프로필 정보 완성
        if (user.getGender() == null || user.getBirthDate() == null) {
            return false;
        }
        
        // 3. 나이 제한 (성인만)
        if (user.getBirthDate() != null) {
            int age = Period.between(user.getBirthDate(), LocalDate.now()).getYears();
            if (age < 20) {
                return false;
            }
        }
        
        // 4. 추가 자격 요건 (자격증, 경력 등) - 향후 확장
        return true;
    }
    
    /**
     * 나이대 계산
     */
    private String calculateAgeGroup(LocalDate birthDate) {
        int age = Period.between(birthDate, LocalDate.now()).getYears();
        
        if (age < 20) return "10대";
        else if (age < 30) return "20대";
        else if (age < 40) return "30대";
        else if (age < 50) return "40대";
        else if (age < 60) return "50대";
        else if (age < 70) return "60대";
        else return "70대 이상";
    }
    
    /**
     * 역할별 추가 정보 저장
     */
    private void saveRoleSpecificInfo(User user, UserProfileUpdateRequest request) {
        StringBuilder roleInfo = new StringBuilder();
        
        // 공통 추가 정보
        if (request.getPreferredCounselingArea() != null) {
            roleInfo.append("상담선호분야: ").append(request.getPreferredCounselingArea()).append("\n");
        }
        if (request.getPreferredCounselingMethod() != null) {
            roleInfo.append("상담선호방식: ").append(request.getPreferredCounselingMethod()).append("\n");
        }
        if (request.getCounselingNeeds() != null) {
            roleInfo.append("상담받고싶은내용: ").append(request.getCounselingNeeds()).append("\n");
        }
        
        // 상담사 전용 정보
        if (UserRole.CONSULTANT.equals(user.getRole()) || UserRole.ADMIN.equals(user.getRole()) || UserRole.SUPER_ADMIN.equals(user.getRole())) {
            if (request.getSpecialty() != null) {
                roleInfo.append("전문분야: ").append(request.getSpecialty()).append("\n");
            }
            if (request.getQualifications() != null) {
                roleInfo.append("자격증: ").append(request.getQualifications()).append("\n");
            }
            if (request.getExperience() != null) {
                roleInfo.append("경력: ").append(request.getExperience()).append("\n");
            }
            if (request.getAvailableTime() != null) {
                roleInfo.append("상담가능시간: ").append(request.getAvailableTime()).append("\n");
            }
            if (request.getDetailedIntroduction() != null) {
                roleInfo.append("상세자기소개: ").append(request.getDetailedIntroduction()).append("\n");
            }
            if (request.getEducation() != null) {
                roleInfo.append("학력: ").append(request.getEducation()).append("\n");
            }
            if (request.getAwards() != null) {
                roleInfo.append("수상경력: ").append(request.getAwards()).append("\n");
            }
            if (request.getResearch() != null) {
                roleInfo.append("연구실적: ").append(request.getResearch()).append("\n");
            }
            if (request.getHourlyRate() != null) {
                roleInfo.append("상담료: ").append(request.getHourlyRate()).append("원/시간\n");
            }
        }
        
        // 관리자 전용 정보
        if (UserRole.ADMIN.equals(user.getRole()) || UserRole.SUPER_ADMIN.equals(user.getRole())) {
            if (request.getAssignedTasks() != null) {
                roleInfo.append("담당업무: ").append(request.getAssignedTasks()).append("\n");
            }
            if (request.getManagementScope() != null) {
                roleInfo.append("관리권한범위: ").append(request.getManagementScope()).append("\n");
            }
            if (request.getDepartment() != null) {
                roleInfo.append("부서/팀: ").append(request.getDepartment()).append("\n");
            }
        }
        
        // 기존 memo와 합치기
        String existingMemo = user.getMemo() != null ? user.getMemo() : "";
        if (roleInfo.length() > 0) {
            user.setMemo(existingMemo + "\n" + roleInfo.toString());
        }
    }
    
    /**
     * 유효한 역할 전환인지 확인
     */
    private boolean isValidRoleTransition(String currentRole, String newRole) {
        // 역할 전환 규칙 정의
        if (UserRole.CLIENT.equals(currentRole)) {
            // 내담자 → 상담사/관리자/수퍼관리자 가능
            return UserRole.CONSULTANT.equals(newRole) || 
                   UserRole.ADMIN.equals(newRole) || 
                   UserRole.SUPER_ADMIN.equals(newRole);
        } else if (UserRole.CONSULTANT.equals(currentRole)) {
            // 상담사 → 관리자/수퍼관리자 가능
            return UserRole.ADMIN.equals(newRole) || 
                   UserRole.SUPER_ADMIN.equals(newRole);
        } else if (UserRole.ADMIN.equals(currentRole)) {
            // 관리자 → 수퍼관리자만 가능
            return UserRole.SUPER_ADMIN.equals(newRole);
        }
        // 수퍼관리자는 다른 역할로 변경 불가
        return false;
    }
    
    /**
     * 관리자 자격 요건 확인
     */
    private boolean checkAdminEligibility(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 1. 이메일 인증 완료
        if (!user.getIsEmailVerified()) {
            return false;
        }
        
        // 2. 기본 프로필 정보 완성
        if (user.getGender() == null || user.getBirthDate() == null) {
            return false;
        }
        
        // 3. 나이 제한 (성인만)
        if (user.getBirthDate() != null) {
            int age = Period.between(user.getBirthDate(), LocalDate.now()).getYears();
            if (age < 20) {
                return false;
            }
        }
        
        // 4. 상담사 경험 또는 관리 경험 필요
        // 현재는 간단하게 상담사 역할이었던 경우만 허용
        return UserRole.CONSULTANT.equals(user.getRole());
    }
    
    /**
     * 수퍼관리자 자격 요건 확인
     */
    private boolean checkSuperAdminEligibility(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 1. 이메일 인증 완료
        if (!user.getIsEmailVerified()) {
            return false;
        }
        
        // 2. 기본 프로필 정보 완성
        if (user.getGender() == null || user.getBirthDate() == null) {
            return false;
        }
        
        // 3. 나이 제한 (성인만)
        if (user.getBirthDate() != null) {
            int age = Period.between(user.getBirthDate(), LocalDate.now()).getYears();
            if (age < 20) {
                return false;
            }
        }
        
        // 4. 관리자 경험 필요
        return UserRole.ADMIN.equals(user.getRole());
    }
    
    /**
     * UserProfileResponse 빌드
     */
    private UserProfileResponse buildUserProfileResponse(User user) {
        return UserProfileResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .name(encryptionUtil.safeDecrypt(user.getName()))
            .nickname(encryptionUtil.safeDecrypt(user.getNickname()))
            .phone(encryptionUtil.safeDecrypt(user.getPhone()))
            .gender(encryptionUtil.safeDecrypt(user.getGender()))
            .birthDate(user.getBirthDate())
            .ageGroup(user.getAgeGroup())
            .role(user.getRole())
            .grade(user.getGrade())
            .experiencePoints(user.getExperiencePoints())
            .totalConsultations(user.getTotalConsultations())
            .profileImageUrl(user.getProfileImageUrl())
            .memo(user.getMemo())
            .isEmailVerified(user.getIsEmailVerified())
            .isActive(user.getIsActive())
            .lastLoginAt(user.getLastLoginAt())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .profileCompletionRate(getProfileCompletionRate(user.getId()))
            .consultantEligible(checkConsultantEligibility(user.getId()))
            .adminEligible(checkAdminEligibility(user.getId()))
            .canAddMoreInfo(true) // 항상 추가 정보 등록 가능
            .currentProfileStep(calculateProfileStep(user))
            .needsRoleSpecificInfo(needsRoleSpecificInfo(user))
            .nextStepMessage(getNextStepMessage(user))
            .build();
    }
    
    /**
     * 프로필 등록 단계 계산
     */
    private Integer calculateProfileStep(User user) {
        if (user.getGender() == null || user.getBirthDate() == null) {
            return 1; // 기본 정보 미완성
        } else if (user.getProfileImageUrl() == null) {
            return 2; // 기본 정보 완성, 추가 정보 미완성
        } else {
            return 3; // 모든 정보 완성
        }
    }
    
    /**
     * 역할별 추가 정보 등록 필요 여부 확인
     */
    private boolean needsRoleSpecificInfo(User user) {
        // 기본 정보가 완성되지 않았으면 역할별 정보 등록 불필요
        if (user.getGender() == null || user.getBirthDate() == null) {
            return false;
        }
        
        // 역할별로 필요한 추가 정보 확인
        if (UserRole.CONSULTANT.equals(user.getRole()) || 
            UserRole.ADMIN.equals(user.getRole()) || 
            UserRole.SUPER_ADMIN.equals(user.getRole())) {
            // 상담사/관리자 역할은 전문 정보 필요
            return true;
        }
        
        // 내담자도 상담 선호도 등 추가 정보 등록 가능
        return true;
    }
    
    /**
     * 다음 단계 안내 메시지 생성
     */
    private String getNextStepMessage(User user) {
        if (UserRole.CLIENT.equals(user.getRole())) {
            if (user.getGender() == null || user.getBirthDate() == null) {
                return "성별과 생년월일을 추가로 입력해주세요.";
            } else if (user.getProfileImageUrl() == null) {
                return "프로필 이미지를 추가해주세요.";
            } else {
                return "상담 선호도와 상담사 신청을 위한 추가 정보를 등록해주세요.";
            }
        } else if (UserRole.CONSULTANT.equals(user.getRole())) {
            return "상담사 프로필을 더 자세히 작성해주세요.";
        } else if (UserRole.ADMIN.equals(user.getRole())) {
            return "관리자 프로필을 더 자세히 작성해주세요.";
        } else if (UserRole.SUPER_ADMIN.equals(user.getRole())) {
            return "수퍼관리자 프로필이 완성되었습니다.";
        }
        
        return "프로필이 완성되었습니다.";
    }
}
