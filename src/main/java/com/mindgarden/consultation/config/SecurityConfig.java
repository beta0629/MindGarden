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
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.ConcurrentSessionControlAuthenticationStrategy;
import org.springframework.security.web.authentication.session.RegisterSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
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
    
    private final SessionBasedAuthenticationFilter sessionBasedAuthenticationFilter;
    
    public SecurityConfig(SessionBasedAuthenticationFilter sessionBasedAuthenticationFilter) {
        this.sessionBasedAuthenticationFilter = sessionBasedAuthenticationFilter;
    }
    
    // 기존 세션 기반 인증 시스템 사용
    // Spring Security는 보안 강화 목적으로만 사용
    
    /**
     * SecurityFilterChain 설정 (환경별 보안 설정)
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CORS 설정
            .cors(cors -> cors.configurationSource(corsConfigurationSource()));
        
        // 환경별 보안 설정
        if (isProductionEnvironment()) {
            // 운영 환경: 보안 강화
            http
                // CSRF 활성화 (운영 환경에서는 보안 필수)
                .csrf(csrf -> csrf
                    .csrfTokenRepository(csrfTokenRepository())
                    .ignoringRequestMatchers(
                        "/api/auth/**",           // 인증 관련 API는 CSRF 제외
                        "/api/admin/mappings/**"  // 매칭 관리 API는 CSRF 제외 (AJAX 요청)
                    )
                )
                
                // 세션 관리 활성화
                .sessionManagement(session -> session
                    .sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.IF_REQUIRED)
                    .maximumSessions(1) // 동시 세션 1개만 허용
                    .maxSessionsPreventsLogin(false) // 초과 시 기존 세션 만료
                    .sessionRegistry(sessionRegistry())
                )
                
                // API 엔드포인트별 권한 설정
                .authorizeHttpRequests(authz -> authz
                    .requestMatchers("/api/auth/**").permitAll() // 인증 관련 API는 허용
                    .requestMatchers("/api/common-codes/**").permitAll() // 공통코드는 허용
                    .requestMatchers("/api/admin/css-themes/**").permitAll() // CSS 테마는 허용
                    .requestMatchers("/api/admin/**").authenticated() // 관리자 API는 인증 필요
                    .requestMatchers("/api/erp/**").authenticated() // ERP API는 인증 필요
                    .requestMatchers("/api/schedules/**").authenticated() // 스케줄 API는 인증 필요
                    .requestMatchers("/api/payments/**").authenticated() // 결제 API는 인증 필요
                    .requestMatchers("/api/consultant/**").authenticated() // 상담사 API는 인증 필요
                    .anyRequest().permitAll() // 나머지는 허용
                );
        } else {
            // 개발 환경: 편의성 우선 (운영 환경과 분리)
            http
                // CSRF 비활성화 (개발 편의성)
                .csrf(csrf -> csrf.disable())
                
                // 세션 관리 활성화 (매칭 생성 등을 위해)
                .sessionManagement(session -> session
                    .sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.IF_REQUIRED)
                )
                
                // 모든 요청 허용 (개발 편의성)
                .authorizeHttpRequests(authz -> authz.anyRequest().permitAll());
        }
        
        return http.build();
    }
    
    /**
     * 운영 환경 여부 확인
     */
    private boolean isProductionEnvironment() {
        String activeProfile = System.getProperty("spring.profiles.active");
        String envProfile = System.getenv("SPRING_PROFILES_ACTIVE");
        
        // 운영 환경 판단: prod, production 프로필 또는 운영 서버 도메인
        boolean isProdProfile = "prod".equals(activeProfile) || "prod".equals(envProfile) || 
                               "production".equals(activeProfile) || "production".equals(envProfile);
        
        // 추가: 운영 서버 도메인 체크 (beta74.cafe24.com)
        boolean isProdDomain = System.getenv("SERVER_DOMAIN") != null && 
                              System.getenv("SERVER_DOMAIN").contains("cafe24.com");
        
        return isProdProfile || isProdDomain;
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
        
        // 허용할 헤더 설정 (보안 강화)
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "Cache-Control",
            "Pragma",
            "X-XSRF-TOKEN",  // CSRF 토큰 헤더 추가
            "_csrf",         // CSRF 파라미터 추가
            "Cookie",        // 쿠키 헤더 추가
            "Set-Cookie"     // Set-Cookie 헤더 추가
        ));
        
        // 인증 정보 포함 허용
        configuration.setAllowCredentials(true);
        
        // 노출할 헤더 설정
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials",
            "Set-Cookie"  // 세션 쿠키 노출 허용
        ));
        
        // Preflight 요청 캐시 시간 (초)
        configuration.setMaxAge(isProductionEnvironment() ? 3600L : 0L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
    
    // 비밀번호 인코더는 PasswordPolicyConfig에서 관리
    
    /**
     * 인증 매니저 (기본 설정 사용)
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
    
    
    
    // Rate Limiting 필터는 RateLimitingConfig에서 관리
    
    /**
     * 커스텀 인증 진입점
     */
    @Bean
    public CustomAuthenticationEntryPoint customAuthenticationEntryPoint() {
        return new CustomAuthenticationEntryPoint();
    }
    
    /**
     * 커스텀 접근 거부 핸들러
     */
    @Bean
    public CustomAccessDeniedHandler customAccessDeniedHandler() {
        return new CustomAccessDeniedHandler();
    }
    
    /**
     * 세션 레지스트리
     */
    @Bean
    public org.springframework.security.core.session.SessionRegistry sessionRegistry() {
        return new org.springframework.security.core.session.SessionRegistryImpl();
    }
    
    /**
     * 세션 인증 전략 (환경별 설정)
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
     * CSRF 토큰 리포지토리
     */
    @Bean
    public CsrfTokenRepository csrfTokenRepository() {
        HttpSessionCsrfTokenRepository repository = new HttpSessionCsrfTokenRepository();
        repository.setHeaderName("X-XSRF-TOKEN");
        repository.setParameterName("_csrf");
        return repository;
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
