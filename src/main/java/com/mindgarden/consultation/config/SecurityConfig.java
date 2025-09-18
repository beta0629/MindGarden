package com.mindgarden.consultation.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.ConcurrentSessionControlAuthenticationStrategy;
import org.springframework.security.web.authentication.session.RegisterSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Spring Security 설정 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    
    /**
     * SecurityFilterChain 설정 (환경별 보안 설정)
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CORS 및 CSRF 설정
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 세션 관리 활성화
            .sessionManagement(session -> session
                .sessionAuthenticationStrategy(sessionAuthenticationStrategy())
                .sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(3)
                .sessionRegistry(sessionRegistry())
            )
            
            // 환경별 인증 설정
            .authorizeHttpRequests(authz -> {
                // 정적 리소스 (CSS, JS, 이미지 등) - 항상 허용
                authz.requestMatchers(
                    "/static/**",
                    "/css/**", 
                    "/js/**",
                    "/images/**",
                    "/fonts/**",
                    "/favicon.ico",
                    "/robots.txt",
                    "/manifest.json",
                    "/*.png",
                    "/*.jpg",
                    "/*.jpeg",
                    "/*.gif",
                    "/*.svg",
                    "/*.css",
                    "/*.js"
                ).permitAll();
                
                // 공개 API (모든 환경에서 허용)
                authz.requestMatchers(
                    "/api/auth/**", 
                    "/oauth2/**",
                    "/api/password-reset/**",  // 비밀번호 재설정 API
                    "/api/admin/common-codes/**",  // 공통 코드 조회 (드롭다운 등에 필요)
                    "/api/test/email/**",
                    "/api/test/notification/**",  // 알림톡 테스트 API
                    "/error",
                    "/actuator/health",
                    "/actuator/info"
                ).permitAll();
                
                // 임시: 모든 요청 허용 (SpringSecurity 인증 문제 해결 전까지)
                authz.anyRequest().permitAll();
            })
            
            // 폼 로그인 비활성화
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable);
        
        return http.build();
    }
    
    /**
     * 운영 환경 여부 확인
     */
    private boolean isProductionEnvironment() {
        String activeProfile = System.getProperty("spring.profiles.active");
        String envProfile = System.getenv("SPRING_PROFILES_ACTIVE");
        
        // 시스템 프로퍼티 또는 환경변수에서 프로파일 확인
        String profile = activeProfile != null ? activeProfile : envProfile;
        
        return "prod".equals(profile) || "production".equals(profile);
    }
    
    /**
     * 세션 인증 전략 설정
     */
    @Bean
    public SessionAuthenticationStrategy sessionAuthenticationStrategy() {
        ConcurrentSessionControlAuthenticationStrategy concurrentSessionControl = 
            new ConcurrentSessionControlAuthenticationStrategy(sessionRegistry());
        
        // 운영 환경에서는 더 엄격한 세션 제어
        if (isProductionEnvironment()) {
            concurrentSessionControl.setMaximumSessions(1);  // 동시 세션 1개만 허용
            concurrentSessionControl.setExceptionIfMaximumExceeded(true);  // 초과 시 예외 발생
        } else {
            concurrentSessionControl.setMaximumSessions(3);  // 개발 환경에서는 3개까지 허용
            concurrentSessionControl.setExceptionIfMaximumExceeded(false);
        }
        
        RegisterSessionAuthenticationStrategy registerSession = 
            new RegisterSessionAuthenticationStrategy(sessionRegistry());
        
        return new CompositeSessionAuthenticationStrategy(
            Arrays.asList(concurrentSessionControl, registerSession)
        );
    }
    
    /**
     * 세션 레지스트리
     */
    @Bean
    public org.springframework.security.core.session.SessionRegistry sessionRegistry() {
        return new org.springframework.security.core.session.SessionRegistryImpl();
    }
    
    // 참고: 현재는 세션 기반 인증을 사용하고 있음
    // JWT 인증이 필요한 경우 JwtAuthenticationFilter를 구현하여 사용
    
    /**
     * CORS 설정 (환경별 설정)
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 환경별 Origin 설정
        if (isProductionEnvironment()) {
            // 운영 환경: 특정 도메인만 허용
            if (System.getenv("ALLOWED_ORIGINS") != null) {
                configuration.setAllowedOrigins(Arrays.asList(System.getenv("ALLOWED_ORIGINS").split(",")));
            } else {
                configuration.setAllowedOrigins(List.of("http://m-garden.co.kr", "https://m-garden.co.kr"));
            }
        } else {
            // 개발 환경: localhost 허용
            configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3001",
                "http://localhost:8080",
                "http://127.0.0.1:8080"
            ));
        }
        
        // 허용할 HTTP 메서드 설정
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        
        // 허용할 헤더 설정
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "Cache-Control",
            "Pragma"
        ));
        
        // 인증 정보 포함 허용
        configuration.setAllowCredentials(true);
        
        // 노출할 헤더 설정
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials"
        ));
        
        // Preflight 요청 캐시 시간 (초)
        configuration.setMaxAge(isProductionEnvironment() ? 3600L : 0L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
    
    /**
     * 비밀번호 인코더
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
    
    /**
     * 인증 매니저
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
    
    /**
     * RestTemplate Bean (prod 프로파일에서만 사용)
     */
    @Bean
    @Profile("prod")
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
