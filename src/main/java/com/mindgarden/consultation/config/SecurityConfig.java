package com.mindgarden.consultation.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
            )
            
            // 환경별 인증 설정
            .authorizeHttpRequests(authz -> {
                // 공개 API (모든 환경에서 허용)
                authz.requestMatchers(
                    "/api/auth/**", 
                    "/oauth2/**",
                    "/api/test/email/**",
                    "/error",
                    "/actuator/health",
                    "/actuator/info"
                ).permitAll();
                
                // 운영 환경에서는 나머지 API 인증 필요
                if (isProductionEnvironment()) {
                    authz.anyRequest().authenticated();
                } else {
                    // 개발 환경에서는 모든 요청 허용
                    authz.anyRequest().permitAll();
                }
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
        return "prod".equals(activeProfile) || "production".equals(activeProfile);
    }
    
    /**
     * 세션 인증 전략 설정
     */
    @Bean
    public SessionAuthenticationStrategy sessionAuthenticationStrategy() {
        ConcurrentSessionControlAuthenticationStrategy concurrentSessionControl = 
            new ConcurrentSessionControlAuthenticationStrategy(sessionRegistry());
        concurrentSessionControl.setMaximumSessions(1);
        concurrentSessionControl.setExceptionIfMaximumExceeded(false);
        
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
    
    // TODO: 운영 환경에서는 JWT 인증 필터 Bean 활성화 필요
    // /**
    //  * JWT 인증 필터
    //  */
    // @Bean
    // public JwtAuthenticationFilter jwtAuthenticationFilter() {
    //     return new JwtAuthenticationFilter();
    // }
    
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
                configuration.setAllowedOrigins(List.of("https://yourdomain.com", "https://www.yourdomain.com"));
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
}
