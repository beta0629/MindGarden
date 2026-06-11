package com.coresolution.consultation.controller;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.oauth.OAuthAccountSelectionUserFacingStrings;
import com.coresolution.consultation.constant.oauth.OAuth2UserFacingMessages;
import com.coresolution.consultation.dto.OAuthAccountSelectionCompleteData;
import com.coresolution.consultation.dto.OAuthAccountSelectionCompleteRequest;
import com.coresolution.consultation.dto.OAuthAccountSelectionPreviewItem;
import com.coresolution.consultation.dto.OAuthAccountSelectionPreviewRequest;
import com.coresolution.consultation.dto.OAuthAccountSelectionPreviewResponse;
import com.coresolution.consultation.dto.OAuthExistingUserResolution;
import com.coresolution.consultation.dto.OAuthPhoneAccountSelectionClaims;
import com.coresolution.consultation.dto.SocialLoginResponse;
import com.coresolution.consultation.dto.SocialUserInfo;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerificationClaims;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.auth.OAuthProvider;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.OAuth2FactoryService;
import com.coresolution.consultation.service.OAuth2Service;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"}) // 표준화 2025-12-05: 레거시 경로도 지원 (OAuth 콜백 호환성)
@RequiredArgsConstructor
public class OAuth2Controller extends BaseApiController {

    private final OAuth2FactoryService oauth2FactoryService;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final OAuth2DomainUtil oauth2DomainUtil;
    private final UserRepository userRepository;
    private final com.coresolution.consultation.service.JwtService jwtService;
    private final com.coresolution.consultation.service.DynamicPermissionService dynamicPermissionService;
    private final UserSessionService userSessionService;
    private final com.coresolution.core.repository.TenantRepository tenantRepository;
    private final org.springframework.core.env.Environment environment;

    @Value("${spring.security.oauth2.client.registration.kakao.client-id:${security.oauth2.client.registration.kakao.client-id:cbb457cfb5f9351fd495be4af2b11a34}}")
    private String kakaoClientId;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri:${KAKAO_REDIRECT_URI:}}")
    private String kakaoRedirectUri;

    @Value("${spring.security.oauth2.client.registration.kakao.scope:profile_nickname,account_email,phone_number}")
    private String kakaoScope;

    @Value("${spring.security.oauth2.client.registration.naver.client-id:${security.oauth2.client.registration.naver.client-id:vTKNlxYKIfo1uCCXaDfk}}")
    private String naverClientId;

    @Value("${spring.security.oauth2.client.registration.naver.redirect-uri:${NAVER_REDIRECT_URI:}}")
    private String naverRedirectUri;

    @Value("${spring.security.oauth2.client.registration.naver.scope:name,email}")
    private String naverScope;

    @Value("${spring.security.oauth2.client.callback.kakao-path:/api/auth/kakao/callback}")
    private String kakaoCallbackPath;

    @Value("${spring.security.oauth2.client.callback.naver-path:/api/auth/naver/callback}")
    private String naverCallbackPath;

    // === Google Web (server-side auth-code) ===
    // 멀티테넌트 와일드카드(`*.core-solution.co.kr`) 환경에서 Google OAuth 가 JavaScript origin
    // 와일드카드를 미지원하므로(`origin_mismatch`), 카카오/네이버와 동일한 server-side auth-code
    // 흐름으로 통합한다. redirect_uri 1개를 apex 호스트(예: `https://core-solution.co.kr/api/v1/auth/google/callback`)
    // 에 등록하고 테넌트는 state 에 base64 로 인코딩한다.

    @Value("${spring.security.oauth2.client.registration.google.client-id:${GOOGLE_CLIENT_ID:}}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.redirect-uri:${GOOGLE_REDIRECT_URI:}}")
    private String googleRedirectUri;

    @Value("${spring.security.oauth2.client.registration.google.scope:openid email profile}")
    private String googleScope;

    @Value("${spring.security.oauth2.client.callback.google-path:/api/v1/auth/google/callback}")
    private String googleCallbackPath;

    // NOTE: 도메인 하드코딩 금지. 값은 환경변수/프로퍼티로만 주입 (없으면 요청 기반으로 동적 추론)
    @Value("${spring.security.oauth2.domain.naver-callback-domain:${NAVER_CALLBACK_DOMAIN:}}")
    private String naverCallbackDomain;

    // NOTE: 도메인 하드코딩 금지. 값은 환경변수/프로퍼티로만 주입 (없으면 검증 로직에서 graceful fallback)
    @Value("${spring.security.oauth2.domain.naver-registered-urls:${NAVER_REGISTERED_URLS:}}")
    private String naverRegisteredUrls;

    @Value("${frontend.base-url:${FRONTEND_BASE_URL:}}")
    private String frontendBaseUrl;

    // 로컬 개발 환경용 기본 테넌트 ID (서브도메인이 없을 때 사용)
    @Value("${local.default-tenant-id:${LOCAL_DEFAULT_TENANT_ID:}}")
    private String localDefaultTenantId;

    /** 네이버 authorize에서 설정, 콜백에서 1회 소비 (provider가 callback query에 mode를 넘기지 않음). */
    private static final String SESSION_ATTR_OAUTH2_NAVER_MODE = "oauth2_naver_mode";

    /** 카카오 authorize에서 설정, 콜백에서 1회 소비. */
    private static final String SESSION_ATTR_OAUTH2_KAKAO_MODE = "oauth2_kakao_mode";

    /** Google authorize에서 설정, 콜백에서 1회 소비. */
    private static final String SESSION_ATTR_OAUTH2_GOOGLE_MODE = "oauth2_google_mode";

    private static final String OAUTH2_MODE_LINK = "link";

    private static final String OAUTH2_MODE_LOGIN = "login";

    // OAuth2 콜백 이후 리다이렉트는 '실제 유입 Host' 기준으로 유지 (proxy/env 설정 불일치로 다른 도메인으로 튀는 문제 방지)

    @PostConstruct
    public void init() {
        log.info("🔧 OAuth2Controller 초기화 - frontendBaseUrl: {}", frontendBaseUrl);
    }

    /**
     * 콜백 분기 등 컨트롤러 전용 경로에서 서비스 계층과 동일하게 user_social_accounts 연동을 저장한다.
     *
     * @param oauth2Service 제공자별 서비스
     * @param userId 매칭된 사용자 PK
     * @param socialUserInfo SNS 프로필
     */
    private void linkSocialAccountSafely(OAuth2Service oauth2Service, Long userId,
            SocialUserInfo socialUserInfo) {
        if (oauth2Service == null || userId == null || socialUserInfo == null) {
            return;
        }
        try {
            oauth2Service.linkSocialAccountToUser(userId, socialUserInfo);
        } catch (Exception e) {
            log.warn("소셜 연동 저장 중 오류(로그인 플로우는 계속): userId={}, msg={}", userId, e.getMessage());
        }
    }

    private String buildAccountSelectionOptionLabel(User user) {
        if (user == null || user.getId() == null) {
            return "";
        }
        if (user.getRole() == null) {
            return String.format(OAuthAccountSelectionUserFacingStrings.OPTION_OTHER_FMT, "USER",
                user.getId());
        }
        switch (user.getRole()) {
            case CONSULTANT:
            case PLAY_THERAPIST:
            case SPEECH_THERAPIST:
                return String.format(OAuthAccountSelectionUserFacingStrings.OPTION_CONSULTANT_FMT,
                    user.getId());
            case CLIENT:
                return String.format(OAuthAccountSelectionUserFacingStrings.OPTION_CLIENT_FMT, user.getId());
            case ADMIN:
                return String.format(OAuthAccountSelectionUserFacingStrings.OPTION_ADMIN_FMT, user.getId());
            case STAFF:
                return String.format(OAuthAccountSelectionUserFacingStrings.OPTION_STAFF_FMT, user.getId());
            default:
                return String.format(OAuthAccountSelectionUserFacingStrings.OPTION_OTHER_FMT,
                    user.getRole().name(), user.getId());
        }
    }

    /**
     * 동일 전화에 서로 다른 역할(관리자·상담사·스태프·내담자)이 공존할 때 프론트 계정 선택 화면으로 리다이렉트한다. 소셜 연동은 하지 않는다.
     */
    private ResponseEntity<?> redirectOAuthPhoneAccountSelection(HttpServletRequest request,
            HttpSession session, String state, String providerUpper, SocialUserInfo socialUserInfo,
            OAuthExistingUserResolution resolution) {
        String selectionTenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        if (selectionTenantId == null || selectionTenantId.isBlank()) {
            selectionTenantId = resolveTenantIdForRedirect(session, state);
        }
        if (selectionTenantId == null || selectionTenantId.isBlank()) {
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302)
                .header("Location",
                    frontendUrl + "/login?error="
                        + URLEncoder.encode(OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED,
                            StandardCharsets.UTF_8)
                        + "&provider=" + URLEncoder.encode(providerUpper, StandardCharsets.UTF_8))
                .build();
        }
        String token = jwtService.generateOAuthPhoneAccountSelectionToken(selectionTenantId, providerUpper,
            socialUserInfo.getProviderUserId(), resolution.getPhoneMatchCandidateUserIds(), socialUserInfo);
        String redirectTenantId = resolveTenantIdForRedirect(session, state);
        if (redirectTenantId == null || redirectTenantId.isBlank()) {
            redirectTenantId = selectionTenantId;
        }
        String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
        String q = "success=true&accountSelection=required&selectionToken="
            + URLEncoder.encode(token, StandardCharsets.UTF_8) + "&provider="
            + URLEncoder.encode(providerUpper, StandardCharsets.UTF_8) + "&tenantId="
            + URLEncoder.encode(selectionTenantId, StandardCharsets.UTF_8);
        String location = frontendUrl + "/auth/oauth2/callback?" + q;
        logOAuthRedirectLocationSummary("OAuth phone account selection", location);
        return ResponseEntity.status(302).header("Location", location).build();
    }

    /**
     * provider-agnostic OAuth 휴대폰 OTP 단계 진입 여부 판정.
     *
     * <p>2026-06-09 OAuth 휴대폰 SSOT 정책: OAuth 콜백 후 provider sub·전화·이메일·user_id 매칭이 모두 실패한
     * 신규 가입 분기에서, {@link OAuth2Service#requiresPhoneOtp(OAuthProvider, SocialUserInfo)} 가
     * {@code true} 인 provider 만 OTP 흐름으로 분기시킨다.</p>
     *
     * <p>Apple 흐름은 본 분기에 진입하지 않는다 — Apple 은 별도 컨트롤러
     * ({@code AppleSignInController}) 와 {@code ApplePhoneVerificationService} alias 라우팅을 유지해
     * FE PR #161 회귀를 방지한다. {@link OAuth2Controller} 는 Apple 콜백 자체를 처리하지 않지만, 향후 Apple
     * provider 가 본 컨트롤러로 유입될 가능성을 대비해 명시적으로 차단한다.</p>
     *
     * @param oauth2Service provider 별 OAuth2Service
     * @param socialUserInfo 정규화된 소셜 사용자 정보
     * @return OTP 단계로 분기해야 하면 true
     */
    boolean shouldEnterOAuthPhoneOtpFlow(OAuth2Service oauth2Service,
            SocialUserInfo socialUserInfo) {
        if (oauth2Service == null || socialUserInfo == null) {
            return false;
        }
        String providerName = oauth2Service.getProviderName();
        OAuthProvider oauthProvider;
        try {
            oauthProvider = OAuthProvider.fromString(providerName);
        } catch (IllegalArgumentException e) {
            log.warn("OAuth phone OTP 분기: 알 수 없는 provider — hook 미진입: provider={}", providerName);
            return false;
        }
        if (oauthProvider == OAuthProvider.APPLE) {
            return false;
        }
        try {
            return oauth2Service.requiresPhoneOtp(oauthProvider, socialUserInfo);
        } catch (Exception e) {
            log.warn("OAuth phone OTP 분기 hook 호출 실패 — false 처리: provider={}, cause={}",
                providerName, e.getMessage());
            return false;
        }
    }

    /**
     * provider-agnostic OAuth 휴대폰 OTP 단계 진입용 1단계 JWT 발급. tenantId 가 비어 있으면 null 반환.
     *
     * @param oauthProvider 발급 대상 provider
     * @param socialUserInfo 정규화된 소셜 사용자 정보(prefill 용)
     * @param tenantId 발급 시점 테넌트 ID(필수)
     * @return 발급된 단기 JWT 또는 null
     */
    String issueOAuthPhoneVerificationToken(OAuthProvider oauthProvider,
            SocialUserInfo socialUserInfo, String tenantId) {
        if (oauthProvider == null || socialUserInfo == null
                || tenantId == null || tenantId.isBlank()) {
            return null;
        }
        try {
            return jwtService.generateOAuthPhoneVerificationToken(
                OAuthPhoneVerificationClaims.builder()
                    .tenantId(tenantId)
                    .oauthProvider(oauthProvider)
                    .providerUserId(socialUserInfo.getProviderUserId())
                    .email(socialUserInfo.getEmail())
                    .name(socialUserInfo.getName())
                    .nickname(socialUserInfo.getNickname())
                    .profileImageUrl(socialUserInfo.getProfileImageUrl())
                    .build());
        } catch (IllegalArgumentException e) {
            log.warn("OAuth phone verification token 발급 실패: provider={}, cause={}",
                oauthProvider, e.getMessage());
            return null;
        }
    }

    /**
     * OAuth 콜백에서 신규 가입 분기 직전, OTP 단계 진입용 FE 리다이렉트 응답을 생성한다.
     *
     * <p>리다이렉트 URL 형식:
     * {@code {frontendUrl}/auth/oauth-phone-link?success=true&oauthPhoneVerification=required
     * &phoneVerificationToken=...&provider=...&tenantId=...}</p>
     *
     * <p>토큰 발급에 실패하면 기존 OAuth 에러 흐름과 동일하게 {@code /login?error=...} 로 fallback 한다.</p>
     *
     * @param request HTTP 요청
     * @param session HTTP 세션
     * @param state OAuth state
     * @param providerUpper provider 대문자 문자열(KAKAO/NAVER/GOOGLE)
     * @param socialUserInfo 정규화된 소셜 사용자 정보
     * @return 302 redirect 응답
     */
    private ResponseEntity<?> redirectOAuthPhoneVerification(HttpServletRequest request,
            HttpSession session, String state, String providerUpper, SocialUserInfo socialUserInfo) {
        String verificationTenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        if (verificationTenantId == null || verificationTenantId.isBlank()) {
            verificationTenantId = resolveTenantIdForRedirect(session, state);
        }
        String redirectTenantId = resolveTenantIdForRedirect(session, state);
        if (redirectTenantId == null || redirectTenantId.isBlank()) {
            redirectTenantId = verificationTenantId;
        }
        String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
        if (verificationTenantId == null || verificationTenantId.isBlank()) {
            return ResponseEntity.status(302)
                .header("Location",
                    frontendUrl + "/login?error="
                        + URLEncoder.encode(OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED,
                            StandardCharsets.UTF_8)
                        + "&provider=" + URLEncoder.encode(providerUpper, StandardCharsets.UTF_8))
                .build();
        }
        OAuthProvider oauthProvider;
        try {
            oauthProvider = OAuthProvider.fromString(providerUpper);
        } catch (IllegalArgumentException e) {
            log.warn("OAuth phone verification redirect: 알 수 없는 provider={}", providerUpper);
            return ResponseEntity.status(302)
                .header("Location",
                    frontendUrl + "/login?error="
                        + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_SYSTEM_ERROR,
                            StandardCharsets.UTF_8)
                        + "&provider=" + URLEncoder.encode(providerUpper, StandardCharsets.UTF_8))
                .build();
        }
        String token = issueOAuthPhoneVerificationToken(oauthProvider, socialUserInfo, verificationTenantId);
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(302)
                .header("Location",
                    frontendUrl + "/login?error="
                        + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_SYSTEM_ERROR,
                            StandardCharsets.UTF_8)
                        + "&provider=" + URLEncoder.encode(providerUpper, StandardCharsets.UTF_8))
                .build();
        }
        String q = "success=true&oauthPhoneVerification=required&phoneVerificationToken="
            + URLEncoder.encode(token, StandardCharsets.UTF_8) + "&provider="
            + URLEncoder.encode(providerUpper, StandardCharsets.UTF_8) + "&tenantId="
            + URLEncoder.encode(verificationTenantId, StandardCharsets.UTF_8);
        String location = frontendUrl + "/auth/oauth-phone-link?" + q;
        logOAuthRedirectLocationSummary("OAuth phone verification", location);
        return ResponseEntity.status(302).header("Location", location).build();
    }

    /**
     * authorize 단계의 mode를 세션에 반영합니다. 기본(파라미터 없음)은 연동 모드 잔존 방지를 위해 세션 키를 제거합니다.
     *
     * @param session HTTP 세션
     * @param mode 요청 파라미터 mode (link / login 등)
     * @param sessionAttrKey {@link #SESSION_ATTR_OAUTH2_NAVER_MODE} 또는 {@link #SESSION_ATTR_OAUTH2_KAKAO_MODE}
     */
    private void storeOAuth2AuthorizeMode(HttpSession session, String mode, String sessionAttrKey) {
        if (session == null) {
            return;
        }
        if (mode != null && !mode.isBlank()) {
            String normalized = mode.trim();
            if (OAUTH2_MODE_LINK.equalsIgnoreCase(normalized)) {
                session.setAttribute(sessionAttrKey, OAUTH2_MODE_LINK);
            } else if (OAUTH2_MODE_LOGIN.equalsIgnoreCase(normalized)) {
                session.setAttribute(sessionAttrKey, OAUTH2_MODE_LOGIN);
            } else {
                session.removeAttribute(sessionAttrKey);
            }
        } else {
            session.removeAttribute(sessionAttrKey);
        }
    }

    /**
     * 콜백에서 사용할 OAuth mode. 쿼리 {@code mode}가 있으면 우선하고, 없으면 authorize에서 저장한 세션 값을 사용합니다. 세션 값은
     * 읽은 뒤 제거합니다(1회성). 쿼리에 mode가 있을 때도 세션 키는 정리합니다.
     *
     * @param session HTTP 세션
     * @param requestMode 콜백 쿼리 파라미터 mode
     * @param sessionAttrKey provider별 세션 키
     * @return 정규화된 mode 문자열, 없으면 null
     */
    private String consumeOAuth2EffectiveMode(HttpSession session, String requestMode,
            String sessionAttrKey) {
        String fromRequest =
                requestMode != null && !requestMode.isBlank() ? requestMode.trim() : null;
        if (session != null) {
            if (fromRequest != null) {
                session.removeAttribute(sessionAttrKey);
                return fromRequest;
            }
            Object raw = session.getAttribute(sessionAttrKey);
            session.removeAttribute(sessionAttrKey);
            return raw != null ? String.valueOf(raw).trim() : null;
        }
        return fromRequest;
    }

    /**
     * 콜백에서 사용할 OAuth mode를 세션에서 읽기만 합니다(소비하지 않음). {@link #consumeOAuth2EffectiveMode} 전에 링크 모드 분기용.
     *
     * @param session HTTP 세션
     * @param requestMode 콜백 쿼리 파라미터 mode
     * @param sessionAttrKey provider별 세션 키
     * @return 정규화된 mode 문자열, 없으면 null
     */
    private String peekOAuth2EffectiveMode(HttpSession session, String requestMode, String sessionAttrKey) {
        String fromRequest =
                requestMode != null && !requestMode.isBlank() ? requestMode.trim() : null;
        if (fromRequest != null) {
            return fromRequest;
        }
        if (session != null) {
            Object raw = session.getAttribute(sessionAttrKey);
            return raw != null ? String.valueOf(raw).trim() : null;
        }
        return null;
    }

    private boolean isOAuth2CallbackLinkMode(HttpSession session, String requestMode, String sessionAttrKey) {
        String peek = peekOAuth2EffectiveMode(session, requestMode, sessionAttrKey);
        return OAUTH2_MODE_LINK.equalsIgnoreCase(peek != null ? peek : "");
    }

    /**
     * 마이페이지 SNS 연동 콜백에서 세션 사용자 + SNS 식별자만 담은 성공 응답(로그인 JWT 없음).
     *
     * @param sessionUser 현재 로그인 사용자
     * @param socialUserInfo 정규화된 SNS 프로필
     * @return 소셜 로그인 응답 형태(후속 분기에서 linkSocialAccountToUser 호출)
     */
    private SocialLoginResponse buildSocialLoginResponseForMyPageOAuthLink(User sessionUser,
            SocialUserInfo socialUserInfo) {
        return SocialLoginResponse.builder().success(true).requiresSignup(false)
                .userInfo(SocialLoginResponse.UserInfo.builder().id(sessionUser.getId())
                        .email(sessionUser.getEmail()).name(sessionUser.getName())
                        .nickname(sessionUser.getNickname())
                        .role(sessionUser.getRole() != null ? sessionUser.getRole().getValue() : null)
                        .profileImageUrl(sessionUser.getProfileImageUrl())
                        .providerUserId(socialUserInfo.getProviderUserId()).build())
                .build();
    }

    /**
     * 외부(클라이언트 기준) 스킴을 최대한 정확히 추정합니다. - 프록시 환경에서는 request.getScheme()가 http로 들어오는 경우가 있어 OAuth2
     * redirect_uri 불일치가 발생할 수 있음
     */
    private String resolveExternalScheme(HttpServletRequest request) {
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        if (forwardedProto != null && !forwardedProto.isEmpty()) {
            return forwardedProto;
        }

        String forwardedSsl = request.getHeader("X-Forwarded-Ssl");
        if (forwardedSsl != null && forwardedSsl.equalsIgnoreCase("on")) {
            return "https";
        }

        // Origin/Referer로 보정 (브라우저에서 온 요청인 경우 도움이 됨)
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isEmpty() && origin.startsWith("http")) {
            try {
                return new java.net.URL(origin).getProtocol();
            } catch (Exception ignored) {
            }
        }
        String referer = request.getHeader("Referer");
        if (referer != null && !referer.isEmpty() && referer.startsWith("http")) {
            try {
                return new java.net.URL(referer).getProtocol();
            } catch (Exception ignored) {
            }
        }

        // 포트 기반 보정
        String forwardedPort = request.getHeader("X-Forwarded-Port");
        if (forwardedPort != null && !forwardedPort.isEmpty()) {
            if ("443".equals(forwardedPort)) {
                return "https";
            }
        }
        int serverPort = request.getServerPort();
        if (serverPort == 443) {
            return "https";
        }

        return request.getScheme();
    }

    /**
     * 프론트엔드 URL 동적 감지 우선순위: 1. 요청의 Host 헤더 (서브도메인 지원) 2. Referer 헤더 3. 프로퍼티/환경변수
     */
    private String getFrontendBaseUrl(HttpServletRequest request) {
        // 1. 요청의 Host 헤더를 우선 사용 (서브도메인 지원)
        try {
            String requestScheme = resolveExternalScheme(request);

            String requestHost = request.getHeader("X-Forwarded-Host");
            if (requestHost == null || requestHost.isEmpty()) {
                requestHost = request.getHeader("Host");
            }
            if (requestHost == null || requestHost.isEmpty()) {
                requestHost = request.getServerName();
                int port = request.getServerPort();
                if (port != 80 && port != 443) {
                    requestHost = requestHost + ":" + port;
                }
            }

            // 포트 제거 (프론트엔드 URL에는 포트가 필요 없음)
            String hostWithoutPort = requestHost.split(":")[0];

            if (hostWithoutPort != null && !hostWithoutPort.isEmpty()) {
                String dynamicUrl = requestScheme + "://" + hostWithoutPort;
                log.info("프론트엔드 URL (요청 Host 기반): {}", dynamicUrl);
                return dynamicUrl;
            }
        } catch (Exception e) {
            log.warn("요청 Host 기반 프론트엔드 URL 생성 실패", e);
        }

        // 2. Referer 헤더 확인
        String referer = request.getHeader("Referer");
        if (referer != null && !referer.isEmpty() && !referer.contains("null")) {
            try {
                // Referer에서 프로토콜과 호스트 부분만 추출
                java.net.URL url = new java.net.URL(referer);
                String frontendUrl = url.getProtocol() + "://" + url.getAuthority();

                // null이 포함된 URL 필터링
                if (frontendUrl.contains("null")) {
                    log.warn("Referer URL에 null이 포함됨, 무시: {}", frontendUrl);
                } else {
                    log.info("프론트엔드 URL (Referer 기반): {}", frontendUrl);
                    return frontendUrl;
                }
            } catch (Exception e) {
                log.warn("Referer URL 파싱 실패: {}", referer, e);
            }
        }

        // 3. 프로퍼티 값 사용
        if (frontendBaseUrl != null && !frontendBaseUrl.trim().isEmpty()) {
            log.info("프론트엔드 URL (프로퍼티): {}", frontendBaseUrl);
            return frontendBaseUrl;
        }

        // 4. 환경변수 확인
        String envFrontendUrl = System.getenv("FRONTEND_BASE_URL");
        if (envFrontendUrl != null && !envFrontendUrl.trim().isEmpty()) {
            log.info("프론트엔드 URL (환경변수): {}", envFrontendUrl);
            return envFrontendUrl;
        }

        // 5. 모든 방법이 실패한 경우 요청 정보로 동적 생성 시도
        try {
            String scheme = resolveExternalScheme(request);

            String serverName = request.getHeader("X-Forwarded-Host");
            if (serverName == null || serverName.isEmpty()) {
                serverName = request.getHeader("Host");
            }
            if (serverName == null || serverName.isEmpty()) {
                serverName = request.getServerName();
            }

            // 포트 제거
            if (serverName != null && serverName.contains(":")) {
                serverName = serverName.split(":")[0];
            }

            if (serverName != null && !serverName.isEmpty()) {
                String dynamicUrl = scheme + "://" + serverName;
                log.warn("프론트엔드 URL을 동적으로 생성 (서버 정보 기반): {}", dynamicUrl);
                return dynamicUrl;
            }
        } catch (Exception e) {
            log.error("프론트엔드 URL 생성 실패", e);
        }

        // 최후의 수단: 요청의 서버 정보로 강제 생성
        try {
            String scheme = resolveExternalScheme(request);
            String serverName = request.getServerName();
            if (serverName != null && !serverName.isEmpty()) {
                String fallbackUrl = scheme + "://" + serverName;
                log.error("❌ 프론트엔드 URL을 동적으로 생성할 수 없어 서버 정보로 생성: {}", fallbackUrl);
                return fallbackUrl;
            }
        } catch (Exception e) {
            log.error("프론트엔드 URL 생성 실패 (서버 정보 기반)", e);
        }

        // 모든 방법이 실패한 경우: 오류 로그만 남기고 빈 문자열 반환 (호출하는 쪽에서 처리)
        log.error("❌ 프론트엔드 URL을 동적으로 생성할 수 없습니다. 요청 정보를 확인해주세요.");
        return "";
    }

    /**
     * OAuth2 콜백은 메인 도메인으로 들어오는 경우가 있어, 회원가입/오류 리다이렉트는 tenantId 기준으로 원래 테넌트 서브도메인으로 복원해야 함. 우선순위: -
     * tenantId로 Tenant.subdomain 조회 성공 시: https://{subdomain}.{parentDomain} - 실패 시: 기존
     * getFrontendBaseUrl(request) fallback
     */
    private String getTenantAwareFrontendBaseUrl(HttpServletRequest request, String tenantId) {
        try {
            if (tenantId != null && !tenantId.trim().isEmpty()) {
                java.util.Optional<com.coresolution.core.domain.Tenant> tenantOptional =
                        tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId.trim());
                if (tenantOptional.isPresent()) {
                    String subdomain = tenantOptional.get().getSubdomain();
                    if (subdomain != null && !subdomain.trim().isEmpty()) {
                        String requestScheme = resolveExternalScheme(request);

                        // 요청 Host에서 parent domain 추출 (유입 도메인 유지)
                        String requestHost = request.getHeader("X-Forwarded-Host");
                        if (requestHost == null || requestHost.isEmpty()) {
                            requestHost = request.getHeader("Host");
                        }
                        if (requestHost == null || requestHost.isEmpty()) {
                            requestHost = request.getServerName();
                        }
                        // 포트 제거
                        String hostWithoutPort =
                                requestHost != null ? requestHost.split(":")[0] : "";

                        // host가 tenant 서브도메인을 포함하면 제거해서 parent domain만 남김
                        String parentDomain = hostWithoutPort;
                        if (hostWithoutPort != null
                                && hostWithoutPort.startsWith(subdomain.trim() + ".")) {
                            parentDomain =
                                    hostWithoutPort.substring((subdomain.trim() + ".").length());
                        }

                        parentDomain =
                                oauth2DomainUtil.normalizeFrontendParentDomainForRedirect(parentDomain);

                        String dynamicUrl =
                                requestScheme + "://" + subdomain.trim() + "." + parentDomain;
                        log.info("프론트엔드 URL (tenantId 기반 서브도메인 복원): tenantId={}, url={}", tenantId,
                                dynamicUrl);
                        return dynamicUrl;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("tenantId 기반 프론트엔드 URL 생성 실패: tenantId={}", tenantId, e);
        }

        return getFrontendBaseUrl(request);
    }

    /**
     * 실패/오류 리다이렉트에서 서브도메인을 유지하기 위한 tenantId 복구 헬퍼 우선순위: state(인코딩) -> session(oauth2_tenant_id) ->
     * TenantContextHolder
     */
    private String resolveTenantIdForRedirect(HttpSession session, String state) {
        // 1) state에서 tenantId 디코딩 (형식: {base64TenantId}.{nonce})
        String normalized = normalizeOAuth2StateQueryValue(state);
        OAuthCompositeState parsed = parseCompositeOAuthState(normalized);
        if (parsed.tenantId != null && !parsed.tenantId.isEmpty()) {
            return parsed.tenantId;
        }

        // 2) 세션에서 tenantId
        if (session != null) {
            try {
                String tenantId = (String) session.getAttribute("oauth2_tenant_id");
                if (tenantId != null && !tenantId.trim().isEmpty()) {
                    return tenantId.trim();
                }
            } catch (Exception e) {
                // ignore
            }
        }

        // 3) TenantContextHolder
        try {
            String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
            if (tenantId != null && !tenantId.trim().isEmpty()) {
                return tenantId.trim();
            }
        } catch (Exception e) {
            // ignore
        }

        return null;
    }

    /**
     * 로그용: state의 tenant 인코딩 구간(첫 '.' 앞)만 최대 8자까지, 전체 state/tenantId 원문은 남기지 않음.
     *
     * @param state OAuth state 쿼리 값 (nullable)
     * @return 진단용 접두만; dot 없으면 {@code n/a}
     */
    private static String oauth2StateEncodedSegmentPrefixForLog(String state) {
        if (state == null || !state.contains(".")) {
            return "n/a";
        }
        String normalized = normalizeOAuth2StateQueryValue(state);
        String encoded = normalized != null ? normalized.split("\\.", 2)[0] : "";
        if (encoded.isEmpty()) {
            return "empty";
        }
        final int max = 8;
        if (encoded.length() <= max) {
            return encoded;
        }
        return encoded.substring(0, max) + "...";
    }

    /**
     * OAuth2 state 쿼리 값 정규화 (공백·중개 프록시에 따른 미세 변형 완화).
     *
     * @param state 원본 state (nullable)
     * @return trim 된 값 또는 null
     */
    static String normalizeOAuth2StateQueryValue(String state) {
        if (state == null) {
            return null;
        }
        return state.trim();
    }

    /**
     * authorize 단계에서 붙인 URL-safe Base64 테넌트 접두를 디코드한다. URL-safe 실패 시 표준 Base64+패딩을 시도한다.
     *
     * @param encodedSegment 첫 '.' 앞 구간
     * @return UTF-8 원시 바이트 디코드 결과
     */
    static byte[] decodeOAuthStateTenantSegment(String encodedSegment) {
        if (encodedSegment == null || encodedSegment.isEmpty()) {
            throw new IllegalArgumentException("empty segment");
        }
        String norm = encodedSegment.trim().replace(' ', '+');
        try {
            return Base64.getUrlDecoder().decode(norm);
        } catch (IllegalArgumentException ignored) {
            String std = norm.replace('-', '+').replace('_', '/');
            int pad = (4 - std.length() % 4) % 4;
            StringBuilder sb = new StringBuilder(std);
            for (int i = 0; i < pad; i++) {
                sb.append('=');
            }
            return Base64.getDecoder().decode(sb.toString());
        }
    }

    /**
     * OAuth state (복합: base64url(tenant).nonce 또는 nonce 단일) 파싱 결과.
     *
     * @param tenantId 복합 형식에서만 비어 있지 않음
     * @param nonceOrFull 복합 성공 시 dot 뒤 nonce, 그 외에는 정규화된 전체 state
     */
    static final class OAuthCompositeState {
        final String tenantId;
        final String nonceOrFull;

        OAuthCompositeState(String tenantId, String nonceOrFull) {
            this.tenantId = tenantId;
            this.nonceOrFull = nonceOrFull;
        }
    }

    /**
     * Naver/Kakao 등에서 공통으로 쓰는 {@code {base64url(tenant)}.{nonce}} state 파싱.
     *
     * @param state {@link #normalizeOAuth2StateQueryValue(String)} 적용 권장
     * @return tenant 미디코드 시 tenantId 는 null, nonceOrFull 은 판단용 전체 문자열
     */
    static OAuthCompositeState parseCompositeOAuthState(String state) {
        String normalized = normalizeOAuth2StateQueryValue(state);
        if (normalized == null || normalized.isEmpty()) {
            return new OAuthCompositeState(null, null);
        }
        if (!normalized.contains(".")) {
            return new OAuthCompositeState(null, normalized);
        }
        String[] parts = normalized.split("\\.", 2);
        if (parts.length != 2 || parts[0].isEmpty()) {
            return new OAuthCompositeState(null, normalized);
        }
        try {
            byte[] raw = decodeOAuthStateTenantSegment(parts[0]);
            String tenant = new String(raw, StandardCharsets.UTF_8).trim();
            if (tenant.isEmpty()) {
                return new OAuthCompositeState(null, normalized);
            }
            return new OAuthCompositeState(tenant, parts[1]);
        } catch (Exception e) {
            return new OAuthCompositeState(null, normalized);
        }
    }

    /**
     * OAuth 콜백 CSRF: 세션의 state와 콜백 state 비교. 세션 소실({@code savedState==null})이면 통과.
     * 인가 응답과 콜백 간 state 문자열이 미세하게 달라도 nonce 구간이 일치하면 허용한다.
     */
    private static boolean prefixedOAuthSavedStateMatches(String savedState, String normalizedCallbackState,
            OAuthCompositeState parsed) {
        if (savedState == null) {
            return true;
        }
        if (normalizedCallbackState != null && savedState.equals(normalizedCallbackState)) {
            return true;
        }
        if (parsed.tenantId != null) {
            String nonce = parsed.nonceOrFull;
            if (nonce != null && savedState.endsWith("." + nonce)) {
                return true;
            }
            if (normalizedCallbackState != null && normalizedCallbackState.contains(".")
                    && savedState.contains(".")) {
                String cbNonce = normalizedCallbackState.split("\\.", 2)[1];
                String savedNonce = savedState.split("\\.", 2)[1];
                if (cbNonce.equals(savedNonce)) {
                    return true;
                }
            }
            return false;
        }
        return false;
    }

    /**
     * 콜백 Host/Forwarded-Host가 서브도메인 형태일 가능성이 있는지 여부만 기록용으로 판별 (호스트 문자열 원문은 로그에 남기지 않음).
     */
    private static boolean callbackHostSuggestsSubdomain(HttpServletRequest request) {
        String host = request.getHeader("X-Forwarded-Host");
        if (host == null || host.isEmpty()) {
            host = request.getHeader("Host");
        }
        if (host == null || host.isEmpty()) {
            return false;
        }
        String hostOnly = host.split(":")[0];
        long dotCount = hostOnly.chars().filter(c -> c == '.').count();
        return dotCount >= 2 || hostOnly.endsWith(".localhost") || hostOnly.endsWith(".127.0.0.1")
                || (hostOnly.contains("localhost") && hostOnly.contains("."));
    }

    /**
     * 웹 OAuth 로그인 성공 후 프론트 공통 콜백({@code /auth/oauth2/callback})용 쿼리.
     * {@code success=true}는 {@code OAuth2Callback}과 정합. 프로필 이미지는 Location 길이·민감도상 제외.
     *
     * @param user 로그인 사용자
     * @param provider SNS 제공자 식별 문자열
     * @param tenantIdForQuery 세션·헤더 정합용 테넌트 ID(없으면 생략)
     * @param providerUserIdOrNull SNS 측 사용자 ID(없으면 생략)
     * @return 선행 {@code ?} 없는 쿼리스트링
     */
    private String buildOAuthWebCallbackQueryString(User user, String provider, String tenantIdForQuery,
            String providerUserIdOrNull) {
        String email = user.getEmail() != null ? user.getEmail() : "";
        String name = user.getName() != null ? user.getName() : "";
        String nickname = user.getNickname() != null ? user.getNickname() : "";
        String roleValue = user.getRole() != null ? user.getRole().getValue() : "";
        StringBuilder sb = new StringBuilder();
        sb.append("success=true");
        sb.append("&userId=").append(user.getId());
        sb.append("&email=").append(URLEncoder.encode(email, StandardCharsets.UTF_8));
        sb.append("&name=").append(URLEncoder.encode(name, StandardCharsets.UTF_8));
        sb.append("&nickname=").append(URLEncoder.encode(nickname, StandardCharsets.UTF_8));
        sb.append("&role=").append(URLEncoder.encode(roleValue, StandardCharsets.UTF_8));
        sb.append("&provider=").append(URLEncoder.encode(provider, StandardCharsets.UTF_8));
        if (tenantIdForQuery != null && !tenantIdForQuery.isBlank()) {
            sb.append("&tenantId=").append(URLEncoder.encode(tenantIdForQuery.trim(), StandardCharsets.UTF_8));
        }
        if (providerUserIdOrNull != null && !providerUserIdOrNull.isBlank()) {
            sb.append("&providerUserId=").append(
                    URLEncoder.encode(providerUserIdOrNull.trim(), StandardCharsets.UTF_8));
        }
        return sb.toString();
    }

    /**
     * 마이페이지 소셜 연동(link) 콜백 URL. 프론트 {@code MyPage}는 {@code link=success|error}, {@code message}, {@code provider}를 사용한다.
     *
     * @param frontendBase 테넌트별 프론트 베이스 URL
     * @param ok 연동 성공 여부
     * @param providerUpper 예: NAVER, KAKAO
     * @param message 사용자에게 표시할 메시지(비어 있으면 상수 기본값)
     */
    private String buildMypageOAuthLinkLocation(String frontendBase, boolean ok, String providerUpper,
            String message) {
        String resolved = message;
        if (resolved == null || resolved.isBlank()) {
            resolved = ok ? OAuth2UserFacingMessages.ERR_ACCOUNT_LINK_COMPLETE
                    : OAuth2UserFacingMessages.ERR_ACCOUNT_LINK_FAILED;
        }
        return frontendBase + "/mypage?tab=social&link=" + (ok ? "success" : "error") + "&message="
                + URLEncoder.encode(resolved, StandardCharsets.UTF_8) + "&provider="
                + URLEncoder.encode(providerUpper, StandardCharsets.UTF_8);
    }

    /**
     * 모바일 Deep Link용 OAuth 성공 쿼리 (프로필 이미지 미포함).
     *
     * @param providerLiteral 예: {@code NAVER}, {@code KAKAO}
     */
    private String buildMindGardenOAuthDeepLinkUrl(String providerLiteral, User user,
            String sessionId) {
        return "mindgarden://oauth/callback?" + "success=true" + "&provider=" + providerLiteral
                + "&userId=" + user.getId() + "&email="
                + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8) + "&name="
                + URLEncoder.encode(user.getName(), StandardCharsets.UTF_8) + "&nickname="
                + URLEncoder.encode(
                        user.getNickname() != null ? user.getNickname() : "",
                        StandardCharsets.UTF_8)
                + "&role=" + user.getRole() + "&sessionId=" + sessionId;
    }

    private static String profileImageUrlLogSummary(String profileImageUrl) {
        if (profileImageUrl == null || profileImageUrl.isEmpty()) {
            return "absent";
        }
        int len = profileImageUrl.length();
        boolean dataUrl = profileImageUrl.regionMatches(true, 0, "data:", 0, 5);
        return String.format("len=%d,dataUrl=%b", len, dataUrl);
    }

    /**
     * OAuth 리다이렉트 Location 전체를 INFO에 남기지 않고 요약만 기록한다.
     */
    private void logOAuthRedirectLocationSummary(String contextLabel, String redirectUrl) {
        if (redirectUrl == null) {
            log.info("{} 리다이렉트 요약: (null)", contextLabel);
            return;
        }
        try {
            URI uri = URI.create(redirectUrl);
            String rawQuery = uri.getRawQuery();
            String keys = "";
            if (rawQuery != null && !rawQuery.isEmpty()) {
                keys = Arrays.stream(rawQuery.split("&")).map(p -> {
                    int eq = p.indexOf('=');
                    return eq >= 0 ? p.substring(0, eq) : p;
                }).distinct().collect(Collectors.joining(","));
            }
            log.info(
                    "{} 리다이렉트 요약: length={}, scheme={}, host={}, path={}, queryKeys=[{}]",
                    contextLabel, redirectUrl.length(), uri.getScheme(), uri.getHost(),
                    uri.getPath(), keys);
        } catch (Exception e) {
            log.info("{} 리다이렉트 요약: length={}, parseError={}", contextLabel,
                    redirectUrl.length(), e.toString());
        }
    }

    /**
     * 계정 연동(link) 시 SNS 제공자의 사용자 식별자. UserInfo에 채워진 값 또는 authenticateWithCode 경로의
     * {@link SocialLoginResponse#getSocialAccountInfo()}를 사용한다.
     *
     * @param response OAuth 응답(소셜 계정 메타 포함 가능)
     * @param userInfo 앱 사용자 요약(선택 필드 providerUserId)
     * @return 비어 있지 않은 provider 측 ID, 없으면 null
     */
    private String resolveOAuthProviderUserIdForLink(SocialLoginResponse response,
            SocialLoginResponse.UserInfo userInfo) {
        if (userInfo != null && userInfo.getProviderUserId() != null
                && !userInfo.getProviderUserId().isBlank()) {
            return userInfo.getProviderUserId().trim();
        }
        if (response != null && response.getSocialAccountInfo() != null) {
            String pid = response.getSocialAccountInfo().getProviderUserId();
            if (pid != null && !pid.isBlank()) {
                return pid.trim();
            }
        }
        return null;
    }

    /**
     * SNS 계정 연동(link) 콜백은 보통 메인 도메인(api 호스트)으로 들어오므로, 마이페이지 등으로 돌려보낼 때 테넌트 서브도메인을 복원합니다.
     */
    private String getTenantAwareFrontendBaseUrlForSnsLinkRedirect(HttpServletRequest request,
            HttpSession session, String state, User sessionUser) {
        String tenantId = null;
        if (sessionUser != null && sessionUser.getTenantId() != null
                && !sessionUser.getTenantId().isBlank()) {
            tenantId = sessionUser.getTenantId().trim();
        }
        if (tenantId == null || tenantId.isEmpty()) {
            String holderId = com.coresolution.core.context.TenantContextHolder.getTenantId();
            if (holderId != null && !holderId.isBlank()) {
                tenantId = holderId.trim();
            }
        }
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = resolveTenantIdForRedirect(session, state);
        }
        if ((tenantId == null || tenantId.isEmpty()) && session != null) {
            try {
                String tid = (String) session.getAttribute("tenantId");
                if (tid != null && !tid.isBlank()) {
                    tenantId = tid.trim();
                }
            } catch (Exception ignored) {
                // ignore
            }
        }
        return getTenantAwareFrontendBaseUrl(request, tenantId);
    }

    /**
     * OAuth 콜백·세션 복구 시 User PK 조회에 쓰는 tenantId.
     * 우선순위는 {@link #resolveTenantIdForRedirect}와 동일(state·세션 oauth2_tenant_id·TenantContextHolder).
     * AbstractOAuth2Service와 동일한 보안 원칙: tenant 미결정 시 PK 단독 조회로 타 테넌트 사용자 노출을 금지.
     * 로컬 개발에서만 {@code local.default-tenant-id} 최소 폴백.
     *
     * @param session HTTP 세션(없으면 null)
     * @param state OAuth state(없으면 null)
     * @return 결정된 tenantId, 없으면 null
     */
    private String resolveTenantIdForUserLookup(HttpSession session, String state) {
        String tenantId = resolveTenantIdForRedirect(session, state);
        if (tenantId != null && !tenantId.isEmpty()) {
            return tenantId;
        }
        if (localDefaultTenantId != null && !localDefaultTenantId.trim().isEmpty()) {
            log.warn(
                    "⚠️ OAuth 사용자 조회: tenant 미결정 → local.default-tenant-id 폴백 (개발 전용, 운영에서는 state/세션/서브도메인 필수)");
            return localDefaultTenantId.trim();
        }
        return null;
    }

    /**
     * 테넌트 결합 PK로 사용자 조회. Holder에 tenant가 있으면 state/세션과 일치할 때만 허용.
     *
     * @param userId 사용자 PK
     * @param session 세션
     * @param state OAuth state(모바일 등 없으면 null)
     * @return 격리된 사용자, 실패 시 empty
     */
    private Optional<User> loadUserByTenantScopedId(Long userId, HttpSession session,
            String state) {
        String resolvedTenant = resolveTenantIdForUserLookup(session, state);
        if (resolvedTenant == null || resolvedTenant.isEmpty()) {
            log.error(
                    "❌ OAuth 사용자 조회 거부: tenantId 미결정 (PK 단독 조회 불가). userId={}",
                    userId);
            return Optional.empty();
        }
        String holderTenant = com.coresolution.core.context.TenantContextHolder.getTenantId();
        if (holderTenant != null && !holderTenant.isEmpty()
                && !holderTenant.equals(resolvedTenant)) {
            log.error(
                    "❌ OAuth 사용자 조회 거부: TenantContextHolder({})와 state/세션 tenant({}) 불일치, userId={}",
                    holderTenant, resolvedTenant, userId);
            return Optional.empty();
        }
        Optional<User> userOpt =
                userRepository.findByTenantIdAndIdIgnoringDeleted(resolvedTenant, userId);
        if (userOpt.isPresent()) {
            User u = userOpt.get();
            if (u.getTenantId() != null && !u.getTenantId().isEmpty()
                    && !resolvedTenant.equals(u.getTenantId())) {
                log.error(
                        "❌ OAuth 사용자 조회 거부: 엔티티 tenantId({})와 조회 tenant({}) 불일치, userId={}",
                        u.getTenantId(), resolvedTenant, userId);
                return Optional.empty();
            }
        }
        return userOpt;
    }

    @GetMapping("/oauth2/kakao/authorize")
    public ResponseEntity<?> kakaoAuthorize(@RequestParam(required = false) String mode,
            @RequestParam(required = false) String client, HttpServletRequest request,
            HttpSession session) {
        try {
            // 서브도메인에서 tenant_id 추출 (state 생성 전에 추출)
            // 카카오 콜백은 메인 도메인으로 고정되는 경우가 많아
            // 콜백 시점에 Host 기반 tenant 추출이 불가능할 수 있으므로 state에 tenantId를 인코딩하여 포함합니다.
            String tenantId = extractTenantIdFromSubdomain(request);
            if ((tenantId == null || tenantId.isEmpty()) && session != null) {
                // 메인 도메인에서 로그인 시작하는 케이스(서브도메인 없음)에서는 세션의 tenantId도 확인
                tenantId = (String) session.getAttribute("tenantId");
                if (tenantId == null || tenantId.isEmpty()) {
                    tenantId = (String) session.getAttribute("oauth2_tenant_id");
                }
            }

            // 로컬 프로파일에서만 기본 테넌트 사용 (개발/운영 환경에서는 서브도메인 필수)
            if (tenantId == null || tenantId.isEmpty()) {
                // Spring Profile 확인 (로컬 환경만)
                boolean isLocalProfile = isLocalProfile();
                String host = request.getHeader("Host");
                if (host == null || host.isEmpty()) {
                    host = request.getHeader("X-Forwarded-Host");
                }
                boolean isLocalhost = host != null && (host.contains("localhost") || host.contains("127.0.0.1"));
                
                // 로컬 프로파일이고 localhost인 경우에만 기본 테넌트 사용
                if (isLocalProfile && isLocalhost && localDefaultTenantId != null && !localDefaultTenantId.isEmpty()) {
                    tenantId = localDefaultTenantId;
                    log.info("로컬 프로파일 감지 - 기본 테넌트 사용: tenantId={}", tenantId);
                } else if (isLocalProfile && isLocalhost) {
                    // 로컬 프로파일이지만 기본 테넌트가 설정되지 않은 경우
                    log.warn("로컬 환경에서 테넌트 정보가 없습니다. local.default-tenant-id 또는 LOCAL_DEFAULT_TENANT_ID 환경 변수를 설정해주세요.");
                    return badRequest(OAuth2UserFacingMessages.MSG_TENANT_INFO_MISSING_LOCAL,
                            "TENANT_REQUIRED");
                } else {
                    // 개발/운영 환경에서는 서브도메인 필수
                    return badRequest(OAuth2UserFacingMessages.MSG_TENANT_INFO_MISSING_SUBDOMAIN,
                            "TENANT_REQUIRED");
                }
            }

            // state 생성: tenantId가 있으면 base64로 인코딩하여 포함 (세션/도메인에 의존하지 않도록)
            String state = UUID.randomUUID().toString();
            if (tenantId != null && !tenantId.isEmpty()) {
                String encodedTenantId = java.util.Base64.getUrlEncoder().withoutPadding()
                        .encodeToString(tenantId.getBytes(StandardCharsets.UTF_8));
                state = encodedTenantId + "." + state;
                log.info("카카오 OAuth2 - state에 tenantId 인코딩: tenantId={}, encodedState={}", tenantId,
                        state);
                // 호환성 유지: 세션에도 tenantId 저장
                if (session != null) {
                    session.setAttribute("oauth2_tenant_id", tenantId);
                }
            }

            if (session != null) {
                session.setAttribute("oauth2_kakao_state", state);
                storeOAuth2AuthorizeMode(session, mode, SESSION_ATTR_OAUTH2_KAKAO_MODE);
            }

            // 모바일 클라이언트인 경우 Redis에 저장 (세션 의존성 제거)
            if ("mobile".equals(client)) {
                String cacheKey = "oauth2_kakao_client:" + state;
                // cacheService.put(cacheKey, "mobile", 300); // 5분 TTL - 캐시 서비스 임시 비활성화
                log.info("카카오 OAuth2 - 모바일 클라이언트 감지 (Redis 저장): state={}", state);
            }

            // 콜백 URL 동적 생성 (서브도메인은 메인 도메인으로 변환 - 카카오 개발자 센터 등록 문제 해결)
            String callbackUrl = null;
            try {
                // 프록시 헤더 확인 (X-Forwarded-Proto, X-Forwarded-Host)
                // Nginx를 통해 들어온 요청은 X-Forwarded-Host를 우선 확인
                String requestScheme = resolveExternalScheme(request);

                // X-Forwarded-Host 우선 확인 (Nginx를 통해 들어온 요청)
                String requestHost = request.getHeader("X-Forwarded-Host");
                if (requestHost == null || requestHost.isEmpty()) {
                    // X-Forwarded-Host가 없으면 Host 헤더 확인
                    requestHost = request.getHeader("Host");
                }

                // 로컬 환경에서 프론트엔드 프록시를 통해 온 경우 처리
                if (requestHost != null && requestHost.contains("localhost")
                        && !requestHost.contains(":8080")) {
                    // 프론트엔드(localhost:3000)에서 프록시로 온 경우, 실제 백엔드 주소 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                } else if (requestHost == null || requestHost.isEmpty()) {
                    // Host 헤더도 없으면 서버 정보 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                }

                // 서브도메인을 메인 도메인으로 변환 (설정 파일 기반)
                if (requestHost != null && !requestHost.isEmpty()) {
                    String hostWithoutPort = requestHost.split(":")[0];
                    String mainDomain = oauth2DomainUtil.convertToMainDomain(hostWithoutPort);

                    // 포트 처리
                    String portSuffix = "";
                    if (requestHost.contains(":")) {
                        String port = requestHost.split(":")[1];
                        if (!port.equals("80") && !port.equals("443")) {
                            portSuffix = ":" + port;
                        }
                    } else {
                        // 프록시를 통해 들어온 경우 포트는 헤더에서 확인
                        String forwardedPort = request.getHeader("X-Forwarded-Port");
                        if (forwardedPort != null && !forwardedPort.isEmpty()) {
                            int port = Integer.parseInt(forwardedPort);
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        } else {
                            int port = request.getServerPort();
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        }
                    }

                    callbackUrl =
                            requestScheme + "://" + mainDomain + portSuffix + kakaoCallbackPath;
                    log.info(
                            "카카오 OAuth2 - 동적 redirect URI 생성: {} (원본 host={}, scheme={}, forwardedProto={}, forwardedHost={})",
                            callbackUrl, requestHost, request.getScheme(),
                            request.getHeader("X-Forwarded-Proto"),
                            request.getHeader("X-Forwarded-Host"));
                }
            } catch (Exception e) {
                log.error("카카오 OAuth2 - redirect URI 동적 생성 실패", e);
            }

            if (callbackUrl == null || callbackUrl.isEmpty()) {
                // 폴백: 설정값 사용
                callbackUrl = kakaoRedirectUri;
                log.warn("카카오 OAuth2 - 동적 생성 실패, 설정값 사용: {}", callbackUrl);
            }

            String authUrl = "https://kauth.kakao.com/oauth/authorize?" + "client_id="
                    + kakaoClientId + "&redirect_uri="
                    + URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8) + "&response_type=code"
                    + "&scope=" + kakaoScope + "&state="
                    + URLEncoder.encode(state, StandardCharsets.UTF_8).replace("+", "%20");

            Map<String, Object> data = new HashMap<>();
            data.put("authUrl", authUrl);
            data.put("provider", "KAKAO");
            data.put("state", state);

            return success(data);
        } catch (Exception e) {
            log.error("카카오 OAuth2 인증 URL 생성 실패", e);
            throw new RuntimeException(String.format(
                    OAuth2UserFacingMessages.MSG_KAKAO_OAUTH_AUTH_URL_FAILED_FMT, e.getMessage()));
        }
    }

    /**
     * Google OAuth2 server-side auth-code 흐름의 authorize URL 생성. 카카오/네이버와 동일한
     * 패턴으로 state 에 base64url(tenantId) 를 인코딩하고 redirect_uri 는 apex 호스트로 변환하여
     * 메인 도메인 1개에 등록된 redirect_uri 와 일치시킨다.
     *
     * <p>Google Cloud Console Web Client 는 JavaScript origins 와 redirect URIs 모두에서
     * 와일드카드를 지원하지 않으므로(`origin_mismatch`), redirect_uri 는 apex 1개만 등록한다.
     * 테넌트는 state 의 base64 prefix 로 복원되며, 콜백 단계에서 TenantContextHolder 에 설정된다.</p>
     *
     * @param mode {@code login} 또는 {@code link}
     * @param client {@code mobile} 시 Redis 에 클라이언트 정보 저장 (콜백 분기용)
     * @return {@code authUrl}, {@code provider}, {@code state} 를 포함한 ApiResponse
     */
    @GetMapping("/oauth2/google/authorize")
    public ResponseEntity<?> googleAuthorize(@RequestParam(required = false) String mode,
            @RequestParam(required = false) String client, HttpServletRequest request,
            HttpSession session) {
        try {
            // 서브도메인에서 tenant_id 추출 (state 생성 전에 추출)
            String tenantId = extractTenantIdFromSubdomain(request);
            if ((tenantId == null || tenantId.isEmpty()) && session != null) {
                tenantId = (String) session.getAttribute("tenantId");
                if (tenantId == null || tenantId.isEmpty()) {
                    tenantId = (String) session.getAttribute("oauth2_tenant_id");
                }
            }

            // 로컬 프로파일에서만 기본 테넌트 사용 (개발/운영 환경에서는 서브도메인 필수)
            if (tenantId == null || tenantId.isEmpty()) {
                boolean isLocalProfile = isLocalProfile();
                String host = request.getHeader("Host");
                if (host == null || host.isEmpty()) {
                    host = request.getHeader("X-Forwarded-Host");
                }
                boolean isLocalhost = host != null
                        && (host.contains("localhost") || host.contains("127.0.0.1"));

                if (isLocalProfile && isLocalhost && localDefaultTenantId != null
                        && !localDefaultTenantId.isEmpty()) {
                    tenantId = localDefaultTenantId;
                    log.info("Google OAuth2 - 로컬 프로파일 감지, 기본 테넌트 사용: tenantId={}", tenantId);
                } else if (isLocalProfile && isLocalhost) {
                    log.warn("로컬 환경에서 테넌트 정보가 없습니다. local.default-tenant-id 또는 LOCAL_DEFAULT_TENANT_ID 환경 변수를 설정해주세요.");
                    return badRequest(OAuth2UserFacingMessages.MSG_TENANT_INFO_MISSING_LOCAL,
                            "TENANT_REQUIRED");
                } else {
                    return badRequest(OAuth2UserFacingMessages.MSG_TENANT_INFO_MISSING_SUBDOMAIN,
                            "TENANT_REQUIRED");
                }
            }

            // state 생성: base64url(tenantId) + "." + UUID nonce — 카카오/네이버 공통 형식
            String state = UUID.randomUUID().toString();
            if (tenantId != null && !tenantId.isEmpty()) {
                String encodedTenantId = java.util.Base64.getUrlEncoder().withoutPadding()
                        .encodeToString(tenantId.getBytes(StandardCharsets.UTF_8));
                state = encodedTenantId + "." + state;
                log.info("Google OAuth2 - state에 tenantId 인코딩: tenantId={}, encodedStateLen={}",
                        tenantId, state.length());
                if (session != null) {
                    session.setAttribute("oauth2_tenant_id", tenantId);
                }
            }

            if (session != null) {
                session.setAttribute("oauth2_google_state", state);
                storeOAuth2AuthorizeMode(session, mode, SESSION_ATTR_OAUTH2_GOOGLE_MODE);
            }

            if ("mobile".equals(client)) {
                log.info("Google OAuth2 - 모바일 클라이언트 감지 (Redis 저장 보류): state={}", state);
            }

            // 콜백 URL 동적 생성: 서브도메인을 apex 메인 도메인으로 변환 (Google Cloud Console
            // 의 Authorized redirect URIs 와 일치시키기 위함). 카카오/네이버와 동일한 변환 로직.
            String callbackUrl = buildGoogleCallbackUrl(request);

            if (callbackUrl == null || callbackUrl.isEmpty()) {
                callbackUrl = googleRedirectUri;
                log.warn("Google OAuth2 - 동적 redirect_uri 생성 실패, 설정값 사용: {}", callbackUrl);
            }

            if (googleClientId == null || googleClientId.isEmpty()) {
                log.error("Google OAuth2 - GOOGLE_CLIENT_ID 가 주입되지 않았습니다.");
                return badRequest(OAuth2UserFacingMessages.MSG_AUTH_PROCESSING_FAILED,
                        "GOOGLE_CLIENT_ID_MISSING");
            }

            String authUrl = "https://accounts.google.com/o/oauth2/v2/auth?"
                    + "client_id=" + googleClientId
                    + "&redirect_uri="
                    + URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8)
                    + "&response_type=code"
                    + "&scope="
                    + URLEncoder.encode(googleScope, StandardCharsets.UTF_8).replace("+", "%20")
                    + "&access_type=online"
                    + "&prompt=select_account"
                    + "&include_granted_scopes=true"
                    + "&state="
                    + URLEncoder.encode(state, StandardCharsets.UTF_8).replace("+", "%20");

            log.info("Google OAuth2 인증 URL 생성: redirect_uri={}, stateLen={}",
                    callbackUrl, state.length());

            Map<String, Object> data = new HashMap<>();
            data.put("authUrl", authUrl);
            data.put("provider", "GOOGLE");
            data.put("state", state);

            return success(data);
        } catch (Exception e) {
            log.error("Google OAuth2 인증 URL 생성 실패", e);
            throw new RuntimeException(String.format(
                    OAuth2UserFacingMessages.MSG_GOOGLE_OAUTH_AUTH_URL_FAILED_FMT, e.getMessage()));
        }
    }

    /**
     * Google OAuth2 콜백 URL 동적 생성 — 카카오/네이버와 동일한 mainDomain 변환 로직을 사용한다.
     *
     * <p>운영(prod): 테넌트 서브도메인(`mindgarden.core-solution.co.kr`) → apex
     * (`core-solution.co.kr`) 로 변환하여 Google Cloud Console 에 등록된 단일 redirect_uri 와
     * 일치시킨다. 로컬·개발(localhost / dev.core-solution.co.kr) 도 동일 패턴으로 동작한다.</p>
     *
     * @param request 현재 요청 (proxy 헤더 분석에 사용)
     * @return apex 기반 redirect_uri 또는 빈 문자열(추론 실패)
     */
    private String buildGoogleCallbackUrl(HttpServletRequest request) {
        try {
            String requestScheme = resolveExternalScheme(request);

            String requestHost = request.getHeader("X-Forwarded-Host");
            if (requestHost == null || requestHost.isEmpty()) {
                requestHost = request.getHeader("Host");
            }

            if (requestHost != null && requestHost.contains("localhost")
                    && !requestHost.contains(":8080")) {
                requestHost = request.getServerName() + ":" + request.getServerPort();
            } else if (requestHost == null || requestHost.isEmpty()) {
                requestHost = request.getServerName() + ":" + request.getServerPort();
            }

            if (requestHost == null || requestHost.isEmpty()) {
                return "";
            }

            String hostWithoutPort = requestHost.split(":")[0];
            String mainDomain = oauth2DomainUtil.convertToMainDomain(hostWithoutPort);

            String portSuffix = "";
            if (requestHost.contains(":")) {
                String port = requestHost.split(":")[1];
                if (!port.equals("80") && !port.equals("443")) {
                    portSuffix = ":" + port;
                }
            } else {
                String forwardedPort = request.getHeader("X-Forwarded-Port");
                if (forwardedPort != null && !forwardedPort.isEmpty()) {
                    int port = Integer.parseInt(forwardedPort);
                    if (port != 80 && port != 443) {
                        portSuffix = ":" + port;
                    }
                } else {
                    int port = request.getServerPort();
                    if (port != 80 && port != 443) {
                        portSuffix = ":" + port;
                    }
                }
            }

            return requestScheme + "://" + mainDomain + portSuffix + googleCallbackPath;
        } catch (Exception e) {
            log.error("Google OAuth2 - redirect_uri 동적 생성 실패", e);
            return "";
        }
    }

    @GetMapping("/oauth2/naver/authorize")
    public ResponseEntity<?> naverAuthorize(@RequestParam(required = false) String mode,
            @RequestParam(required = false) String client, HttpServletRequest request,
            HttpSession session) {
        try {
            // 서브도메인에서 tenant_id 추출 (state 생성 전에 추출)
            String tenantId = extractTenantIdFromSubdomain(request);

            // 서브도메인에서 추출하지 못한 경우 세션에서 확인 (메인 도메인에서 로그인할 때)
            if (tenantId == null || tenantId.isEmpty()) {
                if (session != null) {
                    tenantId = (String) session.getAttribute("tenantId");
                    if (tenantId == null || tenantId.isEmpty()) {
                        tenantId = (String) session.getAttribute("oauth2_tenant_id");
                    }
                    if (tenantId != null && !tenantId.isEmpty()) {
                        log.info("네이버 OAuth2 - 세션에서 tenant_id 추출: tenantId={}", tenantId);
                    }
                }
            }

            // 로컬 프로파일에서만 기본 테넌트 사용 (개발/운영 환경에서는 서브도메인 필수)
            if (tenantId == null || tenantId.isEmpty()) {
                // Spring Profile 확인 (로컬 환경만)
                boolean isLocalProfile = isLocalProfile();
                String host = request.getHeader("Host");
                if (host == null || host.isEmpty()) {
                    host = request.getHeader("X-Forwarded-Host");
                }
                boolean isLocalhost = host != null && (host.contains("localhost") || host.contains("127.0.0.1"));
                
                // 로컬 프로파일이고 localhost인 경우에만 기본 테넌트 사용
                if (isLocalProfile && isLocalhost && localDefaultTenantId != null && !localDefaultTenantId.isEmpty()) {
                    tenantId = localDefaultTenantId;
                    log.info("로컬 프로파일 감지 - 기본 테넌트 사용: tenantId={}", tenantId);
                } else if (isLocalProfile && isLocalhost) {
                    // 로컬 프로파일이지만 기본 테넌트가 설정되지 않은 경우
                    log.warn("로컬 환경에서 테넌트 정보가 없습니다. local.default-tenant-id 또는 LOCAL_DEFAULT_TENANT_ID 환경 변수를 설정해주세요.");
                    return badRequest(OAuth2UserFacingMessages.MSG_TENANT_INFO_MISSING_LOCAL,
                            "TENANT_REQUIRED");
                } else {
                    // 개발/운영 환경에서는 서브도메인 필수
                    return badRequest(OAuth2UserFacingMessages.MSG_TENANT_INFO_MISSING_SUBDOMAIN,
                            "TENANT_REQUIRED");
                }
            }

            // state 생성: tenantId가 있으면 base64로 인코딩하여 포함 (세션과 무관하게 조회 가능)
            String state = UUID.randomUUID().toString();
            if (tenantId != null && !tenantId.isEmpty()) {
                // state에 tenantId를 base64로 인코딩하여 포함
                String encodedTenantId = java.util.Base64.getUrlEncoder().withoutPadding()
                        .encodeToString(tenantId.getBytes(StandardCharsets.UTF_8));
                state = encodedTenantId + "." + state;
                log.info("네이버 OAuth2 - state에 tenantId 인코딩: tenantId={}, encodedState={}", tenantId,
                        state);
            }

            session.setAttribute("oauth2_naver_state", state);
            storeOAuth2AuthorizeMode(session, mode, SESSION_ATTR_OAUTH2_NAVER_MODE);
            // 네이버 인증 URL 생성 시 사용한 redirect_uri를 세션에 저장 (콜백에서 일치 여부 확인용)

            // 세션에도 저장 (기존 호환성 유지)
            if (tenantId != null && !tenantId.isEmpty()) {
                session.setAttribute("oauth2_tenant_id", tenantId);
                // state와 함께 tenantId도 세션에 저장 (콜백에서 state로 조회 가능하도록)
                session.setAttribute("oauth2_naver_tenant_id_" + state, tenantId);
                log.info("네이버 OAuth2 - tenant_id 추출 완료: tenantId={}, state={}, source={}", tenantId,
                        state, extractTenantIdFromSubdomain(request) != null ? "서브도메인" : "세션");
            }

            // 모바일 클라이언트인 경우 Redis에 저장 (세션 의존성 제거)
            if ("mobile".equals(client)) {
                String cacheKey = "oauth2_naver_client:" + state;
                // cacheService.put(cacheKey, "mobile", 300); // 5분 TTL - 캐시 서비스 임시 비활성화
                log.info("네이버 OAuth2 - 모바일 클라이언트 감지 (Redis 저장): state={}", state);
            }

            // 콜백 URL 동적 생성 (서브도메인은 메인 도메인으로 변환 - 카카오와 동일한 로직)
            String callbackUrl = null;
            try {
                // 프록시 헤더 확인 (X-Forwarded-Proto, X-Forwarded-Host)
                // Nginx를 통해 들어온 요청은 X-Forwarded-Host를 우선 확인
                String requestScheme = resolveExternalScheme(request);

                // X-Forwarded-Host 우선 확인 (Nginx를 통해 들어온 요청)
                String requestHost = request.getHeader("X-Forwarded-Host");
                if (requestHost == null || requestHost.isEmpty()) {
                    // X-Forwarded-Host가 없으면 Host 헤더 확인
                    requestHost = request.getHeader("Host");
                }

                // 로컬 환경에서 프론트엔드 프록시를 통해 온 경우 처리
                if (requestHost != null && requestHost.contains("localhost")
                        && !requestHost.contains(":8080")) {
                    // 프론트엔드(localhost:3000)에서 프록시로 온 경우, 실제 백엔드 주소 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                } else if (requestHost == null || requestHost.isEmpty()) {
                    // Host 헤더도 없으면 서버 정보 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                }

                // 서브도메인을 메인 도메인으로 변환 (설정 파일 기반, 카카오와 동일)
                if (requestHost != null && !requestHost.isEmpty()) {
                    String hostWithoutPort = requestHost.split(":")[0];
                    String mainDomain = oauth2DomainUtil.convertToMainDomain(hostWithoutPort);

                    // 포트 처리
                    String portSuffix = "";
                    if (requestHost.contains(":")) {
                        String port = requestHost.split(":")[1];
                        if (!port.equals("80") && !port.equals("443")) {
                            portSuffix = ":" + port;
                        }
                    } else {
                        // 프록시를 통해 들어온 경우 포트는 헤더에서 확인
                        String forwardedPort = request.getHeader("X-Forwarded-Port");
                        if (forwardedPort != null && !forwardedPort.isEmpty()) {
                            int port = Integer.parseInt(forwardedPort);
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        } else {
                            int port = request.getServerPort();
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        }
                    }

                    callbackUrl =
                            requestScheme + "://" + mainDomain + portSuffix + naverCallbackPath;
                    log.info(
                            "네이버 OAuth2 - 동적 redirect URI 생성: {} (원본 host={}, scheme={}, forwardedProto={}, forwardedHost={})",
                            callbackUrl, requestHost, request.getScheme(),
                            request.getHeader("X-Forwarded-Proto"),
                            request.getHeader("X-Forwarded-Host"));
                }
            } catch (Exception e) {
                log.error("네이버 OAuth2 - redirect URI 동적 생성 실패", e);
            }

            if (callbackUrl == null || callbackUrl.isEmpty()) {
                // 폴백: 설정값 사용
                callbackUrl = naverRedirectUri;
                log.warn("네이버 OAuth2 - 동적 생성 실패, 설정값 사용: {}", callbackUrl);
            }

            log.info("네이버 OAuth2 인증 URL 생성: client_id={}, redirect_uri={}, state={}", naverClientId,
                    callbackUrl, state);

            // 네이버 인증 URL 생성 시 사용한 redirect_uri를 세션에 저장 (콜백에서 일치 여부 확인용)
            session.setAttribute("oauth2_naver_redirect_uri", callbackUrl);
            log.info("네이버 OAuth2 - 세션에 redirect_uri 저장: {}", callbackUrl);

            String authUrl = "https://nid.naver.com/oauth2.0/authorize?" + "response_type=code"
                    + "&client_id=" + naverClientId + "&redirect_uri="
                    + URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8) + "&state="
                    + URLEncoder.encode(state, StandardCharsets.UTF_8).replace("+", "%20")
                    + "&scope=" + naverScope;

            Map<String, Object> data = new HashMap<>();
            data.put("authUrl", authUrl);
            data.put("provider", "NAVER");
            data.put("state", state);

            return success(data);
        } catch (Exception e) {
            log.error("네이버 OAuth2 인증 URL 생성 실패", e);
            throw new RuntimeException(String.format(
                    OAuth2UserFacingMessages.MSG_NAVER_OAUTH_AUTH_URL_FAILED_FMT, e.getMessage()));
        }
    }

    @GetMapping("/naver/callback")
    public ResponseEntity<?> naverCallback(@RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String mode, // 'login' 또는 'link'
            HttpServletRequest request, HttpSession session) {

        if (error != null) {
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302)
                    .header("Location", frontendUrl + "/login?error="
                            + URLEncoder.encode(error, StandardCharsets.UTF_8) + "&provider=NAVER")
                    .build();
        }

        if (code == null) {
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_NO_AUTH_CODE, StandardCharsets.UTF_8) + "&provider=NAVER")
                    .build();
        }

        String savedState = (String) session.getAttribute("oauth2_naver_state");
        String normalizedState = normalizeOAuth2StateQueryValue(state);
        OAuthCompositeState compositeState = parseCompositeOAuthState(normalizedState);
        String stateBasedTenantId = compositeState.tenantId;
        log.info("네이버 OAuth2 콜백 - state 검증: savedStatePresent={}, stateLen={}, sessionId={}",
                Boolean.valueOf(savedState != null), normalizedState != null ? normalizedState.length() : 0,
                session.getId());

        if (stateBasedTenantId != null) {
            log.info("네이버 OAuth2 콜백 - state에서 tenantId 디코딩 성공: tenantId={}, nonceLen={}",
                    stateBasedTenantId,
                    compositeState.nonceOrFull != null ? compositeState.nonceOrFull.length() : 0);
        } else if (normalizedState != null && normalizedState.contains(".")) {
            log.warn("⚠️ 네이버 OAuth2 콜백 - state에 '.'는 있으나 tenant 접두 디코딩 실패(형식 불일치 가능): prefix={}",
                    oauth2StateEncodedSegmentPrefixForLog(normalizedState));
        }

        if (!prefixedOAuthSavedStateMatches(savedState, normalizedState, compositeState)) {
            session.removeAttribute("oauth2_naver_state");
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_SECURITY_VERIFICATION_FAILED,
                                                    StandardCharsets.UTF_8) + "&provider=NAVER")
                    .build();
        }

        // 기존 방식: 세션에서 state로 tenantId 조회 (호환성 유지, stateBasedTenantId가 없는 경우에만)
        if (stateBasedTenantId == null && normalizedState != null) {
            String tenantIdKey = "oauth2_naver_tenant_id_" + normalizedState;
            stateBasedTenantId = (String) session.getAttribute(tenantIdKey);
            log.info(
                    "네이버 OAuth2 콜백 - 세션에서 state로 tenant_id 조회 시도: stateLen={}, tenantIdKeyFound={}, sessionId={}",
                    normalizedState.length(), Boolean.valueOf(stateBasedTenantId != null),
                    session.getId());
            if (stateBasedTenantId != null && !stateBasedTenantId.isEmpty()) {
                log.info("네이버 OAuth2 콜백 - 세션에서 state로 tenant_id 조회 성공: tenantId={}, stateLen={}",
                        stateBasedTenantId, normalizedState.length());
                session.removeAttribute(tenantIdKey);
            } else {
                log.warn("⚠️ 네이버 OAuth2 콜백 - state로 tenant_id를 찾지 못함: stateLen={}, sessionId={}",
                        normalizedState.length(), session.getId());
            }
        }

        if (savedState != null) {
            session.removeAttribute("oauth2_naver_state");
        }

        try {
            String callbackTenantId = extractTenantIdFromSubdomain(request);
            // state 단독 복구(세션·메인 도메인 콜백) 우선 — 서브도메인은 보조
            if (stateBasedTenantId != null && !stateBasedTenantId.isEmpty()) {
                com.coresolution.core.context.TenantContextHolder.setTenantId(stateBasedTenantId);
                log.info(
                        "네이버 OAuth2 콜백 - state 기반 tenant_id를 TenantContextHolder에 설정: tenantId={}",
                        stateBasedTenantId);
                if (callbackTenantId != null && !callbackTenantId.isEmpty()
                        && !callbackTenantId.equals(stateBasedTenantId)) {
                    log.warn(
                            "네이버 OAuth2 콜백 - state 기반 tenant와 서브도메인 기반 tenant 불일치, state 우선 적용: callbackHostSuggestsSubdomain={}",
                            Boolean.valueOf(callbackHostSuggestsSubdomain(request)));
                }
            } else if (callbackTenantId != null && !callbackTenantId.isEmpty()) {
                com.coresolution.core.context.TenantContextHolder.setTenantId(callbackTenantId);
                log.info(
                        "네이버 OAuth2 콜백 - 서브도메인에서 tenant_id 추출 및 TenantContextHolder 설정: tenantId={}",
                        callbackTenantId);
            } else {
                if (!callbackHostSuggestsSubdomain(request)) {
                    log.info(
                            "네이버 OAuth2 콜백 - Host/Forwarded-Host가 서브도메인 형태로 보이지 않음(쿠키/프록시 환경에서 tenant 미결정 가능)");
                }
                // 서브도메인이 없으면 세션에서 tenant_id 확인 (카카오와 동일하게 tenantId 우선 확인)
                String sessionTenantId = (String) session.getAttribute("tenantId");
                if (sessionTenantId == null || sessionTenantId.isEmpty()) {
                    sessionTenantId = (String) session.getAttribute("oauth2_tenant_id");
                }
                if (sessionTenantId != null && !sessionTenantId.isEmpty()) {
                    com.coresolution.core.context.TenantContextHolder.setTenantId(sessionTenantId);
                    log.info(
                            "네이버 OAuth2 콜백 - 세션에서 tenant_id 추출 및 TenantContextHolder 설정: tenantId={}",
                            sessionTenantId);
                } else {
                    // tenantId를 찾을 수 없으면 오류 페이지로 리다이렉트 (테넌트 등록 필요)
                    log.warn(
                            "네이버 OAuth2 콜백 - tenant 미결정 직전 진단: stateLen={}, stateHasDot={}, "
                                    + "stateBasedTenantIdNonNull={}, savedStateNonNull={}, encodedSegmentPrefix={}, callbackHostSuggestsSubdomain={}",
                            normalizedState != null ? normalizedState.length() : 0,
                            Boolean.valueOf(normalizedState != null && normalizedState.contains(".")),
                            Boolean.valueOf(stateBasedTenantId != null),
                            Boolean.valueOf(savedState != null),
                            oauth2StateEncodedSegmentPrefixForLog(normalizedState),
                            Boolean.valueOf(callbackHostSuggestsSubdomain(request)));
                    log.error("❌ 네이버 OAuth2 콜백 - tenant_id를 찾을 수 없습니다. 테넌트 등록이 필요합니다.");
                    String redirectTenantId = resolveTenantIdForRedirect(session, state);
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                    return ResponseEntity.status(302)
                            .header("Location",
                                    frontendUrl + "/login?error="
                                            + URLEncoder.encode(
                                                    OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED,
                                                    StandardCharsets.UTF_8)
                                            + "&provider=NAVER")
                            .build();
                }
            }

            // TenantContextHolder에 tenantId가 설정되었는지 최종 확인
            String finalTenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
            if (finalTenantId == null || finalTenantId.isEmpty()) {
                log.warn(
                        "네이버 OAuth2 콜백 - TenantContext 미설정 직전 진단: stateLen={}, stateHasDot={}, "
                                + "stateBasedTenantIdNonNull={}, savedStateNonNull={}, encodedSegmentPrefix={}, callbackHostSuggestsSubdomain={}",
                        normalizedState != null ? normalizedState.length() : 0,
                        Boolean.valueOf(normalizedState != null && normalizedState.contains(".")),
                        Boolean.valueOf(stateBasedTenantId != null),
                        Boolean.valueOf(savedState != null),
                        oauth2StateEncodedSegmentPrefixForLog(normalizedState),
                        Boolean.valueOf(callbackHostSuggestsSubdomain(request)));
                log.error(
                        "❌ 네이버 OAuth2 콜백 - TenantContextHolder에 tenant_id가 설정되지 않았습니다. 테넌트 등록이 필요합니다.");
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                return ResponseEntity.status(302)
                        .header("Location",
                                frontendUrl + "/login?error="
                                        + URLEncoder.encode(OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED,
                                                StandardCharsets.UTF_8)
                                        + "&provider=NAVER")
                        .build();
            }

            // 모바일 클라이언트 정보를 Redis에서 조회 (state 기반)
            String savedClientType = null;
            if (normalizedState != null) {
                String cacheKey = "oauth2_naver_client:" + normalizedState;
                // java.util.Optional<String> clientTypeOpt = cacheService.get(cacheKey,
                // String.class); // 캐시 서비스 임시 비활성화
                java.util.Optional<String> clientTypeOpt = java.util.Optional.empty();
                if (clientTypeOpt.isPresent()) {
                    savedClientType = clientTypeOpt.get();
                    // cacheService.evict(cacheKey); // 사용 후 삭제 - 캐시 서비스 임시 비활성화
                    log.info("네이버 콜백 - Redis에서 모바일 클라이언트 정보 조회: clientType={}, stateLen={}",
                            savedClientType, normalizedState.length());
                } else {
                    // Redis에 없으면 세션에서도 확인 (기존 호환성)
                    savedClientType = (String) session.getAttribute("oauth2_client");
                    log.info("네이버 콜백 - Redis에서 찾지 못함, 세션에서 확인: clientType={}", savedClientType);
                }
            } else {
                // state가 없으면 세션에서 확인
                savedClientType = (String) session.getAttribute("oauth2_client");
                log.info("네이버 콜백 - state 없음, 세션에서 확인: clientType={}", savedClientType);
            }

            // 콜백 요청의 scheme과 host를 사용해서 redirect_uri 동적 생성 (필수, 프록시 헤더 고려)
            // 인증 URL 생성 시 사용한 redirect_uri와 일치시켜야 함
            // 카카오와 동일하게 OAuth2DomainUtil을 사용하여 서브도메인을 메인 도메인으로 변환
            String callbackRedirectUri = null;
            // requestScheme과 portSuffix는 try 블록 밖에서도 사용해야 하므로 먼저 선언
            String requestScheme = resolveExternalScheme(request);
            String portSuffix = "";
            try {
                // 프록시 헤더 확인 (X-Forwarded-Proto, X-Forwarded-Host)
                // Nginx를 통해 들어온 요청은 X-Forwarded-Host를 우선 확인

                // X-Forwarded-Host 우선 확인 (Nginx를 통해 들어온 요청)
                String requestHost = request.getHeader("X-Forwarded-Host");
                if (requestHost == null || requestHost.isEmpty()) {
                    // X-Forwarded-Host가 없으면 Host 헤더 확인
                    requestHost = request.getHeader("Host");
                }

                // 로컬 환경에서 프론트엔드 프록시를 통해 온 경우 처리
                if (requestHost != null && requestHost.contains("localhost")
                        && !requestHost.contains(":8080")) {
                    // 프론트엔드(localhost:3000)에서 프록시로 온 경우, 실제 백엔드 주소 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                } else if (requestHost == null || requestHost.isEmpty()) {
                    // Host 헤더도 없으면 서버 정보 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                }

                if (requestHost != null && !requestHost.isEmpty()) {
                    String hostWithoutPort = requestHost.split(":")[0];
                    // 서브도메인을 메인 도메인으로 변환 (설정 파일 기반)
                    String mainDomain = oauth2DomainUtil.convertToMainDomain(hostWithoutPort);

                    // 포트가 포함된 경우와 아닌 경우 모두 처리
                    // portSuffix는 이미 try 블록 밖에서 선언됨
                    if (requestHost.contains(":")) {
                        String port = requestHost.split(":")[1];
                        if (!port.equals("80") && !port.equals("443")) {
                            portSuffix = ":" + port;
                        }
                    } else {
                        // 프록시를 통해 들어온 경우 포트는 헤더에서 확인
                        String forwardedPort = request.getHeader("X-Forwarded-Port");
                        if (forwardedPort != null && !forwardedPort.isEmpty()) {
                            int port = Integer.parseInt(forwardedPort);
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        } else {
                            int port = request.getServerPort();
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        }
                    }

                    callbackRedirectUri =
                            requestScheme + "://" + mainDomain + portSuffix + naverCallbackPath;

                    log.info(
                            "네이버 콜백 - 동적 redirect_uri 생성: {} (scheme={}, originalHost={}, mainDomain={}, forwardedProto={}, forwardedHost={})",
                            callbackRedirectUri, requestScheme, requestHost, mainDomain,
                            request.getHeader("X-Forwarded-Proto"),
                            request.getHeader("X-Forwarded-Host"));
                }
            } catch (Exception e) {
                log.error("네이버 콜백 - redirect_uri 동적 생성 실패", e);
            }

            if (callbackRedirectUri == null || callbackRedirectUri.isEmpty()) {
                log.error(
                        "네이버 콜백 - redirect_uri를 생성할 수 없습니다. 요청 정보: scheme={}, host={}, serverName={}",
                        request.getScheme(), request.getHeader("Host"), request.getServerName());
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                        + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_SYSTEM_ERROR, StandardCharsets.UTF_8) + "&provider=NAVER")
                        .build();
            }

            // redirectUri를 전달하기 위해 NaverOAuth2ServiceImpl 직접 호출
            SocialLoginResponse response;
            try {
                OAuth2Service naverService = oauth2FactoryService.getOAuth2Service("NAVER");
                final boolean isNaverOAuthAccountLinkMode =
                        isOAuth2CallbackLinkMode(session, mode, SESSION_ATTR_OAUTH2_NAVER_MODE);
                if (callbackRedirectUri != null
                        && naverService instanceof com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl) {
                    com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl naverServiceImpl =
                            (com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl) naverService;

                    // 네이버 인증 URL 생성 시 사용한 redirect_uri와 비교
                    String savedRedirectUri =
                            (String) session.getAttribute("oauth2_naver_redirect_uri");
                    log.info(
                            "네이버 콜백 - 세션에서 저장된 redirect_uri 확인: savedRedirectUri={}, callbackRedirectUri={}, sessionId={}",
                            savedRedirectUri, callbackRedirectUri, session.getId());

                    // 네이버 개발자 센터에 등록된 URL 목록 (설정 파일에서 읽어옴)
                    List<String> registeredUrls = Arrays.stream(naverRegisteredUrls.split(","))
                            .map(String::trim).filter(url -> !url.isEmpty()).toList();
                    log.debug("네이버 등록된 URL 목록: {}", registeredUrls);

                    if (savedRedirectUri != null && !savedRedirectUri.isEmpty()) {
                        if (!savedRedirectUri.equals(callbackRedirectUri)) {
                            log.warn("⚠️ 네이버 redirect_uri 불일치: 인증 URL 생성 시={}, 콜백 처리 시={}",
                                    savedRedirectUri, callbackRedirectUri);
                            // 인증 URL 생성 시 사용한 redirect_uri를 우선 사용 (네이버 개발자 센터에 등록된 URL과 일치)
                            callbackRedirectUri = savedRedirectUri;
                            log.info("네이버 콜백 - 인증 URL 생성 시 사용한 redirect_uri로 변경: {}",
                                    callbackRedirectUri);
                        } else {
                            log.info("네이버 콜백 - redirect_uri 일치 확인: {}", callbackRedirectUri);
                        }
                    } else {
                        log.warn(
                                "⚠️ 네이버 콜백 - 세션에 oauth2_naver_redirect_uri 없음. 인가 단계와 토큰 단계의 redirect_uri 불일치 시 "
                                        + "네이버 invalid_request(no valid data in session)가 발생할 수 있음. "
                                        + "세션/쿠키 도메인·sticky 여부 및 개발자센터 등록 URL과 다음 동적 URI 일치를 확인: {}",
                                callbackRedirectUri);
                        // 세션에 저장된 redirect_uri가 없을 경우, 네이버 개발자 센터에 등록된 URL 중 하나를 사용
                        // 동적으로 생성한 redirect_uri가 네이버 개발자 센터에 등록된 URL과 일치하는지 확인
                        // 일치하지 않으면 설정 파일의 기본 도메인 사용
                        String configuredDomain = naverCallbackDomain;
                        String envDomain = System.getenv("NAVER_CALLBACK_DOMAIN");
                        if (envDomain != null && !envDomain.isEmpty()) {
                            configuredDomain = envDomain;
                        }
                        if (configuredDomain == null || configuredDomain.isEmpty()) {
                            // 도메인 하드코딩 금지: 요청 호스트를 기반으로 main domain 추론
                            String hostForFallback = request.getHeader("X-Forwarded-Host");
                            if (hostForFallback == null || hostForFallback.isEmpty()) {
                                hostForFallback = request.getHeader("Host");
                            }
                            if (hostForFallback == null || hostForFallback.isEmpty()) {
                                hostForFallback = request.getServerName();
                            }
                            // 포트 제거
                            String hostWithoutPort =
                                    hostForFallback != null ? hostForFallback.split(":")[0] : "";
                            configuredDomain =
                                    oauth2DomainUtil.convertToMainDomain(hostWithoutPort);
                        }
                        // requestScheme과 portSuffix는 이미 위에서 설정됨
                        String configuredRedirectUri = requestScheme + "://" + configuredDomain
                                + portSuffix + naverCallbackPath;

                        // 동적으로 생성한 redirect_uri가 등록된 URL 목록에 있는지 확인
                        boolean isRegistered = registeredUrls.contains(callbackRedirectUri);
                        if (!isRegistered) {
                            log.warn("⚠️ 네이버 콜백 - 동적으로 생성한 redirect_uri가 등록된 URL 목록에 없음: {}",
                                    callbackRedirectUri);
                            log.info("네이버 콜백 - 설정 파일 기반 redirect_uri 사용: {} (등록된 URL 목록 확인)",
                                    configuredRedirectUri);
                            // 설정 파일 기반 redirect_uri가 등록된 URL 목록에 있는지 확인
                            boolean isConfiguredRegistered =
                                    registeredUrls.contains(configuredRedirectUri);
                            if (isConfiguredRegistered) {
                                callbackRedirectUri = configuredRedirectUri;
                            } else {
                                // 등록된 URL 목록에서 첫 번째 URL을 기본값으로 사용
                                if (!registeredUrls.isEmpty()) {
                                    String fallbackUrl = registeredUrls.get(0).trim();
                                    log.warn(
                                            "⚠️ 네이버 콜백 - 설정 파일 기반 redirect_uri도 등록 목록에 없음. 등록 목록 첫 항목으로 토큰 요청(인가 시 사용한 URI와 다르면 실패 가능): {}",
                                            fallbackUrl);
                                    callbackRedirectUri = fallbackUrl;
                                } else {
                                    // 등록된 URL 목록이 비어있으면 설정 파일의 기본 도메인 사용
                                    String fallbackUrl = requestScheme + "://" + configuredDomain
                                            + portSuffix + naverCallbackPath;
                                    log.warn("⚠️ 네이버 콜백 - 등록된 URL 목록이 비어있음. 설정 파일의 기본 도메인 사용: {}",
                                            fallbackUrl);
                                    callbackRedirectUri = fallbackUrl;
                                }
                            }
                        } else {
                            log.info("네이버 콜백 - 동적으로 생성한 redirect_uri가 등록된 URL 목록에 있음: {}",
                                    callbackRedirectUri);
                        }
                    }

                    log.info("네이버 콜백 - 토큰 요청 시 사용할 redirect_uri: {}", callbackRedirectUri);
                    log.info("네이버 콜백 - 토큰 요청 파라미터: code={}, redirect_uri={}",
                            code != null ? code.substring(0, Math.min(10, code.length())) + "..."
                                    : "null",
                            callbackRedirectUri);
                    log.info("네이버 콜백 - 최종 redirect_uri 결정: {} (세션 저장 여부: {}, 등록된 URL 목록 포함 여부: {})",
                            callbackRedirectUri,
                            savedRedirectUri != null && !savedRedirectUri.isEmpty(),
                            registeredUrls != null && registeredUrls.contains(callbackRedirectUri));
                    String accessToken = naverServiceImpl.getAccessToken(code, callbackRedirectUri);
                    SocialUserInfo socialUserInfo = naverServiceImpl.getUserInfo(accessToken);
                    socialUserInfo.setProvider("NAVER");
                    socialUserInfo.setAccessToken(accessToken);
                    socialUserInfo.normalizeData();

                    OAuthExistingUserResolution resolution =
                        naverService.resolveExistingUserForSocialLinkOrLogin(socialUserInfo,
                            isNaverOAuthAccountLinkMode);
                    if (resolution.isRequiresPhoneAccountSelection() && !isNaverOAuthAccountLinkMode) {
                        return redirectOAuthPhoneAccountSelection(request, session, state, "NAVER",
                            socialUserInfo, resolution);
                    }
                    Long existingUserId = resolution.getExistingUserId();
                    if (existingUserId != null && !isNaverOAuthAccountLinkMode) {
                        linkSocialAccountSafely(naverService, existingUserId, socialUserInfo);
                    }

                    if (isNaverOAuthAccountLinkMode) {
                        User sessionUser = SessionUtils.getCurrentUser(session);
                        if (sessionUser == null) {
                            String frontendUrl =
                                    getTenantAwareFrontendBaseUrlForSnsLinkRedirect(request, session, state, null);
                            return ResponseEntity.status(302).header("Location",
                                    buildMypageOAuthLinkLocation(frontendUrl, false, "NAVER",
                                        OAuth2UserFacingMessages.ERR_LOGIN_SESSION_EXPIRED)).build();
                        }
                        if (existingUserId != null && !existingUserId.equals(sessionUser.getId())) {
                            String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(request, session,
                                state, sessionUser);
                            return ResponseEntity.status(302).header("Location",
                                buildMypageOAuthLinkLocation(frontendUrl, false, "NAVER",
                                    OAuth2UserFacingMessages.ERR_SOCIAL_ALREADY_LINKED_TO_OTHER_ACCOUNT)).build();
                        }
                        response = buildSocialLoginResponseForMyPageOAuthLink(sessionUser, socialUserInfo);
                    } else if (existingUserId != null) {
                        User existingUser =
                                loadUserByTenantScopedId(existingUserId, session, state)
                                        .orElse(null);
                        if (existingUser != null) {
                            response = SocialLoginResponse.builder().success(true)
                                    .requiresSignup(false)
                                    .userInfo(SocialLoginResponse.UserInfo.builder()
                                            .id(existingUser.getId()).email(existingUser.getEmail())
                                            .name(existingUser.getName())
                                            .nickname(existingUser.getNickname())
                                            .role(existingUser.getRole() != null
                                                    ? existingUser.getRole().name()
                                                    : null)
                                            .profileImageUrl(existingUser.getProfileImageUrl())
                                            .branch(existingUser.getBranch())
                                            .branchCode(existingUser.getBranchCode())
                                            .providerUserId(socialUserInfo.getProviderUserId())
                                            .build())
                                    .build();
                        } else {
                            response = SocialLoginResponse.builder().success(false)
                                    .message(OAuth2UserFacingMessages.MSG_USER_NOT_FOUND).build();
                        }
                    } else if (shouldEnterOAuthPhoneOtpFlow(naverService, socialUserInfo)) {
                        return redirectOAuthPhoneVerification(request, session, state, "NAVER",
                            socialUserInfo);
                    } else {
                        response = SocialLoginResponse.builder().success(true).requiresSignup(true)
                                .socialUserInfo(socialUserInfo).build();
                    }
                } else {
                    // 기본 방식 사용
                    response = oauth2FactoryService.authenticateWithProvider("NAVER", code);
                }
            } catch (Exception e) {
                log.error("네이버 OAuth2 인증 처리 중 오류", e);
                // 트랜잭션이 롤백 전용으로 표시된 경우 명시적으로 롤백 처리
                try {
                    TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                } catch (Exception txException) {
                    log.debug("트랜잭션 상태 확인 실패 (이미 롤백되었거나 트랜잭션이 없는 경우): {}",
                            txException.getMessage());
                }
                // catch 블록에서도 callbackRedirectUri를 사용하여 재시도
                try {
                    OAuth2Service naverService = oauth2FactoryService.getOAuth2Service("NAVER");
                    final boolean isNaverOAuthAccountLinkModeRetry =
                            isOAuth2CallbackLinkMode(session, mode, SESSION_ATTR_OAUTH2_NAVER_MODE);
                    if (callbackRedirectUri != null
                            && naverService instanceof com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl) {
                        com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl naverServiceImpl =
                                (com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl) naverService;
                        // callbackRedirectUri를 사용하여 토큰 획득 및 사용자 정보 조회
                        String accessToken =
                                naverServiceImpl.getAccessToken(code, callbackRedirectUri);
                        SocialUserInfo socialUserInfo = naverServiceImpl.getUserInfo(accessToken);
                        socialUserInfo.setProvider("NAVER");
                        socialUserInfo.setAccessToken(accessToken);
                        socialUserInfo.normalizeData();
                        Long existingUserId = null;
                        try {
                            OAuthExistingUserResolution resolution =
                                naverService.resolveExistingUserForSocialLinkOrLogin(socialUserInfo,
                                    isNaverOAuthAccountLinkModeRetry);
                            if (resolution.isRequiresPhoneAccountSelection()
                                    && !isNaverOAuthAccountLinkModeRetry) {
                                return redirectOAuthPhoneAccountSelection(request, session, state,
                                    "NAVER", socialUserInfo, resolution);
                            }
                            existingUserId = resolution.getExistingUserId();
                            if (existingUserId != null && !isNaverOAuthAccountLinkModeRetry) {
                                linkSocialAccountSafely(naverService, existingUserId, socialUserInfo);
                            }
                        } catch (Exception findUserException) {
                            log.warn("기존 사용자 확인 중 오류 발생 (계속 진행): {}",
                                    findUserException.getMessage());
                        }
                        // 사용자 처리 로직
                        if (isNaverOAuthAccountLinkModeRetry) {
                            User sessionUser = SessionUtils.getCurrentUser(session);
                            if (sessionUser == null) {
                                String frontendUrl =
                                        getTenantAwareFrontendBaseUrlForSnsLinkRedirect(request, session, state,
                                            null);
                                return ResponseEntity.status(302).header("Location",
                                    buildMypageOAuthLinkLocation(frontendUrl, false, "NAVER",
                                        OAuth2UserFacingMessages.ERR_LOGIN_SESSION_EXPIRED)).build();
                            }
                            if (existingUserId != null && !existingUserId.equals(sessionUser.getId())) {
                                String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(request, session,
                                    state, sessionUser);
                                return ResponseEntity.status(302).header("Location",
                                    buildMypageOAuthLinkLocation(frontendUrl, false, "NAVER",
                                        OAuth2UserFacingMessages.ERR_SOCIAL_ALREADY_LINKED_TO_OTHER_ACCOUNT))
                                    .build();
                            }
                            response = buildSocialLoginResponseForMyPageOAuthLink(sessionUser, socialUserInfo);
                        } else if (existingUserId != null) {
                            User existingUser =
                                    loadUserByTenantScopedId(existingUserId, session, state)
                                            .orElse(null);
                            if (existingUser != null) {
                                response = SocialLoginResponse.builder().success(true)
                                        .requiresSignup(false)
                                        .userInfo(SocialLoginResponse.UserInfo.builder()
                                                .id(existingUser.getId())
                                                .email(existingUser.getEmail())
                                                .name(existingUser.getName())
                                                .nickname(existingUser.getNickname())
                                                .role(existingUser.getRole() != null
                                                        ? existingUser.getRole().name()
                                                        : null)
                                                .profileImageUrl(existingUser.getProfileImageUrl())
                                                .branch(existingUser.getBranch())
                                                .branchCode(existingUser.getBranchCode())
                                                .providerUserId(socialUserInfo.getProviderUserId())
                                                .build())
                                                .build();
                            } else {
                                response = SocialLoginResponse.builder().success(false)
                                        .message(OAuth2UserFacingMessages.MSG_USER_NOT_FOUND).build();
                            }
                        } else if (shouldEnterOAuthPhoneOtpFlow(naverService, socialUserInfo)) {
                            return redirectOAuthPhoneVerification(request, session, state, "NAVER",
                                socialUserInfo);
                        } else {
                            response = SocialLoginResponse.builder().success(true)
                                    .requiresSignup(true).socialUserInfo(socialUserInfo).build();
                        }
                    } else {
                        // 기본 방식 사용 (callbackRedirectUri가 없는 경우)
                        response = oauth2FactoryService.authenticateWithProvider("NAVER", code);
                    }
                } catch (Exception authException) {
                    log.error("네이버 OAuth2 인증 처리 중 오류 발생", authException);
                    // 트랜잭션이 롤백 전용으로 표시된 경우 명시적으로 롤백 처리
                    try {
                        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                    } catch (Exception txException) {
                        log.debug("트랜잭션 상태 확인 실패 (이미 롤백되었거나 트랜잭션이 없는 경우): {}",
                                txException.getMessage());
                    }
                    String redirectTenantId = resolveTenantIdForRedirect(session, state);
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                    String errorMessage =
                            authException.getMessage() != null ? authException.getMessage()
                                    : OAuth2UserFacingMessages.MSG_AUTH_PROCESSING_FAILED;
                    log.warn("네이버 로그인 오류 발생 - tenant-aware 리다이렉트: frontendUrl={}, error={}",
                            frontendUrl, errorMessage);
                    return ResponseEntity.status(302)
                            .header("Location",
                                    frontendUrl + "/login?error="
                                            + URLEncoder.encode(errorMessage,
                                                    StandardCharsets.UTF_8)
                                            + "&provider=NAVER")
                            .build();
                }
            }

            log.info("네이버 OAuth2 응답: success={}, requiresSignup={}, message={}",
                    response.isSuccess(), response.isRequiresSignup(), response.getMessage());

            if (response.isRequiresPhoneAccountSelection()) {
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
                if (tenantId == null || tenantId.isBlank()) {
                    tenantId = redirectTenantId;
                }
                String tok = response.getPhoneAccountSelectionToken();
                if (tok == null || tok.isBlank()) {
                    return ResponseEntity.status(302)
                        .header("Location",
                            frontendUrl + "/login?error="
                                + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_SYSTEM_ERROR,
                                    StandardCharsets.UTF_8) + "&provider=NAVER")
                        .build();
                }
                String q = "success=true&accountSelection=required&selectionToken="
                    + URLEncoder.encode(tok, StandardCharsets.UTF_8) + "&provider=NAVER&tenantId="
                    + URLEncoder.encode(tenantId != null ? tenantId : "", StandardCharsets.UTF_8);
                return ResponseEntity.status(302).header("Location", frontendUrl + "/auth/oauth2/callback?" + q)
                    .build();
            }

            if (response.isSuccess()) {
                // 회원가입이 필요한 경우 처리 (카카오와 동일한 방식)
                if (response.isRequiresSignup()) {
                    log.info("네이버 OAuth2 간편 회원가입 필요: {}", response.getSocialUserInfo());

                    // tenant_id 확인 (TenantContextHolder 우선, 그 다음 세션)
                    String tenantId =
                            com.coresolution.core.context.TenantContextHolder.getTenantId();
                    if (tenantId == null || tenantId.isEmpty()) {
                        // TenantContextHolder에 없으면 세션에서 확인
                        tenantId = (String) session.getAttribute("oauth2_tenant_id");
                        if (tenantId == null || tenantId.isEmpty()) {
                            tenantId = (String) session.getAttribute("tenantId");
                        }
                    }
                    if (tenantId != null && !tenantId.isEmpty()) {
                        log.info("네이버 OAuth2 - 회원가입 리다이렉트에 사용할 tenant_id: tenantId={}", tenantId);
                        // 세션에서 제거하지 않음 (회원가입 완료 후에도 필요할 수 있음)
                    } else {
                        log.warn("⚠️ 네이버 OAuth2 - 회원가입 리다이렉트에 tenant_id가 없습니다.");
                    }

                    // 소셜 사용자 정보를 URL 파라미터로 전달 (한글 인코딩 처리)
                    String email = response.getSocialUserInfo() != null
                            ? response.getSocialUserInfo().getEmail()
                            : "";
                    String name = response.getSocialUserInfo() != null
                            ? response.getSocialUserInfo().getName()
                            : "";
                    String nickname = response.getSocialUserInfo() != null
                            ? response.getSocialUserInfo().getNickname()
                            : "";
                    String providerUserIdForSignup =
                            response.getSocialUserInfo() != null
                                    && response.getSocialUserInfo().getProviderUserId() != null
                                            ? response.getSocialUserInfo().getProviderUserId()
                                            : "";

                    String redirectTenantId = resolveTenantIdForRedirect(session, state);
                    if (redirectTenantId == null || redirectTenantId.isEmpty()) {
                        redirectTenantId = tenantId;
                    }
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                    String signupUrl =
                            frontendUrl + "/login?" + "signup=required" + "&provider=naver"
                                    + (tenantId != null && !tenantId.isEmpty()
                                            ? "&tenantId=" + URLEncoder.encode(tenantId,
                                                    StandardCharsets.UTF_8)
                                            : "")
                                    + "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
                                    + "&name=" + URLEncoder.encode(name, StandardCharsets.UTF_8)
                                    + "&nickname="
                                    + URLEncoder.encode(nickname, StandardCharsets.UTF_8)
                                    + "&providerUserId="
                                    + URLEncoder.encode(providerUserIdForSignup,
                                            StandardCharsets.UTF_8);

                    log.info("네이버 OAuth2 회원가입 리다이렉트 URL: {}", signupUrl);
                    return ResponseEntity.status(302).header("Location", signupUrl).build();
                }

                // SocialLoginResponse에서 이미 완성된 UserInfo 사용 (공통 SNS 처리 로직 활용)
                SocialLoginResponse.UserInfo userInfo = response.getUserInfo();

                // userInfo가 null인 경우 처리
                if (userInfo == null) {
                    log.error("네이버 OAuth2 - userInfo가 null입니다. requiresSignup={}",
                            response.isRequiresSignup());
                    String redirectTenantId = resolveTenantIdForRedirect(session, state);
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                    return ResponseEntity.status(302)
                            .header("Location",
                                    frontendUrl + "/login?error="
                                            + URLEncoder.encode(OAuth2UserFacingMessages.MSG_USER_INFO_UNAVAILABLE,
                                                    StandardCharsets.UTF_8)
                                            + "&provider=NAVER")
                            .build();
                }

                String effectiveMode =
                        consumeOAuth2EffectiveMode(session, mode, SESSION_ATTR_OAUTH2_NAVER_MODE);
                // 계정 연동 모드인지 확인
                if (OAUTH2_MODE_LINK.equals(effectiveMode)) {
                    // 기존 로그인된 사용자의 세션 확인
                    User currentUser = SessionUtils.getCurrentUser(session);
                    if (currentUser == null) {
                        log.error("계정 연동 모드에서 세션 사용자를 찾을 수 없음");
                        String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(request,
                                session, state, null);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        buildMypageOAuthLinkLocation(frontendUrl, false, "NAVER",
                                                OAuth2UserFacingMessages.ERR_LOGIN_SESSION_EXPIRED))
                                .build();
                    }

                    // 기존 사용자에게 소셜 계정 추가
                    try {
                        // AbstractOAuth2Service의 updateOrCreateSocialAccount 메서드 호출
                        // SocialUserInfo 객체 생성
                        SocialUserInfo socialUserInfo = new SocialUserInfo();
                        String naverProviderUserId =
                                resolveOAuthProviderUserIdForLink(response, userInfo);
                        if (naverProviderUserId == null || naverProviderUserId.isEmpty()) {
                            log.error(
                                    "네이버 계정 연동 실패: SNS provider 사용자 ID 없음 (UserInfo·SocialAccountInfo 확인)");
                            String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(
                                    request, session, state, currentUser);
                            return ResponseEntity.status(302)
                                    .header("Location",
                                            buildMypageOAuthLinkLocation(frontendUrl, false, "NAVER",
                                                    OAuth2UserFacingMessages.ERR_ACCOUNT_LINK_FAILED))
                                    .build();
                        }
                        socialUserInfo.setProviderUserId(naverProviderUserId);
                        socialUserInfo.setEmail(userInfo.getEmail());
                        socialUserInfo.setName(userInfo.getName());
                        socialUserInfo.setNickname(userInfo.getNickname());
                        socialUserInfo.setProfileImageUrl(userInfo.getProfileImageUrl());
                        socialUserInfo.setProvider("NAVER");

                        // OAuth2FactoryService를 통해 해당 provider의 서비스 가져오기
                        OAuth2Service oauth2Service =
                                oauth2FactoryService.getOAuth2Service("NAVER");
                        oauth2Service.linkSocialAccountToUser(currentUser.getId(), socialUserInfo);
                        log.info("네이버 계정 연동 성공: 기존 사용자 userId={}, naverProviderUserId={}",
                                currentUser.getId(), naverProviderUserId);

                        String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(request,
                                session, state, currentUser);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        buildMypageOAuthLinkLocation(frontendUrl, true, "NAVER",
                                                OAuth2UserFacingMessages.ERR_ACCOUNT_LINK_COMPLETE))
                                .build();
                    } catch (Exception e) {
                        log.error("네이버 계정 연동 실패", e);
                        String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(request,
                                session, state, currentUser);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        buildMypageOAuthLinkLocation(frontendUrl, false, "NAVER",
                                                OAuth2UserFacingMessages.ERR_ACCOUNT_LINK_FAILED))
                                .build();
                    }
                } else {
                    // 로그인 모드 (기존 로직)
                    // OAuth2 로그인 시 기존 세션 완전 초기화
                    SessionUtils.clearSession(session);

                    // 새로운 세션 생성
                    session = request.getSession(true);

                    // 모바일 클라이언트 정보를 새 세션에 다시 저장 (중요!)
                    if (savedClientType != null) {
                        session.setAttribute("oauth2_client", savedClientType);
                        log.info("네이버 콜백 - 새 세션에 모바일 클라이언트 정보 복원: clientType={}", savedClientType);
                    }

                    // 데이터베이스에서 완전한 User 객체를 가져와서 세션에 저장 (이메일 로그인과 동일)
                    User user = loadUserByTenantScopedId(userInfo.getId(), session, state)
                            .orElseThrow(() -> new RuntimeException(OAuth2UserFacingMessages.MSG_USER_NOT_FOUND));
                    // 세션에 완전한 User 객체 저장
                    SessionUtils.setCurrentUser(session, user);

                    // SpringSecurity 인증 컨텍스트에도 사용자 정보 설정
                    setSpringSecurityAuthentication(user);

                    // 세션에 SecurityContext 저장 (명시적으로)
                    session.setAttribute("SPRING_SECURITY_CONTEXT",
                            SecurityContextHolder.getContext());

                    session.setMaxInactiveInterval(SessionConstants.SESSION_TIMEOUT_SECONDS);

                    log.info(
                            "네이버 OAuth2 로그인 성공: userId={}, role={}, profileImageSummary={}, clientType={}",
                            user.getId(), user.getRole(),
                            profileImageUrlLogSummary(user.getProfileImageUrl()),
                            savedClientType);

                    // 세션 정보 디버깅 로그 추가
                    log.info(
                            "세션 정보 확인: sessionId={}, userInSession={}, sessionMaxInactiveInterval={}",
                            session.getId(),
                            SessionUtils.getCurrentUser(session) != null ? "설정됨" : "없음",
                            session.getMaxInactiveInterval());

                    // SecurityContext 확인
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    log.info("SecurityContext 설정 확인: {}",
                            auth != null && auth.isAuthenticated() ? "성공" : "실패");

                    // 사용자 역할에 따른 리다이렉트 (서브도메인 유지를 위해 getTenantAwareFrontendBaseUrl 사용)
                    // tenantId 우선순위: user.getTenantId() -> TenantContextHolder -> 세션
                    String tenantId = user.getTenantId();
                    if (tenantId == null || tenantId.isEmpty()) {
                        tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
                        if (tenantId == null || tenantId.isEmpty()) {
                            tenantId = (String) session.getAttribute("oauth2_tenant_id");
                            if (tenantId == null || tenantId.isEmpty()) {
                                tenantId = (String) session.getAttribute("tenantId");
                            }
                        }
                    }
                    log.info("네이버 OAuth2 로그인 성공 - 리다이렉트에 사용할 tenantId: tenantId={}, user.tenantId={}", 
                            tenantId, user.getTenantId());
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, tenantId);

                    // provider 정보 가져오기
                    String provider = "UNKNOWN";
                    if (response.getSocialAccountInfo() != null
                            && response.getSocialAccountInfo().getProvider() != null) {
                        provider = response.getSocialAccountInfo().getProvider();
                    }

                    String providerUserIdForCallback = userInfo.getProviderUserId();
                    String redirectUrl = frontendUrl + "/auth/oauth2/callback?"
                            + buildOAuthWebCallbackQueryString(user, provider, tenantId, providerUserIdForCallback);

                    // 모바일 클라이언트인 경우 Deep Link로 리다이렉트
                    if ("mobile".equals(savedClientType)) {
                        log.info("✅ 모바일 클라이언트로 Deep Link 리다이렉트 (네이버)");

                        // 세션 ID를 Deep Link에 포함
                        String sessionId = session.getId();

                        String deepLinkUrl =
                                buildMindGardenOAuthDeepLinkUrl("NAVER", user, sessionId);

                        logOAuthRedirectLocationSummary("네이버 Deep Link", deepLinkUrl);
                        log.info("Deep Link 세션 ID: {}", sessionId);

                        // HTML 페이지 생성 (iOS Safari 보안 정책으로 버튼 포함, 자동 시도도 함께)
                        String escapedDeepLink = deepLinkUrl.replace("'", "\\'");
                        String html = OAuth2UserFacingMessages.buildDeepLinkLandingHtml(
                                OAuth2UserFacingMessages.HTML_DEEP_LINK_PAGE_NAVER_TEMPLATE,
                                escapedDeepLink);

                        return ResponseEntity.ok()
                                .header("Content-Type", "text/html; charset=UTF-8").body(html);
                    }

                    // 웹 클라이언트인 경우 기존 로직 사용
                    // 세션 쿠키를 프론트엔드로 전달하기 위해 쿠키에 세션 ID를 포함
                    // 프론트엔드에서 이 쿠키를 사용하여 세션을 복원
                    String sessionId = session.getId();
                    String cookieValue = String.format(
                            "JSESSIONID=%s; Path=/; SameSite=None; Max-Age=%d; Secure; HttpOnly=false",
                            sessionId,
                            SessionConstants.SESSION_TIMEOUT_SECONDS);

                    log.info("세션 쿠키 설정: {}", cookieValue);
                    logOAuthRedirectLocationSummary("네이버 웹 OAuth", redirectUrl);

                    return ResponseEntity.status(302).header("Location", redirectUrl)
                            .header("Set-Cookie", cookieValue).build();
                }
            } else if (response.isRequiresSignup()) {
                // 간편 회원가입이 필요한 경우
                log.info("네이버 OAuth2 간편 회원가입 필요: {}", response.getSocialUserInfo());

                // 세션에서 tenant_id 확인 (서브도메인에서 추출한 값)
                String tenantId = (String) session.getAttribute("oauth2_tenant_id");
                if (tenantId != null && !tenantId.isEmpty()) {
                    log.info("네이버 OAuth2 - 서브도메인에서 추출한 tenant_id 사용: tenantId={}", tenantId);
                    session.removeAttribute("oauth2_tenant_id"); // 사용 후 제거
                }
                // tenantId가 없으면 TenantContextHolder 값 사용 (state로 복원된 값)
                if (tenantId == null || tenantId.isEmpty()) {
                    tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
                }

                // 소셜 사용자 정보를 URL 파라미터로 전달 (한글 인코딩 처리)
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                if (redirectTenantId == null || redirectTenantId.isEmpty()) {
                    redirectTenantId = tenantId;
                }
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                String email = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getEmail()
                        : "";
                String name = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getName()
                        : "";
                String nickname = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getNickname()
                        : "";
                String providerUserIdForSignup =
                        response.getSocialUserInfo() != null
                                && response.getSocialUserInfo().getProviderUserId() != null
                                        ? response.getSocialUserInfo().getProviderUserId()
                                        : "";

                String signupUrl =
                        frontendUrl + "/login?" + "signup=required" + "&provider=naver"
                                + (tenantId != null && !tenantId.isEmpty() ? "&tenantId="
                                        + URLEncoder.encode(tenantId, StandardCharsets.UTF_8) : "")
                                + "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
                                + "&name=" + URLEncoder.encode(name, StandardCharsets.UTF_8)
                                + "&nickname="
                                + URLEncoder.encode(nickname, StandardCharsets.UTF_8)
                                + "&providerUserId="
                                + URLEncoder.encode(providerUserIdForSignup,
                                        StandardCharsets.UTF_8);

                log.info("네이버 OAuth2 회원가입 리다이렉트 URL: {}", signupUrl);

                return ResponseEntity.status(302).header("Location", signupUrl).build();
            } else {
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                return ResponseEntity.status(302)
                        .header("Location",
                                frontendUrl + "/login?error="
                                        + URLEncoder.encode(response.getMessage(),
                                                StandardCharsets.UTF_8)
                                        + "&provider=NAVER")
                        .build();
            }
        } catch (Exception e) {
            log.error("네이버 OAuth2 콜백 처리 실패", e);
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302)
                    .header("Location", frontendUrl + "/login?error="
                            + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_PROCESS_FAILED, StandardCharsets.UTF_8) + "&provider=NAVER")
                    .build();
        }
    }

    // 테스트용 간편 회원가입 시뮬레이션 엔드포인트
    @GetMapping("/test/signup-required")
    public ResponseEntity<?> testSignupRequired(HttpServletRequest request) {
        log.info("테스트용 간편 회원가입 시뮬레이션 요청");

        String frontendUrl = getTenantAwareFrontendBaseUrl(request,
                com.coresolution.core.context.TenantContextHolder.getTenantId());
        String signupUrl = frontendUrl + "/login?" + "signup=required" + "&provider=kakao"
                + "&email=" + URLEncoder.encode("test@example.com", StandardCharsets.UTF_8)
                + "&name=" + URLEncoder.encode(OAuth2UserFacingMessages.OAUTH_TEST_SIGNUP_DISPLAY_NAME,
                        StandardCharsets.UTF_8) + "&nickname="
                + URLEncoder.encode(OAuth2UserFacingMessages.OAUTH_TEST_SIGNUP_DISPLAY_NICKNAME,
                        StandardCharsets.UTF_8)
                + "&providerUserId="
                + URLEncoder.encode("test_sns_provider_user_id", StandardCharsets.UTF_8);

        log.info("테스트용 간편 회원가입 URL로 리다이렉트: {}", signupUrl);

        return ResponseEntity.status(302).header("Location", signupUrl).build();
    }

    @GetMapping("/kakao/callback")
    public ResponseEntity<?> kakaoCallback(@RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String mode, // 'login' 또는 'link'
            HttpServletRequest request, HttpSession session) {

        if (error != null) {
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302)
                    .header("Location", frontendUrl + "/login?error="
                            + URLEncoder.encode(error, StandardCharsets.UTF_8) + "&provider=KAKAO")
                    .build();
        }

        if (code == null) {
            log.warn("카카오 OAuth2 콜백에서 인증 코드가 없습니다. error={}, state={}", error, state);
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_NO_AUTH_CODE, StandardCharsets.UTF_8) + "&provider=KAKAO")
                    .build();
        }

        String savedState = (String) session.getAttribute("oauth2_kakao_state");
        String normalizedKakaoState = normalizeOAuth2StateQueryValue(state);
        OAuthCompositeState kakaoComposite = parseCompositeOAuthState(normalizedKakaoState);
        String stateBasedTenantId = kakaoComposite.tenantId;
        log.info("카카오 OAuth2 콜백 - state 검증: savedStatePresent={}, stateLen={}, sessionId={}",
                Boolean.valueOf(savedState != null),
                normalizedKakaoState != null ? normalizedKakaoState.length() : 0, session.getId());

        if (stateBasedTenantId != null) {
            log.info("카카오 OAuth2 콜백 - state에서 tenantId 디코딩 성공: tenantId={}, nonceLen={}",
                    stateBasedTenantId,
                    kakaoComposite.nonceOrFull != null ? kakaoComposite.nonceOrFull.length() : 0);
        } else if (normalizedKakaoState != null && normalizedKakaoState.contains(".")) {
            log.warn("⚠️ 카카오 OAuth2 콜백 - state에 '.'는 있으나 tenant 접두 디코딩 실패: prefix={}",
                    oauth2StateEncodedSegmentPrefixForLog(normalizedKakaoState));
        }

        if (!prefixedOAuthSavedStateMatches(savedState, normalizedKakaoState, kakaoComposite)) {
            session.removeAttribute("oauth2_kakao_state");
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_SECURITY_VERIFICATION_FAILED,
                                                    StandardCharsets.UTF_8) + "&provider=KAKAO")
                    .build();
        }

        if (savedState != null) {
            session.removeAttribute("oauth2_kakao_state");
        }

        try {
            String callbackTenantId = extractTenantIdFromSubdomain(request);
            if (stateBasedTenantId != null && !stateBasedTenantId.isEmpty()) {
                com.coresolution.core.context.TenantContextHolder.setTenantId(stateBasedTenantId);
                log.info(
                        "카카오 OAuth2 콜백 - state 기반 tenant_id를 TenantContextHolder에 설정: tenantId={}",
                        stateBasedTenantId);
                if (callbackTenantId != null && !callbackTenantId.isEmpty()
                        && !callbackTenantId.equals(stateBasedTenantId)) {
                    log.warn(
                            "카카오 OAuth2 콜백 - state 기반 tenant와 서브도메인 기반 tenant 불일치, state 우선 적용: callbackHostSuggestsSubdomain={}",
                            Boolean.valueOf(callbackHostSuggestsSubdomain(request)));
                }
            } else if (callbackTenantId != null && !callbackTenantId.isEmpty()) {
                com.coresolution.core.context.TenantContextHolder.setTenantId(callbackTenantId);
                log.info(
                        "카카오 OAuth2 콜백 - 서브도메인에서 tenant_id 추출 및 TenantContextHolder 설정: tenantId={}",
                        callbackTenantId);
            } else {
                if (!callbackHostSuggestsSubdomain(request)) {
                    log.info(
                            "카카오 OAuth2 콜백 - Host/Forwarded-Host가 서브도메인 형태로 보이지 않음(쿠키/프록시 환경에서 tenant 미결정 가능)");
                }
                String sessionTenantId = (String) session.getAttribute("tenantId");
                if (sessionTenantId == null || sessionTenantId.isEmpty()) {
                    sessionTenantId = (String) session.getAttribute("oauth2_tenant_id");
                }
                if (sessionTenantId != null && !sessionTenantId.isEmpty()) {
                    com.coresolution.core.context.TenantContextHolder.setTenantId(sessionTenantId);
                    log.info(
                            "카카오 OAuth2 콜백 - 세션에서 tenant_id 추출 및 TenantContextHolder 설정: tenantId={}",
                            sessionTenantId);
                } else {
                    // tenantId를 찾을 수 없으면 오류 페이지로 리다이렉트 (테넌트 등록 필요)
                    log.error("❌ 카카오 OAuth2 콜백 - tenant_id를 찾을 수 없습니다. 테넌트 등록이 필요합니다.");
                    String redirectTenantId = resolveTenantIdForRedirect(session, state);
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                    return ResponseEntity.status(302)
                            .header("Location",
                                    frontendUrl + "/login?error="
                                            + URLEncoder.encode(
                                                    OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED,
                                                    StandardCharsets.UTF_8)
                                            + "&provider=KAKAO")
                            .build();
                }
            }

            // TenantContextHolder에 tenantId가 설정되었는지 최종 확인
            String finalTenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
            if (finalTenantId == null || finalTenantId.isEmpty()) {
                log.error(
                        "❌ 카카오 OAuth2 콜백 - TenantContextHolder에 tenant_id가 설정되지 않았습니다. 테넌트 등록이 필요합니다.");
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                return ResponseEntity.status(302)
                        .header("Location",
                                frontendUrl + "/login?error="
                                        + URLEncoder.encode(OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED,
                                                StandardCharsets.UTF_8)
                                        + "&provider=KAKAO")
                        .build();
            }

            // 모바일 클라이언트 정보를 Redis에서 조회 (state 기반)
            String savedClientType = null;
            if (normalizedKakaoState != null) {
                String cacheKey = "oauth2_kakao_client:" + normalizedKakaoState;
                // java.util.Optional<String> clientTypeOpt = cacheService.get(cacheKey,
                // String.class); // 캐시 서비스 임시 비활성화
                java.util.Optional<String> clientTypeOpt = java.util.Optional.empty();
                if (clientTypeOpt.isPresent()) {
                    savedClientType = clientTypeOpt.get();
                    // cacheService.evict(cacheKey); // 사용 후 삭제 - 캐시 서비스 임시 비활성화
                    log.info("카카오 콜백 - Redis에서 모바일 클라이언트 정보 조회: clientType={}, stateLen={}",
                            savedClientType, normalizedKakaoState.length());
                } else {
                    // Redis에 없으면 세션에서도 확인 (기존 호환성)
                    savedClientType = (String) session.getAttribute("oauth2_client");
                    log.info("카카오 콜백 - Redis에서 찾지 못함, 세션에서 확인: clientType={}", savedClientType);
                }
            } else {
                // state가 없으면 세션에서 확인
                savedClientType = (String) session.getAttribute("oauth2_client");
                log.info("카카오 콜백 - state 없음, 세션에서 확인: clientType={}", savedClientType);
            }

            // 동적 redirectUri 계산 (항상 동적으로 생성, 프록시 헤더 고려)
            String actualRedirectUri = null;
            try {
                // 프록시 헤더 확인 (X-Forwarded-Proto, X-Forwarded-Host)
                // 단, 로컬 환경(localhost)에서는 실제 요청 Host를 우선 사용
                String requestScheme = resolveExternalScheme(request);

                // Host 헤더 우선 확인 (실제 백엔드 서버 주소)
                String requestHost = request.getHeader("Host");
                // 로컬 환경에서 프론트엔드 프록시를 통해 온 경우 처리
                if (requestHost != null && requestHost.contains("localhost")
                        && !requestHost.contains(":8080")) {
                    // 프론트엔드(localhost:3000)에서 프록시로 온 경우, 실제 백엔드 주소 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                } else if (requestHost == null || requestHost.isEmpty()) {
                    // Host 헤더가 없으면 X-Forwarded-Host 확인
                    String forwardedHost = request.getHeader("X-Forwarded-Host");
                    if (forwardedHost != null && !forwardedHost.isEmpty()) {
                        // X-Forwarded-Host가 백엔드 포트를 포함하는 경우만 사용
                        if (forwardedHost.contains(":8080")) {
                            requestHost = forwardedHost;
                        } else {
                            // 아니면 실제 서버 주소 사용
                            requestHost = request.getServerName() + ":" + request.getServerPort();
                        }
                    }
                }
                if (requestHost == null || requestHost.isEmpty()) {
                    requestHost = request.getServerName();
                    int port = request.getServerPort();
                    if (port != 80 && port != 443) {
                        requestHost = requestHost + ":" + port;
                    }
                }

                if (requestHost != null && !requestHost.isEmpty()) {
                    String hostWithoutPort = requestHost.split(":")[0];
                    // 서브도메인을 메인 도메인으로 변환 (설정 파일 기반)
                    String mainDomain = oauth2DomainUtil.convertToMainDomain(hostWithoutPort);

                    // 포트가 포함된 경우와 아닌 경우 모두 처리
                    String portSuffix = "";
                    if (requestHost.contains(":")) {
                        String port = requestHost.split(":")[1];
                        if (!port.equals("80") && !port.equals("443")) {
                            portSuffix = ":" + port;
                        }
                    } else {
                        // 프록시를 통해 들어온 경우 포트는 헤더에서 확인
                        String forwardedPort = request.getHeader("X-Forwarded-Port");
                        if (forwardedPort != null && !forwardedPort.isEmpty()) {
                            int port = Integer.parseInt(forwardedPort);
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        } else {
                            int port = request.getServerPort();
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        }
                    }

                    actualRedirectUri =
                            requestScheme + "://" + mainDomain + portSuffix + kakaoCallbackPath;

                    log.info(
                            "카카오 콜백 - 동적 redirect_uri 생성: {} (원본 host={}, 변환된 mainDomain={}, scheme={}, forwardedProto={}, forwardedHost={})",
                            actualRedirectUri, requestHost, mainDomain, request.getScheme(),
                            request.getHeader("X-Forwarded-Proto"),
                            request.getHeader("X-Forwarded-Host"));
                }
            } catch (Exception e) {
                log.error("카카오 콜백 - redirect_uri 동적 생성 실패", e);
            }

            if (actualRedirectUri == null || actualRedirectUri.isEmpty()) {
                log.error(
                        "카카오 콜백 - redirect_uri를 생성할 수 없습니다. 요청 정보: scheme={}, host={}, serverName={}",
                        request.getScheme(), request.getHeader("Host"), request.getServerName());
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                        + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_SYSTEM_ERROR, StandardCharsets.UTF_8) + "&provider=KAKAO")
                        .build();
            }

            // redirectUri를 전달하여 인증 처리
            OAuth2Service kakaoService = oauth2FactoryService.getOAuth2Service("KAKAO");
            SocialLoginResponse response;
            if (kakaoService instanceof com.coresolution.consultation.service.impl.KakaoOAuth2ServiceImpl) {
                com.coresolution.consultation.service.impl.KakaoOAuth2ServiceImpl kakaoServiceImpl =
                        (com.coresolution.consultation.service.impl.KakaoOAuth2ServiceImpl) kakaoService;
                // redirectUri를 전달하여 액세스 토큰 획득
                String accessToken = kakaoServiceImpl.getAccessToken(code, actualRedirectUri);
                // AbstractOAuth2Service의 authenticateWithCode를 사용하되,
                // getAccessToken이 이미 호출되었으므로 재호출되지 않도록 처리
                // 하지만 AbstractOAuth2Service.authenticateWithCode는 getAccessToken(code)를 다시 호출하므로
                // 직접 인증 처리 로직을 구현해야 함
                com.coresolution.consultation.dto.SocialUserInfo socialUserInfo =
                        kakaoServiceImpl.getUserInfo(accessToken);
                socialUserInfo.setProvider("KAKAO");
                socialUserInfo.setAccessToken(accessToken);
                socialUserInfo.normalizeData();

                final boolean isKakaoOAuthAccountLinkMode =
                        isOAuth2CallbackLinkMode(session, mode, SESSION_ATTR_OAUTH2_KAKAO_MODE);
                Long existingUserId = null;
                try {
                    OAuthExistingUserResolution resolution =
                        kakaoService.resolveExistingUserForSocialLinkOrLogin(socialUserInfo,
                            isKakaoOAuthAccountLinkMode);
                    if (resolution.isRequiresPhoneAccountSelection() && !isKakaoOAuthAccountLinkMode) {
                        return redirectOAuthPhoneAccountSelection(request, session, state, "KAKAO",
                            socialUserInfo, resolution);
                    }
                    existingUserId = resolution.getExistingUserId();
                } catch (Exception e) {
                    log.warn("⚠️ 카카오 기존 사용자 조회 실패: {}", e.getMessage());
                }
                if (existingUserId != null && !isKakaoOAuthAccountLinkMode) {
                    linkSocialAccountSafely(kakaoService, existingUserId, socialUserInfo);
                }

                if (isKakaoOAuthAccountLinkMode) {
                    User sessionUser = SessionUtils.getCurrentUser(session);
                    if (sessionUser == null) {
                        String frontendUrl =
                                getTenantAwareFrontendBaseUrlForSnsLinkRedirect(request, session, state, null);
                        return ResponseEntity.status(302).header("Location",
                            buildMypageOAuthLinkLocation(frontendUrl, false, "KAKAO",
                                OAuth2UserFacingMessages.ERR_LOGIN_SESSION_EXPIRED)).build();
                    }
                    if (existingUserId != null && !existingUserId.equals(sessionUser.getId())) {
                        String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(request, session,
                            state, sessionUser);
                        return ResponseEntity.status(302).header("Location",
                            buildMypageOAuthLinkLocation(frontendUrl, false, "KAKAO",
                                OAuth2UserFacingMessages.ERR_SOCIAL_ALREADY_LINKED_TO_OTHER_ACCOUNT)).build();
                    }
                    response = buildSocialLoginResponseForMyPageOAuthLink(sessionUser, socialUserInfo);
                } else if (existingUserId == null
                        && shouldEnterOAuthPhoneOtpFlow(kakaoService, socialUserInfo)) {
                    return redirectOAuthPhoneVerification(request, session, state, "KAKAO",
                        socialUserInfo);
                } else if (existingUserId == null) {
                    response =
                            SocialLoginResponse.builder().success(false).message(OAuth2UserFacingMessages.MSG_SIGNUP_REQUIRED)
                                    .requiresSignup(true).socialUserInfo(socialUserInfo).build();
                } else {
                    User user = loadUserByTenantScopedId(existingUserId, session, state)
                            .orElseThrow(() -> new RuntimeException(OAuth2UserFacingMessages.MSG_USER_NOT_FOUND));

                    // Phase 3: 확장된 JWT 토큰 생성 (tenantId, branchId, permissions 포함)
                    // 권한 조회 시 예외 발생해도 빈 리스트 반환 (트랜잭션 롤백 오류 방지)
                    java.util.List<String> permissions;
                    try {
                        permissions = dynamicPermissionService.getUserPermissionsAsStringList(user);
                    } catch (Exception e) {
                        log.warn("⚠️ 권한 조회 실패 (빈 리스트 반환): userId={}, 오류={}", user.getId(),
                                e.getMessage());
                        permissions = new java.util.ArrayList<>();
                    }
                    String jwtToken = jwtService.generateToken(user, permissions);
                    // 표준화 2025-12-08: username = userId이므로 refreshToken도 userId 사용, User 객체로 생성하여
                    // tenantId, email 포함
                    String refreshToken = jwtService.generateRefreshToken(user);

                    // 프로필 이미지 결정
                    String finalProfileImageUrl = user.getProfileImageUrl() != null
                            && !user.getProfileImageUrl().trim().isEmpty()
                                    ? user.getProfileImageUrl()
                                    : (socialUserInfo.getProfileImageUrl() != null
                                            && !socialUserInfo.getProfileImageUrl().trim().isEmpty()
                                                    ? socialUserInfo.getProfileImageUrl()
                                                    : "/default-avatar.svg");

                    response = SocialLoginResponse.builder().success(true)
                            .message(OAuth2UserFacingMessages.MSG_KAKAO_ACCOUNT_LOGGED_IN).accessToken(jwtToken)
                            .refreshToken(refreshToken)
                            .userInfo(SocialLoginResponse.UserInfo.builder().id(user.getId())
                                    .email(user.getEmail()).name(user.getName())
                                    .nickname(user.getNickname()).role(user.getRole().getValue())
                                    .profileImageUrl(finalProfileImageUrl)
                                    .providerUserId(socialUserInfo.getProviderUserId())
                                    .build())
                            .build();
                }
            } else {
                try {
                    response = oauth2FactoryService.authenticateWithProvider("KAKAO", code);
                } catch (Exception e) {
                    log.error("카카오 OAuth2 인증 처리 중 오류 발생", e);
                    // 트랜잭션이 롤백 전용으로 표시된 경우 명시적으로 롤백 처리
                    try {
                        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                    } catch (Exception txException) {
                        log.debug("트랜잭션 상태 확인 실패 (이미 롤백되었거나 트랜잭션이 없는 경우): {}",
                                txException.getMessage());
                    }
                    String redirectTenantId = resolveTenantIdForRedirect(session, state);
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                    String errorMessage =
                            e.getMessage() != null ? e.getMessage()
                                    : OAuth2UserFacingMessages.MSG_AUTH_PROCESSING_FAILED;
                    return ResponseEntity.status(302)
                            .header("Location",
                                    frontendUrl + "/login?error="
                                            + URLEncoder.encode(errorMessage,
                                                    StandardCharsets.UTF_8)
                                            + "&provider=KAKAO")
                            .build();
                }
            }

            if (response.isRequiresPhoneAccountSelection()) {
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
                if (tenantId == null || tenantId.isBlank()) {
                    tenantId = redirectTenantId;
                }
                String tok = response.getPhoneAccountSelectionToken();
                if (tok == null || tok.isBlank()) {
                    return ResponseEntity.status(302)
                        .header("Location",
                            frontendUrl + "/login?error="
                                + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_SYSTEM_ERROR,
                                    StandardCharsets.UTF_8) + "&provider=KAKAO")
                        .build();
                }
                String q = "success=true&accountSelection=required&selectionToken="
                    + URLEncoder.encode(tok, StandardCharsets.UTF_8) + "&provider=KAKAO&tenantId="
                    + URLEncoder.encode(tenantId != null ? tenantId : "", StandardCharsets.UTF_8);
                return ResponseEntity.status(302).header("Location", frontendUrl + "/auth/oauth2/callback?" + q)
                    .build();
            }

            if (response.isSuccess()) {
                // SocialLoginResponse에서 이미 완성된 UserInfo 사용 (공통 SNS 처리 로직 활용)
                SocialLoginResponse.UserInfo userInfo = response.getUserInfo();
                if (userInfo == null) {
                    log.error("카카오 OAuth2 - userInfo가 null입니다. requiresSignup={}",
                            response.isRequiresSignup());
                    String redirectTenantId = resolveTenantIdForRedirect(session, state);
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                    return ResponseEntity.status(302)
                            .header("Location",
                                    frontendUrl + "/login?error="
                                            + URLEncoder.encode(OAuth2UserFacingMessages.MSG_USER_INFO_UNAVAILABLE,
                                                    StandardCharsets.UTF_8)
                                            + "&provider=KAKAO")
                            .build();
                }

                String effectiveMode =
                        consumeOAuth2EffectiveMode(session, mode, SESSION_ATTR_OAUTH2_KAKAO_MODE);
                // 계정 연동 모드인지 확인
                if (OAUTH2_MODE_LINK.equals(effectiveMode)) {
                    // 기존 로그인된 사용자의 세션 확인
                    User currentUser = SessionUtils.getCurrentUser(session);
                    if (currentUser == null) {
                        log.error("계정 연동 모드에서 세션 사용자를 찾을 수 없음");
                        String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(request,
                                session, state, null);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        buildMypageOAuthLinkLocation(frontendUrl, false, "KAKAO",
                                                OAuth2UserFacingMessages.ERR_LOGIN_SESSION_EXPIRED))
                                .build();
                    }

                    // 기존 사용자에게 소셜 계정 추가
                    try {
                        // SocialUserInfo 객체 생성
                        SocialUserInfo socialUserInfo = new SocialUserInfo();
                        String kakaoProviderUserId =
                                resolveOAuthProviderUserIdForLink(response, userInfo);
                        if (kakaoProviderUserId == null || kakaoProviderUserId.isEmpty()) {
                            log.error(
                                    "카카오 계정 연동 실패: SNS provider 사용자 ID 없음 (UserInfo·SocialAccountInfo 확인)");
                            String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(
                                    request, session, state, currentUser);
                            return ResponseEntity.status(302)
                                    .header("Location",
                                            buildMypageOAuthLinkLocation(frontendUrl, false, "KAKAO",
                                                    OAuth2UserFacingMessages.ERR_ACCOUNT_LINK_FAILED))
                                    .build();
                        }
                        socialUserInfo.setProviderUserId(kakaoProviderUserId);
                        socialUserInfo.setEmail(userInfo.getEmail());
                        socialUserInfo.setName(userInfo.getName());
                        socialUserInfo.setNickname(userInfo.getNickname());
                        socialUserInfo.setProfileImageUrl(userInfo.getProfileImageUrl());
                        socialUserInfo.setProvider("KAKAO");

                        // OAuth2FactoryService를 통해 해당 provider의 서비스 가져오기
                        OAuth2Service oauth2Service =
                                oauth2FactoryService.getOAuth2Service("KAKAO");
                        oauth2Service.linkSocialAccountToUser(currentUser.getId(), socialUserInfo);
                        log.info("카카오 계정 연동 성공: 기존 사용자 userId={}, kakaoProviderUserId={}",
                                currentUser.getId(), kakaoProviderUserId);

                        String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(request,
                                session, state, currentUser);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        buildMypageOAuthLinkLocation(frontendUrl, true, "KAKAO",
                                                OAuth2UserFacingMessages.ERR_ACCOUNT_LINK_COMPLETE))
                                .build();
                    } catch (Exception e) {
                        log.error("카카오 계정 연동 실패", e);
                        String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(request,
                                session, state, currentUser);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        buildMypageOAuthLinkLocation(frontendUrl, false, "KAKAO",
                                                OAuth2UserFacingMessages.ERR_ACCOUNT_LINK_FAILED))
                                .build();
                    }
                } else {
                    // 로그인 모드 (기존 로직)
                    // OAuth2 로그인 시 기존 세션 완전 초기화
                    SessionUtils.clearSession(session);

                    // 새로운 세션 생성
                    session = request.getSession(true);

                    // 모바일 클라이언트 정보를 새 세션에 다시 저장 (중요!)
                    if (savedClientType != null) {
                        session.setAttribute("oauth2_client", savedClientType);
                        log.info("카카오 콜백 - 새 세션에 모바일 클라이언트 정보 복원: clientType={}", savedClientType);
                    }

                    // 데이터베이스에서 완전한 User 객체를 가져와서 세션에 저장 (이메일 로그인과 동일)
                    User user = loadUserByTenantScopedId(userInfo.getId(), session, state)
                            .orElseThrow(() -> new RuntimeException(OAuth2UserFacingMessages.MSG_USER_NOT_FOUND));
                    // 세션에 완전한 User 객체 저장
                    SessionUtils.setCurrentUser(session, user);

                    // SpringSecurity 인증 컨텍스트에도 사용자 정보 설정
                    setSpringSecurityAuthentication(user);

                    // 세션에 SecurityContext 저장 (명시적으로)
                    session.setAttribute("SPRING_SECURITY_CONTEXT",
                            SecurityContextHolder.getContext());

                    session.setMaxInactiveInterval(SessionConstants.SESSION_TIMEOUT_SECONDS);

                    log.info(
                            "카카오 OAuth2 로그인 성공: userId={}, role={}, profileImageSummary={}, clientType={}",
                            user.getId(), user.getRole(),
                            profileImageUrlLogSummary(user.getProfileImageUrl()),
                            savedClientType);

                    // 세션 정보 디버깅 로그 추가
                    log.info(
                            "세션 정보 확인: sessionId={}, userInSession={}, sessionMaxInactiveInterval={}",
                            session.getId(),
                            SessionUtils.getCurrentUser(session) != null ? "설정됨" : "없음",
                            session.getMaxInactiveInterval());

                    // SecurityContext 확인
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    log.info("SecurityContext 설정 확인: {}",
                            auth != null && auth.isAuthenticated() ? "성공" : "실패");

                    // 모바일 클라이언트인 경우 Deep Link로 리다이렉트
                    if ("mobile".equals(savedClientType)) {
                        log.info("✅ 모바일 클라이언트로 Deep Link 리다이렉트 (카카오)");

                        // 세션 ID를 Deep Link에 포함
                        String sessionId = session.getId();

                        String deepLinkUrl =
                                buildMindGardenOAuthDeepLinkUrl("KAKAO", user, sessionId);

                        logOAuthRedirectLocationSummary("카카오 Deep Link", deepLinkUrl);
                        log.info("Deep Link 세션 ID: {}", sessionId);

                        // HTML 페이지 생성 (iOS Safari 보안 정책으로 버튼 포함, 자동 시도도 함께)
                        String escapedDeepLink = deepLinkUrl.replace("'", "\\'");
                        String html = OAuth2UserFacingMessages.buildDeepLinkLandingHtml(
                                OAuth2UserFacingMessages.HTML_DEEP_LINK_PAGE_KAKAO_TEMPLATE,
                                escapedDeepLink);

                        return ResponseEntity.ok()
                                .header("Content-Type", "text/html; charset=UTF-8").body(html);
                    }

                    // 웹 클라이언트인 경우 기존 로직 사용
                    // 사용자 역할에 따른 리다이렉트 (서브도메인 유지를 위해 getTenantAwareFrontendBaseUrl 사용)
                    // tenantId 우선순위: user.getTenantId() -> TenantContextHolder -> 세션
                    String tenantId = user.getTenantId();
                    if (tenantId == null || tenantId.isEmpty()) {
                        tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
                        if (tenantId == null || tenantId.isEmpty()) {
                            tenantId = (String) session.getAttribute("oauth2_tenant_id");
                            if (tenantId == null || tenantId.isEmpty()) {
                                tenantId = (String) session.getAttribute("tenantId");
                            }
                        }
                    }
                    log.info("카카오 OAuth2 로그인 성공 - 리다이렉트에 사용할 tenantId: tenantId={}, user.tenantId={}", 
                            tenantId, user.getTenantId());
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, tenantId);

                    // provider 정보 가져오기
                    String provider = "KAKAO";

                    String providerUserIdForCallback = userInfo.getProviderUserId();
                    String redirectUrl = frontendUrl + "/auth/oauth2/callback?"
                            + buildOAuthWebCallbackQueryString(user, provider, tenantId, providerUserIdForCallback);

                    // 세션 쿠키 설정을 명시적으로 추가
                    String sessionId = session.getId();
                    String cookieValue = String.format(
                            "JSESSIONID=%s; Path=/; SameSite=None; Max-Age=%d; Secure; HttpOnly=false",
                            sessionId,
                            SessionConstants.SESSION_TIMEOUT_SECONDS);

                    log.info("세션 쿠키 설정: {}", cookieValue);
                    logOAuthRedirectLocationSummary("카카오 웹 OAuth", redirectUrl);

                    return ResponseEntity.status(302).header("Location", redirectUrl)
                            .header("Set-Cookie", cookieValue).build();
                }
            } else if (response.isRequiresSignup()) {
                // 간편 회원가입이 필요한 경우
                log.info("카카오 OAuth2 간편 회원가입 필요: {}", response.getSocialUserInfo());

                // 세션에서 tenant_id 확인 (서브도메인에서 추출한 값)
                String tenantId = (String) session.getAttribute("oauth2_tenant_id");
                if (tenantId != null && !tenantId.isEmpty()) {
                    log.info("카카오 OAuth2 - 서브도메인에서 추출한 tenant_id 사용: tenantId={}", tenantId);
                    session.removeAttribute("oauth2_tenant_id"); // 사용 후 제거
                }
                // tenantId가 없으면 TenantContextHolder 값 사용 (state로 복원된 값)
                if (tenantId == null || tenantId.isEmpty()) {
                    tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
                }

                // 소셜 사용자 정보를 URL 파라미터로 전달 (한글 인코딩 처리)
                String email = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getEmail()
                        : "";
                String name = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getName()
                        : "";
                String nickname = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getNickname()
                        : "";
                String providerUserIdForSignup =
                        response.getSocialUserInfo() != null
                                && response.getSocialUserInfo().getProviderUserId() != null
                                        ? response.getSocialUserInfo().getProviderUserId()
                                        : "";

                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                if (redirectTenantId == null || redirectTenantId.isEmpty()) {
                    redirectTenantId = tenantId;
                }
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                String signupUrl =
                        frontendUrl + "/login?" + "signup=required" + "&provider=kakao"
                                + (tenantId != null && !tenantId.isEmpty() ? "&tenantId="
                                        + URLEncoder.encode(tenantId, StandardCharsets.UTF_8) : "")
                                + "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
                                + "&name=" + URLEncoder.encode(name, StandardCharsets.UTF_8)
                                + "&nickname="
                                + URLEncoder.encode(nickname, StandardCharsets.UTF_8)
                                + "&providerUserId="
                                + URLEncoder.encode(providerUserIdForSignup,
                                        StandardCharsets.UTF_8);

                return ResponseEntity.status(302).header("Location", signupUrl).build();
            } else {
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                return ResponseEntity.status(302)
                        .header("Location",
                                frontendUrl + "/login?error="
                                        + URLEncoder.encode(response.getMessage(),
                                                StandardCharsets.UTF_8)
                                        + "&provider=KAKAO")
                        .build();
            }
        } catch (Exception e) {
            log.error("카카오 OAuth2 콜백 처리 실패: {}", e.getMessage(), e);
            String errorMessage = e.getMessage() != null ? e.getMessage()
                    : OAuth2UserFacingMessages.ERR_LOGIN_PROCESS_FAILED;
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode(errorMessage, StandardCharsets.UTF_8) + "&provider=KAKAO")
                    .build();
        }
    }

    /**
     * Google OAuth2 server-side auth-code 콜백.
     *
     * <p>흐름:
     * <ol>
     *   <li>{@code code} + {@code state} 수신 (Google 동의 후 redirect)</li>
     *   <li>state 의 base64url prefix 에서 tenantId 복원 → {@code TenantContextHolder} 설정</li>
     *   <li>{@code code} 를 Google token endpoint 와 교환하여 access_token (옵션 id_token) 획득</li>
     *   <li>access_token 으로 사용자 정보 조회 → 휴대폰 OTP 매칭/계정 선택/회원가입 분기</li>
     *   <li>JWT 발급 후 테넌트 서브도메인의 {@code /auth/oauth2/callback} 으로 redirect</li>
     * </ol></p>
     *
     * <p>카카오/네이버와 100% 동일 패턴이며, BE 가 Google 의 토큰 교환·사용자 조회·매칭 로직을
     * 모두 처리한다(`GoogleOAuth2ServiceImpl#getAccessToken(code, redirectUri)` /
     * `#getUserInfo(accessToken)`).</p>
     */
    @GetMapping("/google/callback")
    public ResponseEntity<?> googleCallback(@RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String mode,
            HttpServletRequest request, HttpSession session) {

        if (error != null) {
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302)
                    .header("Location", frontendUrl + "/login?error="
                            + URLEncoder.encode(error, StandardCharsets.UTF_8) + "&provider=GOOGLE")
                    .build();
        }

        if (code == null) {
            log.warn("Google OAuth2 콜백에서 인증 코드가 없습니다. error={}, stateLen={}",
                    error, state != null ? state.length() : 0);
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_NO_AUTH_CODE,
                            StandardCharsets.UTF_8)
                    + "&provider=GOOGLE")
                    .build();
        }

        String savedState = (String) session.getAttribute("oauth2_google_state");
        String normalizedGoogleState = normalizeOAuth2StateQueryValue(state);
        OAuthCompositeState googleComposite = parseCompositeOAuthState(normalizedGoogleState);
        String stateBasedTenantId = googleComposite.tenantId;
        log.info("Google OAuth2 콜백 - state 검증: savedStatePresent={}, stateLen={}, sessionId={}",
                Boolean.valueOf(savedState != null),
                normalizedGoogleState != null ? normalizedGoogleState.length() : 0,
                session.getId());

        if (!prefixedOAuthSavedStateMatches(savedState, normalizedGoogleState, googleComposite)) {
            session.removeAttribute("oauth2_google_state");
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode(
                            OAuth2UserFacingMessages.ERR_LOGIN_SECURITY_VERIFICATION_FAILED,
                            StandardCharsets.UTF_8)
                    + "&provider=GOOGLE")
                    .build();
        }

        if (savedState != null) {
            session.removeAttribute("oauth2_google_state");
        }

        try {
            String callbackTenantId = extractTenantIdFromSubdomain(request);
            if (stateBasedTenantId != null && !stateBasedTenantId.isEmpty()) {
                com.coresolution.core.context.TenantContextHolder.setTenantId(stateBasedTenantId);
                log.info(
                        "Google OAuth2 콜백 - state 기반 tenant_id 를 TenantContextHolder 에 설정: tenantId={}",
                        stateBasedTenantId);
            } else if (callbackTenantId != null && !callbackTenantId.isEmpty()) {
                com.coresolution.core.context.TenantContextHolder.setTenantId(callbackTenantId);
                log.info(
                        "Google OAuth2 콜백 - 서브도메인에서 tenant_id 추출 및 TenantContextHolder 설정: tenantId={}",
                        callbackTenantId);
            } else {
                String sessionTenantId = (String) session.getAttribute("tenantId");
                if (sessionTenantId == null || sessionTenantId.isEmpty()) {
                    sessionTenantId = (String) session.getAttribute("oauth2_tenant_id");
                }
                if (sessionTenantId != null && !sessionTenantId.isEmpty()) {
                    com.coresolution.core.context.TenantContextHolder.setTenantId(sessionTenantId);
                    log.info(
                            "Google OAuth2 콜백 - 세션에서 tenant_id 추출 및 TenantContextHolder 설정: tenantId={}",
                            sessionTenantId);
                } else {
                    log.error("❌ Google OAuth2 콜백 - tenant_id 를 찾을 수 없습니다. 테넌트 등록이 필요합니다.");
                    String redirectTenantId = resolveTenantIdForRedirect(session, state);
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                    return ResponseEntity.status(302)
                            .header("Location",
                                    frontendUrl + "/login?error="
                                            + URLEncoder.encode(
                                                    OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED,
                                                    StandardCharsets.UTF_8)
                                            + "&provider=GOOGLE")
                            .build();
                }
            }

            String finalTenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
            if (finalTenantId == null || finalTenantId.isEmpty()) {
                log.error("❌ Google OAuth2 콜백 - TenantContextHolder 에 tenant_id 가 설정되지 않았습니다.");
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                return ResponseEntity.status(302)
                        .header("Location",
                                frontendUrl + "/login?error="
                                        + URLEncoder.encode(
                                                OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED,
                                                StandardCharsets.UTF_8)
                                        + "&provider=GOOGLE")
                        .build();
            }

            // authorize 시 사용한 redirect_uri 와 동일한 값으로 토큰 교환 — apex 메인 도메인.
            String actualRedirectUri = buildGoogleCallbackUrl(request);
            if (actualRedirectUri == null || actualRedirectUri.isEmpty()) {
                actualRedirectUri = googleRedirectUri;
            }
            if (actualRedirectUri == null || actualRedirectUri.isEmpty()) {
                log.error("Google OAuth2 콜백 - redirect_uri 결정 실패");
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                        + URLEncoder.encode(OAuth2UserFacingMessages.ERR_LOGIN_SYSTEM_ERROR,
                                StandardCharsets.UTF_8)
                        + "&provider=GOOGLE")
                        .build();
            }

            OAuth2Service googleService = oauth2FactoryService.getOAuth2Service("GOOGLE");
            SocialLoginResponse response;
            if (googleService instanceof com.coresolution.consultation.service.impl.GoogleOAuth2ServiceImpl googleServiceImpl) {
                String accessToken = googleServiceImpl.getAccessToken(code, actualRedirectUri);
                com.coresolution.consultation.dto.SocialUserInfo socialUserInfo =
                        googleServiceImpl.getUserInfo(accessToken);
                socialUserInfo.setProvider("GOOGLE");
                socialUserInfo.setAccessToken(accessToken);
                socialUserInfo.normalizeData();

                final boolean isGoogleOAuthAccountLinkMode =
                        isOAuth2CallbackLinkMode(session, mode, SESSION_ATTR_OAUTH2_GOOGLE_MODE);
                Long existingUserId = null;
                try {
                    OAuthExistingUserResolution resolution =
                            googleService.resolveExistingUserForSocialLinkOrLogin(socialUserInfo,
                                    isGoogleOAuthAccountLinkMode);
                    if (resolution.isRequiresPhoneAccountSelection()
                            && !isGoogleOAuthAccountLinkMode) {
                        return redirectOAuthPhoneAccountSelection(request, session, state, "GOOGLE",
                                socialUserInfo, resolution);
                    }
                    existingUserId = resolution.getExistingUserId();
                } catch (Exception e) {
                    log.warn("⚠️ Google 기존 사용자 조회 실패: {}", e.getMessage());
                }
                if (existingUserId != null && !isGoogleOAuthAccountLinkMode) {
                    linkSocialAccountSafely(googleService, existingUserId, socialUserInfo);
                }

                if (isGoogleOAuthAccountLinkMode) {
                    User sessionUser = SessionUtils.getCurrentUser(session);
                    if (sessionUser == null) {
                        String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(
                                request, session, state, null);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        buildMypageOAuthLinkLocation(frontendUrl, false, "GOOGLE",
                                                OAuth2UserFacingMessages.ERR_LOGIN_SESSION_EXPIRED))
                                .build();
                    }
                    if (existingUserId != null && !existingUserId.equals(sessionUser.getId())) {
                        String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(
                                request, session, state, sessionUser);
                        return ResponseEntity.status(302).header("Location",
                                buildMypageOAuthLinkLocation(frontendUrl, false, "GOOGLE",
                                        OAuth2UserFacingMessages.ERR_SOCIAL_ALREADY_LINKED_TO_OTHER_ACCOUNT))
                                .build();
                    }
                    response = buildSocialLoginResponseForMyPageOAuthLink(sessionUser,
                            socialUserInfo);
                } else if (existingUserId == null
                        && shouldEnterOAuthPhoneOtpFlow(googleService, socialUserInfo)) {
                    return redirectOAuthPhoneVerification(request, session, state, "GOOGLE",
                            socialUserInfo);
                } else if (existingUserId == null) {
                    response = SocialLoginResponse.builder().success(false)
                            .message(OAuth2UserFacingMessages.MSG_SIGNUP_REQUIRED)
                            .requiresSignup(true).socialUserInfo(socialUserInfo).build();
                } else {
                    User user = loadUserByTenantScopedId(existingUserId, session, state)
                            .orElseThrow(() -> new RuntimeException(
                                    OAuth2UserFacingMessages.MSG_USER_NOT_FOUND));

                    java.util.List<String> permissions;
                    try {
                        permissions = dynamicPermissionService.getUserPermissionsAsStringList(user);
                    } catch (Exception e) {
                        log.warn("⚠️ 권한 조회 실패 (빈 리스트 반환): userId={}, 오류={}", user.getId(),
                                e.getMessage());
                        permissions = new java.util.ArrayList<>();
                    }
                    String jwtToken = jwtService.generateToken(user, permissions);
                    String refreshToken = jwtService.generateRefreshToken(user);

                    String finalProfileImageUrl = user.getProfileImageUrl() != null
                            && !user.getProfileImageUrl().trim().isEmpty()
                                    ? user.getProfileImageUrl()
                                    : (socialUserInfo.getProfileImageUrl() != null
                                            && !socialUserInfo.getProfileImageUrl().trim().isEmpty()
                                                    ? socialUserInfo.getProfileImageUrl()
                                                    : "/default-avatar.svg");

                    response = SocialLoginResponse.builder().success(true)
                            .message(OAuth2UserFacingMessages.MSG_GOOGLE_ACCOUNT_LOGGED_IN)
                            .accessToken(jwtToken).refreshToken(refreshToken)
                            .userInfo(SocialLoginResponse.UserInfo.builder().id(user.getId())
                                    .email(user.getEmail()).name(user.getName())
                                    .nickname(user.getNickname()).role(user.getRole().getValue())
                                    .profileImageUrl(finalProfileImageUrl)
                                    .providerUserId(socialUserInfo.getProviderUserId()).build())
                            .build();
                }
            } else {
                try {
                    response = oauth2FactoryService.authenticateWithProvider("GOOGLE", code);
                } catch (Exception e) {
                    log.error("Google OAuth2 인증 처리 중 오류 발생", e);
                    try {
                        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                    } catch (Exception txException) {
                        log.debug("트랜잭션 상태 확인 실패 (이미 롤백되었거나 트랜잭션이 없는 경우): {}",
                                txException.getMessage());
                    }
                    String redirectTenantId = resolveTenantIdForRedirect(session, state);
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                    String errorMessage = e.getMessage() != null ? e.getMessage()
                            : OAuth2UserFacingMessages.MSG_AUTH_PROCESSING_FAILED;
                    return ResponseEntity.status(302)
                            .header("Location",
                                    frontendUrl + "/login?error="
                                            + URLEncoder.encode(errorMessage,
                                                    StandardCharsets.UTF_8)
                                            + "&provider=GOOGLE")
                            .build();
                }
            }

            if (response.isRequiresPhoneAccountSelection()) {
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
                if (tenantId == null || tenantId.isBlank()) {
                    tenantId = redirectTenantId;
                }
                String tok = response.getPhoneAccountSelectionToken();
                if (tok == null || tok.isBlank()) {
                    return ResponseEntity.status(302).header("Location",
                            frontendUrl + "/login?error="
                                    + URLEncoder.encode(
                                            OAuth2UserFacingMessages.ERR_LOGIN_SYSTEM_ERROR,
                                            StandardCharsets.UTF_8)
                                    + "&provider=GOOGLE")
                            .build();
                }
                String q = "success=true&accountSelection=required&selectionToken="
                        + URLEncoder.encode(tok, StandardCharsets.UTF_8) + "&provider=GOOGLE&tenantId="
                        + URLEncoder.encode(tenantId != null ? tenantId : "", StandardCharsets.UTF_8);
                return ResponseEntity.status(302)
                        .header("Location", frontendUrl + "/auth/oauth2/callback?" + q)
                        .build();
            }

            if (response.isSuccess()) {
                SocialLoginResponse.UserInfo userInfo = response.getUserInfo();
                if (userInfo == null) {
                    log.error("Google OAuth2 - userInfo가 null 입니다. requiresSignup={}",
                            response.isRequiresSignup());
                    String redirectTenantId = resolveTenantIdForRedirect(session, state);
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                    return ResponseEntity.status(302)
                            .header("Location",
                                    frontendUrl + "/login?error="
                                            + URLEncoder.encode(
                                                    OAuth2UserFacingMessages.MSG_USER_INFO_UNAVAILABLE,
                                                    StandardCharsets.UTF_8)
                                            + "&provider=GOOGLE")
                            .build();
                }

                String effectiveMode =
                        consumeOAuth2EffectiveMode(session, mode, SESSION_ATTR_OAUTH2_GOOGLE_MODE);
                if (OAUTH2_MODE_LINK.equals(effectiveMode)) {
                    User currentUser = SessionUtils.getCurrentUser(session);
                    if (currentUser == null) {
                        String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(
                                request, session, state, null);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        buildMypageOAuthLinkLocation(frontendUrl, false, "GOOGLE",
                                                OAuth2UserFacingMessages.ERR_LOGIN_SESSION_EXPIRED))
                                .build();
                    }
                    try {
                        SocialUserInfo socialUserInfo = new SocialUserInfo();
                        String googleProviderUserId =
                                resolveOAuthProviderUserIdForLink(response, userInfo);
                        if (googleProviderUserId == null || googleProviderUserId.isEmpty()) {
                            log.error("Google 계정 연동 실패: SNS provider 사용자 ID 없음");
                            String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(
                                    request, session, state, currentUser);
                            return ResponseEntity.status(302)
                                    .header("Location",
                                            buildMypageOAuthLinkLocation(frontendUrl, false, "GOOGLE",
                                                    OAuth2UserFacingMessages.ERR_ACCOUNT_LINK_FAILED))
                                    .build();
                        }
                        socialUserInfo.setProviderUserId(googleProviderUserId);
                        socialUserInfo.setEmail(userInfo.getEmail());
                        socialUserInfo.setName(userInfo.getName());
                        socialUserInfo.setNickname(userInfo.getNickname());
                        socialUserInfo.setProfileImageUrl(userInfo.getProfileImageUrl());
                        socialUserInfo.setProvider("GOOGLE");

                        OAuth2Service oauth2Service =
                                oauth2FactoryService.getOAuth2Service("GOOGLE");
                        oauth2Service.linkSocialAccountToUser(currentUser.getId(), socialUserInfo);
                        log.info("Google 계정 연동 성공: 기존 사용자 userId={}, googleProviderUserId={}",
                                currentUser.getId(), googleProviderUserId);

                        String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(
                                request, session, state, currentUser);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        buildMypageOAuthLinkLocation(frontendUrl, true, "GOOGLE",
                                                OAuth2UserFacingMessages.ERR_ACCOUNT_LINK_COMPLETE))
                                .build();
                    } catch (Exception e) {
                        log.error("Google 계정 연동 실패", e);
                        String frontendUrl = getTenantAwareFrontendBaseUrlForSnsLinkRedirect(
                                request, session, state, currentUser);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        buildMypageOAuthLinkLocation(frontendUrl, false, "GOOGLE",
                                                OAuth2UserFacingMessages.ERR_ACCOUNT_LINK_FAILED))
                                .build();
                    }
                } else {
                    SessionUtils.clearSession(session);
                    session = request.getSession(true);

                    User user = loadUserByTenantScopedId(userInfo.getId(), session, state)
                            .orElseThrow(() -> new RuntimeException(
                                    OAuth2UserFacingMessages.MSG_USER_NOT_FOUND));
                    SessionUtils.setCurrentUser(session, user);
                    setSpringSecurityAuthentication(user);
                    session.setAttribute("SPRING_SECURITY_CONTEXT",
                            SecurityContextHolder.getContext());
                    session.setMaxInactiveInterval(SessionConstants.SESSION_TIMEOUT_SECONDS);

                    log.info("Google OAuth2 로그인 성공: userId={}, role={}, profileImageSummary={}",
                            user.getId(), user.getRole(),
                            profileImageUrlLogSummary(user.getProfileImageUrl()));

                    String tenantId = user.getTenantId();
                    if (tenantId == null || tenantId.isEmpty()) {
                        tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
                        if (tenantId == null || tenantId.isEmpty()) {
                            tenantId = (String) session.getAttribute("oauth2_tenant_id");
                            if (tenantId == null || tenantId.isEmpty()) {
                                tenantId = (String) session.getAttribute("tenantId");
                            }
                        }
                    }
                    String frontendUrl = getTenantAwareFrontendBaseUrl(request, tenantId);
                    String providerUserIdForCallback = userInfo.getProviderUserId();
                    String redirectUrl = frontendUrl + "/auth/oauth2/callback?"
                            + buildOAuthWebCallbackQueryString(user, "GOOGLE", tenantId,
                                    providerUserIdForCallback);

                    String sessionId = session.getId();
                    String cookieValue = String.format(
                            "JSESSIONID=%s; Path=/; SameSite=None; Max-Age=%d; Secure; HttpOnly=false",
                            sessionId, SessionConstants.SESSION_TIMEOUT_SECONDS);

                    logOAuthRedirectLocationSummary("Google 웹 OAuth", redirectUrl);
                    return ResponseEntity.status(302).header("Location", redirectUrl)
                            .header("Set-Cookie", cookieValue).build();
                }
            } else if (response.isRequiresSignup()) {
                log.info("Google OAuth2 간편 회원가입 필요: providerUserId={}",
                        response.getSocialUserInfo() != null
                                ? response.getSocialUserInfo().getProviderUserId()
                                : null);

                String tenantId = (String) session.getAttribute("oauth2_tenant_id");
                if (tenantId != null && !tenantId.isEmpty()) {
                    session.removeAttribute("oauth2_tenant_id");
                }
                if (tenantId == null || tenantId.isEmpty()) {
                    tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
                }

                String email = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getEmail()
                        : "";
                String name = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getName()
                        : "";
                String nickname = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getNickname()
                        : "";
                String providerUserIdForSignup = response.getSocialUserInfo() != null
                        && response.getSocialUserInfo().getProviderUserId() != null
                                ? response.getSocialUserInfo().getProviderUserId()
                                : "";

                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                if (redirectTenantId == null || redirectTenantId.isEmpty()) {
                    redirectTenantId = tenantId;
                }
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                String signupUrl = frontendUrl + "/login?" + "signup=required" + "&provider=google"
                        + (tenantId != null && !tenantId.isEmpty()
                                ? "&tenantId="
                                        + URLEncoder.encode(tenantId, StandardCharsets.UTF_8)
                                : "")
                        + "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
                        + "&name=" + URLEncoder.encode(name, StandardCharsets.UTF_8)
                        + "&nickname=" + URLEncoder.encode(nickname, StandardCharsets.UTF_8)
                        + "&providerUserId="
                        + URLEncoder.encode(providerUserIdForSignup, StandardCharsets.UTF_8);

                return ResponseEntity.status(302).header("Location", signupUrl).build();
            } else {
                String redirectTenantId = resolveTenantIdForRedirect(session, state);
                String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
                return ResponseEntity.status(302)
                        .header("Location",
                                frontendUrl + "/login?error="
                                        + URLEncoder.encode(response.getMessage(),
                                                StandardCharsets.UTF_8)
                                        + "&provider=GOOGLE")
                        .build();
            }
        } catch (Exception e) {
            log.error("Google OAuth2 콜백 처리 실패: {}", e.getMessage(), e);
            String errorMessage = e.getMessage() != null ? e.getMessage()
                    : OAuth2UserFacingMessages.ERR_LOGIN_PROCESS_FAILED;
            String redirectTenantId = resolveTenantIdForRedirect(session, state);
            String frontendUrl = getTenantAwareFrontendBaseUrl(request, redirectTenantId);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode(errorMessage, StandardCharsets.UTF_8) + "&provider=GOOGLE")
                    .build();
        }
    }

    /**
     * 모바일 OAuth2 콜백 처리 (Deep Link에서 받은 정보로 세션 복원) POST /api/auth/oauth2/callback Deep Link에서 받은
     * userId로 사용자 정보 조회 및 세션 설정
     */
    @PostMapping("/oauth2/callback")
    public ResponseEntity<?> mobileOAuth2Callback(@RequestBody Map<String, Object> requestBody,
            HttpServletRequest request, HttpSession session) {
        try {
            String provider = (String) requestBody.get("provider");
            String sessionId = (String) requestBody.get("sessionId"); // Deep Link에서 받은 세션 ID
            String userIdStr = (String) requestBody.get("userId"); // Deep Link에서 받은 userId

            log.info("모바일 OAuth2 콜백 요청: provider={}, sessionId={}, userId={}", provider,
                    sessionId != null ? "있음" : "없음", userIdStr);

            // userId로 사용자 정보 조회
            if (userIdStr == null || userIdStr.isEmpty()) {
                log.error("모바일 OAuth2 콜백 - userId가 없습니다.");
                return ResponseEntity.status(400)
                        .body(Map.of("success", false, "message", OAuth2UserFacingMessages.MSG_USER_ID_REQUIRED));
            }

            Long userId;
            try {
                userId = Long.parseLong(userIdStr);
            } catch (NumberFormatException e) {
                log.error("모바일 OAuth2 콜백 - userId 파싱 실패: {}", userIdStr);
                return ResponseEntity.status(400)
                        .body(Map.of("success", false, "message", OAuth2UserFacingMessages.MSG_INVALID_USER_ID));
            }

            // 사용자 정보 조회 (테넌트 결합: 세션·Holder·로컬 폴백만 허용)
            User user = loadUserByTenantScopedId(userId, session, null)
                    .orElseThrow(() -> new RuntimeException(String.format(
                            OAuth2UserFacingMessages.MSG_USER_NOT_FOUND_USER_ID_FMT, userId)));

            // 세션 생성 또는 기존 세션 사용
            if (sessionId != null && !sessionId.isEmpty()) {
                // 기존 세션 ID가 있으면 해당 세션 사용 시도
                try {
                    HttpSession existingSession = request.getSession(false);
                    if (existingSession != null && existingSession.getId().equals(sessionId)) {
                        session = existingSession;
                        log.info("모바일 OAuth2 콜백 - 기존 세션 사용: sessionId={}", sessionId);
                    } else {
                        // 세션 ID가 일치하지 않으면 새 세션 생성
                        session = request.getSession(true);
                        log.info("모바일 OAuth2 콜백 - 새 세션 생성 (기존 세션 ID 불일치): sessionId={}",
                                session.getId());
                    }
                } catch (Exception e) {
                    // 기존 세션 조회 실패 시 새 세션 생성
                    session = request.getSession(true);
                    log.info("모바일 OAuth2 콜백 - 새 세션 생성 (기존 세션 조회 실패): sessionId={}",
                            session.getId());
                }
            } else {
                // 세션 ID가 없으면 새 세션 생성
                session = request.getSession(true);
                log.info("모바일 OAuth2 콜백 - 새 세션 생성: sessionId={}", session.getId());
            }

            // 세션에 사용자 정보 저장
            SessionUtils.setCurrentUser(session, user);

            // SpringSecurity 인증 컨텍스트 설정
            setSpringSecurityAuthentication(user);

            // 세션에 SecurityContext 저장
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

            session.setMaxInactiveInterval(SessionConstants.SESSION_TIMEOUT_SECONDS);

            log.info("모바일 OAuth2 콜백 - 세션 설정 완료: userId={}, role={}, sessionId={}", user.getId(),
                    user.getRole(), session.getId());

            // 사용자 정보 반환
            Map<String, Object> userInfo = Map.of("id", user.getId(), "email", user.getEmail(),
                    "name", user.getName() != null ? user.getName() : "", "nickname",
                    user.getNickname() != null ? user.getNickname() : "", "role",
                    user.getRole().name(), "profileImageUrl",
                    user.getProfileImageUrl() != null ? user.getProfileImageUrl() : "");

            Map<String, Object> data = new HashMap<>();
            data.put("sessionId", session.getId());
            data.put("user", userInfo);

            return success(OAuth2UserFacingMessages.MSG_LOGIN_SUCCESS, data);
        } catch (Exception e) {
            log.error("모바일 OAuth2 콜백 처리 실패", e);
            throw new RuntimeException(String.format(OAuth2UserFacingMessages.MSG_UNEXPECTED_ERROR_FMT,
                    e.getMessage()));
        }
    }

    /**
     * SpringSecurity 인증 컨텍스트에 사용자 정보 설정 OAuth2 로그인 후 API 호출 시 인증이 유지되도록 함
     */
    private void setSpringSecurityAuthentication(User user) {
        try {
            // 사용자 권한 설정
            List<SimpleGrantedAuthority> authorities =
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

            // Authentication 객체 생성
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(user.getEmail(), null, authorities);

            // SecurityContext에 설정
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 세션에 SecurityContext 저장 (명시적으로)
            SecurityContext securityContext = SecurityContextHolder.getContext();

            log.info("🔐 SpringSecurity 인증 컨텍스트 설정 완료: email={}, role={}, authorities={}",
                    user.getEmail(), user.getRole(), authorities);
            log.info("🔐 SecurityContext 저장됨: {}", securityContext.getAuthentication() != null);

        } catch (Exception e) {
            log.error("SpringSecurity 인증 컨텍스트 설정 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * OAuth 전화 계정 선택 미리보기(POST 전용, 토큰은 바디).
     */
    @PostMapping("/oauth2/account-selection-preview")
    public ResponseEntity<ApiResponse<OAuthAccountSelectionPreviewResponse>> oauthAccountSelectionPreview(
            @RequestBody OAuthAccountSelectionPreviewRequest requestBody) {
        String previousTenant = com.coresolution.core.context.TenantContextHolder.getTenantId();
        try {
            if (requestBody == null || requestBody.getSelectionToken() == null
                || requestBody.getSelectionToken().isBlank()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(OAuth2UserFacingMessages.ERR_OAUTH_SELECTION_TOKEN_INVALID));
            }
            OAuthPhoneAccountSelectionClaims claims;
            try {
                claims = jwtService.parseOAuthPhoneAccountSelectionToken(requestBody.getSelectionToken());
            } catch (Exception e) {
                log.debug("OAuth selection token parse failed: {}", e.getMessage());
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(OAuth2UserFacingMessages.ERR_OAUTH_SELECTION_TOKEN_INVALID));
            }
            if (previousTenant == null || !previousTenant.equals(claims.getTenantId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED));
            }
            com.coresolution.core.context.TenantContextHolder.setTenantId(claims.getTenantId());
            List<OAuthAccountSelectionPreviewItem> items = new java.util.ArrayList<>();
            for (Long uid : claims.getAllowedUserIds()) {
                User u = userRepository.findByTenantIdAndId(claims.getTenantId(), uid).orElse(null);
                if (u == null) {
                    continue;
                }
                String roleStr = u.getRole() != null ? u.getRole().name() : "";
                items.add(OAuthAccountSelectionPreviewItem.builder().userId(u.getId()).role(roleStr)
                    .roleDisplayLabel(OAuthAccountSelectionUserFacingStrings.roleDisplayLabel(u.getRole()))
                    .dashboardGuide(OAuthAccountSelectionUserFacingStrings.dashboardGuideForRole(u.getRole()))
                    .optionLabel(buildAccountSelectionOptionLabel(u)).build());
            }
            OAuthAccountSelectionPreviewResponse resp = OAuthAccountSelectionPreviewResponse.builder()
                .provider(claims.getProvider()).candidates(items).build();
            return success(resp);
        } finally {
            if (previousTenant != null && !previousTenant.isBlank()) {
                com.coresolution.core.context.TenantContextHolder.setTenantId(previousTenant);
            } else {
                com.coresolution.core.context.TenantContextHolder.clear();
            }
        }
    }

    /**
     * OAuth 전화 계정 선택 완료: 소셜 연동 후 로그인 JWT 발급.
     */
    @PostMapping("/oauth2/complete-account-selection")
    public ResponseEntity<ApiResponse<OAuthAccountSelectionCompleteData>> oauthCompleteAccountSelection(
            @RequestBody OAuthAccountSelectionCompleteRequest requestBody) {
        String previousTenant = com.coresolution.core.context.TenantContextHolder.getTenantId();
        try {
            if (requestBody == null || requestBody.getSelectionToken() == null
                || requestBody.getSelectionToken().isBlank() || requestBody.getSelectedUserId() == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(OAuth2UserFacingMessages.ERR_OAUTH_SELECTION_TOKEN_INVALID));
            }
            OAuthPhoneAccountSelectionClaims claims;
            try {
                claims = jwtService.parseOAuthPhoneAccountSelectionToken(requestBody.getSelectionToken());
            } catch (Exception e) {
                log.debug("OAuth selection token parse failed: {}", e.getMessage());
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(OAuth2UserFacingMessages.ERR_OAUTH_SELECTION_TOKEN_INVALID));
            }
            if (previousTenant == null || !previousTenant.equals(claims.getTenantId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED));
            }
            if (!claims.getAllowedUserIds().contains(requestBody.getSelectedUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(OAuth2UserFacingMessages.ERR_OAUTH_SELECTION_USER_NOT_ALLOWED));
            }
            com.coresolution.core.context.TenantContextHolder.setTenantId(claims.getTenantId());
            OAuth2Service oauth2Service = oauth2FactoryService.getOAuth2Service(claims.getProvider());
            SocialUserInfo socialUserInfo = claims.toSocialUserInfo();
            oauth2Service.linkSocialAccountToUser(requestBody.getSelectedUserId(), socialUserInfo);
            User user = userRepository.findByTenantIdAndId(claims.getTenantId(), requestBody.getSelectedUserId())
                .orElseThrow(() -> new RuntimeException(OAuth2UserFacingMessages.MSG_USER_NOT_FOUND));
            java.util.List<String> permissions;
            try {
                permissions = dynamicPermissionService.getUserPermissionsAsStringList(user);
            } catch (Exception e) {
                log.warn("권한 조회 실패 (빈 리스트): userId={}, err={}", user.getId(), e.getMessage());
                permissions = new java.util.ArrayList<>();
            }
            String accessToken = jwtService.generateToken(user, permissions);
            String refreshToken = jwtService.generateRefreshToken(user);
            OAuthAccountSelectionCompleteData data = OAuthAccountSelectionCompleteData.builder()
                .accessToken(accessToken).refreshToken(refreshToken).userId(user.getId()).email(user.getEmail())
                .name(user.getName()).nickname(user.getNickname())
                .role(user.getRole() != null ? user.getRole().getValue() : null)
                .profileImageUrl(user.getProfileImageUrl()).tenantId(user.getTenantId())
                .providerUserId(claims.getProviderUserId()).build();
            return success(data);
        } catch (RuntimeException e) {
            log.error("OAuth 계정 선택 완료 처리 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(
                String.format(OAuth2UserFacingMessages.MSG_UNEXPECTED_ERROR_FMT, e.getMessage())));
        } finally {
            if (previousTenant != null && !previousTenant.isBlank()) {
                com.coresolution.core.context.TenantContextHolder.setTenantId(previousTenant);
            } else {
                com.coresolution.core.context.TenantContextHolder.clear();
            }
        }
    }

    /**
     * 네이티브 SDK 로그인 (모바일 앱 전용) Deep Link 없이 accessToken으로 직접 로그인.
     *
     * <p>**P0 2026-06-10**: Google (Expo `expo-auth-session/providers/google`) 응답이 iOS 일부
     * 빌드에서 `accessToken` 없이 `idToken` 만 전달하는 케이스를 발견. 본 메서드는
     * `provider=GOOGLE` 이고 `accessToken` 이 비고 `idToken` 이 있을 때
     * {@link com.coresolution.consultation.service.impl.GoogleOAuth2ServiceImpl#getUserInfoFromIdToken(String)}
     * 폴백 경로를 사용한다. Kakao/Naver/Apple 은 기존과 동일하게 accessToken 필수.</p>
     */
    @PostMapping("/social-login")
    public ResponseEntity<Map<String, Object>> socialLoginWithAccessToken(
            @RequestBody Map<String, Object> requestBody, HttpServletRequest request,
            HttpServletResponse response, HttpSession session) {
        try {
            String provider = (String) requestBody.get("provider");
            String accessToken = (String) requestBody.get("accessToken");
            String idToken = (String) requestBody.get("idToken");

            // userId는 Long 또는 String으로 올 수 있으므로 안전하게 처리
            String userIdStr = null;
            Object userIdObj = requestBody.get("userId");
            if (userIdObj != null) {
                if (userIdObj instanceof Long) {
                    userIdStr = String.valueOf((Long) userIdObj);
                } else if (userIdObj instanceof String) {
                    userIdStr = (String) userIdObj;
                } else {
                    userIdStr = String.valueOf(userIdObj);
                }
            }

            String email = (String) requestBody.get("email");
            String nickname = (String) requestBody.get("nickname");
            String profileImage = (String) requestBody.get("profileImage");

            log.info("네이티브 SDK 로그인 요청: provider={}, userId={}, email={}, hasAccessToken={}, hasIdToken={}",
                    provider, userIdStr, email,
                    accessToken != null && !accessToken.isBlank(),
                    idToken != null && !idToken.isBlank());

            if (provider == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message",
                                OAuth2UserFacingMessages.MSG_PROVIDER_AND_ACCESS_TOKEN_REQUIRED));
            }

            // Google idToken-only 폴백 외에는 기존과 동일하게 accessToken 필수.
            boolean hasAccessToken = accessToken != null && !accessToken.isBlank();
            boolean hasIdToken = idToken != null && !idToken.isBlank();
            boolean isGoogleIdTokenFallback = "GOOGLE".equalsIgnoreCase(provider)
                    && !hasAccessToken && hasIdToken;
            if (!hasAccessToken && !isGoogleIdTokenFallback) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message",
                                OAuth2UserFacingMessages.MSG_PROVIDER_AND_ACCESS_TOKEN_REQUIRED));
            }

            // OAuth2 서비스 가져오기
            OAuth2Service oauth2Service = oauth2FactoryService.getOAuth2Service(provider);
            if (oauth2Service == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message",
                                OAuth2UserFacingMessages.MSG_UNSUPPORTED_SOCIAL_PLATFORM));
            }

            // accessToken 우선, 없으면 Google idToken 폴백으로 사용자 정보 조회.
            SocialUserInfo socialUserInfo;
            if (isGoogleIdTokenFallback
                    && oauth2Service instanceof com.coresolution.consultation.service.impl.GoogleOAuth2ServiceImpl googleService) {
                log.info("Google idToken-only 폴백으로 사용자 정보 조회 (accessToken 부재)");
                socialUserInfo = googleService.getUserInfoFromIdToken(idToken);
            } else {
                socialUserInfo = oauth2Service.getUserInfo(accessToken);
            }
            socialUserInfo.setProvider(provider);
            // SocialAccount 연동 시 빈 accessToken 저장을 막기 위해 실제 보유 토큰만 세팅.
            socialUserInfo.setAccessToken(hasAccessToken ? accessToken : idToken);
            socialUserInfo.normalizeData();

            String tenantIdForNative =
                    com.coresolution.core.context.TenantContextHolder.getTenantId();
            if (tenantIdForNative == null || tenantIdForNative.isEmpty()) {
                log.error("❌ 네이티브 SDK - TenantContextHolder에 tenantId가 없어 사용자 조회 불가");
                return ResponseEntity.badRequest().body(Map.of("success", false, "message",
                        OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED));
            }

            OAuthExistingUserResolution resolution =
                oauth2Service.resolveExistingUserForSocialLinkOrLogin(socialUserInfo);
            if (resolution.isRequiresPhoneAccountSelection()) {
                String token = jwtService.generateOAuthPhoneAccountSelectionToken(tenantIdForNative,
                    provider, socialUserInfo.getProviderUserId(),
                    resolution.getPhoneMatchCandidateUserIds(), socialUserInfo);
                return ResponseEntity.ok(Map.of("success", false, "requiresPhoneAccountSelection", true,
                    "selectionToken", token, "tenantId", tenantIdForNative, "provider", provider, "message",
                    OAuth2UserFacingMessages.MSG_PHONE_ACCOUNT_SELECTION_REQUIRED));
            }
            Long existingUserId = resolution.getExistingUserId();
            if (existingUserId != null) {
                linkSocialAccountSafely(oauth2Service, existingUserId, socialUserInfo);
            }

            if (existingUserId == null && shouldEnterOAuthPhoneOtpFlow(oauth2Service, socialUserInfo)) {
                OAuthProvider oauthProvider = OAuthProvider.fromString(oauth2Service.getProviderName());
                String phoneVerificationToken = issueOAuthPhoneVerificationToken(oauthProvider,
                    socialUserInfo, tenantIdForNative);
                if (phoneVerificationToken != null && !phoneVerificationToken.isBlank()) {
                    Map<String, Object> otpResponse = new HashMap<>();
                    otpResponse.put("success", true);
                    otpResponse.put("requiresOAuthPhoneVerification", true);
                    otpResponse.put("phoneVerificationToken", phoneVerificationToken);
                    otpResponse.put("provider", provider);
                    otpResponse.put("tenantId", tenantIdForNative);
                    otpResponse.put("message", OAuth2UserFacingMessages.MSG_SIGNUP_REQUIRED);
                    return ResponseEntity.ok(otpResponse);
                }
                log.warn(
                    "social-login: OAuth phone verification token 발급 실패 — requiresSignup fallback (provider={})",
                    provider);
            }

            if (existingUserId == null) {
                // 신규 사용자 - 회원가입 필요
                // null-safe 응답 빌드 — Map.of 는 null key/value 비허용이므로 카카오·네이버 동의 누락
                // 사용자(email/socialId 가 null) 케이스에서 NPE 500 으로 미가입 분기 자체가 막혔다.
                // providerUserId 가 부재하면 모바일 parseSocialUserInfoDraft 가 가입 화면 진입 자체를
                // 거부하므로 그 케이스는 명시적 에러 응답으로 빠져 사용자에게 다른 메시지를 노출한다.
                String pid = socialUserInfo.getProviderUserId();
                if (pid == null || pid.isBlank()) {
                    log.warn(
                            "⚠️ social-login: providerUserId 부재 — 가입 분기 진행 불가 (provider={}, email={})",
                            provider,
                            socialUserInfo.getEmail() != null ? "<있음>" : "<없음>");
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("success", false);
                    errorResponse.put("message", OAuth2UserFacingMessages.MSG_SIGNUP_REQUIRED);
                    return ResponseEntity.ok(errorResponse);
                }

                Map<String, Object> socialUserInfoMap = new HashMap<>();
                socialUserInfoMap.put("email",
                        socialUserInfo.getEmail() != null ? socialUserInfo.getEmail() : "");
                socialUserInfoMap.put("nickname",
                        socialUserInfo.getNickname() != null ? socialUserInfo.getNickname() : "");
                socialUserInfoMap.put("provider", provider != null ? provider : "");
                socialUserInfoMap.put("socialId", pid);

                Map<String, Object> signupRequiredResponse = new HashMap<>();
                signupRequiredResponse.put("success", false);
                signupRequiredResponse.put("requiresSignup", true);
                signupRequiredResponse.put("socialUserInfo", socialUserInfoMap);
                signupRequiredResponse.put("message", OAuth2UserFacingMessages.MSG_SIGNUP_REQUIRED);

                return ResponseEntity.ok(signupRequiredResponse);
            }

            // 기존 사용자 로그인
            User user = loadUserByTenantScopedId(existingUserId, session, null)
                    .orElseThrow(() -> new RuntimeException(OAuth2UserFacingMessages.MSG_USER_NOT_FOUND));
            // 세션에 사용자 정보 저장 (다른 메서드와 동일한 방식 사용)
            SessionUtils.setCurrentUser(session, user);

            // 세션 저장 확인 (iOS 디버깅용)
            User savedUser = SessionUtils.getCurrentUser(session);
            log.info("🍎 iOS - 세션에 사용자 저장 확인: sessionId={}, savedUser={}", session.getId(),
                    savedUser != null ? savedUser.getEmail() : "null");

            // SecurityContext 설정
            setSpringSecurityAuthentication(user);

            // 세션에 SecurityContext 저장 (명시적으로 - 다른 메서드와 동일)
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

            session.setMaxInactiveInterval(SessionConstants.SESSION_TIMEOUT_SECONDS);

            // UserSession 엔티티 생성 (데이터베이스에 저장하여 SessionBasedAuthenticationFilter에서 조회 가능하도록)
            // 모바일 앱은 중복 로그인 체크를 우회하여 항상 새 세션을 생성
            try {
                String clientIp = request.getRemoteAddr();
                String userAgent = request.getHeader("User-Agent");

                // 모바일 앱인지 확인 (User-Agent로 판단)
                boolean isMobileApp = userAgent != null && (userAgent.contains("MindGardenMobile")
                        || userAgent.contains("ReactNative") || userAgent.contains("okhttp") || // Android
                        userAgent.contains("CFNetwork") // iOS
                );

                if (isMobileApp) {
                    // 모바일 앱: 기존 세션을 비활성화하지 않고 새 세션만 생성
                    // (중복 로그인 체크 로직 우회)
                    userSessionService.createSession(user, session.getId(), clientIp, userAgent,
                            "SOCIAL", provider);
                    log.info("🍎 iOS - UserSession 엔티티 생성 완료 (모바일 앱): sessionId={}, userId={}",
                            session.getId(), user.getId());
                } else {
                    // 웹: 기존 로직 사용 (중복 로그인 체크 포함)
                    userSessionService.createSession(user, session.getId(), clientIp, userAgent,
                            "SOCIAL", provider);
                    log.info("✅ UserSession 엔티티 생성 완료 (웹): sessionId={}, userId={}",
                            session.getId(), user.getId());
                }
            } catch (Exception e) {
                log.warn("⚠️ UserSession 엔티티 생성 실패 (무시): sessionId={}, error={}", session.getId(),
                        e.getMessage());
            }

            // Phase 3: 확장된 JWT 토큰 생성 (tenantId, branchId, permissions 포함)
            // 권한 조회 시 예외 발생해도 빈 리스트 반환 (트랜잭션 롤백 오류 방지)
            java.util.List<String> permissions;
            try {
                permissions = dynamicPermissionService.getUserPermissionsAsStringList(user);
            } catch (Exception e) {
                log.warn("⚠️ 권한 조회 실패 (빈 리스트 반환): userId={}, 오류={}", user.getId(), e.getMessage());
                permissions = new java.util.ArrayList<>();
            }
            String jwtToken = jwtService.generateToken(user, permissions);
            String refreshToken = jwtService.generateRefreshToken(user.getEmail());

            log.info("네이티브 SDK 로그인 성공: userId={}, email={}, role={}, sessionId={}", user.getId(),
                    user.getEmail(), user.getRole(), session.getId());

            // iOS 모바일 앱: Set-Cookie 헤더로 JSESSIONID를 명시적으로 설정
            // (Spring이 자동으로 설정하지만, iOS에서는 명시적으로 설정하는 것이 더 안전)
            response.setHeader("Set-Cookie", String
                    .format("JSESSIONID=%s; Path=/; HttpOnly; SameSite=Lax", session.getId()));

            return ResponseEntity.ok(Map.of("success", true, "user",
                    Map.of("id", user.getId(), "email", user.getEmail(), "name", user.getName(),
                            "nickname", user.getNickname() != null ? user.getNickname() : "",
                            "role", user.getRole().name(), "profileImageUrl",
                            user.getProfileImageUrl() != null ? user.getProfileImageUrl() : ""),
                    "accessToken", jwtToken, "refreshToken", refreshToken, "sessionId",
                    session.getId(), "message", OAuth2UserFacingMessages.MSG_LOGIN_SUCCESS));
        } catch (Exception e) {
            log.error("네이티브 SDK 로그인 오류:", e);
            return ResponseEntity.status(500).body(
                    Map.of("success", false, "message",
                            String.format(OAuth2UserFacingMessages.MSG_NATIVE_LOGIN_FAILED_FMT,
                                    e.getMessage())));
        }
    }

    /**
     * 서브도메인에서 tenant_id 추출
     *
     * @param request HTTP 요청
     * @return tenant_id 또는 null
     */
    private String extractTenantIdFromSubdomain(HttpServletRequest request) {
        try {
            String host = request.getHeader("Host");
            if (host == null || host.isEmpty()) {
                host = request.getHeader("X-Forwarded-Host");
            }

            if (host == null || host.isEmpty()) {
                return null;
            }

            // 포트 제거
            String hostWithoutPort = host.split(":")[0];

            // 서브도메인 추출
            String extractedSubdomain = null;

            // 로컬 환경 지원: localhost 서브도메인 패턴 (우선 처리)
            if (hostWithoutPort.endsWith(".localhost")) {
                extractedSubdomain = hostWithoutPort.replace(".localhost", "");
            } else if (hostWithoutPort.endsWith(".127.0.0.1")) {
                extractedSubdomain = hostWithoutPort.replace(".127.0.0.1", "");
            } else if (hostWithoutPort.contains("localhost") && hostWithoutPort.contains(".")) {
                // mindgarden.localhost 형식
                int dotIndex = hostWithoutPort.indexOf('.');
                if (dotIndex > 0) {
                    extractedSubdomain = hostWithoutPort.substring(0, dotIndex);
                }
            } else {
                // 프로덕션 도메인 패턴 (coresolution 도메인 우선, 기존 m-garden 호환성 유지)
                String[] patterns = {"\\.dev\\.core-solution\\.co\\.kr$",
                        "\\.core-solution\\.co\\.kr$", "\\.dev\\.m-garden\\.co\\.kr$", // 기존 호환성 유지
                        "\\.m-garden\\.co\\.kr$" // 기존 호환성 유지
                };

                for (String pattern : patterns) {
                    if (hostWithoutPort.matches(".*" + pattern)) {
                        extractedSubdomain = hostWithoutPort.replaceFirst(pattern, "");
                        break;
                    }
                }
            }

            // 기본 서브도메인 제외
            if (extractedSubdomain != null) {
                final String subdomain = extractedSubdomain; // final로 선언하여 람다에서 사용 가능하도록
                String[] defaultSubdomains = {"dev", "app", "api", "staging", "www"};
                for (String defaultSub : defaultSubdomains) {
                    if (subdomain.equals(defaultSub)) {
                        return null;
                    }
                }

                // 서브도메인으로 테넌트 조회
                if (!subdomain.isEmpty()) {
                    return tenantRepository.findBySubdomainIgnoreCase(subdomain).map(tenant -> {
                        log.info("✅ 서브도메인으로 테넌트 조회 성공: subdomain={}, tenantId={}", subdomain,
                                tenant.getTenantId());
                        return tenant.getTenantId();
                    }).orElseGet(() -> {
                        log.warn("⚠️ 서브도메인으로 테넌트를 찾을 수 없음: subdomain={} (테넌트 등록 필요)", subdomain);
                        return null;
                    });
                }
            }

            return null;
        } catch (Exception e) {
            log.error("❌ 서브도메인에서 tenant_id 추출 실패: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * 로컬 또는 개발 프로파일 여부 확인
     * @return 로컬 또는 개발 프로파일이면 true
     */
    private boolean isLocalProfile() {
        if (environment == null) {
            return false;
        }
        String[] activeProfiles = environment.getActiveProfiles();
        for (String profile : activeProfiles) {
            if ("local".equals(profile) || "dev".equals(profile)) {
                return true;
            }
        }
        return false;
    }
}
