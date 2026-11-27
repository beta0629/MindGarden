package com.coresolution.consultation.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import com.coresolution.consultation.config.MindgardenSecurityProperties;
import com.coresolution.consultation.constant.AccountIntegrationMessages;
import com.coresolution.consultation.service.support.SecureNumericCodeGenerator;
import com.coresolution.consultation.service.support.VerificationAttemptLimiter;
import com.coresolution.consultation.dto.EmailVerificationSendOutcome;
import com.coresolution.consultation.constant.EmailConstants;
import com.coresolution.consultation.dto.AccountIntegrationRequest;
import com.coresolution.consultation.dto.AccountIntegrationResponse;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSocialAccount;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AccountIntegrationService;
import com.coresolution.consultation.util.SocialProvider;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 계정 통합 서비스 구현체.
 * <p>
 * 이메일 인증 발송 쿨다운·일일 상한은 인메모리 {@link java.util.concurrent.ConcurrentHashMap} 기반이며,
 * 수평 확장(다중 인스턴스) 시 동일 이메일에 대한 일관된 제한을 위해서는 Redis 등 공유 저장소 도입이 필요합니다.
 * </p>
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
    private final PasswordService passwordService;
    private final EmailService emailService;
    private final MindgardenSecurityProperties mindgardenSecurityProperties;
    private final SecureNumericCodeGenerator codeGenerator;
    private final VerificationAttemptLimiter attemptLimiter;

    private static final int CODE_EXPIRY_MINUTES = 10;
    private static final int MAX_PROVIDER_USER_ID_LENGTH = 255;

    // 이메일 인증 코드 저장 (실제 운영에서는 Redis 등 사용)
    private final Map<String, EmailVerificationCode> emailVerificationCodes = new ConcurrentHashMap<>();

    /**
     * 정규화된 이메일별 발송 스로틀 상태. 멀티 인스턴스 일관성은 Redis 등으로 보강 예정(클래스 JavaDoc 참고).
     */
    private final Map<String, EmailThrottleEntry> emailSendThrottleByNormalizedEmail = new ConcurrentHashMap<>();

    /**
     * 동일 이메일에 대한 발송 임계 검사·코드 저장의 경쟁을 직렬화하기 위한 락
     */
    private final ConcurrentHashMap<String, Object> emailSendLocksByNormalizedEmail = new ConcurrentHashMap<>();

    /**
     * 이메일당 마지막 성공 발송 시각 및 당일 성공 발송 횟수(서버 {@link LocalDate}·시스템 기본 타임존)
     */
    private record EmailThrottleEntry(LocalDateTime lastSuccessfulSendAt, LocalDate dailyBucketDate, int dailyCount) {

        static EmailThrottleEntry empty() {
            return new EmailThrottleEntry(null, null, 0);
        }

        EmailThrottleEntry afterSuccessfulSend(LocalDate today) {
            int newCount = (dailyBucketDate != null && dailyBucketDate.equals(today)) ? dailyCount + 1 : 1;
            return new EmailThrottleEntry(LocalDateTime.now(), today, newCount);
        }
    }
    
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
        return integrateAccountsByEmail(request, null);
    }

    @Override
    public AccountIntegrationResponse integrateAccountsByEmail(AccountIntegrationRequest request, String clientIp) {
        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            String normalizedProvider = SocialProvider.normalize(request.getProvider());
            log.info("계정 통합 시작: existingEmail={}, socialEmail={}, provider={}",
                    EmailLogMasking.maskForLog(request.getExistingEmail()),
                    EmailLogMasking.maskForLog(request.getSocialEmail()), normalizedProvider);

            if (normalizedProvider == null) {
                return AccountIntegrationResponse.failure(
                    AccountIntegrationMessages.PROVIDER_INVALID,
                    AccountIntegrationResponse.IntegrationStatus.INTEGRATION_FAILED
                );
            }
            String providerUserId = request.getProviderUserId();
            if (providerUserId == null || providerUserId.isBlank()
                    || providerUserId.length() > MAX_PROVIDER_USER_ID_LENGTH) {
                return AccountIntegrationResponse.failure(
                    AccountIntegrationMessages.SOCIAL_ID_INVALID,
                    AccountIntegrationResponse.IntegrationStatus.INTEGRATION_FAILED
                );
            }
            if (request.getExistingPassword() == null || request.getExistingPassword().isBlank()) {
                return AccountIntegrationResponse.passwordVerificationRequired(
                    AccountIntegrationMessages.PASSWORD_REQUIRED);
            }

            // 1. 이메일 인증 코드 검증 (계정 존재 여부를 먼저 드러내지 않도록 코드 검증을 앞에 둔다)
            if (!verifyEmailCode(request.getExistingEmail(), request.getVerificationCode(), clientIp)) {
                return AccountIntegrationResponse.failure(
                    AccountIntegrationMessages.INTEGRATION_VERIFY_FAILED,
                    AccountIntegrationResponse.IntegrationStatus.VERIFICATION_FAILED
                );
            }

            String normalizedEmail = normalizeEmail(request.getExistingEmail());
            Optional<User> existingUserOpt = userRepository.findByTenantIdAndEmail(tenantId, normalizedEmail);
            if (existingUserOpt.isEmpty()) {
                return AccountIntegrationResponse.failure(
                    AccountIntegrationMessages.INTEGRATION_VERIFY_FAILED,
                    AccountIntegrationResponse.IntegrationStatus.VERIFICATION_FAILED
                );
            }
            User existingUser = existingUserOpt.get();

            // 2. 기존 계정 비밀번호 검증 (필수) — 실패는 인증 시도 횟수에 합산한다
            if (!passwordService.matches(request.getExistingPassword(), existingUser.getPassword())) {
                recordVerificationFailure(normalizedEmail, clientIp);
                return AccountIntegrationResponse.failure(
                    AccountIntegrationMessages.INTEGRATION_VERIFY_FAILED,
                    AccountIntegrationResponse.IntegrationStatus.VERIFICATION_FAILED
                );
            }

            // 3. 이미 SNS 계정이 연결되어 있는지 확인
            boolean hasSocialAccount = userSocialAccountRepository
                .findByUserAndProviderAndIsDeletedFalse(existingUser, normalizedProvider)
                .isPresent();
            if (hasSocialAccount) {
                return AccountIntegrationResponse.failure(
                    "이미 " + normalizedProvider + " 계정이 연결되어 있습니다.",
                    AccountIntegrationResponse.IntegrationStatus.ALREADY_INTEGRATED
                );
            }

            // 4. 같은 SNS 식별자가 다른 사용자에 이미 연결되어 있으면 거부
            boolean usedByOther = userSocialAccountRepository
                .findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(tenantId, normalizedProvider, providerUserId)
                .isPresent();
            if (usedByOther) {
                return AccountIntegrationResponse.failure(
                    AccountIntegrationMessages.SOCIAL_ID_IN_USE,
                    AccountIntegrationResponse.IntegrationStatus.INTEGRATION_FAILED
                );
            }

            // 5. SNS 계정 정보 생성
            UserSocialAccount socialAccount = UserSocialAccount.builder()
                .user(existingUser)
                .provider(normalizedProvider)
                .providerUserId(providerUserId)
                .providerUsername(request.getFinalNickname())
                .providerProfileImage(null)
                .isPrimary(false)
                .isVerified(true)
                .isActive(true)
                .build();
            userSocialAccountRepository.save(socialAccount);

            // 6. 사용자 정보 업데이트 — 이메일은 기존 이메일 또는 SNS 이메일로만 바꿀 수 있다
            if (request.getFinalName() != null) {
                existingUser.setName(request.getFinalName());
            }
            if (request.getFinalNickname() != null) {
                existingUser.setNickname(request.getFinalNickname());
            }
            String finalEmail = request.getFinalEmail();
            if (finalEmail != null && !finalEmail.isBlank()
                    && !normalizeEmail(finalEmail).equals(normalizedEmail)
                    && normalizeEmail(finalEmail).equals(normalizeEmail(request.getSocialEmail()))) {
                existingUser.setEmail(finalEmail);
            }
            userRepository.save(existingUser);

            // 7. 인증 코드·시도 카운터 정리
            emailVerificationCodes.remove(normalizedEmail);
            attemptLimiter.reset(VerificationAttemptLimiter.Scope.VERIFY_EMAIL, normalizedEmail);

            // 8. 계정 통합 완료 이메일 발송 (토큰은 응답에 싣지 않는다. 로그인은 세션으로 진행)
            sendAccountIntegrationSuccessEmail(existingUser.getEmail(), existingUser.getName(), normalizedProvider);

            log.info("계정 통합 완료: userId={}, provider={}", existingUser.getId(), normalizedProvider);

            return AccountIntegrationResponse.success(
                AccountIntegrationMessages.INTEGRATION_DONE,
                existingUser.getId(),
                existingUser.getEmail(),
                existingUser.getName(),
                existingUser.getNickname(),
                existingUser.getRole().getValue()
            );

        } catch (Exception e) {
            log.error("계정 통합 실패", e);
            return AccountIntegrationResponse.failure(
                AccountIntegrationMessages.INTEGRATION_FAILED,
                AccountIntegrationResponse.IntegrationStatus.INTEGRATION_FAILED
            );
        }
    }

    @Override
    public EmailVerificationSendOutcome sendEmailVerificationCode(String email) {
        return sendEmailVerificationCode(email, null);
    }

    @Override
    public EmailVerificationSendOutcome sendEmailVerificationCode(String email, String clientIp) {
        String normalized = normalizeEmail(email);
        if (normalized.isEmpty()) {
            log.warn("이메일 인증 코드 발송 거부: 이메일이 비어 있거나 공백만 있음");
            return EmailVerificationSendOutcome.emailSendFailed();
        }
        if (attemptLimiter.isLocked(VerificationAttemptLimiter.Scope.SEND_IP, clientIp)) {
            log.warn("이메일 인증 코드 발송 IP 한도 초과");
            return EmailVerificationSendOutcome.ipLimit();
        }
        attemptLimiter.recordAttempt(VerificationAttemptLimiter.Scope.SEND_IP, clientIp);

        Object lock = emailSendLocksByNormalizedEmail.computeIfAbsent(normalized, k -> new Object());
        synchronized (lock) {
            try {
                log.info("이메일 인증 코드 발송: email={}", EmailLogMasking.maskForLog(normalized));

                int cooldownSec = mindgardenSecurityProperties.getAccountIntegration().getEmailVerificationCooldownSeconds();
                int dailyLimit = mindgardenSecurityProperties.getAccountIntegration().getEmailVerificationDailyLimit();
                LocalDate today = LocalDate.now();

                EmailThrottleEntry entry = emailSendThrottleByNormalizedEmail.getOrDefault(normalized, EmailThrottleEntry.empty());

                if (entry.lastSuccessfulSendAt() != null && cooldownSec > 0) {
                    long elapsedSec = ChronoUnit.SECONDS.between(entry.lastSuccessfulSendAt(), LocalDateTime.now());
                    if (elapsedSec < cooldownSec) {
                        long retryAfter = cooldownSec - elapsedSec;
                        log.warn("이메일 인증 코드 발송 쿨다운: email={}, elapsedSec={}, cooldownSec={}",
                            EmailLogMasking.maskForLog(normalized), elapsedSec, cooldownSec);
                        return EmailVerificationSendOutcome.cooldown(retryAfter);
                    }
                }

                int todayCount = (entry.dailyBucketDate() != null && entry.dailyBucketDate().equals(today))
                    ? entry.dailyCount() : 0;
                if (todayCount >= dailyLimit) {
                    log.warn("이메일 인증 코드 일일 발송 상한 초과: email={}, todayCount={}, dailyLimit={}",
                        EmailLogMasking.maskForLog(normalized), todayCount, dailyLimit);
                    return EmailVerificationSendOutcome.dailyLimit();
                }

                // 가입 여부와 무관하게 쿨다운·일일 카운트를 똑같이 올려 응답 차이로 가입 여부가 드러나지 않게 한다.
                emailSendThrottleByNormalizedEmail.put(normalized, entry.afterSuccessfulSend(today));

                String tenantId = TenantContextHolder.getRequiredTenantId();
                boolean registered = userRepository.findByTenantIdAndEmail(tenantId, normalized).isPresent();
                if (!registered) {
                    log.info("이메일 인증 코드 발송 생략: 해당 기관에 가입된 이메일 아님, email={}",
                        EmailLogMasking.maskForLog(normalized));
                    return EmailVerificationSendOutcome.success();
                }

                String code = codeGenerator.generateEmailCode();
                LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES);
                emailVerificationCodes.put(normalized, new EmailVerificationCode(code, expiryTime));
                attemptLimiter.reset(VerificationAttemptLimiter.Scope.VERIFY_EMAIL, normalized);

                try {
                    sendEmailVerificationCodeEmail(normalized, code);
                    log.info("이메일 인증 코드 생성 및 발송 성공: email={}, expiryTime={}", EmailLogMasking.maskForLog(normalized), expiryTime);
                } catch (Exception emailException) {
                    // 응답 동일성을 위해 호출자에게는 성공과 같은 결과를 돌려준다. 실패 원인은 서버 로그에만 남긴다.
                    log.error("이메일 인증 코드 이메일 발송 실패: email={}",
                        EmailLogMasking.maskForLog(normalized), emailException);
                }
                return EmailVerificationSendOutcome.success();
            } catch (Exception e) {
                log.error("이메일 인증 코드 발송 실패: email={}", EmailLogMasking.maskForLog(normalized), e);
                return EmailVerificationSendOutcome.emailSendFailed();
            }
        }
    }

    @Override
    public boolean verifyEmailCode(String email, String code) {
        return verifyEmailCode(email, code, null);
    }

    @Override
    public boolean isVerificationLocked(String email) {
        return attemptLimiter.isLocked(VerificationAttemptLimiter.Scope.VERIFY_EMAIL, normalizeEmail(email));
    }

    @Override
    public boolean verifyEmailCode(String email, String code, String clientIp) {
        try {
            String normalized = normalizeEmail(email);
            log.info("이메일 인증 코드 검증: email={}", EmailLogMasking.maskForLog(normalized));

            if (attemptLimiter.isLocked(VerificationAttemptLimiter.Scope.VERIFY_EMAIL, normalized)
                    || attemptLimiter.isLocked(VerificationAttemptLimiter.Scope.VERIFY_IP, clientIp)) {
                log.warn("이메일 인증 시도 잠금 중: email={}", EmailLogMasking.maskForLog(normalized));
                return false;
            }

            EmailVerificationCode storedCode = emailVerificationCodes.get(normalized);
            if (storedCode == null) {
                log.warn("인증 코드를 찾을 수 없음: email={}", EmailLogMasking.maskForLog(normalized));
                recordVerificationFailure(normalized, clientIp);
                return false;
            }

            if (!storedCode.isValid()) {
                log.warn("인증 코드가 만료됨: email={}", EmailLogMasking.maskForLog(normalized));
                emailVerificationCodes.remove(normalized);
                return false;
            }

            boolean isValid = code != null && MessageDigest.isEqual(
                storedCode.getCode().getBytes(StandardCharsets.UTF_8),
                code.getBytes(StandardCharsets.UTF_8));
            if (isValid) {
                log.info("이메일 인증 성공: email={}", EmailLogMasking.maskForLog(normalized));
            } else {
                log.warn("이메일 인증 실패: email={}", EmailLogMasking.maskForLog(normalized));
                recordVerificationFailure(normalized, clientIp);
            }

            return isValid;

        } catch (Exception e) {
            log.error("이메일 인증 코드 검증 실패: email={}", EmailLogMasking.maskForLog(email), e);
            return false;
        }
    }

    /**
     * 검증 실패를 이메일·IP 단위로 기록한다. 이메일 한도에 도달하면 저장된 코드를 폐기한다.
     */
    private void recordVerificationFailure(String normalizedEmail, String clientIp) {
        boolean emailLocked = attemptLimiter.recordAttempt(
            VerificationAttemptLimiter.Scope.VERIFY_EMAIL, normalizedEmail);
        attemptLimiter.recordAttempt(VerificationAttemptLimiter.Scope.VERIFY_IP, clientIp);
        if (emailLocked) {
            emailVerificationCodes.remove(normalizedEmail);
            log.warn("이메일 인증 시도 초과로 코드 폐기·잠금: email={}", EmailLogMasking.maskForLog(normalizedEmail));
        }
    }

    @Override
    public boolean linkSocialAccount(Long existingUserId, String provider, String providerUserId) {
        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            String normalizedProvider = SocialProvider.normalize(provider);
            if (normalizedProvider == null) {
                log.warn("SNS 제공자 정보가 비어 있음: userId={}", existingUserId);
                return false;
            }

            log.info("SNS 계정 연결: userId={}, provider={}, providerUserId={}", 
                    existingUserId, normalizedProvider, providerUserId);
            
            User user = userRepository.findByTenantIdAndId(tenantId, existingUserId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + existingUserId));
            
            // 이미 연결된 SNS 계정이 있는지 확인
            boolean alreadyLinked = userSocialAccountRepository
                .findByUserAndProviderAndIsDeletedFalse(user, normalizedProvider)
                .isPresent();
            
            if (alreadyLinked) {
                log.warn("이미 연결된 SNS 계정: userId={}, provider={}", existingUserId, normalizedProvider);
                return false;
            }
            
            // SNS 계정 정보 생성
            UserSocialAccount socialAccount = UserSocialAccount.builder()
                .user(user)
                .provider(normalizedProvider)
                .providerUserId(providerUserId)
                .isPrimary(false)
                .isVerified(true)
                .isActive(true)
                .build();
            
            userSocialAccountRepository.save(socialAccount);
            
            log.info("SNS 계정 연결 완료: userId={}, provider={}", existingUserId, normalizedProvider);
            return true;
            
        } catch (Exception e) {
            log.error("SNS 계정 연결 실패: userId={}, provider={}", existingUserId, provider, e);
            return false;
        }
    }
    
    @Override
    public AccountIntegrationResponse checkIntegrationStatus(String email) {
        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            log.info("계정 통합 상태 확인: email={}", EmailLogMasking.maskForLog(email));

            Optional<User> userOpt = userRepository.findByTenantIdAndEmail(tenantId, normalizeEmail(email));
            if (userOpt.isEmpty()) {
                return AccountIntegrationResponse.failure(
                    AccountIntegrationMessages.STATUS_NOT_LINKED,
                    AccountIntegrationResponse.IntegrationStatus.ACCOUNT_NOT_FOUND
                );
            }

            List<UserSocialAccount> socialAccounts = userSocialAccountRepository.findByUserAndIsDeletedFalse(userOpt.get());
            boolean linked = !socialAccounts.isEmpty();

            // 최소 정보: 연동 여부만 돌려준다(이름·역할·SNS 식별자 제외)
            return AccountIntegrationResponse.builder()
                .success(true)
                .message(linked ? AccountIntegrationMessages.STATUS_LINKED : AccountIntegrationMessages.STATUS_NOT_LINKED)
                .status(linked
                    ? AccountIntegrationResponse.IntegrationStatus.ALREADY_INTEGRATED
                    : AccountIntegrationResponse.IntegrationStatus.SUCCESS)
                .build();

        } catch (Exception e) {
            log.error("계정 통합 상태 확인 실패: email={}", EmailLogMasking.maskForLog(email), e);
            return AccountIntegrationResponse.failure(
                AccountIntegrationMessages.STATUS_FAILED,
                AccountIntegrationResponse.IntegrationStatus.INTEGRATION_FAILED
            );
        }
    }

    // ==================== Private helpers ====================

    /**
     * 인증 코드 저장·스로틀 키로 사용하는 이메일 정규화(소문자·trim).
     *
     * @param email 원본 이메일
     * @return 정규화된 이메일, null·공백만 있으면 빈 문자열
     */
    private static String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    // ==================== Private Email Methods ====================

    /**
     * 이메일 인증 코드 발송
     */
    private void sendEmailVerificationCodeEmail(String email, String code) {
        try {
            log.info("이메일 인증 코드 이메일 발송: email={}", EmailLogMasking.maskForLog(email));
            
            // 이메일 템플릿 변수 설정 (키는 {{}} 없이 변수 이름만 사용)
            Map<String, Object> variables = new HashMap<>();
            variables.put("userEmail", email);
            variables.put("companyName", "Trinity");
            variables.put("supportEmail", "admin@e-trinity.co.kr");
            variables.put("currentYear", String.valueOf(java.time.Year.now().getValue()));
            variables.put("verificationCode", code);
            variables.put("expiryMinutes", String.valueOf(CODE_EXPIRY_MINUTES));
            
            // 템플릿 기반 이메일 발송 (이메일 인증 코드용 템플릿 사용)
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_EMAIL_VERIFICATION,
                    email,
                    "사용자",
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("이메일 인증 코드 이메일 발송 성공: email={}, emailId={}", EmailLogMasking.maskForLog(email), response.getEmailId());
            } else {
                log.error("이메일 인증 코드 이메일 발송 실패: email={}, error={}", EmailLogMasking.maskForLog(email), response.getErrorMessage());
                throw new RuntimeException("이메일 발송 실패: " + (response.getErrorMessage() != null ? response.getErrorMessage() : "알 수 없는 오류"));
            }

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("이메일 인증 코드 이메일 발송 중 오류: email={}, error={}", EmailLogMasking.maskForLog(email), e.getMessage(), e);
            throw new RuntimeException("이메일 발송 중 오류: " + e.getMessage(), e);
        }
    }
    
    /**
     * 계정 통합 완료 이메일 발송
     */
    private void sendAccountIntegrationSuccessEmail(String email, String name, String provider) {
        try {
            log.info("계정 통합 완료 이메일 발송: email={}, provider={}", EmailLogMasking.maskForLog(email), provider);
            
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
                log.info("계정 통합 완료 이메일 발송 성공: email={}, emailId={}", EmailLogMasking.maskForLog(email), response.getEmailId());
            } else {
                log.error("계정 통합 완료 이메일 발송 실패: email={}, error={}", EmailLogMasking.maskForLog(email), response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("계정 통합 완료 이메일 발송 중 오류: email={}, error={}", EmailLogMasking.maskForLog(email), e.getMessage(), e);
        }
    }
}
