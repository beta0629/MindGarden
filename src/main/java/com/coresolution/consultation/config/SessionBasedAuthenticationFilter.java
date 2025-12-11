package com.coresolution.consultation.config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
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
            HttpSession session = request.getSession(false);
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
                
                // 래핑된 요청으로 세션 다시 조회
                // 먼저 false로 시도 (기존 세션 찾기)
                session = requestToUse.getSession(false);
                log.info("🍎 iOS - 래핑된 요청으로 세션 조회 (false): {}", session != null ? session.getId() : "null");
                
                // 세션이 없으면 데이터베이스에서 세션 정보 조회
                if (session == null && userSessionService != null) {
                    log.warn("🍎 iOS - 세션을 찾을 수 없음. 데이터베이스에서 세션 정보 조회 시도: {}", jsessionIdFromCookie);
                    try {
                        UserSession userSession = userSessionService.getActiveSession(jsessionIdFromCookie);
                        log.info("🍎 iOS - getActiveSession 결과: userSession={}", userSession != null ? "존재" : "null");
                        
                        if (userSession != null && userRepository != null) {
                            // JOIN FETCH로 user가 이미 로드되어 있지만, 안전하게 확인
                            User sessionUser = userSession.getUser();
                            log.info("🍎 iOS - userSession.getUser() 결과: user={}", sessionUser != null ? (sessionUser.getId() != null ? "userId=" + sessionUser.getId() : "id null") : "null");
                            
                            if (sessionUser != null && sessionUser.getId() != null) {
                                // userRepository에서 다시 조회하여 최신 정보 가져오기
                                User user = userRepository.findById(sessionUser.getId()).orElse(null);
                                log.info("🍎 iOS - userRepository.findById() 결과: user={}", user != null ? "존재 (userId=" + user.getId() + ", email=" + user.getEmail() + ")" : "null");
                                
                                if (user != null) {
                                    log.info("🍎 iOS - 데이터베이스에서 사용자 정보 조회 성공: userId={}, email={}", user.getId(), user.getEmail());
                                    // SecurityContext에 직접 사용자 정보 설정
                                    Authentication authentication = createAuthentication(user);
                                    SecurityContextHolder.getContext().setAuthentication(authentication);
                                    // TenantContextHolder에 tenantId 설정 (표준화 2025-12-06)
                                    if (user.getTenantId() != null && !user.getTenantId().isEmpty()) {
                                        TenantContextHolder.setTenantId(user.getTenantId());
                                        log.debug("✅ TenantContextHolder에 tenantId 설정: {}", user.getTenantId());
                                    }
                                    log.info("🍎 iOS - SecurityContext에 사용자 정보 직접 설정 완료");
                                    // 세션에도 사용자 정보 저장 (다음 요청을 위해)
                                    // 하지만 session이 null이므로 저장할 수 없음
                                    // 대신 SecurityContext에만 설정
                                } else {
                                    log.warn("🍎 iOS - 데이터베이스에서 사용자 정보를 찾을 수 없음: userId={}", sessionUser.getId());
                                }
                            } else {
                                log.warn("🍎 iOS - UserSession에 user 정보가 없음: sessionId={}, sessionUser={}", jsessionIdFromCookie, sessionUser != null ? "null user" : "null");
                            }
                        } else {
                            if (userSession == null) {
                                log.warn("🍎 iOS - 데이터베이스에서 활성 세션을 찾을 수 없음: sessionId={}", jsessionIdFromCookie);
                            } else {
                                log.warn("🍎 iOS - userRepository가 null입니다");
                            }
                        }
                    } catch (Exception e) {
                        log.error("🍎 iOS - 데이터베이스 세션 조회 실패: {}", e.getMessage(), e);
                        log.error("🍎 iOS - 예외 스택 트레이스:", e);
                    }
                }
            }
            
            if (jsessionIdFromCookie != null && session != null && !session.getId().equals(jsessionIdFromCookie)) {
                // 쿠키의 JSESSIONID와 현재 세션 ID가 일치하지 않으면
                // 세션이 제대로 연결되지 않은 것으로 간주
                log.warn("⚠️ 쿠키의 JSESSIONID({})와 현재 세션 ID({})가 일치하지 않음 - 세션 재조회 시도", jsessionIdFromCookie, session.getId());
                // 세션을 null로 설정하여 사용자 정보가 없는 것으로 처리
                session = null;
            } else if (jsessionIdFromCookie != null && session == null) {
                // 쿠키에는 JSESSIONID가 있지만 세션이 null인 경우
                // (Spring이 Cookie 헤더를 인식하지 못한 경우 또는 세션이 만료된 경우)
                // 이미 위에서 데이터베이스에서 조회하여 SecurityContext에 설정했으므로,
                // 여기서는 SecurityContext를 초기화하지 않음
                Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();
                if (existingAuth == null || !existingAuth.isAuthenticated()) {
                    log.warn("⚠️ 쿠키에 JSESSIONID({})가 있지만 세션을 찾을 수 없고, SecurityContext에도 사용자 정보가 없음", jsessionIdFromCookie);
                    SecurityContextHolder.clearContext();
                    log.warn("⚠️ 세션을 찾을 수 없어 SecurityContext 초기화");
                } else {
                    log.info("🍎 iOS - 세션은 null이지만 SecurityContext에 사용자 정보가 있음: {}", existingAuth.getName());
                }
            }
            
            // 세션이 있거나 SecurityContext에 사용자 정보가 있으면 계속 진행
            Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
            User user = null;
            
            if (session != null) {
                // iOS 디버깅: 세션 속성 확인
                java.util.Enumeration<String> attributeNames = session.getAttributeNames();
                StringBuilder attributes = new StringBuilder();
                while (attributeNames.hasMoreElements()) {
                    String attrName = attributeNames.nextElement();
                    attributes.append(attrName).append(", ");
                }
                log.info("🍎 iOS - 세션 속성 목록 (sessionId={}): {}", session.getId(), attributes.toString());
                
                user = SessionUtils.getCurrentUser(session);
                log.info("🔍 세션에서 사용자 조회: {}", user != null ? user.getEmail() : "null");
                
                // iOS 디버깅: 세션에 사용자 정보가 없으면 경고
                if (user == null && jsessionIdFromCookie != null) {
                    log.warn("🍎 iOS - ⚠️ 세션 ID는 일치하지만 세션에 사용자 정보가 없음: sessionId={}, jsessionIdFromCookie={}", 
                            session.getId(), jsessionIdFromCookie);
                    
                    // 세션은 존재하지만 사용자 정보가 없는 경우, 데이터베이스에서 조회 시도
                    if (userSessionService != null) {
                        log.warn("🍎 iOS - 세션에 사용자 정보 없음. 데이터베이스에서 세션 정보 조회 시도: {}", jsessionIdFromCookie);
                        try {
                            UserSession userSession = userSessionService.getActiveSession(jsessionIdFromCookie);
                            if (userSession != null && userRepository != null) {
                                User dbUser = userRepository.findById(userSession.getUser().getId()).orElse(null);
                                if (dbUser != null) {
                                    log.info("🍎 iOS - 데이터베이스에서 사용자 정보 조회 성공: userId={}, email={}", dbUser.getId(), dbUser.getEmail());
                                    // SecurityContext에 직접 사용자 정보 설정
                                    Authentication authentication = createAuthentication(dbUser);
                                    SecurityContextHolder.getContext().setAuthentication(authentication);
                                    // TenantContextHolder에 tenantId 설정 (표준화 2025-12-06)
                                    if (dbUser.getTenantId() != null && !dbUser.getTenantId().isEmpty()) {
                                        TenantContextHolder.setTenantId(dbUser.getTenantId());
                                        log.debug("✅ TenantContextHolder에 tenantId 설정: {}", dbUser.getTenantId());
                                    }
                                    log.info("🍎 iOS - SecurityContext에 사용자 정보 직접 설정 완료");
                                    // 세션에도 사용자 정보 저장 (다음 요청을 위해)
                                    SessionUtils.setCurrentUser(session, dbUser);
                                    session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
                                    log.info("🍎 iOS - 세션에도 사용자 정보 저장 완료");
                                    user = dbUser; // user 변수 업데이트
                                } else {
                                    log.warn("🍎 iOS - 데이터베이스에서 사용자 정보를 찾을 수 없음: userId={}", userSession.getUser().getId());
                                }
                            } else {
                                log.warn("🍎 iOS - 데이터베이스에서 활성 세션을 찾을 수 없음: sessionId={}", jsessionIdFromCookie);
                            }
                        } catch (Exception e) {
                            log.error("🍎 iOS - 데이터베이스 세션 조회 실패: {}", e.getMessage(), e);
                        }
                    }
                }
                
                // 스케줄 관련 요청에 대한 특별 로깅
                if (requestPath.contains("/schedules")) {
                    log.info("🔍 스케줄 요청 감지: path={}, method={}, user={}", 
                        requestPath, request.getMethod(), user != null ? user.getEmail() : "null");
                }
                
                // 세션이 있으면 사용자 정보를 세션에서 가져오고, 없으면 SecurityContext에서 가져옴
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
                        log.warn("⚠️ 사용자 tenantId가 없음: userId={}, email={}", user.getId(), user.getEmail());
                    }
                    
                    // 세션에 SecurityContext 저장 (명시적으로)
                    session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
                    
                    // 세션 쿠키 설정 (운영 환경 호환성)
                    if (requestPath.contains("/social-account")) {
                        log.info("🔍 소셜 계정 요청 - 세션 쿠키 설정 확인");
                        // 세션 쿠키가 제대로 설정되었는지 확인
                        String sessionId = session.getId();
                        log.info("🔍 현재 세션 ID: {}", sessionId);
                        
                        // 세션 만료 시간 설정 (1시간)
                        session.setMaxInactiveInterval(3600);
                        log.info("🔍 세션 만료 시간 설정: 3600초");
                    }
                    
                    log.info("✅ 세션 기반 인증 성공: 사용자={}, 역할={}, tenantId={}", user.getEmail(), user.getRole(), user.getTenantId());
                    
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
            case TENANT_ADMIN:
            case PRINCIPAL:
            case OWNER:
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
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
            case PARENT:
                authorities.add(new SimpleGrantedAuthority("ROLE_PARENT"));
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
