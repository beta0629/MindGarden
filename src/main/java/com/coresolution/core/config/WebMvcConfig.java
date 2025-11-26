package com.coresolution.core.config;

import com.coresolution.core.interceptor.ApiPerformanceInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 설정
 * 인터셉터 및 기타 웹 관련 설정
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final ApiPerformanceInterceptor apiPerformanceInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // API 성능 모니터링 인터셉터 등록
        registry.addInterceptor(apiPerformanceInterceptor)
                .addPathPatterns("/api/**") // 모든 API 경로에 적용
                .excludePathPatterns(
                    "/api/admin/performance/**", // 성능 모니터링 API는 제외 (무한 루프 방지)
                    "/api/health/**",            // 헬스체크 API 제외
                    "/api/actuator/**"           // Actuator 엔드포인트 제외
                );
    }
}
