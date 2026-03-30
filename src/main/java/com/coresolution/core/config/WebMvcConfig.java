package com.coresolution.core.config;

import com.coresolution.core.interceptor.ApiPerformanceInterceptor;
import com.coresolution.core.interceptor.TenantContextPsychInterceptor;
import com.coresolution.core.security.SecurityFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


/**
 * Web MVC 설정
 * 인터셉터, 보안 필터 및 기타 웹 관련 설정
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final ApiPerformanceInterceptor apiPerformanceInterceptor;
    private final TenantContextPsychInterceptor tenantContextPsychInterceptor;

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        // 심리검사 API: TenantContext 미설정 시 인증 principal에서 tenantId 설정
        registry.addInterceptor(tenantContextPsychInterceptor)
                .addPathPatterns("/api/v1/assessments/psych/**")
                .order(0);

        // API 성능 모니터링 인터셉터 등록
        registry.addInterceptor(apiPerformanceInterceptor)
                .addPathPatterns("/api/**") // 모든 API 경로에 적용
                .excludePathPatterns(
                    "/api/admin/performance/**", // 성능 모니터링 API는 제외 (무한 루프 방지)
                    "/api/admin/security/**",    // 보안 모니터링 API 제외
                    "/api/health/**",            // 헬스체크 API 제외
                    "/api/actuator/**"           // Actuator 엔드포인트 제외
                );
    }

    /**
     * 보안 필터 등록
     * 모든 API 요청에 대해 보안 검사 수행
     */
    @Bean
    public FilterRegistrationBean<SecurityFilter> securityFilterRegistration(SecurityFilter securityFilter) {
        FilterRegistrationBean<SecurityFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(securityFilter);
        registration.addUrlPatterns("/api/*", "/api/**", "/api/v1/*", "/api/v1/**");
        registration.setName("securityFilter");
        registration.setOrder(2); // CORS 필터 다음
        return registration;
    }
}
