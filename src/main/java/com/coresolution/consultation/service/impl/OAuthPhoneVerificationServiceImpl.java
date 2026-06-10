package com.coresolution.consultation.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.SocialUserInfo;
import com.coresolution.consultation.dto.auth.OAuthPhoneOtpChallengeClaims;
import com.coresolution.consultation.dto.auth.OAuthPhoneSendRequest;
import com.coresolution.consultation.dto.auth.OAuthPhoneSendResponse;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerificationClaims;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerifyRequest;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerifyResponse;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSocialAccount;
import com.coresolution.consultation.entity.auth.OAuthProvider;
import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.OAuthPhoneVerificationService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.context.TenantContext;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * {@link OAuthPhoneVerificationService} 구현체 — Apple SIWA P1
 * ({@code ApplePhoneVerificationServiceImpl}) 의 provider-agnostic 일반화 버전.
 *
 * <p>본 서비스는 4 종 OAuth provider (Apple/Google/Kakao/Naver) 의 휴대폰 OTP 흐름을 공통 처리한다.
 * Apple 전용 alias 엔드포인트({@code /api/v1/auth/oauth/apple/phone/*}) 는 기존
 * {@link com.coresolution.consultation.service.ApplePhoneVerificationService} 가 그대로 처리하여
 * FE PR #161 호환성을 보존한다.</p>
 *
 * <p>운영 정책 (Apple SIWA P1 와 동일):
 * <ul>
 *   <li>SMS Provider = Solapi</li>
 *   <li>JWT phoneVerificationToken + DB 시도카운터 테이블 조합</li>
 *   <li>재발송 쿨다운 1분 / 일 5회 / 검증 시도 5회</li>
 *   <li>OTP TTL: 3분 (PhoneOtpAttempt.EXPIRY_MINUTES)</li>
 * </ul>
 * </p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OAuthPhoneVerificationServiceImpl implements OAuthPhoneVerificationService {

    /** 휴대폰 매칭 시 역할 혼재 판정에 사용하는 역할 집합. */
    private static final Set<UserRole> PHONE_ACCOUNT_SELECTION_ROLES =
        Collections.unmodifiableSet(EnumSet.of(UserRole.ADMIN, UserRole.CONSULTANT, UserRole.STAFF,
            UserRole.CLIENT));

    /** 결정적 phone_hash 계산을 위해 사용하는 알고리즘. */
    private static final String PHONE_HASH_ALGORITHM = "SHA-256";

    /** 신규 가입 user_id 접두어 — Apple 패턴 일반화. */
    private static final String OAUTH_USER_ID_PREFIX = "oauth_";

    /** providerUserId 의 일부만 user_id 에 사용 (50자 컬럼 한계 + 가독성). */
    private static final int OAUTH_USER_ID_SUB_LENGTH = 16;

    /** KST 기준으로 일 5회 한도 윈도우를 계산하기 위한 ZoneId. */
    private static final ZoneId KST_ZONE = ZoneId.of("Asia/Seoul");

    /** 실패 응답 code 상수 — 디자이너 산출물 §3 인터랙션 시퀀스 기준. */
    private static final String CODE_TOKEN_EXPIRED = "TOKEN_EXPIRED";
    private static final String CODE_OTP_INVALID = "OTP_INVALID";
    private static final String CODE_OTP_EXPIRED = "OTP_EXPIRED";
    private static final String CODE_DAILY_LIMIT = "DAILY_LIMIT_EXCEEDED";
    private static final String CODE_COOLDOWN = "RESEND_COOLDOWN";
    private static final String CODE_INVALID_REQUEST = "INVALID_REQUEST";
    private static final String CODE_PROVIDER_MISMATCH = "PROVIDER_MISMATCH";
    private static final String CODE_SEND_FAILED = "SEND_FAILED";

    private final PhoneOtpAttemptRepository phoneOtpAttemptRepository;
    private final SmsAuthService smsAuthService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final UserSocialAccountRepository userSocialAccountRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final PasswordService passwordService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OAuthPhoneSendResponse sendOtp(OAuthPhoneSendRequest request) {
        if (request == null || request.getOauthProvider() == null
                || !StringUtils.hasText(request.getPhoneVerificationToken())
                || !StringUtils.hasText(request.getPhone())) {
            return sendFailure("필수 값이 누락됐습니다.", CODE_INVALID_REQUEST);
        }
        OAuthPhoneVerificationClaims claims;
        try {
            claims = jwtService.parseOAuthPhoneVerificationToken(request.getPhoneVerificationToken());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("OAuth phone send: phoneVerificationToken 검증 실패 cause={}", e.getMessage());
            return sendFailure("인증 세션이 만료됐습니다. 로그인 화면에서 다시 시도해 주세요.", CODE_TOKEN_EXPIRED);
        }
        if (claims.getOauthProvider() != request.getOauthProvider()) {
            log.warn("OAuth phone send: provider 불일치 token={}, request={}",
                claims.getOauthProvider(), request.getOauthProvider());
            return sendFailure("인증 세션과 provider 가 일치하지 않습니다.", CODE_PROVIDER_MISMATCH);
        }

        String normalizedPhone;
        try {
            normalizedPhone = LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms(request.getPhone());
        } catch (IllegalArgumentException e) {
            return sendFailure(e.getMessage(), CODE_INVALID_REQUEST);
        }

        String tenantId = claims.getTenantId();
        String providerName = claims.getOauthProvider().name();
        String providerUserId = claims.getProviderUserId();
        String phoneHash = sha256Hex(normalizedPhone);

        Optional<PhoneOtpAttempt> recent = phoneOtpAttemptRepository
            .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                tenantId, providerName, providerUserId, phoneHash);
        LocalDateTime now = LocalDateTime.now();
        if (recent.isPresent()) {
            PhoneOtpAttempt last = recent.get();
            long elapsed = Duration.between(last.getCreatedAt(), now).getSeconds();
            if (elapsed < PhoneOtpAttempt.RESEND_COOLDOWN_SECONDS) {
                long retryAfter = PhoneOtpAttempt.RESEND_COOLDOWN_SECONDS - elapsed;
                log.info("OAuth OTP 재발송 쿨다운 중: provider={}, sub={}, phone={}, retryAfter={}s",
                    providerName, providerUserId, PhoneLogMasking.maskForLog(normalizedPhone), retryAfter);
                return OAuthPhoneSendResponse.builder()
                    .success(false)
                    .code(CODE_COOLDOWN)
                    .message("잠시 후 다시 시도해 주세요.")
                    .retryAfterSeconds(retryAfter)
                    .resendCooldownSeconds(PhoneOtpAttempt.RESEND_COOLDOWN_SECONDS)
                    .maskedPhone(maskKoreanMobile(normalizedPhone))
                    .build();
            }
        }

        LocalDateTime startOfToday = LocalDate.now(KST_ZONE)
            .atStartOfDay(KST_ZONE).toLocalDateTime();
        long dailyCount = phoneOtpAttemptRepository
            .countByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqual(
                tenantId, providerName, providerUserId, startOfToday);
        if (dailyCount >= PhoneOtpAttempt.MAX_DAILY_COUNT) {
            log.warn("OAuth OTP 일 한도 초과: provider={}, sub={}, phone={}, dailyCount={}",
                providerName, providerUserId, PhoneLogMasking.maskForLog(normalizedPhone), dailyCount);
            return sendFailure("오늘 인증번호 발송 한도를 초과했습니다. 내일 다시 시도해 주세요.", CODE_DAILY_LIMIT);
        }

        String otpCode;
        try {
            otpCode = smsAuthService.sendVerificationCode(normalizedPhone);
        } catch (IllegalArgumentException e) {
            return sendFailure(e.getMessage(), CODE_SEND_FAILED);
        }
        if (!StringUtils.hasText(otpCode)) {
            return sendFailure("인증번호 발송에 실패했습니다. SMS 설정을 확인해 주세요.", CODE_SEND_FAILED);
        }

        PhoneOtpAttempt row = PhoneOtpAttempt.builder()
            .tenantId(tenantId)
            .provider(providerName)
            .providerUserId(providerUserId)
            .phoneHash(phoneHash)
            .codeHash(passwordService.encodeSecret(otpCode))
            .attempts(0)
            .dailyCount((int) (dailyCount + 1))
            .status(PhoneOtpAttempt.STATUS_PENDING)
            .createdAt(now)
            .expiresAt(now.plusMinutes(PhoneOtpAttempt.EXPIRY_MINUTES))
            .build();
        PhoneOtpAttempt saved = phoneOtpAttemptRepository.saveAndFlush(row);

        String challengeToken = jwtService.generateOAuthPhoneOtpChallengeToken(
            OAuthPhoneOtpChallengeClaims.builder()
                .tenantId(tenantId)
                .oauthProvider(claims.getOauthProvider())
                .providerUserId(providerUserId)
                .phoneHash(phoneHash)
                .normalizedPhone(normalizedPhone)
                .otpId(saved.getId())
                .build());

        log.info("OAuth OTP 발송 성공: provider={}, sub={}, phone={}, otpId={}",
            providerName, providerUserId, PhoneLogMasking.maskForLog(normalizedPhone), saved.getId());
        return OAuthPhoneSendResponse.builder()
            .success(true)
            .message("인증번호를 전송했습니다.")
            .challengeToken(challengeToken)
            .expiresInSeconds(Duration.ofMinutes(PhoneOtpAttempt.EXPIRY_MINUTES).getSeconds())
            .resendCooldownSeconds(PhoneOtpAttempt.RESEND_COOLDOWN_SECONDS)
            .maskedPhone(maskKoreanMobile(normalizedPhone))
            .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OAuthPhoneVerifyResponse verifyOtp(OAuthPhoneVerifyRequest request) {
        if (request == null
                || request.getOauthProvider() == null
                || !StringUtils.hasText(request.getPhoneVerificationToken())
                || !StringUtils.hasText(request.getChallengeToken())
                || !StringUtils.hasText(request.getOtpCode())) {
            return verifyFailure("필수 값이 누락됐습니다.", CODE_INVALID_REQUEST);
        }

        OAuthPhoneVerificationClaims phoneVerificationClaims;
        OAuthPhoneOtpChallengeClaims challengeClaims;
        try {
            phoneVerificationClaims = jwtService.parseOAuthPhoneVerificationToken(
                request.getPhoneVerificationToken());
            challengeClaims = jwtService.parseOAuthPhoneOtpChallengeToken(request.getChallengeToken());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("OAuth verify: 토큰 검증 실패 cause={}", e.getMessage());
            return verifyFailure("인증 세션이 만료됐습니다. 로그인 화면에서 다시 시도해 주세요.", CODE_TOKEN_EXPIRED);
        }
        if (phoneVerificationClaims.getOauthProvider() != request.getOauthProvider()
                || challengeClaims.getOauthProvider() != request.getOauthProvider()) {
            log.warn("OAuth verify: provider 불일치 phoneVerification={}, challenge={}, request={}",
                phoneVerificationClaims.getOauthProvider(), challengeClaims.getOauthProvider(),
                request.getOauthProvider());
            return verifyFailure("인증 세션과 provider 가 일치하지 않습니다.", CODE_PROVIDER_MISMATCH);
        }
        if (!phoneVerificationClaims.getProviderUserId().equals(challengeClaims.getProviderUserId())) {
            log.warn("OAuth verify: provider sub 불일치");
            return verifyFailure("인증 세션이 일치하지 않습니다.", CODE_PROVIDER_MISMATCH);
        }
        if (!phoneVerificationClaims.getTenantId().equals(challengeClaims.getTenantId())) {
            log.warn("OAuth verify: tenantId 불일치");
            return verifyFailure("인증 세션이 일치하지 않습니다.", CODE_PROVIDER_MISMATCH);
        }

        Optional<PhoneOtpAttempt> rowOpt = phoneOtpAttemptRepository
            .findByIdAndTenantIdAndStatus(challengeClaims.getOtpId(), challengeClaims.getTenantId(),
                PhoneOtpAttempt.STATUS_PENDING);
        if (rowOpt.isEmpty()) {
            return verifyFailure("이미 사용했거나 만료된 인증 요청입니다. 인증번호를 다시 받아 주세요.", CODE_OTP_EXPIRED);
        }
        PhoneOtpAttempt row = rowOpt.get();
        if (!row.getPhoneHash().equals(challengeClaims.getPhoneHash())) {
            log.warn("OAuth verify: phoneHash 불일치 — challenge 위변조 의심 otpId={}", row.getId());
            row.setStatus(PhoneOtpAttempt.STATUS_FAILED);
            phoneOtpAttemptRepository.save(row);
            return verifyFailure("인증 요청이 일치하지 않습니다. 다시 시도해 주세요.", CODE_OTP_INVALID);
        }
        if (row.getExpiresAt().isBefore(LocalDateTime.now())) {
            row.setStatus(PhoneOtpAttempt.STATUS_EXPIRED);
            phoneOtpAttemptRepository.save(row);
            return verifyFailure("인증번호가 만료됐습니다. 다시 받아 주세요.", CODE_OTP_EXPIRED);
        }

        row.setAttempts(row.getAttempts() == null ? 1 : row.getAttempts() + 1);
        if (row.getAttempts() > PhoneOtpAttempt.MAX_ATTEMPTS) {
            row.setStatus(PhoneOtpAttempt.STATUS_FAILED);
            phoneOtpAttemptRepository.save(row);
            log.warn("OAuth verify: 시도 횟수 초과 otpId={}, attempts={}", row.getId(), row.getAttempts());
            return verifyFailure("인증 시도 횟수를 초과했습니다. 인증번호를 다시 받아 주세요.", CODE_OTP_INVALID);
        }

        boolean matches = passwordEncoder.matches(request.getOtpCode(), row.getCodeHash());
        if (!matches) {
            phoneOtpAttemptRepository.save(row);
            if (row.getAttempts() >= PhoneOtpAttempt.MAX_ATTEMPTS) {
                row.setStatus(PhoneOtpAttempt.STATUS_FAILED);
                phoneOtpAttemptRepository.save(row);
                return verifyFailure("인증 시도 횟수를 초과했습니다. 인증번호를 다시 받아 주세요.", CODE_OTP_INVALID);
            }
            return verifyFailure("인증번호가 일치하지 않습니다.", CODE_OTP_INVALID);
        }
        row.setStatus(PhoneOtpAttempt.STATUS_VERIFIED);
        row.setVerifiedAt(LocalDateTime.now());
        phoneOtpAttemptRepository.save(row);

        return resolveAfterOtpVerified(phoneVerificationClaims, challengeClaims, row);
    }

    /**
     * OTP 검증 성공 후 휴대폰 매칭 + JWT 발급 (또는 계정 선택 토큰 발급, 또는 신규 가입).
     *
     * <p>2026-06-10 P1: 신규 가입·기존 사용자 연결 모두에서 OAuth 프로필(name/profileImageUrl) 및
     * 검증된 phone 을 user 엔티티에 백필하기 위해 {@code challengeClaims.normalizedPhone} 을 함께 전달한다.</p>
     */
    private OAuthPhoneVerifyResponse resolveAfterOtpVerified(OAuthPhoneVerificationClaims claims,
                                                             OAuthPhoneOtpChallengeClaims challengeClaims,
                                                             PhoneOtpAttempt row) {
        String tenantId = claims.getTenantId();
        String previousTenantId = TenantContextHolder.peekTenantId();
        try {
            TenantContext.setTenantId(tenantId);
            return resolveAndIssueJwt(tenantId, claims, row.getPhoneHash(),
                challengeClaims.getNormalizedPhone());
        } finally {
            TenantContextHolder.setTenantIdOrClear(previousTenantId);
        }
    }

    private OAuthPhoneVerifyResponse resolveAndIssueJwt(String tenantId,
                                                        OAuthPhoneVerificationClaims claims,
                                                        String phoneHash,
                                                        String verifiedNormalizedPhone) {
        OAuthProvider provider = claims.getOauthProvider();
        String providerName = provider.name();
        String providerUserId = claims.getProviderUserId();

        List<User> candidates = findCandidateUsersByPhoneHash(tenantId, phoneHash);
        log.info("OAuth phone match: tenantId={}, provider={}, sub={}, candidates={}",
            tenantId, providerName, providerUserId, candidates.size());

        if (candidates.isEmpty()) {
            User created = createNewOAuthUser(tenantId, claims, verifiedNormalizedPhone);
            return issueTokens(created, "휴대폰 인증 완료 — 신규 가입");
        }
        if (candidates.size() == 1) {
            User matched = candidates.get(0);
            linkSocialAccount(matched, claims, tenantId);
            return issueTokens(matched, "휴대폰 인증 완료 — 기존 계정 연결");
        }

        long distinctRoles = candidates.stream()
            .map(User::getRole)
            .filter(r -> r != null && PHONE_ACCOUNT_SELECTION_ROLES.contains(r))
            .distinct()
            .count();
        if (distinctRoles >= 2) {
            List<Long> ids = candidates.stream().map(User::getId).collect(Collectors.toList());
            SocialUserInfo socialUserInfo = SocialUserInfo.builder()
                .provider(providerName)
                .providerUserId(providerUserId)
                .email(claims.getEmail())
                .name(claims.getName())
                .nickname(claims.getNickname())
                .build();
            String selectionToken = jwtService.generateOAuthPhoneAccountSelectionToken(
                tenantId, providerName, providerUserId, ids, socialUserInfo);
            return OAuthPhoneVerifyResponse.builder()
                .success(true)
                .requiresPhoneAccountSelection(true)
                .phoneAccountSelectionToken(selectionToken)
                .message("동일 전화번호에 여러 역할이 있어 계정을 선택해 주세요.")
                .build();
        }

        User selected = selectBestMatchingUser(candidates);
        linkSocialAccount(selected, claims, tenantId);
        return issueTokens(selected, "휴대폰 인증 완료 — 기존 계정 연결");
    }

    private List<User> findCandidateUsersByPhoneHash(String tenantId, String phoneHash) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(phoneHash)) {
            return Collections.emptyList();
        }
        List<User> tenantUsers = userRepository.findByTenantId(tenantId);
        return tenantUsers.stream()
            .filter(u -> phoneHash.equals(hashUserPhoneIfPresent(u)))
            .collect(Collectors.toList());
    }

    private String hashUserPhoneIfPresent(User user) {
        String enc = user.getPhone();
        if (!StringUtils.hasText(enc)) {
            return null;
        }
        String plain;
        try {
            plain = encryptionUtil.safeDecrypt(enc);
        } catch (Exception e) {
            return null;
        }
        if (!StringUtils.hasText(plain)) {
            return null;
        }
        String normalized = LoginIdentifierUtils.normalizeKoreanMobileDigits(plain.trim());
        if (!LoginIdentifierUtils.isValidKoreanMobileDigits(normalized)) {
            return null;
        }
        return sha256Hex(normalized);
    }

    private User selectBestMatchingUser(List<User> users) {
        if (users == null || users.isEmpty()) {
            return null;
        }
        if (users.size() == 1) {
            return users.get(0);
        }
        List<User> active = users.stream()
            .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
            .collect(Collectors.toList());
        List<User> pool = active.isEmpty() ? users : active;
        pool.sort((a, b) -> {
            int p1 = rolePriority(a.getRole());
            int p2 = rolePriority(b.getRole());
            if (p1 != p2) {
                return Integer.compare(p1, p2);
            }
            if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            }
            return 0;
        });
        return pool.get(0);
    }

    private int rolePriority(UserRole role) {
        if (role == null) {
            return 999;
        }
        switch (role) {
            case ADMIN: return 1;
            case CONSULTANT:
            case PLAY_THERAPIST:
            case SPEECH_THERAPIST:
                return 2;
            case STAFF: return 3;
            case CLIENT: return 4;
            default: return 999;
        }
    }

    /**
     * 기존 user 에 OAuth 계정 연결. provider 별 필드(apple_sub / social_provider*) 갱신
     * + user_social_accounts row 보장 + OAuth 프로필(name/profileImageUrl) 백필.
     *
     * <p>2026-06-10 P1: 어드민 사전 등록(휴대폰만 입력)으로 user.name 이 비어 있는 사용자가 OAuth 첫
     * 로그인 시 OTP 매칭으로 본 메서드에 진입할 때, OAuth provider 가 제공한 name/profileImageUrl 을
     * user 엔티티에 백필한다. 기존 값이 있으면 덮어쓰지 않는다 (사용자가 직접 수정한 값을 보존).</p>
     */
    private void linkSocialAccount(User user, OAuthPhoneVerificationClaims claims, String tenantId) {
        OAuthProvider provider = claims.getOauthProvider();
        String providerName = provider.name();
        String providerUserId = claims.getProviderUserId();
        boolean userDirty = false;
        if (provider == OAuthProvider.APPLE
                && (user.getAppleSub() == null || !providerUserId.equals(user.getAppleSub()))) {
            user.setAppleSub(providerUserId);
            userDirty = true;
        }
        if (!StringUtils.hasText(user.getSocialProvider())) {
            user.setSocialProvider(providerName);
            user.setSocialProviderUserId(providerUserId);
            user.setIsSocialAccount(Boolean.TRUE);
            user.setSocialLinkedAt(LocalDateTime.now());
            userDirty = true;
        }
        if (backfillUserNameFromClaims(user, claims)) {
            userDirty = true;
        }
        if (backfillUserProfileImageFromClaims(user, claims)) {
            userDirty = true;
        }
        if (userDirty) {
            userRepository.saveAndFlush(user);
        }

        String userTenantId = StringUtils.hasText(user.getTenantId()) ? user.getTenantId() : tenantId;
        Optional<UserSocialAccount> existing = userSocialAccountRepository
            .findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(userTenantId, providerName, providerUserId);
        UserSocialAccount account = existing.orElseGet(() -> {
            UserSocialAccount built = UserSocialAccount.builder()
                .user(user)
                .provider(providerName)
                .providerUserId(providerUserId)
                .providerEmail(claims.getEmail())
                .providerName(claims.getName())
                .isPrimary(Boolean.FALSE)
                .isVerified(Boolean.TRUE)
                .isActive(Boolean.TRUE)
                .verificationDate(LocalDateTime.now())
                .verificationMethod(providerName)
                .build();
            built.setTenantId(userTenantId);
            return built;
        });
        Integer loginCount = account.getLoginCount();
        account.setLoginCount(loginCount == null ? 1 : loginCount + 1);
        account.setLastLoginAt(LocalDateTime.now());
        userSocialAccountRepository.save(account);
    }

    /**
     * 매칭 0 분기: 신규 사용자 생성 (role=CLIENT) — provider 별 default 값으로 가입.
     *
     * <p>2026-06-10 P1: provider 가 제공한 프로필 이미지(claims.profileImageUrl) 및 OTP 로 본인검증
     * 완료된 휴대폰(verifiedNormalizedPhone) 도 함께 user 엔티티에 저장한다. 프로필 이미지는 평문 URL,
     * 휴대폰은 PII 표준대로 암호화한다. {@code verifiedNormalizedPhone} 이 비어 있으면 phone 미저장.</p>
     */
    private User createNewOAuthUser(String tenantId, OAuthPhoneVerificationClaims claims,
                                    String verifiedNormalizedPhone) {
        OAuthProvider provider = claims.getOauthProvider();
        String providerName = provider.name();
        String providerUserId = claims.getProviderUserId();

        String suffix = providerUserId.length() > OAUTH_USER_ID_SUB_LENGTH
            ? providerUserId.substring(0, OAUTH_USER_ID_SUB_LENGTH)
            : providerUserId;
        String userId = OAUTH_USER_ID_PREFIX + providerName.toLowerCase(Locale.ROOT) + "_"
            + suffix.toLowerCase(Locale.ROOT);
        String name = StringUtils.hasText(claims.getName()) ? claims.getName()
            : (providerName + " 사용자");
        String email = StringUtils.hasText(claims.getEmail()) ? claims.getEmail()
            : (userId + "@" + providerName.toLowerCase(Locale.ROOT) + ".local");
        String tempPassword = providerName + "_" + System.currentTimeMillis();

        User.UserBuilder builder = User.builder()
            .userId(userId)
            .password(passwordService.encodeSecret(tempPassword))
            .name(encryptionUtil.safeEncrypt(name))
            .email(encryptionUtil.safeEncrypt(email))
            .role(UserRole.CLIENT)
            .isSocialAccount(Boolean.TRUE)
            .socialProvider(providerName)
            .socialProviderUserId(providerUserId)
            .socialLinkedAt(LocalDateTime.now());
        if (StringUtils.hasText(claims.getProfileImageUrl())) {
            builder.profileImageUrl(claims.getProfileImageUrl());
        }
        if (StringUtils.hasText(verifiedNormalizedPhone)) {
            builder.phone(encryptionUtil.safeEncrypt(verifiedNormalizedPhone));
        }
        if (provider == OAuthProvider.APPLE) {
            builder.appleSub(providerUserId);
        }
        User user = builder.build();
        user.setTenantId(tenantId);
        User saved = userRepository.saveAndFlush(user);

        String encryptedClientPhone = StringUtils.hasText(verifiedNormalizedPhone)
            ? encryptionUtil.safeEncrypt(verifiedNormalizedPhone) : null;
        Client client = Client.builder()
            .id(saved.getId())
            .tenantId(tenantId)
            .name(saved.getName())
            .email(saved.getEmail())
            .phone(encryptedClientPhone)
            .isDeleted(false)
            .build();
        clientRepository.saveAndFlush(client);

        UserSocialAccount socialAccount = UserSocialAccount.builder()
            .user(saved)
            .provider(providerName)
            .providerUserId(providerUserId)
            .providerEmail(StringUtils.hasText(claims.getEmail()) ? claims.getEmail() : null)
            .providerName(name)
            .providerProfileImage(StringUtils.hasText(claims.getProfileImageUrl())
                ? claims.getProfileImageUrl() : null)
            .isPrimary(Boolean.TRUE)
            .isVerified(Boolean.TRUE)
            .isActive(Boolean.TRUE)
            .verificationDate(LocalDateTime.now())
            .verificationMethod(providerName)
            .build();
        socialAccount.setTenantId(tenantId);
        userSocialAccountRepository.save(socialAccount);
        return saved;
    }

    /**
     * user.name 이 비어 있고 OAuth provider 가 name 을 제공한 경우에만 백필. 기존 값은 보존한다.
     *
     * <p>{@link PersonalDataEncryptionUtil#safeDecrypt(String)} 로 복호화한 평문이 빈 문자열·공백·null
     * 이면 비어 있는 것으로 본다. 백필 시 동일 유틸로 재암호화하여 PII 저장 정책을 유지한다.</p>
     *
     * @return 실제로 user.name 을 수정했으면 true
     */
    private boolean backfillUserNameFromClaims(User user, OAuthPhoneVerificationClaims claims) {
        if (user == null || claims == null) {
            return false;
        }
        String claimName = claims.getName();
        if (!StringUtils.hasText(claimName)) {
            return false;
        }
        String currentDecrypted;
        try {
            currentDecrypted = encryptionUtil.safeDecrypt(user.getName());
        } catch (Exception e) {
            currentDecrypted = user.getName();
        }
        if (StringUtils.hasText(currentDecrypted)) {
            return false;
        }
        user.setName(encryptionUtil.safeEncrypt(claimName.trim()));
        return true;
    }

    /**
     * user.profileImageUrl 이 비어 있고 OAuth provider 가 사진 URL 을 제공한 경우에만 백필.
     *
     * @return 실제로 user.profileImageUrl 을 수정했으면 true
     */
    private boolean backfillUserProfileImageFromClaims(User user, OAuthPhoneVerificationClaims claims) {
        if (user == null || claims == null) {
            return false;
        }
        String claimUrl = claims.getProfileImageUrl();
        if (!StringUtils.hasText(claimUrl)) {
            return false;
        }
        if (StringUtils.hasText(user.getProfileImageUrl())) {
            return false;
        }
        user.setProfileImageUrl(claimUrl.trim());
        return true;
    }

    private OAuthPhoneVerifyResponse issueTokens(User user, String message) {
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        user.updateLastLogin();
        userRepository.saveAndFlush(user);
        return OAuthPhoneVerifyResponse.builder()
            .success(true)
            .message(message)
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .matchedAccount(buildMatchedAccount(user))
            .build();
    }

    /**
     * OTP 검증 직후 FE 홈/프로필 화면 표시용 user 요약을 구성한다. PII(name/email/phone) 는 복호화
     * 평문으로 내려 보내며, 표시 시 마스킹 책임은 FE 가 진다 (디자이너 산출물 §3.5 동의).
     */
    private OAuthPhoneVerifyResponse.MatchedAccount buildMatchedAccount(User user) {
        String decryptedName = decryptForResponseSafe(user.getName());
        String decryptedEmail = decryptForResponseSafe(user.getEmail());
        String decryptedPhone = decryptForResponseSafe(user.getPhone());
        String decryptedNickname = decryptForResponseSafe(user.getNickname());
        if (!StringUtils.hasText(decryptedNickname) && StringUtils.hasText(decryptedName)) {
            decryptedNickname = decryptedName;
        }
        return OAuthPhoneVerifyResponse.MatchedAccount.builder()
            .userId(user.getId())
            .tenantId(user.getTenantId())
            .role(user.getRole() != null ? user.getRole().name() : null)
            .name(decryptedName)
            .email(decryptedEmail)
            .nickname(decryptedNickname)
            .phone(decryptedPhone)
            .profileImageUrl(user.getProfileImageUrl())
            .build();
    }

    /**
     * 응답 직렬화 직전 PII 컬럼을 안전하게 복호화한다. 키 없음·평문 mixed 케이스 모두 평문을 반환하며,
     * 실패 시 빈 문자열이 아닌 null 을 반환해 응답 표시 측이 fallback 으로 분기하도록 한다.
     */
    private String decryptForResponseSafe(String encryptedOrPlain) {
        if (!StringUtils.hasText(encryptedOrPlain)) {
            return null;
        }
        try {
            String plain = encryptionUtil.safeDecrypt(encryptedOrPlain);
            return StringUtils.hasText(plain) ? plain : null;
        } catch (Exception e) {
            log.warn("OAuth verify response 복호화 실패 — 원본 미반영: cause={}", e.getMessage());
            return null;
        }
    }

    private static OAuthPhoneSendResponse sendFailure(String message, String code) {
        return OAuthPhoneSendResponse.builder()
            .success(false)
            .code(code)
            .message(message)
            .build();
    }

    private static OAuthPhoneVerifyResponse verifyFailure(String message, String code) {
        return OAuthPhoneVerifyResponse.builder()
            .success(false)
            .code(code)
            .message(message)
            .build();
    }

    /**
     * 정규화된 한국 휴대폰 digits 의 SHA-256 hex (소문자, 64자). PII 평문 저장 금지 정책 정합.
     */
    static String sha256Hex(String input) {
        if (input == null) {
            return null;
        }
        try {
            MessageDigest md = MessageDigest.getInstance(PHONE_HASH_ALGORITHM);
            byte[] bytes = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format(Locale.ROOT, "%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 미지원 — JRE 비정상", e);
        }
    }

    /**
     * 사용자 노출용 마스킹 — 디자이너 산출물 §3 (010-****-5678 패턴).
     */
    private static String maskKoreanMobile(String normalized) {
        if (!StringUtils.hasText(normalized) || normalized.length() < 8) {
            return normalized;
        }
        String prefix = normalized.substring(0, 3);
        String suffix = normalized.substring(normalized.length() - 4);
        return prefix + "-****-" + suffix;
    }
}
