package com.mindgarden.consultation.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.mindgarden.consultation.constant.OAuth2Constants;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.SocialLoginResponse;
import com.mindgarden.consultation.dto.SocialUserInfo;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.OAuth2FactoryService;
import com.mindgarden.consultation.service.OAuth2Service;
import com.mindgarden.consultation.util.DashboardRedirectUtil;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OAuth2Controller {

    private final OAuth2FactoryService oauth2FactoryService;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    @Value("${spring.security.oauth2.client.registration.kakao.client-id:dummy}")
    private String kakaoClientId;
    
    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri:${OAUTH2_BASE_URL:http://m-garden.co.kr}/api/auth/kakao/callback}")
    private String kakaoRedirectUri;
    
    @Value("${spring.security.oauth2.client.registration.kakao.scope:profile_nickname,account_email}")
    private String kakaoScope;
    
    @Value("${spring.security.oauth2.client.registration.naver.client-id:dummy}")
    private String naverClientId;
    
    @Value("${spring.security.oauth2.client.registration.naver.redirect-uri:${OAUTH2_BASE_URL:http://m-garden.co.kr}/api/auth/naver/callback}")
    private String naverRedirectUri;
    
    @Value("${spring.security.oauth2.client.registration.naver.scope:name,email}")
    private String naverScope;
    
    @Value("${frontend.base-url:${FRONTEND_BASE_URL:http://m-garden.co.kr}}")
    private String frontendBaseUrl;
    
    @PostConstruct
    public void init() {
        log.info("🔧 OAuth2Controller 초기화 - frontendBaseUrl: {}", frontendBaseUrl);
    }
    
    /**
     * 프론트엔드 URL 동적 감지
     * Referer 헤더에서 프론트엔드 URL을 추출
     */
    private String getFrontendBaseUrl(HttpServletRequest request) {
        String referer = request.getHeader("Referer");
        if (referer != null && !referer.isEmpty() && !referer.contains("null")) {
            try {
                // Referer에서 프로토콜과 호스트 부분만 추출
                java.net.URL url = new java.net.URL(referer);
                String frontendUrl = url.getProtocol() + "://" + url.getAuthority();
                
                // null이 포함된 URL 필터링
                if (frontendUrl.contains("null")) {
                    log.warn("Referer URL에 null이 포함됨, 무시: {}", frontendUrl);
                } else {
                    log.info("프론트엔드 URL 감지: {}", frontendUrl);
                    return frontendUrl;
                }
            } catch (Exception e) {
                log.warn("Referer URL 파싱 실패: {}", referer, e);
            }
        }
        
        // Referer가 없거나 파싱 실패 시 프로퍼티 값 사용
        log.info("프로퍼티 프론트엔드 URL 사용: {}", frontendBaseUrl);
        
        // 프로퍼티 값도 null인 경우 환경에 따른 기본값 사용
        if (frontendBaseUrl == null || frontendBaseUrl.trim().isEmpty()) {
            // 환경변수에서 프론트엔드 URL 확인
            String envFrontendUrl = System.getenv("FRONTEND_BASE_URL");
            if (envFrontendUrl != null && !envFrontendUrl.trim().isEmpty()) {
                log.info("환경변수에서 프론트엔드 URL 사용: {}", envFrontendUrl);
                return envFrontendUrl;
            }
            
            // 모든 설정이 없으면 기본값 (개발환경)
            String defaultUrl = "http://localhost:3000";
            log.warn("프론트엔드 URL이 설정되지 않음, 기본값 사용: {}", defaultUrl);
            return defaultUrl;
        }
        
        return frontendBaseUrl;
    }

    @GetMapping("/oauth2/kakao/authorize")
    public ResponseEntity<?> kakaoAuthorize(
            @RequestParam(required = false) String mode,
            HttpSession session) {
        try {
            String state = UUID.randomUUID().toString();
            session.setAttribute("oauth2_kakao_state", state);
            
            // 콜백 URL에 mode 파라미터 추가
            String callbackUrl = kakaoRedirectUri;
            if ("link".equals(mode)) {
                callbackUrl += "?mode=link";
            }
            
            String authUrl = "https://kauth.kakao.com/oauth/authorize?" +
                    "client_id=" + kakaoClientId +
                    "&redirect_uri=" + URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8) +
                    "&response_type=code" +
                    "&scope=" + kakaoScope +
                    "&state=" + state;
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "authUrl", authUrl,
                "provider", "KAKAO",
                "state", state
            ));
        } catch (Exception e) {
            log.error("카카오 OAuth2 인증 URL 생성 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/oauth2/naver/authorize")
    public ResponseEntity<?> naverAuthorize(
            @RequestParam(required = false) String mode,
            HttpSession session) {
        try {
            String state = UUID.randomUUID().toString();
            session.setAttribute("oauth2_naver_state", state);
            
            // 콜백 URL에 mode 파라미터 추가
            String callbackUrl = naverRedirectUri;
            if ("link".equals(mode)) {
                callbackUrl += "?mode=link";
            }
            
            String authUrl = "https://nid.naver.com/oauth2.0/authorize?" +
                    "response_type=code" +
                    "&client_id=" + naverClientId +
                    "&redirect_uri=" + URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8) +
                    "&state=" + state +
                    "&scope=" + naverScope;
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "authUrl", authUrl,
                "provider", "NAVER",
                "state", state
            ));
        } catch (Exception e) {
            log.error("네이버 OAuth2 인증 URL 생성 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/naver/callback")
    public ResponseEntity<?> naverCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String mode, // 'login' 또는 'link'
            HttpServletRequest request,
            HttpSession session) {
        
        if (error != null) {
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302)
                .header("Location", frontendUrl + "/login?error=" + URLEncoder.encode(error, StandardCharsets.UTF_8) + "&provider=NAVER")
                .build();
        }
        
        if (code == null) {
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302)
                .header("Location", frontendUrl + "/login?error=" + URLEncoder.encode("인증코드없음", StandardCharsets.UTF_8) + "&provider=NAVER")
                .build();
        }
        
        String savedState = (String) session.getAttribute("oauth2_naver_state");
        if (savedState != null && !savedState.equals(state)) {
            session.removeAttribute("oauth2_naver_state");
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302)
                .header("Location", frontendUrl + "/login?error=" + URLEncoder.encode("보안검증실패", StandardCharsets.UTF_8) + "&provider=NAVER")
                .build();
        }
        
        if (savedState != null) {
            session.removeAttribute("oauth2_naver_state");
        }
        
        try {
            SocialLoginResponse response = oauth2FactoryService.authenticateWithProvider("NAVER", code);
            
            log.info("네이버 OAuth2 응답: success={}, requiresSignup={}, message={}", 
                response.isSuccess(), response.isRequiresSignup(), response.getMessage());
            
            if (response.isSuccess()) {
                // SocialLoginResponse에서 이미 완성된 UserInfo 사용 (공통 SNS 처리 로직 활용)
                SocialLoginResponse.UserInfo userInfo = response.getUserInfo();
                
                // 계정 연동 모드인지 확인
                if ("link".equals(mode)) {
                    // 기존 로그인된 사용자의 세션 확인
                    User currentUser = SessionUtils.getCurrentUser(session);
                    if (currentUser == null) {
                        log.error("계정 연동 모드에서 세션 사용자를 찾을 수 없음");
                        return ResponseEntity.status(302)
                            .header("Location", OAuth2Constants.FRONTEND_BASE_URL + "/mypage?error=" + URLEncoder.encode("세션만료", StandardCharsets.UTF_8) + "&provider=NAVER")
                            .build();
                    }
                    
                    // 기존 사용자에게 소셜 계정 추가
                    try {
                        // AbstractOAuth2Service의 updateOrCreateSocialAccount 메서드 호출
                        // SocialUserInfo 객체 생성
                        SocialUserInfo socialUserInfo = new SocialUserInfo();
                        socialUserInfo.setProviderUserId(String.valueOf(userInfo.getId()));
                        socialUserInfo.setEmail(userInfo.getEmail());
                        socialUserInfo.setName(userInfo.getName());
                        socialUserInfo.setNickname(userInfo.getNickname());
                        socialUserInfo.setProfileImageUrl(userInfo.getProfileImageUrl());
                        socialUserInfo.setProvider("NAVER");
                        
                        // OAuth2FactoryService를 통해 해당 provider의 서비스 가져오기
                        OAuth2Service oauth2Service = oauth2FactoryService.getOAuth2Service("NAVER");
                        oauth2Service.linkSocialAccountToUser(currentUser.getId(), socialUserInfo);
                        log.info("네이버 계정 연동 성공: 기존 사용자 userId={}, 소셜 사용자 providerUserId={}", 
                                currentUser.getId(), userInfo.getId());
                        
                        return ResponseEntity.status(302)
                            .header("Location", frontendBaseUrl + "/mypage?success=" + URLEncoder.encode("연동완료", StandardCharsets.UTF_8) + "&provider=NAVER")
                            .build();
                    } catch (Exception e) {
                        log.error("네이버 계정 연동 실패", e);
                        return ResponseEntity.status(302)
                            .header("Location", frontendBaseUrl + "/mypage?error=" + URLEncoder.encode("연동실패", StandardCharsets.UTF_8) + "&provider=NAVER")
                            .build();
                    }
                } else {
                    // 로그인 모드 (기존 로직)
                    // OAuth2 로그인 시 기존 세션 완전 초기화
                    SessionUtils.clearSession(session);
                    
                    // 새로운 세션 생성
                    session = request.getSession(true);
                    
                    // 세션에 사용자 정보 저장 (UserInfo를 User 엔티티로 변환, 복호화된 데이터 사용)
                    User user = new User();
                    user.setId(userInfo.getId());
                    user.setEmail(userInfo.getEmail());
                    
                    // 이름과 닉네임 복호화해서 세션에 저장
                    String decryptedName = null;
                    String decryptedNickname = null;
                    
                    try {
                        if (userInfo.getName() != null && !userInfo.getName().trim().isEmpty()) {
                            decryptedName = encryptionUtil.safeDecrypt(userInfo.getName());
                        }
                        if (userInfo.getNickname() != null && !userInfo.getNickname().trim().isEmpty()) {
                            decryptedNickname = encryptionUtil.safeDecrypt(userInfo.getNickname());
                        }
                    } catch (Exception e) {
                        log.warn("사용자 정보 복호화 실패, 원본 데이터 사용: {}", e.getMessage());
                        decryptedName = userInfo.getName();
                        decryptedNickname = userInfo.getNickname();
                    }
                    
                    user.setName(decryptedName);
                    user.setNickname(decryptedNickname);
                    user.setRole(UserRole.fromString(userInfo.getRole()));
                    user.setProfileImageUrl(userInfo.getProfileImageUrl());
                    
                    SessionUtils.setCurrentUser(session, user);
                    
                    // SpringSecurity 인증 컨텍스트에도 사용자 정보 설정
                    setSpringSecurityAuthentication(user);
                    
                    // 세션 무효화 시간 설정 (1시간)
                    session.setMaxInactiveInterval(3600);
                    
                    log.info("네이버 OAuth2 로그인 성공: userId={}, role={}, profileImage={}", 
                            user.getId(), user.getRole(), user.getProfileImageUrl());
                    
                    // 세션 정보 디버깅 로그 추가
                    log.info("세션 정보 확인: sessionId={}, userInSession={}, sessionMaxInactiveInterval={}", 
                            session.getId(), 
                            SessionUtils.getCurrentUser(session) != null ? "설정됨" : "없음",
                            session.getMaxInactiveInterval());
                    
                    // SecurityContext 확인
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    log.info("SecurityContext 설정 확인: {}", auth != null && auth.isAuthenticated() ? "성공" : "실패");
                    
                    // 사용자 역할에 따른 리다이렉트 (공통 유틸리티 사용)
                    String frontendUrl = getFrontendBaseUrl(request);
                    String redirectUrl = DashboardRedirectUtil.getDashboardUrl(user.getRole(), frontendUrl);
                    
                    // 세션 쿠키 설정을 명시적으로 추가
        return ResponseEntity.status(302)
            .header("Location", redirectUrl)
            .header("Set-Cookie", String.format("JSESSIONID=%s; Path=/; SameSite=None; Max-Age=3600; HttpOnly=false", session.getId()))
            .build();
                }
            } else if (response.isRequiresSignup()) {
                // 간편 회원가입이 필요한 경우
                log.info("네이버 OAuth2 간편 회원가입 필요: {}", response.getSocialUserInfo());
                
                // 소셜 사용자 정보를 URL 파라미터로 전달 (한글 인코딩 처리)
                String frontendUrl = getFrontendBaseUrl(request);
                String email = response.getSocialUserInfo() != null ? response.getSocialUserInfo().getEmail() : "";
                String name = response.getSocialUserInfo() != null ? response.getSocialUserInfo().getName() : "";
                String nickname = response.getSocialUserInfo() != null ? response.getSocialUserInfo().getNickname() : "";
                
                String signupUrl = frontendUrl + "/login?" +
                    "signup=required" +
                    "&provider=naver" +
                    "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8) +
                    "&name=" + URLEncoder.encode(name, StandardCharsets.UTF_8) +
                    "&nickname=" + URLEncoder.encode(nickname, StandardCharsets.UTF_8);
                
                log.info("네이버 OAuth2 회원가입 리다이렉트 URL: {}", signupUrl);
                
                return ResponseEntity.status(302)
                    .header("Location", signupUrl)
                    .build();
            } else {
                return ResponseEntity.status(302)
                    .header("Location", frontendBaseUrl + "/login?error=" + URLEncoder.encode(response.getMessage(), StandardCharsets.UTF_8) + "&provider=NAVER")
                    .build();
            }
        } catch (Exception e) {
            log.error("네이버 OAuth2 콜백 처리 실패", e);
            return ResponseEntity.status(302)
                .header("Location", frontendBaseUrl + "/login?error=" + URLEncoder.encode("처리실패", StandardCharsets.UTF_8) + "&provider=NAVER")
                .build();
        }
    }

    // 테스트용 간편 회원가입 시뮬레이션 엔드포인트
    @GetMapping("/test/signup-required")
    public ResponseEntity<?> testSignupRequired(HttpServletRequest request) {
        try {
            log.info("테스트용 간편 회원가입 시뮬레이션 요청");
            
            String frontendBaseUrl = getFrontendBaseUrl(request);
            String signupUrl = frontendBaseUrl + "/login?" +
                "signup=required" +
                "&provider=kakao" +
                "&email=" + URLEncoder.encode("test@example.com", StandardCharsets.UTF_8) +
                "&name=" + URLEncoder.encode("테스트사용자", StandardCharsets.UTF_8) +
                "&nickname=" + URLEncoder.encode("테스트닉네임", StandardCharsets.UTF_8);
            
            log.info("테스트용 간편 회원가입 URL로 리다이렉트: {}", signupUrl);
            
            return ResponseEntity.status(302)
                .header("Location", signupUrl)
                .build();
        } catch (Exception e) {
            log.error("테스트용 간편 회원가입 시뮬레이션 실패", e);
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "message", "테스트 실패: " + e.getMessage()));
        }
    }

    @GetMapping("/kakao/callback")
    public ResponseEntity<?> kakaoCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String mode, // 'login' 또는 'link'
            HttpServletRequest request,
            HttpSession session) {
        
        if (error != null) {
            return ResponseEntity.status(302)
                .header("Location", frontendBaseUrl + "/login?error=" + URLEncoder.encode(error, StandardCharsets.UTF_8) + "&provider=KAKAO")
                .build();
        }
        
        if (code == null) {
            log.warn("카카오 OAuth2 콜백에서 인증 코드가 없습니다. error={}, state={}", error, state);
            return ResponseEntity.status(302)
                .header("Location", frontendBaseUrl + "/login?error=" + URLEncoder.encode("인증코드없음", StandardCharsets.UTF_8) + "&provider=KAKAO")
                .build();
        }
        
        String savedState = (String) session.getAttribute("oauth2_kakao_state");
        if (savedState != null && !savedState.equals(state)) {
            session.removeAttribute("oauth2_kakao_state");
            return ResponseEntity.status(302)
                .header("Location", frontendBaseUrl + "/login?error=" + URLEncoder.encode("보안검증실패", StandardCharsets.UTF_8) + "&provider=KAKAO")
                .build();
        }
        
        if (savedState != null) {
            session.removeAttribute("oauth2_kakao_state");
        }
        
        try {
            SocialLoginResponse response = oauth2FactoryService.authenticateWithProvider("KAKAO", code);
            
            if (response.isSuccess()) {
                // SocialLoginResponse에서 이미 완성된 UserInfo 사용 (공통 SNS 처리 로직 활용)
                SocialLoginResponse.UserInfo userInfo = response.getUserInfo();
                
                // 계정 연동 모드인지 확인
                if ("link".equals(mode)) {
                    // 기존 로그인된 사용자의 세션 확인
                    User currentUser = SessionUtils.getCurrentUser(session);
                    if (currentUser == null) {
                        log.error("계정 연동 모드에서 세션 사용자를 찾을 수 없음");
                        return ResponseEntity.status(302)
                            .header("Location", frontendBaseUrl + "/mypage?error=" + URLEncoder.encode("세션만료", StandardCharsets.UTF_8) + "&provider=KAKAO")
                            .build();
                    }
                    
                    // 기존 사용자에게 소셜 계정 추가
                    try {
                        // SocialUserInfo 객체 생성
                        SocialUserInfo socialUserInfo = new SocialUserInfo();
                        socialUserInfo.setProviderUserId(String.valueOf(userInfo.getId()));
                        socialUserInfo.setEmail(userInfo.getEmail());
                        socialUserInfo.setName(userInfo.getName());
                        socialUserInfo.setNickname(userInfo.getNickname());
                        socialUserInfo.setProfileImageUrl(userInfo.getProfileImageUrl());
                        socialUserInfo.setProvider("KAKAO");
                        
                        // OAuth2FactoryService를 통해 해당 provider의 서비스 가져오기
                        OAuth2Service oauth2Service = oauth2FactoryService.getOAuth2Service("KAKAO");
                        oauth2Service.linkSocialAccountToUser(currentUser.getId(), socialUserInfo);
                        log.info("카카오 계정 연동 성공: 기존 사용자 userId={}, 소셜 사용자 providerUserId={}", 
                                currentUser.getId(), userInfo.getId());
                        
                        return ResponseEntity.status(302)
                            .header("Location", frontendBaseUrl + "/mypage?success=" + URLEncoder.encode("연동완료", StandardCharsets.UTF_8) + "&provider=KAKAO")
                            .build();
                    } catch (Exception e) {
                        log.error("카카오 계정 연동 실패", e);
                        return ResponseEntity.status(302)
                            .header("Location", frontendBaseUrl + "/mypage?error=" + URLEncoder.encode("연동실패", StandardCharsets.UTF_8) + "&provider=KAKAO")
                            .build();
                    }
                } else {
                    // 로그인 모드 (기존 로직)
                    // OAuth2 로그인 시 기존 세션 완전 초기화
                    SessionUtils.clearSession(session);
                    
                    // 새로운 세션 생성
                    session = request.getSession(true);
                    
                    // 세션에 사용자 정보 저장 (UserInfo를 User 엔티티로 변환, 복호화된 데이터 사용)
                    User user = new User();
                    user.setId(userInfo.getId());
                    user.setEmail(userInfo.getEmail());
                    
                    // 이름과 닉네임 복호화해서 세션에 저장
                    String decryptedName = null;
                    String decryptedNickname = null;
                    
                    try {
                        if (userInfo.getName() != null && !userInfo.getName().trim().isEmpty()) {
                            decryptedName = encryptionUtil.safeDecrypt(userInfo.getName());
                        }
                        if (userInfo.getNickname() != null && !userInfo.getNickname().trim().isEmpty()) {
                            decryptedNickname = encryptionUtil.safeDecrypt(userInfo.getNickname());
                        }
                    } catch (Exception e) {
                        log.warn("사용자 정보 복호화 실패, 원본 데이터 사용: {}", e.getMessage());
                        decryptedName = userInfo.getName();
                        decryptedNickname = userInfo.getNickname();
                    }
                    
                    user.setName(decryptedName);
                    user.setNickname(decryptedNickname);
                    user.setRole(UserRole.fromString(userInfo.getRole()));
                    user.setProfileImageUrl(userInfo.getProfileImageUrl());
                    
                    SessionUtils.setCurrentUser(session, user);
                    
                    // SpringSecurity 인증 컨텍스트에도 사용자 정보 설정
                    setSpringSecurityAuthentication(user);
                    
                    // 세션 무효화 시간 설정 (1시간)
                    session.setMaxInactiveInterval(3600);
                    
                    log.info("카카오 OAuth2 로그인 성공: userId={}, role={}, profileImage={}", 
                            user.getId(), user.getRole(), user.getProfileImageUrl());
                    
                    // 세션 정보 디버깅 로그 추가
                    log.info("세션 정보 확인: sessionId={}, userInSession={}, sessionMaxInactiveInterval={}", 
                            session.getId(), 
                            SessionUtils.getCurrentUser(session) != null ? "설정됨" : "없음",
                            session.getMaxInactiveInterval());
                    
                    // SecurityContext 확인
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    log.info("SecurityContext 설정 확인: {}", auth != null && auth.isAuthenticated() ? "성공" : "실패");
                    
                    // 사용자 역할에 따른 리다이렉트 (공통 유틸리티 사용)
                    String frontendUrl = getFrontendBaseUrl(request);
                    String redirectUrl = DashboardRedirectUtil.getDashboardUrl(user.getRole(), frontendUrl);
                    
                    // 세션 쿠키 설정을 명시적으로 추가
        return ResponseEntity.status(302)
            .header("Location", redirectUrl)
            .header("Set-Cookie", String.format("JSESSIONID=%s; Path=/; SameSite=None; Max-Age=3600; HttpOnly=false", session.getId()))
            .build();
                }
            } else if (response.isRequiresSignup()) {
                // 간편 회원가입이 필요한 경우
                log.info("카카오 OAuth2 간편 회원가입 필요: {}", response.getSocialUserInfo());
                
                // 소셜 사용자 정보를 URL 파라미터로 전달 (한글 인코딩 처리)
                String email = response.getSocialUserInfo() != null ? response.getSocialUserInfo().getEmail() : "";
                String name = response.getSocialUserInfo() != null ? response.getSocialUserInfo().getName() : "";
                String nickname = response.getSocialUserInfo() != null ? response.getSocialUserInfo().getNickname() : "";
                
                String signupUrl = frontendBaseUrl + "/login?" +
                    "signup=required" +
                    "&provider=kakao" +
                    "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8) +
                    "&name=" + URLEncoder.encode(name, StandardCharsets.UTF_8) +
                    "&nickname=" + URLEncoder.encode(nickname, StandardCharsets.UTF_8);
                
                return ResponseEntity.status(302)
                    .header("Location", signupUrl)
                    .build();
            } else {
                return ResponseEntity.status(302)
                    .header("Location", frontendBaseUrl + "/login?error=" + URLEncoder.encode(response.getMessage(), StandardCharsets.UTF_8) + "&provider=KAKAO")
                    .build();
            }
        } catch (Exception e) {
            log.error("카카오 OAuth2 콜백 처리 실패", e);
            return ResponseEntity.status(302)
                .header("Location", frontendBaseUrl + "/login?error=" + URLEncoder.encode("처리실패", StandardCharsets.UTF_8) + "&provider=KAKAO")
                .build();
        }
    }
    
    /**
     * SpringSecurity 인증 컨텍스트에 사용자 정보 설정
     * OAuth2 로그인 후 API 호출 시 인증이 유지되도록 함
     */
    private void setSpringSecurityAuthentication(User user) {
        try {
            // 사용자 권한 설정
            List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
            );
            
            // Authentication 객체 생성
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(
                    user.getEmail(), 
                    null, 
                    authorities
                );
            
            // SecurityContext에 설정
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // 세션에 SecurityContext 저장 (명시적으로)
            SecurityContext securityContext = SecurityContextHolder.getContext();
            
            log.info("🔐 SpringSecurity 인증 컨텍스트 설정 완료: email={}, role={}, authorities={}", 
                    user.getEmail(), user.getRole(), authorities);
            log.info("🔐 SecurityContext 저장됨: {}", securityContext.getAuthentication() != null);
            
        } catch (Exception e) {
            log.error("SpringSecurity 인증 컨텍스트 설정 실패: {}", e.getMessage(), e);
        }
    }
}
