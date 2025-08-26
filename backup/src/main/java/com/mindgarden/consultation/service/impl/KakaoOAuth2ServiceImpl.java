package com.mindgarden.consultation.service.impl;

import java.util.Map;
import com.mindgarden.consultation.dto.SocialUserInfo;
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
 * 카카오 OAuth2 서비스 구현체
 * 통합 OAuth2 아키텍처를 사용하여 구현
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
public class KakaoOAuth2ServiceImpl extends AbstractOAuth2Service {

    private final RestTemplate restTemplate;

    @Value("${development.security.oauth2.kakao.client-id}")
    private String clientId;

    @Value("${development.security.oauth2.kakao.client-secret}")
    private String clientSecret;

    @Value("${development.security.oauth2.kakao.redirect-uri}")
    private String redirectUri;
    
    public KakaoOAuth2ServiceImpl(
            RestTemplate restTemplate,
            UserRepository userRepository,
            UserSocialAccountRepository userSocialAccountRepository,
            JwtService jwtService) {
        super(userRepository, userSocialAccountRepository, jwtService);
        this.restTemplate = restTemplate;
    }

    @Override
    public String getProviderName() {
        return "KAKAO";
    }

    @Override
    public SocialUserInfo getUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://kapi.kakao.com/v2/user/me",
                HttpMethod.GET,
                entity,
                Map.class
            );
            
            Map<String, Object> userInfo = response.getBody();
            
            if (userInfo == null) {
                throw new RuntimeException("카카오 사용자 정보를 가져올 수 없습니다.");
            }
            
            return convertToSocialUserInfo(userInfo);
                
        } catch (Exception e) {
            log.error("카카오 사용자 정보 조회 실패", e);
            throw new RuntimeException("카카오 사용자 정보를 가져올 수 없습니다.", e);
        }
    }
    
    @Override
    protected SocialUserInfo convertToSocialUserInfo(Map<String, Object> rawUserInfo) {
        Map<String, Object> kakaoAccount = (Map<String, Object>) rawUserInfo.get("kakao_account");
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
        
        return SocialUserInfo.builder()
            .providerUserId(rawUserInfo.get("id").toString())
            .email((String) kakaoAccount.get("email"))
            .name((String) profile.get("nickname"))
            .nickname((String) profile.get("nickname"))
            .profileImageUrl((String) profile.get("profile_image_url"))
            .accountType((String) kakaoAccount.get("account_type"))
            .ageRange((String) kakaoAccount.get("age_range"))
            .gender((String) kakaoAccount.get("gender"))
            .birthday((String) kakaoAccount.get("birthday"))
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
            params.add("redirect_uri", redirectUri.replace("{baseUrl}", "http://localhost:8080"));
            
            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://kauth.kakao.com/oauth/token",
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            Map<String, Object> tokenInfo = response.getBody();
            
            if (tokenInfo == null || !tokenInfo.containsKey("access_token")) {
                throw new RuntimeException("카카오 액세스 토큰을 가져올 수 없습니다.");
            }
            
            return (String) tokenInfo.get("access_token");
            
        } catch (Exception e) {
            log.error("카카오 액세스 토큰 획득 실패", e);
            throw new RuntimeException("카카오 액세스 토큰을 가져올 수 없습니다.", e);
        }
    }
}
