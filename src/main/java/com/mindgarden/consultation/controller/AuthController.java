package com.mindgarden.consultation.controller;

import java.time.LocalDateTime;
import java.time.ZoneId;
import com.mindgarden.consultation.dto.SessionInfo;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private PersonalDataEncryptionUtil encryptionUtil;
    
    @Value("${development.security.oauth2.kakao.client-id}")
    private String kakaoClientId;
    
    @Value("${development.security.oauth2.kakao.redirect-uri}")
    private String kakaoRedirectUri;
    
    @Value("${development.security.oauth2.kakao.scope}")
    private String kakaoScope;
    
    @Value("${development.security.oauth2.naver.client-id}")
    private String naverClientId;
    
    @Value("${development.security.oauth2.naver.redirect-uri}")
    private String naverRedirectUri;
    
    @Value("${development.security.oauth2.naver.scope}")
    private String naverScope;
    
    @GetMapping("/current-user")
    public ResponseEntity<SessionInfo.UserInfo> getCurrentUser(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user != null) {
            SessionInfo.UserInfo userInfo = new SessionInfo.UserInfo();
            userInfo.setId(user.getId());
            userInfo.setUsername(encryptionUtil.decrypt(user.getName()));
            userInfo.setEmail(user.getEmail());
            userInfo.setRole(user.getRole());
            userInfo.setNickname(encryptionUtil.decrypt(user.getNickname()));
            return ResponseEntity.ok(userInfo);
        }
        return ResponseEntity.status(401).build();
    }
    
    @GetMapping("/session-info")
    public ResponseEntity<SessionInfo> getSessionInfo(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user != null) {
            SessionInfo sessionInfo = new SessionInfo();
            sessionInfo.setSessionId(session.getId());
            sessionInfo.setCreationTime(LocalDateTime.ofInstant(
                java.time.Instant.ofEpochMilli(session.getCreationTime()), ZoneId.systemDefault()));
            sessionInfo.setLastAccessedTime(LocalDateTime.ofInstant(
                java.time.Instant.ofEpochMilli(session.getLastAccessedTime()), ZoneId.systemDefault()));
            sessionInfo.setMaxInactiveInterval(session.getMaxInactiveInterval());
            
            SessionInfo.UserInfo userInfo = new SessionInfo.UserInfo();
            userInfo.setId(user.getId());
            userInfo.setUsername(encryptionUtil.decrypt(user.getName()));
            userInfo.setEmail(user.getEmail());
            userInfo.setRole(user.getRole());
            userInfo.setNickname(encryptionUtil.decrypt(user.getNickname()));
            sessionInfo.setUserInfo(userInfo);
            
            return ResponseEntity.ok(sessionInfo);
        }
        return ResponseEntity.status(401).build();
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        SessionUtils.clearSession(session);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/oauth2/config")
    public ResponseEntity<OAuth2Config> getOAuth2Config() {
        OAuth2Config config = new OAuth2Config();
        
        // 카카오 설정
        OAuth2Provider kakao = new OAuth2Provider();
        kakao.setClientId(kakaoClientId);
        kakao.setRedirectUri(kakaoRedirectUri.replace("{baseUrl}", "http://localhost:8080"));
        kakao.setScope(kakaoScope);
        config.setKakao(kakao);
        
        // 네이버 설정
        OAuth2Provider naver = new OAuth2Provider();
        naver.setClientId(naverClientId);
        naver.setRedirectUri(naverRedirectUri.replace("{baseUrl}", "http://localhost:8080"));
        naver.setScope(naverScope);
        config.setNaver(naver);
        
        return ResponseEntity.ok(config);
    }
    
    /**
     * OAuth2 설정 클래스
     */
    public static class OAuth2Config {
        private OAuth2Provider kakao;
        private OAuth2Provider naver;
        
        // Getters and Setters
        public OAuth2Provider getKakao() { return kakao; }
        public void setKakao(OAuth2Provider kakao) { this.kakao = kakao; }
        
        public OAuth2Provider getNaver() { return naver; }
        public void setNaver(OAuth2Provider naver) { this.naver = naver; }
    }
    
    /**
     * OAuth2 제공자 클래스
     */
    public static class OAuth2Provider {
        private String clientId;
        private String redirectUri;
        private String scope;
        
        // Getters and Setters
        public String getClientId() { return clientId; }
        public void setClientId(String clientId) { this.clientId = clientId; }
        
        public String getRedirectUri() { return redirectUri; }
        public void setRedirectUri(String redirectUri) { this.redirectUri = redirectUri; }
        
        public String getScope() { return scope; }
        public void setScope(String scope) { this.scope = scope; }
    }
}
