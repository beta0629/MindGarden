package com.mindgarden.consultation.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.mindgarden.consultation.constant.SessionConstants;
import com.mindgarden.consultation.dto.SocialLoginResponse;
import com.mindgarden.consultation.dto.SocialUserInfo;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.OAuth2FactoryService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import com.mindgarden.consultation.util.SessionManager;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OAuth2 통합 컨트롤러 (카카오, 네이버, 구글, 페이스북 등 모든 소셜 로그인 통합 관리)
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OAuth2Controller {

    private final OAuth2FactoryService oauth2FactoryService;
    private final SessionManager sessionManager;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    // TODO: 운영 환경에서는 개별 OAuth2 서비스 주입 필요
    // private final KakaoOAuth2Service kakaoOAuth2Service;
    // private final NaverOAuth2Service naverOAuth2Service;
    
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
     * 카카오 OAuth2 인증 URL 생성
     */
    @GetMapping("/oauth2/kakao/authorize")
    public ResponseEntity<?> kakaoAuthorize(HttpSession session) {
        try {
            log.info("카카오 OAuth2 인증 URL 생성 시작");
            
            String state = UUID.randomUUID().toString();
            
            // State를 세션에 저장 (CSRF 공격 방지)
            session.setAttribute("oauth2_kakao_state", state);
            log.info("카카오 OAuth2 state 세션 저장: {}", state);
            
            String kakaoAuthUrl = "https://kauth.kakao.com/oauth/authorize?" +
                    "client_id=" + kakaoClientId +
                    "&redirect_uri=" + URLEncoder.encode(kakaoRedirectUri, StandardCharsets.UTF_8) +
                    "&response_type=code" +
                    "&scope=" + kakaoScope +
                    "&state=" + state;
            
            log.info("카카오 OAuth2 인증 URL 생성 완료: {}", kakaoAuthUrl);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "authUrl", kakaoAuthUrl,
                "provider", "KAKAO",
                "state", state
            );
            
            log.info("카카오 OAuth2 응답 반환: {}", response);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("카카오 OAuth2 인증 URL 생성 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "카카오 OAuth2 인증 URL 생성에 실패했습니다."
            ));
        }
    }

    /**
     * 네이버 OAuth2 인증 URL 생성
     */
    @GetMapping("/oauth2/naver/authorize")
    public ResponseEntity<?> naverAuthorize(HttpSession session) {
        try {
            log.info("네이버 OAuth2 인증 URL 생성 시작");
            
            String state = UUID.randomUUID().toString();
            
            // State를 세션에 저장 (CSRF 공격 방지)
            session.setAttribute("oauth2_naver_state", state);
            log.info("네이버 OAuth2 state 세션 저장: {}", state);
            
            String naverAuthUrl = "https://nid.naver.com/oauth2.0/authorize?" +
                    "response_type=code" +
                    "&client_id=" + naverClientId +
                    "&redirect_uri=" + URLEncoder.encode(naverRedirectUri, StandardCharsets.UTF_8) +
                    "&state=" + state +
                    "&scope=" + naverScope;
            
            log.info("네이버 OAuth2 인증 URL 생성 완료: {}", naverAuthUrl);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "authUrl", naverAuthUrl,
                "provider", "NAVER",
                "state", state
            );
            
            log.info("네이버 OAuth2 응답 반환: {}", response);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("네이버 OAuth2 인증 URL 생성 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "네이버 OAuth2 인증 URL 생성에 실패했습니다."
            ));
        }
    }

    /**
     * 소셜 계정 연동을 위한 OAuth2 URL 생성
     * TODO: 운영 환경에서는 개별 OAuth2 서비스 주입 후 활성화
     */
    @GetMapping("/{provider}/login")
    public ResponseEntity<Map<String, String>> getOAuth2Url(
            @PathVariable String provider,
            @RequestParam(defaultValue = "login") String mode) {
        
        try {
            // TODO: 운영 환경에서는 아래 코드 활성화
            // String authUrl = "";
            // if ("KAKAO".equalsIgnoreCase(provider)) {
            //     authUrl = kakaoOAuth2Service.getAuthorizationUrl(mode);
            // } else if ("NAVER".equalsIgnoreCase(provider)) {
            //     authUrl = naverOAuth2Service.getAuthorizationUrl(mode);
            // } else {
            //     return ResponseEntity.badRequest().body(Map.of("error", "지원하지 않는 제공자입니다: " + provider));
            // }
            
            // 개발 환경에서는 임시로 기존 인증 URL 사용
            String authUrl = "";
            if ("KAKAO".equalsIgnoreCase(provider)) {
                authUrl = "https://kauth.kakao.com/oauth/authorize?client_id=" + kakaoClientId + 
                         "&redirect_uri=" + URLEncoder.encode(kakaoRedirectUri, StandardCharsets.UTF_8) + 
                         "&response_type=code&scope=" + kakaoScope + "&state=" + UUID.randomUUID().toString();
            } else if ("NAVER".equalsIgnoreCase(provider)) {
                authUrl = "https://nid.naver.com/oauth2.0/authorize?client_id=" + naverClientId + 
                         "&redirect_uri=" + URLEncoder.encode(naverRedirectUri, StandardCharsets.UTF_8) + 
                         "&response_type=code&scope=" + naverScope + "&state=" + UUID.randomUUID().toString();
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "지원하지 않는 제공자입니다: " + provider));
            }
            
            log.info("{} OAuth2 URL 생성 성공 (mode: {}): {}", provider, mode, authUrl);
            return ResponseEntity.ok(Map.of("authUrl", authUrl));
            
        } catch (Exception e) {
            log.error("{} OAuth2 URL 생성 실패: {}", provider, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "OAuth2 URL 생성 중 오류가 발생했습니다."));
        }
    }

    /**
     * 카카오 OAuth2 콜백 처리
     */
    @GetMapping("/kakao/callback")
    public ResponseEntity<?> kakaoCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            HttpSession session) {
        
        log.info("카카오 OAuth2 콜백 호출: code={}, state={}, error={}", code, state, error);
        
        if (error != null) {
            log.error("카카오 OAuth2 오류: {}", error);
            return ResponseEntity.status(302)
                .header("Location", "http://localhost:3000/login?error=" + error + "&provider=KAKAO")
                .build();
        }
        
        if (code == null) {
            log.error("카카오 OAuth2 인증 코드가 없습니다");
            return ResponseEntity.status(302)
                .header("Location", "http://localhost:3000/login?error=" + URLEncoder.encode("인증 코드를 받지 못했습니다", StandardCharsets.UTF_8) + "&provider=KAKAO")
                .build();
        }
        
        // State 검증 (CSRF 공격 방지) - 개발 환경에서는 더 유연하게 처리
        String savedState = (String) session.getAttribute("oauth2_kakao_state");
        log.info("카카오 OAuth2 state 검증: received={}, saved={}", state, savedState);
        
        if (state == null) {
            log.warn("카카오 OAuth2 state 파라미터가 없습니다. 보안상 권장되지 않지만 개발 환경에서는 허용");
        } else if (savedState == null) {
            log.warn("카카오 OAuth2 세션에 저장된 state가 없습니다. 세션 문제일 수 있음");
        } else if (!state.equals(savedState)) {
            log.error("카카오 OAuth2 state 불일치: received={}, saved={}", state, savedState);
            // 세션에서 state 제거
            session.removeAttribute("oauth2_kakao_state");
            return ResponseEntity.status(302)
                .header("Location", "http://localhost:3000/login?error=" + URLEncoder.encode("보안 검증에 실패했습니다. 다시 로그인해주세요.", StandardCharsets.UTF_8) + "&provider=KAKAO")
                .build();
        }
        
        // State 검증 성공 후 세션에서 제거
        if (savedState != null) {
            session.removeAttribute("oauth2_kakao_state");
            log.info("카카오 OAuth2 state 검증 성공");
        }
        
        return processOAuth2Callback("KAKAO", code, state);
    }
    
    /**
     * 네이버 OAuth2 콜백 처리
     */
    @GetMapping("/naver/callback")
    public ResponseEntity<?> naverCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            HttpSession session) {
        
        log.info("네이버 OAuth2 콜백 호출: code={}, state={}, error={}", code, state, error);
        
        if (error != null) {
            log.error("네이버 OAuth2 오류: {}", error);
            return ResponseEntity.status(302)
                .header("Location", "http://localhost:3000/login?error=" + error + "&provider=NAVER")
                .build();
        }
        
        if (code == null) {
            log.error("네이버 OAuth2 인증 코드가 없습니다");
            return ResponseEntity.status(302)
                .header("Location", "http://localhost:3000/login?error=" + URLEncoder.encode("인증 코드를 받지 못했습니다", StandardCharsets.UTF_8) + "&provider=NAVER")
                .build();
        }
        
        // State 검증 (CSRF 공격 방지) - 개발 환경에서는 더 유연하게 처리
        String savedState = (String) session.getAttribute("oauth2_naver_state");
        log.info("네이버 OAuth2 state 검증: received={}, saved={}", state, savedState);
        
        if (state == null) {
            log.warn("네이버 OAuth2 state 파라미터가 없습니다. 보안상 권장되지 않지만 개발 환경에서는 허용");
        } else if (savedState == null) {
            log.warn("네이버 OAuth2 세션에 저장된 state가 없습니다. 세션 문제일 수 있음");
        } else if (!state.equals(savedState)) {
            log.error("네이버 OAuth2 state 불일치: received={}, saved={}", state, savedState);
            // 세션에서 state 제거
            session.removeAttribute("oauth2_naver_state");
            return ResponseEntity.status(302)
                .header("Location", "http://localhost:3000/login?error=" + URLEncoder.encode("보안 검증에 실패했습니다. 다시 로그인해주세요.", StandardCharsets.UTF_8) + "&provider=NAVER")
                .build();
        }
        
        // State 검증 성공 후 세션에서 제거
        if (savedState != null) {
            session.removeAttribute("oauth2_naver_state");
            log.info("네이버 OAuth2 state 검증 성공");
        }
        
        return processOAuth2Callback("NAVER", code, state);
    }

    /**
     * OAuth2 콜백 공통 처리
     */
    private ResponseEntity<?> processOAuth2Callback(String provider, String code, String state) {
        try {
            log.info("{} OAuth2 콜백 처리 시작: code={}, state={}", provider, code, state);
            
            // Authorization Code 유효성 검증 (길이 및 형식)
            if (code.length() < 10) {
                log.error("{} OAuth2 인증 코드가 너무 짧습니다: {}", provider, code);
                return ResponseEntity.status(302)
                    .header("Location", "http://localhost:3000/login?error=" + URLEncoder.encode("유효하지 않은 인증 코드입니다", StandardCharsets.UTF_8) + "&provider=" + provider)
                    .build();
            }
            
            // OAuth2 인증 처리
            SocialLoginResponse response = oauth2FactoryService.authenticateWithProvider(provider, code);
            
            if (response.isSuccess()) {
                log.info("{} OAuth2 인증 성공: userId={}", provider, response.getUserInfo().getId());
                
                // 사용자 세션 설정
                setUserSession(sessionManager.getCurrentSession(), response, provider);
                
                // 성공 시 리다이렉트 (사용자 정보 포함)
                String redirectUrl = String.format("http://localhost:3000/oauth2/callback?success=true&provider=%s&userId=%s&email=%s&name=%s&nickname=%s&role=%s&profileImageUrl=%s&providerUserId=%s",
                    provider,
                    response.getUserInfo().getId(),
                    URLEncoder.encode(response.getUserInfo().getEmail() != null ? response.getUserInfo().getEmail() : "", StandardCharsets.UTF_8),
                    URLEncoder.encode(response.getUserInfo().getName() != null ? response.getUserInfo().getName() : "", StandardCharsets.UTF_8),
                    URLEncoder.encode(response.getUserInfo().getNickname() != null ? response.getUserInfo().getNickname() : "", StandardCharsets.UTF_8),
                    response.getUserInfo().getRole(),
                    URLEncoder.encode(response.getUserInfo().getProfileImageUrl() != null ? response.getUserInfo().getProfileImageUrl() : "", StandardCharsets.UTF_8),
                    URLEncoder.encode(response.getSocialUserInfo() != null && response.getSocialUserInfo().getProviderUserId() != null ? response.getSocialUserInfo().getProviderUserId() : "", StandardCharsets.UTF_8)
                );
                
                log.info("{} OAuth2 성공 리다이렉트: {}", provider, redirectUrl);
                
                return ResponseEntity.status(302)
                    .header("Location", redirectUrl)
                    .build();
                
            } else {
                log.error("{} OAuth2 인증 실패: {}", provider, response.getMessage());
                
                // 구체적인 에러 메시지 처리
                String errorMessage = response.getMessage();
                if (errorMessage.contains("authorization code not found") || 
                    errorMessage.contains("invalid_grant") ||
                    errorMessage.contains("KOE320")) {
                    errorMessage = "인증 코드가 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.";
                } else if (errorMessage.contains("간편 회원가입") || response.isRequiresSignup()) {
                    // 회원가입이 필요한 경우 - SNS 사용자 정보와 함께 성공 응답
                    log.info("{} OAuth2 회원가입 필요: provider={}", provider, provider);
                    
                    // SNS 사용자 정보를 포함한 성공 응답 (프론트엔드에서 SocialSignupModal 열기)
                    String redirectUrl = "http://localhost:3000/oauth2/callback?success=true&provider=" + provider + 
                        "&requiresSignup=true";
                    
                    // SNS에서 받은 정보를 최대한 활용하여 사용자 입력 최소화
                    try {
                        String userEmail = "";
                        String userName = "";
                        String userNickname = "";
                        String profileImageUrl = "";
                        
                        if (response.getSocialUserInfo() != null) {
                            SocialUserInfo socialInfo = response.getSocialUserInfo();
                            
                            // SNS에서 받은 모든 정보를 활용
                            userEmail = socialInfo.getEmail() != null ? socialInfo.getEmail() : "";
                            userName = socialInfo.getName() != null ? socialInfo.getName() : "";
                            userNickname = socialInfo.getNickname() != null ? socialInfo.getNickname() : "";
                            profileImageUrl = socialInfo.getProfileImageUrl() != null ? socialInfo.getProfileImageUrl() : "";
                            
                            // 카카오의 경우 nickname이 더 자주 사용됨
                            if (provider.equals("KAKAO") && (userName == null || userName.isEmpty()) && userNickname != null) {
                                userName = userNickname;
                            }
                        }
                        
                        // providerUserId 추가 (소셜 계정 연동에 필수)
                        String providerUserId = "";
                        if (response.getSocialUserInfo() != null && response.getSocialUserInfo().getProviderUserId() != null) {
                            providerUserId = response.getSocialUserInfo().getProviderUserId();
                        }
                        
                        log.info("{} OAuth2 사용자 정보 추출: email={}, name={}, nickname={}, providerUserId={}", 
                            provider, userEmail, userName, userNickname, providerUserId);
                        
                        // SNS 정보를 최대한 활용하여 사용자 입력 최소화
                        redirectUrl += "&email=" + URLEncoder.encode(userEmail, StandardCharsets.UTF_8) +
                            "&name=" + URLEncoder.encode(userName, StandardCharsets.UTF_8) +
                            "&nickname=" + URLEncoder.encode(userNickname, StandardCharsets.UTF_8) +
                            "&profileImageUrl=" + URLEncoder.encode(profileImageUrl, StandardCharsets.UTF_8) +
                            "&providerUserId=" + URLEncoder.encode(providerUserId, StandardCharsets.UTF_8);
                            
                    } catch (Exception e) {
                        log.warn("{} OAuth2 사용자 정보 인코딩 실패, 기본값 사용: {}", provider, e.getMessage());
                    }
                    
                    log.info("{} OAuth2 회원가입 필요 응답: {}", provider, redirectUrl);
                    
                    return ResponseEntity.status(302)
                        .header("Location", redirectUrl)
                        .build();
                }
                
                try {
                    errorMessage = URLEncoder.encode(errorMessage, StandardCharsets.UTF_8);
                } catch (Exception encodeEx) {
                    log.warn("에러 메시지 인코딩 실패, 기본값 사용: {}", errorMessage);
                    errorMessage = URLEncoder.encode(provider + " authentication failed", StandardCharsets.UTF_8);
                }
                return ResponseEntity.status(302)
                    .header("Location", "http://localhost:3000/login?error=" + errorMessage + "&provider=" + provider)
                    .build();
            }
            
        } catch (Exception e) {
            log.error("{} OAuth2 인증 처리 중 오류 발생", provider, e);
            
            // 구체적인 예외 처리
            String errorMessage;
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                String causeMessage = e.getCause().getMessage();
                if (causeMessage.contains("authorization code not found") || 
                    causeMessage.contains("invalid_grant") ||
                    causeMessage.contains("KOE320")) {
                    errorMessage = "인증 코드가 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.";
                } else if (causeMessage.contains("400")) {
                    errorMessage = "OAuth2 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
                } else {
                    errorMessage = provider + " 로그인 처리 중 오류가 발생했습니다";
                }
            } else {
                errorMessage = provider + " 로그인 처리 중 오류가 발생했습니다";
            }
            
            try {
                errorMessage = URLEncoder.encode(errorMessage, StandardCharsets.UTF_8);
            } catch (Exception encodeEx) {
                log.warn("에러 메시지 인코딩 실패, 기본값 사용: {}", errorMessage);
                errorMessage = URLEncoder.encode(provider + " login error", StandardCharsets.UTF_8);
            }
            return ResponseEntity.status(302)
                .header("Location", "http://localhost:3000/login?error=" + errorMessage + "&provider=" + provider)
                .build();
        }
    }

    /**
     * 사용자 세션 설정
     */
    private void setUserSession(HttpSession session, SocialLoginResponse response, String provider) {
        try {
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
    }

    // OAuth2 설정 정보는 AuthController에서 제공됨
}
