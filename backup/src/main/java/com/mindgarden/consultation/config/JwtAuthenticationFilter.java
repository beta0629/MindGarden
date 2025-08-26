package com.mindgarden.consultation.config;

import java.io.IOException;
import com.mindgarden.consultation.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * JWT 인증 필터
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private UserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        try {
            // Authorization 헤더에서 JWT 토큰 추출
            final String authHeader = request.getHeader("Authorization");
            final String jwt;
            final String userEmail;
            
            // Authorization 헤더가 없거나 Bearer로 시작하지 않으면 다음 필터로
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                filterChain.doFilter(request, response);
                return;
            }
            
            // "Bearer " 제거하고 JWT 토큰만 추출
            jwt = authHeader.substring(7);
            userEmail = jwtService.extractUsername(jwt);
            
            // 사용자 이메일이 추출되었고, 현재 인증 컨텍스트에 인증 정보가 없으면
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                // 사용자 상세 정보 로드
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                
                // JWT 토큰이 유효한지 확인
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    
                    // UsernamePasswordAuthenticationToken 생성
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                    );
                    
                    // 요청 세부 정보 설정
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // SecurityContext에 인증 정보 설정
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
            
        } catch (Exception e) {
            // JWT 처리 중 오류 발생 시 로그 기록
            logger.error("JWT 인증 필터 처리 중 오류 발생", e);
        }
        
        // 다음 필터로 요청 전달
        filterChain.doFilter(request, response);
    }
}
