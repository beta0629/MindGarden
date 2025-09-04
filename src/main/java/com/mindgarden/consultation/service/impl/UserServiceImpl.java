package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.ProfileImageInfo;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.BaseRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.UserService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UserService 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Service
@Transactional
public class UserServiceImpl implements UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private PersonalDataEncryptionUtil encryptionUtil;
    
    // ==================== BaseService 구현 ====================
    
    @Override
    public User save(User user) {
        if (user.getId() == null) {
            user.setCreatedAt(LocalDateTime.now());
            user.setVersion(1L);
            if (user.getPassword() != null && !isPasswordEncoded(user.getPassword())) {
                user.setPassword(passwordEncoder.encode(user.getPassword()));
            }
        }
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        return userRepository.save(user);
    }
    
    @Override
    public List<User> saveAll(List<User> users) {
        users.forEach(user -> {
            if (user.getId() == null) {
                user.setCreatedAt(LocalDateTime.now());
                user.setVersion(1L);
                if (user.getPassword() != null && !isPasswordEncoded(user.getPassword())) {
                    user.setPassword(passwordEncoder.encode(user.getPassword()));
                }
            }
            user.setUpdatedAt(LocalDateTime.now());
            user.setVersion(user.getVersion() + 1);
        });
        
        return userRepository.saveAll(users);
    }
    
    @Override
    public User update(User user) {
        User existingUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + user.getId()));
        
        if (user.getPassword() != null && !user.getPassword().equals(existingUser.getPassword())) {
            if (!isPasswordEncoded(user.getPassword())) {
                user.setPassword(passwordEncoder.encode(user.getPassword()));
            }
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(existingUser.getVersion() + 1);
        
        return userRepository.save(user);
    }
    
    @Override
    public User partialUpdate(Long id, User updateData) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + id));
        
        if (updateData.getName() != null) {
            existingUser.setName(updateData.getName());
        }
        if (updateData.getEmail() != null) {
            existingUser.setEmail(updateData.getEmail());
        }
        if (updateData.getPhone() != null) {
            existingUser.setPhone(updateData.getPhone());
        }
        if (updateData.getRole() != null) {
            existingUser.setRole(updateData.getRole());
        }
        if (updateData.getGrade() != null) {
            existingUser.setGrade(updateData.getGrade());
        }
        if (updateData.getPassword() != null) {
            existingUser.setPassword(passwordEncoder.encode(updateData.getPassword()));
        }
        
        existingUser.setUpdatedAt(LocalDateTime.now());
        existingUser.setVersion(existingUser.getVersion() + 1);
        
        return userRepository.save(existingUser);
    }
    
    @Override
    public void softDeleteById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + id));
        
        user.setIsDeleted(true);
        user.setDeletedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        userRepository.save(user);
    }
    
    @Override
    public void restoreById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + id));
        
        user.setIsDeleted(false);
        user.setDeletedAt(null);
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        userRepository.save(user);
    }
    
    @Override
    public void hardDeleteById(Long id) {
        userRepository.deleteById(id);
    }
    
    @Override
    public List<User> findAllActive() {
        List<User> users = userRepository.findAllActive();
        return decryptUserListPersonalData(users);
    }
    
    @Override
    public Optional<User> findActiveById(Long id) {
        Optional<User> userOpt = userRepository.findActiveById(id);
        if (userOpt.isPresent()) {
            return Optional.of(decryptUserPersonalData(userOpt.get()));
        }
        return userOpt;
    }
    
    @Override
    public User findActiveByIdOrThrow(Long id) {
        User user = userRepository.findActiveById(id)
                .orElseThrow(() -> new RuntimeException("활성 사용자를 찾을 수 없습니다: " + id));
        return decryptUserPersonalData(user);
    }
    
    @Override
    public long countActive() {
        return userRepository.countActive();
    }
    
    @Override
    public List<User> findAllDeleted() {
        return userRepository.findAllDeleted();
    }
    
    @Override
    public long countDeleted() {
        return userRepository.countDeleted();
    }
    
    @Override
    public boolean existsActiveById(Long id) {
        return userRepository.existsActiveById(id);
    }
    
    @Override
    public Optional<User> findByIdAndVersion(Long id, Long version) {
        return userRepository.findByIdAndVersion(id, version);
    }
    
    @Override
    public boolean isDuplicateExcludingIdAll(Long excludeId, String fieldName, Object fieldValue, boolean includeDeleted) {
        return userRepository.isDuplicateExcludingIdAll(excludeId, fieldName, fieldValue, includeDeleted);
    }
    
    @Override
    public Object[] getEntityStatistics() {
        return userRepository.getEntityStatistics();
    }
    
    @Override
    public void cleanupOldDeleted(LocalDateTime cutoffDate) {
        userRepository.cleanupOldDeleted(cutoffDate);
    }
    
    @Override
    public Page<User> findAllActive(Pageable pageable) {
        return userRepository.findAllActive(pageable);
    }
    
    @Override
    public List<User> findRecentActive(int limit) {
        return userRepository.findRecentActive(limit);
    }
    
    @Override
    public List<User> findRecentlyUpdatedActive(int limit) {
        return userRepository.findRecentlyUpdatedActive(limit);
    }
    
    @Override
    public List<User> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return userRepository.findByCreatedAtBetween(startDate, endDate);
    }
    
    @Override
    public List<User> findByUpdatedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return userRepository.findByUpdatedAtBetween(startDate, endDate);
    }
    
    @Override
    public BaseRepository<User, Long> getRepository() {
        return userRepository;
    }
    
    // ==================== UserService 특화 메서드 ====================
    
    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    @Override
    public Optional<User> findByPhone(String phone) {
        return userRepository.findByPhone(phone);
    }
    
    @Override
    public Optional<User> findByNickname(String nickname) {
        return userRepository.findByNickname(nickname);
    }
    
    @Override
    public List<User> findByRole(String role) {
        List<User> users = userRepository.findByRole(UserRole.fromString(role));
        return decryptUserListPersonalData(users);
    }
    
    @Override
    public Page<User> findByRole(String role, Pageable pageable) {
        Page<User> userPage = userRepository.findByRole(UserRole.fromString(role), pageable);
        return decryptUserPagePersonalData(userPage);
    }
    
    @Override
    public long countByRole(String role) {
        return userRepository.countByRole(UserRole.fromString(role));
    }
    
    @Override
    public List<User> findByGrade(String grade) {
        return userRepository.findByGrade(grade);
    }
    
    @Override
    public Page<User> findByGrade(String grade, Pageable pageable) {
        return userRepository.findByGrade(grade, pageable);
    }
    
    @Override
    public long countByGrade(String grade) {
        return userRepository.countByGrade(grade);
    }
    
    @Override
    public List<User> findByIsActive(Boolean isActive) {
        return userRepository.findByIsActive(isActive);
    }
    
    @Override
    public Page<User> findByIsActive(Boolean isActive, Pageable pageable) {
        return userRepository.findByIsActive(isActive, pageable);
    }
    
    @Override
    public long countByIsActive(Boolean isActive) {
        return userRepository.countByIsActive(isActive);
    }
    
    @Override
    public List<User> findByGender(String gender) {
        return userRepository.findByGender(gender);
    }
    
    @Override
    public long countByGender(String gender) {
        return userRepository.countByGender(gender);
    }
    
    @Override
    public List<User> findByAgeGroup(String ageGroup) {
        return userRepository.findByAgeGroup(ageGroup);
    }
    
    @Override
    public long countByAgeGroup(String ageGroup) {
        return userRepository.countByAgeGroup(ageGroup);
    }
    
    @Override
    public ProfileImageInfo getProfileImageInfo(Long userId) {
        List<Object[]> results = userRepository.findProfileImageInfoByUserId(userId);
        
        if (results.isEmpty()) {
            return ProfileImageInfo.builder()
                .userId(userId)
                .finalProfileImageUrl("/images/default-profile-icon.png")
                .profileImageType("DEFAULT_ICON")
                .build();
        }
        
        // 첫 번째 결과에서 기본 사용자 정보 추출
        Object[] firstResult = results.get(0);
        Long id = (Long) firstResult[0];
        String name = (String) firstResult[1];
        String email = (String) firstResult[2];
        String role = (String) firstResult[3];
        String userProfileImageUrl = (String) firstResult[4];
        
        // 프로필 이미지 우선순위 결정
        String finalProfileImageUrl;
        String profileImageType;
        String socialProfileImageUrl = null;
        String socialProvider = null;
        
        // 1. 사용자 프로필 사진 우선
        if (userProfileImageUrl != null && !userProfileImageUrl.trim().isEmpty()) {
            finalProfileImageUrl = userProfileImageUrl;
            profileImageType = "USER_PROFILE";
        } else {
            // 2. SNS 이미지 찾기
            for (Object[] result : results) {
                String provider = (String) result[5];
                String providerImage = (String) result[6];
                
                if (provider != null && providerImage != null && !providerImage.trim().isEmpty()) {
                    socialProfileImageUrl = providerImage;
                    socialProvider = provider;
                    break;
                }
            }
            
            if (socialProfileImageUrl != null && !socialProfileImageUrl.trim().isEmpty()) {
                finalProfileImageUrl = socialProfileImageUrl;
                profileImageType = "SOCIAL_IMAGE";
            } else {
                // 3. 기본 아이콘
                finalProfileImageUrl = "/images/default-profile-icon.png";
                profileImageType = "DEFAULT_ICON";
            }
        }
        
        return ProfileImageInfo.builder()
            .userId(id)
            .userName(name)
            .userEmail(email)
            .userRole(role)
            .userProfileImageUrl(userProfileImageUrl)
            .socialProvider(socialProvider)
            .socialProfileImageUrl(socialProfileImageUrl)
            .finalProfileImageUrl(finalProfileImageUrl)
            .profileImageType(profileImageType)
            .build();
    }
    
    @Override
    public Page<User> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return userRepository.findByCreatedAtBetween(startDate, endDate, pageable);
    }
    
    @Override
    public List<User> findByLastLoginAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return userRepository.findByLastLoginAtBetween(startDate, endDate);
    }
    
    @Override
    public List<User> findByNameContaining(String name) {
        return userRepository.findByNameContaining(name);
    }
    
    @Override
    public Page<User> findByNameContaining(String name, Pageable pageable) {
        return userRepository.findByNameContaining(name, pageable);
    }
    
    @Override
    public List<User> findByNicknameContaining(String nickname) {
        return userRepository.findByNicknameContaining(nickname);
    }
    
    @Override
    public Page<User> findByNicknameContaining(String nickname, Pageable pageable) {
        return userRepository.findByNicknameContaining(nickname, pageable);
    }
    
    @Override
    public List<User> findByEmailContaining(String email) {
        return userRepository.findByEmailContaining(email);
    }
    
    @Override
    public Page<User> findByEmailContaining(String email, Pageable pageable) {
        return userRepository.findByEmailContaining(email, pageable);
    }
    
    @Override
    public List<User> findByPhoneContaining(String phone) {
        return userRepository.findByPhoneContaining(phone);
    }
    
    @Override
    public Page<User> findByPhoneContaining(String phone, Pageable pageable) {
        return userRepository.findByPhoneContaining(phone, pageable);
    }
    
    @Override
    public Page<User> findByComplexCriteria(String name, String email, String role, String grade, 
                                          Boolean isActive, String gender, String ageGroup, Pageable pageable) {
        UserRole userRole = role != null ? UserRole.fromString(role) : null;
        return userRepository.findByComplexCriteria(name, email, userRole, grade, isActive, gender, ageGroup, pageable);
    }
    
    @Override
    public Object[] getUserStatistics() {
        return userRepository.getUserStatistics();
    }
    
    @Override
    public List<Object[]> getUserStatisticsByRole() {
        return userRepository.getUserStatisticsByRole();
    }
    
    @Override
    public List<Object[]> getUserStatisticsByGrade() {
        return userRepository.getUserStatisticsByGrade();
    }
    
    @Override
    public List<Object[]> getUserStatisticsByGender() {
        return userRepository.getUserStatisticsByGender();
    }
    
    @Override
    public List<Object[]> getUserStatisticsByAgeGroup() {
        return userRepository.getUserStatisticsByAgeGroup();
    }
    
    @Override
    public User registerUser(User user) {
        return save(user);
    }
    
    @Override
    public User updateUserProfile(Long id, User updateData) {
        return partialUpdate(id, updateData);
    }
    
    @Override
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = findActiveByIdOrThrow(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("기존 비밀번호가 일치하지 않습니다.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        userRepository.save(user);
    }
    
    @Override
    public void resetPassword(String email) {
        User user = findByEmail(email)
                .orElseThrow(() -> new RuntimeException("이메일로 사용자를 찾을 수 없습니다: " + email));
        
        // 임시 비밀번호 생성 및 설정
        String tempPassword = generateTempPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        userRepository.save(user);
        
        // TODO: 이메일로 임시 비밀번호 발송
    }
    
    @Override
    public void setUserActive(Long id, boolean isActive) {
        User user = findActiveByIdOrThrow(id);
        user.setIsActive(isActive);
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        userRepository.save(user);
    }
    
    @Override
    public void changeUserRole(Long id, String newRole) {
        User user = findActiveByIdOrThrow(id);
        user.setRole(UserRole.fromString(newRole));
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        userRepository.save(user);
    }
    
    @Override
    public void changeUserGrade(Long id, String newGrade) {
        User user = findActiveByIdOrThrow(id);
        user.setGrade(newGrade);
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        userRepository.save(user);
    }
    
    @Override
    public void addExperiencePoints(Long id, Long points) {
        User user = findActiveByIdOrThrow(id);
        user.setExperiencePoints(user.getExperiencePoints() + points);
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        userRepository.save(user);
    }
    
    @Override
    public void incrementConsultations(Long id) {
        User user = findActiveByIdOrThrow(id);
        user.setTotalConsultations(user.getTotalConsultations() + 1);
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        userRepository.save(user);
    }
    
    @Override
    public void updateLastLogin(Long id) {
        updateLastLoginTime(id);
    }
    
    @Override
    public void verifyEmail(Long id) {
        User user = findActiveByIdOrThrow(id);
        user.setIsEmailVerified(true);
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        userRepository.save(user);
    }
    
    @Override
    public void deleteUserAccount(Long id) {
        softDeleteById(id);
    }
    
    @Override
    public void restoreUserAccount(Long id) {
        restoreById(id);
    }
    
    @Override
    public boolean isDuplicateExcludingId(Long excludeId, String fieldName, String fieldValue) {
        return isDuplicateExcludingIdAll(excludeId, fieldName, fieldValue, false);
    }
    
    @Override
    public List<User> findRecentLoginUsers(int limit) {
        return userRepository.findRecentLoginUsers(limit);
    }
    
    @Override
    public List<User> findInactiveUsers(LocalDateTime cutoffDate) {
        return userRepository.findInactiveUsers(cutoffDate);
    }
    
    @Override
    public List<User> findByExperiencePointsGreaterThanEqual(Long minPoints) {
        return userRepository.findByExperiencePointsGreaterThanEqual(minPoints);
    }
    
    @Override
    public Page<User> findByExperiencePointsGreaterThanEqual(Long minPoints, Pageable pageable) {
        return userRepository.findByExperiencePointsGreaterThanEqual(minPoints, pageable);
    }
    
    @Override
    public List<User> findByTotalConsultationsGreaterThanEqual(Integer minCount) {
        return userRepository.findByTotalConsultationsGreaterThanEqual(minCount);
    }
    
    @Override
    public Page<User> findByTotalConsultationsGreaterThanEqual(Integer minCount, Pageable pageable) {
        return userRepository.findByTotalConsultationsGreaterThanEqual(minCount, pageable);
    }
    
    @Override
    public boolean authenticateUser(String email, String password) {
        Optional<User> userOpt = findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return !user.getIsDeleted() && passwordEncoder.matches(password, user.getPassword());
        }
        return false;
    }
    
    @Override
    public void changePassword(Long userId, String newPassword) {
        User user = findActiveByIdOrThrow(userId);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        userRepository.save(user);
    }
    
    @Override
    public void updateLastLoginTime(Long userId) {
        User user = findActiveByIdOrThrow(userId);
        user.setLastLoginAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setVersion(user.getVersion() + 1);
        
        userRepository.save(user);
    }
    
    // ==================== 유틸리티 메서드 ====================
    
    /**
     * 임시 비밀번호 생성
     */
    private String generateTempPassword() {
        return "Temp" + System.currentTimeMillis() % 10000;
    }
    
    /**
     * 사용자 개인정보 복호화
     */
    private User decryptUserPersonalData(User user) {
        if (user == null || encryptionUtil == null) {
            return user;
        }
        
        try {
            // 이름 복호화 (암호화된 데이터인지 확인)
            if (user.getName() != null && !user.getName().trim().isEmpty()) {
                if (isEncryptedData(user.getName())) {
                    user.setName(encryptionUtil.decrypt(user.getName()));
                }
                // 암호화되지 않은 데이터는 그대로 유지
            }
            
            // 닉네임 복호화
            if (user.getNickname() != null && !user.getNickname().trim().isEmpty()) {
                if (isEncryptedData(user.getNickname())) {
                    user.setNickname(encryptionUtil.decrypt(user.getNickname()));
                }
            }
            
            // 전화번호 복호화
            if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
                if (isEncryptedData(user.getPhone())) {
                    user.setPhone(encryptionUtil.decrypt(user.getPhone()));
                }
            }
            
            // 성별 복호화
            if (user.getGender() != null && !user.getGender().trim().isEmpty()) {
                if (isEncryptedData(user.getGender())) {
                    user.setGender(encryptionUtil.decrypt(user.getGender()));
                }
            }
            
        } catch (Exception e) {
            // 복호화 실패 시 원본 데이터 유지
            System.err.println("사용자 개인정보 복호화 실패: " + e.getMessage());
        }
        
        return user;
    }
    
    /**
     * 데이터가 암호화된 데이터인지 확인
     * Base64 패턴과 길이로 판단
     */
    private boolean isEncryptedData(String data) {
        if (data == null || data.trim().isEmpty()) {
            return false;
        }
        
        // Base64 패턴 확인 (A-Z, a-z, 0-9, +, /, =)
        if (!data.matches("^[A-Za-z0-9+/]*={0,2}$")) {
            return false;
        }
        
        // 암호화된 데이터는 일반적으로 20자 이상
        if (data.length() < 20) {
            return false;
        }
        
        // 한글이나 특수문자가 포함된 경우 평문으로 판단
        if (data.matches(".*[가-힣].*") || data.matches(".*[^A-Za-z0-9+/=].*")) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 사용자 목록 개인정보 복호화
     */
    private List<User> decryptUserListPersonalData(List<User> users) {
        if (users == null || encryptionUtil == null) {
            return users;
        }
        
        users.forEach(this::decryptUserPersonalData);
        return users;
    }
    
    /**
     * 사용자 페이지 개인정보 복호화
     */
    private Page<User> decryptUserPagePersonalData(Page<User> userPage) {
        if (userPage == null || encryptionUtil == null) {
            return userPage;
        }
        
        userPage.getContent().forEach(this::decryptUserPersonalData);
        return userPage;
    }
    
    /**
     * 비밀번호가 이미 인코딩되었는지 확인
     * BCrypt 해시는 $2a$, $2b$, $2y$ 등으로 시작하고 길이가 60자
     */
    private boolean isPasswordEncoded(String password) {
        if (password == null || password.isEmpty()) {
            return false;
        }
        
        // BCrypt 해시 패턴 확인: $2a$, $2b$, $2y$ 등으로 시작하고 길이가 60자
        return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$") 
               && password.length() == 60;
    }
}
