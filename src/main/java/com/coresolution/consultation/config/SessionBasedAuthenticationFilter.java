package com.coresolution.consultation.config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

/**
 * 세션 기반 인증 필터
 * 기존 세션 시스템과 Spring Security를 연동
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@Component
public class SessionBasedAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired(required = false)
    private UserSessionService userSessionService;
    
    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired
    private SessionTimeoutProperties sessionTimeoutProperties;

    @Autowired(required = false)
    private SessionCookieSupport sessionCookieSupport;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        log.info("🔍 SessionBasedAuthenticationFilter 실행: {}", requestPath);
        
        // 소셜 계정 관련 요청에 대한 특별 로깅
        if (requestPath.contains("/social-account")) {
            log.info("🔍 소셜 계정 요청 감지: {}", requestPath);
        }
        
        HttpServletRequest requestToUse = request; // 기본값은 원본 요청
        
        try {
            // 쿠키에서 JSESSIONID 확인
            jakarta.servlet.http.Cookie[] cookies = request.getCookies();
            String jsessionIdFromCookie = null;
            if (cookies != null) {
                for (jakarta.servlet.http.Cookie cookie : cookies) {
                    if ("JSESSIONID".equals(cookie.getName())) {
                        jsessionIdFromCookie = cookie.getValue();
                        break;
                    }
                }
            }
            
            // Cookie 헤더에서도 확인 (React Native는 Cookie 헤더로 전달)
            // iOS 모바일 앱의 경우 Cookie 헤더로 JSESSIONID를 전달하므로,
            // request.getCookies()가 비어있을 수 있음
            String cookieHeader = request.getHeader("Cookie");
            if (cookieHeader != null && cookieHeader.contains("JSESSIONID")) {
                // iOS에서 Cookie 헤더가 이상하게 파싱될 수 있음 (예: "값,JSESSIONID=값" 형식)
                // 정규식으로 JSESSIONID= 다음의 값을 추출 (가장 안전한 방법)
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("JSESSIONID=([A-F0-9]{32})");
                java.util.regex.Matcher matcher = pattern.matcher(cookieHeader);
                
                // 모든 매칭을 찾아서 마지막 것 사용 (가장 정확한 값)
                String lastMatch = null;
                while (matcher.find()) {
                    lastMatch = matcher.group(1);
                    log.info("🔍 JSESSIONID 패턴 매칭 발견: {}", lastMatch);
                }
                
                if (lastMatch != null) {
                    jsessionIdFromCookie = lastMatch;
                    log.info("🔍 정규식으로 JSESSIONID 최종 추출: {}", jsessionIdFromCookie);
                    
                    // iOS 모바일 앱: Cookie 헤더에서 JSESSIONID를 찾았지만 request.getCookies()가 비어있는 경우
                    // request.getSession(false)가 JSESSIONID를 인식하지 못하므로,
                    // 쿠키를 수동으로 추가하여 Spring이 세션을 찾을 수 있도록 함
                    if (cookies == null || cookies.length == 0) {
                        // HttpServletRequest를 래핑하여 쿠키를 추가할 수 없으므로,
                        // 대신 request.getSession(true)를 호출하여 세션을 생성하고,
                        // JSESSIONID가 일치하는지 확인
                        // 하지만 이 방법도 작동하지 않을 수 있으므로, 다른 방법을 시도
                        log.info("🍎 iOS - Cookie 헤더에서 JSESSIONID 발견, 하지만 request.getCookies()가 비어있음");
                    }
                } else {
                    // 정규식 실패 시 기존 방식 사용
                    String[] parts = cookieHeader.split(";");
                    for (String part : parts) {
                        part = part.trim();
                        if (part.startsWith("JSESSIONID=")) {
                            String value = part.substring("JSESSIONID=".length()).trim();
                            // 값에 콤마가 포함되어 있으면 첫 번째 값만 사용
                            if (value.contains(",")) {
                                value = value.split(",")[0].trim();
                            }
                            jsessionIdFromCookie = value;
                            break;
                        }
                    }
                }
            }
            if (jsessionIdFromCookie != null) {
                log.info("🔍 쿠키에서 JSESSIONID 발견: {}", jsessionIdFromCookie);
            } else {
                log.warn("⚠️ 쿠키에서 JSESSIONID를 찾을 수 없음. Cookie 헤더: {}", cookieHeader);
            }
            
            // 세션에서 사용자 정보 조회
            // iOS 모바일 앱의 경우 Cookie 헤더로 JSESSIONID를 전달하므로,
            // request.getSession(false)가 쿠키를 인식하지 못할 수 있음
            // 따라서 쿠키의 JSESSIONID와 현재 세션 ID를 비교하여 일치하지 않으면
            // 세션을 강제로 생성하지 않도록 함
            HttpSession session = openSessionIfUsable(request);
            log.info("🔍 세션 확인: {}", session != null ? session.getId() : "null");
            
            // iOS 모바일 앱: Cookie 헤더에서 JSESSIONID를 찾았지만 request.getCookies()가 비어있는 경우
            // Spring이 Cookie 헤더를 자동으로 파싱하지 않으므로, HttpServletRequest를 래핑하여 쿠키를 추가
            // 웹에는 영향이 없도록 User-Agent로 모바일 앱인지 확인
            String userAgent = request.getHeader("User-Agent");
            boolean isMobileApp = userAgent != null && (
                userAgent.contains("MindGardenMobile") || 
                userAgent.contains("ReactNative") ||
                userAgent.contains("okhttp") || // Android
                userAgent.contains("CFNetwork") // iOS
            );
            
            if (isMobileApp && jsessionIdFromCookie != null && (cookies == null || cookies.length == 0)) {
                log.info("🍎 iOS - 모바일 앱 감지, Cookie 헤더에서 JSESSIONID 발견, request.getCookies()가 비어있음. 래핑하여 쿠키 추가");
                requestToUse = new CookieRequestWrapper(request, jsessionIdFromCookie);
                session = openSessionIfUsable(requestToUse);
                log.info("🍎 iOS - 래핑된 요청으로 세션 조회 (false): {}", session != null ? session.getId() : "null");
            }

            // 쿠키 JSESSIONID와 컨테이너 세션 ID 불일치 → 잘못된 신규 세션으로 간주 (복원 전)
            if (jsessionIdFromCookie != null && session != null
                    && !session.getId().equals(jsessionIdFromCookie)) {
                log.warn("⚠️ 쿠키의 JSESSIONID({})와 현재 세션 ID({})가 일치하지 않음 - 세션 무효 처리 후 DB 복원 시도",
                        jsessionIdFromCookie, session.getId());
                session = null;
            }

            // WEB·iOS 공통: 쿠키 JSESSIONID 있으나 HttpSession 없음 → user_sessions 로 복원
            // (Blue/Green 전환 후 인메모리 세션 유실 / Redis miss / iOS Cookie 헤더 경로)
            if (jsessionIdFromCookie != null && session == null) {
                HttpSession hydratedSession = hydrateFromActiveUserSession(
                        requestToUse, jsessionIdFromCookie, true);
                if (hydratedSession != null) {
                    session = hydratedSession;
                    // 복원으로 새 HttpSession ID 가 발급될 수 있음 — SESSION_ID 속성으로 DB 게이트 유지
                } else {
                    Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();
                    if (existingAuth == null || !existingAuth.isAuthenticated()) {
                        log.warn("⚠️ 쿠키에 JSESSIONID({})가 있지만 세션/DB 복원 실패 — SecurityContext 초기화",
                                jsessionIdFromCookie);
                        SecurityContextHolder.clearContext();
                    }
                }
            }
            
            // 세션이 있거나 SecurityContext에 사용자 정보가 있으면 계속 진행
            Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
            User user = null;
            
            if (session != null) {
                java.util.Enumeration<String> attributeNames;
                try {
                    attributeNames = session.getAttributeNames();
                } catch (IllegalStateException invalidated) {
                    log.warn("무효 세션 속성 조회 생략: {}", invalidated.getMessage());
                    session = null;
                    attributeNames = null;
                }
                if (attributeNames == null) {
                    user = null;
                } else {
                // iOS 디버깅: 세션 속성 확인
                StringBuilder attributes = new StringBuilder();
                while (attributeNames.hasMoreElements()) {
                    String attrName = attributeNames.nextElement();
                    attributes.append(attrName).append(", ");
                }
                log.info("🍎 iOS - 세션 속성 목록 (sessionId={}): {}", session.getId(), attributes.toString());
                
                user = SessionUtils.getCurrentUser(session);
                log.info("🔍 세션에서 사용자 조회: {}", user != null ? EmailLogMasking.maskForLog(user.getEmail()) : "null");
                
                // 세션은 존재하지만 사용자 정보가 없는 경우 — user_sessions 로 속성 주입
                if (user == null && jsessionIdFromCookie != null && userSessionService != null) {
                    log.warn("⚠️ 세션에 사용자 정보 없음. user_sessions 복원 시도: {}", jsessionIdFromCookie);
                    try {
                        UserSession userSession = userSessionService.getActiveSession(jsessionIdFromCookie);
                        if (userSession != null && userSession.getUser() != null) {
                            User dbUser = reloadUserFromRepository(
                                    userSession.getUser().getId(), userSession.getUser());
                            if (dbUser != null && applyHydratedUser(dbUser, session, jsessionIdFromCookie)) {
                                user = dbUser;
                            }
                        }
                    } catch (Exception e) {
                        log.error("❌ 데이터베이스 세션 조회 실패: {}", e.getMessage(), e);
                    }
                }
                
                // 스케줄 관련 요청에 대한 특별 로깅
                if (requestPath.contains("/schedules")) {
                    log.info("🔍 스케줄 요청 감지: path={}, method={}, user={}", 
                        requestPath, request.getMethod(), user != null ? EmailLogMasking.maskForLog(user.getEmail()) : "null");
                }
                
                // 세션이 있으면 사용자 정보를 세션에서 가져오고, 없으면 SecurityContext에서 가져옴
                if (session != null && user != null) {
                    // 중복 로그인 cleanup 후: user_sessions 비활성이면 HttpSession User 를 신뢰하지 않음
                    if (!isUserSessionActiveInDb(session, jsessionIdFromCookie)) {
                        log.warn(
                            "⚠️ user_sessions 비활성 — SecurityContext/세션 클리어: httpSessionId={}",
                            session.getId());
                        clearAuthenticationForInactiveSession(session, request, response);
                        user = null;
                        session = null;
                    }
                }

                if (session != null && user != null) {
                    // 기존 인증 정보 확인
                    Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();
                    log.info("🔍 기존 인증 정보: {}", existingAuth != null ? existingAuth.getName() : "null");
                    
                    // Spring Security 컨텍스트에 인증 정보 설정
                    Authentication authentication = createAuthentication(user);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    
                    // TenantContextHolder에 tenantId 설정 (표준화 2025-12-06)
                    if (user.getTenantId() != null && !user.getTenantId().isEmpty()) {
                        TenantContextHolder.setTenantId(user.getTenantId());
                        log.debug("✅ TenantContextHolder에 tenantId 설정: {}", user.getTenantId());
                    } else {
                        log.warn("⚠️ 사용자 tenantId가 없음: userId={}, email={}", user.getId(), EmailLogMasking.maskForLog(user.getEmail()));
                    }
                    
                    // 세션에 SecurityContext 저장 (명시적으로)
                    session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
                    
                    // HttpSession·쿠키·DB user_sessions 동일 SSOT로 활동 슬라이딩
                    slideDbSessionIfNeeded(session, jsessionIdFromCookie);
                    
                    // 세션 쿠키 설정 (운영 환경 호환성)
                    if (requestPath.contains("/social-account")) {
                        log.info("🔍 소셜 계정 요청 - 세션 쿠키 설정 확인");
                        // 세션 쿠키가 제대로 설정되었는지 확인
                        String sessionId = session.getId();
                        log.info("🔍 현재 세션 ID: {}", sessionId);
                        
                        session.setMaxInactiveInterval(sessionTimeoutProperties.getTimeoutSeconds());
                        log.info("🔍 세션 만료 시간 설정: {}초", sessionTimeoutProperties.getTimeoutSeconds());
                    }
                    
                    log.info("✅ 세션 기반 인증 성공: 사용자={}, 역할={}, tenantId={}", EmailLogMasking.maskForLog(user.getEmail()), user.getRole(), user.getTenantId());
                    
                    // SecurityContext 확인
                    Authentication authAfter = SecurityContextHolder.getContext().getAuthentication();
                    log.info("🔍 SecurityContext 인증 상태: {}", authAfter != null && authAfter.isAuthenticated() ? "인증됨" : "미인증");
                    log.info("🔍 SecurityContext 권한: {}", authAfter != null ? authAfter.getAuthorities() : "null");
                } else if (session != null) {
                    log.warn("⚠️ 세션에 사용자 정보 없음 - SecurityContext 초기화");
                    // 세션에 사용자 정보가 없으면 SecurityContext 초기화
                    SecurityContextHolder.clearContext();
                    if (session != null) {
                        session.removeAttribute("SPRING_SECURITY_CONTEXT");
                    }
                }
                }
            }
            
            // 세션이 없지만 SecurityContext에 사용자 정보가 있는 경우 (데이터베이스에서 조회한 경우)
            if (session == null && currentAuth != null && currentAuth.isAuthenticated()) {
                log.info("🍎 iOS - 세션은 null이지만 SecurityContext에 사용자 정보가 있음: {}", currentAuth.getName());
                // 이미 SecurityContext에 사용자 정보가 설정되어 있으므로 추가 작업 불필요
            } else if (session == null && (currentAuth == null || !currentAuth.isAuthenticated())) {
                log.warn("⚠️ 세션이 없고 SecurityContext에도 사용자 정보가 없음 - SecurityContext 초기화");
                SecurityContextHolder.clearContext();
            }
            
        } catch (Exception e) {
            log.error("❌ 세션 기반 인증 필터 오류: {}", e.getMessage(), e);
            // 오류 발생 시 SecurityContext 초기화
            SecurityContextHolder.clearContext();
        }
        
        // 다음 필터로 진행 (모바일 앱인 경우 래핑된 요청 사용, 웹은 원본 요청 사용)
        filterChain.doFilter(requestToUse, response);
    }

    /**
     * {@code user_sessions} 에 활성 행이 있는지 확인한다.
     * DB sessionId 속성 → 쿠키 JSESSIONID → HttpSession.getId() 순으로 조회 키를 고른다.
     *
     * @param session HttpSession
     * @param jsessionIdFromCookie 쿠키에서 추출한 JSESSIONID (nullable)
     * @return 활성 세션이면 true. userSessionService 미주입 시 true(검증 스킵)
     */
    private boolean isUserSessionActiveInDb(HttpSession session, String jsessionIdFromCookie) {
        if (userSessionService == null || session == null) {
            return true;
        }
        String dbSessionId = resolveDbSessionId(session, jsessionIdFromCookie);
        if (dbSessionId == null || dbSessionId.isBlank()) {
            return false;
        }
        try {
            UserSession active = userSessionService.getActiveSession(dbSessionId);
            return active != null;
        } catch (Exception e) {
            log.warn("⚠️ user_sessions 활성 검증 실패(통과 처리하지 않음): sessionId={}, error={}",
                dbSessionId, e.getMessage());
            return false;
        }
    }

    /**
     * 인증된 요청에서 DB {@code user_sessions} 를 HttpSession TTL과 동일 SSOT로 슬라이딩한다.
     * CookieRenewal 과 같은 {@link SessionConstants#SESSION_SLIDING_THROTTLE_SECONDS} 스로틀.
     * 실패해도 인증은 유지한다(다음 요청에서 재시도).
     *
     * @param session HttpSession (nullable — 모바일 DB 복원 경로)
     * @param jsessionIdFromCookie 쿠키 JSESSIONID (nullable)
     */
    private void slideDbSessionIfNeeded(HttpSession session, String jsessionIdFromCookie) {
        if (userSessionService == null) {
            return;
        }
        String dbSessionId = resolveDbSessionId(session, jsessionIdFromCookie);
        if (dbSessionId == null || dbSessionId.isBlank()) {
            return;
        }
        try {
            userSessionService.slideActiveSession(
                    dbSessionId,
                    sessionTimeoutProperties.getTimeoutMinutes(),
                    SessionConstants.SESSION_SLIDING_THROTTLE_SECONDS);
        } catch (Exception e) {
            log.warn("⚠️ user_sessions 슬라이딩 실패(인증 유지): sessionId={}, error={}",
                    dbSessionId, e.getMessage());
        }
    }

    /**
     * DB {@code user_sessions.session_id} 조회 키를 결정한다.
     *
     * @param session HttpSession (nullable)
     * @param jsessionIdFromCookie 쿠키 JSESSIONID (nullable)
     * @return 세션 ID 또는 null
     */
    private String resolveDbSessionId(HttpSession session, String jsessionIdFromCookie) {
        if (session != null) {
            try {
                Object attr = session.getAttribute(SessionConstants.SESSION_ID);
                if (attr instanceof String && !((String) attr).isBlank()) {
                    return (String) attr;
                }
            } catch (IllegalStateException e) {
                return null;
            }
            if (jsessionIdFromCookie != null && !jsessionIdFromCookie.isBlank()) {
                return jsessionIdFromCookie;
            }
            return session.getId();
        }
        return jsessionIdFromCookie;
    }

    /**
     * 비활성 DB 세션에 대해 SecurityContext·세션 사용자 속성을 제거하고 HttpSession 을 invalidate 한다.
     * 죽은 JSESSIONID 쿠키는 Max-Age=0 으로 즉시 삭제하고, current-user 가 errorCode 를 붙일 수 있도록
     * 요청 속성을 남긴다.
     *
     * @param session HttpSession
     * @param request 요청 (속성·쿠키 만료용)
     * @param response 응답 (Set-Cookie 만료)
     */
    private void clearAuthenticationForInactiveSession(HttpSession session,
                                                       HttpServletRequest request,
                                                       HttpServletResponse response) {
        SecurityContextHolder.clearContext();
        if (request != null) {
            request.setAttribute(
                    SessionManagementConstants.REQUEST_ATTR_SESSION_TERMINATED_DUPLICATE,
                    Boolean.TRUE);
        }
        expireJsessionCookie(request, response);
        if (session == null) {
            return;
        }
        try {
            session.removeAttribute(SessionConstants.USER_OBJECT);
            session.removeAttribute(SessionConstants.SESSION_ID);
            session.removeAttribute("SPRING_SECURITY_CONTEXT");
            session.invalidate();
        } catch (IllegalStateException e) {
            log.debug("세션이 이미 무효화됨");
        }
    }

    /**
     * 브라우저에 남은 죽은 JSESSIONID 를 Max-Age=0 으로 삭제한다.
     *
     * @param request  Secure/Domain 판단용 (nullable)
     * @param response Set-Cookie 대상 (nullable이면 스킵)
     */
    private void expireJsessionCookie(HttpServletRequest request, HttpServletResponse response) {
        if (response == null || sessionCookieSupport == null) {
            return;
        }
        try {
            response.addHeader(
                    HttpHeaders.SET_COOKIE,
                    sessionCookieSupport.buildExpiredJsessionSetCookieHeader(request));
        } catch (Exception e) {
            log.warn("⚠️ JSESSIONID 만료 Set-Cookie 실패: {}", e.getMessage());
        }
    }

    private HttpSession openSessionIfUsable(HttpServletRequest request) {
        try {
            return request.getSession(false);
        } catch (IllegalStateException invalidated) {
            log.warn("무효 세션 무시 후 익명으로 진행: {}", invalidated.getMessage());
            return null;
        }
    }

    /**
     * 활성 {@code user_sessions} 행으로 SecurityContext(+선택 HttpSession) 를 복원한다.
     *
     * <p>WEB Blue/Green 세션 유실·iOS Cookie 헤더 경로 공용. tenantId 없으면 fail-closed(복원 거부).</p>
     *
     * @param request           요청 (세션 생성 시 사용)
     * @param jsessionId        쿠키 JSESSIONID
     * @param createHttpSession true 이면 새 HttpSession 생성 후 SessionUtils.setCurrentUser
     * @return 복원된 HttpSession (성공 시), 실패 시 null
     */
    private HttpSession hydrateFromActiveUserSession(
            HttpServletRequest request,
            String jsessionId,
            boolean createHttpSession) {
        if (jsessionId == null || jsessionId.isBlank()
                || userSessionService == null || userRepository == null || request == null) {
            return null;
        }
        try {
            UserSession userSession = userSessionService.getActiveSession(jsessionId);
            if (userSession == null || userSession.getUser() == null
                    || userSession.getUser().getId() == null) {
                log.warn("⚠️ user_sessions 활성 세션 없음: sessionId={}", jsessionId);
                return null;
            }
            User user = reloadUserFromRepository(userSession.getUser().getId(), userSession.getUser());
            if (user == null) {
                log.warn("⚠️ user_sessions 복원: 사용자 조회 실패 userId={}", userSession.getUser().getId());
                return null;
            }
            HttpSession session = createHttpSession ? request.getSession(true) : request.getSession(false);
            if (!applyHydratedUser(user, session, jsessionId)) {
                if (session != null && createHttpSession) {
                    try {
                        session.invalidate();
                    } catch (IllegalStateException ignored) {
                        // already invalid
                    }
                }
                return null;
            }
            log.info("✅ user_sessions 복원 성공: userId={}, createHttpSession={}",
                    user.getId(), createHttpSession);
            return session;
        } catch (Exception e) {
            log.error("❌ user_sessions 복원 실패: sessionId={}, error={}", jsessionId, e.getMessage(), e);
            return null;
        }
    }

    /**
     * 복원된 User 를 SecurityContext·(있을 경우) HttpSession 에 적용한다.
     * tenantId 없으면 fail-closed.
     *
     * @param user       복원 사용자
     * @param session    HttpSession (nullable)
     * @param jsessionId DB 세션 ID (슬라이딩·SESSION_ID 속성용)
     * @return 적용 성공 여부
     */
    private boolean applyHydratedUser(User user, HttpSession session, String jsessionId) {
        if (user == null) {
            return false;
        }
        if (user.getTenantId() == null || user.getTenantId().isEmpty()) {
            log.warn("⚠️ hydrate fail-closed: tenantId 없음 userId={} — SecurityContext 클리어",
                    user.getId());
            SecurityContextHolder.clearContext();
            return false;
        }
        Authentication authentication = createAuthentication(user);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        TenantContextHolder.setTenantId(user.getTenantId());
        if (session != null) {
            SessionUtils.setCurrentUser(session, user);
            session.setAttribute(SessionConstants.SESSION_ID, jsessionId);
            session.setAttribute(SessionConstants.TENANT_ID, user.getTenantId());
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
            session.setMaxInactiveInterval(sessionTimeoutProperties.getTimeoutSeconds());
        }
        slideDbSessionIfNeeded(session, jsessionId);
        return true;
    }

    /**
     * 세션/DB에서 가져온 사용자 ID로 최신 User를 조회한다.
     * 순서: {@link TenantContextHolder} → {@code tenantHintUser.getTenantId()} → {@code findByTenantIdAndId}.
     * 테넌트를 전혀 알 수 없을 때만 {@code findById}(크로스 테넌트 위험, WARN).
     *
     * @param userId 사용자 PK
     * @param tenantHintUser 세션·UserSession에 붙은 User( tenantId 힌트용 ), null 가능
     * @return 조회된 User 또는 null
     */
    private User reloadUserFromRepository(Long userId, User tenantHintUser) {
        if (userId == null || userRepository == null) {
            return null;
        }
        String tenantId = TenantContextHolder.getTenantId();
        if ((tenantId == null || tenantId.isEmpty()) && tenantHintUser != null
                && tenantHintUser.getTenantId() != null && !tenantHintUser.getTenantId().isEmpty()) {
            tenantId = tenantHintUser.getTenantId();
        }
        if (tenantId != null && !tenantId.isEmpty()) {
            return userRepository.findByTenantIdAndId(tenantId, userId).orElse(null);
        }
        log.warn(
            "⚠️ reloadUserFromRepository: 테넌트 힌트 없음 — findById 폴백(크로스 테넌트 위험): userId={}",
            userId);
        return userRepository.findById(userId).orElse(null);
    }
    
    /**
     * 사용자 정보로부터 Spring Security Authentication 객체 생성
     */
    private Authentication createAuthentication(User user) {
        // 사용자 권한 설정
        Collection<GrantedAuthority> authorities = getAuthorities(user);
        
        // 인증된 토큰 생성 (authorities를 생성자에 전달하면 자동으로 인증됨)
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
            user.getEmail(), 
            null, // 비밀번호는 null로 설정 (이미 인증됨)
            authorities
        );
        
        // setAuthenticated(true) 호출 제거 - 이미 authorities로 자동 인증됨
        
        // Principal에 사용자 정보 설정
        authToken.setDetails(user);
        
        return authToken;
    }
    
    /**
     * 사용자 역할에 따른 권한 생성
     */
    private Collection<GrantedAuthority> getAuthorities(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        
        // 기본 역할 권한 추가
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        
        // 추가 권한 설정 (표준화 2025-12-05: 표준 역할만 사용)
        switch (user.getRole()) {
            case ADMIN:
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                if (Boolean.TRUE.equals(user.getCounselingEnabled())) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_CONSULTANT"));
                }
                break;
            case CONSULTANT:
                authorities.add(new SimpleGrantedAuthority("ROLE_CONSULTANT"));
                break;
            case CLIENT:
                authorities.add(new SimpleGrantedAuthority("ROLE_CLIENT"));
                break;
            case STAFF:
                authorities.add(new SimpleGrantedAuthority("ROLE_STAFF"));
                break;
            default:
                log.warn("⚠️ 알 수 없는 사용자 역할: {}", user.getRole());
                break;
        }
        
        return authorities;
    }
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        
        // 정적 리소스와 공개 API만 필터링하지 않음
        // Ops Portal API는 JWT 토큰으로만 인증하므로 세션 기반 인증 필터 제외
        return path.startsWith("/static/") ||
               path.startsWith("/css/") ||
               path.startsWith("/js/") ||
               path.startsWith("/images/") ||
               path.startsWith("/fonts/") ||
               path.equals("/favicon.ico") ||
               path.equals("/robots.txt") ||
               path.equals("/manifest.json") ||
               path.startsWith("/api/auth/") ||  // 모든 인증 관련 API 제외
               path.startsWith("/api/v1/onboarding/") ||  // 온보딩 API 제외 (새로운 테넌트 등록)
               path.startsWith("/api/v1/ops/") ||  // Ops Portal API 제외 (JWT 토큰으로만 인증)
               path.startsWith("/oauth2/") ||
               path.startsWith("/api/password-reset/") ||
               path.startsWith("/api/health/") ||
               path.equals("/error") ||
               path.startsWith("/actuator/");
    }
    
    /**
     * Cookie 헤더의 JSESSIONID를 쿠키로 추가하는 HttpServletRequest 래퍼
     * iOS 모바일 앱에서 Cookie 헤더로 전달된 JSESSIONID를 Spring이 인식할 수 있도록 함
     */
    private static class CookieRequestWrapper extends HttpServletRequestWrapper {
        private final String jsessionId;
        
        public CookieRequestWrapper(HttpServletRequest request, String jsessionId) {
            super(request);
            this.jsessionId = jsessionId;
        }
        
        @Override
        public Cookie[] getCookies() {
            // 기존 쿠키 가져오기
            Cookie[] existingCookies = super.getCookies();
            List<Cookie> cookieList = new ArrayList<>();
            
            // 기존 쿠키가 있으면 추가
            if (existingCookies != null) {
                cookieList.addAll(Arrays.asList(existingCookies));
            }
            
            // JSESSIONID 쿠키가 없으면 추가
            boolean hasJSessionId = false;
            for (Cookie cookie : cookieList) {
                if ("JSESSIONID".equals(cookie.getName())) {
                    hasJSessionId = true;
                    break;
                }
            }
            
            if (!hasJSessionId && jsessionId != null) {
                Cookie jsessionCookie = new Cookie("JSESSIONID", jsessionId);
                jsessionCookie.setPath("/");
                jsessionCookie.setHttpOnly(false); // iOS에서는 HttpOnly를 false로 설정해야 할 수 있음
                jsessionCookie.setMaxAge(-1); // 브라우저 세션 동안 유지
                cookieList.add(jsessionCookie);
                log.info("🍎 iOS - CookieRequestWrapper: JSESSIONID 쿠키 추가: {}", jsessionId);
            }
            
            Cookie[] result = cookieList.toArray(new Cookie[0]);
            log.info("🍎 iOS - CookieRequestWrapper: getCookies() 반환: {} 개 쿠키", result.length);
            for (Cookie c : result) {
                log.info("🍎 iOS - CookieRequestWrapper: 쿠키 이름={}, 값={}", c.getName(), c.getValue());
            }
            return result;
        }
        
        @Override
        public HttpSession getSession(boolean create) {
            // 세션 조회 전에 쿠키가 제대로 설정되었는지 확인
            Cookie[] cookies = getCookies();
            log.info("🍎 iOS - CookieRequestWrapper: getSession({}) 호출, 쿠키 개수: {}", create, cookies.length);
            
            HttpSession session = super.getSession(create);
            if (session != null) {
                log.info("🍎 iOS - CookieRequestWrapper: 세션 찾음: {}", session.getId());
            } else {
                log.warn("🍎 iOS - CookieRequestWrapper: 세션을 찾을 수 없음 (create={})", create);
            }
            return session;
        }
    }
}
