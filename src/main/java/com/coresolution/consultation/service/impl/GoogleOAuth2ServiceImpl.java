package com.coresolution.consultation.service.impl;

import java.util.Map;
import com.coresolution.consultation.dto.SocialUserInfo;
import com.coresolution.consultation.entity.auth.OAuthProvider;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

/**
 * Google OAuth2 서비스 구현체
 * Week 14: Google/Apple OAuth2 추가
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
public class GoogleOAuth2ServiceImpl extends AbstractOAuth2Service {

    /**
     * Google `tokeninfo` 엔드포인트 — OpenID Connect ID Token 검증 + claims 추출.
     *
     * <p>응답에는 `sub`(provider user id), `email`, `email_verified`, `name`, `given_name`,
     * `family_name`, `picture` 등이 포함된다. {@link #getUserInfoFromIdToken(String)} 가 사용한다.</p>
     */
    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    private final RestTemplate restTemplate;

    @Value("${spring.security.oauth2.client.registration.google.client-id:${GOOGLE_CLIENT_ID:dummy}}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret:${GOOGLE_CLIENT_SECRET:dummy}}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.google.redirect-uri:${GOOGLE_REDIRECT_URI:}}")
    private String redirectUri;
    
    public GoogleOAuth2ServiceImpl(
            RestTemplate restTemplate,
            UserRepository userRepository,
            ClientRepository clientRepository,
            UserSocialAccountRepository userSocialAccountRepository,
            JwtService jwtService,
            com.coresolution.consultation.service.DynamicPermissionService dynamicPermissionService,
            PersonalDataEncryptionUtil encryptionUtil,
            PasswordService passwordService,
            UserService userService) {
        super(userRepository, clientRepository, userSocialAccountRepository, jwtService,
            dynamicPermissionService, encryptionUtil, passwordService, userService);
        this.restTemplate = restTemplate;
    }
    
    @PostConstruct
    public void init() {
        log.info("Google OAuth2 설정 로드: clientId={}, clientSecret={} (길이: {}), redirectUri={}", 
                clientId != null ? clientId.substring(0, Math.min(10, clientId.length())) + "..." : "null",
                clientSecret != null ? (clientSecret.length() > 5 ? clientSecret.substring(0, 5) + "..." : "***") : "null",
                clientSecret != null ? clientSecret.length() : 0,
                redirectUri);
    }

    @Override
    public String getProviderName() {
        return "GOOGLE";
    }

    /**
     * Google OAuth 콜백 후 휴대폰 OTP 매칭을 강제한다. provider-agnostic OAuth 휴대폰 SSOT 정책(2026-06-09).
     * 콜백 분기 통합은 Phase 3C 에서 수행.
     */
    @Override
    public boolean requiresPhoneOtp(OAuthProvider oauthProvider, SocialUserInfo socialUserInfo) {
        return true;
    }

    @Override
    public String getAccessToken(String code) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("code", code);
            params.add("client_id", clientId);
            params.add("client_secret", clientSecret);
            params.add("redirect_uri", redirectUri);
            params.add("grant_type", "authorization_code");
            
            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);
            
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                "https://oauth2.googleapis.com/token",
                HttpMethod.POST,
                entity,
                (Class<Map<String, Object>>) (Class<?>) Map.class
            );
            
            Map<String, Object> tokenResponse = response.getBody();
            if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
                throw new RuntimeException("Google 액세스 토큰을 가져올 수 없습니다.");
            }
            
            return (String) tokenResponse.get("access_token");
            
        } catch (Exception e) {
            log.error("Google 액세스 토큰 획득 실패", e);
            throw new RuntimeException("Google 액세스 토큰을 가져올 수 없습니다.", e);
        }
    }

    @Override
    public SocialUserInfo getUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                HttpMethod.GET,
                entity,
                (Class<Map<String, Object>>) (Class<?>) Map.class
            );
            
            Map<String, Object> userInfo = response.getBody();
            
            if (userInfo == null) {
                throw new RuntimeException("Google 사용자 정보를 가져올 수 없습니다.");
            }
            
            return convertToSocialUserInfo(userInfo);
                
        } catch (Exception e) {
            log.error("Google 사용자 정보 조회 실패", e);
            throw new RuntimeException("Google 사용자 정보를 가져올 수 없습니다.", e);
        }
    }

    /**
     * Google OpenID Connect ID Token 만으로 사용자 정보를 조회한다.
     *
     * <p>**P0 2026-06-10** — Expo TestFlight 빌드 `1.0.7 (14)` 에서 `expo-auth-session/providers/google`
     * 응답이 `accessToken` 을 누락하고 `idToken` 만 포함하는 케이스를 관찰. 본 메서드는 그 폴백
     * 경로다. Google `tokeninfo` 엔드포인트 (`GET https://oauth2.googleapis.com/tokeninfo?id_token=...`)
     * 는 ID Token 의 서명·만료·issuer·audience(client_id) 등을 검증한 뒤 claims 를 JSON 으로 반환하므로
     * 별도 JWKS 검증 코드 없이도 안전하다.</p>
     *
     * <p>응답 예시:
     * <pre>{@code
     * {
     *   "iss": "https://accounts.google.com",
     *   "azp": "<client_id>",
     *   "aud": "<client_id>",
     *   "sub": "123456789",
     *   "email": "user@example.com",
     *   "email_verified": "true",
     *   "name": "Hong Gildong",
     *   "given_name": "Gildong",
     *   "family_name": "Hong",
     *   "picture": "https://lh3.googleusercontent.com/...",
     *   "locale": "ko",
     *   "iat": "...",
     *   "exp": "..."
     * }
     * }</pre>
     * </p>
     *
     * @param idToken Google OpenID Connect ID Token (JWT)
     * @return Google `tokeninfo` claims 로부터 변환된 SocialUserInfo
     * @throws RuntimeException 토큰이 유효하지 않거나 네트워크 오류 시
     */
    public SocialUserInfo getUserInfoFromIdToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Google idToken 이 비어 있습니다.");
        }
        try {
            String url = GOOGLE_TOKENINFO_URL + "?id_token=" + idToken;

            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                HttpEntity.EMPTY,
                (Class<Map<String, Object>>) (Class<?>) Map.class
            );

            Map<String, Object> claims = response.getBody();
            if (claims == null || claims.isEmpty()) {
                throw new RuntimeException("Google ID Token claims 응답이 비어 있습니다.");
            }
            if (claims.get("sub") == null) {
                throw new RuntimeException("Google ID Token 검증 실패: sub claim 없음.");
            }

            return convertIdTokenClaimsToSocialUserInfo(claims);

        } catch (Exception e) {
            log.error("Google ID Token 사용자 정보 조회 실패", e);
            throw new RuntimeException("Google ID Token 으로 사용자 정보를 가져올 수 없습니다.", e);
        }
    }

    /**
     * Google `tokeninfo` claims 를 표준 {@link SocialUserInfo} 로 변환한다.
     *
     * <p>{@link #convertToSocialUserInfo(Map)} 가 `userinfo` API 응답을 처리하는 것과 달리,
     * ID Token claims 는 `id` 대신 `sub` 키를 쓰며 사진 키는 `picture` 로 동일하다. name 누락 시
     * `given_name`+`family_name` 조합 폴백은 동일하다.</p>
     */
    private SocialUserInfo convertIdTokenClaimsToSocialUserInfo(Map<String, Object> claims) {
        String providerUserId = claims.get("sub") != null ? claims.get("sub").toString() : null;
        String email = (String) claims.get("email");
        String name = (String) claims.get("name");
        String givenName = (String) claims.get("given_name");
        String familyName = (String) claims.get("family_name");
        String picture = (String) claims.get("picture");

        if (name == null || name.trim().isEmpty()) {
            if (givenName != null || familyName != null) {
                name = (givenName != null ? givenName : "") + " " + (familyName != null ? familyName : "");
                name = name.trim();
            }
        }

        return SocialUserInfo.builder()
            .providerUserId(providerUserId)
            .email(email)
            .name(name)
            .nickname(givenName != null ? givenName : name)
            .profileImageUrl(picture)
            .build();
    }
    
    @Override
    protected SocialUserInfo convertToSocialUserInfo(Map<String, Object> rawUserInfo) {
        // Google API 응답 형식: https://www.googleapis.com/oauth2/v2/userinfo
        // {
        //   "id": "123456789",
        //   "email": "user@example.com",
        //   "verified_email": true,
        //   "name": "John Doe",
        //   "given_name": "John",
        //   "family_name": "Doe",
        //   "picture": "https://lh3.googleusercontent.com/...",
        //   "locale": "ko"
        // }
        
        String providerUserId = rawUserInfo.get("id") != null ? rawUserInfo.get("id").toString() : null;
        String email = (String) rawUserInfo.get("email");
        String name = (String) rawUserInfo.get("name");
        String givenName = (String) rawUserInfo.get("given_name");
        String familyName = (String) rawUserInfo.get("family_name");
        String picture = (String) rawUserInfo.get("picture");
        
        // 이름이 없으면 given_name + family_name 조합
        if (name == null || name.trim().isEmpty()) {
            if (givenName != null || familyName != null) {
                name = (givenName != null ? givenName : "") + " " + (familyName != null ? familyName : "");
                name = name.trim();
            }
        }
        
        return SocialUserInfo.builder()
            .providerUserId(providerUserId)
            .email(email)
            .name(name)
            .nickname(givenName != null ? givenName : name)
            .profileImageUrl(picture)
            .build();
    }
}

