package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.Period;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.userprofile.UserProfileServiceUserFacingMessages;
import com.coresolution.consultation.dto.ConsultantApplicationRequest;
import com.coresolution.consultation.dto.UserProfileResponse;
import com.coresolution.consultation.dto.UserProfileUpdateRequest;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserAddress;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.UserAddressRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserProfileService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
    private final ConsultantRepository consultantRepository;
    private final UserAddressRepository userAddressRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final NotificationChannelPreferenceResolutionService notificationChannelPreferenceResolutionService;

    /**
     * 현재 테넌트 컨텍스트와 PK로 활성 사용자를 조회합니다.
     *
     * @param userId 사용자 PK
     * @return 사용자 엔티티
     */
    private User requireUserInCurrentTenant(Long userId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return userRepository.findByTenantIdAndId(tenantId, userId)
            .orElseThrow(() -> new RuntimeException(UserProfileServiceUserFacingMessages.MSG_USER_NOT_FOUND));
    }

    /**
     * {@code /api/v1/users/profile/{userId}} 조회·수정 시 호출자가 대상에 접근 가능한지 검증합니다.
     *
     * @param targetUserId 조회·수정 대상 사용자 PK
     * @param write        수정 요청이면 true
     */
    private void assertUserProfileTenantScopedAccess(Long targetUserId, boolean write) {
        User caller = SessionUtils.getCurrentUser(null);
        if (caller == null || caller.getId() == null) {
            throw new AccessDeniedException(UserProfileServiceUserFacingMessages.MSG_LOGIN_REQUIRED_FOR_PROFILE);
        }
        if (caller.getId().equals(targetUserId)) {
            return;
        }
        UserRole role = caller.getRole();
        if (role == null) {
            throw new AccessDeniedException(UserProfileServiceUserFacingMessages.MSG_ROLE_REQUIRED_FOR_PROFILE);
        }
        if (role.isClient() || role.isConsultant()) {
            throw new AccessDeniedException(UserProfileServiceUserFacingMessages.MSG_CANNOT_ACCESS_OTHER_USER_PROFILE);
        }
        if (write && !role.isAdmin()) {
            throw new AccessDeniedException(UserProfileServiceUserFacingMessages.MSG_ONLY_ADMIN_CAN_EDIT_OTHER_PROFILE);
        }
    }

    private boolean resolveNotificationChannelEditableByCaller(User target) {
        if (target.getRole() == null
            || (!UserRole.CLIENT.equals(target.getRole()) && !UserRole.CONSULTANT.equals(target.getRole()))) {
            return false;
        }
        User caller = SessionUtils.getCurrentUser(null);
        if (caller == null || caller.getId() == null) {
            return false;
        }
        if (caller.getId().equals(target.getId())) {
            return true;
        }
        UserRole cr = caller.getRole();
        return cr != null && cr.isAdmin();
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserProfileResponse updateUserProfile(Long userId, UserProfileUpdateRequest request) {
        try {
            assertUserProfileTenantScopedAccess(userId, true);
            User user = requireUserInCurrentTenant(userId);
            
            log.info("유저 프로필 업데이트 시작: userId={}", userId);

            if (request.getName() != null && !request.getName().trim().isEmpty()) {
                user.setName(encryptionUtil.encrypt(request.getName().trim()));
            }
            if (request.getNickname() != null && !request.getNickname().trim().isEmpty()) {
                user.setNickname(encryptionUtil.encrypt(request.getNickname().trim()));
            }
            if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
                user.setPhone(encryptionUtil.encrypt(request.getPhone().trim()));
            }

            if (request.getHourlyRate() != null) {
                log.debug("프로필 자가 수정: 상담료(hourlyRate)는 어드민/급여 정책 필드로 무시됩니다. userId={}", userId);
            }
            
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
                log.info("🖼️ 프로필 이미지 업데이트: userId={}, imageType={}, imageLength={}", 
                    userId, 
                    request.getProfileImageUrl().startsWith("data:") ? "base64" : "url",
                    request.getProfileImageUrl().length());
                user.setProfileImageUrl(request.getProfileImageUrl());
                log.info("✅ 프로필 이미지 저장 완료: userId={}", userId);
            }
            
            // 역할 변경 요청 처리
            if (request.getRequestedRole() != null && !request.getRequestedRole().equals(user.getRole())) {
                if (isValidRoleTransition(user.getRole(), request.getRequestedRole())) {
                    if (UserRole.CONSULTANT.equals(request.getRequestedRole()) && !checkConsultantEligibility(userId)) {
                        throw new RuntimeException(UserProfileServiceUserFacingMessages.MSG_CONSULTANT_ELIGIBILITY_NOT_MET);
                    } else if (UserRole.ADMIN.equals(request.getRequestedRole()) && !checkAdminEligibility(userId)) {
                        throw new RuntimeException(UserProfileServiceUserFacingMessages.MSG_ADMIN_ELIGIBILITY_NOT_MET);
                    }
                    
                    user.setRole(request.getRequestedRole());
                    log.info("사용자 역할 변경: userId={}, oldRole={}, newRole={}", 
                            userId, user.getRole(), request.getRequestedRole());
                } else {
                    throw new RuntimeException(UserProfileServiceUserFacingMessages.MSG_INVALID_ROLE_TRANSITION);
                }
            }
            
            // 역할별 추가 정보 저장
            saveRoleSpecificInfo(user, request);

            upsertPrimaryAddressIfRequested(userId, request);

            if (request.getNotificationChannelPreference() != null
                && (UserRole.CLIENT.equals(user.getRole()) || UserRole.CONSULTANT.equals(user.getRole()))) {
                String normalized = notificationChannelPreferenceResolutionService.normalizeIncomingPreference(
                    request.getNotificationChannelPreference(), user.getTenantId());
                user.setNotificationChannelPreference(normalized);
            }
            
            user = userRepository.save(user);
            log.info("유저 프로필 업데이트 완료: userId={}", userId);
            
            // 저장 후 프로필 이미지 확인
            log.info("🖼️ 저장 후 프로필 이미지 확인: userId={}, savedImage={}, imageType={}", 
                userId, 
                user.getProfileImageUrl() != null ? 
                    user.getProfileImageUrl().substring(0, Math.min(50, user.getProfileImageUrl().length())) + "..." : "null",
                user.getProfileImageUrl() != null && user.getProfileImageUrl().startsWith("data:") ? "base64" : "url");
            
            return buildUserProfileResponse(user);
            
        } catch (Exception e) {
            log.error("유저 프로필 업데이트 중 오류 발생: userId={}, error={}", userId, e.getMessage(), e);
            throw new RuntimeException(UserProfileServiceUserFacingMessages.MSG_PROFILE_UPDATE_ERROR_PREFIX + e.getMessage(), e);
        }
    }
    
    @Override
    public UserProfileResponse getUserProfile(Long userId) {
        assertUserProfileTenantScopedAccess(userId, false);
        User user = requireUserInCurrentTenant(userId);

        return buildUserProfileResponse(user);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean changeUserRole(Long userId, UserRole newRole) {
        try {
            User user = requireUserInCurrentTenant(userId);
            
            // 역할 변경 가능 여부 확인
            if (!isValidRoleTransition(user.getRole(), newRole)) {
                throw new RuntimeException(UserProfileServiceUserFacingMessages.MSG_INVALID_ROLE_TRANSITION);
            }
            
            // 상담사로 변경하는 경우 자격 요건 확인
            if (UserRole.CONSULTANT.equals(newRole) && !checkConsultantEligibility(userId)) {
                throw new RuntimeException(UserProfileServiceUserFacingMessages.MSG_CONSULTANT_ELIGIBILITY_NOT_MET);
            }
            
            user.setRole(newRole);
            userRepository.save(user);
            
            log.info("사용자 역할 변경 완료: userId={}, oldRole={}, newRole={}", 
                    userId, user.getRole(), newRole.getDisplayName());
            
            return true;
            
        } catch (Exception e) {
            log.error("사용자 역할 변경 중 오류 발생: userId={}, newRole={}, error={}", 
                    userId, newRole, e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public int getProfileCompletionRate(Long userId) {
        User user = requireUserInCurrentTenant(userId);
        
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
        User user = requireUserInCurrentTenant(userId);
        
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
        
        if (age < 20) {
            return UserProfileServiceUserFacingMessages.AGE_GROUP_TEENS;
        } else if (age < 30) {
            return UserProfileServiceUserFacingMessages.AGE_GROUP_20S;
        } else if (age < 40) {
            return UserProfileServiceUserFacingMessages.AGE_GROUP_30S;
        } else if (age < 50) {
            return UserProfileServiceUserFacingMessages.AGE_GROUP_40S;
        } else if (age < 60) {
            return UserProfileServiceUserFacingMessages.AGE_GROUP_50S;
        } else if (age < 70) {
            return UserProfileServiceUserFacingMessages.AGE_GROUP_60S;
        } else {
            return UserProfileServiceUserFacingMessages.AGE_GROUP_70_PLUS;
        }
    }
    
    /**
     * 역할별 추가 정보 저장
     */
    private void saveRoleSpecificInfo(User user, UserProfileUpdateRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<Consultant> consultantOpt = consultantRepository.findByTenantIdAndId(tenantId, user.getId());
        boolean consultantRowForProfile =
                consultantOpt.isPresent() && UserRole.CONSULTANT.equals(user.getRole());

        if (consultantRowForProfile) {
            Consultant consultant = consultantOpt.get();
            if (applyConsultantProfileToEntity(consultant, user, request)) {
                consultantRepository.save(consultant);
            }
        }

        boolean appendConsultantLikeMemo =
                !consultantRowForProfile
                        && (UserRole.CONSULTANT.equals(user.getRole()) || UserRole.ADMIN.equals(user.getRole()));

        StringBuilder roleInfo = new StringBuilder();

        if (request.getPreferredCounselingArea() != null) {
            roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_PREFERRED_COUNSELING_AREA)
                .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                .append(request.getPreferredCounselingArea()).append("\n");
        }
        if (request.getPreferredCounselingMethod() != null) {
            roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_PREFERRED_COUNSELING_METHOD)
                .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                .append(request.getPreferredCounselingMethod()).append("\n");
        }
        if (request.getCounselingNeeds() != null) {
            roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_COUNSELING_NEEDS)
                .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                .append(request.getCounselingNeeds()).append("\n");
        }

        if (appendConsultantLikeMemo) {
            if (request.getSpecialty() != null) {
                roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_SPECIALTY)
                    .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                    .append(request.getSpecialty()).append("\n");
            }
            if (request.getQualifications() != null) {
                roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_QUALIFICATIONS)
                    .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                    .append(request.getQualifications()).append("\n");
            }
            if (request.getExperience() != null) {
                roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_EXPERIENCE)
                    .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                    .append(request.getExperience()).append("\n");
            }
            if (request.getAvailableTime() != null) {
                roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_AVAILABLE_TIME)
                    .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                    .append(request.getAvailableTime()).append("\n");
            }
            if (request.getDetailedIntroduction() != null) {
                roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_DETAILED_INTRO)
                    .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                    .append(request.getDetailedIntroduction()).append("\n");
            }
            if (request.getEducation() != null) {
                roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_EDUCATION)
                    .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                    .append(request.getEducation()).append("\n");
            }
            if (request.getAwards() != null) {
                roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_AWARDS)
                    .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                    .append(request.getAwards()).append("\n");
            }
            if (request.getResearch() != null) {
                roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_RESEARCH)
                    .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                    .append(request.getResearch()).append("\n");
            }
        }

        if (user.getRole() != null && user.getRole().isAdmin()) {
            if (request.getAssignedTasks() != null) {
                roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_ASSIGNED_TASKS)
                    .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                    .append(request.getAssignedTasks()).append("\n");
            }
            if (request.getManagementScope() != null) {
                roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_MANAGEMENT_SCOPE)
                    .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                    .append(request.getManagementScope()).append("\n");
            }
            if (request.getDepartment() != null) {
                roleInfo.append(UserProfileServiceUserFacingMessages.MEMO_KEY_DEPARTMENT)
                    .append(UserProfileServiceUserFacingMessages.MEMO_KEY_VALUE_SEPARATOR)
                    .append(request.getDepartment()).append("\n");
            }
        }

        if (roleInfo.length() > 0) {
            String existingMemo = user.getMemo() != null ? user.getMemo() : "";
            user.setMemo(existingMemo + "\n" + roleInfo);
        }
    }

    /**
     * 상담사(consultants 행)에 프로필 필드를 반영합니다. 어드민 {@code ConsultantRegistrationRequest} 매핑과 정합합니다.
     *
     * @return 변경 여부
     */
    private boolean applyConsultantProfileToEntity(Consultant consultant, User user, UserProfileUpdateRequest request) {
        boolean changed = false;
        if (request.getSpecialty() != null) {
            consultant.setSpecialty(request.getSpecialty());
            user.setSpecialization(request.getSpecialty());
            changed = true;
        }
        if (request.getQualifications() != null) {
            consultant.setCertification(request.getQualifications());
            changed = true;
        }
        if (request.getExperience() != null) {
            consultant.setWorkHistory(request.getExperience());
            changed = true;
        }
        if (request.getAvailableTime() != null) {
            consultant.setConsultationHours(request.getAvailableTime());
            changed = true;
        }
        if (request.getDetailedIntroduction() != null) {
            consultant.setSpecialtyDetails(request.getDetailedIntroduction());
            changed = true;
        }
        if (request.getEducation() != null) {
            consultant.setEducation(request.getEducation());
            changed = true;
        }
        if (request.getAwards() != null) {
            consultant.setAwardsAchievements(request.getAwards());
            changed = true;
        }
        if (request.getResearch() != null) {
            consultant.setResearchPublications(request.getResearch());
            changed = true;
        }
        return changed;
    }
    
    /**
     * 유효한 역할 전환인지 확인
     */
    /**
     * 표준화 2025-12-05: 레거시 역할 제거, 표준 역할만 사용
     */
    private boolean isValidRoleTransition(UserRole currentRole, UserRole newRole) {
        if (currentRole == null || newRole == null) {
            return false;
        }
        
        // 역할 전환 규칙 정의
        if (UserRole.CLIENT.equals(currentRole)) {
            // 내담자 → 상담사/관리자 가능
            return UserRole.CONSULTANT.equals(newRole) || 
                   (newRole.isAdmin());
        } else if (UserRole.CONSULTANT.equals(currentRole)) {
            // 상담사 → 관리자 가능
            return newRole.isAdmin();
        } else if (currentRole.isAdmin()) {
            // 관리자 → 다른 관리자 역할로 전환 가능 (역할 상승 제한 없음)
            return newRole.isAdmin();
        }
        // 수퍼관리자는 다른 역할로 변경 불가
        return false;
    }
    
    /**
     * 관리자 자격 요건 확인
     */
    private boolean checkAdminEligibility(Long userId) {
        User user = requireUserInCurrentTenant(userId);
        
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
        User user = requireUserInCurrentTenant(userId);
        
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
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<Consultant> consultantOpt = consultantRepository.findByTenantIdAndId(tenantId, user.getId());
        Map<String, String> memoLines = parseMemoLabeledLines(user.getMemo());

        // 프로필 이미지 타입 결정
        String profileImageType = "DEFAULT_ICON";
        if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().trim().isEmpty()) {
            if (user.getProfileImageUrl().startsWith("data:image/")) {
                profileImageType = "USER_PROFILE";
            } else {
                profileImageType = "USER_PROFILE";
            }
        }

        String postalCodeOut = user.getPostalCode();
        String addressOut = user.getAddress();
        String addressDetailOut = user.getAddressDetail();
        Optional<UserAddress> primaryAddr = userAddressRepository
                .findByUserIdAndIsPrimaryTrueAndIsDeletedFalse(user.getId());
        if (primaryAddr.isPresent()) {
            UserAddress a = primaryAddr.get();
            if (a.getPostalCode() != null && !a.getPostalCode().trim().isEmpty()) {
                postalCodeOut = a.getPostalCode();
            }
            if (a.getFullAddress() != null && !a.getFullAddress().trim().isEmpty()) {
                addressOut = a.getFullAddress();
            }
            if (a.getDetailAddress() != null && !a.getDetailAddress().trim().isEmpty()) {
                addressDetailOut = a.getDetailAddress();
            }
        }

        String preferredCounselingArea = memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_PREFERRED_COUNSELING_AREA);
        String preferredCounselingMethod = memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_PREFERRED_COUNSELING_METHOD);
        String counselingNeeds = memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_COUNSELING_NEEDS);

        String specialtyOut = null;
        String qualificationsOut = null;
        String experienceOut = null;
        String availableTimeOut = null;
        String detailedIntroOut = null;
        String educationOut = null;
        String awardsOut = null;
        String researchOut = null;

        if (consultantOpt.isPresent()) {
            Consultant c = consultantOpt.get();
            specialtyOut = firstNonBlank(c.getSpecialty(), user.getSpecialization());
            qualificationsOut = c.getCertification();
            experienceOut = firstNonBlank(c.getWorkHistory(), c.getProfessionalBackground());
            availableTimeOut = c.getConsultationHours();
            detailedIntroOut = c.getSpecialtyDetails();
            educationOut = c.getEducation();
            awardsOut = c.getAwardsAchievements();
            researchOut = c.getResearchPublications();
        } else {
            specialtyOut = firstNonBlank(memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_SPECIALTY), user.getSpecialization());
            qualificationsOut = memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_QUALIFICATIONS);
            experienceOut = memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_EXPERIENCE);
            availableTimeOut = memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_AVAILABLE_TIME);
            detailedIntroOut = memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_DETAILED_INTRO);
            educationOut = memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_EDUCATION);
            awardsOut = memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_AWARDS);
            researchOut = memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_RESEARCH);
        }

        log.info("🖼️ UserProfileResponse 빌드: userId={}, profileImageType={}, hasImage={}",
            user.getId(), profileImageType, user.getProfileImageUrl() != null);

        NotificationChannelPreferenceResolutionService.NotificationChannelProfileSnapshot channelSnap =
            notificationChannelPreferenceResolutionService.buildProfileSnapshot(user);

        return UserProfileResponse.builder()
            .userId(user.getId())
            .email(encryptionUtil.safeDecrypt(user.getEmail()))
            .name(encryptionUtil.safeDecrypt(user.getName()))
            .nickname(encryptionUtil.safeDecrypt(user.getNickname()))
            .phone(encryptionUtil.safeDecrypt(user.getPhone()))
            .postalCode(postalCodeOut)
            .address(addressOut)
            .addressDetail(addressDetailOut)
            .gender(encryptionUtil.safeDecrypt(user.getGender()))
            .birthDate(user.getBirthDate())
            .ageGroup(user.getAgeGroup())
            .role(user.getRole())
            .grade(user.getGrade())
            .experiencePoints(user.getExperiencePoints())
            .totalConsultations(user.getTotalConsultations())
            .profileImageUrl(user.getProfileImageUrl())
            .profileImageType(profileImageType)
            .memo(user.getMemo())
            .preferredCounselingArea(preferredCounselingArea)
            .preferredCounselingMethod(preferredCounselingMethod)
            .counselingNeeds(counselingNeeds)
            .specialty(specialtyOut)
            .qualifications(qualificationsOut)
            .experience(experienceOut)
            .availableTime(availableTimeOut)
            .detailedIntroduction(detailedIntroOut)
            .education(educationOut)
            .awards(awardsOut)
            .research(researchOut)
            .hourlyRate(null)
            .assignedTasks(memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_ASSIGNED_TASKS))
            .managementScope(memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_MANAGEMENT_SCOPE))
            .department(memoLines.get(UserProfileServiceUserFacingMessages.MEMO_KEY_DEPARTMENT))
            .isEmailVerified(user.getIsEmailVerified())
            .isActive(user.getIsActive())
            .lastLoginAt(user.getLastLoginAt())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .profileCompletionRate(getProfileCompletionRate(user.getId()))
            .consultantEligible(checkConsultantEligibility(user.getId()))
            .adminEligible(checkAdminEligibility(user.getId()))
            .canAddMoreInfo(true)
            .currentProfileStep(calculateProfileStep(user))
            .needsRoleSpecificInfo(needsRoleSpecificInfo(user))
            .nextStepMessage(getNextStepMessage(user))
            .notificationChannelPreference(channelSnap.notificationChannelPreference())
            .tenantNotificationChannelKakaoAvailable(channelSnap.tenantNotificationChannelKakaoAvailable())
            .tenantNotificationChannelSmsAvailable(channelSnap.tenantNotificationChannelSmsAvailable())
            .tenantDefaultNotificationChannelHint(channelSnap.tenantDefaultNotificationChannelHint())
            .notificationChannelPreferenceUiAdjusted(channelSnap.notificationChannelPreferenceUiAdjusted())
            .notificationChannelPreferenceEditableByCaller(resolveNotificationChannelEditableByCaller(user))
            .build();
    }

    private static Map<String, String> parseMemoLabeledLines(String memo) {
        Map<String, String> map = new HashMap<>();
        if (memo == null || memo.isBlank()) {
            return map;
        }
        for (String raw : memo.split("\n")) {
            String line = raw.trim();
            if (line.isEmpty()) {
                continue;
            }
            int sep = line.indexOf(": ");
            if (sep <= 0) {
                continue;
            }
            String key = line.substring(0, sep).trim();
            String val = line.substring(sep + 2).trim();
            if (!key.isEmpty()) {
                map.put(key, val);
            }
        }
        return map;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.trim().isEmpty()) {
                return v;
            }
        }
        return null;
    }

    /**
     * 마이페이지와 동일 정책으로 기본 주소(user_addresses)를 upsert합니다.
     */
    private void upsertPrimaryAddressIfRequested(Long userId, UserProfileUpdateRequest request) {
        final String reqAddress = request.getAddress();
        final boolean hasAnyAddressField =
                (reqAddress != null && !reqAddress.trim().isEmpty())
                || (request.getAddressDetail() != null && !request.getAddressDetail().trim().isEmpty())
                || (request.getPostalCode() != null && !request.getPostalCode().trim().isEmpty());

        if (!hasAnyAddressField) {
            return;
        }

        Optional<UserAddress> primaryOpt = userAddressRepository.findByUserIdAndIsPrimaryTrueAndIsDeletedFalse(userId);

        if (primaryOpt.isEmpty() && (reqAddress == null || reqAddress.trim().isEmpty())) {
            log.warn("프로필 주소: 상세/우편번호만 전달되어 기본 주소 생성을 건너뜁니다. userId={}", userId);
            return;
        }

        UserAddress address = primaryOpt.orElseGet(UserAddress::new);
        address.setUserId(userId);
        if (request.getAddressType() != null && !request.getAddressType().trim().isEmpty()) {
            address.setAddressType(request.getAddressType());
        } else if (address.getAddressType() == null) {
            address.setAddressType("HOME");
        }
        if (primaryOpt.isEmpty() || Boolean.TRUE.equals(request.getIsPrimary())) {
            address.setIsPrimary(true);
        }
        if (reqAddress != null && !reqAddress.trim().isEmpty()) {
            String[] parsed = parseKoreanAddress(reqAddress.trim());
            address.setProvince(parsed[0]);
            address.setCity(parsed[1]);
            address.setDistrict(parsed[2]);
        }
        if (request.getAddressDetail() != null) {
            address.setDetailAddress(request.getAddressDetail());
        }
        if (request.getPostalCode() != null) {
            address.setPostalCode(request.getPostalCode());
        }
        userAddressRepository.save(address);
    }

    private String[] parseKoreanAddress(String fullAddress) {
        if (fullAddress == null) {
            String fb = UserProfileServiceUserFacingMessages.ADDRESS_FALLBACK_DISTRICT;
            return new String[] {fb, fb, fb};
        }
        String normalized = fullAddress.replaceAll("\\s+", " ").trim();
        String[] tokens = normalized.split(" ");
        if (tokens.length >= 3) {
            String province = tokens[0];
            String city = tokens[1];
            StringBuilder district = new StringBuilder();
            for (int i = 2; i < tokens.length; i++) {
                if (district.length() > 0) {
                    district.append(' ');
                }
                district.append(tokens[i]);
            }
            return new String[] { province, city, district.toString() };
        } else if (tokens.length == 2) {
            String fb = UserProfileServiceUserFacingMessages.ADDRESS_FALLBACK_DISTRICT;
            return new String[] {tokens[0], tokens[1], fb};
        } else if (tokens.length == 1) {
            String fb = UserProfileServiceUserFacingMessages.ADDRESS_FALLBACK_DISTRICT;
            return new String[] {tokens[0], fb, fb};
        }
        String fb = UserProfileServiceUserFacingMessages.ADDRESS_FALLBACK_DISTRICT;
        return new String[] {fb, fb, fb};
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
        // 표준화 2025-12-05: HQ_MASTER → ADMIN으로 통합
        if (UserRole.CONSULTANT.equals(user.getRole()) || 
            user.getRole() != null && user.getRole().isAdmin()) {
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
                return UserProfileServiceUserFacingMessages.MSG_NEXT_STEP_CLIENT_GENDER_BIRTH;
            } else if (user.getProfileImageUrl() == null) {
                return UserProfileServiceUserFacingMessages.MSG_NEXT_STEP_CLIENT_PROFILE_IMAGE;
            } else {
                return UserProfileServiceUserFacingMessages.MSG_NEXT_STEP_CLIENT_PREFERENCES;
            }
        } else if (UserRole.CONSULTANT.equals(user.getRole())) {
            return UserProfileServiceUserFacingMessages.MSG_NEXT_STEP_CONSULTANT_PROFILE;
        } else if (UserRole.ADMIN.equals(user.getRole())) {
            return UserProfileServiceUserFacingMessages.MSG_NEXT_STEP_ADMIN_PROFILE;
        }
        
        return UserProfileServiceUserFacingMessages.MSG_PROFILE_COMPLETE;
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> applyForConsultant(Long userId, ConsultantApplicationRequest request) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            User user = requireUserInCurrentTenant(userId);
            
            log.info("상담사 신청 처리 시작: userId={}, currentRole={}", userId, user.getRole());
            
            // 1. 현재 역할이 내담자인지 확인
            if (!UserRole.CLIENT.equals(user.getRole())) {
                result.put("success", false);
                result.put("message", UserProfileServiceUserFacingMessages.MSG_APPLY_CONSULTANT_ONLY_CLIENT);
                return result;
            }
            
            // 2. 상담사 자격 요건 확인
            if (!checkConsultantEligibility(userId)) {
                result.put("success", false);
                result.put("message", UserProfileServiceUserFacingMessages.MSG_CONSULTANT_ELIGIBILITY_NOT_MET_DETAILED);
                result.put("requirements", getConsultantRequirements(user));
                return result;
            }
            
            // 3. 상담사 신청 정보를 메모에 저장
            StringBuilder applicationInfo = new StringBuilder();
            String notEntered = UserProfileServiceUserFacingMessages.VALUE_NOT_ENTERED;
            applicationInfo.append(UserProfileServiceUserFacingMessages.APPLICATION_INFO_HEADER);
            applicationInfo.append(UserProfileServiceUserFacingMessages.APPLICATION_DATE_LABEL).append(java.time.LocalDateTime.now()).append("\n");
            applicationInfo.append(UserProfileServiceUserFacingMessages.APPLICATION_REASON_LABEL)
                .append(request.getApplicationReason() != null ? request.getApplicationReason() : notEntered).append("\n");
            applicationInfo.append(UserProfileServiceUserFacingMessages.APPLICATION_RELATED_EXPERIENCE_LABEL)
                .append(request.getExperience() != null ? request.getExperience() : notEntered).append("\n");
            applicationInfo.append(UserProfileServiceUserFacingMessages.APPLICATION_CERTIFICATIONS_LABEL)
                .append(request.getCertifications() != null ? request.getCertifications() : notEntered).append("\n");
            applicationInfo.append(UserProfileServiceUserFacingMessages.APPLICATION_SPECIALTY_LABEL)
                .append(request.getSpecialty() != null ? request.getSpecialty() : notEntered).append("\n");
            applicationInfo.append(UserProfileServiceUserFacingMessages.APPLICATION_INTRO_LABEL)
                .append(request.getIntroduction() != null ? request.getIntroduction() : notEntered).append("\n");
            applicationInfo.append(UserProfileServiceUserFacingMessages.APPLICATION_CONTACT_LABEL)
                .append(request.getContactInfo() != null ? request.getContactInfo() : notEntered).append("\n");
            applicationInfo.append(UserProfileServiceUserFacingMessages.APPLICATION_PREFERRED_HOURS_LABEL)
                .append(request.getPreferredHours() != null ? request.getPreferredHours() : notEntered).append("\n");
            applicationInfo.append(UserProfileServiceUserFacingMessages.APPLICATION_ADDITIONAL_NOTES_LABEL)
                .append(request.getAdditionalNotes() != null ? request.getAdditionalNotes() : notEntered).append("\n");
            
            // 기존 메모에 추가
            String existingMemo = user.getMemo() != null ? user.getMemo() : "";
            user.setMemo(existingMemo + applicationInfo.toString());
            
            // 4. 사용자 역할을 상담사로 변경
            user.setRole(UserRole.CONSULTANT);
            user.setUpdatedAt(java.time.LocalDateTime.now());
            
            user = userRepository.save(user);
            
            log.info("상담사 신청 완료: userId={}, newRole={}", userId, user.getRole());
            
            result.put("success", true);
            result.put("message", UserProfileServiceUserFacingMessages.MSG_CONSULTANT_APPLICATION_SUCCESS);
            result.put("userId", userId);
            result.put("newRole", user.getRole().getDisplayName());
            result.put("applicationDate", java.time.LocalDateTime.now());
            
            return result;
            
        } catch (Exception e) {
            log.error("상담사 신청 중 오류 발생: userId={}, error={}", userId, e.getMessage(), e);
            result.put("success", false);
            result.put("message", UserProfileServiceUserFacingMessages.MSG_CONSULTANT_APPLICATION_ERROR_PREFIX + e.getMessage());
            return result;
        }
    }
    
    /**
     * 상담사 자격 요건 상세 정보 반환
     */
    private Map<String, Object> getConsultantRequirements(User user) {
        Map<String, Object> requirements = new HashMap<>();
        
        boolean emailVerified = user.getIsEmailVerified();
        boolean hasGender = user.getGender() != null;
        boolean hasBirthDate = user.getBirthDate() != null;
        
        // 나이 확인
        boolean isAdult = true;
        if (user.getBirthDate() != null) {
            int age = Period.between(user.getBirthDate(), LocalDate.now()).getYears();
            isAdult = age >= 20;
        }
        
        requirements.put("emailVerified", emailVerified);
        requirements.put("hasGender", hasGender);
        requirements.put("hasBirthDate", hasBirthDate);
        requirements.put("isAdult", isAdult);
        
        return requirements;
    }
}
