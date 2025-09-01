package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.Map;
import com.mindgarden.consultation.dto.SocialLoginResponse;
import com.mindgarden.consultation.dto.SocialUserInfo;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserSocialAccount;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.UserSocialAccountRepository;
import com.mindgarden.consultation.service.JwtService;
import com.mindgarden.consultation.service.OAuth2Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OAuth2 서비스 추상 클래스
 * 모든 소셜 플랫폼이 공통으로 사용할 로직 구현
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RequiredArgsConstructor
public abstract class AbstractOAuth2Service implements OAuth2Service {

    protected final UserRepository userRepository;
    protected final UserSocialAccountRepository userSocialAccountRepository;
    protected final JwtService jwtService;


    @Override
    @Transactional(rollbackFor = Exception.class)
    public SocialLoginResponse authenticateWithCode(String code) {
        try {
            // 1. 인증 코드로 액세스 토큰 획득
            String accessToken = getAccessToken(code);
            
            // 2. 액세스 토큰으로 사용자 정보 조회
            SocialUserInfo socialUserInfo = getUserInfo(accessToken);
            socialUserInfo.setProvider(getProviderName());
            socialUserInfo.setAccessToken(accessToken);
            
            // 3. 데이터 표준화
            socialUserInfo.normalizeData();
            
            // 4. 기존 사용자 확인
            log.info("기존 사용자 확인 시작: provider={}, providerUserId={}, email={}", 
                    getProviderName(), socialUserInfo.getProviderUserId(), socialUserInfo.getEmail());
            
            // 1. providerUserId로 사용자 찾기
            Long existingUserId = findExistingUserByProviderId(socialUserInfo.getProviderUserId());
            
            // 2. providerUserId로 찾지 못한 경우, 이메일로 사용자 찾기 (소셜 계정의 경우)
            if (existingUserId == null) {
                log.info("providerUserId로 사용자를 찾지 못함. 이메일로 추가 검색 시도");
                existingUserId = findExistingUserByEmail(socialUserInfo.getEmail());
                
                if (existingUserId != null) {
                    log.info("이메일로 기존 사용자 발견: userId={}", existingUserId);
                    // 기존 사용자의 소셜 계정 정보 업데이트 또는 새로 생성
                    updateOrCreateSocialAccount(existingUserId, socialUserInfo);
                }
            }
            
            log.info("기존 사용자 확인 결과: existingUserId={}", existingUserId);
            
            User user;
            boolean isNewUser = false;
            
            if (existingUserId != null) {
                // 기존 사용자 로그인
                log.info("기존 사용자 로그인: userId={}", existingUserId);
                user = userRepository.findById(existingUserId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                
                // 소셜 계정 정보 업데이트
                updateSocialAccountInfo(user.getId(), socialUserInfo);
                
            } else {
                // 신규 사용자 - 간편 회원가입 필요
                log.info("신규 사용자 - 간편 회원가입 필요: provider={}, providerUserId={}", 
                        getProviderName(), socialUserInfo.getProviderUserId());
                return SocialLoginResponse.builder()
                    .success(false)
                    .message("간편 회원가입이 필요합니다.")
                    .requiresSignup(true) // 회원가입 필요 플래그
                    .socialUserInfo(socialUserInfo) // 소셜 사용자 정보 포함
                    .build();
            }
            
            // 5. JWT 토큰 생성
            String jwtToken = jwtService.generateToken(user.getEmail());
            String refreshToken = jwtService.generateRefreshToken(user.getEmail());
            
            // 6. 프로필 사진 우선순위 적용 (1. 사용자 프로필 2. SNS 이미지 3. 기본 아이콘)
            String finalProfileImageUrl = determineProfileImageUrl(user, socialUserInfo);
            
            // 6. 응답 생성
            return SocialLoginResponse.builder()
                .success(true)
                .message(isNewUser ? getProviderName() + " 계정으로 회원가입이 완료되었습니다." : getProviderName() + " 계정으로 로그인되었습니다.")
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .userInfo(SocialLoginResponse.UserInfo.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .nickname(user.getNickname())
                    .role(user.getRole())
                    .profileImageUrl(finalProfileImageUrl)
                    .build())
                .socialAccountInfo(SocialLoginResponse.SocialAccountInfo.builder()
                    .provider(getProviderName())
                    .providerUserId(socialUserInfo.getProviderUserId())
                    .providerUsername(socialUserInfo.getNickname())
                    .providerProfileImage(socialUserInfo.getProfileImageUrl())
                    .isPrimary(true)
                    .isVerified(true)
                    .build())
                .build();
                
        } catch (Exception e) {
            log.error("{} OAuth2 인증 실패", getProviderName(), e);
            // 트랜잭션 롤백을 명시적으로 처리
            throw new RuntimeException(getProviderName() + " OAuth2 인증 처리 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Override
    public Long findExistingUserByProviderId(String providerUserId) {
        log.info("findExistingUserByProviderId 호출: provider={}, providerUserId={}", 
                getProviderName(), providerUserId);
        
        // 0. DB에 저장된 모든 소셜 계정 조회 (디버깅용)
        var allSocialAccounts = userSocialAccountRepository.findAll();
        log.info("DB에 저장된 모든 소셜 계정 수: {}", allSocialAccounts.size());
        allSocialAccounts.forEach(account -> {
            log.info("소셜 계정: id={}, provider={}, providerUserId={}, userId={}", 
                    account.getId(), account.getProvider(), account.getProviderUserId(), account.getUser().getId());
        });
        
        // 1. providerUserId로 직접 조회
        var socialAccountOptional = userSocialAccountRepository.findByProviderAndProviderUserIdAndIsDeletedFalse(getProviderName(), providerUserId);
        log.info("소셜 계정 조회 결과: socialAccountOptional={}", socialAccountOptional.isPresent());
        
        if (socialAccountOptional.isPresent()) {
            var socialAccount = socialAccountOptional.get();
            log.info("찾은 소셜 계정: id={}, provider={}, providerUserId={}, userId={}", 
                    socialAccount.getId(), socialAccount.getProvider(), socialAccount.getProviderUserId(), socialAccount.getUser().getId());
        }
        
        var result = socialAccountOptional
            .map(UserSocialAccount::getUser)
            .map(User::getId)
            .orElse(null);
        
        log.info("providerUserId로 조회 결과: result={}", result);
        
        return result;
    }
    
    /**
     * 이메일로 기존 사용자 찾기 (소셜 계정의 경우)
     */
    protected Long findExistingUserByEmail(String email) {
        log.info("이메일로 사용자 찾기: email={}", email);
        
        try {
            // 이메일로 사용자 찾기
            var userOptional = userRepository.findByEmail(email);
            log.info("UserRepository.findByEmail 결과: userOptional={}", userOptional);
            
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                log.info("찾은 사용자 정보: id={}, email={}, role={}, isDeleted={}", 
                        user.getId(), user.getEmail(), user.getRole(), user.getIsDeleted());
            }
            
            var result = userOptional
                .map(User::getId)
                .orElse(null);
            
            log.info("이메일로 사용자 찾기 결과: result={}", result);
            return result;
            
        } catch (Exception e) {
            log.error("이메일로 사용자 찾기 중 오류 발생: email={}, error={}", email, e.getMessage(), e);
            return null;
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createUserFromSocial(SocialUserInfo socialUserInfo) {
        // 1. 사용자 생성 (소셜 로그인용 임시 비밀번호 생성)
        User user = User.builder()
            .email(socialUserInfo.getEmail())
            .password(generateTemporaryPassword()) // 임시 비밀번호 생성
            .name(socialUserInfo.getName())
            .nickname(socialUserInfo.getNickname())
            .role("USER") // 기본 역할
            .profileImageUrl(socialUserInfo.getProfileImageUrl())
            .isEmailVerified(true) // 소셜 계정은 이메일 인증 완료로 간주
            .isActive(true)
            .build();
        
        user = userRepository.save(user);
        
        // 2. 소셜 계정 정보 생성
        UserSocialAccount socialAccount = UserSocialAccount.builder()
            .user(user)
            .provider(getProviderName())
            .providerUserId(socialUserInfo.getProviderUserId())
            .providerUsername(socialUserInfo.getNickname())
            .providerProfileImage(socialUserInfo.getProfileImageUrl())
            .accessToken(socialUserInfo.getAccessToken())
            .isPrimary(true)
            .isVerified(true)
            .isActive(true)
            .build();
        
        userSocialAccountRepository.save(socialAccount);
        
        return user.getId();
    }

    /**
     * 소셜 계정 정보 업데이트
     */
    protected void updateSocialAccountInfo(Long userId, SocialUserInfo socialUserInfo) {
        userSocialAccountRepository.findByProviderAndProviderUserIdAndIsDeletedFalse(getProviderName(), socialUserInfo.getProviderUserId())
            .ifPresent(socialAccount -> {
                socialAccount.setProviderUsername(socialUserInfo.getNickname());
                socialAccount.setProviderProfileImage(socialUserInfo.getProfileImageUrl());
                socialAccount.setAccessToken(socialUserInfo.getAccessToken());
                socialAccount.setLastLoginAt(LocalDateTime.now());
                
                // loginCount null 체크 추가
                Integer currentLoginCount = socialAccount.getLoginCount();
                if (currentLoginCount == null) {
                    currentLoginCount = 0;
                }
                socialAccount.setLoginCount(currentLoginCount + 1);
                
                userSocialAccountRepository.save(socialAccount);
            });
    }
    
    /**
     * 기존 사용자에게 소셜 계정 추가 또는 업데이트
     */
    protected void updateOrCreateSocialAccount(Long userId, SocialUserInfo socialUserInfo) {
        log.info("기존 사용자에게 소셜 계정 추가/업데이트: userId={}, provider={}", userId, getProviderName());
        
        // 기존 소셜 계정이 있는지 확인
        var existingSocialAccount = userSocialAccountRepository.findByProviderAndProviderUserIdAndIsDeletedFalse(getProviderName(), socialUserInfo.getProviderUserId());
        
        if (existingSocialAccount.isPresent()) {
            // 기존 소셜 계정 업데이트
            log.info("기존 소셜 계정 업데이트");
            updateSocialAccountInfo(userId, socialUserInfo);
        } else {
            // 새로운 소셜 계정 생성
            log.info("새로운 소셜 계정 생성");
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
            
            UserSocialAccount newSocialAccount = UserSocialAccount.builder()
                .user(user)
                .provider(getProviderName())
                .providerUserId(socialUserInfo.getProviderUserId())
                .providerUsername(socialUserInfo.getNickname())
                .providerProfileImage(socialUserInfo.getProfileImageUrl())
                .accessToken(socialUserInfo.getAccessToken())
                .isPrimary(false) // 기존 사용자이므로 primary가 아님
                .isVerified(true)
                .isActive(true)
                .build();
            
            userSocialAccountRepository.save(newSocialAccount);
            log.info("새로운 소셜 계정 생성 완료: userId={}, provider={}", userId, getProviderName());
        }
    }

    /**
     * 소셜 로그인용 임시 비밀번호 생성
     * 
     * @return 임시 비밀번호
     */
    private String generateTemporaryPassword() {
        return "SOCIAL_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000);
    }
    
    @Override
    public void linkSocialAccountToUser(Long userId, SocialUserInfo socialUserInfo) {
        updateOrCreateSocialAccount(userId, socialUserInfo);
    }

    /**
     * 프로필 사진 우선순위 결정 (1. 사용자 프로필 2. SNS 이미지 3. 기본 아이콘)
     * 
     * @param user 사용자 엔티티
     * @param socialUserInfo 소셜 사용자 정보
     * @return 최종 프로필 이미지 URL
     */
    protected String determineProfileImageUrl(User user, SocialUserInfo socialUserInfo) {
        // 1. 사용자 프로필 사진 우선
        if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().trim().isEmpty()) {
            log.info("사용자 프로필 사진 사용: {}", user.getProfileImageUrl());
            return user.getProfileImageUrl();
        }
        
        // 2. SNS 이미지 노출
        if (socialUserInfo.getProfileImageUrl() != null && !socialUserInfo.getProfileImageUrl().trim().isEmpty()) {
            log.info("SNS 프로필 이미지 사용: {}", socialUserInfo.getProfileImageUrl());
            return socialUserInfo.getProfileImageUrl();
        }
        
        // 3. 기본 아이콘
        String defaultIcon = "/images/default-profile-icon.png";
        log.info("기본 프로필 아이콘 사용: {}", defaultIcon);
        return defaultIcon;
    }

    /**
     * 소셜 플랫폼별 사용자 정보 변환 (추상 메서드)
     * 각 플랫폼별로 구현해야 함
     */
    protected abstract SocialUserInfo convertToSocialUserInfo(Map<String, Object> rawUserInfo);
}
