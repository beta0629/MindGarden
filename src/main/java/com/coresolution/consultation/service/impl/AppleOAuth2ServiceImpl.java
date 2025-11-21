package com.coresolution.consultation.service.impl;

import java.util.Map;
import com.coresolution.consultation.dto.SocialUserInfo;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.JwtService;
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
 * Apple OAuth2 서비스 구현체
 * Week 14: Google/Apple OAuth2 추가
 * 
 * 참고: Sign in with Apple은 Google과 다른 점:
 * 1. client_secret은 JWT로 생성해야 함 (향후 구현 필요)
 * 2. 사용자 정보는 첫 로그인 시에만 제공됨
 * 3. refresh_token을 사용하여 토큰 갱신 가능
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
public class AppleOAuth2ServiceImpl extends AbstractOAuth2Service {

    private final RestTemplate restTemplate;

    @Value("${spring.security.oauth2.client.registration.apple.client-id:${APPLE_CLIENT_ID:dummy}}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.apple.client-secret:${APPLE_CLIENT_SECRET:dummy}}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.apple.redirect-uri:${APPLE_REDIRECT_URI:}}")
    private String redirectUri;
    
    public AppleOAuth2ServiceImpl(
            RestTemplate restTemplate,
            UserRepository userRepository,
            ClientRepository clientRepository,
            UserSocialAccountRepository userSocialAccountRepository,
            JwtService jwtService,
            com.coresolution.consultation.service.DynamicPermissionService dynamicPermissionService) {
        super(userRepository, clientRepository, userSocialAccountRepository, jwtService, dynamicPermissionService);
        this.restTemplate = restTemplate;
    }
    
    @PostConstruct
    public void init() {
        log.info("Apple OAuth2 설정 로드: clientId={}, clientSecret={} (길이: {}), redirectUri={}", 
                clientId != null ? clientId.substring(0, Math.min(10, clientId.length())) + "..." : "null",
                clientSecret != null ? (clientSecret.length() > 5 ? clientSecret.substring(0, 5) + "..." : "***") : "null",
                clientSecret != null ? clientSecret.length() : 0,
                redirectUri);
    }

    @Override
    public String getProviderName() {
        return "APPLE";
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
                "https://appleid.apple.com/auth/token",
                HttpMethod.POST,
                entity,
                (Class<Map<String, Object>>) (Class<?>) Map.class
            );
            
            Map<String, Object> tokenResponse = response.getBody();
            if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
                throw new RuntimeException("Apple 액세스 토큰을 가져올 수 없습니다.");
            }
            
            return (String) tokenResponse.get("access_token");
            
        } catch (Exception e) {
            log.error("Apple 액세스 토큰 획득 실패", e);
            throw new RuntimeException("Apple 액세스 토큰을 가져올 수 없습니다.", e);
        }
    }

    @Override
    public SocialUserInfo getUserInfo(String accessToken) {
        // Apple은 사용자 정보를 첫 로그인 시에만 제공합니다.
        // 이후 로그인에서는 ID 토큰에서 사용자 정보를 추출해야 합니다.
        // 여기서는 기본 구조만 제공하고, 실제 구현은 ID 토큰 파싱이 필요합니다.
        
        try {
            // Apple ID 토큰에서 사용자 정보 추출 (향후 구현)
            // 현재는 기본 정보만 반환
            log.warn("Apple 사용자 정보 조회: Apple은 첫 로그인 시에만 사용자 정보를 제공합니다. ID 토큰 파싱이 필요합니다.");
            
            // ID 토큰에서 sub (사용자 ID) 추출 필요
            // 실제 구현 시 JWT 파싱 라이브러리 사용 필요
            
            return SocialUserInfo.builder()
                .providerUserId("apple_user_id") // ID 토큰에서 추출 필요
                .email(null) // ID 토큰에서 추출 필요
                .name(null) // 첫 로그인 시에만 제공
                .nickname(null)
                .profileImageUrl(null)
                .build();
                
        } catch (Exception e) {
            log.error("Apple 사용자 정보 조회 실패", e);
            throw new RuntimeException("Apple 사용자 정보를 가져올 수 없습니다.", e);
        }
    }
    
    @Override
    protected SocialUserInfo convertToSocialUserInfo(Map<String, Object> rawUserInfo) {
        // Apple은 첫 로그인 시에만 사용자 정보를 제공합니다.
        // 이후에는 ID 토큰에서 정보를 추출해야 합니다.
        
        String providerUserId = rawUserInfo.get("sub") != null ? rawUserInfo.get("sub").toString() : null;
        String email = (String) rawUserInfo.get("email");
        String name = null;
        
        // Apple은 name 필드를 제공하지 않을 수 있음
        if (rawUserInfo.containsKey("name")) {
            @SuppressWarnings("unchecked")
            Map<String, String> nameMap = (Map<String, String>) rawUserInfo.get("name");
            if (nameMap != null) {
                String firstName = nameMap.get("firstName");
                String lastName = nameMap.get("lastName");
                if (firstName != null || lastName != null) {
                    name = (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
                    name = name.trim();
                }
            }
        }
        
        return SocialUserInfo.builder()
            .providerUserId(providerUserId)
            .email(email)
            .name(name)
            .nickname(name)
            .profileImageUrl(null) // Apple은 프로필 이미지를 제공하지 않음
            .build();
    }
}

