package com.coresolution.consultation.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OAuth2 설정 정보를 클라이언트에 제공하는 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth/config") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class OAuth2ConfigController {

    private final OAuth2DomainUtil oauth2DomainUtil;

    @Value("${spring.security.oauth2.client.registration.kakao.client-id:${security.oauth2.client.registration.kakao.client-id:${KAKAO_CLIENT_ID:}}}")
    private String kakaoClientId;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri:${KAKAO_REDIRECT_URI:}}")
    private String kakaoRedirectUri;

    @Value("${spring.security.oauth2.client.registration.naver.client-id:${security.oauth2.client.registration.naver.client-id:${NAVER_CLIENT_ID:}}}")
    private String naverClientId;

    @Value("${spring.security.oauth2.client.registration.naver.redirect-uri:${NAVER_REDIRECT_URI:}}")
    private String naverRedirectUri;

    @Value("${server.port:8080}")
    private String serverPort;
    
    @Value("${oauth2.base-url:}")
    private String oauth2BaseUrl;

    /**
     * OAuth2 설정 정보 조회
     * 
     * @return OAuth2 설정 정보
     */
    @GetMapping("/oauth2")
    public ResponseEntity<Map<String, Object>> getOAuth2Config(HttpServletRequest request) {
        try {
            // 환경에 따른 동적 baseUrl 생성
            String baseUrl = getBaseUrlFromRequest(request);
            
            log.info("OAuth2 설정 정보 요청 - 서버 포트: {}", serverPort);
            
            // 동적 baseUrl을 사용해서 리다이렉트 URI 생성
            String dynamicKakaoRedirectUri = baseUrl + "/api/auth/kakao/callback";
            String dynamicNaverRedirectUri = baseUrl + "/api/auth/naver/callback";
            
            Map<String, Object> config = Map.of(
                "kakao", Map.of(
                    "clientId", kakaoClientId != null && !kakaoClientId.isEmpty() ? kakaoClientId : "dummy",
                    "redirectUri", dynamicKakaoRedirectUri,
                    "authUrl", "https://kauth.kakao.com/oauth/authorize"
                ),
                "naver", Map.of(
                    "clientId", naverClientId != null && !naverClientId.isEmpty() ? naverClientId : "dummy",
                    "redirectUri", dynamicNaverRedirectUri,
                    "authUrl", "https://nid.naver.com/oauth2.0/authorize"
                )
            );
            
            log.info("OAuth2 설정 반환: {}", config);
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            log.error("❌ OAuth2 설정 조회 실패", e);
            // 기본값 반환 (오류 시에도 프론트엔드가 동작하도록)
            // baseUrl 은 env(oauth2.base-url / OAUTH2_BASE_URL) 만 사용 — 호스트 하드코딩 금지
            String fallbackBaseUrl = (oauth2BaseUrl != null && !oauth2BaseUrl.isEmpty())
                    ? oauth2BaseUrl
                    : "";
            if (fallbackBaseUrl.isEmpty()) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of(
                                "error", "oauth2_config_unavailable",
                                "message", "OAuth2 base URL is not configured"));
            }

            Map<String, Object> fallbackConfig = Map.of(
                "kakao", Map.of(
                    "clientId", "dummy",
                    "redirectUri", fallbackBaseUrl + "/api/auth/kakao/callback",
                    "authUrl", "https://kauth.kakao.com/oauth/authorize"
                ),
                "naver", Map.of(
                    "clientId", "dummy",
                    "redirectUri", fallbackBaseUrl + "/api/auth/naver/callback",
                    "authUrl", "https://nid.naver.com/oauth2.0/authorize"
                )
            );
            return ResponseEntity.ok(fallbackConfig);
        }
    }
    
    /**
     * 요청에서 baseUrl을 동적으로 생성
     * 1. 환경변수 우선 사용
     * 2. 요청 헤더에서 동적 생성 (프록시 헤더 고려)
     */
    private String getBaseUrlFromRequest(HttpServletRequest request) {
        // 1. 환경변수가 설정되어 있으면 우선 사용
        if (oauth2BaseUrl != null && !oauth2BaseUrl.isEmpty()) {
            log.debug("OAuth2 BaseUrl (환경변수): {}", oauth2BaseUrl);
            return oauth2BaseUrl;
        }
        
        // 2. 요청에서 동적으로 생성 (프록시 헤더 고려)
        String scheme = request.getHeader("X-Forwarded-Proto");
        if (scheme == null || scheme.isEmpty()) {
            scheme = request.getScheme();
        }
        
        String serverName = request.getHeader("X-Forwarded-Host");
        if (serverName == null || serverName.isEmpty()) {
            serverName = request.getHeader("Host");
        }
        if (serverName == null || serverName.isEmpty()) {
            serverName = request.getServerName();
        }
        
        // 포트 제거 (X-Forwarded-Host에 포트가 포함되어 있을 수 있음)
        if (serverName != null && serverName.contains(":")) {
            serverName = serverName.split(":")[0];
        }
        
        // 서브도메인을 메인 도메인으로 변환 (설정 파일 기반)
        if (serverName != null && !serverName.isEmpty()) {
            serverName = oauth2DomainUtil.convertToMainDomain(serverName);
        }
        
        int serverPort = request.getServerPort();
        
        // 개발 환경 (localhost) - 로컬에서는 localhost 사용
        if ("localhost".equals(serverName) || "127.0.0.1".equals(serverName)) {
            // 환경 변수로 coresolution 도메인 강제 사용 가능
            if (oauth2BaseUrl != null && !oauth2BaseUrl.isEmpty()) {
                log.debug("OAuth2 BaseUrl (환경변수, localhost 오버라이드): {}", oauth2BaseUrl);
                return oauth2BaseUrl;
            }
            // 로컬 환경에서는 localhost 사용 (카카오/네이버 개발자 센터에 localhost 등록 필요)
            if (serverPort == 80 || serverPort == 443) {
                return scheme + "://" + serverName;
            } else {
                return scheme + "://" + serverName + ":" + serverPort;
            }
        }
        
        // 운영/개발 환경 (실제 도메인)
        if ("https".equals(scheme)) {
            return scheme + "://" + serverName;
        } else {
            if (serverPort == 80 || serverPort == 443) {
                return scheme + "://" + serverName;
            } else {
                return scheme + "://" + serverName + ":" + serverPort;
            }
        }
    }
}
