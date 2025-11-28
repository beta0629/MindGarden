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

    @Value("${development.security.oauth2.kakao.client-id}")
    private String kakaoClientId;

    @Value("${development.security.oauth2.naver.client-id}")
    private String naverClientId;

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
        log.info("네이버 클라이언트 ID: {}", naverClientId);
        
        Map<String, Object> config = Map.of(
            "kakao", Map.of(
                "clientId", kakaoClientId,
                "redirectUri", baseUrl + "/api/auth/kakao/callback",
                "authUrl", "https://kauth.kakao.com/oauth/authorize"
            ),
            "naver", Map.of(
                "clientId", naverClientId,
                "redirectUri", baseUrl + "/api/auth/naver/callback",
                "authUrl", "https://nid.naver.com/oauth2.0/authorize"
            )
        );
        
        log.info("OAuth2 설정 반환: {}", config);
        return ResponseEntity.ok(config);
    }
}
