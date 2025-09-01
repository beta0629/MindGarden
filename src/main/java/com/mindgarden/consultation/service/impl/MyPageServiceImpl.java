package com.mindgarden.consultation.service.impl;

import java.util.List;
import com.mindgarden.consultation.dto.MyPageResponse;
import com.mindgarden.consultation.dto.MyPageUpdateRequest;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.MyPageService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MyPageServiceImpl implements MyPageService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PersonalDataEncryptionUtil encryptionUtil;

    @Override
    public MyPageResponse getMyPageInfo(Long userId) {
        log.info("🔍 마이페이지 정보 조회: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
        
        // 프로필 이미지 정보 조회
        List<Object[]> profileResults = userRepository.findProfileImageInfoByUserId(userId);
        
        // 프로필 이미지 우선순위 결정
        String finalProfileImageUrl;
        String profileImageType;
        String socialProvider = null;
        String socialProfileImage = null;
        
        // 1. 사용자 프로필 사진 우선
        if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().trim().isEmpty()) {
            finalProfileImageUrl = user.getProfileImageUrl();
            profileImageType = "USER_PROFILE";
        } else {
            // 2. SNS 이미지 찾기
            for (Object[] result : profileResults) {
                String provider = (String) result[5];
                String providerImage = (String) result[6];
                
                if (provider != null && providerImage != null && !providerImage.trim().isEmpty()) {
                    socialProfileImage = providerImage;
                    socialProvider = provider;
                    break;
                }
            }
            
            if (socialProfileImage != null && !socialProfileImage.trim().isEmpty()) {
                finalProfileImageUrl = socialProfileImage;
                profileImageType = "SOCIAL_IMAGE";
            } else {
                // 3. 기본 아이콘
                finalProfileImageUrl = "/images/default-profile-icon.png";
                profileImageType = "DEFAULT_ICON";
            }
        }
        
        // 암호화된 데이터 복호화
        String decryptedNickname = null;
        String decryptedPhone = null;
        String decryptedGender = null;
        
        try {
            if (user.getNickname() != null && !user.getNickname().trim().isEmpty()) {
                decryptedNickname = encryptionUtil.decrypt(user.getNickname());
            }
            if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
                decryptedPhone = encryptionUtil.decrypt(user.getPhone());
            }
            if (user.getGender() != null && !user.getGender().trim().isEmpty()) {
                decryptedGender = encryptionUtil.decrypt(user.getGender());
            }
        } catch (Exception e) {
            log.warn("데이터 복호화 실패, 원본 데이터 사용: {}", e.getMessage());
            decryptedNickname = user.getNickname();
            decryptedPhone = user.getPhone();
            decryptedGender = user.getGender();
        }
        
        return MyPageResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(user.getName())
                .nickname(decryptedNickname)
                .phone(decryptedPhone)
                .gender(decryptedGender)
                .profileImage(finalProfileImageUrl)
                .profileImageType(profileImageType)
                .socialProvider(socialProvider)
                .socialProfileImage(socialProfileImage)
                .role(user.getRole())
                .grade(user.getGrade())
                .experiencePoints(user.getExperiencePoints())
                .totalConsultations(user.getTotalConsultations())
                .lastLoginAt(user.getLastLoginAt())
                .isActive(user.getIsActive())
                .isEmailVerified(user.getIsEmailVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    @Override
    public MyPageResponse updateMyPageInfo(Long userId, MyPageUpdateRequest request) {
        log.info("🔧 마이페이지 정보 수정: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
        
        // 정보 업데이트 (암호화 처리)
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            try {
                String encryptedName = encryptionUtil.encrypt(request.getName());
                user.setName(encryptedName);
                log.info("이름 암호화 완료: {} -> {}", request.getName(), encryptedName);
            } catch (Exception e) {
                log.error("이름 암호화 실패: {}", e.getMessage());
                user.setName(request.getName());
            }
        }
        
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            try {
                String encryptedPhone = encryptionUtil.encrypt(request.getPhone());
                user.setPhone(encryptedPhone);
                log.info("전화번호 암호화 완료: {} -> {}", request.getPhone(), encryptedPhone);
            } catch (Exception e) {
                log.error("전화번호 암호화 실패: {}", e.getMessage());
                user.setPhone(request.getPhone());
            }
        }
        
        if (request.getNickname() != null && !request.getNickname().trim().isEmpty()) {
            try {
                String encryptedNickname = encryptionUtil.encrypt(request.getNickname());
                user.setNickname(encryptedNickname);
                log.info("닉네임 암호화 완료: {} -> {}", request.getNickname(), encryptedNickname);
            } catch (Exception e) {
                log.error("닉네임 암호화 실패: {}", e.getMessage());
                user.setNickname(request.getNickname());
            }
        }
        
        if (request.getGender() != null && !request.getGender().trim().isEmpty()) {
            try {
                String encryptedGender = encryptionUtil.encrypt(request.getGender());
                user.setGender(encryptedGender);
                log.info("성별 암호화 완료: {} -> {}", request.getGender(), encryptedGender);
            } catch (Exception e) {
                log.error("성별 암호화 실패: {}", e.getMessage());
                user.setGender(request.getGender());
            }
        }
        
        if (request.getProfileImage() != null) {
            user.setProfileImageUrl(request.getProfileImage());
        }
        
        User updatedUser = userRepository.save(user);
        log.info("마이페이지 정보 수정 완료: userId={}", userId);
        
        return getMyPageInfo(userId);
    }

    @Override
    public String uploadProfileImage(Long userId, String imageUrl) {
        log.info("🔧 프로필 이미지 업로드: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
        
        user.setProfileImageUrl(imageUrl);
        userRepository.save(user);
        
        return imageUrl;
    }

    @Override
    public String changePassword(Long userId, String newPassword) {
        log.info("🔧 비밀번호 변경: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        return "비밀번호가 성공적으로 변경되었습니다.";
    }

    @Override
    public String getSocialAccountInfo(Long userId) {
        log.info("🔍 소셜 계정 정보 조회: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
        
        // 소셜 계정 정보 반환 (구현 필요)
        return "소셜 계정 정보";
    }

    @Override
    public String linkSocialAccount(Long userId, String socialType, String socialId) {
        log.info("🔧 소셜 계정 연동: {} - {}:{}", userId, socialType, socialId);
        
        // 소셜 계정 연동 로직 구현 필요
        return "소셜 계정이 성공적으로 연동되었습니다.";
    }

    @Override
    public String unlinkSocialAccount(Long userId, String socialType) {
        log.info("🔧 소셜 계정 연동 해제: {} - {}", userId, socialType);
        
        // 소셜 계정 연동 해제 로직 구현 필요
        return "소셜 계정 연동이 해제되었습니다.";
    }

    @Override
    public String deleteAccount(String username) {
        log.info("🔧 계정 삭제: {}", username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + username));
        
        user.setIsActive(false);
        userRepository.save(user);
        
        return "계정이 성공적으로 삭제되었습니다.";
    }
}
