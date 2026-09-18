package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.Optional;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import com.coresolution.consultation.service.ClientProfilePhoneVerificationService;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneHashUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * {@link ClientProfilePhoneVerificationService} — {@code phone_otp_attempts} VERIFIED 장부 SSOT.
 *
 * <p>OTP 발송·검증은 기존 {@code SmsOtpVerificationService} + CHANGE_PHONE / OAuth PhoneOtp 경로를 그대로 쓰고,
 * CHANGE_PHONE 성공 시에만 본 서비스가 PROFILE VERIFIED 장부 행을 남긴다.
 * 결제 게이트 조회는 provider 무관하게 {@code tenantId + phoneHash + VERIFIED + verifiedAt} 로 매칭한다.
 * 별도 OTP 스택·users 컬럼을 만들지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-18
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientProfilePhoneVerificationServiceImpl implements ClientProfilePhoneVerificationService {

    /**
     * OTP 본문은 SmsOtpVerificationService 에서 이미 소비됨 — 장부 NOT NULL 용 마커.
     * 결제 게이트는 status/verified_at/phone_hash 만 조회하며 code_hash 로 OTP 를 재검증하지 않는다.
     */
    private static final String PROFILE_LEDGER_CODE_HASH = "PROFILE_CHANGE_PHONE_LEDGER";

    private final PhoneOtpAttemptRepository phoneOtpAttemptRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;

    @Override
    @Transactional
    public void recordVerifiedAfterChangePhone(String tenantId, Long userId, String normalizedPhoneDigits) {
        if (!StringUtils.hasText(tenantId) || userId == null
                || !LoginIdentifierUtils.isValidKoreanMobileDigits(normalizedPhoneDigits)) {
            throw new IllegalArgumentException("프로필 휴대폰 인증 장부 기록 파라미터가 올바르지 않습니다.");
        }
        String phoneHash = PhoneHashUtils.sha256Hex(normalizedPhoneDigits);
        LocalDateTime now = LocalDateTime.now();
        PhoneOtpAttempt row = PhoneOtpAttempt.builder()
                .tenantId(tenantId)
                .provider(PhoneOtpAttempt.PROVIDER_PROFILE)
                .providerUserId(String.valueOf(userId))
                .phoneHash(phoneHash)
                .codeHash(PROFILE_LEDGER_CODE_HASH)
                .attempts(0)
                .dailyCount(1)
                .status(PhoneOtpAttempt.STATUS_VERIFIED)
                .createdAt(now)
                .expiresAt(now)
                .verifiedAt(now)
                .build();
        phoneOtpAttemptRepository.save(row);
        log.info("프로필 휴대폰 VERIFIED 장부 기록: tenantId={}, userId={}, phoneHashPrefix={}",
                tenantId, userId, phoneHash != null && phoneHash.length() >= 8
                        ? phoneHash.substring(0, 8) : phoneHash);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isPhoneVerifiedForPayment(User user) {
        return findMatchingVerifiedRow(user).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> findNormalizedPhoneDigits(User user) {
        if (user == null) {
            return Optional.empty();
        }
        String normalized = resolveNormalizedPhone(user);
        if (!LoginIdentifierUtils.isValidKoreanMobileDigits(normalized)) {
            return Optional.empty();
        }
        return Optional.of(normalized);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<LocalDateTime> findPhoneVerifiedAt(User user) {
        return findMatchingVerifiedRow(user).map(PhoneOtpAttempt::getVerifiedAt);
    }

    private Optional<PhoneOtpAttempt> findMatchingVerifiedRow(User user) {
        if (user == null || user.getId() == null || !StringUtils.hasText(user.getTenantId())) {
            return Optional.empty();
        }
        String normalized = resolveNormalizedPhone(user);
        if (!LoginIdentifierUtils.isValidKoreanMobileDigits(normalized)) {
            return Optional.empty();
        }
        String phoneHash = PhoneHashUtils.sha256Hex(normalized);
        // OTP 성공 SSOT: PROFILE(CHANGE_PHONE) 및 OAuth(APPLE/KAKAO/…) VERIFIED 행 모두 허용
        return phoneOtpAttemptRepository
                .findFirstByTenantIdAndPhoneHashAndStatusAndVerifiedAtIsNotNullOrderByVerifiedAtDesc(
                        user.getTenantId(),
                        phoneHash,
                        PhoneOtpAttempt.STATUS_VERIFIED);
    }

    private String resolveNormalizedPhone(User user) {
        String rawPhone = null;
        if (StringUtils.hasText(user.getPhone())) {
            try {
                rawPhone = encryptionUtil.safeDecrypt(user.getPhone());
            } catch (Exception e) {
                log.warn("프로필 휴대폰 복호화 실패: userId={}", user.getId());
                rawPhone = user.getPhone();
            }
        }
        return LoginIdentifierUtils.normalizeKoreanMobileDigits(rawPhone);
    }
}
