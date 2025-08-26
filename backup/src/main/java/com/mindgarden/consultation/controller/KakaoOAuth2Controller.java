package com.mindgarden.consultation.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import com.mindgarden.consultation.dto.SocialLoginResponse;
import com.mindgarden.consultation.service.OAuth2FactoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 카카오 OAuth2 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/kakao")
@RequiredArgsConstructor
public class KakaoOAuth2Controller {

    private final OAuth2FactoryService oauth2FactoryService;

    /**
     * 카카오 OAuth2 인증 코드로 로그인/회원가입
     * 
     * @param code 카카오 인증 코드
     * @return 소셜 로그인 응답
     */
    @GetMapping("/callback")
    public ResponseEntity<?> kakaoCallback(@RequestParam String code) {
        log.info("카카오 OAuth2 콜백 호출: code={}", code);
        
        try {
            SocialLoginResponse response = oauth2FactoryService.authenticateWithProvider("KAKAO", code);
            
            if (response.isSuccess()) {
                log.info("카카오 OAuth2 인증 성공: {}", response.getMessage());
                // 로그인 성공 시 사용자 역할에 따라 다른 대시보드로 리다이렉트
                try {
                    String encodedMessage = URLEncoder.encode(response.getMessage(), StandardCharsets.UTF_8);
                    String redirectUrl = getRoleBasedRedirectUrl(response.getUserInfo().getRole(), encodedMessage);
                    return ResponseEntity.status(302)
                        .header("Location", redirectUrl)
                        .build();
                } catch (Exception e) {
                    log.error("URL 인코딩 실패", e);
                    return ResponseEntity.status(302)
                        .header("Location", "/tablet/?login=success&message=Login+Success")
                        .build();
                }
            } else if (response.isRequiresSignup()) {
                log.info("카카오 OAuth2 간편 회원가입 필요: {}", response.getMessage());
                // 간편 회원가입 필요 시 로그인 페이지로 리다이렉트 (모달 표시용)
                String redirectUrl = "/tablet/login?signup=required&provider=KAKAO";
                
                if (response.getSocialUserInfo() != null) {
                    try {
                        redirectUrl += "&email=" + URLEncoder.encode(response.getSocialUserInfo().getEmail(), StandardCharsets.UTF_8);
                        if (response.getSocialUserInfo().getName() != null) {
                            redirectUrl += "&name=" + URLEncoder.encode(response.getSocialUserInfo().getName(), StandardCharsets.UTF_8);
                        }
                        if (response.getSocialUserInfo().getNickname() != null) {
                            redirectUrl += "&nickname=" + URLEncoder.encode(response.getSocialUserInfo().getNickname(), StandardCharsets.UTF_8);
                        }
                    } catch (Exception e) {
                        log.error("URL 인코딩 실패", e);
                    }
                }
                
                return ResponseEntity.status(302)
                    .header("Location", redirectUrl)
                    .build();
            } else {
                log.error("카카오 OAuth2 인증 실패: {}", response.getMessage());
                return ResponseEntity.status(302)
                    .header("Location", "/tablet/login?error=" + response.getMessage())
                    .build();
            }
            
        } catch (Exception e) {
            log.error("카카오 OAuth2 인증 처리 중 오류 발생", e);
            return ResponseEntity.status(302)
                .header("Location", "/tablet/login?error=카카오 로그인 처리 중 오류가 발생했습니다")
                .build();
        }
    }

    /**
     * 카카오 로그인 페이지로 리다이렉트
     * 
     * @return 리다이렉트 URL
     */
    @GetMapping("/login")
    public ResponseEntity<String> kakaoLogin() {
        String kakaoAuthUrl = "https://kauth.kakao.com/oauth/authorize?" +
            "client_id=your-kakao-client-id" + // 환경변수로 설정
            "&redirect_uri=http://localhost:8080/api/auth/kakao/callback" +
            "&response_type=code" +
            "&scope=profile_nickname,profile_image,account_email";
        
        return ResponseEntity.ok(kakaoAuthUrl);
    }
    
    /**
     * 사용자 역할에 따른 리다이렉트 URL 생성
     * 
     * @param role 사용자 역할
     * @param message 인코딩된 메시지
     * @return 역할별 리다이렉트 URL
     */
    private String getRoleBasedRedirectUrl(String role, String message) {
        String baseUrl = "?login=success&message=" + message;
        
        log.info("역할 기반 리다이렉트 URL 생성 - 역할: {}, 메시지: {}", role, message);
        
        String redirectUrl;
        switch (role) {
            case "CLIENT":
                redirectUrl = "/tablet/client/dashboard" + baseUrl; // 내담자 대시보드
                break;
            case "CONSULTANT":
                redirectUrl = "/tablet/consultant/dashboard" + baseUrl; // 상담사 대시보드
                break;
            case "ADMIN":
                redirectUrl = "/tablet/admin/dashboard" + baseUrl; // 관리자 대시보드
                break;
            case "SUPER_ADMIN":
                redirectUrl = "/tablet/admin/dashboard" + baseUrl; // 수퍼 관리자 대시보드
                break;
            default:
                redirectUrl = "/tablet/" + baseUrl; // 기본 태블릿 홈
                log.warn("알 수 없는 역할: {}, 기본 태블릿 홈으로 리다이렉트", role);
                break;
        }
        
        log.info("생성된 리다이렉트 URL: {}", redirectUrl);
        return redirectUrl;
    }
}
