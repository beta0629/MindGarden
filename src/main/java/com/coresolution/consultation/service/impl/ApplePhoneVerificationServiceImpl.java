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
import com.coresolution.consultation.dto.auth.ApplePhoneOtpChallengeClaims;
import com.coresolution.consultation.dto.auth.ApplePhoneSendRequest;
import com.coresolution.consultation.dto.auth.ApplePhoneSendResponse;
import com.coresolution.consultation.dto.auth.ApplePhoneVerificationClaims;
import com.coresolution.consultation.dto.auth.ApplePhoneVerifyRequest;
import com.coresolution.consultation.dto.auth.AppleSignInResponse;
import com.coresolution.consultation.dto.auth.AppleUserSummary;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSocialAccount;
import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import com.coresolution.consultation.service.ApplePhoneVerificationService;
import com.coresolution.consultation.service.JwtService;
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
 * {@link ApplePhoneVerificationService} 구현체.
 *
 * <p>본 서비스는 {@code AbstractOAuth2Service} 와 의도적으로 분리돼 있어 카카오/네이버 회귀 위험이 0 이다.
 * 휴대폰 매칭 로직(역할 혼재 분기 등)은 동일 정책({@code OAUTH_PHONE_ACCOUNT_SELECTION_ROLES} 와 동일 규칙)
 * 을 본 클래스 내부에서 재구현해 의존성을 최소화한다.</p>
 *
 * <p>운영 정책 (사용자 결정 2026-06-08):
 * <ul>
 *   <li>D1: SMS Provider = Solapi (알림톡 자격증명 공유)</li>
 *   <li>D2: JWT phoneVerificationToken + DB 시도카운터 테이블 조합</li>
 *   <li>D3: 재발송 쿨다운 1분 / 일 5회 / 검증 시도 5회</li>
 *   <li>OTP TTL: 3분 (PhoneOtpAttempt.EXPIRY_MINUTES)</li>
 * </ul>
 * </p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApplePhoneVerificationServiceImpl implements ApplePhoneVerificationService {

    /** 휴대폰 매칭 시 역할 혼재(2 종 이상) 판정에 사용하는 역할 집합 — AbstractOAuth2Service 와 동일. */
    private static final Set<UserRole> PHONE_ACCOUNT_SELECTION_ROLES =
        Collections.unmodifiableSet(EnumSet.of(UserRole.ADMIN, UserRole.CONSULTANT, UserRole.STAFF,
            UserRole.CLIENT));

    /** 결정적 phone_hash 계산을 위해 사용하는 알고리즘. */
    private static final String PHONE_HASH_ALGORITHM = "SHA-256";

    /** 항상 {@code APPLE}. */
    private static final String APPLE_PROVIDER = "APPLE";

    /** 신규 가입 user_id 접두어 — AppleSignInServiceImpl 와 동일 패턴. */
    private static final String APPLE_USER_ID_PREFIX = "apple_";

    /** Apple sub 의 일부만 user_id 에 사용 (50자 컬럼 한계 + 가독성). */
    private static final int APPLE_USER_ID_SUB_LENGTH = 16;

    /** KST 기준으로 일 5회 한도 윈도우를 계산하기 위한 ZoneId. */
    private static final ZoneId KST_ZONE = ZoneId.of("Asia/Seoul");

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
    public ApplePhoneSendResponse sendOtp(ApplePhoneSendRequest request) {
        if (request == null || !StringUtils.hasText(request.getPhoneVerificationToken())
                || !StringUtils.hasText(request.getPhoneNumber())) {
            return sendFailure("필수 값이 누락됐습니다.");
        }
        ApplePhoneVerificationClaims claims;
        try {
            claims = jwtService.parseApplePhoneVerificationToken(request.getPhoneVerificationToken());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Apple SIWA phone send: phoneVerificationToken 검증 실패 cause={}", e.getMessage());
            return sendFailure("인증 세션이 만료됐습니다. Apple 로그인을 다시 시도해 주세요.");
        }

        String normalizedPhone;
        try {
            normalizedPhone = LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms(request.getPhoneNumber());
        } catch (IllegalArgumentException e) {
            return sendFailure(e.getMessage());
        }

        String tenantId = claims.getTenantId();
        String appleSub = claims.getProviderUserId();
        String phoneHash = sha256Hex(normalizedPhone);

        Optional<PhoneOtpAttempt> recent = phoneOtpAttemptRepository
            .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                tenantId, APPLE_PROVIDER, appleSub, phoneHash);
        LocalDateTime now = LocalDateTime.now();
        if (recent.isPresent()) {
            PhoneOtpAttempt last = recent.get();
            long elapsed = Duration.between(last.getCreatedAt(), now).getSeconds();
            if (elapsed < PhoneOtpAttempt.RESEND_COOLDOWN_SECONDS) {
                long retryAfter = PhoneOtpAttempt.RESEND_COOLDOWN_SECONDS - elapsed;
                log.info("Apple SIWA OTP 재발송 쿨다운 중: appleSub={}, phone={}, retryAfter={}s",
                    appleSub, PhoneLogMasking.maskForLog(normalizedPhone), retryAfter);
                return ApplePhoneSendResponse.builder()
                    .success(false)
                    .message("잠시 후 다시 시도해 주세요.")
                    .retryAfterSeconds(retryAfter)
                    .build();
            }
        }

        LocalDateTime startOfToday = LocalDate.now(KST_ZONE)
            .atStartOfDay(KST_ZONE).toLocalDateTime();
        long dailyCount = phoneOtpAttemptRepository
            .countByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqual(
                tenantId, APPLE_PROVIDER, appleSub, startOfToday);
        if (dailyCount >= PhoneOtpAttempt.MAX_DAILY_COUNT) {
            log.warn("Apple SIWA OTP 일 한도 초과: appleSub={}, phone={}, dailyCount={}",
                appleSub, PhoneLogMasking.maskForLog(normalizedPhone), dailyCount);
            return sendFailure("오늘 인증번호 발송 한도를 초과했습니다. 내일 다시 시도해 주세요.");
        }

        // 테스트모드면 SmsAuthService 가 고정 코드(mockVerificationCode)를 반환, 실제 모드면 무작위 6자리.
        // 본 가드는 SMS 비활성/실패시 null 반환을 잡아 사용자에게 명확히 안내한다.
        String otpCode;
        try {
            otpCode = smsAuthService.sendVerificationCode(normalizedPhone);
        } catch (IllegalArgumentException e) {
            return sendFailure(e.getMessage());
        }
        if (!StringUtils.hasText(otpCode)) {
            return sendFailure("인증번호 발송에 실패했습니다. SMS 설정을 확인해 주세요.");
        }

        PhoneOtpAttempt row = PhoneOtpAttempt.builder()
            .tenantId(tenantId)
            .provider(APPLE_PROVIDER)
            .providerUserId(appleSub)
            .phoneHash(phoneHash)
            .codeHash(passwordService.encodeSecret(otpCode))
            .attempts(0)
            .dailyCount((int) (dailyCount + 1))
            .status(PhoneOtpAttempt.STATUS_PENDING)
            .createdAt(now)
            .expiresAt(now.plusMinutes(PhoneOtpAttempt.EXPIRY_MINUTES))
            .build();
        PhoneOtpAttempt saved = phoneOtpAttemptRepository.saveAndFlush(row);

        String challengeToken = jwtService.generateApplePhoneOtpChallengeToken(
            ApplePhoneOtpChallengeClaims.builder()
                .tenantId(tenantId)
                .provider(APPLE_PROVIDER)
                .providerUserId(appleSub)
                .phoneHash(phoneHash)
                .otpId(saved.getId())
                .build());

        log.info("Apple SIWA OTP 발송 성공: appleSub={}, phone={}, otpId={}",
            appleSub, PhoneLogMasking.maskForLog(normalizedPhone), saved.getId());
        return ApplePhoneSendResponse.builder()
            .success(true)
            .message("인증번호를 전송했습니다.")
            .otpChallengeToken(challengeToken)
            .expiresInSeconds(Duration.ofMinutes(PhoneOtpAttempt.EXPIRY_MINUTES).getSeconds())
            .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AppleSignInResponse verifyOtp(ApplePhoneVerifyRequest request) {
        if (request == null
                || !StringUtils.hasText(request.getPhoneVerificationToken())
                || !StringUtils.hasText(request.getOtpChallengeToken())
                || !StringUtils.hasText(request.getCode())) {
            return verifyFailure("필수 값이 누락됐습니다.");
        }

        ApplePhoneVerificationClaims phoneVerificationClaims;
        ApplePhoneOtpChallengeClaims challengeClaims;
        try {
            phoneVerificationClaims = jwtService.parseApplePhoneVerificationToken(
                request.getPhoneVerificationToken());
            challengeClaims = jwtService.parseApplePhoneOtpChallengeToken(request.getOtpChallengeToken());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Apple SIWA verify: 토큰 검증 실패 cause={}", e.getMessage());
            return verifyFailure("인증 세션이 만료됐습니다. Apple 로그인을 다시 시도해 주세요.");
        }
        if (!phoneVerificationClaims.getProviderUserId().equals(challengeClaims.getProviderUserId())) {
            log.warn("Apple SIWA verify: provider sub 불일치 phoneVerification={}, challenge={}",
                phoneVerificationClaims.getProviderUserId(), challengeClaims.getProviderUserId());
            return verifyFailure("인증 세션이 일치하지 않습니다.");
        }
        if (!phoneVerificationClaims.getTenantId().equals(challengeClaims.getTenantId())) {
            log.warn("Apple SIWA verify: tenantId 불일치");
            return verifyFailure("인증 세션이 일치하지 않습니다.");
        }

        Optional<PhoneOtpAttempt> rowOpt = phoneOtpAttemptRepository
            .findByIdAndTenantIdAndStatus(challengeClaims.getOtpId(), challengeClaims.getTenantId(),
                PhoneOtpAttempt.STATUS_PENDING);
        if (rowOpt.isEmpty()) {
            return verifyFailure("이미 사용했거나 만료된 인증 요청입니다. 인증번호를 다시 받아 주세요.");
        }
        PhoneOtpAttempt row = rowOpt.get();
        if (!row.getPhoneHash().equals(challengeClaims.getPhoneHash())) {
            log.warn("Apple SIWA verify: phoneHash 불일치 — challenge 위변조 의심 otpId={}", row.getId());
            row.setStatus(PhoneOtpAttempt.STATUS_FAILED);
            phoneOtpAttemptRepository.save(row);
            return verifyFailure("인증 요청이 일치하지 않습니다. 다시 시도해 주세요.");
        }
        if (row.getExpiresAt().isBefore(LocalDateTime.now())) {
            row.setStatus(PhoneOtpAttempt.STATUS_EXPIRED);
            phoneOtpAttemptRepository.save(row);
            return verifyFailure("인증번호가 만료됐습니다. 다시 받아 주세요.");
        }

        row.setAttempts(row.getAttempts() == null ? 1 : row.getAttempts() + 1);
        if (row.getAttempts() > PhoneOtpAttempt.MAX_ATTEMPTS) {
            row.setStatus(PhoneOtpAttempt.STATUS_FAILED);
            phoneOtpAttemptRepository.save(row);
            log.warn("Apple SIWA verify: 시도 횟수 초과 otpId={}, attempts={}", row.getId(), row.getAttempts());
            return verifyFailure("인증 시도 횟수를 초과했습니다. 인증번호를 다시 받아 주세요.");
        }

        boolean matches = passwordEncoder.matches(request.getCode(), row.getCodeHash());
        if (!matches) {
            phoneOtpAttemptRepository.save(row);
            if (row.getAttempts() >= PhoneOtpAttempt.MAX_ATTEMPTS) {
                row.setStatus(PhoneOtpAttempt.STATUS_FAILED);
                phoneOtpAttemptRepository.save(row);
                return verifyFailure("인증 시도 횟수를 초과했습니다. 인증번호를 다시 받아 주세요.");
            }
            return verifyFailure("인증번호가 일치하지 않습니다.");
        }
        row.setStatus(PhoneOtpAttempt.STATUS_VERIFIED);
        row.setVerifiedAt(LocalDateTime.now());
        phoneOtpAttemptRepository.save(row);

        return resolveAfterOtpVerified(phoneVerificationClaims, row);
    }

    /**
     * OTP 검증 성공 후 휴대폰 매칭 + JWT 발급 (또는 계정 선택 토큰 발급, 또는 신규 가입).
     * 본 서비스 내에서 휴대폰 매칭을 직접 수행한다 — 카카오/네이버 흐름 회귀 방지를 위해 AbstractOAuth2Service 미사용.
     *
     * <p>매칭은 평문 phone 을 받지 않고 phone_hash 비교로 진행한다. send 단계에서 사용자가 보낸 phone 을
     * 정규화 + SHA-256 해시해 row 에 저장했고, 본 단계에서는 tenant 내 user.phone 들을 복호화 + 정규화 +
     * SHA-256 해시한 뒤 row.phone_hash 와 일치하는 후보를 추린다.</p>
     */
    private AppleSignInResponse resolveAfterOtpVerified(ApplePhoneVerificationClaims claims, PhoneOtpAttempt row) {
        String tenantId = claims.getTenantId();
        String appleSub = claims.getProviderUserId();
        String phoneHash = row.getPhoneHash();
        // OTP verify 단계는 클라이언트가 직접 호출하므로 TenantContext 가 비어 있을 수 있음 — 토큰의 tenantId 로 보정.
        String previousTenantId = TenantContextHolder.peekTenantId();
        try {
            TenantContext.setTenantId(tenantId);
            return resolveAndIssueJwt(tenantId, appleSub, claims, phoneHash);
        } finally {
            TenantContextHolder.setTenantIdOrClear(previousTenantId);
        }
    }

    /**
     * 휴대폰 매칭 + JWT 발급. 매칭 결과에 따라 4 분기:
     * <ol>
     *   <li>매칭 0 → 신규 가입(role=CLIENT) + JWT</li>
     *   <li>매칭 1 → apple_sub 연결 + JWT</li>
     *   <li>매칭 N + 역할 단일 → 우선순위 정책으로 단건 선택 + apple_sub 연결 + JWT</li>
     *   <li>매칭 N + 역할 혼재 → {@code phoneAccountSelectionToken} 발행 (기존 OAuth selection 화면 재사용)</li>
     * </ol>
     */
    private AppleSignInResponse resolveAndIssueJwt(String tenantId, String appleSub,
                                                   ApplePhoneVerificationClaims claims,
                                                   String phoneHash) {
        List<User> candidates = findCandidateUsersByPhoneHash(tenantId, phoneHash);
        log.info("Apple SIWA phone match: tenantId={}, appleSub={}, candidates={}",
            tenantId, appleSub, candidates.size());

        if (candidates.isEmpty()) {
            User created = createNewAppleUserWithPhoneHash(tenantId, appleSub, claims);
            return issueTokens(created, "Apple SIWA 휴대폰 인증 완료 — 신규 가입");
        }
        if (candidates.size() == 1) {
            User matched = candidates.get(0);
            linkAppleAccount(matched, appleSub, claims, tenantId);
            return issueTokens(matched, "Apple SIWA 휴대폰 인증 완료 — 기존 계정 연결");
        }

        long distinctRoles = candidates.stream()
            .map(User::getRole)
            .filter(r -> r != null && PHONE_ACCOUNT_SELECTION_ROLES.contains(r))
            .distinct()
            .count();
        if (distinctRoles >= 2) {
            List<Long> ids = candidates.stream().map(User::getId).collect(Collectors.toList());
            SocialUserInfo socialUserInfo = SocialUserInfo.builder()
                .provider(APPLE_PROVIDER)
                .providerUserId(appleSub)
                .email(claims.getEmail())
                .name(claims.getName())
                .nickname(claims.getNickname())
                .build();
            String selectionToken = jwtService.generateOAuthPhoneAccountSelectionToken(
                tenantId, APPLE_PROVIDER, appleSub, ids, socialUserInfo);
            return AppleSignInResponse.builder()
                .success(true)
                .requiresPhoneAccountSelection(true)
                .phoneAccountSelectionToken(selectionToken)
                .message("동일 전화번호에 여러 역할이 있어 계정을 선택해 주세요.")
                .build();
        }

        User selected = selectBestMatchingUser(candidates);
        linkAppleAccount(selected, appleSub, claims, tenantId);
        return issueTokens(selected, "Apple SIWA 휴대폰 인증 완료 — 기존 계정 연결");
    }

    /**
     * 테넌트 내 user.phone (암호화 저장) 을 모두 복호화·정규화해서 phone_hash 와 일치하는 후보를 추린다.
     * 멀티테넌트 안전: tenantId 로 1차 필터 후 정규화/해시 비교.
     */
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

    /**
     * 매칭 후보 중 우선순위(활성·역할·최근) 로 1 명을 고른다. AbstractOAuth2Service 의 selectBestMatchingUser 와 동등.
     */
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
            if (p1 != p2) return Integer.compare(p1, p2);
            if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            }
            return 0;
        });
        return pool.get(0);
    }

    private int rolePriority(UserRole role) {
        if (role == null) return 999;
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
     * 기존 user 에 apple_sub 연결. user.apple_sub 갱신 + user_social_accounts row 보장.
     */
    private void linkAppleAccount(User user, String appleSub, ApplePhoneVerificationClaims claims, String tenantId) {
        if (user.getAppleSub() == null || !appleSub.equals(user.getAppleSub())) {
            user.setAppleSub(appleSub);
            userRepository.saveAndFlush(user);
        }
        String userTenantId = StringUtils.hasText(user.getTenantId()) ? user.getTenantId() : tenantId;
        Optional<UserSocialAccount> existing = userSocialAccountRepository
            .findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(userTenantId, APPLE_PROVIDER, appleSub);
        UserSocialAccount account = existing.orElseGet(() -> {
            UserSocialAccount built = UserSocialAccount.builder()
                .user(user)
                .provider(APPLE_PROVIDER)
                .providerUserId(appleSub)
                .providerEmail(claims.getEmail())
                .providerName(claims.getName())
                .isPrimary(Boolean.FALSE)
                .isVerified(Boolean.TRUE)
                .isActive(Boolean.TRUE)
                .verificationDate(LocalDateTime.now())
                .verificationMethod(APPLE_PROVIDER)
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
     * 매칭 0 분기: 신규 사용자 생성 (role=CLIENT) — Apple 가입.
     */
    private User createNewAppleUserWithPhoneHash(String tenantId, String appleSub,
                                                 ApplePhoneVerificationClaims claims) {
        String suffix = appleSub.length() > APPLE_USER_ID_SUB_LENGTH
            ? appleSub.substring(0, APPLE_USER_ID_SUB_LENGTH)
            : appleSub;
        String userId = APPLE_USER_ID_PREFIX + suffix.toLowerCase(Locale.ROOT);
        String name = StringUtils.hasText(claims.getName()) ? claims.getName() : "Apple 사용자";
        String email = StringUtils.hasText(claims.getEmail()) ? claims.getEmail() : (userId + "@apple.local");
        String tempPassword = "APPLE_" + System.currentTimeMillis();

        User user = User.builder()
            .userId(userId)
            .password(passwordService.encodeSecret(tempPassword))
            .name(encryptionUtil.safeEncrypt(name))
            .email(encryptionUtil.safeEncrypt(email))
            .role(UserRole.CLIENT)
            .isSocialAccount(Boolean.TRUE)
            .socialProvider(APPLE_PROVIDER)
            .socialProviderUserId(appleSub)
            .appleSub(appleSub)
            .socialLinkedAt(LocalDateTime.now())
            .build();
        user.setTenantId(tenantId);
        User saved = userRepository.saveAndFlush(user);

        Client client = Client.builder()
            .id(saved.getId())
            .tenantId(tenantId)
            .name(saved.getName())
            .email(saved.getEmail())
            .isDeleted(false)
            .build();
        clientRepository.saveAndFlush(client);

        UserSocialAccount socialAccount = UserSocialAccount.builder()
            .user(saved)
            .provider(APPLE_PROVIDER)
            .providerUserId(appleSub)
            .providerEmail(StringUtils.hasText(claims.getEmail()) ? claims.getEmail() : null)
            .providerName(name)
            .isPrimary(Boolean.TRUE)
            .isVerified(Boolean.TRUE)
            .isActive(Boolean.TRUE)
            .verificationDate(LocalDateTime.now())
            .verificationMethod(APPLE_PROVIDER)
            .build();
        socialAccount.setTenantId(tenantId);
        userSocialAccountRepository.save(socialAccount);
        return saved;
    }

    @SuppressWarnings("deprecation")
    private AppleSignInResponse issueTokens(User user, String message) {
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        user.updateLastLogin();
        userRepository.saveAndFlush(user);
        return AppleSignInResponse.builder()
            .success(true)
            .requiresSignup(false)
            .message(message)
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .user(buildUserSummary(user))
            .build();
    }

    private AppleUserSummary buildUserSummary(User user) {
        return AppleUserSummary.builder()
            .id(user.getId())
            .email(encryptionUtil.safeDecrypt(user.getEmail()))
            .name(encryptionUtil.safeDecrypt(user.getName()))
            .nickname(encryptionUtil.safeDecrypt(user.getNickname()))
            .role(user.getRole() != null ? user.getRole().name() : null)
            .tenantId(user.getTenantId())
            .profileImageUrl(com.coresolution.consultation.util.ProfileImageUrlGuard
                .sanitizeOutbound(user.getProfileImageUrl()))
            .build();
    }

    private static ApplePhoneSendResponse sendFailure(String message) {
        return ApplePhoneSendResponse.builder()
            .success(false)
            .message(message)
            .build();
    }

    @SuppressWarnings("deprecation")
    private static AppleSignInResponse verifyFailure(String message) {
        return AppleSignInResponse.builder()
            .success(false)
            .requiresSignup(false)
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
            // SHA-256 은 표준 알고리즘이므로 NoSuchAlgorithmException 발생 불가 — 방어적으로 RuntimeException 로 감싼다.
            throw new IllegalStateException("SHA-256 미지원 — JRE 비정상", e);
        }
    }

}
