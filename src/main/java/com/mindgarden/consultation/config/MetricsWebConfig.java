package com.mindgarden.consultation.config;

import com.mindgarden.consultation.interceptor.MetricsInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 메트릭 인터셉터 설정
 * Week 13 Day 2: 런타임 메트릭 수집 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Configuration
@RequiredArgsConstructor
public class MetricsWebConfig implements WebMvcConfigurer {
    
    private final MetricsInterceptor metricsInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(metricsInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/api/health/**",
                        "/api/actuator/**",
                        "/api/auth/**"
                );
    }
}

