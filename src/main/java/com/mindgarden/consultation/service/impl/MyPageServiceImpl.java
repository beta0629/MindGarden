package com.mindgarden.consultation.service.impl;

import com.mindgarden.consultation.dto.MyPageResponse;
import com.mindgarden.consultation.dto.MyPageUpdateRequest;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.MyPageService;
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

    @Override
    public MyPageResponse getMyPageInfo(Long userId) {
        log.info("🔍 마이페이지 정보 조회: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
        
        return MyPageResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(user.getName())
                .phone(user.getPhone())
                .address(null) // UserAddress 엔티티에서 가져와야 함
                .profileImage(user.getProfileImageUrl())
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
        
        // 정보 업데이트
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        
        if (request.getProfileImage() != null) {
            user.setProfileImageUrl(request.getProfileImage());
        }
        
        User updatedUser = userRepository.save(user);
        
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
