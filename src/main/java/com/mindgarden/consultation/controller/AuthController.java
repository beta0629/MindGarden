package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.dto.AuthRequest;
import com.mindgarden.consultation.dto.AuthResponse;
import com.mindgarden.consultation.dto.RegisterRequest;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.AuthService;
import com.mindgarden.consultation.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 인증 관련 API 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private UserService userService;
    
    /**
     * 이메일 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.authenticate(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse.builder()
                    .success(false)
                    .message("로그인 실패: " + e.getMessage())
                    .build());
        }
    }
    
    /**
     * 회원가입
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        try {
            User user = new User();
            user.setEmail(request.getEmail());
            user.setPassword(request.getPassword());
            user.setName(request.getName());
            user.setPhone(request.getPhone());
            user.setRole(request.getRole());
            user.setGrade("BRONZE");
            user.setIsActive(true);
            
            User savedUser = userService.save(user);
            
            // 회원가입 후 자동 로그인
            AuthResponse response = authService.authenticate(request.getEmail(), request.getPassword());
            response.setMessage("회원가입이 완료되었습니다.");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(AuthResponse.builder()
                    .success(false)
                    .message("회원가입 실패: " + e.getMessage())
                    .build());
        }
    }
    
    /**
     * 토큰 갱신
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestParam String refreshToken) {
        try {
            AuthResponse response = authService.refreshToken(refreshToken);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse.builder()
                    .success(false)
                    .message("토큰 갱신 실패: " + e.getMessage())
                    .build());
        }
    }
    
    /**
     * 로그아웃
     */
    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(@RequestParam String token) {
        try {
            authService.logout(token);
            return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("로그아웃되었습니다.")
                .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(AuthResponse.builder()
                    .success(false)
                    .message("로그아웃 실패: " + e.getMessage())
                    .build());
        }
    }
    
    /**
     * OAuth2 설정 정보 반환
     */
    @GetMapping("/oauth2/config")
    public ResponseEntity<OAuth2Config> getOAuth2Config() {
        OAuth2Config config = new OAuth2Config();
        
        // 카카오 설정
        OAuth2Provider kakao = new OAuth2Provider();
        kakao.setClientId("cbb457cfb5f9351fd495be4af2b11a34");
        kakao.setRedirectUri("http://localhost:8080/api/auth/kakao/callback");
        kakao.setScope("profile_nickname,profile_image,account_email");
        config.setKakao(kakao);
        
        // 네이버 설정
        OAuth2Provider naver = new OAuth2Provider();
        naver.setClientId("vTKNlxYKIfo1uCCXaDfk");
        naver.setRedirectUri("http://localhost:8080/api/auth/naver/callback");
        naver.setScope("profile_nickname,profile_image,account_email");
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
    
    /**
     * 비밀번호 재설정 요청
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<AuthResponse> forgotPassword(@RequestParam String email) {
        try {
            authService.forgotPassword(email);
            return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("비밀번호 재설정 이메일이 발송되었습니다.")
                .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(AuthResponse.builder()
                    .success(false)
                    .message("비밀번호 재설정 요청 실패: " + e.getMessage())
                    .build());
        }
    }
    
    /**
     * 비밀번호 재설정
     */
    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(
            @RequestParam String token,
            @RequestParam String newPassword) {
        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("비밀번호가 성공적으로 변경되었습니다.")
                .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(AuthResponse.builder()
                    .success(false)
                    .message("비밀번호 재설정 실패: " + e.getMessage())
                    .build());
        }
    }
}
