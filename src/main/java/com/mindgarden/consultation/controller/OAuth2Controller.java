package com.mindgarden.consultation.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import com.mindgarden.consultation.constant.SessionConstants;
import com.mindgarden.consultation.dto.SocialLoginResponse;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.OAuth2FactoryService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import com.mindgarden.consultation.util.SessionManager;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OAuth2 공통 컨트롤러 (카카오, 네이버 통합)
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/oauth2")
@RequiredArgsConstructor
public class OAuth2Controller {

    private final OAuth2FactoryService oauth2FactoryService;
    private final SessionManager sessionManager;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
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

    /**
     * OAuth2 콜백 처리 (카카오, 네이버 공통)
     * 
     * @param provider OAuth2 제공자 (KAKAO, NAVER)
     * @param code 인증 코드
     * @return 소셜 로그인 응답
     */
    @GetMapping("/callback")
    public ResponseEntity<?> oauth2Callback(
            @RequestParam String provider,
            @RequestParam String code, 
            HttpServletRequest request) {
        log.info("{} OAuth2 콜백 호출: code={}", provider, code);
        
        try {
            SocialLoginResponse response = oauth2FactoryService.authenticateWithProvider(provider, code);
            
            if (response.isSuccess()) {
                log.info("{} OAuth2 인증 성공: {}", provider, response.getMessage());
                
                // 로그인 성공 시 세션에 사용자 정보 저장
                try {
                    HttpSession session = request.getSession(true);
                    
                    // 기존 세션 방식 (하위 호환성 유지)
                    String maskedName = "사용자";
                    try {
                        if (response.getUserInfo().getName() != null) {
                            String decryptedName = encryptionUtil.decrypt(response.getUserInfo().getName());
                            maskedName = encryptionUtil.maskName(decryptedName);
                            log.info("사용자 이름 복호화 및 마스킹 성공: {} -> {}", decryptedName, maskedName);
                        }
                    } catch (Exception e) {
                        log.warn("사용자 이름 복호화 실패, 원본 값 마스킹: {}", response.getUserInfo().getName());
                        try {
                            maskedName = encryptionUtil.maskName(response.getUserInfo().getName());
                        } catch (Exception maskEx) {
                            maskedName = "사용자";
                        }
                    }
                    
                    // 이메일 마스킹 처리
                    String maskedEmail = "u***@example.com";
                    try {
                        if (response.getUserInfo().getEmail() != null) {
                            maskedEmail = encryptionUtil.maskEmail(response.getUserInfo().getEmail());
                        }
                    } catch (Exception e) {
                        log.warn("이메일 마스킹 실패: {}", response.getUserInfo().getEmail());
                    }
                    
                    // 타입 안전을 위해 모든 값을 String으로 변환하여 저장
                    session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.USER_ID, String.valueOf(response.getUserInfo().getId()));
                    session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.USER_EMAIL, maskedEmail);
                    session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.USER_ROLE, String.valueOf(response.getUserInfo().getRole()));
                    session.setAttribute(SessionConstants.BUSINESS_SESSION_NAMESPACE + "." + SessionConstants.USER_NAME, maskedName);
                    session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.IS_SOCIAL_LOGIN, "true");
                    session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.SOCIAL_PROVIDER, provider);
                    
                    // 새로운 SessionUtils 방식으로 User 객체 저장
                    try {
                        User user = new User();
                        user.setId(response.getUserInfo().getId());
                        user.setEmail(response.getUserInfo().getEmail());
                        user.setName(response.getUserInfo().getName());
                        user.setNickname(response.getUserInfo().getNickname());
                        user.setRole(response.getUserInfo().getRole());
                        
                        SessionUtils.setCurrentUser(session, user);
                        log.info("SessionUtils를 통한 사용자 세션 저장 완료: userId={}", user.getId());
                    } catch (Exception e) {
                        log.error("SessionUtils를 통한 사용자 세션 저장 실패", e);
                    }
                    
                    // Spring Security 인증 설정 추가
                    try {
                        String role = String.valueOf(response.getUserInfo().getRole());
                        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            String.valueOf(response.getUserInfo().getId()), 
                            null, 
                            List.of(authority)
                        );
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        log.info("Spring Security 인증 설정 완료: role={}", role);
                    } catch (Exception e) {
                        log.error("Spring Security 인증 설정 실패", e);
                    }
                    
                    log.info("{} 사용자 세션 설정 완료: userId={}, maskedEmail={}, role={}, maskedName={}", 
                            provider, response.getUserInfo().getId(), maskedEmail, response.getUserInfo().getRole(), maskedName);
                } catch (Exception e) {
                    log.error("{} 사용자 세션 설정 실패", provider, e);
                }
                
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
                log.info("{} OAuth2 간편 회원가입 필요: {}", provider, response.getMessage());
                // 간편 회원가입 필요 시 로그인 페이지로 리다이렉트 (모달 표시용)
                String redirectUrl = "/tablet/login?signup=required&provider=" + provider;
                
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
                log.error("{} OAuth2 인증 실패: {}", provider, response.getMessage());
                return ResponseEntity.status(302)
                    .header("Location", "/tablet/login?error=" + response.getMessage())
                    .build();
            }
            
        } catch (Exception e) {
            log.error("{} OAuth2 인증 처리 중 오류 발생", provider, e);
            return ResponseEntity.status(302)
                .header("Location", "/tablet/login?error=" + provider + " 로그인 처리 중 오류가 발생했습니다")
                .build();
        }
    }

    /**
     * 카카오 로그인 페이지로 리다이렉트
     * 
     * @return 리다이렉트 URL
     */
    @GetMapping("/kakao/login")
    public ResponseEntity<String> kakaoLogin() {
        // redirect-uri에서 {baseUrl} 템플릿을 실제 URL로 변환
        String actualRedirectUri = kakaoRedirectUri.replace("{baseUrl}", "http://localhost:8080");
        
        String kakaoAuthUrl = "https://kauth.kakao.com/oauth/authorize?" +
            "client_id=" + kakaoClientId +
            "&redirect_uri=" + actualRedirectUri +
            "&response_type=code" +
            "&scope=" + kakaoScope;
        
        log.info("카카오 OAuth2 로그인 URL 생성: clientId={}, redirectUri={}, scope={}", 
                kakaoClientId, actualRedirectUri, kakaoScope);
        
        return ResponseEntity.ok(kakaoAuthUrl);
    }
    
    /**
     * 네이버 로그인 페이지로 리다이렉트
     * 
     * @return 리다이렉트 URL
     */
    @GetMapping("/naver/login")
    public ResponseEntity<String> naverLogin() {
        // redirect-uri에서 {baseUrl} 템플릿을 실제 URL로 변환
        String actualRedirectUri = naverRedirectUri.replace("{baseUrl}", "http://localhost:8080");
        
        String naverAuthUrl = "https://nid.naver.com/oauth2.0/authorize?" +
            "client_id=" + naverClientId +
            "&redirect_uri=" + actualRedirectUri +
            "&response_type=code" +
            "&scope=" + naverScope;
        
        log.info("네이버 OAuth2 로그인 URL 생성: clientId={}, redirectUri={}, scope={}", 
                naverClientId, actualRedirectUri, naverScope);
        
        return ResponseEntity.ok(naverAuthUrl);
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
        
        switch (role) {
            case "CLIENT":
                return "http://localhost:3000/client/dashboard" + baseUrl; // React 프론트엔드 대시보드
            case "CONSULTANT":
                return "http://localhost:3000/consultant/dashboard" + baseUrl; // React 프론트엔드 대시보드
            case "ADMIN":
                return "http://localhost:3000/admin/dashboard" + baseUrl; // React 프론트엔드 대시보드
            case "SUPER_ADMIN":
                return "http://localhost:3000/admin/dashboard" + baseUrl; // React 프론트엔드 대시보드
            default:
                return "http://localhost:3000/" + baseUrl; // React 프론트엔드 홈
        }
    }
}
