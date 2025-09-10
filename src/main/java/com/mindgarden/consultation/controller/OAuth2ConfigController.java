package com.mindgarden.consultation.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri:http://localhost:8080/api/auth/kakao/callback}")
    private String kakaoRedirectUri;

    @Value("${spring.security.oauth2.client.registration.naver.client-id:dummy}")
    private String naverClientId;

    @Value("${spring.security.oauth2.client.registration.naver.redirect-uri:http://localhost:8080/api/auth/naver/callback}")
    private String naverRedirectUri;

    @Value("${server.port:8080}")
    private String serverPort;

    /**
     * OAuth2 설정 정보 조회
     * 
     * @return OAuth2 설정 정보
     */
    @GetMapping("/oauth2")
    public ResponseEntity<Map<String, Object>> getOAuth2Config() {
        String baseUrl = "http://localhost:" + serverPort;
        
        log.info("OAuth2 설정 정보 요청 - 서버 포트: {}", serverPort);
        log.info("카카오 클라이언트 ID: {}", kakaoClientId);
        log.info("카카오 리다이렉트 URI: {}", kakaoRedirectUri);
        log.info("네이버 클라이언트 ID: {}", naverClientId);
        log.info("네이버 리다이렉트 URI: {}", naverRedirectUri);
        
        // 디버깅: 실제 필드 값 확인
        log.info("DEBUG - kakaoRedirectUri 필드 값: '{}'", kakaoRedirectUri);
        log.info("DEBUG - kakaoRedirectUri 길이: {}", kakaoRedirectUri.length());
        log.info("DEBUG - kakaoRedirectUri equals check: {}", kakaoRedirectUri.equals("http://localhost:8080/api/auth/kakao/callback"));
        
        Map<String, Object> config = Map.of(
            "kakao", Map.of(
                "clientId", kakaoClientId,
                "redirectUri", kakaoRedirectUri,
                "authUrl", "https://kauth.kakao.com/oauth/authorize"
            ),
            "naver", Map.of(
                "clientId", naverClientId,
                "redirectUri", naverRedirectUri,
                "authUrl", "https://nid.naver.com/oauth2.0/authorize"
            )
        );
        
        log.info("OAuth2 설정 반환: {}", config);
        return ResponseEntity.ok(config);
    }
}
