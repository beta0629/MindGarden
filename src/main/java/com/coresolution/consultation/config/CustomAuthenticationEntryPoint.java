package com.coresolution.consultation.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 인증 실패 시 처리하는 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
    
    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {
        
        String requestPath = request.getRequestURI();
        
        // 프론트엔드 공개 경로는 인증 없이 접근 가능해야 함
        String[] publicPaths = {
            "/admin-dashboard-sample",
            "/design-system",
            "/design-system-v2",
            "/landing",
            "/test/notifications",
            "/test/payment",
            "/test/integration",
            "/test/ios-cards",
            "/test/design-sample",
            "/test/premium-sample",
            "/test/advanced-sample"
        };
        
        // 프론트엔드 공개 경로 체크
        if (requestPath != null) {
            for (String publicPath : publicPaths) {
                if (requestPath.equals(publicPath) || requestPath.startsWith(publicPath + "/")) {
                    log.debug("프론트엔드 공개 경로 - 인증 오류 무시: path={}", requestPath);
                    // 필터 체인을 계속 진행하도록 하기 위해 여기서는 아무것도 하지 않음
                    return;
                }
            }
        }
        
        // 온보딩 API는 인증 없이 접근 가능해야 함
        if (requestPath != null && requestPath.startsWith("/api/v1/onboarding/")) {
            // 온보딩 API는 인증 오류를 반환하지 않고 계속 진행
            // SecurityConfig의 permitAll() 설정이 적용되어야 함
            log.debug("온보딩 API 요청 - 인증 오류 무시: path={}", requestPath);
            // 필터 체인을 계속 진행하도록 하기 위해 여기서는 아무것도 하지 않음
            // 하지만 이미 401이 반환되기 전에 SecurityConfig에서 permitAll()이 적용되어야 함
            return;
        }
        
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", "인증이 필요합니다. 로그인해주세요.");
        errorResponse.put("redirectToLogin", true);
        errorResponse.put("path", requestPath);
        errorResponse.put("method", request.getMethod());
        errorResponse.put("timestamp", System.currentTimeMillis());
        
        ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(response.getOutputStream(), errorResponse);
    }
}
