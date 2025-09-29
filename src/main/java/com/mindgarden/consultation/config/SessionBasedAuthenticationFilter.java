package com.mindgarden.consultation.config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
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

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        log.info("🔍 SessionBasedAuthenticationFilter 실행: {}", requestPath);
        
        // 소셜 계정 관련 요청에 대한 특별 로깅
        if (requestPath.contains("/social-account")) {
            log.info("🔍 소셜 계정 요청 감지: {}", requestPath);
        }
        
        try {
            // 세션에서 사용자 정보 조회
            HttpSession session = request.getSession(false);
            log.info("🔍 세션 확인: {}", session != null ? session.getId() : "null");
            
            if (session != null) {
                User user = SessionUtils.getCurrentUser(session);
                log.info("🔍 세션에서 사용자 조회: {}", user != null ? user.getEmail() : "null");
                
                if (user != null) {
                    // 기존 인증 정보 확인
                    Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();
                    log.info("🔍 기존 인증 정보: {}", existingAuth != null ? existingAuth.getName() : "null");
                    
                    // Spring Security 컨텍스트에 인증 정보 설정
                    Authentication authentication = createAuthentication(user);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    
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
                    
                    log.info("✅ 세션 기반 인증 성공: 사용자={}, 역할={}", user.getEmail(), user.getRole());
                    
                    // SecurityContext 확인
                    Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
                    log.info("🔍 SecurityContext 인증 상태: {}", currentAuth != null && currentAuth.isAuthenticated() ? "인증됨" : "미인증");
                    log.info("🔍 SecurityContext 권한: {}", currentAuth != null ? currentAuth.getAuthorities() : "null");
                } else {
                    log.warn("⚠️ 세션에 사용자 정보 없음 - SecurityContext 초기화");
                    // 세션에 사용자 정보가 없으면 SecurityContext 초기화
                    SecurityContextHolder.clearContext();
                    if (session != null) {
                        session.removeAttribute("SPRING_SECURITY_CONTEXT");
                    }
                }
            } else {
                log.warn("⚠️ 세션이 없음 - SecurityContext 초기화");
                // 세션이 없으면 SecurityContext 초기화
                SecurityContextHolder.clearContext();
            }
            
        } catch (Exception e) {
            log.error("❌ 세션 기반 인증 필터 오류: {}", e.getMessage(), e);
            // 오류 발생 시 SecurityContext 초기화
            SecurityContextHolder.clearContext();
        }
        
        // 다음 필터로 진행
        filterChain.doFilter(request, response);
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
        
        // 추가 권한 설정
        switch (user.getRole()) {
            case HQ_MASTER:
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                authorities.add(new SimpleGrantedAuthority("ROLE_HQ_ADMIN"));
                authorities.add(new SimpleGrantedAuthority("ROLE_BRANCH_SUPER_ADMIN"));
                authorities.add(new SimpleGrantedAuthority("ROLE_CONSULTANT"));
                authorities.add(new SimpleGrantedAuthority("ROLE_CLIENT"));
                break;
            case SUPER_HQ_ADMIN:
            case HQ_ADMIN:
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                authorities.add(new SimpleGrantedAuthority("ROLE_HQ_ADMIN"));
                break;
            case BRANCH_SUPER_ADMIN:
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                authorities.add(new SimpleGrantedAuthority("ROLE_BRANCH_SUPER_ADMIN"));
                break;
            case ADMIN:
            case BRANCH_MANAGER:
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                break;
            case CONSULTANT:
                authorities.add(new SimpleGrantedAuthority("ROLE_CONSULTANT"));
                break;
            case CLIENT:
                authorities.add(new SimpleGrantedAuthority("ROLE_CLIENT"));
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
        return path.startsWith("/static/") ||
               path.startsWith("/css/") ||
               path.startsWith("/js/") ||
               path.startsWith("/images/") ||
               path.startsWith("/fonts/") ||
               path.equals("/favicon.ico") ||
               path.equals("/robots.txt") ||
               path.equals("/manifest.json") ||
               path.startsWith("/api/auth/") ||  // 모든 인증 관련 API 제외
               path.startsWith("/oauth2/") ||
               path.startsWith("/api/password-reset/") ||
               path.startsWith("/api/health/") ||
               path.equals("/error") ||
               path.startsWith("/actuator/");
    }
}
