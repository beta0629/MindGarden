package com.mindgarden.consultation.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping("/api/auth/config")
@RequiredArgsConstructor
public class OAuth2ConfigController {

    @Value("${spring.security.oauth2.client.registration.kakao.client-id:dummy}")
    private String kakaoClientId;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri:http://m-garden.co.kr/api/auth/kakao/callback}")
    private String kakaoRedirectUri;

    @Value("${spring.security.oauth2.client.registration.naver.client-id:dummy}")
    private String naverClientId;

    @Value("${spring.security.oauth2.client.registration.naver.redirect-uri:http://m-garden.co.kr/api/auth/naver/callback}")
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
        // 환경에 따른 동적 baseUrl 생성
        String baseUrl = getBaseUrlFromRequest(request);
        
        log.info("OAuth2 설정 정보 요청 - 서버 포트: {}", serverPort);
        log.info("카카오 클라이언트 ID: {}", kakaoClientId);
        log.info("카카오 리다이렉트 URI: {}", kakaoRedirectUri);
        log.info("네이버 클라이언트 ID: {}", naverClientId);
        log.info("네이버 리다이렉트 URI: {}", naverRedirectUri);
        
        // 디버깅: 실제 필드 값 확인
        log.info("DEBUG - kakaoRedirectUri 필드 값: '{}'", kakaoRedirectUri);
        log.info("DEBUG - kakaoRedirectUri 길이: {}", kakaoRedirectUri.length());
        // 디버깅 로그는 제거 (하드코딩된 URL 비교 제거)
        
        // 동적 baseUrl을 사용해서 리다이렉트 URI 생성
        String dynamicKakaoRedirectUri = baseUrl + "/api/auth/kakao/callback";
        String dynamicNaverRedirectUri = baseUrl + "/api/auth/naver/callback";
        
        Map<String, Object> config = Map.of(
            "kakao", Map.of(
                "clientId", kakaoClientId,
                "redirectUri", dynamicKakaoRedirectUri,
                "authUrl", "https://kauth.kakao.com/oauth/authorize"
            ),
            "naver", Map.of(
                "clientId", naverClientId,
                "redirectUri", dynamicNaverRedirectUri,
                "authUrl", "https://nid.naver.com/oauth2.0/authorize"
            )
        );
        
        log.info("OAuth2 설정 반환: {}", config);
        return ResponseEntity.ok(config);
    }
    
    /**
     * 요청에서 baseUrl을 동적으로 생성
     * 1. 환경변수 우선 사용
     * 2. 요청 헤더에서 동적 생성 (프록시 헤더 고려)
     */
    private String getBaseUrlFromRequest(HttpServletRequest request) {
        // 1. 환경변수가 설정되어 있으면 우선 사용
        if (oauth2BaseUrl != null && !oauth2BaseUrl.isEmpty()) {
            return oauth2BaseUrl;
        }
        
        // 2. 요청에서 동적으로 생성 (프록시 헤더 고려)
        // 프록시 헤더 확인 (X-Forwarded-Proto, X-Forwarded-Host)
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
        
        // 개발 환경 (localhost) - 환경변수가 없으면 현재 요청 기준으로 생성
        if ("localhost".equals(serverName) || "127.0.0.1".equals(serverName)) {
            int serverPort = request.getServerPort();
            // 개발 환경에서도 실제 포트 사용
            if (serverPort == 80 || serverPort == 443) {
                return scheme + "://" + serverName;
            } else {
                return scheme + "://" + serverName + ":" + serverPort;
            }
        }
        
        // 운영/개발 환경 (실제 도메인) - 포트는 scheme에 따라 결정
        if ("https".equals(scheme)) {
            return scheme + "://" + serverName;
        } else {
            int serverPort = request.getServerPort();
            if (serverPort == 80 || serverPort == 443) {
                return scheme + "://" + serverName;
            } else {
                return scheme + "://" + serverName + ":" + serverPort;
            }
        }
    }
}
