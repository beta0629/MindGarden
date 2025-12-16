package com.coresolution.consultation.controller;

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
@RequestMapping("/api/v1/auth/config") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class OAuth2ConfigController {

    @Value("${spring.security.oauth2.client.registration.kakao.client-id:${security.oauth2.client.registration.kakao.client-id:cbb457cfb5f9351fd495be4af2b11a34}}")
    private String kakaoClientId;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri:https://dev.core-solution.co.kr/api/auth/kakao/callback}")
    private String kakaoRedirectUri;

    @Value("${spring.security.oauth2.client.registration.naver.client-id:${security.oauth2.client.registration.naver.client-id:vTKNlxYKIfo1uCCXaDfk}}")
    private String naverClientId;

    @Value("${spring.security.oauth2.client.registration.naver.redirect-uri:https://dev.core-solution.co.kr/api/auth/naver/callback}")
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
            // 환경 변수나 설정에서 baseUrl 확인, 없으면 localhost 사용 (로컬 환경)
            String fallbackBaseUrl = "http://localhost:8080";
            if (oauth2BaseUrl != null && !oauth2BaseUrl.isEmpty()) {
                fallbackBaseUrl = oauth2BaseUrl;
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
        
        // 정규식 패턴 제거 (Nginx 서브도메인 패턴이 포함된 경우)
        if (serverName != null && serverName.contains("~")) {
            // 정규식 패턴을 메인 도메인으로 변환
            if (serverName.matches(".*\\.dev\\.core-solution\\.co\\.kr.*")) {
                serverName = "dev.core-solution.co.kr";
            } else if (serverName.matches(".*\\.dev\\.m-garden\\.co\\.kr.*")) {
                serverName = "dev.m-garden.co.kr";
            } else {
                // 정규식 패턴에서 도메인 추출 시도
                serverName = serverName.replaceAll(".*(dev\\.core-solution\\.co\\.kr|dev\\.m-garden\\.co\\.kr).*", "$1");
            }
        }
        
        // 서브도메인을 메인 도메인으로 변환 (카카오 개발자 센터 등록 문제 해결)
        if (serverName != null && !serverName.isEmpty()) {
            String hostWithoutPort = serverName;
            if (hostWithoutPort.matches(".*\\.dev\\.core-solution\\.co\\.kr$")) {
                serverName = "dev.core-solution.co.kr";
                log.debug("OAuth2 BaseUrl - 서브도메인을 메인 도메인으로 변환: {} -> {}", hostWithoutPort, serverName);
            } else if (hostWithoutPort.matches(".*\\.core-solution\\.co\\.kr$")
                    && !hostWithoutPort.equals("dev.core-solution.co.kr")
                    && !hostWithoutPort.equals("core-solution.co.kr")) {
                serverName = "dev.core-solution.co.kr";
                log.debug("OAuth2 BaseUrl - 서브도메인을 메인 도메인으로 변환: {} -> {}", hostWithoutPort, serverName);
            } else if (hostWithoutPort.matches(".*\\.dev\\.m-garden\\.co\\.kr$")) {
                serverName = "dev.m-garden.co.kr";
                log.debug("OAuth2 BaseUrl - 서브도메인을 메인 도메인으로 변환: {} -> {}", hostWithoutPort, serverName);
            } else if (hostWithoutPort.matches(".*\\.m-garden\\.co\\.kr$")
                    && !hostWithoutPort.equals("dev.m-garden.co.kr")
                    && !hostWithoutPort.equals("m-garden.co.kr")) {
                serverName = "dev.m-garden.co.kr";
                log.debug("OAuth2 BaseUrl - 서브도메인을 메인 도메인으로 변환: {} -> {}", hostWithoutPort, serverName);
            }
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
