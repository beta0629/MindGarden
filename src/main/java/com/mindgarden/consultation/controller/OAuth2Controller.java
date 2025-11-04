package com.mindgarden.consultation.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.mindgarden.consultation.constant.OAuth2Constants;
import com.mindgarden.consultation.dto.SocialLoginResponse;
import com.mindgarden.consultation.dto.SocialUserInfo;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.OAuth2FactoryService;
import com.mindgarden.consultation.service.OAuth2Service;
import com.mindgarden.consultation.util.DashboardRedirectUtil;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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
    private final UserRepository userRepository;
    private final com.mindgarden.consultation.service.CacheService cacheService;
    private final com.mindgarden.consultation.service.JwtService jwtService;
    
    @Value("${spring.security.oauth2.client.registration.kakao.client-id:dummy}")
    private String kakaoClientId;
    
    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri}")
    private String kakaoRedirectUri;
    
    @Value("${spring.security.oauth2.client.registration.kakao.scope:profile_nickname,account_email}")
    private String kakaoScope;
    
    @Value("${spring.security.oauth2.client.registration.naver.client-id:dummy}")
    private String naverClientId;
    
    @Value("${spring.security.oauth2.client.registration.naver.redirect-uri}")
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
            @RequestParam(required = false) String client,
            HttpServletRequest request,
            HttpSession session) {
        try {
            String state = UUID.randomUUID().toString();
            session.setAttribute("oauth2_kakao_state", state);
            
            // 모바일 클라이언트인 경우 Redis에 저장 (세션 의존성 제거)
            if ("mobile".equals(client)) {
                String cacheKey = "oauth2_kakao_client:" + state;
                cacheService.put(cacheKey, "mobile", 300); // 5분 TTL
                log.info("카카오 OAuth2 - 모바일 클라이언트 감지 (Redis 저장): state={}", state);
            }
            
            // 콜백 URL 동적 생성 (모바일 클라이언트인 경우 Host 헤더 사용)
            String callbackUrl = kakaoRedirectUri;
            if ("mobile".equals(client)) {
                // 모바일 클라이언트인 경우 요청 Host 헤더 확인
                try {
                    String requestHost = request.getHeader("Host");
                    if (requestHost != null && !requestHost.isEmpty() && !requestHost.contains("localhost")) {
                        String protocol = request.getScheme();
                        callbackUrl = protocol + "://" + requestHost + "/api/auth/kakao/callback";
                        log.info("카카오 OAuth2 - 모바일 클라이언트 동적 redirect URI: {}", callbackUrl);
                    }
                } catch (Exception e) {
                    log.warn("카카오 OAuth2 - 요청 Host 파싱 실패, 기본 redirect URI 사용", e);
                }
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
            @RequestParam(required = false) String client,
            HttpServletRequest request,
            HttpSession session) {
        try {
            String state = UUID.randomUUID().toString();
            session.setAttribute("oauth2_naver_state", state);
            
            // 모바일 클라이언트인 경우 Redis에 저장 (세션 의존성 제거)
            if ("mobile".equals(client)) {
                String cacheKey = "oauth2_naver_client:" + state;
                cacheService.put(cacheKey, "mobile", 300); // 5분 TTL
                log.info("네이버 OAuth2 - 모바일 클라이언트 감지 (Redis 저장): state={}", state);
            }
            
            // 콜백 URL 동적 생성 (모바일 클라이언트인 경우 Host 헤더 사용)
            String callbackUrl = naverRedirectUri;
            if ("mobile".equals(client)) {
                // 모바일 클라이언트인 경우 요청 Host 헤더 확인
                try {
                    String requestHost = request.getHeader("Host");
                    if (requestHost != null && !requestHost.isEmpty() && !requestHost.contains("localhost")) {
                        String protocol = request.getScheme();
                        callbackUrl = protocol + "://" + requestHost + "/api/auth/naver/callback";
                        log.info("네이버 OAuth2 - 모바일 클라이언트 동적 redirect URI: {}", callbackUrl);
                    }
                } catch (Exception e) {
                    log.warn("네이버 OAuth2 - 요청 Host 파싱 실패, 기본 redirect URI 사용", e);
                }
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
            // 모바일 클라이언트 정보를 Redis에서 조회 (state 기반)
            String savedClientType = null;
            if (state != null) {
                String cacheKey = "oauth2_naver_client:" + state;
                java.util.Optional<String> clientTypeOpt = cacheService.get(cacheKey, String.class);
                if (clientTypeOpt.isPresent()) {
                    savedClientType = clientTypeOpt.get();
                    cacheService.evict(cacheKey); // 사용 후 삭제
                    log.info("네이버 콜백 - Redis에서 모바일 클라이언트 정보 조회: clientType={}, state={}", savedClientType, state);
                } else {
                    // Redis에 없으면 세션에서도 확인 (기존 호환성)
                    savedClientType = (String) session.getAttribute("oauth2_client");
                    log.info("네이버 콜백 - Redis에서 찾지 못함, 세션에서 확인: clientType={}", savedClientType);
                }
            } else {
                // state가 없으면 세션에서 확인
                savedClientType = (String) session.getAttribute("oauth2_client");
                log.info("네이버 콜백 - state 없음, 세션에서 확인: clientType={}", savedClientType);
            }
            
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
                    
                    // 모바일 클라이언트 정보를 새 세션에 다시 저장 (중요!)
                    if (savedClientType != null) {
                        session.setAttribute("oauth2_client", savedClientType);
                        log.info("네이버 콜백 - 새 세션에 모바일 클라이언트 정보 복원: clientType={}", savedClientType);
                    }
                    
                    // 데이터베이스에서 완전한 User 객체를 가져와서 세션에 저장 (이메일 로그인과 동일)
                    User user = userRepository.findById(userInfo.getId())
                        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                    
                    // 세션에 완전한 User 객체 저장
                    SessionUtils.setCurrentUser(session, user);
                    
                    // SpringSecurity 인증 컨텍스트에도 사용자 정보 설정
                    setSpringSecurityAuthentication(user);
                    
                    // 세션에 SecurityContext 저장 (명시적으로)
                    session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
                    
                    // 세션 무효화 시간 설정 (1시간)
                    session.setMaxInactiveInterval(3600);
                    
                    log.info("네이버 OAuth2 로그인 성공: userId={}, role={}, profileImage={}, clientType={}", 
                            user.getId(), user.getRole(), user.getProfileImageUrl(), savedClientType);
                    
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
                    String baseRedirectUrl = DashboardRedirectUtil.getDashboardUrl(user.getRole(), frontendUrl);
                    
                    // provider 정보 가져오기
                    String provider = "UNKNOWN";
                    if (response.getSocialAccountInfo() != null && response.getSocialAccountInfo().getProvider() != null) {
                        provider = response.getSocialAccountInfo().getProvider();
                    }
                    
                    // 사용자 정보를 URL 파라미터로 전달 (세션 복원용)
                    String redirectUrl = baseRedirectUrl + "?" +
                        "oauth=success" +
                        "&userId=" + user.getId() +
                        "&email=" + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8) +
                        "&name=" + URLEncoder.encode(user.getName(), StandardCharsets.UTF_8) +
                        "&nickname=" + URLEncoder.encode(user.getNickname() != null ? user.getNickname() : "", StandardCharsets.UTF_8) +
                        "&role=" + user.getRole() +
                        "&profileImage=" + URLEncoder.encode(user.getProfileImageUrl() != null ? user.getProfileImageUrl() : "", StandardCharsets.UTF_8) +
                        "&provider=" + provider;
                    
                    // 모바일 클라이언트인 경우 Deep Link로 리다이렉트
                    if ("mobile".equals(savedClientType)) {
                        log.info("✅ 모바일 클라이언트로 Deep Link 리다이렉트 (네이버)");
                        
                        // 세션 ID를 Deep Link에 포함
                        String sessionId = session.getId();
                        
                        // Deep Link URL 생성
                        String deepLinkUrl = "mindgarden://oauth/callback?" +
                            "success=true" +
                            "&provider=NAVER" +
                            "&userId=" + user.getId() +
                            "&email=" + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8) +
                            "&name=" + URLEncoder.encode(user.getName(), StandardCharsets.UTF_8) +
                            "&nickname=" + URLEncoder.encode(user.getNickname() != null ? user.getNickname() : "", StandardCharsets.UTF_8) +
                            "&role=" + user.getRole() +
                            "&profileImage=" + URLEncoder.encode(user.getProfileImageUrl() != null ? user.getProfileImageUrl() : "", StandardCharsets.UTF_8) +
                            "&sessionId=" + sessionId;
                        
                        // HTML 페이지 생성 (Deep Link 열기)
                        String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
                            "<title>로그인 처리 중...</title>" +
                            "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                            "<style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f5f5f5;}" +
                            "h1{color:#333;}</style>" +
                            "</head><body>" +
                            "<h1>로그인 처리 중...</h1>" +
                            "<p>잠시 후 앱으로 이동합니다.</p>" +
                            "<script>" +
                            "setTimeout(function(){" +
                            "  var deepLink = '" + deepLinkUrl.replace("'", "\\'") + "';" +
                            "  window.location.href = deepLink;" +
                            "  setTimeout(function(){window.location.href='intent://oauth/callback?success=true&provider=NAVER#Intent;scheme=mindgarden;package=com.mindgardenmobile;end';}, 500);" +
                            "}, 1000);" +
                            "</script>" +
                            "</body></html>";
                        
                        return ResponseEntity.ok()
                            .header("Content-Type", "text/html; charset=UTF-8")
                            .body(html);
                    }
                    
                    // 웹 클라이언트인 경우 기존 로직 사용
                    // 세션 쿠키를 프론트엔드로 전달하기 위해 쿠키에 세션 ID를 포함
                    // 프론트엔드에서 이 쿠키를 사용하여 세션을 복원
                    String sessionId = session.getId();
                    String cookieValue = String.format("JSESSIONID=%s; Path=/; SameSite=None; Max-Age=3600; Secure; HttpOnly=false", sessionId);
                    
                    log.info("세션 쿠키 설정: {}", cookieValue);
                    log.info("리다이렉트 URL: {}", redirectUrl);
                    
        return ResponseEntity.status(302)
            .header("Location", redirectUrl)
            .header("Set-Cookie", cookieValue)
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
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302)
                .header("Location", frontendUrl + "/login?error=" + URLEncoder.encode(error, StandardCharsets.UTF_8) + "&provider=KAKAO")
                .build();
        }
        
        if (code == null) {
            log.warn("카카오 OAuth2 콜백에서 인증 코드가 없습니다. error={}, state={}", error, state);
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302)
                .header("Location", frontendUrl + "/login?error=" + URLEncoder.encode("인증코드없음", StandardCharsets.UTF_8) + "&provider=KAKAO")
                .build();
        }
        
        String savedState = (String) session.getAttribute("oauth2_kakao_state");
        if (savedState != null && !savedState.equals(state)) {
            session.removeAttribute("oauth2_kakao_state");
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302)
                .header("Location", frontendUrl + "/login?error=" + URLEncoder.encode("보안검증실패", StandardCharsets.UTF_8) + "&provider=KAKAO")
                .build();
        }
        
        if (savedState != null) {
            session.removeAttribute("oauth2_kakao_state");
        }
        
        try {
            // 모바일 클라이언트 정보를 Redis에서 조회 (state 기반)
            String savedClientType = null;
            if (state != null) {
                String cacheKey = "oauth2_kakao_client:" + state;
                java.util.Optional<String> clientTypeOpt = cacheService.get(cacheKey, String.class);
                if (clientTypeOpt.isPresent()) {
                    savedClientType = clientTypeOpt.get();
                    cacheService.evict(cacheKey); // 사용 후 삭제
                    log.info("카카오 콜백 - Redis에서 모바일 클라이언트 정보 조회: clientType={}, state={}", savedClientType, state);
                } else {
                    // Redis에 없으면 세션에서도 확인 (기존 호환성)
                    savedClientType = (String) session.getAttribute("oauth2_client");
                    log.info("카카오 콜백 - Redis에서 찾지 못함, 세션에서 확인: clientType={}", savedClientType);
                }
            } else {
                // state가 없으면 세션에서 확인
                savedClientType = (String) session.getAttribute("oauth2_client");
                log.info("카카오 콜백 - state 없음, 세션에서 확인: clientType={}", savedClientType);
            }
            
            // 동적 redirectUri 계산 (모바일 클라이언트인 경우)
            String actualRedirectUri = kakaoRedirectUri;
            if ("mobile".equals(savedClientType)) {
                try {
                    String requestHost = request.getHeader("Host");
                    if (requestHost != null && !requestHost.isEmpty() && !requestHost.contains("localhost")) {
                        String protocol = request.getScheme();
                        actualRedirectUri = protocol + "://" + requestHost + "/api/auth/kakao/callback";
                        log.info("카카오 콜백 - 모바일 클라이언트 동적 redirect URI: {}", actualRedirectUri);
                    }
                } catch (Exception e) {
                    log.warn("카카오 콜백 - 요청 Host 파싱 실패, 기본 redirect URI 사용", e);
                }
            }
            
            // redirectUri를 전달하여 인증 처리
            OAuth2Service kakaoService = oauth2FactoryService.getOAuth2Service("KAKAO");
            SocialLoginResponse response;
            if (kakaoService instanceof com.mindgarden.consultation.service.impl.KakaoOAuth2ServiceImpl) {
                com.mindgarden.consultation.service.impl.KakaoOAuth2ServiceImpl kakaoServiceImpl = 
                    (com.mindgarden.consultation.service.impl.KakaoOAuth2ServiceImpl) kakaoService;
                // redirectUri를 전달하여 액세스 토큰 획득
                String accessToken = kakaoServiceImpl.getAccessToken(code, actualRedirectUri);
                // AbstractOAuth2Service의 authenticateWithCode를 사용하되, 
                // getAccessToken이 이미 호출되었으므로 재호출되지 않도록 처리
                // 하지만 AbstractOAuth2Service.authenticateWithCode는 getAccessToken(code)를 다시 호출하므로
                // 직접 인증 처리 로직을 구현해야 함
                com.mindgarden.consultation.dto.SocialUserInfo socialUserInfo = kakaoServiceImpl.getUserInfo(accessToken);
                socialUserInfo.setProvider("KAKAO");
                socialUserInfo.setAccessToken(accessToken);
                socialUserInfo.normalizeData();
                
                // 기존 사용자 확인
                Long existingUserId = kakaoServiceImpl.findExistingUserByProviderId(socialUserInfo.getProviderUserId());
                if (existingUserId == null) {
                    var userOptional = userRepository.findByEmail(socialUserInfo.getEmail());
                    existingUserId = userOptional.map(User::getId).orElse(null);
                }
                
                if (existingUserId == null) {
                    response = SocialLoginResponse.builder()
                        .success(false)
                        .message("간편 회원가입이 필요합니다.")
                        .requiresSignup(true)
                        .socialUserInfo(socialUserInfo)
                        .build();
                } else {
                    User user = userRepository.findById(existingUserId)
                        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                    
                    // JWT 토큰 생성
                    String jwtToken = jwtService.generateToken(user.getEmail());
                    String refreshToken = jwtService.generateRefreshToken(user.getEmail());
                    
                    // 프로필 이미지 결정
                    String finalProfileImageUrl = user.getProfileImageUrl() != null && !user.getProfileImageUrl().trim().isEmpty()
                        ? user.getProfileImageUrl()
                        : (socialUserInfo.getProfileImageUrl() != null && !socialUserInfo.getProfileImageUrl().trim().isEmpty()
                            ? socialUserInfo.getProfileImageUrl()
                            : "/default-avatar.svg");
                    
                    response = SocialLoginResponse.builder()
                        .success(true)
                        .message("카카오 계정으로 로그인되었습니다.")
                        .accessToken(jwtToken)
                        .refreshToken(refreshToken)
                        .userInfo(SocialLoginResponse.UserInfo.builder()
                            .id(user.getId())
                            .email(user.getEmail())
                            .name(user.getName())
                            .nickname(user.getNickname())
                            .role(user.getRole().getValue())
                            .profileImageUrl(finalProfileImageUrl)
                            .build())
                        .build();
                }
            } else {
                response = oauth2FactoryService.authenticateWithProvider("KAKAO", code);
            }
            
            if (response.isSuccess()) {
                // SocialLoginResponse에서 이미 완성된 UserInfo 사용 (공통 SNS 처리 로직 활용)
                SocialLoginResponse.UserInfo userInfo = response.getUserInfo();
                
                // 계정 연동 모드인지 확인
                if ("link".equals(mode)) {
                    // 기존 로그인된 사용자의 세션 확인
                    User currentUser = SessionUtils.getCurrentUser(session);
                    if (currentUser == null) {
                        log.error("계정 연동 모드에서 세션 사용자를 찾을 수 없음");
                        String frontendUrl = getFrontendBaseUrl(request);
                        return ResponseEntity.status(302)
                            .header("Location", frontendUrl + "/mypage?error=" + URLEncoder.encode("세션만료", StandardCharsets.UTF_8) + "&provider=KAKAO")
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
                        
                        String frontendUrl = getFrontendBaseUrl(request);
                        return ResponseEntity.status(302)
                            .header("Location", frontendUrl + "/mypage?success=" + URLEncoder.encode("연동완료", StandardCharsets.UTF_8) + "&provider=KAKAO")
                            .build();
                    } catch (Exception e) {
                        log.error("카카오 계정 연동 실패", e);
                        String frontendUrl = getFrontendBaseUrl(request);
                        return ResponseEntity.status(302)
                            .header("Location", frontendUrl + "/mypage?error=" + URLEncoder.encode("연동실패", StandardCharsets.UTF_8) + "&provider=KAKAO")
                            .build();
                    }
                } else {
                    // 로그인 모드 (기존 로직)
                    // OAuth2 로그인 시 기존 세션 완전 초기화
                    SessionUtils.clearSession(session);
                    
                    // 새로운 세션 생성
                    session = request.getSession(true);
                    
                    // 모바일 클라이언트 정보를 새 세션에 다시 저장 (중요!)
                    if (savedClientType != null) {
                        session.setAttribute("oauth2_client", savedClientType);
                        log.info("카카오 콜백 - 새 세션에 모바일 클라이언트 정보 복원: clientType={}", savedClientType);
                    }
                    
                    // 데이터베이스에서 완전한 User 객체를 가져와서 세션에 저장 (이메일 로그인과 동일)
                    User user = userRepository.findById(userInfo.getId())
                        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                    
                    // 세션에 완전한 User 객체 저장
                    SessionUtils.setCurrentUser(session, user);
                    
                    // SpringSecurity 인증 컨텍스트에도 사용자 정보 설정
                    setSpringSecurityAuthentication(user);
                    
                    // 세션에 SecurityContext 저장 (명시적으로)
                    session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
                    
                    // 세션 무효화 시간 설정 (1시간)
                    session.setMaxInactiveInterval(3600);
                    
                    log.info("카카오 OAuth2 로그인 성공: userId={}, role={}, profileImage={}, clientType={}", 
                            user.getId(), user.getRole(), user.getProfileImageUrl(), savedClientType);
                    
                    // 세션 정보 디버깅 로그 추가
                    log.info("세션 정보 확인: sessionId={}, userInSession={}, sessionMaxInactiveInterval={}", 
                            session.getId(), 
                            SessionUtils.getCurrentUser(session) != null ? "설정됨" : "없음",
                            session.getMaxInactiveInterval());
                    
                    // SecurityContext 확인
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    log.info("SecurityContext 설정 확인: {}", auth != null && auth.isAuthenticated() ? "성공" : "실패");
                    
                    // 모바일 클라이언트인 경우 Deep Link로 리다이렉트
                    if ("mobile".equals(savedClientType)) {
                        log.info("✅ 모바일 클라이언트로 Deep Link 리다이렉트 (카카오)");
                        
                        // 세션 ID를 Deep Link에 포함
                        String sessionId = session.getId();
                        
                        // Deep Link URL 생성
                        String deepLinkUrl = "mindgarden://oauth/callback?" +
                            "success=true" +
                            "&provider=KAKAO" +
                            "&userId=" + user.getId() +
                            "&email=" + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8) +
                            "&name=" + URLEncoder.encode(user.getName(), StandardCharsets.UTF_8) +
                            "&nickname=" + URLEncoder.encode(user.getNickname() != null ? user.getNickname() : "", StandardCharsets.UTF_8) +
                            "&role=" + user.getRole() +
                            "&profileImage=" + URLEncoder.encode(user.getProfileImageUrl() != null ? user.getProfileImageUrl() : "", StandardCharsets.UTF_8) +
                            "&sessionId=" + sessionId;
                        
                        // HTML 페이지 생성 (Deep Link 열기)
                        String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
                            "<title>로그인 처리 중...</title>" +
                            "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                            "<style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f5f5f5;}" +
                            "h1{color:#333;}</style>" +
                            "</head><body>" +
                            "<h1>로그인 처리 중...</h1>" +
                            "<p>잠시 후 앱으로 이동합니다.</p>" +
                            "<script>" +
                            "setTimeout(function(){" +
                            "  var deepLink = '" + deepLinkUrl.replace("'", "\\'") + "';" +
                            "  window.location.href = deepLink;" +
                            "  setTimeout(function(){window.location.href='intent://oauth/callback?success=true&provider=KAKAO#Intent;scheme=mindgarden;package=com.mindgardenmobile;end';}, 500);" +
                            "}, 1000);" +
                            "</script>" +
                            "</body></html>";
                        
                        return ResponseEntity.ok()
                            .header("Content-Type", "text/html; charset=UTF-8")
                            .body(html);
                    }
                    
                    // 웹 클라이언트인 경우 기존 로직 사용
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
                
                String frontendUrl = getFrontendBaseUrl(request);
                String signupUrl = frontendUrl + "/login?" +
                    "signup=required" +
                    "&provider=kakao" +
                    "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8) +
                    "&name=" + URLEncoder.encode(name, StandardCharsets.UTF_8) +
                    "&nickname=" + URLEncoder.encode(nickname, StandardCharsets.UTF_8);
                
                return ResponseEntity.status(302)
                    .header("Location", signupUrl)
                    .build();
            } else {
                String frontendUrl = getFrontendBaseUrl(request);
                return ResponseEntity.status(302)
                    .header("Location", frontendUrl + "/login?error=" + URLEncoder.encode(response.getMessage(), StandardCharsets.UTF_8) + "&provider=KAKAO")
                    .build();
            }
        } catch (Exception e) {
            log.error("카카오 OAuth2 콜백 처리 실패", e);
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302)
                .header("Location", frontendUrl + "/login?error=" + URLEncoder.encode("처리실패", StandardCharsets.UTF_8) + "&provider=KAKAO")
                .build();
        }
    }
    
    /**
     * 모바일 OAuth2 콜백 처리 (Deep Link에서 받은 정보로 세션 복원)
     * POST /api/auth/oauth2/callback
     * Deep Link에서 받은 userId로 사용자 정보 조회 및 세션 설정
     */
    @PostMapping("/oauth2/callback")
    public ResponseEntity<?> mobileOAuth2Callback(
            @RequestBody Map<String, Object> requestBody,
            HttpServletRequest request,
            HttpSession session) {
        try {
            String provider = (String) requestBody.get("provider");
            String sessionId = (String) requestBody.get("sessionId"); // Deep Link에서 받은 세션 ID
            String userIdStr = (String) requestBody.get("userId"); // Deep Link에서 받은 userId
            
            log.info("모바일 OAuth2 콜백 요청: provider={}, sessionId={}, userId={}", 
                    provider, sessionId != null ? "있음" : "없음", userIdStr);
            
            // userId로 사용자 정보 조회
            if (userIdStr == null || userIdStr.isEmpty()) {
                log.error("모바일 OAuth2 콜백 - userId가 없습니다.");
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "사용자 ID가 필요합니다."
                ));
            }
            
            Long userId;
            try {
                userId = Long.parseLong(userIdStr);
            } catch (NumberFormatException e) {
                log.error("모바일 OAuth2 콜백 - userId 파싱 실패: {}", userIdStr);
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "잘못된 사용자 ID입니다."
                ));
            }
            
            // 사용자 정보 조회
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: userId=" + userId));
            
            // 세션 생성 또는 기존 세션 사용
            if (sessionId != null && !sessionId.isEmpty()) {
                // 기존 세션 ID가 있으면 해당 세션 사용 시도
                try {
                    HttpSession existingSession = request.getSession(false);
                    if (existingSession != null && existingSession.getId().equals(sessionId)) {
                        session = existingSession;
                        log.info("모바일 OAuth2 콜백 - 기존 세션 사용: sessionId={}", sessionId);
                    } else {
                        // 세션 ID가 일치하지 않으면 새 세션 생성
                        session = request.getSession(true);
                        log.info("모바일 OAuth2 콜백 - 새 세션 생성 (기존 세션 ID 불일치): sessionId={}", session.getId());
                    }
                } catch (Exception e) {
                    // 기존 세션 조회 실패 시 새 세션 생성
                    session = request.getSession(true);
                    log.info("모바일 OAuth2 콜백 - 새 세션 생성 (기존 세션 조회 실패): sessionId={}", session.getId());
                }
            } else {
                // 세션 ID가 없으면 새 세션 생성
                session = request.getSession(true);
                log.info("모바일 OAuth2 콜백 - 새 세션 생성: sessionId={}", session.getId());
            }
            
            // 세션에 사용자 정보 저장
            SessionUtils.setCurrentUser(session, user);
            
            // SpringSecurity 인증 컨텍스트 설정
            setSpringSecurityAuthentication(user);
            
            // 세션에 SecurityContext 저장
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
            
            // 세션 무효화 시간 설정 (1시간)
            session.setMaxInactiveInterval(3600);
            
            log.info("모바일 OAuth2 콜백 - 세션 설정 완료: userId={}, role={}, sessionId={}", 
                    user.getId(), user.getRole(), session.getId());
            
            // 사용자 정보 반환
            Map<String, Object> userInfo = Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName() != null ? user.getName() : "",
                "nickname", user.getNickname() != null ? user.getNickname() : "",
                "role", user.getRole().name(),
                "profileImageUrl", user.getProfileImageUrl() != null ? user.getProfileImageUrl() : ""
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "sessionId", session.getId(),
                "user", userInfo,
                "message", "로그인 성공"
            ));
            
        } catch (Exception e) {
            log.error("모바일 OAuth2 콜백 처리 실패", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "예상치 못한 오류가 발생했습니다.",
                "error", e.getMessage()
            ));
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
