package com.coresolution.consultation.service.impl;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.dto.MyPageResponse;
import com.coresolution.consultation.dto.MyPageUpdateRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserAddress;
import com.coresolution.consultation.repository.UserAddressRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MyPageService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
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
    private final UserAddressRepository userAddressRepository;

    /**
     * 현재 테넌트 컨텍스트와 PK로 사용자를 조회합니다.
     *
     * @param userId 사용자 PK
     * @return 사용자 엔티티
     */
    private User requireUserInCurrentTenant(Long userId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return userRepository.findByTenantIdAndId(tenantId, userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    @Override
    public MyPageResponse getMyPageInfo(Long userId) {
        log.info("🔍 마이페이지 정보 조회: {}", userId);

        User user = requireUserInCurrentTenant(userId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        log.info("🖼️ DB에서 조회한 사용자 프로필 이미지: userId={}, dbImage={}, imageType={}", 
            userId, 
            user.getProfileImageUrl() != null ? 
                user.getProfileImageUrl().substring(0, Math.min(50, user.getProfileImageUrl().length())) + "..." : "null",
            user.getProfileImageUrl() != null && user.getProfileImageUrl().startsWith("data:") ? "base64" : "url");
        
        // 프로필 이미지 정보 조회
        List<Object[]> profileResults = userRepository.findProfileImageInfoByUserId(tenantId, userId);
        
        // 프로필 이미지 우선순위 결정
        String finalProfileImageUrl;
        String profileImageType;
        String socialProvider = null;
        String socialProfileImage = null;
        
        // 1. 사용자 프로필 사진 우선
        if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().trim().isEmpty()) {
            log.info("🖼️ 사용자 프로필 이미지 사용: userId={}, imageType={}, imageLength={}", 
                userId,
                user.getProfileImageUrl().startsWith("data:") ? "base64" : "url",
                user.getProfileImageUrl().length());
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
                finalProfileImageUrl = "/default-avatar.svg";
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
        
        // 기본 주소 조회
        String mpPostalCode = null;
        String mpAddress = null;
        String mpAddressDetail = null;
        Optional<UserAddress> primaryAddressOpt = userAddressRepository.findByUserIdAndIsPrimaryTrueAndIsDeletedFalse(userId);
        if (primaryAddressOpt.isPresent()) {
            UserAddress addr = primaryAddressOpt.get();
            mpPostalCode = addr.getPostalCode();
            mpAddress = addr.getFullAddress();
            mpAddressDetail = addr.getDetailAddress();
        }
        
        log.info("🖼️ 최종 프로필 이미지 정보: userId={}, finalImage={}, imageType={}", 
            userId, 
            finalProfileImageUrl != null ? finalProfileImageUrl.substring(0, Math.min(50, finalProfileImageUrl.length())) + "..." : "null",
            profileImageType);
        
        return MyPageResponse.builder()
                .id(user.getId())
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getName())
                .nickname(decryptedNickname)
                .phone(decryptedPhone)
                .gender(decryptedGender)
                .postalCode(mpPostalCode)
                .address(mpAddress)
                .addressDetail(mpAddressDetail)
                .profileImage(finalProfileImageUrl)
                .profileImageType(profileImageType)
                .socialProvider(socialProvider)
                .socialProfileImage(socialProfileImage)
                .role(user.getRole().getValue())
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
        
        User user = requireUserInCurrentTenant(userId);

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
            log.info("🖼️ 프로필 이미지 업데이트: userId={}, imageType={}, imageLength={}", 
                userId, 
                request.getProfileImage().startsWith("data:") ? "base64" : "url",
                request.getProfileImage().length());
            
            // Base64 이미지 저장 (TEXT 컬럼으로 저장 가능)
            user.setProfileImageUrl(request.getProfileImage());
        }
        
        User updatedUser = userRepository.save(user);
        
        // 저장 후 프로필 이미지 확인
        log.info("🖼️ 저장 후 프로필 이미지 확인: userId={}, savedImage={}, imageType={}", 
            userId, 
            updatedUser.getProfileImageUrl() != null ? 
                updatedUser.getProfileImageUrl().substring(0, Math.min(50, updatedUser.getProfileImageUrl().length())) + "..." : "null",
            updatedUser.getProfileImageUrl() != null && updatedUser.getProfileImageUrl().startsWith("data:") ? "base64" : "url");

        // 주소 upsert: 기본 주소 기준
        final String reqAddress = request.getAddress();
        final boolean hasAnyAddressField =
                (reqAddress != null && !reqAddress.trim().isEmpty())
                || (request.getAddressDetail() != null && !request.getAddressDetail().trim().isEmpty())
                || (request.getPostalCode() != null && !request.getPostalCode().trim().isEmpty());

        if (hasAnyAddressField) {
            Optional<UserAddress> primaryOpt = userAddressRepository.findByUserIdAndIsPrimaryTrueAndIsDeletedFalse(userId);

            // 신규 생성이 필요한데 기본 주소 문자열이 없다면 저장을 시도하지 않음 (필수 컬럼 제약 회피)
            if (primaryOpt.isEmpty() && (reqAddress == null || reqAddress.trim().isEmpty())) {
                log.warn("주소 상세/우편번호만 전달되어 기본 주소 생성을 건너뜁니다. userId={}", userId);
            } else {
                UserAddress address = primaryOpt.orElseGet(UserAddress::new);
                address.setUserId(userId);
                // 타입
                if (request.getAddressType() != null && !request.getAddressType().trim().isEmpty()) {
                    address.setAddressType(request.getAddressType());
                } else if (address.getAddressType() == null) {
                    address.setAddressType("HOME");
                }
                // 기본 여부
                if (primaryOpt.isEmpty() || Boolean.TRUE.equals(request.getIsPrimary())) {
                    address.setIsPrimary(true);
                }
                // 전체 주소 문자열을 시/도, 구/군, 동/읍/면으로 분해
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
        }
        log.info("마이페이지 정보 수정 완료: userId={}", userId);
        
        return getMyPageInfo(userId);
    }

    /**
     * 한국 주소 문자열을 [시/도, 구/군, 동/읍/면 이하] 3부분으로 단순 분해합니다.
     * 예) "서울특별시 강남구 역삼동" → [서울특별시, 강남구, 역삼동]
     *     "경기도 성남시 분당구 정자동 정자역로 10" → [경기도, 성남시, 분당구 정자동 정자역로 10]
     * 규칙이 불확실한 경우에도 DB 제약을 피하기 위해 최소한의 기본값을 채웁니다.
     */
    private String[] parseKoreanAddress(String fullAddress) {
        if (fullAddress == null) {
            return new String[] {"기타", "기타", "기타"};
        }
        String normalized = fullAddress.replaceAll("\\s+", " ").trim();
        String[] tokens = normalized.split(" ");
        if (tokens.length >= 3) {
            String province = tokens[0];
            String city = tokens[1];
            StringBuilder district = new StringBuilder();
            for (int i = 2; i < tokens.length; i++) {
                if (district.length() > 0) district.append(' ');
                district.append(tokens[i]);
            }
            return new String[] { province, city, district.toString() };
        } else if (tokens.length == 2) {
            return new String[] { tokens[0], tokens[1], "기타" };
        } else if (tokens.length == 1) {
            return new String[] { tokens[0], "기타", "기타" };
        }
        return new String[] {"기타", "기타", "기타"};
    }

    @Override
    public String uploadProfileImage(Long userId, String imageUrl) {
        log.info("🔧 프로필 이미지 업로드: {}", userId);
        
        User user = requireUserInCurrentTenant(userId);

        user.setProfileImageUrl(imageUrl);
        userRepository.save(user);
        
        return imageUrl;
    }

    @Override
    public String changePassword(Long userId, String newPassword) {
        log.info("🔧 비밀번호 변경: {}", userId);
        
        User user = requireUserInCurrentTenant(userId);

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        return "비밀번호가 성공적으로 변경되었습니다.";
    }

    @Override
    public String getSocialAccountInfo(Long userId) {
        log.info("🔍 소셜 계정 정보 조회: {}", userId);
        
        requireUserInCurrentTenant(userId);

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
    public String deleteAccount(String userId) {
        log.info("🔧 계정 삭제: {}", userId);
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            throw new IllegalStateException("tenantId가 설정되지 않았습니다");
        }
        
        User user = userRepository.findByTenantIdAndUserId(tenantId, userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
        
        user.setIsActive(false);
        userRepository.save(user);
        
        return "계정이 성공적으로 삭제되었습니다.";
    }
}
