package com.coresolution.consultation.sct.service.impl;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctFormType;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.dto.SctConsentStatusView;
import com.coresolution.consultation.sct.dto.SctIdentityOtpConfirmRequest;
import com.coresolution.consultation.sct.dto.SctIdentityOtpSendRequest;
import com.coresolution.consultation.sct.dto.SctIdentityOtpSendResponse;
import com.coresolution.consultation.sct.dto.SctVerifyResponse;
import com.coresolution.consultation.sct.entity.SctFormTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.entity.SctInviteAccessAttempt;
import com.coresolution.consultation.sct.exception.SctConflictException;
import com.coresolution.consultation.sct.exception.SctGoneException;
import com.coresolution.consultation.sct.exception.SctIdentityContactConsentRequiredException;
import com.coresolution.consultation.sct.exception.SctOtpExpiredException;
import com.coresolution.consultation.sct.exception.SctOtpInvalidException;
import com.coresolution.consultation.sct.exception.SctOtpLockedException;
import com.coresolution.consultation.sct.exception.SctOtpRateLimitedException;
import com.coresolution.consultation.sct.exception.SctVerifyLockedException;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctInviteAccessAttemptRepository;
import com.coresolution.consultation.sct.service.SctConsentService;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctIdentityOtpAttemptRecorder;
import com.coresolution.consultation.sct.service.SctIdentityOtpDevCodeStore;
import com.coresolution.consultation.sct.service.SctIdentityOtpRateLimiter;
import com.coresolution.consultation.sct.service.SctDeviceSessionCookieSupport;
import com.coresolution.consultation.sct.service.SctIdentityOtpService;
import com.coresolution.consultation.sct.service.SctIdentityOtpSettings;
import com.coresolution.consultation.sct.service.SctPublicTokenResolver;
import com.coresolution.consultation.sct.service.SctVerifySessionStore;
import com.coresolution.consultation.security.pii.PiiHmacService;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * SCT 공개 본인확인 SMS OTP 구현.
 *
 * <p>일치 시에만 {@link SmsAuthService#sendVerificationCode} 호출(testMode 는 코드 로그 우회).
 * 불일치는 발송·저장 없이 동일 응답 + timing pad.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Slf4j
@Service
public class SctIdentityOtpServiceImpl implements SctIdentityOtpService {

    private static final ZoneId TOKEN_EXPIRY_ZONE = ZoneId.of("Asia/Seoul");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String CODE_DIGITS = "0123456789";

    private final SctInvitationRepository invitationRepository;
    private final SctFormTemplateRepository formTemplateRepository;
    private final SctInviteAccessAttemptRepository attemptRepository;
    private final PhoneOtpAttemptRepository phoneOtpAttemptRepository;
    private final SctVerifySessionStore verifySessionStore;
    private final SctPublicTokenResolver publicTokenResolver;
    private final SctFeatureGuard sctFeatureGuard;
    private final SctConsentService sctConsentService;
    private final SmsAuthService smsAuthService;
    private final PasswordService passwordService;
    private final SctIdentityOtpSettings otpSettings;
    private final SctIdentityOtpRateLimiter rateLimiter;
    private final SctIdentityOtpAttemptRecorder attemptRecorder;
    private final ObjectProvider<SctIdentityOtpDevCodeStore> devCodeStore;
    private final PiiHmacService piiHmacService;

    /**
     * @param invitationRepository       초대
     * @param formTemplateRepository     양식
     * @param attemptRepository          접근 시도
     * @param phoneOtpAttemptRepository  OTP 장부
     * @param verifySessionStore         세션
     * @param publicTokenResolver        토큰·교환 코드 공용 해석
     * @param sctFeatureGuard            기능 가드
     * @param sctConsentService          동의
     * @param smsAuthService             SMS
     * @param passwordService            코드 해시
     * @param otpSettings                설정 SSOT
     * @param rateLimiter                전용 rate limiter
     * @param attemptRecorder            오답·잠금 REQUIRES_NEW 기록
     * @param devCodeStore               .dev 전용(없으면 empty)
     * @param piiHmacService             전화·토큰 HMAC(조회·일치)
     */
    public SctIdentityOtpServiceImpl(
            SctInvitationRepository invitationRepository,
            SctFormTemplateRepository formTemplateRepository,
            SctInviteAccessAttemptRepository attemptRepository,
            PhoneOtpAttemptRepository phoneOtpAttemptRepository,
            SctVerifySessionStore verifySessionStore,
            SctPublicTokenResolver publicTokenResolver,
            SctFeatureGuard sctFeatureGuard,
            SctConsentService sctConsentService,
            SmsAuthService smsAuthService,
            PasswordService passwordService,
            SctIdentityOtpSettings otpSettings,
            SctIdentityOtpRateLimiter rateLimiter,
            SctIdentityOtpAttemptRecorder attemptRecorder,
            ObjectProvider<SctIdentityOtpDevCodeStore> devCodeStore,
            PiiHmacService piiHmacService) {
        this.invitationRepository = invitationRepository;
        this.formTemplateRepository = formTemplateRepository;
        this.attemptRepository = attemptRepository;
        this.phoneOtpAttemptRepository = phoneOtpAttemptRepository;
        this.verifySessionStore = verifySessionStore;
        this.publicTokenResolver = publicTokenResolver;
        this.sctFeatureGuard = sctFeatureGuard;
        this.sctConsentService = sctConsentService;
        this.smsAuthService = smsAuthService;
        this.passwordService = passwordService;
        this.otpSettings = otpSettings;
        this.rateLimiter = rateLimiter;
        this.attemptRecorder = attemptRecorder;
        this.devCodeStore = devCodeStore;
        this.piiHmacService = piiHmacService;
    }

    @Override
    @Transactional
    public SctIdentityOtpSendResponse sendOtp(
            String rawToken, SctIdentityOtpSendRequest request, String clientIp) {
        SctInvitation invitation = loadForWrite(rawToken);
        bindTenantAndGuard(invitation);
        assertWritableOrVerify(invitation);
        assertHasIdentityContactConsent(invitation);
        assertPhoneChannel(invitation);
        assertNotVerifyLocked(invitation);

        String normalizedPhone;
        try {
            normalizedPhone = LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms(
                    request == null ? null : request.getPhone());
        } catch (IllegalArgumentException ex) {
            throw new SctOtpInvalidException(SctConstants.MSG_OTP_INVALID);
        }

        String tenantId = invitation.getTenantId();
        String phoneHash = piiHmacService.hmacHex(normalizedPhone);
        String ipHash = piiHmacService.hmacHex(clientIp == null ? "unknown" : clientIp);
        String inviteKey = inviteBucket(tenantId, invitation.getId());
        String phoneKey = "phone:" + tenantId + ":" + phoneHash;
        String ipKey = "ip:" + tenantId + ":" + ipHash;

        int inviteLimit = otpSettings.sendLimitPerHourInvite(tenantId);
        int phoneLimit = otpSettings.sendLimitPerHourPhone(tenantId);
        int ipLimit = otpSettings.sendLimitPerHourIp(tenantId);

        LocalDateTime hourAgo = LocalDateTime.now().minusHours(1);
        long inviteDb = phoneOtpAttemptRepository
                .countByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqual(
                        tenantId,
                        PhoneOtpAttempt.PROVIDER_SCT_IDENTITY,
                        String.valueOf(invitation.getId()),
                        hourAgo);
        long phoneDb = phoneOtpAttemptRepository
                .countByTenantIdAndProviderAndPhoneHashAndCreatedAtGreaterThanEqual(
                        tenantId, PhoneOtpAttempt.PROVIDER_SCT_IDENTITY, phoneHash, hourAgo);
        if (inviteDb >= inviteLimit || phoneDb >= phoneLimit
                || !rateLimiter.hasCapacity(inviteKey, inviteLimit)
                || !rateLimiter.hasCapacity(phoneKey, phoneLimit)
                || !rateLimiter.hasCapacity(ipKey, ipLimit)) {
            long retryAfter = 0L;
            if (inviteDb >= inviteLimit) {
                retryAfter = Math.max(retryAfter, retryAfterFromRows(
                        phoneOtpAttemptRepository
                                .findByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(
                                        tenantId, PhoneOtpAttempt.PROVIDER_SCT_IDENTITY,
                                        String.valueOf(invitation.getId()), hourAgo),
                        inviteLimit));
            }
            if (phoneDb >= phoneLimit) {
                retryAfter = Math.max(retryAfter, retryAfterFromRows(
                        phoneOtpAttemptRepository
                                .findByTenantIdAndProviderAndPhoneHashAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(
                                        tenantId, PhoneOtpAttempt.PROVIDER_SCT_IDENTITY, phoneHash, hourAgo),
                        phoneLimit));
            }
            retryAfter = Math.max(retryAfter, rateLimiter.retryAfterSeconds(inviteKey, inviteLimit));
            retryAfter = Math.max(retryAfter, rateLimiter.retryAfterSeconds(phoneKey, phoneLimit));
            retryAfter = Math.max(retryAfter, rateLimiter.retryAfterSeconds(ipKey, ipLimit));
            log.info("SCT identity OTP send rate-limited: invitationId={}, retryAfterSec={}",
                    invitation.getId(), retryAfter);
            throw new SctOtpRateLimitedException(SctConstants.MSG_OTP_RATE_LIMITED,
                    retryAfter > 0L ? retryAfter : null);
        }

        int cooldown = otpSettings.resendCooldownSeconds(tenantId);
        Optional<PhoneOtpAttempt> recent = phoneOtpAttemptRepository
                .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                        tenantId,
                        PhoneOtpAttempt.PROVIDER_SCT_IDENTITY,
                        String.valueOf(invitation.getId()),
                        phoneHash);
        if (recent.isPresent()) {
            PhoneOtpAttempt last = recent.get();
            if (PhoneOtpAttempt.STATUS_FAILED.equals(last.getStatus())
                    && last.getCreatedAt() != null) {
                LocalDateTime unlockAt = last.getCreatedAt()
                        .plusMinutes(otpSettings.lockMinutes(tenantId));
                if (unlockAt.isAfter(LocalDateTime.now())) {
                    throw new SctOtpLockedException(SctConstants.MSG_OTP_LOCKED,
                            Math.max(1L, Duration.between(LocalDateTime.now(), unlockAt).getSeconds()));
                }
            }
            long elapsed = Duration.between(last.getCreatedAt(), LocalDateTime.now()).getSeconds();
            if (elapsed < cooldown) {
                throw new SctOtpRateLimitedException(SctConstants.MSG_OTP_RATE_LIMITED,
                        Math.max(1L, cooldown - elapsed));
            }
        }

        int ttlSeconds = otpSettings.ttlSeconds(tenantId);
        boolean matched = invitation.getTargetPhoneHash() != null
                && piiHmacService.matches(normalizedPhone, invitation.getTargetPhoneHash());

        rateLimiter.recordAttempt(inviteKey);
        rateLimiter.recordAttempt(phoneKey);
        rateLimiter.recordAttempt(ipKey);

        if (!matched) {
            padTiming(otpSettings.timingPadMs(tenantId));
            log.info("SCT identity OTP send disguised: invitationId={}, phone={}",
                    invitation.getId(), PhoneLogMasking.maskForLog(normalizedPhone));
            return acceptedResponse(normalizedPhone, ttlSeconds, cooldown);
        }

        String otpCode = dispatchOtpCode(normalizedPhone, otpSettings.codeLength(tenantId));
        if (!StringUtils.hasText(otpCode)) {
            throw new SctOtpRateLimitedException(SctConstants.MSG_OTP_RATE_LIMITED);
        }

        LocalDateTime now = LocalDateTime.now();
        PhoneOtpAttempt row = PhoneOtpAttempt.builder()
                .tenantId(tenantId)
                .provider(PhoneOtpAttempt.PROVIDER_SCT_IDENTITY)
                .providerUserId(String.valueOf(invitation.getId()))
                .phoneHash(phoneHash)
                .codeHash(passwordService.encodeSecret(otpCode))
                .attempts(0)
                .dailyCount((int) inviteDb + 1)
                .status(PhoneOtpAttempt.STATUS_PENDING)
                .createdAt(now)
                .expiresAt(now.plusSeconds(ttlSeconds))
                .build();
        phoneOtpAttemptRepository.saveAndFlush(row);

        SctIdentityOtpDevCodeStore store = devCodeStore.getIfAvailable();
        if (store != null) {
            store.remember(tenantId, invitation.getId(), otpCode);
        }

        log.info("SCT identity OTP sent: invitationId={}, phone={}",
                invitation.getId(), PhoneLogMasking.maskForLog(normalizedPhone));
        return acceptedResponse(normalizedPhone, ttlSeconds, cooldown);
    }

    @Override
    @Transactional
    public SctVerifyResponse confirmOtp(
            String rawToken, SctIdentityOtpConfirmRequest request, String clientIp) {
        SctInvitation invitation = loadForWrite(rawToken);
        bindTenantAndGuard(invitation);
        assertWritableOrVerify(invitation);
        assertHasIdentityContactConsent(invitation);
        assertPhoneChannel(invitation);
        assertNotVerifyLocked(invitation);

        String normalizedPhone;
        try {
            normalizedPhone = LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms(
                    request == null ? null : request.getPhone());
        } catch (IllegalArgumentException ex) {
            throw new SctOtpInvalidException(SctConstants.MSG_OTP_INVALID);
        }
        String code = request == null ? null : request.getCode();
        if (!StringUtils.hasText(code) || !code.trim().matches("\\d+")) {
            throw new SctOtpInvalidException(SctConstants.MSG_OTP_INVALID);
        }
        code = code.trim();

        String tenantId = invitation.getTenantId();
        String phoneHash = piiHmacService.hmacHex(normalizedPhone);
        if (invitation.getTargetPhoneHash() == null
                || !piiHmacService.matches(normalizedPhone, invitation.getTargetPhoneHash())) {
            recordAccessAttempt(invitation, false, clientIp);
            throw new SctOtpInvalidException(SctConstants.MSG_OTP_INVALID);
        }

        Optional<PhoneOtpAttempt> rowOpt = findLatestSctOtpAttempt(
                tenantId, invitation.getId(), normalizedPhone);
        if (rowOpt.isEmpty()) {
            throw new SctOtpInvalidException(SctConstants.MSG_OTP_INVALID);
        }
        PhoneOtpAttempt row = rowOpt.get();
        if (PhoneOtpAttempt.STATUS_FAILED.equals(row.getStatus())) {
            throw new SctOtpLockedException(SctConstants.MSG_OTP_LOCKED);
        }
        if (PhoneOtpAttempt.STATUS_VERIFIED.equals(row.getStatus())
                || PhoneOtpAttempt.STATUS_CONSUMED.equals(row.getStatus())) {
            throw new SctOtpInvalidException(SctConstants.MSG_OTP_INVALID);
        }
        if (!PhoneOtpAttempt.STATUS_PENDING.equals(row.getStatus())) {
            throw new SctOtpInvalidException(SctConstants.MSG_OTP_INVALID);
        }
        if (row.getExpiresAt() != null && row.getExpiresAt().isBefore(LocalDateTime.now())) {
            row.setStatus(PhoneOtpAttempt.STATUS_EXPIRED);
            phoneOtpAttemptRepository.save(row);
            throw new SctOtpExpiredException(SctConstants.MSG_OTP_EXPIRED);
        }

        int maxAttempts = otpSettings.maxAttempts(tenantId);
        int attempts = row.getAttempts() == null ? 0 : row.getAttempts();
        if (attempts >= maxAttempts) {
            attemptRecorder.markFailedIfMaxed(row.getId(), tenantId, maxAttempts);
            throw new SctOtpLockedException(SctConstants.MSG_OTP_LOCKED);
        }

        boolean matches = passwordService.matches(code, row.getCodeHash());
        if (!matches) {
            SctIdentityOtpAttemptRecorder.WrongAttemptResult recorded =
                    attemptRecorder.recordWrongAttempt(row.getId(), tenantId, maxAttempts);
            recordAccessAttempt(invitation, false, clientIp);
            if (recorded.locked()) {
                throw new SctOtpLockedException(SctConstants.MSG_OTP_LOCKED);
            }
            throw new SctOtpInvalidException(SctConstants.MSG_OTP_INVALID);
        }

        row.setAttempts(attempts + 1);
        row.setStatus(PhoneOtpAttempt.STATUS_VERIFIED);
        row.setVerifiedAt(LocalDateTime.now());
        phoneOtpAttemptRepository.save(row);
        recordAccessAttempt(invitation, true, clientIp);

        invitation.setVerifyFailCount(0);
        invitation.setVerifyLockedUntil(null);
        if (invitation.getLinkOpenedAt() == null) {
            invitation.setLinkOpenedAt(LocalDateTime.now());
        }
        invitationRepository.save(invitation);

        String sessionId = verifySessionStore.issue(
                invitation.getId(),
                invitation.getTenantId(),
                absoluteExpiry(invitation));
        SctFormTemplate template = requireTemplate(invitation.getFormTemplateId());
        SctConsentStatusView consent = sctConsentService.resolveStatus(invitation, template.getFormType());
        return SctVerifyResponse.builder()
                .verifySessionId(sessionId)
                .expiresInSeconds(verifySessionStore.remainingSeconds(absoluteExpiry(invitation)))
                .consent(consent)
                .deviceCookieRef(SctDeviceSessionCookieSupport.refFor(
                        invitation.getTenantId(), invitation.getId()))
                .build();
    }

    /**
     * testMode 에서는 {@link SmsAuthService#sendVerificationCode} 가 평문 코드를 로그하므로 우회.
     * 실발송 모드에서만 sendVerificationCode 사용.
     *
     * @param normalizedPhone 정규화 번호
     * @param codeLength      자릿수
     * @return OTP 평문(저장용) 또는 null
     */
    private String dispatchOtpCode(String normalizedPhone, int codeLength) {
        if (smsAuthService.isTestMode()) {
            String code = generateNumericCode(codeLength);
            boolean ok = smsAuthService.sendConfidentialNotificationMessage(
                    normalizedPhone,
                    "[SCT] 인증번호 발송(테스트 모드·본문 비로그)");
            if (!ok) {
                log.warn("SCT identity OTP testMode notify gate failed: phone={}",
                        PhoneLogMasking.maskForLog(normalizedPhone));
            }
            log.info("SCT identity OTP testMode accepted: phone={}",
                    PhoneLogMasking.maskForLog(normalizedPhone));
            return code;
        }
        String code = smsAuthService.sendVerificationCode(normalizedPhone);
        if (!StringUtils.hasText(code) && codeLength > 0 && codeLength != 6) {
            // sendVerificationCode 가 고정 6자리일 수 있어 길이 설정과 다르면 로컬 생성 후 confidential 발송
            code = generateNumericCode(codeLength);
            boolean sent = smsAuthService.sendConfidentialNotificationMessage(
                    normalizedPhone, buildOtpMessage(code));
            return sent ? code : null;
        }
        return code;
    }

    private String buildOtpMessage(String code) {
        return "인증번호는 " + code + "입니다.";
    }

    private static String generateNumericCode(int length) {
        int len = Math.max(4, Math.min(length, 10));
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(CODE_DIGITS.charAt(SECURE_RANDOM.nextInt(CODE_DIGITS.length())));
        }
        return sb.toString();
    }

    private SctIdentityOtpSendResponse acceptedResponse(
            String normalizedPhone, int ttlSeconds, int cooldown) {
        return SctIdentityOtpSendResponse.builder()
                .accepted(true)
                .maskedPhone(maskKoreanMobile(normalizedPhone))
                .expiresInSeconds(ttlSeconds)
                .resendCooldownSeconds(cooldown)
                .build();
    }

    private static String maskKoreanMobile(String normalized) {
        if (!StringUtils.hasText(normalized) || normalized.length() < 8) {
            return normalized;
        }
        return normalized.substring(0, 3) + "-****-" + normalized.substring(normalized.length() - 4);
    }

    private static void padTiming(int padMs) {
        if (padMs <= 0) {
            return;
        }
        try {
            Thread.sleep(padMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static String inviteBucket(String tenantId, Long invitationId) {
        return "invite:" + tenantId + ":" + invitationId;
    }

    private void recordAccessAttempt(SctInvitation invitation, boolean success, String clientIp) {
        String ipHash = piiHmacService.hmacHex(clientIp == null ? "unknown" : clientIp);
        attemptRepository.save(SctInviteAccessAttempt.builder()
                .tenantId(invitation.getTenantId())
                .invitationId(invitation.getId())
                .success(success)
                .ipHash(ipHash)
                .build());
    }

    private SctInvitation loadForWrite(String rawToken) {
        return publicTokenResolver.loadInvitationForVerify(rawToken);
    }

    /**
     * 시간당 한도 초과 시 다시 시도 가능해질 때까지 남은 초(한도 아래로 내려가는 시점의 row 기준).
     */
    private static long retryAfterFromRows(java.util.List<PhoneOtpAttempt> rowsAsc, int limit) {
        int index = rowsAsc.size() - limit;
        if (index < 0 || limit <= 0) {
            return 0L;
        }
        LocalDateTime createdAt = rowsAsc.get(index).getCreatedAt();
        if (createdAt == null) {
            return 0L;
        }
        return Math.max(1L, Duration.between(LocalDateTime.now(), createdAt.plusHours(1)).getSeconds());
    }

    private Optional<PhoneOtpAttempt> findLatestSctOtpAttempt(
            String tenantId, Long invitationId, String normalizedPhone) {
        for (String phoneHash : piiHmacService.lookupCandidates(normalizedPhone)) {
            Optional<PhoneOtpAttempt> found = phoneOtpAttemptRepository
                .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                    tenantId,
                    PhoneOtpAttempt.PROVIDER_SCT_IDENTITY,
                    String.valueOf(invitationId),
                    phoneHash);
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }

    private void bindTenantAndGuard(SctInvitation invitation) {
        TenantContextHolder.setTenantId(invitation.getTenantId());
        sctFeatureGuard.requireEnabled(invitation.getTenantId());
        refreshExpired(invitation);
        assertOnlineFormType(invitation);
    }

    private void assertOnlineFormType(SctInvitation invitation) {
        formTemplateRepository.findByIdAndIsDeletedFalse(invitation.getFormTemplateId())
                .ifPresent(template -> {
                    if (SctFormType.CHILD.name().equals(template.getFormType())) {
                        throw new IllegalArgumentException(
                                SctConstants.MSG_CHILD_ONLINE_UNSUPPORTED);
                    }
                });
    }

    private void refreshExpired(SctInvitation invitation) {
        if (invitation.getTokenExpiresAt() != null
                && invitation.getTokenExpiresAt().isBefore(LocalDateTime.now())
                && (SctInviteStatus.SENT.name().equals(invitation.getStatus())
                || SctInviteStatus.DRAFT.name().equals(invitation.getStatus()))) {
            invitation.setStatus(SctInviteStatus.EXPIRED.name());
            invitationRepository.save(invitation);
        }
    }

    private void assertWritableOrVerify(SctInvitation invitation) {
        if (SctInviteStatus.EXPIRED.name().equals(invitation.getStatus())
                || SctInviteStatus.CANCELLED.name().equals(invitation.getStatus())) {
            throw SctGoneException.forInvitationStatus(invitation.getStatus());
        }
        if (SctInviteStatus.SUBMITTED.name().equals(invitation.getStatus())) {
            throw new SctConflictException("이미 제출된 질문지입니다.");
        }
    }

    private void assertHasIdentityContactConsent(SctInvitation invitation) {
        if (!sctConsentService.hasIdentityContactConsent(invitation)) {
            throw new SctIdentityContactConsentRequiredException(
                    SctConstants.MSG_IDENTITY_CONTACT_CONSENT_REQUIRED);
        }
    }

    private void assertPhoneChannel(SctInvitation invitation) {
        if (!StringUtils.hasText(invitation.getTargetPhoneHash())) {
            throw new SctOtpInvalidException(SctConstants.MSG_OTP_INVALID);
        }
    }

    private void assertNotVerifyLocked(SctInvitation invitation) {
        if (invitation.getVerifyLockedUntil() != null
                && invitation.getVerifyLockedUntil().isAfter(LocalDateTime.now())) {
            throw new SctVerifyLockedException("검증이 잠겼습니다. 잠시 후 다시 시도하세요.");
        }
    }

    private Instant absoluteExpiry(SctInvitation invitation) {
        LocalDateTime expires = invitation.getTokenExpiresAt();
        if (expires == null) {
            // 절대 만료가 없으면 세션을 발급·승인하지 않는다(fail-closed, 임의 기본 수명 금지).
            return null;
        }
        return expires.atZone(TOKEN_EXPIRY_ZONE).toInstant();
    }

    private SctFormTemplate requireTemplate(Long id) {
        return formTemplateRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("양식을 찾을 수 없습니다."));
    }
}
