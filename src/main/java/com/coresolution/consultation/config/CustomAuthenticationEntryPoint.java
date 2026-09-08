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

        // /api/v1/onboarding/** 공개 경로는 SecurityConfig permitAll 이므로 본 EntryPoint에 도달하지 않음.
        // 민감 온보딩 경로(authenticated)는 여기서 401 을 반환해야 한다 (defense-in-depth).
        
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
