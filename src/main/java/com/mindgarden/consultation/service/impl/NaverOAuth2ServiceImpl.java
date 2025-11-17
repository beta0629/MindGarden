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

    @Value("${spring.security.oauth2.client.registration.naver.redirect-uri:${NAVER_REDIRECT_URI:}}")
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
        return getAccessToken(code, redirectUri);
    }
    
    /**
     * 인증 코드로 액세스 토큰 획득 (redirectUri 지정 가능)
     * 
     * @param code 인증 코드
     * @param redirectUri 리다이렉트 URI (null이면 기본값 사용)
     * @return 액세스 토큰
     */
    public String getAccessToken(String code, String redirectUri) {
        String redirectUriToUse = (redirectUri != null && !redirectUri.isEmpty()) ? redirectUri : this.redirectUri;
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/x-www-form-urlencoded");
            
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "authorization_code");
            params.add("client_id", clientId);
            params.add("client_secret", clientSecret);
            params.add("code", code);
            params.add("state", "naver_oauth_state"); // 보안을 위한 state 값
            params.add("redirect_uri", redirectUriToUse);
            
            log.info("네이버 액세스 토큰 획득 시도: client_id={}, redirect_uri={}, code={}", 
                    clientId, redirectUriToUse, code != null ? code.substring(0, Math.min(10, code.length())) + "..." : "null");
            log.info("네이버 토큰 요청 전체 파라미터: grant_type={}, client_id={}, client_secret={}, redirect_uri={}, code={}, state={}", 
                     "authorization_code", clientId, clientSecret != null ? clientSecret.substring(0, Math.min(5, clientSecret.length())) + "..." : "null", 
                     redirectUriToUse, code != null ? code.substring(0, Math.min(10, code.length())) + "..." : "null", "naver_oauth_state");
            log.debug("네이버 토큰 요청 파라미터: grant_type={}, client_id={}, redirect_uri={}", 
                     "authorization_code", clientId, redirectUriToUse);
            
            // 실제 전송되는 요청 URL과 파라미터 로깅
            StringBuilder requestUrl = new StringBuilder("https://nid.naver.com/oauth2.0/token");
            StringBuilder paramLog = new StringBuilder();
            params.forEach((key, values) -> {
                if (values != null && !values.isEmpty()) {
                    String value = values.get(0);
                    // client_secret은 일부만 로깅
                    if ("client_secret".equals(key)) {
                        value = value != null && value.length() > 5 ? value.substring(0, 5) + "..." : value;
                    }
                    // code는 일부만 로깅
                    if ("code".equals(key)) {
                        value = value != null && value.length() > 10 ? value.substring(0, 10) + "..." : value;
                    }
                    paramLog.append(key).append("=").append(value).append("&");
                }
            });
            log.info("네이버 토큰 요청 URL: {}, 파라미터: {}", requestUrl.toString(), paramLog.toString());
            
            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://nid.naver.com/oauth2.0/token",
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            log.info("네이버 토큰 응답 상태: {}, 헤더: {}", response.getStatusCode(), response.getHeaders());
            
            Map<String, Object> tokenInfo = response.getBody();
            
            if (tokenInfo == null) {
                log.error("네이버 토큰 응답이 null 입니다. status={}", response.getStatusCode());
                throw new RuntimeException("네이버 액세스 토큰을 가져올 수 없습니다.");
            }
            
            if (tokenInfo.containsKey("error")) {
                String error = (String) tokenInfo.getOrDefault("error", "");
                String errorDescription = (String) tokenInfo.getOrDefault("error_description", "");
                log.error("네이버 OAuth2 에러 응답: error={}, description={}, raw={}", 
                        error, errorDescription, tokenInfo);
                throw new RuntimeException("네이버 액세스 토큰을 가져올 수 없습니다. (" + error + ": " + errorDescription + ")");
            }
            
            if (!tokenInfo.containsKey("access_token")) {
                log.error("네이버 토큰 응답에 access_token이 없습니다: {}", tokenInfo);
                throw new RuntimeException("네이버 액세스 토큰을 가져올 수 없습니다.");
            }
            
            return (String) tokenInfo.get("access_token");
            
        } catch (Exception e) {
            log.error("네이버 액세스 토큰 획득 실패", e);
            throw new RuntimeException("네이버 액세스 토큰을 가져올 수 없습니다.", e);
        }
    }
}
