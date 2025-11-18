package com.mindgarden.consultation.service.impl;

import java.util.Map;
import com.mindgarden.consultation.dto.SocialUserInfo;
import com.mindgarden.consultation.repository.ClientRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.UserSocialAccountRepository;
import com.mindgarden.consultation.service.JwtService;
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
            JwtService jwtService) {
        super(userRepository, clientRepository, userSocialAccountRepository, jwtService);
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

