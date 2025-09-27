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

    @Value("${spring.security.oauth2.client.registration.kakao.client-id:dummy}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.kakao.client-secret:dummy}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri:https://m-garden.co.kr/api/auth/kakao/callback}")
    private String redirectUri;
    
    public KakaoOAuth2ServiceImpl(
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
        int maxRetries = 2;
        int retryCount = 0;
        
        while (retryCount <= maxRetries) {
            try {
                log.info("카카오 액세스 토큰 획득 시도 {}: code={}", retryCount + 1, code);
                
                HttpHeaders headers = new HttpHeaders();
                headers.set("Content-Type", "application/x-www-form-urlencoded");
                
                MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                params.add("grant_type", "authorization_code");
                params.add("client_id", clientId);
                params.add("client_secret", clientSecret);
                params.add("code", code);
                params.add("redirect_uri", redirectUri);
                
                log.debug("카카오 토큰 요청 파라미터: grant_type={}, client_id={}, redirect_uri={}", 
                         "authorization_code", clientId, redirectUri);
                
                HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);
                
                ResponseEntity<Map> response = restTemplate.exchange(
                    "https://kauth.kakao.com/oauth/token",
                    HttpMethod.POST,
                    entity,
                    Map.class
                );
                
                Map<String, Object> tokenInfo = response.getBody();
                
                if (tokenInfo == null) {
                    throw new RuntimeException("카카오 토큰 응답이 비어있습니다.");
                }
                
                if (tokenInfo.containsKey("error")) {
                    String error = (String) tokenInfo.get("error");
                    String errorDescription = (String) tokenInfo.get("error_description");
                    String errorCode = (String) tokenInfo.get("error_code");
                    
                    log.error("카카오 OAuth2 에러: error={}, description={}, code={}", 
                             error, errorDescription, errorCode);
                    
                    // 구체적인 에러 메시지 제공
                    if ("invalid_grant".equals(error)) {
                        if ("KOE320".equals(errorCode)) {
                            throw new RuntimeException("인증 코드가 만료되었거나 이미 사용되었습니다. 다시 로그인해주세요.");
                        } else {
                            throw new RuntimeException("유효하지 않은 인증 코드입니다: " + errorDescription);
                        }
                    } else if ("invalid_client".equals(error)) {
                        throw new RuntimeException("클라이언트 인증 정보가 올바르지 않습니다. 관리자에게 문의해주세요.");
                    } else if ("invalid_request".equals(error)) {
                        throw new RuntimeException("잘못된 요청입니다: " + errorDescription);
                    } else {
                        throw new RuntimeException("카카오 OAuth2 오류: " + errorDescription);
                    }
                }
                
                if (!tokenInfo.containsKey("access_token")) {
                    log.error("카카오 토큰 응답에 access_token이 없습니다: {}", tokenInfo);
                    throw new RuntimeException("카카오 액세스 토큰을 가져올 수 없습니다. 응답: " + tokenInfo);
                }
                
                String accessToken = (String) tokenInfo.get("access_token");
                log.info("카카오 액세스 토큰 획득 성공: tokenLength={}", accessToken.length());
                
                return accessToken;
                
            } catch (Exception e) {
                retryCount++;
                log.error("카카오 액세스 토큰 획득 실패 (시도 {}): {}", retryCount, e.getMessage());
                
                if (retryCount > maxRetries) {
                    log.error("카카오 액세스 토큰 획득 최대 재시도 횟수 초과");
                    throw new RuntimeException("카카오 액세스 토큰을 가져올 수 없습니다: " + e.getMessage(), e);
                }
                
                // 재시도 전 잠시 대기
                try {
                    Thread.sleep(1000 * retryCount); // 1초, 2초 대기
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("카카오 액세스 토큰 획득 중 인터럽트 발생", ie);
                }
            }
        }
        
        throw new RuntimeException("카카오 액세스 토큰을 가져올 수 없습니다.");
    }
}
