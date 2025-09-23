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
        log.info("🔍 필터 체인 실행 시작");
        
        try {
            // 세션에서 사용자 정보 조회
            HttpSession session = request.getSession(false);
            log.info("🔍 세션 확인: {}", session != null ? session.getId() : "null");
            
            if (session != null) {
                User user = SessionUtils.getCurrentUser(session);
                log.info("🔍 세션에서 사용자 조회: {}", user != null ? user.getEmail() : "null");
                
                if (user != null) {
                    // Spring Security 컨텍스트에 인증 정보 설정
                    Authentication authentication = createAuthentication(user);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    
                    log.info("✅ 세션 기반 인증 성공: 사용자={}, 역할={}", user.getEmail(), user.getRole());
                    
                    // SecurityContext 확인
                    Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
                    log.info("🔍 SecurityContext 인증 상태: {}", currentAuth != null && currentAuth.isAuthenticated() ? "인증됨" : "미인증");
                    log.info("🔍 SecurityContext 권한: {}", currentAuth != null ? currentAuth.getAuthorities() : "null");
                } else {
                    log.warn("⚠️ 세션에 사용자 정보 없음");
                }
            } else {
                log.warn("⚠️ 세션이 없음");
            }
            
        } catch (Exception e) {
            log.error("❌ 세션 기반 인증 필터 오류: {}", e.getMessage(), e);
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
        
        // 인증된 토큰 생성
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
            user.getEmail(), 
            null, // 비밀번호는 null로 설정 (이미 인증됨)
            authorities
        );
        
        authToken.setAuthenticated(true);
        
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
               path.equals("/api/auth/login") ||  // 로그인만 제외
               path.equals("/api/auth/register") ||  // 회원가입만 제외
               path.equals("/api/auth/forgot-password") ||  // 비밀번호 찾기만 제외
               path.startsWith("/oauth2/") ||
               path.startsWith("/api/password-reset/") ||
               path.startsWith("/api/test-simple/") ||
               path.startsWith("/api/health/") ||
               path.equals("/error") ||
               path.startsWith("/actuator/");
    }
}
