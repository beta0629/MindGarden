package com.coresolution.consultation.config;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 로컬 개발 환경 전용 설정
 * isDev 프로퍼티가 true일 때만 활성화
 */
@Slf4j
@Configuration
@Profile("local")
public class DevelopmentConfig implements WebMvcConfigurer {
    
    @Value("${isDev:false}")
    private boolean isDev;
    
    @Value("${isLocal:false}")
    private boolean isLocal;
    
    @Value("${isDevelopment:false}")
    private boolean isDevelopment;
    
    /**
     * 개발 환경에서 CORS 설정 완전 허용
     * SecurityConfig의 CORS 설정과 충돌 방지를 위해 주석 처리
     * Spring Security의 CorsFilter가 CORS를 처리하므로 여기서는 설정하지 않음
     */
    // @Override
    // public void addCorsMappings(CorsRegistry registry) {
    //     if (isDev || isLocal || isDevelopment) {
    //         registry.addMapping("/**")
    //                 .allowedOrigins("http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001")
    //                 .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
    //                 .allowedHeaders("*")
    //                 .allowCredentials(true)  // SecurityConfig와 일치
    //                 .maxAge(3600);
    //     }
    // }
    
    /**
     * 개발 환경 전용 CORS 설정
     * SecurityConfig의 corsConfigurationSource가 CORS를 처리하므로 주석 처리
     */
    // @Bean("developmentCorsConfigurationSource")
    // @Profile("local")
    // public CorsConfigurationSource developmentCorsConfigurationSource() {
    //     if (!isDev && !isLocal && !isDevelopment) {
    //         return null;
    //     }
    //     
    //     CorsConfiguration configuration = new CorsConfiguration();
    //     configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"));
    //     configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    //     configuration.setAllowedHeaders(Arrays.asList("*"));
    //     configuration.setAllowCredentials(true);  // SecurityConfig와 일치
    //     configuration.setMaxAge(3600L);
    //     
    //     UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    //     source.registerCorsConfiguration("/**", configuration);
    //     
    //     return source;
    // }
    
    /**
     * 개발 환경 확인 메서드
     */
    public boolean isDevelopmentMode() {
        return isDev || isLocal || isDevelopment;
    }
    
    /**
     * 개발 환경 로그 출력
     */
    public void logDevelopmentInfo() {
        if (isDevelopmentMode()) {
            log.info("🚀 ========================================");
            log.info("🚀 개발 환경이 활성화되었습니다!");
            System.out.println("🚀 isDev: " + isDev);
            System.out.println("🚀 isLocal: " + isLocal);
            System.out.println("🚀 isDevelopment: " + isDevelopment);
            log.info("🚀 CORS: 모든 도메인 허용");
            log.info("🚀 보안: 개발용으로 완화됨");
            log.info("🚀 ========================================");
        }
    }
}
