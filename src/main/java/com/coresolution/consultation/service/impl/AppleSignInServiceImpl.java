package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.dto.auth.ApplePhoneVerificationClaims;
import com.coresolution.consultation.dto.auth.AppleSignInRequest;
import com.coresolution.consultation.dto.auth.AppleSignInResponse;
import com.coresolution.consultation.dto.auth.AppleSocialUserInfo;
import com.coresolution.consultation.dto.auth.AppleUserSummary;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSocialAccount;
import com.coresolution.consultation.integration.apple.AppleIdTokenVerifier;
import com.coresolution.consultation.integration.apple.AppleIdTokenVerifier.AppleIdTokenVerificationException;
import com.coresolution.consultation.integration.apple.AppleOAuth2Client;
import com.coresolution.consultation.integration.apple.AppleOAuth2Client.AppleOAuth2ClientException;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AppleSignInService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.SocialProvider;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Sign in with Apple (SIWA) 구현체.
 *
 * <p>Apple App Store 4.8 (Login Services) 대응 — T1 트랙. 디자이너 핸드오프
 * {@code docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md} 와 정합한다.</p>
 *
 * <p>분기 정책 (2026-06-08 재정렬):
 * <ol>
 *   <li>{@code apple_sub} 일치 사용자 존재 → JWT 발급 (기존 로그인)</li>
 *   <li>{@code apple_sub} 없음 → {@code requiresPhoneVerification=true} + {@code phoneVerificationToken} 응답
 *       (휴대폰 입력 단계 진입 — 다른 소셜로 가입된 user 라도 휴대폰이 일치할 때만 자동 매칭)</li>
 * </ol>
 * </p>
 *
 * <p>이전 흐름의 (b) email 매칭 분기는 <b>제거</b>됐다. 사용자 결정 — 카카오·네이버·이메일로 가입된
 * user 가 Apple SIWA 로 자동 매칭되는 것은 본인 의사가 아닐 수 있어, 휴대폰 번호를 SSOT 로 한다.</p>
 *
 * <p>Apple Private Relay (`@privaterelay.appleid.com`) 이메일은 정식 이메일로 저장한다 — 디자이너 §4.2.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppleSignInServiceImpl implements AppleSignInService {

    /** Apple 정규화 provider 값 — {@link SocialProvider#normalize(String)} 결과와 정합. */
    private static final String APPLE_PROVIDER = "APPLE";

    /** Apple Private Relay 이메일 도메인. */
    private static final String APPLE_PRIVATE_RELAY_DOMAIN = "privaterelay.appleid.com";

    private final AppleIdTokenVerifier idTokenVerifier;
    private final AppleOAuth2Client oauthClient;
    private final UserRepository userRepository;
    private final UserSocialAccountRepository userSocialAccountRepository;
    private final JwtService jwtService;
    private final PersonalDataEncryptionUtil encryptionUtil;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AppleSignInResponse signIn(AppleSignInRequest request) {
        if (request == null || !StringUtils.hasText(request.getIdentityToken())) {
            return failure("identityToken 이 비어 있습니다.");
        }
        try {
            Map<String, Object> claims = idTokenVerifier.verify(
                request.getIdentityToken(), request.getNonce());
            return resolveAndIssue(claims, request);
        } catch (AppleIdTokenVerificationException e) {
            // PII 우려 0 — aud/iss/kid 는 모두 공개 메타데이터(Apple JWT 헤더·Service ID·Bundle ID).
            // sub/email 은 PII 라 절대 노출 금지. 본 hotfix(P0 2026-06-08) 의 핵심 진단 단서이므로
            // 운영에서 H1(aud 불일치 — 다중 audience 미허용) vs 그 외 사유를 즉시 구분하기 위해 추가.
            String tokenAud = safeExtractClaim(request.getIdentityToken(), "aud");
            String tokenIss = safeExtractClaim(request.getIdentityToken(), "iss");
            String tokenKid = safeExtractHeader(request.getIdentityToken(), "kid");
            log.warn("Apple SIWA 검증 실패: cause={}, tokenAud={}, tokenIss={}, tokenKid={}",
                e.getMessage(), tokenAud, tokenIss, tokenKid);
            return failure("Apple 로그인 검증에 실패했습니다.");
        } catch (Exception e) {
            log.error("Apple 로그인 처리 중 오류", e);
            return failure("Apple 로그인 처리 중 오류가 발생했습니다.");
        }
    }

    /**
     * 검증 실패 진단 로그 전용 — JWT payload 의 단일 claim 값을 best-effort 추출한다.
     *
     * <p>{@link AppleIdTokenVerifier} 가 예외를 던졌을 때 검증 자체는 실패했지만 토큰 형식/Base64URL
     * 구조는 보통 정상이므로, payload 디코딩만으로 aud/iss 를 안전하게 꺼내 진단 로그에 남긴다.
     * 어떤 사유로든 파싱이 실패하면 {@code "(unparseable)"} 을 반환해 catch 블록 자체가
     * 또다시 예외를 던지지 않도록 한다.</p>
     *
     * @param identityToken Apple ID token (압축된 JWT)
     * @param claim         추출할 payload claim 키
     * @return 추출된 String 표현 또는 {@code "(unparseable)"} (실패 시)
     */
    private String safeExtractClaim(String identityToken, String claim) {
        try {
            String[] parts = identityToken.split("\\.");
            if (parts.length < 2) return "(unparseable)";
            byte[] decoded = java.util.Base64.getUrlDecoder().decode(padBase64Url(parts[1]));
            Map<?, ?> payload = new com.fasterxml.jackson.databind.ObjectMapper()
                .readValue(decoded, Map.class);
            Object val = payload.get(claim);
            return val == null ? "(absent)" : val.toString();
        } catch (Exception ignored) {
            return "(unparseable)";
        }
    }

    /**
     * 검증 실패 진단 로그 전용 — JWT header 의 단일 claim 값을 best-effort 추출한다.
     *
     * @see #safeExtractClaim(String, String)
     */
    private String safeExtractHeader(String identityToken, String headerKey) {
        try {
            String[] parts = identityToken.split("\\.");
            if (parts.length < 1) return "(unparseable)";
            byte[] decoded = java.util.Base64.getUrlDecoder().decode(padBase64Url(parts[0]));
            Map<?, ?> header = new com.fasterxml.jackson.databind.ObjectMapper()
                .readValue(decoded, Map.class);
            Object val = header.get(headerKey);
            return val == null ? "(absent)" : val.toString();
        } catch (Exception ignored) {
            return "(unparseable)";
        }
    }

    private static String padBase64Url(String input) {
        int mod = input.length() % 4;
        if (mod == 0) return input;
        return input + "====".substring(mod);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AppleSignInResponse callback(AppleSignInRequest request) {
        if (request == null || !StringUtils.hasText(request.getAuthorizationCode())) {
            return failure("authorizationCode 가 비어 있습니다.");
        }
        try {
            Map<String, Object> tokenResponse = oauthClient.exchangeAuthorizationCode(
                request.getAuthorizationCode());
            Object idTokenObj = tokenResponse.get("id_token");
            if (!(idTokenObj instanceof String idToken) || idToken.isBlank()) {
                return failure("Apple /auth/token 응답에 id_token 이 없습니다.");
            }
            AppleSignInRequest passthrough = AppleSignInRequest.builder()
                .identityToken(idToken)
                .nonce(request.getNonce())
                .givenName(request.getGivenName())
                .familyName(request.getFamilyName())
                .email(request.getEmail())
                .build();
            return signIn(passthrough);
        } catch (AppleOAuth2ClientException e) {
            log.warn("Apple /auth/token 호출 실패: {}", e.getMessage());
            return failure("Apple 인증 코드 교환에 실패했습니다.");
        } catch (Exception e) {
            log.error("Apple 콜백 처리 중 오류", e);
            return failure("Apple 콜백 처리 중 오류가 발생했습니다.");
        }
    }

    @SuppressWarnings("deprecation")
    private AppleSignInResponse resolveAndIssue(Map<String, Object> claims, AppleSignInRequest request) {
        String sub = asString(claims.get("sub"));
        if (!StringUtils.hasText(sub)) {
            return failure("Apple identityToken 에 sub 가 없습니다.");
        }
        String claimEmail = asString(claims.get("email"));
        String email = StringUtils.hasText(request.getEmail()) ? request.getEmail() : claimEmail;
        String normalizedEmail = SocialProvider.normalizeEmail(email);

        // 1) apple_sub 일치 사용자 → 즉시 로그인 (기존 흐름 동일)
        Optional<User> existingBySub = userRepository.findByAppleSub(sub);
        if (existingBySub.isPresent()) {
            User user = existingBySub.get();
            updateAppleSocialLink(user, sub, request);
            return issueTokens(user, "기존 Apple 사용자 로그인");
        }

        // 2) 매칭 없음 → 휴대폰 인증 단계 진입 (이전 email 매칭 분기는 제거됨 — 사용자 결정 2026-06-08)
        String tenantId = TenantContextHolder.getTenantId();
        if (!StringUtils.hasText(tenantId)) {
            // 멀티테넌트 컨텍스트 없이는 휴대폰 인증 토큰을 발급할 수 없음.
            return AppleSignInResponse.builder()
                .success(true)
                .requiresSignup(true)
                .message("기관(테넌트)이 선택되지 않았습니다. 가입 화면에서 기관을 선택해 주세요.")
                .socialUserInfo(buildSocialUserInfo(sub, normalizedEmail, request))
                .build();
        }
        return buildPhoneVerificationResponse(sub, normalizedEmail, tenantId, request);
    }

    /**
     * apple_sub 매칭 사용자가 없을 때 휴대폰 입력 단계로 진입시키는 응답을 만든다.
     *
     * <p>클라이언트는 응답의 {@code requiresPhoneVerification=true} 와 {@code phoneVerificationToken} 을
     * 받으면 휴대폰 입력 화면으로 이동, OTP send/verify endpoint 를 호출한다.</p>
     */
    private AppleSignInResponse buildPhoneVerificationResponse(String sub, String normalizedEmail,
                                                               String tenantId, AppleSignInRequest request) {
        String name = composeName(request);
        ApplePhoneVerificationClaims claims = ApplePhoneVerificationClaims.builder()
            .tenantId(tenantId)
            .provider(APPLE_PROVIDER)
            .providerUserId(sub)
            .email(normalizedEmail)
            .name(name)
            .nickname(name)
            .build();
        String token = jwtService.generateApplePhoneVerificationToken(claims);
        return AppleSignInResponse.builder()
            .success(true)
            .requiresPhoneVerification(true)
            .phoneVerificationToken(token)
            .message("Apple 인증 완료. 휴대폰 인증을 진행해 주세요.")
            .socialUserInfo(buildSocialUserInfo(sub, normalizedEmail, request))
            .build();
    }

    private void updateAppleSocialLink(User user, String sub, AppleSignInRequest request) {
        // 멀티테넌트 안전: 사용자의 tenantId 기준으로 격리 조회 (Repository deprecated 가이드 정합).
        String userTenantId = user.getTenantId();
        Optional<UserSocialAccount> existing = StringUtils.hasText(userTenantId)
            ? userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(
                userTenantId, APPLE_PROVIDER, sub)
            : Optional.empty();
        UserSocialAccount account = existing.orElseGet(() -> {
            UserSocialAccount built = UserSocialAccount.builder()
                .user(user)
                .provider(APPLE_PROVIDER)
                .providerUserId(sub)
                .isPrimary(Boolean.FALSE)
                .isVerified(Boolean.TRUE)
                .isActive(Boolean.TRUE)
                .verificationDate(LocalDateTime.now())
                .verificationMethod(APPLE_PROVIDER)
                .build();
            if (StringUtils.hasText(userTenantId)) {
                built.setTenantId(userTenantId);
            }
            return built;
        });
        if (account.getProviderName() == null && (StringUtils.hasText(request.getGivenName())
                || StringUtils.hasText(request.getFamilyName()))) {
            account.setProviderName(composeName(request));
        }
        // Lombok @Builder 가 필드 초기값을 무시하므로 loginCount 가 null 일 수 있음 → 안전 증가.
        Integer currentLoginCount = account.getLoginCount();
        if (currentLoginCount == null) {
            currentLoginCount = 0;
        }
        account.setLoginCount(currentLoginCount + 1);
        account.setLastLoginAt(LocalDateTime.now());
        userSocialAccountRepository.save(account);

        if (user.getAppleSub() == null) {
            user.setAppleSub(sub);
            userRepository.saveAndFlush(user);
        }
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
            .profileImageUrl(user.getProfileImageUrl())
            .build();
    }

    private AppleSocialUserInfo buildSocialUserInfo(String sub, String normalizedEmail,
                                                    AppleSignInRequest request) {
        String name = composeName(request);
        boolean privateRelay = isPrivateRelayEmail(normalizedEmail);
        return AppleSocialUserInfo.builder()
            .provider(APPLE_PROVIDER)
            .providerUserId(sub)
            .email(normalizedEmail)
            .name(name)
            .nickname(name)
            .privateRelayEmail(privateRelay)
            .build();
    }

    private static String composeName(AppleSignInRequest request) {
        String given = request.getGivenName() != null ? request.getGivenName().trim() : "";
        String family = request.getFamilyName() != null ? request.getFamilyName().trim() : "";
        if (given.isEmpty() && family.isEmpty()) {
            return "Apple 사용자";
        }
        return (family + " " + given).trim();
    }

    private static boolean isPrivateRelayEmail(String email) {
        return email != null && email.toLowerCase(Locale.ROOT).endsWith("@" + APPLE_PRIVATE_RELAY_DOMAIN);
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

    @SuppressWarnings("deprecation")
    private static AppleSignInResponse failure(String message) {
        return AppleSignInResponse.builder()
            .success(false)
            .requiresSignup(false)
            .message(message)
            .build();
    }

    /** 테스트·진단 용 — 외부에서 빈 클레임 맵을 만들 때 사용한다. */
    static Map<String, Object> emptyClaims() {
        return new HashMap<>();
    }
}
