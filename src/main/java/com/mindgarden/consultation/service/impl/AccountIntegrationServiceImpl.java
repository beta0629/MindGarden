package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import com.mindgarden.consultation.constant.EmailConstants;
import com.mindgarden.consultation.dto.AccountIntegrationRequest;
import com.mindgarden.consultation.dto.AccountIntegrationResponse;
import com.mindgarden.consultation.dto.EmailResponse;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserSocialAccount;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.UserSocialAccountRepository;
import com.mindgarden.consultation.service.AccountIntegrationService;
import com.mindgarden.consultation.service.EmailService;
import com.mindgarden.consultation.service.JwtService;
import com.mindgarden.consultation.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 계정 통합 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AccountIntegrationServiceImpl implements AccountIntegrationService {
    
    private final UserRepository userRepository;
    private final UserSocialAccountRepository userSocialAccountRepository;
    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    
    // 이메일 인증 코드 저장 (실제 운영에서는 Redis 등 사용)
    private final Map<String, EmailVerificationCode> emailVerificationCodes = new ConcurrentHashMap<>();
    
    /**
     * 이메일 인증 코드 정보
     */
    private static class EmailVerificationCode {
        private final String code;
        private final LocalDateTime expiryTime;
        
        public EmailVerificationCode(String code, LocalDateTime expiryTime) {
            this.code = code;
            this.expiryTime = expiryTime;
        }
        
        public boolean isValid() {
            return LocalDateTime.now().isBefore(expiryTime);
        }
        
        public String getCode() {
            return code;
        }
    }
    
    @Override
    public AccountIntegrationResponse integrateAccountsByEmail(AccountIntegrationRequest request) {
        try {
            log.info("계정 통합 시작: existingEmail={}, socialEmail={}, provider={}", 
                    request.getExistingEmail(), request.getSocialEmail(), request.getProvider());
            
            // 1. 기존 계정 존재 확인
            Optional<User> existingUserOpt = userRepository.findByEmail(request.getExistingEmail());
            if (existingUserOpt.isEmpty()) {
                return AccountIntegrationResponse.failure(
                    "기존 계정을 찾을 수 없습니다.", 
                    AccountIntegrationResponse.IntegrationStatus.ACCOUNT_NOT_FOUND
                );
            }
            
            User existingUser = existingUserOpt.get();
            
            // 2. 이미 SNS 계정이 연결되어 있는지 확인
            boolean hasSocialAccount = userSocialAccountRepository
                .findByUserAndProviderAndIsDeletedFalse(existingUser, request.getProvider())
                .isPresent();
            
            if (hasSocialAccount) {
                return AccountIntegrationResponse.failure(
                    "이미 " + request.getProvider() + " 계정이 연결되어 있습니다.", 
                    AccountIntegrationResponse.IntegrationStatus.ALREADY_INTEGRATED
                );
            }
            
            // 3. 이메일 인증 코드 검증
            if (!verifyEmailCode(request.getExistingEmail(), request.getVerificationCode())) {
                return AccountIntegrationResponse.failure(
                    "이메일 인증 코드가 올바르지 않습니다.", 
                    AccountIntegrationResponse.IntegrationStatus.VERIFICATION_FAILED
                );
            }
            
            // 4. 기존 계정 비밀번호 검증 (선택사항)
            if (request.getExistingPassword() != null) {
                if (!passwordEncoder.matches(request.getExistingPassword(), existingUser.getPassword())) {
                    return AccountIntegrationResponse.failure(
                        "기존 계정 비밀번호가 올바르지 않습니다.", 
                        AccountIntegrationResponse.IntegrationStatus.VERIFICATION_FAILED
                    );
                }
            }
            
            // 5. SNS 계정 정보 생성
            UserSocialAccount socialAccount = UserSocialAccount.builder()
                .user(existingUser)
                .provider(request.getProvider())
                .providerUserId(request.getProviderUserId())
                .providerUsername(request.getFinalNickname())
                .providerProfileImage(null) // 필요시 추가
                .isPrimary(false) // 기존 계정이 primary
                .isVerified(true)
                .isActive(true)
                .build();
            
            userSocialAccountRepository.save(socialAccount);
            
            // 6. 사용자 정보 업데이트 (필요시)
            if (request.getFinalName() != null) {
                existingUser.setName(request.getFinalName());
            }
            if (request.getFinalNickname() != null) {
                existingUser.setNickname(request.getFinalNickname());
            }
            if (request.getFinalEmail() != null && !request.getFinalEmail().equals(request.getExistingEmail())) {
                existingUser.setEmail(request.getFinalEmail());
            }
            
            userRepository.save(existingUser);
            
            // 7. JWT 토큰 생성
            String accessToken = jwtService.generateToken(existingUser.getEmail());
            String refreshToken = jwtService.generateRefreshToken(existingUser.getEmail());
            
            // 8. 인증 코드 삭제
            emailVerificationCodes.remove(request.getExistingEmail());
            
            // 9. 계정 통합 완료 이메일 발송
            sendAccountIntegrationSuccessEmail(existingUser.getEmail(), existingUser.getName(), request.getProvider());
            
            log.info("계정 통합 완료: userId={}, provider={}", existingUser.getId(), request.getProvider());
            
            return AccountIntegrationResponse.success(
                "계정 통합이 완료되었습니다.",
                existingUser.getId(),
                existingUser.getEmail(),
                existingUser.getName(),
                existingUser.getNickname(),
                existingUser.getRole().getValue(),
                accessToken,
                refreshToken
            );
            
        } catch (Exception e) {
            log.error("계정 통합 실패", e);
            return AccountIntegrationResponse.failure(
                "계정 통합 중 오류가 발생했습니다: " + e.getMessage(),
                AccountIntegrationResponse.IntegrationStatus.INTEGRATION_FAILED
            );
        }
    }
    
    @Override
    public boolean sendEmailVerificationCode(String email) {
        try {
            log.info("이메일 인증 코드 발송: email={}", email);
            
            // 6자리 랜덤 코드 생성
            String code = String.format("%06d", (int) (Math.random() * 1000000));
            
            // 10분 후 만료
            LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(10);
            
            // 코드 저장
            emailVerificationCodes.put(email, new EmailVerificationCode(code, expiryTime));
            
            // 이메일 인증 코드 이메일 발송
            sendEmailVerificationCodeEmail(email, code);
            
            log.info("이메일 인증 코드 생성 및 발송: email={}, code={}, expiryTime={}", email, code, expiryTime);
            
            return true;
            
        } catch (Exception e) {
            log.error("이메일 인증 코드 발송 실패: email={}", email, e);
            return false;
        }
    }
    
    @Override
    public boolean verifyEmailCode(String email, String code) {
        try {
            log.info("이메일 인증 코드 검증: email={}, code={}", email, code);
            
            EmailVerificationCode storedCode = emailVerificationCodes.get(email);
            if (storedCode == null) {
                log.warn("인증 코드를 찾을 수 없음: email={}", email);
                return false;
            }
            
            if (!storedCode.isValid()) {
                log.warn("인증 코드가 만료됨: email={}", email);
                emailVerificationCodes.remove(email);
                return false;
            }
            
            boolean isValid = storedCode.getCode().equals(code);
            if (isValid) {
                log.info("이메일 인증 성공: email={}", email);
            } else {
                log.warn("이메일 인증 실패: email={}, 입력코드={}, 저장코드={}", 
                        email, code, storedCode.getCode());
            }
            
            return isValid;
            
        } catch (Exception e) {
            log.error("이메일 인증 코드 검증 실패: email={}", email, e);
            return false;
        }
    }
    
    @Override
    public boolean linkSocialAccount(Long existingUserId, String provider, String providerUserId) {
        try {
            log.info("SNS 계정 연결: userId={}, provider={}, providerUserId={}", 
                    existingUserId, provider, providerUserId);
            
            User user = userRepository.findById(existingUserId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + existingUserId));
            
            // 이미 연결된 SNS 계정이 있는지 확인
            boolean alreadyLinked = userSocialAccountRepository
                .findByUserAndProviderAndIsDeletedFalse(user, provider)
                .isPresent();
            
            if (alreadyLinked) {
                log.warn("이미 연결된 SNS 계정: userId={}, provider={}", existingUserId, provider);
                return false;
            }
            
            // SNS 계정 정보 생성
            UserSocialAccount socialAccount = UserSocialAccount.builder()
                .user(user)
                .provider(provider)
                .providerUserId(providerUserId)
                .isPrimary(false)
                .isVerified(true)
                .isActive(true)
                .build();
            
            userSocialAccountRepository.save(socialAccount);
            
            log.info("SNS 계정 연결 완료: userId={}, provider={}", existingUserId, provider);
            return true;
            
        } catch (Exception e) {
            log.error("SNS 계정 연결 실패: userId={}, provider={}", existingUserId, provider, e);
            return false;
        }
    }
    
    @Override
    public AccountIntegrationResponse checkIntegrationStatus(String email) {
        try {
            log.info("계정 통합 상태 확인: email={}", email);
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return AccountIntegrationResponse.failure(
                    "계정을 찾을 수 없습니다.",
                    AccountIntegrationResponse.IntegrationStatus.ACCOUNT_NOT_FOUND
                );
            }
            
            User user = userOpt.get();
            
            // 연결된 SNS 계정 목록 조회
            List<UserSocialAccount> socialAccounts = userSocialAccountRepository.findByUserAndIsDeletedFalse(user);
            
            if (socialAccounts.isEmpty()) {
                return AccountIntegrationResponse.builder()
                    .success(true)
                    .message("연결된 SNS 계정이 없습니다.")
                    .userId(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .nickname(user.getNickname())
                    .role(user.getRole().getValue())
                    .status(AccountIntegrationResponse.IntegrationStatus.SUCCESS)
                    .build();
            }
            
            // 첫 번째 SNS 계정 정보 반환
            UserSocialAccount firstSocialAccount = socialAccounts.get(0);
            AccountIntegrationResponse.SocialAccountInfo socialInfo = 
                AccountIntegrationResponse.SocialAccountInfo.builder()
                    .provider(firstSocialAccount.getProvider())
                    .providerUserId(firstSocialAccount.getProviderUserId())
                    .providerUsername(firstSocialAccount.getProviderUsername())
                    .providerProfileImage(firstSocialAccount.getProviderProfileImage())
                    .isPrimary(firstSocialAccount.getIsPrimary())
                    .isVerified(firstSocialAccount.getIsVerified())
                    .build();
            
            return AccountIntegrationResponse.builder()
                .success(true)
                .message("연결된 SNS 계정이 있습니다.")
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .nickname(user.getNickname())
                .role(user.getRole().getValue())
                .status(AccountIntegrationResponse.IntegrationStatus.ALREADY_INTEGRATED)
                .socialAccountInfo(socialInfo)
                .build();
            
        } catch (Exception e) {
            log.error("계정 통합 상태 확인 실패: email={}", email, e);
            return AccountIntegrationResponse.failure(
                "계정 통합 상태 확인 중 오류가 발생했습니다: " + e.getMessage(),
                AccountIntegrationResponse.IntegrationStatus.INTEGRATION_FAILED
            );
        }
    }
    
    // ==================== Private Email Methods ====================
    
    /**
     * 이메일 인증 코드 발송
     */
    private void sendEmailVerificationCodeEmail(String email, String code) {
        try {
            log.info("이메일 인증 코드 이메일 발송: email={}", email);
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_EMAIL, email);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "mindgarden");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put("verificationCode", code);
            variables.put("expiryMinutes", "10");
            
            // 템플릿 기반 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_ACCOUNT_ACTIVATION,
                    email,
                    "사용자",
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("이메일 인증 코드 이메일 발송 성공: email={}, emailId={}", email, response.getEmailId());
            } else {
                log.error("이메일 인증 코드 이메일 발송 실패: email={}, error={}", email, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("이메일 인증 코드 이메일 발송 중 오류: email={}, error={}", email, e.getMessage(), e);
        }
    }
    
    /**
     * 계정 통합 완료 이메일 발송
     */
    private void sendAccountIntegrationSuccessEmail(String email, String name, String provider) {
        try {
            log.info("계정 통합 완료 이메일 발송: email={}, provider={}", email, provider);
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, name);
            variables.put(EmailConstants.VAR_USER_EMAIL, email);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "mindgarden");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put("provider", provider);
            variables.put("integrationMessage", provider + " 계정이 성공적으로 연결되었습니다.");
            
            // 템플릿 기반 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_SYSTEM_NOTIFICATION,
                    email,
                    name,
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("계정 통합 완료 이메일 발송 성공: email={}, emailId={}", email, response.getEmailId());
            } else {
                log.error("계정 통합 완료 이메일 발송 실패: email={}, error={}", email, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("계정 통합 완료 이메일 발송 중 오류: email={}, error={}", email, e.getMessage(), e);
        }
    }
}
