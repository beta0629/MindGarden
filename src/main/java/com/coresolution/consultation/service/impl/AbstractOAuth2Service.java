package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.SocialLoginResponse;
import com.coresolution.consultation.dto.SocialUserInfo;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSocialAccount;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.OAuth2Service;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.SocialProvider;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;

/**
 * OAuth2 서비스 추상 클래스
 * 모든 소셜 플랫폼이 공통으로 사용할 로직 구현
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@RequiredArgsConstructor
public abstract class AbstractOAuth2Service implements OAuth2Service {

    private static final Logger log = LoggerFactory.getLogger(AbstractOAuth2Service.class);

    protected final UserRepository userRepository;
    protected final ClientRepository clientRepository;
    protected final UserSocialAccountRepository userSocialAccountRepository;
    protected final JwtService jwtService;
    protected final DynamicPermissionService dynamicPermissionService;
    protected final PersonalDataEncryptionUtil encryptionUtil;
    protected final PasswordService passwordService;


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
                } else {
                    // 3. 이메일로도 사용자를 찾지 못한 경우, 간편 회원가입 필요
                    log.info("이메일로도 사용자를 찾지 못함. 간편 회원가입 필요");
                    return SocialLoginResponse.builder()
                        .success(false)
                        .message("간편 회원가입이 필요합니다.")
                        .requiresSignup(true) // 회원가입 필요 플래그
                        .socialUserInfo(socialUserInfo) // 소셜 사용자 정보 포함
                        .build();
                }
            }
            
            log.info("기존 사용자 확인 결과: existingUserId={}", existingUserId);
            
            User user;
            boolean isNewUser = false;
            
            if (existingUserId != null) {
                // 기존 사용자 로그인
                log.info("기존 사용자 로그인: userId={}", existingUserId);
                user = loadUserForSocialLogin(existingUserId, socialUserInfo);
                
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
            
            // 사용자 null 체크
            if (user == null) {
                log.error("사용자가 null입니다. existingUserId={}", existingUserId);
                throw new RuntimeException("사용자 정보를 찾을 수 없습니다.");
            }
            
            // 5. Phase 3: 확장된 JWT 토큰 생성 (tenantId, branchId, permissions 포함)
            // 사용자 권한 조회 (예외 발생해도 빈 리스트 반환 - 트랜잭션 롤백 오류 방지)
            List<String> permissions;
            try {
                permissions = dynamicPermissionService.getUserPermissionsAsStringList(user);
            } catch (Exception e) {
                log.warn("⚠️ 권한 조회 실패 (빈 리스트 반환): userId={}, 오류={}", user.getId(), e.getMessage());
                permissions = new java.util.ArrayList<>();
            }
            String jwtToken = jwtService.generateToken(user, permissions);
            // 표준화 2025-12-08: username = userId이므로 refreshToken도 userId 사용, User 객체로 생성하여 tenantId, email 포함
            String refreshToken = jwtService.generateRefreshToken(user);
            
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
                    .role(user.getRole().getValue())
                    .profileImageUrl(finalProfileImageUrl)
                    .providerUserId(socialUserInfo.getProviderUserId())
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
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        // 0. DB에 저장된 모든 소셜 계정 조회 (디버깅용)
        var allSocialAccounts = userSocialAccountRepository.findByTenantId(tenantId);
        log.info("DB에 저장된 모든 소셜 계정 수: {}", allSocialAccounts.size());
        allSocialAccounts.forEach(account -> {
            log.info("소셜 계정: id={}, provider={}, providerUserId={}, userId={}", 
                    account.getId(), account.getProvider(), account.getProviderUserId(), account.getUserId());
        });
        
        // 1. providerUserId로 직접 조회 (tenantId 필터링)
        var socialAccountOptional = userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(tenantId, getProviderName(), providerUserId);
        log.info("소셜 계정 조회 결과: socialAccountOptional={}", socialAccountOptional.isPresent());
        
        if (socialAccountOptional.isPresent()) {
            var socialAccount = socialAccountOptional.get();
            log.info("찾은 소셜 계정: id={}, provider={}, providerUserId={}, userId={}", 
                    socialAccount.getId(), socialAccount.getProvider(), socialAccount.getProviderUserId(), socialAccount.getUserId());
        }
        
        var result = socialAccountOptional
            .map(UserSocialAccount::getUserId)
            .orElse(null);
        
        log.info("providerUserId로 조회 결과: result={}", result);
        
        return result;
    }
    
    /**
     * 이메일로 기존 사용자 찾기 (소셜 계정의 경우)
     * 같은 이메일로 여러 계정이 있는 경우, 가장 적절한 계정 선택:
     * 1. 활성 상태인 계정 우선
     * 2. 가장 최근에 생성된 계정 우선
     * 3. 역할 우선순위: CLIENT > CONSULTANT > ADMIN > 기타
     */
    protected Long findExistingUserByEmail(String email) {
        log.info("이메일로 사용자 찾기: email={}", email);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        String normalizedEmail = SocialProvider.normalizeEmail(email);
        if (!StringUtils.hasText(normalizedEmail)) {
            log.info("이메일 정규화 결과 비어 있어 조회를 생략합니다.");
            return null;
        }
        
        try {
            // 같은 이메일로 여러 계정이 있을 수 있으므로 모두 조회
            List<User> users = userRepository.findAllByTenantIdAndEmail(tenantId, normalizedEmail);
            
            if (users == null || users.isEmpty()) {
                log.info("이메일로 사용자를 찾지 못함: email={}, tenantId={}", normalizedEmail, tenantId);
                return null;
            }
            
            log.info("이메일로 찾은 사용자 수: email={}, tenantId={}, count={}", normalizedEmail, tenantId, users.size());
            
            // 여러 계정이 있는 경우 가장 적절한 계정 선택
            User selectedUser = selectBestMatchingUser(users);
            
            if (selectedUser != null) {
                log.info("선택된 사용자 정보: id={}, email={}, role={}, isActive={}, createdAt={}", 
                        selectedUser.getId(), selectedUser.getEmail(), selectedUser.getRole(), 
                        selectedUser.getIsActive(), selectedUser.getCreatedAt());
                
                // 여러 계정이 있는 경우 경고 로그
                if (users.size() > 1) {
                    log.warn("⚠️ 같은 이메일로 {}개의 계정이 발견됨. 가장 적절한 계정 선택: userId={}, role={}, isActive={}", 
                            users.size(), selectedUser.getId(), selectedUser.getRole(), selectedUser.getIsActive());
                    // 모든 계정 정보 로깅
                    for (User user : users) {
                        log.info("  - 계정: userId={}, role={}, isActive={}, createdAt={}", 
                                user.getId(), user.getRole(), user.getIsActive(), user.getCreatedAt());
                    }
                }
                
                return selectedUser.getId();
            }
            
            log.warn("이메일로 사용자를 찾았지만 선택할 수 없음: email={}, tenantId={}, count={}", 
                    normalizedEmail, tenantId, users.size());
            return null;
            
        } catch (Exception e) {
            log.error("이메일로 사용자 찾기 중 오류 발생: email={}, error={}", normalizedEmail, e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * 여러 사용자 중 가장 적절한 사용자 선택
     * 우선순위:
     * 1. 활성 상태인 계정 우선
     * 2. 역할 우선순위: CLIENT > CONSULTANT > ADMIN > 기타
     * 3. 가장 최근에 생성된 계정 우선
     */
    private User selectBestMatchingUser(List<User> users) {
        if (users == null || users.isEmpty()) {
            return null;
        }
        
        if (users.size() == 1) {
            return users.get(0);
        }
        
        // 1. 활성 상태인 계정만 필터링 (활성 계정이 있으면)
        List<User> activeUsers = users.stream()
                .filter(user -> user.getIsActive() != null && user.getIsActive())
                .collect(java.util.stream.Collectors.toList());
        
        List<User> candidates = activeUsers.isEmpty() ? users : activeUsers;
        
        // 2. 역할 우선순위로 정렬: CLIENT > CONSULTANT > ADMIN > 기타
        candidates.sort((u1, u2) -> {
            int priority1 = getRolePriority(u1.getRole());
            int priority2 = getRolePriority(u2.getRole());
            
            if (priority1 != priority2) {
                return Integer.compare(priority1, priority2); // 낮은 숫자가 우선순위 높음
            }
            
            // 3. 같은 역할이면 최근 생성일 순으로 정렬
            if (u1.getCreatedAt() != null && u2.getCreatedAt() != null) {
                return u2.getCreatedAt().compareTo(u1.getCreatedAt()); // 최근 것이 우선
            }
            
            return 0;
        });
        
        return candidates.get(0);
    }
    
    /**
     * 역할 우선순위 반환 (낮은 숫자가 우선순위 높음)
     */
    private int getRolePriority(com.coresolution.consultation.constant.UserRole role) {
        if (role == null) {
            return 999;
        }
        
        switch (role) {
            case CLIENT:
                return 1;
            case CONSULTANT:
                return 2;
            case ADMIN:
                return 3;
            case STAFF:
                return 4;
            default:
                return 999;
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createUserFromSocial(SocialUserInfo socialUserInfo) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        String normalizedLoginEmail = SocialProvider.normalizeEmail(socialUserInfo.getEmail());
        if (!StringUtils.hasText(normalizedLoginEmail)) {
            throw new IllegalStateException("소셜 사용자 이메일이 비어 있어 저장할 수 없습니다.");
        }
        // 표준화 원칙: users 선저장/flush 후 clients 저장 (FK 정합성 보장)
        // 소셜 전용 더미 비밀번호 — 정책 없이 BCrypt만 적용
        User user = User.builder()
                .userId("social_" + socialUserInfo.getProviderUserId())
                .password(passwordService.encodeSecret(generateTemporaryPassword()))
                .name(encryptionUtil.safeEncrypt(socialUserInfo.getName()))
                .email(encryptionUtil.safeEncrypt(normalizedLoginEmail))
                .phone(socialUserInfo.getPhone() != null ? encryptionUtil.safeEncrypt(socialUserInfo.getPhone()) : null)
                .role(UserRole.CLIENT)
                .branchCode(null)
                .build();
        user.setTenantId(tenantId);
        User savedUser = userRepository.saveAndFlush(user);
        validateSavedUserTenantIntegrity(savedUser, tenantId);

        Client client = Client.builder()
                .id(savedUser.getId())
                .tenantId(tenantId)
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .branchCode(null) // 표준화 2025-12-06: branchCode는 더 이상 사용하지 않음
                .isDeleted(false)
                .build();
        client = clientRepository.saveAndFlush(client);
        
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
        
        return savedUser.getId();
    }

    /**
     * 소셜 회원가입 users->clients 저장 직전 tenantId/PK 정합성 방어.
     *
     * @param savedUser users 저장 결과
     * @param expectedTenantId 기대 tenantId
     */
    private void validateSavedUserTenantIntegrity(User savedUser, String expectedTenantId) {
        if (savedUser == null || savedUser.getId() == null) {
            throw new IllegalStateException("소셜 사용자 저장에 실패했습니다. users.id가 없습니다.");
        }
        if (expectedTenantId == null || expectedTenantId.isBlank()) {
            throw new IllegalStateException("소셜 회원가입 tenantId가 비어 있습니다.");
        }
        if (savedUser.getTenantId() == null || savedUser.getTenantId().isBlank()) {
            throw new IllegalStateException("users.tenant_id가 비어 있어 clients 저장을 중단합니다.");
        }
        if (!expectedTenantId.equals(savedUser.getTenantId())) {
            throw new IllegalStateException(
                "소셜 회원가입 tenantId 정합성 오류: users.tenant_id 불일치. expected="
                    + expectedTenantId + ", actual=" + savedUser.getTenantId()
            );
        }
    }

    /**
     * 소셜 행·연결 User에서 테넌트 ID를 추론한다. 엔티티 {@code tenantId} 컬럼을 우선한다.
     *
     * @param social 소셜 계정 (null이면 null)
     * @return 비어 있지 않은 테넌트 ID 또는 null
     */
    private String resolveTenantIdFromSocialAccount(UserSocialAccount social) {
        if (social == null) {
            return null;
        }
        if (social.getTenantId() != null && !social.getTenantId().isEmpty()) {
            return social.getTenantId();
        }
        User linked = social.getUser();
        if (linked != null && linked.getTenantId() != null && !linked.getTenantId().isEmpty()) {
            return linked.getTenantId();
        }
        return null;
    }

    /**
     * 테넌트를 전혀 확정할 수 없을 때만 PK 단독 조회. 요청 테넌트와 불일치할 수 있어 크로스 테넌트 노출 위험이 있다.
     *
     * @param userId 사용자 PK
     * @return 사용자
     */
    private User loadUserByIdWhenTenantUnknown(Long userId) {
        log.warn(
            "소셜 로그인 사용자 로드: 테넌트 컨텍스트·소셜 계정으로 테넌트 확정 불가 — findById 폴백(크로스 테넌트 위험): userId={}",
            userId);
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    /**
     * 소셜 로그인 시 사용자 엔티티 로드.
     * 순서: {@link TenantContextHolder} → {@link UserSocialAccount}로 테넌트 추론 → {@code findByTenantIdAndId} →
     * 테넌트 불가 시에만 PK 단독 {@code findById} (크로스 테넌트 위험, WARN).
     *
     * @param existingUserId 조회 대상 사용자 PK
     * @param socialUserInfo 소셜 정보(provider·providerUserId 폴백용)
     * @return 사용자
     */
    private User loadUserForSocialLogin(Long existingUserId, SocialUserInfo socialUserInfo) {
        String ctxTenantId = TenantContextHolder.getTenantId();
        if (ctxTenantId != null && !ctxTenantId.isEmpty()) {
            return userRepository.findByTenantIdAndId(ctxTenantId, existingUserId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        }
        Optional<UserSocialAccount> socialOpt = userSocialAccountRepository
            .findByProviderAndProviderUserIdAndIsDeletedFalse(getProviderName(), socialUserInfo.getProviderUserId());
        if (socialOpt.isPresent()) {
            UserSocialAccount social = socialOpt.get();
            String inferredTenant = resolveTenantIdFromSocialAccount(social);
            if (inferredTenant != null && !inferredTenant.isEmpty()) {
                Optional<User> scoped = userRepository.findByTenantIdAndId(inferredTenant, existingUserId);
                if (scoped.isPresent()) {
                    return scoped.get();
                }
                User linkedUser = social.getUser();
                if (linkedUser != null && linkedUser.getId() != null && linkedUser.getId().equals(existingUserId)) {
                    String tenantFromUser = linkedUser.getTenantId();
                    if (tenantFromUser != null && !tenantFromUser.isEmpty()
                        && !tenantFromUser.equals(inferredTenant)) {
                        Optional<User> alt = userRepository.findByTenantIdAndId(tenantFromUser, existingUserId);
                        if (alt.isPresent()) {
                            return alt.get();
                        }
                    }
                }
            }
        }
        return loadUserByIdWhenTenantUnknown(existingUserId);
    }

    /**
     * 소셜 계정 정보 업데이트
     */
    protected void updateSocialAccountInfo(Long userId, SocialUserInfo socialUserInfo) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(tenantId, getProviderName(), socialUserInfo.getProviderUserId())
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
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        // 기존 소셜 계정이 있는지 확인 (tenantId 필터링)
        var existingSocialAccount = userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(tenantId, getProviderName(), socialUserInfo.getProviderUserId());
        
        if (existingSocialAccount.isPresent()) {
            // 기존 소셜 계정 업데이트
            log.info("기존 소셜 계정 업데이트");
            updateSocialAccountInfo(userId, socialUserInfo);
        } else {
            // 새로운 소셜 계정 생성
            log.info("새로운 소셜 계정 생성");
            User user = userRepository.findByTenantIdAndId(tenantId, userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
            
            // 사용자의 프로필 이미지가 없거나 기본 이미지인 경우 소셜 계정 이미지로 업데이트
            if (shouldUpdateUserProfileImage(user)) {
                user.setProfileImageUrl(socialUserInfo.getProfileImageUrl());
                userRepository.save(user);
                log.info("사용자 프로필 이미지 업데이트: userId={}, imageUrl={}", userId, socialUserInfo.getProfileImageUrl());
            }
            
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
     * 사용자 프로필 이미지 업데이트 여부 결정
     * 
     * @param user 사용자 정보
     * @return 업데이트 여부
     */
    private boolean shouldUpdateUserProfileImage(User user) {
        // 소셜 계정 연동 시에는 항상 프로필 이미지를 업데이트
        // 사용자가 명시적으로 소셜 계정 연동을 요청했으므로 최신 프로필 이미지로 업데이트
        return true;
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
        String defaultIcon = "/default-avatar.svg";
        log.info("기본 프로필 아이콘 사용: {}", defaultIcon);
        return defaultIcon;
    }

    /**
     * 소셜 플랫폼별 사용자 정보 변환 (추상 메서드)
     * 각 플랫폼별로 구현해야 함
     */
    protected abstract SocialUserInfo convertToSocialUserInfo(Map<String, Object> rawUserInfo);
}
