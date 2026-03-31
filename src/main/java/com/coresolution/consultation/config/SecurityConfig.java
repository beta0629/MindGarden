package com.coresolution.consultation.config;

import java.util.Arrays;
import java.util.List;
import com.coresolution.core.filter.TenantContextFilter;
import com.coresolution.consultation.config.filter.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    
    private final SessionBasedAuthenticationFilter sessionBasedAuthenticationFilter;
    @Autowired
    private Environment environment;
    
    private final TenantContextFilter tenantContextFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    public SecurityConfig(
            SessionBasedAuthenticationFilter sessionBasedAuthenticationFilter,
            TenantContextFilter tenantContextFilter,
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.sessionBasedAuthenticationFilter = sessionBasedAuthenticationFilter;
        this.tenantContextFilter = tenantContextFilter;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }
    
    // 기존 세션 기반 인증 시스템 사용
    // Spring Security는 보안 강화 목적으로만 사용
    
    /**
     * SecurityFilterChain 설정 (환경별 보안 설정)
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CORS 설정 - 모든 요청에 대해 허용
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // TenantContextFilter를 가장 먼저 실행 (테넌트 컨텍스트 설정)
            // SessionBasedAuthenticationFilter 이전에 실행되어야 함
            .addFilterBefore(tenantContextFilter, 
                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
            
            // JwtAuthenticationFilter를 SessionBasedAuthenticationFilter 이전에 추가
            // (JWT 토큰 인증이 세션 인증보다 우선)
            .addFilterBefore(jwtAuthenticationFilter, 
                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
            
            // SessionBasedAuthenticationFilter를 Spring Security 필터 체인에 추가
            // (UsernamePasswordAuthenticationFilter 이전에 실행되도록 설정)
            .addFilterBefore(sessionBasedAuthenticationFilter, 
                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);
        
        // 환경별 보안 설정
        if (isProductionEnvironment()) {
            // 운영 환경: 보안 강화
            http
                // CSRF 활성화 (운영 환경에서는 보안 필수)
                .csrf(csrf -> csrf
                    .csrfTokenRepository(csrfTokenRepository())
                    .ignoringRequestMatchers(
                        "/api/auth/**",                              // 인증 관련 API는 CSRF 제외
                        "/api/admin/mappings/**",                     // 매칭 관리 API는 CSRF 제외 (AJAX 요청)
                        "/api/erp/finance/transactions/**",          // 재무 거래 DELETE는 CSRF 제외 (권한 체크는 별도로 수행)
                        // Trinity/공개 온보딩: 로그인 전·세션 없이 호출 → CSRF 토큰 없음. permitAll 과 쌍으로 제외하지 않으면 403(접근 권한) 발생.
                        "/api/v1/accounts/integration/**",           // 이메일 인증 코드 발송/검증 등
                        "/api/v1/onboarding/**",
                        "/api/v1/ops/onboarding/**"
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
                    // CORS preflight 요청 허용 (모든 환경)
                    .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers("/api/auth/**").permitAll()
                    // 공개 엔드포인트: 온보딩 API (새로운 테넌트 등록)
                    .requestMatchers("/api/v1/onboarding/**").permitAll()
                    // 공개 엔드포인트: Ops Portal 온보딩 API (OnboardingController가 두 경로 모두 매핑)
                    .requestMatchers("/api/v1/ops/onboarding/**").permitAll()
                    // 공개 엔드포인트: Trinity 온보딩에서 사용하는 요금제 조회 API
                    .requestMatchers(
                        "/api/v1/ops/plans/active",           // 활성화된 요금제 목록 (공개)
                        "/api/v1/ops/plans/code/**",          // plan_code로 요금제 조회 (공개)
                        "/api/v1/ops/plans/*"                 // plan_id로 요금제 조회 (공개, 단 DELETE 제외)
                    ).permitAll()
                    // 인증 API는 허용
                    .requestMatchers("/api/v1/auth/**").permitAll()
                    // 계정 통합 API는 허용 (온보딩 이메일 인증 등)
                    .requestMatchers("/api/v1/accounts/integration/**").permitAll()
                    // 공통코드 API는 허용 (온보딩에서 사용)
                    .requestMatchers("/api/common-codes/**").permitAll()
                    .requestMatchers("/api/v1/common-codes/**").permitAll()
                    // 업종 카테고리 API는 허용 (온보딩에서 사용)
                    // 표준화 원칙: 온보딩 프로세스는 로그인 전 접근이 필요하므로 공개 API로 설정
                    .requestMatchers("/api/v1/business-categories/**").permitAll()
                    .requestMatchers("/api/business-categories/**").permitAll() // 레거시 경로 지원 (하위 호환성)
                    // CSS 테마 API는 허용
                    .requestMatchers("/api/admin/css-themes/**").permitAll()
                    .requestMatchers("/api/v1/admin/css-themes/**").permitAll()
                    .requestMatchers("/register", "/tablet/register", "/auth/register").permitAll() // 회원가입 페이지는 공개
                    .requestMatchers("/api/system-notifications/**").authenticated() // 시스템 알림 API는 인증 필요
                    .requestMatchers("/api/consultation-messages/**").authenticated() // 상담 메시지 API는 인증 필요
                    .requestMatchers("/api/client/**").authenticated() // 클라이언트 API는 인증 필요
                    .requestMatchers("/api/admin/**").authenticated() // 관리자 API는 인증 필요
                    .requestMatchers("/api/v1/admin/**").authenticated() // 관리자 API v1은 인증 필요
                    .requestMatchers("/api/erp/**").authenticated() // ERP API는 인증 필요
                    .requestMatchers("/api/schedules/**").authenticated() // 스케줄 API는 인증 필요
                    .requestMatchers("/api/v1/schedules/**").authenticated() // 스케줄 API v1은 인증 필요
                    .requestMatchers("/api/payments/**").authenticated() // 결제 API는 인증 필요
                    .requestMatchers("/api/consultant/**").authenticated() // 상담사 API는 인증 필요
                    .requestMatchers("/api/v1/consultants/**").authenticated() // 상담사 API v1은 인증 필요
                    // Ops Portal API는 인증 필요 (공개 엔드포인트 제외)
                    .requestMatchers("/api/v1/ops/auth/**").permitAll() // Ops Portal 인증 API는 허용
                    .requestMatchers("/api/v1/ops/**").authenticated() // 나머지 Ops Portal API는 인증 필요
                    .anyRequest().permitAll() // 나머지는 허용
                )
                // 인증/권한 오류 처리 핸들러 설정
                .exceptionHandling(ex -> ex
                    .authenticationEntryPoint(customAuthenticationEntryPoint())
                    .accessDeniedHandler(customAccessDeniedHandler())
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
                
                // 개발 환경: CORS preflight 요청 포함하여 대부분 허용
                .authorizeHttpRequests(authz -> authz
                    // CORS preflight 요청 허용
                    .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                    // 공개 엔드포인트: 온보딩 API (새로운 테넌트 등록)
                    .requestMatchers("/api/v1/onboarding/**").permitAll()
                    // 공개 엔드포인트: Ops Portal 온보딩 API (OnboardingController가 두 경로 모두 매핑)
                    .requestMatchers("/api/v1/ops/onboarding/**").permitAll()
                    // 공개 엔드포인트: Trinity 온보딩에서 사용하는 요금제 조회 API
                    .requestMatchers(
                        "/api/v1/ops/plans/active",           // 활성화된 요금제 목록 (공개)
                        "/api/v1/ops/plans/code/**",          // plan_code로 요금제 조회 (공개)
                        "/api/v1/ops/plans/*"                 // plan_id로 요금제 조회 (공개, 단 DELETE 제외)
                    ).permitAll()
                    // Ops Portal 인증 API는 허용
                    .requestMatchers("/api/v1/ops/auth/**").permitAll()
                    // 인증 API는 허용
                    .requestMatchers("/api/v1/auth/**").permitAll()
                    // 계정 통합 API는 허용 (온보딩 이메일 인증 등)
                    .requestMatchers("/api/v1/accounts/integration/**").permitAll()
                    // 공통코드 API는 허용 (온보딩에서 사용)
                    .requestMatchers("/api/v1/common-codes/**").permitAll()
                    // 업종 카테고리 API는 허용 (온보딩에서 사용)
                    // 표준화 원칙: 온보딩 프로세스는 로그인 전 접근이 필요하므로 공개 API로 설정
                    .requestMatchers("/api/v1/business-categories/**").permitAll()
                    .requestMatchers("/api/business-categories/**").permitAll() // 레거시 경로 지원 (하위 호환성)
                    // CSS 테마 API는 허용
                    .requestMatchers("/api/v1/admin/css-themes/**").permitAll()
                    // 나머지 Ops Portal API는 인증 필요
                    .requestMatchers("/api/v1/ops/**").authenticated()
                    .anyRequest().permitAll() // 나머지는 허용
                )
                // 인증/권한 오류 처리 핸들러 설정
                .exceptionHandling(ex -> ex
                    .authenticationEntryPoint(customAuthenticationEntryPoint())
                    .accessDeniedHandler(customAccessDeniedHandler())
                );
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
        
        // 추가: 운영 서버 도메인 체크 (배포 서버만 명시적으로 prod로 인식)
        String serverDomain = System.getenv("SERVER_DOMAIN");
        boolean isProdDomain = "beta74.cafe24.com".equalsIgnoreCase(serverDomain);
        
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
        
        // 환경별 CORS 설정
        String[] activeProfiles = environment.getActiveProfiles();
        boolean isLocal = activeProfiles.length == 0 || Arrays.asList(activeProfiles).contains("local");
        boolean isDev = Arrays.asList(activeProfiles).contains("dev");
        boolean isProd = Arrays.asList(activeProfiles).contains("prod");
        
        // 디버깅: 현재 프로파일 로그 출력
        log.info("🔧 Active Profiles: {}", Arrays.toString(activeProfiles));
        log.info("🔧 isLocal: {}, isDev: {}, isProd: {}", isLocal, isDev, isProd);
        
        if (isProd) {
            log.info("🌐 CORS 설정: 운영 환경 - 프로덕션 도메인 + 서브도메인 허용");
            // 운영: 실제 운영 도메인들 + 서브도메인 패턴
            configuration.setAllowedOriginPatterns(Arrays.asList(
                "https://*.core-solution.co.kr",  // 서브도메인 패턴
                "http://*.core-solution.co.kr",
                "https://core-solution.co.kr",    // 기본 도메인도 명시적으로 허용
                "http://core-solution.co.kr",
                "https://*.e-trinity.co.kr",
                "http://*.e-trinity.co.kr",
                "https://apply.e-trinity.co.kr", 
                "http://apply.e-trinity.co.kr",
                "https://ops.e-trinity.co.kr", 
                "http://ops.e-trinity.co.kr"
            ));
        } else if (isDev) {
            log.info("🌐 CORS 설정: 개발 환경 - 개발 도메인 + 서브도메인 + localhost 허용");
            // 개발: 실제 개발 도메인들 + 서브도메인 패턴 + localhost
            // 서브도메인 패턴 사용 (예: *.dev.core-solution.co.kr, *.dev.e-trinity.co.kr 등)
            configuration.setAllowedOriginPatterns(Arrays.asList(
                "https://*.dev.core-solution.co.kr",  // 서브도메인 패턴 (mindgarden.dev.core-solution.co.kr 등)
                "http://*.dev.core-solution.co.kr",
                "https://dev.core-solution.co.kr",    // 기본 도메인도 명시적으로 허용
                "http://dev.core-solution.co.kr", 
                "https://*.dev.e-trinity.co.kr",
                "http://*.dev.e-trinity.co.kr",
                "https://apply.dev.e-trinity.co.kr",
                "http://apply.dev.e-trinity.co.kr",
                "https://ops.dev.e-trinity.co.kr",
                "http://ops.dev.e-trinity.co.kr",
                "http://localhost:3000", 
                "http://localhost:3001",
                "http://localhost:4300"  // Ops Portal 프론트엔드
            ));
        } else {
            // 로컬: localhost 명시적으로 허용 (와일드카드와 credentials 충돌 방지)
            log.info("🌐 CORS 설정: 로컬 환경 - localhost 허용");
            List<String> allowedOrigins = Arrays.asList(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:4300",  // Ops Portal 프론트엔드
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://127.0.0.1:4300"   // Ops Portal 프론트엔드
            );
            configuration.setAllowedOrigins(allowedOrigins);
            log.info("🌐 CORS 허용 Origins: {}", allowedOrigins);
        }
        
        // 허용할 HTTP 메서드 설정
        List<String> allowedMethods = Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        );
        configuration.setAllowedMethods(allowedMethods);
        log.info("🌐 CORS 허용 Methods: {}", allowedMethods);
        
        // 허용할 헤더 설정 (보안 강화)
        // CORS preflight 요청을 위해 모든 헤더 허용 (개발 환경)
        if (isLocal) {
            configuration.setAllowedHeaders(Arrays.asList("*"));
            log.info("🌐 CORS 허용 Headers: * (로컬 환경 - 모든 헤더 허용)");
        } else {
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
                "X-CSRF-TOKEN",  // CSRF 토큰 헤더 추가 (프론트엔드에서 사용)
                "_csrf",         // CSRF 파라미터 추가
                "Cookie",        // 쿠키 헤더 추가
                "Set-Cookie",    // Set-Cookie 헤더 추가
                "X-Actor-Id",    // Ops Portal Actor ID 헤더 추가
                "X-Actor-Role"   // Ops Portal Actor Role 헤더 추가
            ));
        }
        
        // 인증 정보 포함 허용
        configuration.setAllowCredentials(true);
        log.info("🌐 CORS AllowCredentials: true");
        
        // 노출할 헤더 설정
        List<String> exposedHeaders = Arrays.asList(
            "Authorization",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials",
            "Set-Cookie"  // 세션 쿠키 노출 허용
        );
        configuration.setExposedHeaders(exposedHeaders);
        log.info("🌐 CORS ExposedHeaders: {}", exposedHeaders);
        
        // Preflight 요청 캐시 시간 (초)
        long maxAge = isProductionEnvironment() ? 3600L : 0L;
        configuration.setMaxAge(maxAge);
        log.info("🌐 CORS MaxAge: {} 초", maxAge);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        log.info("✅ CORS 설정 완료: 모든 경로(/**)에 적용됨");
        
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
     * RestTemplate Bean (모든 프로파일에서 사용)
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
