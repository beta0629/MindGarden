package com.coresolution.consultation.service.impl;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import com.coresolution.consultation.dto.auth.PasswordResetSmsResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import com.coresolution.consultation.service.ClientCredentialNotificationService;
import com.coresolution.consultation.service.PasswordResetOpaqueTokenStore;
import com.coresolution.consultation.service.PasswordResetSmsService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.service.support.TemporaryPasswordGenerator;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneHashUtils;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 휴대폰 비밀번호 찾기 SMS 구현.
 *
 * <p>재사용: {@link SmsAuthService#sendVerificationCode},
 * {@link ClientCredentialNotificationService#deliverAfterCommit},
 * {@link PhoneOtpAttempt}(provider={@link PhoneOtpAttempt#PROVIDER_PASSWORD_RESET}).</p>
 *
 * <p>challengeToken·resetProofToken 은 {@link PasswordResetOpaqueTokenStore} opaque 참조이며
 * 토큰·스토어에 phone/phoneHash 를 넣지 않는다(PhoneOtpAttempt 가 SSOT).</p>
 *
 * @author MindGarden
 * @since 2026-11-01
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class PasswordResetSmsServiceImpl implements PasswordResetSmsService {

    private static final ZoneId KST_ZONE = ZoneId.of("Asia/Seoul");

    private static final String CODE_INVALID_REQUEST = "INVALID_REQUEST";
    private static final String CODE_COOLDOWN = "RESEND_COOLDOWN";
    private static final String CODE_DAILY_LIMIT = "DAILY_LIMIT";
    private static final String CODE_RATE_LIMIT = "RATE_LIMIT";
    private static final String CODE_OTP_EXPIRED = "OTP_EXPIRED";
    private static final String CODE_OTP_INVALID = "OTP_INVALID";
    private static final String CODE_TOKEN_EXPIRED = "TOKEN_EXPIRED";
    private static final String CODE_SEND_FAILED = "SEND_FAILED";

    private static final String MSG_SEND_SUCCESS =
        "입력하신 휴대폰 번호로 인증번호를 발송했습니다. 문자를 확인해주세요.";
    private static final String MSG_VERIFY_SUCCESS =
        "인증이 완료되었습니다. 임시 비밀번호를 발송합니다.";
    private static final String MSG_TEMP_SUCCESS =
        "임시 비밀번호를 문자로 발송했습니다. 로그인 후 비밀번호를 변경해주세요.";

    /** 존재 여부 비노출용 의도적 지연(ms). */
    private static final long TIMING_PAD_MS = 120L;

    /** IP+번호 분당 요청 상한. */
    private static final int IP_PHONE_PER_MINUTE = 10;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PhoneOtpAttemptRepository phoneOtpAttemptRepository;
    private final SmsAuthService smsAuthService;
    private final PasswordResetOpaqueTokenStore opaqueTokenStore;
    private final UserRepository userRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final PasswordService passwordService;
    private final PasswordEncoder passwordEncoder;
    private final TemporaryPasswordGenerator temporaryPasswordGenerator;
    private final ClientCredentialNotificationService clientCredentialNotificationService;

    /** IP+phoneHash 레이트리밋 버킷. */
    private final Map<String, RateBucket> ipPhoneBuckets = new ConcurrentHashMap<>();

    @Override
    public PasswordResetSmsResponse sendOtp(String phone, String clientIp) {
        String tenantId = TenantContextHolder.getTenantId();
        if (!StringUtils.hasText(tenantId)) {
            log.warn("비밀번호 찾기 SMS: tenantId 없음 — 성공 위장");
            padTiming();
            return disguiseSendSuccess(null);
        }

        String normalizedPhone;
        try {
            normalizedPhone = LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms(phone);
        } catch (IllegalArgumentException e) {
            return failure(e.getMessage(), CODE_INVALID_REQUEST);
        }

        String phoneHash = PhoneHashUtils.sha256Hex(normalizedPhone);
        if (!allowIpPhone(clientIp, phoneHash)) {
            return failure("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", CODE_RATE_LIMIT);
        }

        LocalDateTime now = LocalDateTime.now();
        Optional<PhoneOtpAttempt> recent = phoneOtpAttemptRepository
            .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                tenantId, PhoneOtpAttempt.PROVIDER_PASSWORD_RESET, phoneHash, phoneHash);
        if (recent.isPresent()) {
            long elapsed = Duration.between(recent.get().getCreatedAt(), now).getSeconds();
            if (elapsed < PhoneOtpAttempt.RESEND_COOLDOWN_SECONDS) {
                long retryAfter = PhoneOtpAttempt.RESEND_COOLDOWN_SECONDS - elapsed;
                return PasswordResetSmsResponse.builder()
                    .success(false)
                    .code(CODE_COOLDOWN)
                    .message("잠시 후 다시 시도해 주세요.")
                    .retryAfterSeconds(retryAfter)
                    .resendCooldownSeconds(PhoneOtpAttempt.RESEND_COOLDOWN_SECONDS)
                    .maskedPhone(maskKoreanMobile(normalizedPhone))
                    .build();
            }
        }

        LocalDateTime startOfToday = LocalDate.now(KST_ZONE).atStartOfDay(KST_ZONE).toLocalDateTime();
        long dailyCount = phoneOtpAttemptRepository
            .countByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqual(
                tenantId, PhoneOtpAttempt.PROVIDER_PASSWORD_RESET, phoneHash, startOfToday);
        if (dailyCount >= PhoneOtpAttempt.MAX_DAILY_COUNT) {
            return failure("오늘 인증번호 발송 한도를 초과했습니다. 내일 다시 시도해 주세요.", CODE_DAILY_LIMIT);
        }

        EligibleUser eligible = resolveEligibleLocalUser(tenantId, phoneHash);
        String otpCode;
        boolean realSend = eligible != null;
        if (realSend) {
            try {
                otpCode = smsAuthService.sendVerificationCode(normalizedPhone);
            } catch (IllegalArgumentException e) {
                return failure(e.getMessage(), CODE_SEND_FAILED);
            }
            if (!StringUtils.hasText(otpCode)) {
                log.warn("비밀번호 찾기 OTP SMS 발송 실패: phone={}",
                    PhoneLogMasking.maskForLog(normalizedPhone));
                return failure("인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.", CODE_SEND_FAILED);
            }
        } else {
            otpCode = randomUnusedOtp();
            padTiming();
            log.info("비밀번호 찾기 OTP 위장 발송: phone={}, reason=ineligible_or_missing",
                PhoneLogMasking.maskForLog(normalizedPhone));
        }

        PhoneOtpAttempt row = PhoneOtpAttempt.builder()
            .tenantId(tenantId)
            .provider(PhoneOtpAttempt.PROVIDER_PASSWORD_RESET)
            .providerUserId(phoneHash)
            .phoneHash(phoneHash)
            .codeHash(passwordService.encodeSecret(otpCode))
            .attempts(0)
            .dailyCount((int) (dailyCount + 1))
            .status(PhoneOtpAttempt.STATUS_PENDING)
            .createdAt(now)
            .expiresAt(now.plusMinutes(PhoneOtpAttempt.EXPIRY_MINUTES))
            .build();
        PhoneOtpAttempt saved = phoneOtpAttemptRepository.saveAndFlush(row);

        // 위장 경로 포함 — PII 없는 opaque challenge (존재 비노출용 스키마 동일)
        String challengeToken = opaqueTokenStore.issueChallenge(tenantId, saved.getId());

        log.info("비밀번호 찾기 OTP 처리 완료: phone={}, otpId={}, realSend={}",
            PhoneLogMasking.maskForLog(normalizedPhone), saved.getId(), realSend);

        return PasswordResetSmsResponse.builder()
            .success(true)
            .message(MSG_SEND_SUCCESS)
            .challengeToken(challengeToken)
            .expiresInSeconds(Duration.ofMinutes(PhoneOtpAttempt.EXPIRY_MINUTES).getSeconds())
            .resendCooldownSeconds(PhoneOtpAttempt.RESEND_COOLDOWN_SECONDS)
            .maskedPhone(maskKoreanMobile(normalizedPhone))
            .build();
    }

    @Override
    public PasswordResetSmsResponse verifyOtp(String phone, String verificationCode,
            String challengeToken, String clientIp) {
        if (!StringUtils.hasText(verificationCode) || !StringUtils.hasText(challengeToken)) {
            return failure("필수 값이 누락됐습니다.", CODE_INVALID_REQUEST);
        }

        String tenantId = TenantContextHolder.getTenantId();
        if (!StringUtils.hasText(tenantId)) {
            return failure("인증 세션이 만료됐습니다. 다시 시도해 주세요.", CODE_TOKEN_EXPIRED);
        }

        String normalizedPhone;
        try {
            normalizedPhone = LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms(phone);
        } catch (IllegalArgumentException e) {
            return failure(e.getMessage(), CODE_INVALID_REQUEST);
        }
        String phoneHash = PhoneHashUtils.sha256Hex(normalizedPhone);

        if (!allowIpPhone(clientIp, phoneHash)) {
            return failure("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", CODE_RATE_LIMIT);
        }

        Optional<PasswordResetOpaqueTokenStore.TokenEntry> challengeOpt =
            opaqueTokenStore.resolveChallenge(challengeToken, tenantId);
        if (challengeOpt.isEmpty()) {
            log.warn("비밀번호 찾기 verify: opaque challenge 거부(만료·위변조·타테넌트)");
            return failure("인증 세션이 만료됐습니다. 인증번호를 다시 받아 주세요.", CODE_TOKEN_EXPIRED);
        }
        PasswordResetOpaqueTokenStore.TokenEntry challenge = challengeOpt.get();

        Optional<PhoneOtpAttempt> rowOpt = phoneOtpAttemptRepository
            .findByIdAndTenantIdAndStatus(challenge.otpId(), tenantId,
                PhoneOtpAttempt.STATUS_PENDING);
        if (rowOpt.isEmpty()) {
            return failure("이미 사용했거나 만료된 인증 요청입니다. 인증번호를 다시 받아 주세요.", CODE_OTP_EXPIRED);
        }

        PhoneOtpAttempt row = rowOpt.get();
        if (!PhoneOtpAttempt.PROVIDER_PASSWORD_RESET.equals(row.getProvider())
                || !phoneHash.equals(row.getPhoneHash())) {
            row.setStatus(PhoneOtpAttempt.STATUS_FAILED);
            phoneOtpAttemptRepository.save(row);
            return failure("인증 요청이 일치하지 않습니다. 다시 시도해 주세요.", CODE_OTP_INVALID);
        }
        if (row.getExpiresAt().isBefore(LocalDateTime.now())) {
            row.setStatus(PhoneOtpAttempt.STATUS_EXPIRED);
            phoneOtpAttemptRepository.save(row);
            return failure("인증번호가 만료됐습니다. 다시 받아 주세요.", CODE_OTP_EXPIRED);
        }

        row.setAttempts(row.getAttempts() == null ? 1 : row.getAttempts() + 1);
        if (row.getAttempts() > PhoneOtpAttempt.MAX_ATTEMPTS) {
            row.setStatus(PhoneOtpAttempt.STATUS_FAILED);
            phoneOtpAttemptRepository.save(row);
            return failure("인증 시도 횟수를 초과했습니다. 인증번호를 다시 받아 주세요.", CODE_OTP_INVALID);
        }

        boolean matches = passwordEncoder.matches(verificationCode, row.getCodeHash());
        if (!matches) {
            phoneOtpAttemptRepository.save(row);
            if (row.getAttempts() >= PhoneOtpAttempt.MAX_ATTEMPTS) {
                row.setStatus(PhoneOtpAttempt.STATUS_FAILED);
                phoneOtpAttemptRepository.save(row);
                return failure("인증 시도 횟수를 초과했습니다. 인증번호를 다시 받아 주세요.", CODE_OTP_INVALID);
            }
            return failure("인증번호가 일치하지 않습니다.", CODE_OTP_INVALID);
        }

        row.setStatus(PhoneOtpAttempt.STATUS_VERIFIED);
        row.setVerifiedAt(LocalDateTime.now());
        phoneOtpAttemptRepository.save(row);

        opaqueTokenStore.invalidate(challengeToken);
        String resetProofToken = opaqueTokenStore.issueProof(tenantId, row.getId());

        return PasswordResetSmsResponse.builder()
            .success(true)
            .message(MSG_VERIFY_SUCCESS)
            .resetProofToken(resetProofToken)
            .maskedPhone(maskKoreanMobile(normalizedPhone))
            .build();
    }

    @Override
    public PasswordResetSmsResponse sendTempPassword(String resetProofToken, String clientIp) {
        if (!StringUtils.hasText(resetProofToken)) {
            return failure("필수 값이 누락됐습니다.", CODE_INVALID_REQUEST);
        }

        String tenantId = TenantContextHolder.getTenantId();
        if (!StringUtils.hasText(tenantId)) {
            padTiming();
            return successTemp();
        }

        Optional<PasswordResetOpaqueTokenStore.TokenEntry> proofOpt =
            opaqueTokenStore.resolveProof(resetProofToken, tenantId);
        if (proofOpt.isEmpty()) {
            // 위변조·만료·타테넌트·재사용 — 존재 비노출을 위해 성공 위장(재사용 시 SMS 0)
            padTiming();
            return successTemp();
        }
        PasswordResetOpaqueTokenStore.TokenEntry proof = proofOpt.get();

        Optional<PhoneOtpAttempt> rowOpt = phoneOtpAttemptRepository
            .findByIdAndTenantIdAndStatus(proof.otpId(), tenantId, PhoneOtpAttempt.STATUS_VERIFIED);
        if (rowOpt.isEmpty()) {
            opaqueTokenStore.invalidate(resetProofToken);
            padTiming();
            return successTemp();
        }

        PhoneOtpAttempt row = rowOpt.get();
        if (!PhoneOtpAttempt.PROVIDER_PASSWORD_RESET.equals(row.getProvider())
                || !StringUtils.hasText(row.getPhoneHash())) {
            opaqueTokenStore.invalidate(resetProofToken);
            padTiming();
            return successTemp();
        }

        if (!allowIpPhone(clientIp, row.getPhoneHash())) {
            return failure("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", CODE_RATE_LIMIT);
        }

        // 1회용 소비 — 이후 동일 proof 재사용은 위장 성공·SMS 0
        if (opaqueTokenStore.consumeProof(resetProofToken, tenantId).isEmpty()) {
            padTiming();
            return successTemp();
        }

        row.setStatus(PhoneOtpAttempt.STATUS_CONSUMED);
        phoneOtpAttemptRepository.save(row);

        EligibleUser eligible = resolveEligibleLocalUser(tenantId, row.getPhoneHash());
        if (eligible == null) {
            padTiming();
            String hashPrefix = row.getPhoneHash().substring(0, Math.min(8, row.getPhoneHash().length()));
            log.info("비밀번호 찾기 임시비번 스킵: phoneHashPrefix={}, reason=ineligible", hashPrefix);
            return successTemp();
        }

        String tempPassword = temporaryPasswordGenerator.generate();
        int updated = userRepository.updatePasswordRequiringCredentialChange(
            eligible.user.getId(),
            tenantId,
            passwordService.encodeSecret(tempPassword),
            LocalDateTime.now());
        if (updated != 1) {
            log.warn("비밀번호 찾기 임시비번 DB 갱신 실패: userId={}", eligible.user.getId());
            return successTemp();
        }

        String loginId = StringUtils.hasText(eligible.user.getUserId())
            ? eligible.user.getUserId()
            : eligible.user.getEmail();
        clientCredentialNotificationService.deliverAfterCommit(
            sent -> log.info("비밀번호 찾기 임시비번 SMS: userId={}, smsSent={}, reason={}",
                eligible.user.getId(), sent.isSmsSent(), sent.getSkipReason()),
            eligible.plainPhone,
            loginId,
            tempPassword,
            tenantId,
            eligible.user.getId());

        return successTemp();
    }

    private EligibleUser resolveEligibleLocalUser(String tenantId, String phoneHash) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(phoneHash)) {
            return null;
        }
        List<EligibleUser> matches = userRepository.findByTenantId(tenantId).stream()
            .map(u -> toEligibleIfMatch(u, phoneHash))
            .filter(e -> e != null)
            .collect(Collectors.toList());
        if (matches.isEmpty()) {
            return null;
        }
        return matches.stream()
            .filter(e -> Boolean.TRUE.equals(e.user.getIsActive()) || e.user.getIsActive() == null)
            .findFirst()
            .orElse(null);
    }

    private EligibleUser toEligibleIfMatch(User user, String phoneHash) {
        if (user == null || Boolean.TRUE.equals(user.getIsDeleted())) {
            return null;
        }
        if (Boolean.TRUE.equals(user.getIsSocialAccount())
                || StringUtils.hasText(user.getSocialProvider())) {
            return null;
        }
        String plain = decryptPhone(user);
        if (!StringUtils.hasText(plain)) {
            return null;
        }
        String normalized = LoginIdentifierUtils.normalizeKoreanMobileDigits(plain.trim());
        if (!LoginIdentifierUtils.isValidKoreanMobileDigits(normalized)) {
            return null;
        }
        if (!phoneHash.equals(PhoneHashUtils.sha256Hex(normalized))) {
            return null;
        }
        return new EligibleUser(user, normalized);
    }

    private String decryptPhone(User user) {
        if (!StringUtils.hasText(user.getPhone())) {
            return null;
        }
        try {
            return encryptionUtil.safeDecrypt(user.getPhone());
        } catch (Exception e) {
            return user.getPhone();
        }
    }

    private boolean allowIpPhone(String clientIp, String phoneHash) {
        String ip = StringUtils.hasText(clientIp) ? clientIp : "unknown";
        String key = ip + "|" + phoneHash;
        long now = System.currentTimeMillis();
        RateBucket bucket = ipPhoneBuckets.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStartMs > 60_000L) {
                return new RateBucket(now, 1);
            }
            existing.count++;
            return existing;
        });
        return bucket.count <= IP_PHONE_PER_MINUTE;
    }

    private static PasswordResetSmsResponse successTemp() {
        return PasswordResetSmsResponse.builder()
            .success(true)
            .message(MSG_TEMP_SUCCESS)
            .build();
    }

    private static PasswordResetSmsResponse disguiseSendSuccess(String maskedPhone) {
        return PasswordResetSmsResponse.builder()
            .success(true)
            .message(MSG_SEND_SUCCESS)
            .maskedPhone(maskedPhone)
            .expiresInSeconds(Duration.ofMinutes(PhoneOtpAttempt.EXPIRY_MINUTES).getSeconds())
            .resendCooldownSeconds(PhoneOtpAttempt.RESEND_COOLDOWN_SECONDS)
            .build();
    }

    private static PasswordResetSmsResponse failure(String message, String code) {
        return PasswordResetSmsResponse.builder()
            .success(false)
            .message(message)
            .code(code)
            .build();
    }

    private static String maskKoreanMobile(String normalized) {
        if (!StringUtils.hasText(normalized) || normalized.length() < 8) {
            return normalized;
        }
        return normalized.substring(0, 3) + "-****-" + normalized.substring(normalized.length() - 4);
    }

    private static String randomUnusedOtp() {
        int code = 100000 + SECURE_RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    private static void padTiming() {
        try {
            Thread.sleep(TIMING_PAD_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static final class EligibleUser {
        private final User user;
        private final String plainPhone;

        private EligibleUser(User user, String plainPhone) {
            this.user = user;
            this.plainPhone = plainPhone;
        }
    }

    private static final class RateBucket {
        private final long windowStartMs;
        private int count;

        private RateBucket(long windowStartMs, int count) {
            this.windowStartMs = windowStartMs;
            this.count = count;
        }
    }
}
