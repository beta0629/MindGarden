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
import com.coresolution.core.security.PasswordService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
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

    private static final ObjectMapper KAKAO_TOKEN_ERROR_MAPPER = new ObjectMapper();

    private final RestTemplate restTemplate;

    @Value("${spring.security.oauth2.client.registration.kakao.client-id:${KAKAO_CLIENT_ID:dummy}}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.kakao.client-secret:${KAKAO_CLIENT_SECRET:dummy}}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri:${KAKAO_REDIRECT_URI:}}")
    private String redirectUri;
    
    public KakaoOAuth2ServiceImpl(
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
    
    @jakarta.annotation.PostConstruct
    public void init() {
        // 의존성 주입 완료 후 로깅으로 값 확인
        log.info("카카오 OAuth2 설정 로드: clientId={}, clientSecret={} (길이: {}), redirectUri={}", 
                clientId != null ? clientId.substring(0, Math.min(10, clientId.length())) + "..." : "null",
                clientSecret != null ? (clientSecret.length() > 5 ? clientSecret.substring(0, 5) + "..." : "***") : "null",
                clientSecret != null ? clientSecret.length() : 0,
                redirectUri);
    }

    @Override
    public String getProviderName() {
        return "KAKAO";
    }

    /**
     * Kakao OAuth 콜백 후 휴대폰 OTP 매칭을 강제한다. provider-agnostic OAuth 휴대폰 SSOT 정책(2026-06-09).
     * 콜백 분기 통합은 Phase 3C 에서 수행.
     */
    @Override
    public boolean requiresPhoneOtp(OAuthProvider oauthProvider, SocialUserInfo socialUserInfo) {
        return true;
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
        Map<String, Object> profile = kakaoAccount != null
            ? (Map<String, Object>) kakaoAccount.get("profile") : null;
        String phoneNumber = kakaoAccount != null ? (String) kakaoAccount.get("phone_number") : null;

        return SocialUserInfo.builder()
            .providerUserId(rawUserInfo.get("id").toString())
            .email(kakaoAccount != null ? (String) kakaoAccount.get("email") : null)
            .name(profile != null ? (String) profile.get("nickname") : null)
            .nickname(profile != null ? (String) profile.get("nickname") : null)
            .profileImageUrl(profile != null ? (String) profile.get("profile_image_url") : null)
            .accountType(kakaoAccount != null ? (String) kakaoAccount.get("account_type") : null)
            .ageRange(kakaoAccount != null ? (String) kakaoAccount.get("age_range") : null)
            .gender(kakaoAccount != null ? (String) kakaoAccount.get("gender") : null)
            .birthday(kakaoAccount != null ? (String) kakaoAccount.get("birthday") : null)
            .phone(phoneNumber)
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
        boolean codePresent = code != null && !code.isBlank();
        int codeLength = code != null ? code.length() : 0;

        int maxRetries = 2;
        int retryCount = 0;

        while (retryCount <= maxRetries) {
            try {
                log.info(
                        "카카오 액세스 토큰 획득 시도 {}: codePresent={}, codeLength={}, redirectUri={}",
                        retryCount + 1, Boolean.valueOf(codePresent), Integer.valueOf(codeLength),
                        redirectUriToUse);

                HttpHeaders headers = new HttpHeaders();
                headers.set("Content-Type", "application/x-www-form-urlencoded");

                MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                params.add("grant_type", "authorization_code");
                params.add("client_id", clientId);
                params.add("client_secret", clientSecret);
                params.add("code", code);
                params.add("redirect_uri", redirectUriToUse);

                log.info(
                        "카카오 토큰 요청 파라미터: grant_type={}, client_id={}, redirect_uri={}, codePresent={}, codeLength={}",
                        "authorization_code", clientId, redirectUriToUse,
                        Boolean.valueOf(codePresent), Integer.valueOf(codeLength));

                HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);

                @SuppressWarnings({"unchecked", "rawtypes"})
                ResponseEntity<Map> response = restTemplate.exchange(
                        "https://kauth.kakao.com/oauth/token",
                        HttpMethod.POST,
                        entity,
                        Map.class);

                Map<String, Object> tokenInfo = response.getBody();

                if (tokenInfo == null) {
                    throw new RuntimeException("카카오 토큰 응답이 비어있습니다.");
                }

                if (tokenInfo.containsKey("error")) {
                    String error = stringOrNull(tokenInfo.get("error"));
                    String errorDescription = stringOrNull(tokenInfo.get("error_description"));
                    String errorCode = stringOrNull(tokenInfo.get("error_code"));

                    log.error("카카오 OAuth2 에러: error={}, description={}, code={}",
                            error, errorDescription, errorCode);

                    // invalid_grant / invalid_request 등 클라이언트 오류 — 재시도 금지
                    throw new RuntimeException(
                            mapKakaoOAuthErrorToUserMessage(error, errorCode, errorDescription));
                }

                if (!tokenInfo.containsKey("access_token")) {
                    log.error("카카오 토큰 응답에 access_token이 없습니다");
                    throw new RuntimeException("카카오 액세스 토큰을 가져올 수 없습니다.");
                }

                String accessToken = (String) tokenInfo.get("access_token");
                log.info("카카오 액세스 토큰 획득 성공: tokenLength={}",
                        Integer.valueOf(accessToken != null ? accessToken.length() : 0));

                return accessToken;

            } catch (HttpStatusCodeException e) {
                int status = e.getStatusCode().value();
                String responseBody = e.getResponseBodyAsString();
                log.error("카카오 액세스 토큰 HTTP 오류: status={}, bodyLength={}",
                        Integer.valueOf(status),
                        Integer.valueOf(responseBody != null ? responseBody.length() : 0));

                // HTTP 4xx / KOE320 등 — 재시도해도 동일 실패. raw JSON 본문을 사용자 메시지에 넣지 않음.
                if (e.getStatusCode().is4xxClientError()) {
                    throw new RuntimeException(toKakaoTokenUserMessageFromHttpBody(responseBody), e);
                }

                retryCount++;
                if (retryCount > maxRetries) {
                    throw new RuntimeException("카카오 액세스 토큰을 가져올 수 없습니다. 잠시 후 다시 시도해주세요.", e);
                }
                sleepBeforeRetry(retryCount);

            } catch (ResourceAccessException e) {
                retryCount++;
                log.error("카카오 액세스 토큰 네트워크 오류 (시도 {}): {}",
                        Integer.valueOf(retryCount), e.getMessage());

                if (retryCount > maxRetries) {
                    throw new RuntimeException("카카오 액세스 토큰을 가져올 수 없습니다. 네트워크 오류가 발생했습니다.", e);
                }
                sleepBeforeRetry(retryCount);

            } catch (RuntimeException e) {
                // 200 본문 error / 4xx 매핑 등 비즈니스·클라이언트 오류 — 재시도 금지
                throw e;

            } catch (Exception e) {
                retryCount++;
                log.error("카카오 액세스 토큰 획득 실패 (시도 {}): {}",
                        Integer.valueOf(retryCount), e.getMessage(), e);

                if (retryCount > maxRetries) {
                    throw new RuntimeException("카카오 액세스 토큰을 가져올 수 없습니다. 잠시 후 다시 시도해주세요.", e);
                }
                sleepBeforeRetry(retryCount);
            }
        }

        throw new RuntimeException("카카오 액세스 토큰을 가져올 수 없습니다.");
    }

    private static void sleepBeforeRetry(int retryCount) {
        try {
            Thread.sleep(1000L * retryCount);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("카카오 액세스 토큰 획득 중 인터럽트 발생", ie);
        }
    }

    /**
     * HTTP 4xx 본문에서 error/error_code를 파싱해 짧은 사용자 메시지를 만든다.
     * {@code login?error=} 에 raw JSON 이 노출되지 않도록 한다.
     *
     * @param responseBody Kakao token API 오류 본문
     * @return 사용자용 짧은 메시지
     */
    private String toKakaoTokenUserMessageFromHttpBody(String responseBody) {
        String error = null;
        String errorCode = null;
        String errorDescription = null;
        if (responseBody != null && !responseBody.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> map = KAKAO_TOKEN_ERROR_MAPPER.readValue(responseBody, Map.class);
                error = stringOrNull(map.get("error"));
                errorCode = stringOrNull(map.get("error_code"));
                errorDescription = stringOrNull(map.get("error_description"));
            } catch (Exception parseEx) {
                log.debug("카카오 토큰 오류 본문 파싱 실패: {}", parseEx.getMessage());
            }
        }
        return mapKakaoOAuthErrorToUserMessage(error, errorCode, errorDescription);
    }

    /**
     * Kakao OAuth token 오류를 사용자용 짧은 메시지로 매핑한다 (raw JSON/긴 description 금지).
     *
     * @param error            OAuth error
     * @param errorCode        Kakao error_code (예: KOE320)
     * @param errorDescription 서버 description (로그용; 사용자 메시지에 raw 삽입 금지)
     * @return 사용자 메시지
     */
    private String mapKakaoOAuthErrorToUserMessage(String error, String errorCode,
            String errorDescription) {
        if ("invalid_grant".equals(error)) {
            if ("KOE320".equals(errorCode)) {
                return "인증 코드가 만료되었거나 이미 사용되었습니다. 다시 로그인해주세요.";
            }
            return "유효하지 않은 인증 코드입니다. 다시 로그인해주세요.";
        }
        if ("invalid_client".equals(error)) {
            return "클라이언트 인증 정보가 올바르지 않습니다. 관리자에게 문의해주세요.";
        }
        if ("invalid_request".equals(error)) {
            if ("KOE320".equals(errorCode)) {
                return "인증 코드가 없거나 올바르지 않습니다. 다시 로그인해주세요.";
            }
            return "잘못된 카카오 로그인 요청입니다. 다시 로그인해주세요.";
        }
        if (errorDescription != null && !errorDescription.isBlank()) {
            log.debug("카카오 OAuth 미매핑 오류 description 존재 (사용자 메시지에는 미포함)");
        }
        return "카카오 로그인에 실패했습니다. 다시 시도해주세요.";
    }

    private static String stringOrNull(Object value) {
        return value != null ? String.valueOf(value) : null;
    }
}
