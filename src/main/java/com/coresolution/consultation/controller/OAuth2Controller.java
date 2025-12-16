package com.coresolution.consultation.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.coresolution.consultation.constant.OAuth2Constants;
import com.coresolution.consultation.dto.SocialLoginResponse;
import com.coresolution.consultation.dto.SocialUserInfo;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.OAuth2FactoryService;
import com.coresolution.consultation.service.OAuth2Service;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.DashboardRedirectUtil;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"}) // 표준화 2025-12-05: 레거시 경로도 지원 (OAuth 콜백 호환성)
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OAuth2Controller extends BaseApiController {

    private final OAuth2FactoryService oauth2FactoryService;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final OAuth2DomainUtil oauth2DomainUtil;
    private final UserRepository userRepository;
    private final com.coresolution.consultation.service.JwtService jwtService;
    private final com.coresolution.consultation.service.DynamicPermissionService dynamicPermissionService;
    private final UserSessionService userSessionService;
    private final com.coresolution.core.repository.TenantRepository tenantRepository;

    @Value("${spring.security.oauth2.client.registration.kakao.client-id:${security.oauth2.client.registration.kakao.client-id:cbb457cfb5f9351fd495be4af2b11a34}}")
    private String kakaoClientId;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri:${KAKAO_REDIRECT_URI:}}")
    private String kakaoRedirectUri;

    @Value("${spring.security.oauth2.client.registration.kakao.scope:profile_nickname,account_email}")
    private String kakaoScope;

    @Value("${spring.security.oauth2.client.registration.naver.client-id:${security.oauth2.client.registration.naver.client-id:vTKNlxYKIfo1uCCXaDfk}}")
    private String naverClientId;

    @Value("${spring.security.oauth2.client.registration.naver.redirect-uri:${NAVER_REDIRECT_URI:}}")
    private String naverRedirectUri;

    @Value("${spring.security.oauth2.client.registration.naver.scope:name,email}")
    private String naverScope;

    @Value("${spring.security.oauth2.client.callback.kakao-path:/api/auth/kakao/callback}")
    private String kakaoCallbackPath;

    @Value("${spring.security.oauth2.client.callback.naver-path:/api/auth/naver/callback}")
    private String naverCallbackPath;

    @Value("${spring.security.oauth2.domain.naver-callback-domain:dev.core-solution.co.kr}")
    private String naverCallbackDomain;

    @Value("${spring.security.oauth2.domain.naver-registered-urls:https://dev.core-solution.co.kr/api/auth/naver/callback}")
    private String naverRegisteredUrls;

    @Value("${frontend.base-url:${FRONTEND_BASE_URL:}}")
    private String frontendBaseUrl;

    @PostConstruct
    public void init() {
        log.info("🔧 OAuth2Controller 초기화 - frontendBaseUrl: {}", frontendBaseUrl);
    }

    /**
     * 프론트엔드 URL 동적 감지 우선순위: 1. 요청의 Host 헤더 (서브도메인 지원) 2. Referer 헤더 3. 프로퍼티/환경변수
     */
    private String getFrontendBaseUrl(HttpServletRequest request) {
        // 1. 요청의 Host 헤더를 우선 사용 (서브도메인 지원)
        try {
            String requestScheme = request.getHeader("X-Forwarded-Proto");
            if (requestScheme == null || requestScheme.isEmpty()) {
                requestScheme = request.getScheme();
            }

            String requestHost = request.getHeader("X-Forwarded-Host");
            if (requestHost == null || requestHost.isEmpty()) {
                requestHost = request.getHeader("Host");
            }
            if (requestHost == null || requestHost.isEmpty()) {
                requestHost = request.getServerName();
                int port = request.getServerPort();
                if (port != 80 && port != 443) {
                    requestHost = requestHost + ":" + port;
                }
            }

            // 포트 제거 (프론트엔드 URL에는 포트가 필요 없음)
            String hostWithoutPort = requestHost.split(":")[0];

            if (hostWithoutPort != null && !hostWithoutPort.isEmpty()) {
                String dynamicUrl = requestScheme + "://" + hostWithoutPort;
                log.info("프론트엔드 URL (요청 Host 기반): {}", dynamicUrl);
                return dynamicUrl;
            }
        } catch (Exception e) {
            log.warn("요청 Host 기반 프론트엔드 URL 생성 실패", e);
        }

        // 2. Referer 헤더 확인
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
                    log.info("프론트엔드 URL (Referer 기반): {}", frontendUrl);
                    return frontendUrl;
                }
            } catch (Exception e) {
                log.warn("Referer URL 파싱 실패: {}", referer, e);
            }
        }

        // 3. 프로퍼티 값 사용
        if (frontendBaseUrl != null && !frontendBaseUrl.trim().isEmpty()) {
            log.info("프론트엔드 URL (프로퍼티): {}", frontendBaseUrl);
            return frontendBaseUrl;
        }

        // 4. 환경변수 확인
        String envFrontendUrl = System.getenv("FRONTEND_BASE_URL");
        if (envFrontendUrl != null && !envFrontendUrl.trim().isEmpty()) {
            log.info("프론트엔드 URL (환경변수): {}", envFrontendUrl);
            return envFrontendUrl;
        }

        // 5. 기본값 사용
        String defaultUrl = "https://dev.core-solution.co.kr";
        log.warn("프론트엔드 URL을 동적으로 생성할 수 없어 기본값 사용: {}", defaultUrl);
        return defaultUrl;
    }

    @GetMapping("/oauth2/kakao/authorize")
    public ResponseEntity<?> kakaoAuthorize(@RequestParam(required = false) String mode,
            @RequestParam(required = false) String client, HttpServletRequest request,
            HttpSession session) {
        try {
            String state = UUID.randomUUID().toString();
            session.setAttribute("oauth2_kakao_state", state);

            // 서브도메인에서 tenant_id 추출하여 세션에 저장 (SNS 로그인 시 사용)
            String tenantId = extractTenantIdFromSubdomain(request);
            if (tenantId != null && !tenantId.isEmpty()) {
                session.setAttribute("oauth2_tenant_id", tenantId);
                log.info("카카오 OAuth2 - 서브도메인에서 tenant_id 추출: tenantId={}", tenantId);
            }

            // 모바일 클라이언트인 경우 Redis에 저장 (세션 의존성 제거)
            if ("mobile".equals(client)) {
                String cacheKey = "oauth2_kakao_client:" + state;
                // cacheService.put(cacheKey, "mobile", 300); // 5분 TTL - 캐시 서비스 임시 비활성화
                log.info("카카오 OAuth2 - 모바일 클라이언트 감지 (Redis 저장): state={}", state);
            }

            // 콜백 URL 동적 생성 (서브도메인은 메인 도메인으로 변환 - 카카오 개발자 센터 등록 문제 해결)
            String callbackUrl = null;
            try {
                // 프록시 헤더 확인 (X-Forwarded-Proto, X-Forwarded-Host)
                // Nginx를 통해 들어온 요청은 X-Forwarded-Host를 우선 확인
                String requestScheme = request.getHeader("X-Forwarded-Proto");
                if (requestScheme == null || requestScheme.isEmpty()) {
                    requestScheme = request.getScheme();
                }

                // X-Forwarded-Host 우선 확인 (Nginx를 통해 들어온 요청)
                String requestHost = request.getHeader("X-Forwarded-Host");
                if (requestHost == null || requestHost.isEmpty()) {
                    // X-Forwarded-Host가 없으면 Host 헤더 확인
                    requestHost = request.getHeader("Host");
                }

                // 로컬 환경에서 프론트엔드 프록시를 통해 온 경우 처리
                if (requestHost != null && requestHost.contains("localhost")
                        && !requestHost.contains(":8080")) {
                    // 프론트엔드(localhost:3000)에서 프록시로 온 경우, 실제 백엔드 주소 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                } else if (requestHost == null || requestHost.isEmpty()) {
                    // Host 헤더도 없으면 서버 정보 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                }

                // 서브도메인을 메인 도메인으로 변환 (설정 파일 기반)
                if (requestHost != null && !requestHost.isEmpty()) {
                    String hostWithoutPort = requestHost.split(":")[0];
                    String mainDomain = oauth2DomainUtil.convertToMainDomain(hostWithoutPort);

                    // 포트 처리
                    String portSuffix = "";
                    if (requestHost.contains(":")) {
                        String port = requestHost.split(":")[1];
                        if (!port.equals("80") && !port.equals("443")) {
                            portSuffix = ":" + port;
                        }
                    } else {
                        // 프록시를 통해 들어온 경우 포트는 헤더에서 확인
                        String forwardedPort = request.getHeader("X-Forwarded-Port");
                        if (forwardedPort != null && !forwardedPort.isEmpty()) {
                            int port = Integer.parseInt(forwardedPort);
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        } else {
                            int port = request.getServerPort();
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        }
                    }

                    callbackUrl =
                            requestScheme + "://" + mainDomain + portSuffix + kakaoCallbackPath;
                    log.info(
                            "카카오 OAuth2 - 동적 redirect URI 생성: {} (원본 host={}, scheme={}, forwardedProto={}, forwardedHost={})",
                            callbackUrl, requestHost, request.getScheme(),
                            request.getHeader("X-Forwarded-Proto"),
                            request.getHeader("X-Forwarded-Host"));
                }
            } catch (Exception e) {
                log.error("카카오 OAuth2 - redirect URI 동적 생성 실패", e);
            }

            if (callbackUrl == null || callbackUrl.isEmpty()) {
                // 폴백: 설정값 사용
                callbackUrl = kakaoRedirectUri;
                log.warn("카카오 OAuth2 - 동적 생성 실패, 설정값 사용: {}", callbackUrl);
            }

            String authUrl = "https://kauth.kakao.com/oauth/authorize?" + "client_id="
                    + kakaoClientId + "&redirect_uri="
                    + URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8) + "&response_type=code"
                    + "&scope=" + kakaoScope + "&state=" + state;

            Map<String, Object> data = new HashMap<>();
            data.put("authUrl", authUrl);
            data.put("provider", "KAKAO");
            data.put("state", state);

            return success(data);
        } catch (Exception e) {
            log.error("카카오 OAuth2 인증 URL 생성 실패", e);
            throw new RuntimeException("카카오 OAuth2 인증 URL 생성에 실패했습니다: " + e.getMessage());
        }
    }

    @GetMapping("/oauth2/naver/authorize")
    public ResponseEntity<?> naverAuthorize(@RequestParam(required = false) String mode,
            @RequestParam(required = false) String client, HttpServletRequest request,
            HttpSession session) {
        try {
            String state = UUID.randomUUID().toString();
            session.setAttribute("oauth2_naver_state", state);
            // 네이버 인증 URL 생성 시 사용한 redirect_uri를 세션에 저장 (콜백에서 일치 여부 확인용)

            // 서브도메인에서 tenant_id 추출하여 세션에 저장 (SNS 로그인 시 사용)
            String tenantId = extractTenantIdFromSubdomain(request);
            if (tenantId != null && !tenantId.isEmpty()) {
                session.setAttribute("oauth2_tenant_id", tenantId);
                // state와 함께 tenantId도 세션에 저장 (콜백에서 state로 조회 가능하도록)
                session.setAttribute("oauth2_naver_tenant_id_" + state, tenantId);
                log.info("네이버 OAuth2 - 서브도메인에서 tenant_id 추출: tenantId={}, state={}", tenantId,
                        state);
            }

            // 모바일 클라이언트인 경우 Redis에 저장 (세션 의존성 제거)
            if ("mobile".equals(client)) {
                String cacheKey = "oauth2_naver_client:" + state;
                // cacheService.put(cacheKey, "mobile", 300); // 5분 TTL - 캐시 서비스 임시 비활성화
                log.info("네이버 OAuth2 - 모바일 클라이언트 감지 (Redis 저장): state={}", state);
            }

            // 콜백 URL 동적 생성 (서브도메인은 메인 도메인으로 변환 - 카카오와 동일한 로직)
            String callbackUrl = null;
            try {
                // 프록시 헤더 확인 (X-Forwarded-Proto, X-Forwarded-Host)
                // Nginx를 통해 들어온 요청은 X-Forwarded-Host를 우선 확인
                String requestScheme = request.getHeader("X-Forwarded-Proto");
                if (requestScheme == null || requestScheme.isEmpty()) {
                    requestScheme = request.getScheme();
                }

                // X-Forwarded-Host 우선 확인 (Nginx를 통해 들어온 요청)
                String requestHost = request.getHeader("X-Forwarded-Host");
                if (requestHost == null || requestHost.isEmpty()) {
                    // X-Forwarded-Host가 없으면 Host 헤더 확인
                    requestHost = request.getHeader("Host");
                }

                // 로컬 환경에서 프론트엔드 프록시를 통해 온 경우 처리
                if (requestHost != null && requestHost.contains("localhost")
                        && !requestHost.contains(":8080")) {
                    // 프론트엔드(localhost:3000)에서 프록시로 온 경우, 실제 백엔드 주소 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                } else if (requestHost == null || requestHost.isEmpty()) {
                    // Host 헤더도 없으면 서버 정보 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                }

                // 서브도메인을 메인 도메인으로 변환 (설정 파일 기반, 카카오와 동일)
                if (requestHost != null && !requestHost.isEmpty()) {
                    String hostWithoutPort = requestHost.split(":")[0];
                    String mainDomain = oauth2DomainUtil.convertToMainDomain(hostWithoutPort);

                    // 포트 처리
                    String portSuffix = "";
                    if (requestHost.contains(":")) {
                        String port = requestHost.split(":")[1];
                        if (!port.equals("80") && !port.equals("443")) {
                            portSuffix = ":" + port;
                        }
                    } else {
                        // 프록시를 통해 들어온 경우 포트는 헤더에서 확인
                        String forwardedPort = request.getHeader("X-Forwarded-Port");
                        if (forwardedPort != null && !forwardedPort.isEmpty()) {
                            int port = Integer.parseInt(forwardedPort);
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        } else {
                            int port = request.getServerPort();
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        }
                    }

                    callbackUrl =
                            requestScheme + "://" + mainDomain + portSuffix + naverCallbackPath;
                    log.info(
                            "네이버 OAuth2 - 동적 redirect URI 생성: {} (원본 host={}, scheme={}, forwardedProto={}, forwardedHost={})",
                            callbackUrl, requestHost, request.getScheme(),
                            request.getHeader("X-Forwarded-Proto"),
                            request.getHeader("X-Forwarded-Host"));
                }
            } catch (Exception e) {
                log.error("네이버 OAuth2 - redirect URI 동적 생성 실패", e);
            }

            if (callbackUrl == null || callbackUrl.isEmpty()) {
                // 폴백: 설정값 사용
                callbackUrl = naverRedirectUri;
                log.warn("네이버 OAuth2 - 동적 생성 실패, 설정값 사용: {}", callbackUrl);
            }

            log.info("네이버 OAuth2 인증 URL 생성: client_id={}, redirect_uri={}, state={}", naverClientId,
                    callbackUrl, state);

            // 네이버 인증 URL 생성 시 사용한 redirect_uri를 세션에 저장 (콜백에서 일치 여부 확인용)
            session.setAttribute("oauth2_naver_redirect_uri", callbackUrl);
            log.info("네이버 OAuth2 - 세션에 redirect_uri 저장: {}", callbackUrl);

            String authUrl = "https://nid.naver.com/oauth2.0/authorize?" + "response_type=code"
                    + "&client_id=" + naverClientId + "&redirect_uri="
                    + URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8) + "&state=" + state
                    + "&scope=" + naverScope;

            Map<String, Object> data = new HashMap<>();
            data.put("authUrl", authUrl);
            data.put("provider", "NAVER");
            data.put("state", state);

            return success(data);
        } catch (Exception e) {
            log.error("네이버 OAuth2 인증 URL 생성 실패", e);
            throw new RuntimeException("네이버 OAuth2 인증 URL 생성에 실패했습니다: " + e.getMessage());
        }
    }

    @GetMapping("/naver/callback")
    public ResponseEntity<?> naverCallback(@RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String mode, // 'login' 또는 'link'
            HttpServletRequest request, HttpSession session) {

        if (error != null) {
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302)
                    .header("Location", frontendUrl + "/login?error="
                            + URLEncoder.encode(error, StandardCharsets.UTF_8) + "&provider=NAVER")
                    .build();
        }

        if (code == null) {
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode("인증코드없음", StandardCharsets.UTF_8) + "&provider=NAVER")
                    .build();
        }

        String savedState = (String) session.getAttribute("oauth2_naver_state");
        log.info("네이버 OAuth2 콜백 - state 검증: savedState={}, state={}, sessionId={}",
                savedState, state, session.getId());
        if (savedState != null && !savedState.equals(state)) {
            session.removeAttribute("oauth2_naver_state");
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode("보안검증실패", StandardCharsets.UTF_8) + "&provider=NAVER")
                    .build();
        }

        // state로 저장된 tenantId 조회 (authorize 시 저장한 값)
        String stateBasedTenantId = null;
        if (state != null) {
            // savedState가 null이어도 state로 직접 조회 시도 (세션이 달라도 state는 동일)
            String tenantIdKey = "oauth2_naver_tenant_id_" + state;
            stateBasedTenantId = (String) session.getAttribute(tenantIdKey);
            log.info("네이버 OAuth2 콜백 - state로 tenant_id 조회 시도: state={}, tenantIdKey={}, found={}, sessionId={}",
                    state, tenantIdKey, stateBasedTenantId != null, session.getId());
            if (stateBasedTenantId != null && !stateBasedTenantId.isEmpty()) {
                log.info("네이버 OAuth2 콜백 - state로 tenant_id 조회 성공: tenantId={}, state={}",
                        stateBasedTenantId, state);
                session.removeAttribute(tenantIdKey); // 사용 후 제거
            } else {
                log.warn("⚠️ 네이버 OAuth2 콜백 - state로 tenant_id를 찾지 못함: state={}, sessionId={}",
                        state, session.getId());
            }
        }

        if (savedState != null) {
            session.removeAttribute("oauth2_naver_state");
        }

        try {
            // 서브도메인에서 tenant_id 추출하여 TenantContextHolder에 설정 (OAuth 콜백 처리 전 필수)
            String callbackTenantId = extractTenantIdFromSubdomain(request);
            if (callbackTenantId != null && !callbackTenantId.isEmpty()) {
                com.coresolution.core.context.TenantContextHolder.setTenantId(callbackTenantId);
                log.info(
                        "네이버 OAuth2 콜백 - 서브도메인에서 tenant_id 추출 및 TenantContextHolder 설정: tenantId={}",
                        callbackTenantId);
            } else if (stateBasedTenantId != null && !stateBasedTenantId.isEmpty()) {
                // state로 조회한 tenantId 사용
                com.coresolution.core.context.TenantContextHolder.setTenantId(stateBasedTenantId);
                log.info(
                        "네이버 OAuth2 콜백 - state로 조회한 tenant_id를 TenantContextHolder에 설정: tenantId={}",
                        stateBasedTenantId);
            } else {
                // 서브도메인이 없으면 세션에서 tenant_id 확인 (카카오와 동일하게 tenantId 우선 확인)
                String sessionTenantId = (String) session.getAttribute("tenantId");
                if (sessionTenantId == null || sessionTenantId.isEmpty()) {
                    sessionTenantId = (String) session.getAttribute("oauth2_tenant_id");
                }
                if (sessionTenantId != null && !sessionTenantId.isEmpty()) {
                    com.coresolution.core.context.TenantContextHolder.setTenantId(sessionTenantId);
                    log.info(
                            "네이버 OAuth2 콜백 - 세션에서 tenant_id 추출 및 TenantContextHolder 설정: tenantId={}",
                            sessionTenantId);
                } else {
                    log.warn("⚠️ 네이버 OAuth2 콜백 - tenant_id를 찾을 수 없습니다. 서브도메인 또는 세션에서 확인 필요");
                }
            }

            // 모바일 클라이언트 정보를 Redis에서 조회 (state 기반)
            String savedClientType = null;
            if (state != null) {
                String cacheKey = "oauth2_naver_client:" + state;
                // java.util.Optional<String> clientTypeOpt = cacheService.get(cacheKey,
                // String.class); // 캐시 서비스 임시 비활성화
                java.util.Optional<String> clientTypeOpt = java.util.Optional.empty();
                if (clientTypeOpt.isPresent()) {
                    savedClientType = clientTypeOpt.get();
                    // cacheService.evict(cacheKey); // 사용 후 삭제 - 캐시 서비스 임시 비활성화
                    log.info("네이버 콜백 - Redis에서 모바일 클라이언트 정보 조회: clientType={}, state={}",
                            savedClientType, state);
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

            // 콜백 요청의 scheme과 host를 사용해서 redirect_uri 동적 생성 (필수, 프록시 헤더 고려)
            // 인증 URL 생성 시 사용한 redirect_uri와 일치시켜야 함
            // 카카오와 동일하게 OAuth2DomainUtil을 사용하여 서브도메인을 메인 도메인으로 변환
            String callbackRedirectUri = null;
            // requestScheme과 portSuffix는 try 블록 밖에서도 사용해야 하므로 먼저 선언
            String requestScheme = request.getHeader("X-Forwarded-Proto");
            if (requestScheme == null || requestScheme.isEmpty()) {
                requestScheme = request.getScheme();
            }
            String portSuffix = "";
            try {
                // 프록시 헤더 확인 (X-Forwarded-Proto, X-Forwarded-Host)
                // Nginx를 통해 들어온 요청은 X-Forwarded-Host를 우선 확인

                // X-Forwarded-Host 우선 확인 (Nginx를 통해 들어온 요청)
                String requestHost = request.getHeader("X-Forwarded-Host");
                if (requestHost == null || requestHost.isEmpty()) {
                    // X-Forwarded-Host가 없으면 Host 헤더 확인
                    requestHost = request.getHeader("Host");
                }

                // 로컬 환경에서 프론트엔드 프록시를 통해 온 경우 처리
                if (requestHost != null && requestHost.contains("localhost")
                        && !requestHost.contains(":8080")) {
                    // 프론트엔드(localhost:3000)에서 프록시로 온 경우, 실제 백엔드 주소 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                } else if (requestHost == null || requestHost.isEmpty()) {
                    // Host 헤더도 없으면 서버 정보 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                }

                if (requestHost != null && !requestHost.isEmpty()) {
                    String hostWithoutPort = requestHost.split(":")[0];
                    // 서브도메인을 메인 도메인으로 변환 (설정 파일 기반)
                    String mainDomain = oauth2DomainUtil.convertToMainDomain(hostWithoutPort);

                    // 포트가 포함된 경우와 아닌 경우 모두 처리
                    // portSuffix는 이미 try 블록 밖에서 선언됨
                    if (requestHost.contains(":")) {
                        String port = requestHost.split(":")[1];
                        if (!port.equals("80") && !port.equals("443")) {
                            portSuffix = ":" + port;
                        }
                    } else {
                        // 프록시를 통해 들어온 경우 포트는 헤더에서 확인
                        String forwardedPort = request.getHeader("X-Forwarded-Port");
                        if (forwardedPort != null && !forwardedPort.isEmpty()) {
                            int port = Integer.parseInt(forwardedPort);
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        } else {
                            int port = request.getServerPort();
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        }
                    }

                    callbackRedirectUri =
                            requestScheme + "://" + mainDomain + portSuffix + naverCallbackPath;

                    log.info(
                            "네이버 콜백 - 동적 redirect_uri 생성: {} (scheme={}, originalHost={}, mainDomain={}, forwardedProto={}, forwardedHost={})",
                            callbackRedirectUri, requestScheme, requestHost, mainDomain,
                            request.getHeader("X-Forwarded-Proto"),
                            request.getHeader("X-Forwarded-Host"));
                }
            } catch (Exception e) {
                log.error("네이버 콜백 - redirect_uri 동적 생성 실패", e);
            }

            if (callbackRedirectUri == null || callbackRedirectUri.isEmpty()) {
                log.error(
                        "네이버 콜백 - redirect_uri를 생성할 수 없습니다. 요청 정보: scheme={}, host={}, serverName={}",
                        request.getScheme(), request.getHeader("Host"), request.getServerName());
                String frontendUrl = getFrontendBaseUrl(request);
                return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                        + URLEncoder.encode("시스템오류", StandardCharsets.UTF_8) + "&provider=NAVER")
                        .build();
            }

            // redirectUri를 전달하기 위해 NaverOAuth2ServiceImpl 직접 호출
            SocialLoginResponse response;
            try {
                OAuth2Service naverService = oauth2FactoryService.getOAuth2Service("NAVER");
                if (callbackRedirectUri != null
                        && naverService instanceof com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl) {
                    com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl naverServiceImpl =
                            (com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl) naverService;

                    // 네이버 인증 URL 생성 시 사용한 redirect_uri와 비교
                    String savedRedirectUri =
                            (String) session.getAttribute("oauth2_naver_redirect_uri");
                    log.info(
                            "네이버 콜백 - 세션에서 저장된 redirect_uri 확인: savedRedirectUri={}, callbackRedirectUri={}, sessionId={}",
                            savedRedirectUri, callbackRedirectUri, session.getId());

                    // 네이버 개발자 센터에 등록된 URL 목록 (설정 파일에서 읽어옴)
                    List<String> registeredUrls = Arrays.stream(naverRegisteredUrls.split(","))
                            .map(String::trim).filter(url -> !url.isEmpty()).toList();
                    log.debug("네이버 등록된 URL 목록: {}", registeredUrls);

                    if (savedRedirectUri != null && !savedRedirectUri.isEmpty()) {
                        if (!savedRedirectUri.equals(callbackRedirectUri)) {
                            log.warn("⚠️ 네이버 redirect_uri 불일치: 인증 URL 생성 시={}, 콜백 처리 시={}",
                                    savedRedirectUri, callbackRedirectUri);
                            // 인증 URL 생성 시 사용한 redirect_uri를 우선 사용 (네이버 개발자 센터에 등록된 URL과 일치)
                            callbackRedirectUri = savedRedirectUri;
                            log.info("네이버 콜백 - 인증 URL 생성 시 사용한 redirect_uri로 변경: {}",
                                    callbackRedirectUri);
                        } else {
                            log.info("네이버 콜백 - redirect_uri 일치 확인: {}", callbackRedirectUri);
                        }
                    } else {
                        log.warn(
                                "⚠️ 네이버 콜백 - 세션에 저장된 redirect_uri가 없습니다. 동적으로 생성한 redirect_uri 사용: {}",
                                callbackRedirectUri);
                        // 세션에 저장된 redirect_uri가 없을 경우, 네이버 개발자 센터에 등록된 URL 중 하나를 사용
                        // 동적으로 생성한 redirect_uri가 네이버 개발자 센터에 등록된 URL과 일치하는지 확인
                        // 일치하지 않으면 설정 파일의 기본 도메인 사용
                        String configuredDomain = naverCallbackDomain;
                        String envDomain = System.getenv("NAVER_CALLBACK_DOMAIN");
                        if (envDomain != null && !envDomain.isEmpty()) {
                            configuredDomain = envDomain;
                        }
                        if (configuredDomain == null || configuredDomain.isEmpty()) {
                            configuredDomain = "dev.core-solution.co.kr";
                        }
                        // requestScheme과 portSuffix는 이미 위에서 설정됨
                        String configuredRedirectUri = requestScheme + "://" + configuredDomain
                                + portSuffix + naverCallbackPath;

                        // 동적으로 생성한 redirect_uri가 등록된 URL 목록에 있는지 확인
                        boolean isRegistered = registeredUrls.contains(callbackRedirectUri);
                        if (!isRegistered) {
                            log.warn("⚠️ 네이버 콜백 - 동적으로 생성한 redirect_uri가 등록된 URL 목록에 없음: {}",
                                    callbackRedirectUri);
                            log.info("네이버 콜백 - 설정 파일 기반 redirect_uri 사용: {} (등록된 URL 목록 확인)",
                                    configuredRedirectUri);
                            // 설정 파일 기반 redirect_uri가 등록된 URL 목록에 있는지 확인
                            boolean isConfiguredRegistered =
                                    registeredUrls.contains(configuredRedirectUri);
                            if (isConfiguredRegistered) {
                                callbackRedirectUri = configuredRedirectUri;
                            } else {
                                // 등록된 URL 목록에서 첫 번째 URL을 기본값으로 사용
                                if (!registeredUrls.isEmpty()) {
                                    String fallbackUrl = registeredUrls.get(0).trim();
                                    log.warn(
                                            "⚠️ 네이버 콜백 - 설정 파일 기반 redirect_uri도 등록된 URL 목록에 없음. 등록된 URL 목록의 첫 번째 URL 사용: {}",
                                            fallbackUrl);
                                    callbackRedirectUri = fallbackUrl;
                                } else {
                                    // 등록된 URL 목록이 비어있으면 설정 파일의 기본 도메인 사용
                                    String fallbackUrl = requestScheme + "://" + configuredDomain
                                            + portSuffix + naverCallbackPath;
                                    log.warn("⚠️ 네이버 콜백 - 등록된 URL 목록이 비어있음. 설정 파일의 기본 도메인 사용: {}",
                                            fallbackUrl);
                                    callbackRedirectUri = fallbackUrl;
                                }
                            }
                        } else {
                            log.info("네이버 콜백 - 동적으로 생성한 redirect_uri가 등록된 URL 목록에 있음: {}",
                                    callbackRedirectUri);
                        }
                    }

                    log.info("네이버 콜백 - 토큰 요청 시 사용할 redirect_uri: {}", callbackRedirectUri);
                    log.info("네이버 콜백 - 토큰 요청 파라미터: code={}, redirect_uri={}",
                            code != null ? code.substring(0, Math.min(10, code.length())) + "..."
                                    : "null",
                            callbackRedirectUri);
                    log.info("네이버 콜백 - 최종 redirect_uri 결정: {} (세션 저장 여부: {}, 등록된 URL 목록 포함 여부: {})",
                            callbackRedirectUri,
                            savedRedirectUri != null && !savedRedirectUri.isEmpty(),
                            registeredUrls != null && registeredUrls.contains(callbackRedirectUri));
                    String accessToken = naverServiceImpl.getAccessToken(code, callbackRedirectUri);
                    SocialUserInfo socialUserInfo = naverServiceImpl.getUserInfo(accessToken);
                    socialUserInfo.setProvider("NAVER");
                    socialUserInfo.setAccessToken(accessToken);
                    socialUserInfo.normalizeData();

                    // 기존 사용자 확인 (예외 발생해도 계속 진행)
                    Long existingUserId = null;
                    try {
                        existingUserId = naverServiceImpl
                                .findExistingUserByProviderId(socialUserInfo.getProviderUserId());
                        if (existingUserId == null && socialUserInfo.getEmail() != null) {
                            existingUserId = naverServiceImpl
                                    .findExistingUserByProviderId(socialUserInfo.getEmail());
                        }
                    } catch (Exception findUserException) {
                        log.warn("기존 사용자 확인 중 오류 발생 (계속 진행): {}", findUserException.getMessage());
                        // 예외가 발생해도 계속 진행 (신규 사용자로 처리)
                    }

                    if (existingUserId != null) {
                        User existingUser = userRepository.findById(existingUserId).orElse(null);
                        if (existingUser != null) {
                            response = SocialLoginResponse.builder().success(true)
                                    .requiresSignup(false)
                                    .userInfo(SocialLoginResponse.UserInfo.builder()
                                            .id(existingUser.getId()).email(existingUser.getEmail())
                                            .name(existingUser.getName())
                                            .nickname(existingUser.getNickname())
                                            .role(existingUser.getRole() != null
                                                    ? existingUser.getRole().name()
                                                    : null)
                                            .profileImageUrl(existingUser.getProfileImageUrl())
                                            .branch(existingUser.getBranch())
                                            .branchCode(existingUser.getBranchCode()).build())
                                    .build();
                        } else {
                            response = SocialLoginResponse.builder().success(false)
                                    .message("사용자를 찾을 수 없습니다.").build();
                        }
                    } else {
                        response = SocialLoginResponse.builder().success(true).requiresSignup(true)
                                .socialUserInfo(socialUserInfo).build();
                    }
                } else {
                    // 기본 방식 사용
                    response = oauth2FactoryService.authenticateWithProvider("NAVER", code);
                }
            } catch (Exception e) {
                log.error("네이버 OAuth2 인증 처리 중 오류", e);
                // 트랜잭션이 롤백 전용으로 표시된 경우 명시적으로 롤백 처리
                try {
                    TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                } catch (Exception txException) {
                    log.debug("트랜잭션 상태 확인 실패 (이미 롤백되었거나 트랜잭션이 없는 경우): {}",
                            txException.getMessage());
                }
                // catch 블록에서도 callbackRedirectUri를 사용하여 재시도
                try {
                    OAuth2Service naverService = oauth2FactoryService.getOAuth2Service("NAVER");
                    if (callbackRedirectUri != null
                            && naverService instanceof com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl) {
                        com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl naverServiceImpl =
                                (com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl) naverService;
                        // callbackRedirectUri를 사용하여 토큰 획득 및 사용자 정보 조회
                        String accessToken =
                                naverServiceImpl.getAccessToken(code, callbackRedirectUri);
                        SocialUserInfo socialUserInfo = naverServiceImpl.getUserInfo(accessToken);
                        socialUserInfo.setProvider("NAVER");
                        socialUserInfo.setAccessToken(accessToken);
                        socialUserInfo.normalizeData();
                        // 기존 사용자 확인 (예외 발생해도 계속 진행)
                        Long existingUserId = null;
                        try {
                            existingUserId = naverServiceImpl.findExistingUserByProviderId(
                                    socialUserInfo.getProviderUserId());
                            if (existingUserId == null && socialUserInfo.getEmail() != null) {
                                existingUserId = naverServiceImpl
                                        .findExistingUserByProviderId(socialUserInfo.getEmail());
                            }
                        } catch (Exception findUserException) {
                            log.warn("기존 사용자 확인 중 오류 발생 (계속 진행): {}",
                                    findUserException.getMessage());
                        }
                        // 사용자 처리 로직
                        if (existingUserId != null) {
                            User existingUser =
                                    userRepository.findById(existingUserId).orElse(null);
                            if (existingUser != null) {
                                response = SocialLoginResponse.builder().success(true)
                                        .requiresSignup(false)
                                        .userInfo(SocialLoginResponse.UserInfo.builder()
                                                .id(existingUser.getId())
                                                .email(existingUser.getEmail())
                                                .name(existingUser.getName())
                                                .nickname(existingUser.getNickname())
                                                .role(existingUser.getRole() != null
                                                        ? existingUser.getRole().name()
                                                        : null)
                                                .profileImageUrl(existingUser.getProfileImageUrl())
                                                .branch(existingUser.getBranch())
                                                .branchCode(existingUser.getBranchCode()).build())
                                        .build();
                            } else {
                                response = SocialLoginResponse.builder().success(false)
                                        .message("사용자를 찾을 수 없습니다.").build();
                            }
                        } else {
                            response = SocialLoginResponse.builder().success(true)
                                    .requiresSignup(true).socialUserInfo(socialUserInfo).build();
                        }
                    } else {
                        // 기본 방식 사용 (callbackRedirectUri가 없는 경우)
                        response = oauth2FactoryService.authenticateWithProvider("NAVER", code);
                    }
                } catch (Exception authException) {
                    log.error("네이버 OAuth2 인증 처리 중 오류 발생", authException);
                    // 트랜잭션이 롤백 전용으로 표시된 경우 명시적으로 롤백 처리
                    try {
                        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                    } catch (Exception txException) {
                        log.debug("트랜잭션 상태 확인 실패 (이미 롤백되었거나 트랜잭션이 없는 경우): {}",
                                txException.getMessage());
                    }
                    // 네이버 로그인 오류 시 원래 도메인으로 리다이렉트 (요청 도메인 유지)
                    String frontendUrl = getFrontendBaseUrl(request);
                    String errorMessage =
                            authException.getMessage() != null ? authException.getMessage()
                                    : "인증 처리 중 오류가 발생했습니다";
                    log.warn("네이버 로그인 오류 발생 - 원래 도메인으로 리다이렉트: frontendUrl={}, error={}",
                            frontendUrl, errorMessage);
                    return ResponseEntity.status(302)
                            .header("Location",
                                    frontendUrl + "/login?error="
                                            + URLEncoder.encode(errorMessage,
                                                    StandardCharsets.UTF_8)
                                            + "&provider=NAVER")
                            .build();
                }
            }

            log.info("네이버 OAuth2 응답: success={}, requiresSignup={}, message={}",
                    response.isSuccess(), response.isRequiresSignup(), response.getMessage());

            if (response.isSuccess()) {
                // 회원가입이 필요한 경우 처리 (카카오와 동일한 방식)
                if (response.isRequiresSignup()) {
                    log.info("네이버 OAuth2 간편 회원가입 필요: {}", response.getSocialUserInfo());

                    // 세션에서 tenant_id 확인 (서브도메인에서 추출한 값)
                    String tenantId = (String) session.getAttribute("oauth2_tenant_id");
                    if (tenantId != null && !tenantId.isEmpty()) {
                        log.info("네이버 OAuth2 - 서브도메인에서 추출한 tenant_id 사용: tenantId={}", tenantId);
                        session.removeAttribute("oauth2_tenant_id"); // 사용 후 제거
                    }

                    // 소셜 사용자 정보를 URL 파라미터로 전달 (한글 인코딩 처리)
                    String email = response.getSocialUserInfo() != null
                            ? response.getSocialUserInfo().getEmail()
                            : "";
                    String name = response.getSocialUserInfo() != null
                            ? response.getSocialUserInfo().getName()
                            : "";
                    String nickname = response.getSocialUserInfo() != null
                            ? response.getSocialUserInfo().getNickname()
                            : "";

                    String frontendUrl = getFrontendBaseUrl(request);
                    String signupUrl =
                            frontendUrl + "/login?" + "signup=required" + "&provider=naver"
                                    + (tenantId != null && !tenantId.isEmpty()
                                            ? "&tenantId=" + URLEncoder.encode(tenantId,
                                                    StandardCharsets.UTF_8)
                                            : "")
                                    + "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
                                    + "&name=" + URLEncoder.encode(name, StandardCharsets.UTF_8)
                                    + "&nickname="
                                    + URLEncoder.encode(nickname, StandardCharsets.UTF_8);

                    return ResponseEntity.status(302).header("Location", signupUrl).build();
                }

                // SocialLoginResponse에서 이미 완성된 UserInfo 사용 (공통 SNS 처리 로직 활용)
                SocialLoginResponse.UserInfo userInfo = response.getUserInfo();

                // userInfo가 null인 경우 처리
                if (userInfo == null) {
                    log.error("네이버 OAuth2 - userInfo가 null입니다. requiresSignup={}",
                            response.isRequiresSignup());
                    String frontendUrl = getFrontendBaseUrl(request);
                    return ResponseEntity.status(302)
                            .header("Location",
                                    frontendUrl + "/login?error="
                                            + URLEncoder.encode("사용자 정보를 가져올 수 없습니다.",
                                                    StandardCharsets.UTF_8)
                                            + "&provider=NAVER")
                            .build();
                }

                // 계정 연동 모드인지 확인
                if ("link".equals(mode)) {
                    // 기존 로그인된 사용자의 세션 확인
                    User currentUser = SessionUtils.getCurrentUser(session);
                    if (currentUser == null) {
                        log.error("계정 연동 모드에서 세션 사용자를 찾을 수 없음");
                        return ResponseEntity.status(302)
                                .header("Location",
                                        OAuth2Constants.FRONTEND_BASE_URL + "/mypage?error="
                                                + URLEncoder.encode("세션만료", StandardCharsets.UTF_8)
                                                + "&provider=NAVER")
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
                        OAuth2Service oauth2Service =
                                oauth2FactoryService.getOAuth2Service("NAVER");
                        oauth2Service.linkSocialAccountToUser(currentUser.getId(), socialUserInfo);
                        log.info("네이버 계정 연동 성공: 기존 사용자 userId={}, 소셜 사용자 providerUserId={}",
                                currentUser.getId(), userInfo.getId());

                        return ResponseEntity.status(302)
                                .header("Location",
                                        frontendBaseUrl + "/mypage?success="
                                                + URLEncoder.encode("연동완료", StandardCharsets.UTF_8)
                                                + "&provider=NAVER")
                                .build();
                    } catch (Exception e) {
                        log.error("네이버 계정 연동 실패", e);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        frontendBaseUrl + "/mypage?error="
                                                + URLEncoder.encode("연동실패", StandardCharsets.UTF_8)
                                                + "&provider=NAVER")
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
                    session.setAttribute("SPRING_SECURITY_CONTEXT",
                            SecurityContextHolder.getContext());

                    // 세션 무효화 시간 설정 (1시간)
                    session.setMaxInactiveInterval(3600);

                    log.info(
                            "네이버 OAuth2 로그인 성공: userId={}, role={}, profileImage={}, clientType={}",
                            user.getId(), user.getRole(), user.getProfileImageUrl(),
                            savedClientType);

                    // 세션 정보 디버깅 로그 추가
                    log.info(
                            "세션 정보 확인: sessionId={}, userInSession={}, sessionMaxInactiveInterval={}",
                            session.getId(),
                            SessionUtils.getCurrentUser(session) != null ? "설정됨" : "없음",
                            session.getMaxInactiveInterval());

                    // SecurityContext 확인
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    log.info("SecurityContext 설정 확인: {}",
                            auth != null && auth.isAuthenticated() ? "성공" : "실패");

                    // 사용자 역할에 따른 리다이렉트 (공통 유틸리티 사용)
                    String frontendUrl = getFrontendBaseUrl(request);
                    String baseRedirectUrl =
                            DashboardRedirectUtil.getDashboardUrl(user.getRole(), frontendUrl);

                    // provider 정보 가져오기
                    String provider = "UNKNOWN";
                    if (response.getSocialAccountInfo() != null
                            && response.getSocialAccountInfo().getProvider() != null) {
                        provider = response.getSocialAccountInfo().getProvider();
                    }

                    // 사용자 정보를 URL 파라미터로 전달 (세션 복원용)
                    String redirectUrl = baseRedirectUrl + "?" + "oauth=success" + "&userId="
                            + user.getId() + "&email="
                            + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8) + "&name="
                            + URLEncoder.encode(user.getName(), StandardCharsets.UTF_8)
                            + "&nickname="
                            + URLEncoder.encode(
                                    user.getNickname() != null ? user.getNickname() : "",
                                    StandardCharsets.UTF_8)
                            + "&role=" + user.getRole() + "&profileImage="
                            + URLEncoder.encode(
                                    user.getProfileImageUrl() != null ? user.getProfileImageUrl()
                                            : "",
                                    StandardCharsets.UTF_8)
                            + "&provider=" + provider;

                    // 모바일 클라이언트인 경우 Deep Link로 리다이렉트
                    if ("mobile".equals(savedClientType)) {
                        log.info("✅ 모바일 클라이언트로 Deep Link 리다이렉트 (네이버)");

                        // 세션 ID를 Deep Link에 포함
                        String sessionId = session.getId();

                        // Deep Link URL 생성
                        String deepLinkUrl = "mindgarden://oauth/callback?" + "success=true"
                                + "&provider=NAVER" + "&userId=" + user.getId() + "&email="
                                + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8)
                                + "&name="
                                + URLEncoder.encode(user.getName(), StandardCharsets.UTF_8)
                                + "&nickname="
                                + URLEncoder.encode(
                                        user.getNickname() != null ? user.getNickname() : "",
                                        StandardCharsets.UTF_8)
                                + "&role=" + user.getRole() + "&profileImage="
                                + URLEncoder.encode(user.getProfileImageUrl() != null
                                        ? user.getProfileImageUrl()
                                        : "", StandardCharsets.UTF_8)
                                + "&sessionId=" + sessionId;

                        log.info("생성된 Deep Link URL (네이버): {}", deepLinkUrl);
                        log.info("Deep Link 세션 ID: {}", sessionId);

                        // HTML 페이지 생성 (iOS Safari 보안 정책으로 버튼 포함, 자동 시도도 함께)
                        String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>"
                                + "<title>로그인 처리 중...</title>"
                                + "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                                + "<style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f5f5f5;}"
                                + "h1{color:#333;}button{background:#03C75A;color:white;border:none;padding:15px 30px;font-size:16px;border-radius:5px;cursor:pointer;margin-top:20px;}"
                                + "button:hover{background:#02B350;}</style>" + "</head><body>"
                                + "<h1>로그인 처리 중...</h1>" + "<p>아래 버튼을 눌러 앱을 열어주세요.</p>"
                                + "<button id='openAppBtn' onclick=\"window.location.href='"
                                + deepLinkUrl.replace("'", "\\'") + "'\">앱 열기</button>" + "<script>"
                                + "var deepLink = '" + deepLinkUrl.replace("'", "\\'") + "';"
                                + "// 자동 시도 (실패할 수 있음)" + "setTimeout(function(){"
                                + "  window.location.href = deepLink;" + "}, 1000);"
                                + "// 버튼 클릭으로도 시도"
                                + "document.getElementById('openAppBtn').addEventListener('click', function(){"
                                + "  window.location.href = deepLink;" + "});" + "</script>"
                                + "</body></html>";

                        return ResponseEntity.ok()
                                .header("Content-Type", "text/html; charset=UTF-8").body(html);
                    }

                    // 웹 클라이언트인 경우 기존 로직 사용
                    // 세션 쿠키를 프론트엔드로 전달하기 위해 쿠키에 세션 ID를 포함
                    // 프론트엔드에서 이 쿠키를 사용하여 세션을 복원
                    String sessionId = session.getId();
                    String cookieValue = String.format(
                            "JSESSIONID=%s; Path=/; SameSite=None; Max-Age=3600; Secure; HttpOnly=false",
                            sessionId);

                    log.info("세션 쿠키 설정: {}", cookieValue);
                    log.info("리다이렉트 URL: {}", redirectUrl);

                    return ResponseEntity.status(302).header("Location", redirectUrl)
                            .header("Set-Cookie", cookieValue).build();
                }
            } else if (response.isRequiresSignup()) {
                // 간편 회원가입이 필요한 경우
                log.info("네이버 OAuth2 간편 회원가입 필요: {}", response.getSocialUserInfo());

                // 세션에서 tenant_id 확인 (서브도메인에서 추출한 값)
                String tenantId = (String) session.getAttribute("oauth2_tenant_id");
                if (tenantId != null && !tenantId.isEmpty()) {
                    log.info("네이버 OAuth2 - 서브도메인에서 추출한 tenant_id 사용: tenantId={}", tenantId);
                    session.removeAttribute("oauth2_tenant_id"); // 사용 후 제거
                }

                // 소셜 사용자 정보를 URL 파라미터로 전달 (한글 인코딩 처리)
                String frontendUrl = getFrontendBaseUrl(request);
                String email = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getEmail()
                        : "";
                String name = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getName()
                        : "";
                String nickname = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getNickname()
                        : "";

                String signupUrl =
                        frontendUrl + "/login?" + "signup=required" + "&provider=naver"
                                + (tenantId != null && !tenantId.isEmpty() ? "&tenantId="
                                        + URLEncoder.encode(tenantId, StandardCharsets.UTF_8) : "")
                                + "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
                                + "&name=" + URLEncoder.encode(name, StandardCharsets.UTF_8)
                                + "&nickname="
                                + URLEncoder.encode(nickname, StandardCharsets.UTF_8);

                log.info("네이버 OAuth2 회원가입 리다이렉트 URL: {}", signupUrl);

                return ResponseEntity.status(302).header("Location", signupUrl).build();
            } else {
                return ResponseEntity.status(302)
                        .header("Location",
                                frontendBaseUrl + "/login?error="
                                        + URLEncoder.encode(response.getMessage(),
                                                StandardCharsets.UTF_8)
                                        + "&provider=NAVER")
                        .build();
            }
        } catch (Exception e) {
            log.error("네이버 OAuth2 콜백 처리 실패", e);
            return ResponseEntity.status(302)
                    .header("Location", frontendBaseUrl + "/login?error="
                            + URLEncoder.encode("처리실패", StandardCharsets.UTF_8) + "&provider=NAVER")
                    .build();
        }
    }

    // 테스트용 간편 회원가입 시뮬레이션 엔드포인트
    @GetMapping("/test/signup-required")
    public ResponseEntity<?> testSignupRequired(HttpServletRequest request) {
        log.info("테스트용 간편 회원가입 시뮬레이션 요청");

        String frontendBaseUrl = getFrontendBaseUrl(request);
        String signupUrl = frontendBaseUrl + "/login?" + "signup=required" + "&provider=kakao"
                + "&email=" + URLEncoder.encode("test@example.com", StandardCharsets.UTF_8)
                + "&name=" + URLEncoder.encode("테스트사용자", StandardCharsets.UTF_8) + "&nickname="
                + URLEncoder.encode("테스트닉네임", StandardCharsets.UTF_8);

        log.info("테스트용 간편 회원가입 URL로 리다이렉트: {}", signupUrl);

        return ResponseEntity.status(302).header("Location", signupUrl).build();
    }

    @GetMapping("/kakao/callback")
    public ResponseEntity<?> kakaoCallback(@RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String mode, // 'login' 또는 'link'
            HttpServletRequest request, HttpSession session) {

        if (error != null) {
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302)
                    .header("Location", frontendUrl + "/login?error="
                            + URLEncoder.encode(error, StandardCharsets.UTF_8) + "&provider=KAKAO")
                    .build();
        }

        if (code == null) {
            log.warn("카카오 OAuth2 콜백에서 인증 코드가 없습니다. error={}, state={}", error, state);
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode("인증코드없음", StandardCharsets.UTF_8) + "&provider=KAKAO")
                    .build();
        }

        String savedState = (String) session.getAttribute("oauth2_kakao_state");
        if (savedState != null && !savedState.equals(state)) {
            session.removeAttribute("oauth2_kakao_state");
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode("보안검증실패", StandardCharsets.UTF_8) + "&provider=KAKAO")
                    .build();
        }

        if (savedState != null) {
            session.removeAttribute("oauth2_kakao_state");
        }

        try {
            // 서브도메인에서 tenant_id 추출하여 TenantContextHolder에 설정 (OAuth 콜백 처리 전 필수)
            String callbackTenantId = extractTenantIdFromSubdomain(request);
            if (callbackTenantId != null && !callbackTenantId.isEmpty()) {
                com.coresolution.core.context.TenantContextHolder.setTenantId(callbackTenantId);
                log.info(
                        "카카오 OAuth2 콜백 - 서브도메인에서 tenant_id 추출 및 TenantContextHolder 설정: tenantId={}",
                        callbackTenantId);
            } else {
                // 서브도메인이 없으면 세션에서 tenant_id 확인
                String sessionTenantId = (String) session.getAttribute("tenantId");
                if (sessionTenantId != null && !sessionTenantId.isEmpty()) {
                    com.coresolution.core.context.TenantContextHolder.setTenantId(sessionTenantId);
                    log.info(
                            "카카오 OAuth2 콜백 - 세션에서 tenant_id 추출 및 TenantContextHolder 설정: tenantId={}",
                            sessionTenantId);
                } else {
                    log.warn("⚠️ 카카오 OAuth2 콜백 - tenant_id를 찾을 수 없습니다. 서브도메인 또는 세션에서 확인 필요");
                }
            }

            // 모바일 클라이언트 정보를 Redis에서 조회 (state 기반)
            String savedClientType = null;
            if (state != null) {
                String cacheKey = "oauth2_kakao_client:" + state;
                // java.util.Optional<String> clientTypeOpt = cacheService.get(cacheKey,
                // String.class); // 캐시 서비스 임시 비활성화
                java.util.Optional<String> clientTypeOpt = java.util.Optional.empty();
                if (clientTypeOpt.isPresent()) {
                    savedClientType = clientTypeOpt.get();
                    // cacheService.evict(cacheKey); // 사용 후 삭제 - 캐시 서비스 임시 비활성화
                    log.info("카카오 콜백 - Redis에서 모바일 클라이언트 정보 조회: clientType={}, state={}",
                            savedClientType, state);
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

            // 동적 redirectUri 계산 (항상 동적으로 생성, 프록시 헤더 고려)
            String actualRedirectUri = null;
            try {
                // 프록시 헤더 확인 (X-Forwarded-Proto, X-Forwarded-Host)
                // 단, 로컬 환경(localhost)에서는 실제 요청 Host를 우선 사용
                String requestScheme = request.getHeader("X-Forwarded-Proto");
                if (requestScheme == null || requestScheme.isEmpty()) {
                    requestScheme = request.getScheme();
                }

                // Host 헤더 우선 확인 (실제 백엔드 서버 주소)
                String requestHost = request.getHeader("Host");
                // 로컬 환경에서 프론트엔드 프록시를 통해 온 경우 처리
                if (requestHost != null && requestHost.contains("localhost")
                        && !requestHost.contains(":8080")) {
                    // 프론트엔드(localhost:3000)에서 프록시로 온 경우, 실제 백엔드 주소 사용
                    requestHost = request.getServerName() + ":" + request.getServerPort();
                } else if (requestHost == null || requestHost.isEmpty()) {
                    // Host 헤더가 없으면 X-Forwarded-Host 확인
                    String forwardedHost = request.getHeader("X-Forwarded-Host");
                    if (forwardedHost != null && !forwardedHost.isEmpty()) {
                        // X-Forwarded-Host가 백엔드 포트를 포함하는 경우만 사용
                        if (forwardedHost.contains(":8080")) {
                            requestHost = forwardedHost;
                        } else {
                            // 아니면 실제 서버 주소 사용
                            requestHost = request.getServerName() + ":" + request.getServerPort();
                        }
                    }
                }
                if (requestHost == null || requestHost.isEmpty()) {
                    requestHost = request.getServerName();
                    int port = request.getServerPort();
                    if (port != 80 && port != 443) {
                        requestHost = requestHost + ":" + port;
                    }
                }

                if (requestHost != null && !requestHost.isEmpty()) {
                    String hostWithoutPort = requestHost.split(":")[0];
                    // 서브도메인을 메인 도메인으로 변환 (설정 파일 기반)
                    String mainDomain = oauth2DomainUtil.convertToMainDomain(hostWithoutPort);

                    // 포트가 포함된 경우와 아닌 경우 모두 처리
                    String portSuffix = "";
                    if (requestHost.contains(":")) {
                        String port = requestHost.split(":")[1];
                        if (!port.equals("80") && !port.equals("443")) {
                            portSuffix = ":" + port;
                        }
                    } else {
                        // 프록시를 통해 들어온 경우 포트는 헤더에서 확인
                        String forwardedPort = request.getHeader("X-Forwarded-Port");
                        if (forwardedPort != null && !forwardedPort.isEmpty()) {
                            int port = Integer.parseInt(forwardedPort);
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        } else {
                            int port = request.getServerPort();
                            if (port != 80 && port != 443) {
                                portSuffix = ":" + port;
                            }
                        }
                    }

                    actualRedirectUri =
                            requestScheme + "://" + mainDomain + portSuffix + kakaoCallbackPath;

                    log.info(
                            "카카오 콜백 - 동적 redirect_uri 생성: {} (원본 host={}, 변환된 mainDomain={}, scheme={}, forwardedProto={}, forwardedHost={})",
                            actualRedirectUri, requestHost, mainDomain, request.getScheme(),
                            request.getHeader("X-Forwarded-Proto"),
                            request.getHeader("X-Forwarded-Host"));
                }
            } catch (Exception e) {
                log.error("카카오 콜백 - redirect_uri 동적 생성 실패", e);
            }

            if (actualRedirectUri == null || actualRedirectUri.isEmpty()) {
                log.error(
                        "카카오 콜백 - redirect_uri를 생성할 수 없습니다. 요청 정보: scheme={}, host={}, serverName={}",
                        request.getScheme(), request.getHeader("Host"), request.getServerName());
                String frontendUrl = getFrontendBaseUrl(request);
                return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                        + URLEncoder.encode("시스템오류", StandardCharsets.UTF_8) + "&provider=KAKAO")
                        .build();
            }

            // redirectUri를 전달하여 인증 처리
            OAuth2Service kakaoService = oauth2FactoryService.getOAuth2Service("KAKAO");
            SocialLoginResponse response;
            if (kakaoService instanceof com.coresolution.consultation.service.impl.KakaoOAuth2ServiceImpl) {
                com.coresolution.consultation.service.impl.KakaoOAuth2ServiceImpl kakaoServiceImpl =
                        (com.coresolution.consultation.service.impl.KakaoOAuth2ServiceImpl) kakaoService;
                // redirectUri를 전달하여 액세스 토큰 획득
                String accessToken = kakaoServiceImpl.getAccessToken(code, actualRedirectUri);
                // AbstractOAuth2Service의 authenticateWithCode를 사용하되,
                // getAccessToken이 이미 호출되었으므로 재호출되지 않도록 처리
                // 하지만 AbstractOAuth2Service.authenticateWithCode는 getAccessToken(code)를 다시 호출하므로
                // 직접 인증 처리 로직을 구현해야 함
                com.coresolution.consultation.dto.SocialUserInfo socialUserInfo =
                        kakaoServiceImpl.getUserInfo(accessToken);
                socialUserInfo.setProvider("KAKAO");
                socialUserInfo.setAccessToken(accessToken);
                socialUserInfo.normalizeData();

                // 기존 사용자 확인
                Long existingUserId = null;

                // tenant ID가 설정되어 있으면 findExistingUserByProviderId 사용
                String currentTenantId =
                        com.coresolution.core.context.TenantContextHolder.getTenantId();
                if (currentTenantId != null && !currentTenantId.isEmpty()) {
                    try {
                        existingUserId = kakaoServiceImpl
                                .findExistingUserByProviderId(socialUserInfo.getProviderUserId());
                    } catch (Exception e) {
                        log.warn("⚠️ findExistingUserByProviderId 호출 실패 (tenant ID 있음): {}",
                                e.getMessage());
                    }
                }

                // tenant ID가 없거나 findExistingUserByProviderId로 찾지 못한 경우, 이메일로 조회
                if (existingUserId == null) {
                    // 멀티 테넌트 사용자 고려하여 조회
                    List<User> users = userRepository.findAllByEmail(socialUserInfo.getEmail());
                    existingUserId = users.isEmpty() ? null : users.get(0).getId();
                    if (existingUserId != null) {
                        log.info("✅ 이메일로 사용자 조회 성공: email={}, userId={}", socialUserInfo.getEmail(),
                                existingUserId);
                    }
                }

                if (existingUserId == null) {
                    response =
                            SocialLoginResponse.builder().success(false).message("간편 회원가입이 필요합니다.")
                                    .requiresSignup(true).socialUserInfo(socialUserInfo).build();
                } else {
                    User user = userRepository.findById(existingUserId)
                            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

                    // Phase 3: 확장된 JWT 토큰 생성 (tenantId, branchId, permissions 포함)
                    // 권한 조회 시 예외 발생해도 빈 리스트 반환 (트랜잭션 롤백 오류 방지)
                    java.util.List<String> permissions;
                    try {
                        permissions = dynamicPermissionService.getUserPermissionsAsStringList(user);
                    } catch (Exception e) {
                        log.warn("⚠️ 권한 조회 실패 (빈 리스트 반환): userId={}, 오류={}", user.getId(),
                                e.getMessage());
                        permissions = new java.util.ArrayList<>();
                    }
                    String jwtToken = jwtService.generateToken(user, permissions);
                    // 표준화 2025-12-08: username = userId이므로 refreshToken도 userId 사용, User 객체로 생성하여
                    // tenantId, email 포함
                    String refreshToken = jwtService.generateRefreshToken(user);

                    // 프로필 이미지 결정
                    String finalProfileImageUrl = user.getProfileImageUrl() != null
                            && !user.getProfileImageUrl().trim().isEmpty()
                                    ? user.getProfileImageUrl()
                                    : (socialUserInfo.getProfileImageUrl() != null
                                            && !socialUserInfo.getProfileImageUrl().trim().isEmpty()
                                                    ? socialUserInfo.getProfileImageUrl()
                                                    : "/default-avatar.svg");

                    response = SocialLoginResponse.builder().success(true)
                            .message("카카오 계정으로 로그인되었습니다.").accessToken(jwtToken)
                            .refreshToken(refreshToken)
                            .userInfo(SocialLoginResponse.UserInfo.builder().id(user.getId())
                                    .email(user.getEmail()).name(user.getName())
                                    .nickname(user.getNickname()).role(user.getRole().getValue())
                                    .profileImageUrl(finalProfileImageUrl).build())
                            .build();
                }
            } else {
                try {
                    response = oauth2FactoryService.authenticateWithProvider("KAKAO", code);
                } catch (Exception e) {
                    log.error("카카오 OAuth2 인증 처리 중 오류 발생", e);
                    // 트랜잭션이 롤백 전용으로 표시된 경우 명시적으로 롤백 처리
                    try {
                        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                    } catch (Exception txException) {
                        log.debug("트랜잭션 상태 확인 실패 (이미 롤백되었거나 트랜잭션이 없는 경우): {}",
                                txException.getMessage());
                    }
                    String frontendUrl = getFrontendBaseUrl(request);
                    String errorMessage =
                            e.getMessage() != null ? e.getMessage() : "인증 처리 중 오류가 발생했습니다";
                    return ResponseEntity.status(302)
                            .header("Location",
                                    frontendUrl + "/login?error="
                                            + URLEncoder.encode(errorMessage,
                                                    StandardCharsets.UTF_8)
                                            + "&provider=KAKAO")
                            .build();
                }
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
                                .header("Location",
                                        frontendUrl + "/mypage?error="
                                                + URLEncoder.encode("세션만료", StandardCharsets.UTF_8)
                                                + "&provider=KAKAO")
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
                        OAuth2Service oauth2Service =
                                oauth2FactoryService.getOAuth2Service("KAKAO");
                        oauth2Service.linkSocialAccountToUser(currentUser.getId(), socialUserInfo);
                        log.info("카카오 계정 연동 성공: 기존 사용자 userId={}, 소셜 사용자 providerUserId={}",
                                currentUser.getId(), userInfo.getId());

                        String frontendUrl = getFrontendBaseUrl(request);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        frontendUrl + "/mypage?success="
                                                + URLEncoder.encode("연동완료", StandardCharsets.UTF_8)
                                                + "&provider=KAKAO")
                                .build();
                    } catch (Exception e) {
                        log.error("카카오 계정 연동 실패", e);
                        String frontendUrl = getFrontendBaseUrl(request);
                        return ResponseEntity.status(302)
                                .header("Location",
                                        frontendUrl + "/mypage?error="
                                                + URLEncoder.encode("연동실패", StandardCharsets.UTF_8)
                                                + "&provider=KAKAO")
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
                    session.setAttribute("SPRING_SECURITY_CONTEXT",
                            SecurityContextHolder.getContext());

                    // 세션 무효화 시간 설정 (1시간)
                    session.setMaxInactiveInterval(3600);

                    log.info(
                            "카카오 OAuth2 로그인 성공: userId={}, role={}, profileImage={}, clientType={}",
                            user.getId(), user.getRole(), user.getProfileImageUrl(),
                            savedClientType);

                    // 세션 정보 디버깅 로그 추가
                    log.info(
                            "세션 정보 확인: sessionId={}, userInSession={}, sessionMaxInactiveInterval={}",
                            session.getId(),
                            SessionUtils.getCurrentUser(session) != null ? "설정됨" : "없음",
                            session.getMaxInactiveInterval());

                    // SecurityContext 확인
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    log.info("SecurityContext 설정 확인: {}",
                            auth != null && auth.isAuthenticated() ? "성공" : "실패");

                    // 모바일 클라이언트인 경우 Deep Link로 리다이렉트
                    if ("mobile".equals(savedClientType)) {
                        log.info("✅ 모바일 클라이언트로 Deep Link 리다이렉트 (카카오)");

                        // 세션 ID를 Deep Link에 포함
                        String sessionId = session.getId();

                        // Deep Link URL 생성
                        String deepLinkUrl = "mindgarden://oauth/callback?" + "success=true"
                                + "&provider=KAKAO" + "&userId=" + user.getId() + "&email="
                                + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8)
                                + "&name="
                                + URLEncoder.encode(user.getName(), StandardCharsets.UTF_8)
                                + "&nickname="
                                + URLEncoder.encode(
                                        user.getNickname() != null ? user.getNickname() : "",
                                        StandardCharsets.UTF_8)
                                + "&role=" + user.getRole() + "&profileImage="
                                + URLEncoder.encode(user.getProfileImageUrl() != null
                                        ? user.getProfileImageUrl()
                                        : "", StandardCharsets.UTF_8)
                                + "&sessionId=" + sessionId;

                        log.info("생성된 Deep Link URL (카카오): {}", deepLinkUrl);
                        log.info("Deep Link 세션 ID: {}", sessionId);

                        // HTML 페이지 생성 (iOS Safari 보안 정책으로 버튼 포함, 자동 시도도 함께)
                        String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>"
                                + "<title>로그인 처리 중...</title>"
                                + "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                                + "<style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f5f5f5;}"
                                + "h1{color:#333;}button{background:#FEE500;color:#000;border:none;padding:15px 30px;font-size:16px;border-radius:5px;cursor:pointer;margin-top:20px;font-weight:bold;}"
                                + "button:hover{background:#FDD835;}</style>" + "</head><body>"
                                + "<h1>로그인 처리 중...</h1>" + "<p>아래 버튼을 눌러 앱을 열어주세요.</p>"
                                + "<button id='openAppBtn' onclick=\"window.location.href='"
                                + deepLinkUrl.replace("'", "\\'") + "'\">앱 열기</button>" + "<script>"
                                + "var deepLink = '" + deepLinkUrl.replace("'", "\\'") + "';"
                                + "// 자동 시도 (실패할 수 있음)" + "setTimeout(function(){"
                                + "  window.location.href = deepLink;" + "}, 1000);"
                                + "// 버튼 클릭으로도 시도"
                                + "document.getElementById('openAppBtn').addEventListener('click', function(){"
                                + "  window.location.href = deepLink;" + "});" + "</script>"
                                + "</body></html>";

                        return ResponseEntity.ok()
                                .header("Content-Type", "text/html; charset=UTF-8").body(html);
                    }

                    // 웹 클라이언트인 경우 기존 로직 사용
                    // 사용자 역할에 따른 리다이렉트 (공통 유틸리티 사용)
                    String frontendUrl = getFrontendBaseUrl(request);
                    String baseRedirectUrl =
                            DashboardRedirectUtil.getDashboardUrl(user.getRole(), frontendUrl);

                    // provider 정보 가져오기
                    String provider = "KAKAO";

                    // 사용자 정보를 URL 파라미터로 전달 (세션 복원용)
                    String redirectUrl = baseRedirectUrl + "?" + "oauth=success" + "&userId="
                            + user.getId() + "&email="
                            + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8) + "&name="
                            + URLEncoder.encode(user.getName(), StandardCharsets.UTF_8)
                            + "&nickname="
                            + URLEncoder.encode(
                                    user.getNickname() != null ? user.getNickname() : "",
                                    StandardCharsets.UTF_8)
                            + "&role=" + user.getRole() + "&profileImage="
                            + URLEncoder.encode(
                                    user.getProfileImageUrl() != null ? user.getProfileImageUrl()
                                            : "",
                                    StandardCharsets.UTF_8)
                            + "&provider=" + provider;

                    // 세션 쿠키 설정을 명시적으로 추가
                    String sessionId = session.getId();
                    String cookieValue = String.format(
                            "JSESSIONID=%s; Path=/; SameSite=None; Max-Age=3600; Secure; HttpOnly=false",
                            sessionId);

                    log.info("세션 쿠키 설정: {}", cookieValue);
                    log.info("리다이렉트 URL: {}", redirectUrl);

                    return ResponseEntity.status(302).header("Location", redirectUrl)
                            .header("Set-Cookie", cookieValue).build();
                }
            } else if (response.isRequiresSignup()) {
                // 간편 회원가입이 필요한 경우
                log.info("카카오 OAuth2 간편 회원가입 필요: {}", response.getSocialUserInfo());

                // 세션에서 tenant_id 확인 (서브도메인에서 추출한 값)
                String tenantId = (String) session.getAttribute("oauth2_tenant_id");
                if (tenantId != null && !tenantId.isEmpty()) {
                    log.info("카카오 OAuth2 - 서브도메인에서 추출한 tenant_id 사용: tenantId={}", tenantId);
                    session.removeAttribute("oauth2_tenant_id"); // 사용 후 제거
                }

                // 소셜 사용자 정보를 URL 파라미터로 전달 (한글 인코딩 처리)
                String email = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getEmail()
                        : "";
                String name = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getName()
                        : "";
                String nickname = response.getSocialUserInfo() != null
                        ? response.getSocialUserInfo().getNickname()
                        : "";

                String frontendUrl = getFrontendBaseUrl(request);
                String signupUrl =
                        frontendUrl + "/login?" + "signup=required" + "&provider=kakao"
                                + (tenantId != null && !tenantId.isEmpty() ? "&tenantId="
                                        + URLEncoder.encode(tenantId, StandardCharsets.UTF_8) : "")
                                + "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
                                + "&name=" + URLEncoder.encode(name, StandardCharsets.UTF_8)
                                + "&nickname="
                                + URLEncoder.encode(nickname, StandardCharsets.UTF_8);

                return ResponseEntity.status(302).header("Location", signupUrl).build();
            } else {
                String frontendUrl = getFrontendBaseUrl(request);
                return ResponseEntity.status(302)
                        .header("Location",
                                frontendUrl + "/login?error="
                                        + URLEncoder.encode(response.getMessage(),
                                                StandardCharsets.UTF_8)
                                        + "&provider=KAKAO")
                        .build();
            }
        } catch (Exception e) {
            log.error("카카오 OAuth2 콜백 처리 실패: {}", e.getMessage(), e);
            String errorMessage = e.getMessage() != null ? e.getMessage() : "처리실패";
            String frontendUrl = getFrontendBaseUrl(request);
            return ResponseEntity.status(302).header("Location", frontendUrl + "/login?error="
                    + URLEncoder.encode(errorMessage, StandardCharsets.UTF_8) + "&provider=KAKAO")
                    .build();
        }
    }

    /**
     * 모바일 OAuth2 콜백 처리 (Deep Link에서 받은 정보로 세션 복원) POST /api/auth/oauth2/callback Deep Link에서 받은
     * userId로 사용자 정보 조회 및 세션 설정
     */
    @PostMapping("/oauth2/callback")
    public ResponseEntity<?> mobileOAuth2Callback(@RequestBody Map<String, Object> requestBody,
            HttpServletRequest request, HttpSession session) {
        try {
            String provider = (String) requestBody.get("provider");
            String sessionId = (String) requestBody.get("sessionId"); // Deep Link에서 받은 세션 ID
            String userIdStr = (String) requestBody.get("userId"); // Deep Link에서 받은 userId

            log.info("모바일 OAuth2 콜백 요청: provider={}, sessionId={}, userId={}", provider,
                    sessionId != null ? "있음" : "없음", userIdStr);

            // userId로 사용자 정보 조회
            if (userIdStr == null || userIdStr.isEmpty()) {
                log.error("모바일 OAuth2 콜백 - userId가 없습니다.");
                return ResponseEntity.status(400)
                        .body(Map.of("success", false, "message", "사용자 ID가 필요합니다."));
            }

            Long userId;
            try {
                userId = Long.parseLong(userIdStr);
            } catch (NumberFormatException e) {
                log.error("모바일 OAuth2 콜백 - userId 파싱 실패: {}", userIdStr);
                return ResponseEntity.status(400)
                        .body(Map.of("success", false, "message", "잘못된 사용자 ID입니다."));
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
                        log.info("모바일 OAuth2 콜백 - 새 세션 생성 (기존 세션 ID 불일치): sessionId={}",
                                session.getId());
                    }
                } catch (Exception e) {
                    // 기존 세션 조회 실패 시 새 세션 생성
                    session = request.getSession(true);
                    log.info("모바일 OAuth2 콜백 - 새 세션 생성 (기존 세션 조회 실패): sessionId={}",
                            session.getId());
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

            log.info("모바일 OAuth2 콜백 - 세션 설정 완료: userId={}, role={}, sessionId={}", user.getId(),
                    user.getRole(), session.getId());

            // 사용자 정보 반환
            Map<String, Object> userInfo = Map.of("id", user.getId(), "email", user.getEmail(),
                    "name", user.getName() != null ? user.getName() : "", "nickname",
                    user.getNickname() != null ? user.getNickname() : "", "role",
                    user.getRole().name(), "profileImageUrl",
                    user.getProfileImageUrl() != null ? user.getProfileImageUrl() : "");

            Map<String, Object> data = new HashMap<>();
            data.put("sessionId", session.getId());
            data.put("user", userInfo);

            return success("로그인 성공", data);
        } catch (Exception e) {
            log.error("모바일 OAuth2 콜백 처리 실패", e);
            throw new RuntimeException("예상치 못한 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * SpringSecurity 인증 컨텍스트에 사용자 정보 설정 OAuth2 로그인 후 API 호출 시 인증이 유지되도록 함
     */
    private void setSpringSecurityAuthentication(User user) {
        try {
            // 사용자 권한 설정
            List<SimpleGrantedAuthority> authorities =
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

            // Authentication 객체 생성
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(user.getEmail(), null, authorities);

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

    /**
     * 네이티브 SDK 로그인 (모바일 앱 전용) Deep Link 없이 accessToken으로 직접 로그인
     */
    @PostMapping("/social-login")
    public ResponseEntity<Map<String, Object>> socialLoginWithAccessToken(
            @RequestBody Map<String, Object> requestBody, HttpServletRequest request,
            HttpServletResponse response, HttpSession session) {
        try {
            String provider = (String) requestBody.get("provider");
            String accessToken = (String) requestBody.get("accessToken");

            // userId는 Long 또는 String으로 올 수 있으므로 안전하게 처리
            String userIdStr = null;
            Object userIdObj = requestBody.get("userId");
            if (userIdObj != null) {
                if (userIdObj instanceof Long) {
                    userIdStr = String.valueOf((Long) userIdObj);
                } else if (userIdObj instanceof String) {
                    userIdStr = (String) userIdObj;
                } else {
                    userIdStr = String.valueOf(userIdObj);
                }
            }

            String email = (String) requestBody.get("email");
            String nickname = (String) requestBody.get("nickname");
            String profileImage = (String) requestBody.get("profileImage");

            log.info("네이티브 SDK 로그인 요청: provider={}, userId={}, email={}", provider, userIdStr,
                    email);

            if (provider == null || accessToken == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "provider와 accessToken이 필요합니다."));
            }

            // OAuth2 서비스 가져오기
            OAuth2Service oauth2Service = oauth2FactoryService.getOAuth2Service(provider);
            if (oauth2Service == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "지원하지 않는 소셜 플랫폼입니다."));
            }

            // accessToken으로 사용자 정보 조회
            SocialUserInfo socialUserInfo = oauth2Service.getUserInfo(accessToken);
            socialUserInfo.setProvider(provider);
            socialUserInfo.setAccessToken(accessToken);
            socialUserInfo.normalizeData();

            // 기존 사용자 확인
            Long existingUserId =
                    oauth2Service.findExistingUserByProviderId(socialUserInfo.getProviderUserId());

            if (existingUserId == null) {
                // 이메일로도 확인 (멀티 테넌트 사용자 고려)
                List<User> users = userRepository.findAllByEmail(socialUserInfo.getEmail());
                existingUserId = users.isEmpty() ? null : users.get(0).getId();
            }

            if (existingUserId == null) {
                // 신규 사용자 - 회원가입 필요
                return ResponseEntity.ok(Map.of("success", false, "requiresSignup", true,
                        "socialUserInfo",
                        Map.of("email", socialUserInfo.getEmail(), "nickname",
                                socialUserInfo.getNickname() != null ? socialUserInfo.getNickname()
                                        : "",
                                "provider", provider, "socialId",
                                socialUserInfo.getProviderUserId()),
                        "message", "간편 회원가입이 필요합니다."));
            }

            // 기존 사용자 로그인
            User user = userRepository.findById(existingUserId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            // 세션에 사용자 정보 저장 (다른 메서드와 동일한 방식 사용)
            SessionUtils.setCurrentUser(session, user);

            // 세션 저장 확인 (iOS 디버깅용)
            User savedUser = SessionUtils.getCurrentUser(session);
            log.info("🍎 iOS - 세션에 사용자 저장 확인: sessionId={}, savedUser={}", session.getId(),
                    savedUser != null ? savedUser.getEmail() : "null");

            // SecurityContext 설정
            setSpringSecurityAuthentication(user);

            // 세션에 SecurityContext 저장 (명시적으로 - 다른 메서드와 동일)
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

            // 세션 무효화 시간 설정 (1시간)
            session.setMaxInactiveInterval(3600);

            // UserSession 엔티티 생성 (데이터베이스에 저장하여 SessionBasedAuthenticationFilter에서 조회 가능하도록)
            // 모바일 앱은 중복 로그인 체크를 우회하여 항상 새 세션을 생성
            try {
                String clientIp = request.getRemoteAddr();
                String userAgent = request.getHeader("User-Agent");

                // 모바일 앱인지 확인 (User-Agent로 판단)
                boolean isMobileApp = userAgent != null && (userAgent.contains("MindGardenMobile")
                        || userAgent.contains("ReactNative") || userAgent.contains("okhttp") || // Android
                        userAgent.contains("CFNetwork") // iOS
                );

                if (isMobileApp) {
                    // 모바일 앱: 기존 세션을 비활성화하지 않고 새 세션만 생성
                    // (중복 로그인 체크 로직 우회)
                    userSessionService.createSession(user, session.getId(), clientIp, userAgent,
                            "SOCIAL", provider);
                    log.info("🍎 iOS - UserSession 엔티티 생성 완료 (모바일 앱): sessionId={}, userId={}",
                            session.getId(), user.getId());
                } else {
                    // 웹: 기존 로직 사용 (중복 로그인 체크 포함)
                    userSessionService.createSession(user, session.getId(), clientIp, userAgent,
                            "SOCIAL", provider);
                    log.info("✅ UserSession 엔티티 생성 완료 (웹): sessionId={}, userId={}",
                            session.getId(), user.getId());
                }
            } catch (Exception e) {
                log.warn("⚠️ UserSession 엔티티 생성 실패 (무시): sessionId={}, error={}", session.getId(),
                        e.getMessage());
            }

            // Phase 3: 확장된 JWT 토큰 생성 (tenantId, branchId, permissions 포함)
            // 권한 조회 시 예외 발생해도 빈 리스트 반환 (트랜잭션 롤백 오류 방지)
            java.util.List<String> permissions;
            try {
                permissions = dynamicPermissionService.getUserPermissionsAsStringList(user);
            } catch (Exception e) {
                log.warn("⚠️ 권한 조회 실패 (빈 리스트 반환): userId={}, 오류={}", user.getId(), e.getMessage());
                permissions = new java.util.ArrayList<>();
            }
            String jwtToken = jwtService.generateToken(user, permissions);
            String refreshToken = jwtService.generateRefreshToken(user.getEmail());

            log.info("네이티브 SDK 로그인 성공: userId={}, email={}, role={}, sessionId={}", user.getId(),
                    user.getEmail(), user.getRole(), session.getId());

            // iOS 모바일 앱: Set-Cookie 헤더로 JSESSIONID를 명시적으로 설정
            // (Spring이 자동으로 설정하지만, iOS에서는 명시적으로 설정하는 것이 더 안전)
            response.setHeader("Set-Cookie", String
                    .format("JSESSIONID=%s; Path=/; HttpOnly; SameSite=Lax", session.getId()));

            return ResponseEntity.ok(Map.of("success", true, "user",
                    Map.of("id", user.getId(), "email", user.getEmail(), "name", user.getName(),
                            "nickname", user.getNickname() != null ? user.getNickname() : "",
                            "role", user.getRole().name(), "profileImageUrl",
                            user.getProfileImageUrl() != null ? user.getProfileImageUrl() : ""),
                    "accessToken", jwtToken, "refreshToken", refreshToken, "sessionId",
                    session.getId(), "message", "로그인 성공"));
        } catch (Exception e) {
            log.error("네이티브 SDK 로그인 오류:", e);
            return ResponseEntity.status(500).body(
                    Map.of("success", false, "message", "로그인 처리 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 서브도메인에서 tenant_id 추출
     *
     * @param request HTTP 요청
     * @return tenant_id 또는 null
     */
    private String extractTenantIdFromSubdomain(HttpServletRequest request) {
        try {
            String host = request.getHeader("Host");
            if (host == null || host.isEmpty()) {
                host = request.getHeader("X-Forwarded-Host");
            }

            if (host == null || host.isEmpty()) {
                return null;
            }

            // 포트 제거
            String hostWithoutPort = host.split(":")[0];

            // 서브도메인 추출
            String extractedSubdomain = null;

            // 로컬 환경 지원: localhost 서브도메인 패턴 (우선 처리)
            if (hostWithoutPort.endsWith(".localhost")) {
                extractedSubdomain = hostWithoutPort.replace(".localhost", "");
            } else if (hostWithoutPort.endsWith(".127.0.0.1")) {
                extractedSubdomain = hostWithoutPort.replace(".127.0.0.1", "");
            } else if (hostWithoutPort.contains("localhost") && hostWithoutPort.contains(".")) {
                // mindgarden.localhost 형식
                int dotIndex = hostWithoutPort.indexOf('.');
                if (dotIndex > 0) {
                    extractedSubdomain = hostWithoutPort.substring(0, dotIndex);
                }
            } else {
                // 프로덕션 도메인 패턴 (coresolution 도메인 우선, 기존 m-garden 호환성 유지)
                String[] patterns = {"\\.dev\\.core-solution\\.co\\.kr$",
                        "\\.core-solution\\.co\\.kr$", "\\.dev\\.m-garden\\.co\\.kr$", // 기존 호환성 유지
                        "\\.m-garden\\.co\\.kr$" // 기존 호환성 유지
                };

                for (String pattern : patterns) {
                    if (hostWithoutPort.matches(".*" + pattern)) {
                        extractedSubdomain = hostWithoutPort.replaceFirst(pattern, "");
                        break;
                    }
                }
            }

            // 기본 서브도메인 제외
            if (extractedSubdomain != null) {
                final String subdomain = extractedSubdomain; // final로 선언하여 람다에서 사용 가능하도록
                String[] defaultSubdomains = {"dev", "app", "api", "staging", "www"};
                for (String defaultSub : defaultSubdomains) {
                    if (subdomain.equals(defaultSub)) {
                        return null;
                    }
                }

                // 서브도메인으로 테넌트 조회
                if (!subdomain.isEmpty()) {
                    return tenantRepository.findBySubdomainIgnoreCase(subdomain).map(tenant -> {
                        log.info("✅ 서브도메인으로 테넌트 조회 성공: subdomain={}, tenantId={}", subdomain,
                                tenant.getTenantId());
                        return tenant.getTenantId();
                    }).orElse(null);
                }
            }

            return null;
        } catch (Exception e) {
            log.error("❌ 서브도메인에서 tenant_id 추출 실패: {}", e.getMessage(), e);
            return null;
        }
    }
}
