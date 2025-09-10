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
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

/**
 * 네이버 OAuth2 서비스 구현체
 * 통합 OAuth2 아키텍처를 사용하여 구현
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
public class NaverOAuth2ServiceImpl extends AbstractOAuth2Service {

    private final RestTemplate restTemplate;

    @Value("${spring.security.oauth2.client.registration.naver.client-id:dummy}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.naver.client-secret:dummy}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.naver.redirect-uri:http://localhost:8080/api/auth/naver/callback}")
    private String redirectUri;
    
    public NaverOAuth2ServiceImpl(
            RestTemplate restTemplate,
            UserRepository userRepository,
            ClientRepository clientRepository,
            UserSocialAccountRepository userSocialAccountRepository,
            JwtService jwtService) {
        super(userRepository, clientRepository, userSocialAccountRepository, jwtService);
        this.restTemplate = restTemplate;
    }

    @Override
    public String getProviderName() {
        return "NAVER";
    }

    @Override
    public SocialUserInfo getUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://openapi.naver.com/v1/nid/me",
                HttpMethod.GET,
                entity,
                Map.class
            );
            
            Map<String, Object> userInfo = response.getBody();
            
            if (userInfo == null) {
                throw new RuntimeException("네이버 사용자 정보를 가져올 수 없습니다.");
            }
            
            return convertToSocialUserInfo(userInfo);
                
        } catch (Exception e) {
            log.error("네이버 사용자 정보 조회 실패", e);
            throw new RuntimeException("네이버 사용자 정보를 가져올 수 없습니다.", e);
        }
    }
    
    @Override
    protected SocialUserInfo convertToSocialUserInfo(Map<String, Object> rawUserInfo) {
        Map<String, Object> response = (Map<String, Object>) rawUserInfo.get("response");
        
        return SocialUserInfo.builder()
            .providerUserId((String) response.get("id"))
            .email((String) response.get("email"))
            .name((String) response.get("name"))
            .nickname((String) response.get("nickname"))
            .profileImageUrl((String) response.get("profile_image"))
            .gender((String) response.get("gender"))
            .birthday((String) response.get("birthday"))
            .phone((String) response.get("mobile"))
            .ageRange((String) response.get("age"))
            .build();
    }

    @Override
    public String getAccessToken(String code) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/x-www-form-urlencoded");
            
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "authorization_code");
            params.add("client_id", clientId);
            params.add("client_secret", clientSecret);
            params.add("code", code);
            params.add("state", "naver_oauth_state"); // 보안을 위한 state 값
            params.add("redirect_uri", redirectUri);
            
            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://nid.naver.com/oauth2.0/token",
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            Map<String, Object> tokenInfo = response.getBody();
            
            if (tokenInfo == null || !tokenInfo.containsKey("access_token")) {
                throw new RuntimeException("네이버 액세스 토큰을 가져올 수 없습니다.");
            }
            
            return (String) tokenInfo.get("access_token");
            
        } catch (Exception e) {
            log.error("네이버 액세스 토큰 획득 실패", e);
            throw new RuntimeException("네이버 액세스 토큰을 가져올 수 없습니다.", e);
        }
    }
}
