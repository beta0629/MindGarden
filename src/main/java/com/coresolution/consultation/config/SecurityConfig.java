package com.coresolution.consultation.config;

import java.util.Arrays;
import java.util.List;
import com.coresolution.core.filter.TenantContextFilter;
import com.coresolution.consultation.config.filter.JwtAuthenticationFilter;
import com.coresolution.consultation.config.security.BearerTokenAuthCsrfMatcher;
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
import org.springframework.http.HttpMethod;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
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
    private final SessionCookieRenewalFilter sessionCookieRenewalFilter;
    @Autowired
    private Environment environment;
    
    private final TenantContextFilter tenantContextFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    public SecurityConfig(
            SessionBasedAuthenticationFilter sessionBasedAuthenticationFilter,
            SessionCookieRenewalFilter sessionCookieRenewalFilter,
            TenantContextFilter tenantContextFilter,
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.sessionBasedAuthenticationFilter = sessionBasedAuthenticationFilter;
        this.sessionCookieRenewalFilter = sessionCookieRenewalFilter;
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
            
            // UsernamePasswordAuthenticationFilter 앞 커스텀 필터 — 동일 앵커에 등록 시 마지막 등록이 요청 최초 실행.
            // 요청 순서: Jwt → TenantContext → SessionBased → UsernamePassword
            .addFilterBefore(sessionBasedAuthenticationFilter,
                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(tenantContextFilter,
                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter,
                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
            
            // SessionCookieRenewalFilter: 인증 완료 후 JSESSIONID 쿠키 Max-Age 슬라이딩 갱신
            .addFilterAfter(sessionCookieRenewalFilter, SessionBasedAuthenticationFilter.class);
        
        // 환경별 보안 설정
        if (isProductionEnvironment()) {
            // 운영 환경: 보안 강화
            http
                // CSRF 활성화 (운영 환경에서는 보안 필수)
                // 단, Bearer 토큰 인증(모바일/SDK)은 OWASP·Spring Security 권고에 따라
                // stateless 인증이므로 CSRF 면제. 웹 프론트(세션 쿠키)는 그대로 보호.
                .csrf(csrf -> csrf
                    .csrfTokenRepository(csrfTokenRepository())
                    .ignoringRequestMatchers(
                        new BearerTokenAuthCsrfMatcher(),
                        new AntPathRequestMatcher("/api/auth/**"),
                        new AntPathRequestMatcher("/api/v1/auth/**"),
                        new AntPathRequestMatcher("/api/admin/mappings/**"),
                        // 재무 거래 DELETE만 CSRF 제외(SPA가 axios DELETE 시 헤더 미포함 등). v1 실제 경로와 레거시 경로 모두.
                        new AntPathRequestMatcher("/api/erp/finance/transactions/**", HttpMethod.DELETE.name()),
                        new AntPathRequestMatcher("/api/v1/erp/finance/transactions/**", HttpMethod.DELETE.name()),
                        new AntPathRequestMatcher("/api/v1/accounts/integration/**"),
                        new AntPathRequestMatcher("/api/v1/onboarding/**"),
                        new AntPathRequestMatcher("/api/v1/ops/onboarding/**"),
                        new AntPathRequestMatcher("/api/v1/ops/auth/**"),
                        new AntPathRequestMatcher("/api/v1/payments/webhooks/**"),
                        new AntPathRequestMatcher("/api/v1/payments/webhook", HttpMethod.POST.name())
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
                // PR-3d (2026-06-14): anyRequest().authenticated() 전환 — Public 화이트리스트 외 전부 인증 필수.
                // 기존 명시적 .authenticated() 매처는 컨트롤러별 명세를 보존하기 위해 유지(2중 방어선).
                .authorizeHttpRequests(authz -> authz
                    // CORS preflight 요청 허용 (모든 환경)
                    .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                    // 시스템·관측성 공개 엔드포인트 (PR-3d 추가)
                    .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                    .requestMatchers("/actuator/info").permitAll()
                    .requestMatchers("/error").permitAll()
                    // OpenAPI / Swagger UI (선택, 운영 노출 정책에 따라 비활성 가능)
                    .requestMatchers("/v3/api-docs", "/v3/api-docs/**").permitAll()
                    .requestMatchers("/swagger-ui", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                    .requestMatchers("/swagger-resources/**", "/webjars/**").permitAll()
                    // 시스템 헬스 엔드포인트(레거시 /api/v1/health 컨트롤러)
                    .requestMatchers("/api/v1/health", "/api/v1/health/**").permitAll()
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
                    // 인증 API는 허용 (로그인/회원가입/소셜 callback/SMS OTP 등)
                    .requestMatchers("/api/v1/auth/**").permitAll()
                    // 포트원 등 PG 웹훅 (서명 검증, 인증 없음)
                    .requestMatchers("/api/v1/payments/webhooks/**").permitAll()
                    // 레거시 결제 웹훅 (하위 호환)
                    .requestMatchers(HttpMethod.POST, "/api/v1/payments/webhook").permitAll()
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
                    // BW-1 mobile: 버전 검사는 로그인 전 공개
                    .requestMatchers("/api/v1/mobile/app-version/check").permitAll()
                    // Ops Portal 인증 API는 허용
                    .requestMatchers("/api/v1/ops/auth/**").permitAll()
                    // ===== 명시적 .authenticated() 매처 (2중 방어선; 컨트롤러 가드와 정합) =====
                    .requestMatchers("/api/system-notifications/**").authenticated()
                    .requestMatchers("/api/consultation-messages/**").authenticated()
                    .requestMatchers("/api/client/**").authenticated()
                    .requestMatchers("/api/admin/**").authenticated()
                    .requestMatchers("/api/v1/admin/**").authenticated()
                    .requestMatchers("/api/erp/**").authenticated()
                    .requestMatchers("/api/v1/erp/**").authenticated()
                    .requestMatchers("/api/schedules/**").authenticated()
                    .requestMatchers("/api/v1/schedules/**").authenticated()
                    .requestMatchers("/api/payments/**").authenticated()
                    // 보안 라운드 2 (2026-06-03): 결제 API v1 전체에 명시적 매트릭스 가드 추가.
                    .requestMatchers("/api/v1/payments/**").authenticated()
                    // 회기 추가/연장 요청 API: 결제 금액·결제 참조가 응답에 포함되므로 매트릭스도 명시적으로 인증 필수.
                    .requestMatchers("/api/v1/admin/session-extensions/**").authenticated()
                    .requestMatchers("/api/v1/clients/**").authenticated()
                    .requestMatchers("/api/v1/psycho-education/**").authenticated()
                    .requestMatchers("/api/v1/mind-weather/**").authenticated()
                    .requestMatchers("/api/v1/mood-journals/**").authenticated()
                    .requestMatchers("/api/v1/self-assessments/**").authenticated()
                    .requestMatchers("/api/v1/community/**").authenticated()
                    .requestMatchers("/api/v1/mobile/**").authenticated()
                    .requestMatchers("/api/consultant/**").authenticated()
                    .requestMatchers("/api/v1/consultants/**").authenticated()
                    .requestMatchers("/api/v1/healing-contents/**").authenticated()
                    .requestMatchers("/api/v1/meditations/**").authenticated()
                    .requestMatchers("/api/v1/ops/**").authenticated()
                    // PR-3d: 매트릭스 미정의 경로는 모두 인증 필수 (B8 보안 회귀 차단)
                    .anyRequest().authenticated()
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
                
                // PR-3d (2026-06-14): dev 프로파일도 anyRequest().authenticated() 로 통일.
                // 운영과 dev 가 동일한 보안 매트릭스를 사용해야 회귀(개발에서만 통과) 차단이 쉽다.
                .authorizeHttpRequests(authz -> authz
                    // CORS preflight 요청 허용
                    .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                    // 시스템·관측성 공개 엔드포인트 (PR-3d 추가)
                    .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                    .requestMatchers("/actuator/info").permitAll()
                    .requestMatchers("/error").permitAll()
                    // OpenAPI / Swagger UI
                    .requestMatchers("/v3/api-docs", "/v3/api-docs/**").permitAll()
                    .requestMatchers("/swagger-ui", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                    .requestMatchers("/swagger-resources/**", "/webjars/**").permitAll()
                    // 시스템 헬스 엔드포인트
                    .requestMatchers("/api/v1/health", "/api/v1/health/**").permitAll()
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
                    // 포트원 등 PG 웹훅 (서명 검증, 인증 없음)
                    .requestMatchers("/api/v1/payments/webhooks/**").permitAll()
                    // 레거시 결제 웹훅 (하위 호환)
                    .requestMatchers(HttpMethod.POST, "/api/v1/payments/webhook").permitAll()
                    // 계정 통합 API는 허용 (온보딩 이메일 인증 등)
                    .requestMatchers("/api/v1/accounts/integration/**").permitAll()
                    // 공통코드 API는 허용 (온보딩에서 사용)
                    .requestMatchers("/api/v1/common-codes/**").permitAll()
                    // 업종 카테고리 API는 허용 (온보딩에서 사용)
                    .requestMatchers("/api/v1/business-categories/**").permitAll()
                    .requestMatchers("/api/business-categories/**").permitAll() // 레거시 경로 지원 (하위 호환성)
                    // CSS 테마 API는 허용
                    .requestMatchers("/api/v1/admin/css-themes/**").permitAll()
                    // BW-1 mobile: 버전 검사는 로그인 전 공개
                    .requestMatchers("/api/v1/mobile/app-version/check").permitAll()
                    // ===== 명시적 .authenticated() 매처 (2중 방어선; 컨트롤러 가드와 정합) =====
                    .requestMatchers("/api/v1/payments/**").authenticated()
                    .requestMatchers("/api/v1/admin/session-extensions/**").authenticated()
                    .requestMatchers("/api/v1/clients/**").authenticated()
                    .requestMatchers("/api/v1/admin/content/**").authenticated() // BW-3 admin content
                    .requestMatchers("/api/v1/admin/wellness/mind-weather/**").authenticated() // BW-6
                    .requestMatchers("/api/v1/admin/wellness/mind-garden/**").authenticated() // BW-6
                    .requestMatchers("/api/v1/healing-contents/**").authenticated()
                    .requestMatchers("/api/v1/meditations/**").authenticated()
                    .requestMatchers("/api/v1/psycho-education/**").authenticated()
                    .requestMatchers("/api/v1/mind-weather/**").authenticated()
                    .requestMatchers("/api/v1/mood-journals/**").authenticated()
                    .requestMatchers("/api/v1/self-assessments/**").authenticated()
                    .requestMatchers("/api/v1/community/**").authenticated()
                    .requestMatchers("/api/v1/mobile/**").authenticated()
                    .requestMatchers("/api/consultant/**").authenticated()
                    .requestMatchers("/api/v1/consultants/**").authenticated()
                    .requestMatchers("/api/v1/ops/**").authenticated()
                    // PR-3d: 매트릭스 미정의 경로는 모두 인증 필수 (운영·개발 동일 정책)
                    .anyRequest().authenticated()
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
     * 운영 환경 여부 확인. 활성 Spring 프로파일({@code prod} / {@code production})만 단일 기준으로 사용한다.
     *
     * @return {@code prod} 또는 {@code production} 프로파일이 활성이면 true
     */
    private boolean isProductionEnvironment() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> "prod".equals(p) || "production".equals(p));
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
                "https://e-trinity.co.kr",        // apex (와일드카드 *.e-trinity.co.kr 미매칭)
                "http://e-trinity.co.kr",
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
                "https://dev.e-trinity.co.kr",        // apex (와일드카드 *.dev.e-trinity.co.kr 미매칭)
                "http://dev.e-trinity.co.kr",
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

        // OAuth callback (Apple form_post 등) 전용 CORS 우회.
        // - Apple SIWA 는 동의 후 https://appleid.apple.com 에서 form_post 로 콜백을 보내며,
        //   Safari 는 Origin: null 로 보낸다. 기본 /** 화이트리스트는 이 origin 들을 허용하지 않으므로
        //   Spring DefaultCorsProcessor 가 403 + "Invalid CORS request" 본문으로 거부 → 컨트롤러 도달 불가.
        // - 본 정책은 Apple 등 콜백 path 에 한해 origin 검증을 우회하고 credentials/cookie 동봉을 막는다.
        // - 구체 path 를 먼저 등록해야 UrlBasedCorsConfigurationSource 매치 우선순위가 안전하다.
        CorsConfiguration callbackConfig = new CorsConfiguration();
        callbackConfig.setAllowedOriginPatterns(Arrays.asList("*"));
        callbackConfig.setAllowedMethods(Arrays.asList("GET", "POST", "OPTIONS"));
        callbackConfig.setAllowedHeaders(Arrays.asList("*"));
        callbackConfig.setAllowCredentials(false);
        callbackConfig.setMaxAge(0L);

        source.registerCorsConfiguration("/api/v1/auth/*/callback", callbackConfig);
        source.registerCorsConfiguration("/api/auth/*/callback", callbackConfig);
        source.registerCorsConfiguration("/api/v1/auth/oauth/*/callback", callbackConfig);
        source.registerCorsConfiguration("/api/v1/auth/oauth2/callback", callbackConfig);
        log.info("✅ OAuth callback CORS 우회 등록: /api/(v1/)?auth/*/callback, /api/v1/auth/oauth(2)?/callback");

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
