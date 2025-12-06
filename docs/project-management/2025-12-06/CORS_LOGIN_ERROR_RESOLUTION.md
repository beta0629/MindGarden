# CORS 및 로그인 오류 해결 보고서

**작성일**: 2025-12-06  
**작성자**: AI Assistant  
**테스트 계정**: test1764998982@test.com  
**환경**: 로컬 개발 환경 (localhost:3000, localhost:8080)

---

## 📋 문제 개요

### 발생한 주요 오류들

1. **CORS Policy 오류**
   - `No 'Access-Control-Allow-Origin' header is present on the requested resource`
   - `Response to preflight request doesn't pass access control check`
   - 로그인 전 공개 API 호출 시 CORS 오류 발생

2. **401 Unauthorized 오류**
   - 로그인 전 공개 API (`/api/v1/auth/config/oauth2`, `/api/v1/common-codes/**`) 호출 시 401 오류
   - `permitAll()` 설정이 제대로 적용되지 않음

3. **로그인 실패**
   - 로그인 후에도 CORS 오류로 인해 API 호출 실패
   - 세션 설정이 제대로 되지 않음

---

## 🔍 원인 분석

### 1. CORS 설정 문제

#### 문제점
- **와일드카드(`*`)와 `allowCredentials(true)` 충돌**
  - Spring Security에서 `allowedOriginPatterns("*")`와 `setAllowCredentials(true)`를 동시에 사용하면 CORS 오류 발생
  - 브라우저 보안 정책에 의해 명시적 origin 지정 필요

- **중복 CORS 설정**
  - `SecurityConfig.java`: Spring Security CORS 설정
  - `DevelopmentConfig.java`: WebMvcConfigurer CORS 설정 (중복)
  - `WebMvcConfig.java`: CorsFilter 등록 (중복)
  - 여러 설정이 충돌하여 예상치 못한 동작 발생

- **OPTIONS preflight 요청 처리 누락**
  - CORS preflight 요청(OPTIONS)이 필터 체인에서 차단됨
  - `SecurityFilter`에서 OPTIONS 요청을 명시적으로 허용하지 않음

#### 확인된 코드
```java
// SecurityConfig.java (문제 코드)
configuration.setAllowedOriginPatterns(Arrays.asList("*")); // ❌ allowCredentials와 충돌
configuration.setAllowCredentials(true);
```

### 2. Spring Security `permitAll()` 설정 문제

#### 문제점
- **API 경로 버전 불일치**
  - 프론트엔드: `/api/v1/auth/**` 사용
  - SecurityConfig: `/api/auth/**`만 `permitAll()` 설정
  - `/api/v1/auth/**` 경로가 `permitAll()`에 포함되지 않음

- **공통코드 API 경로 누락**
  - `/api/v1/common-codes/**` 경로가 `permitAll()`에 포함되지 않음
  - CSS 테마 API 경로도 누락

#### 확인된 코드
```java
// SecurityConfig.java (문제 코드)
.requestMatchers("/api/auth/**").permitAll() // ❌ /api/v1/auth/** 누락
.requestMatchers("/api/common-codes/**").permitAll() // ❌ /api/v1/common-codes/** 누락
```

### 3. 필터 순서 문제

#### 문제점
- **SecurityFilter가 OPTIONS 요청을 차단**
  - `SecurityFilter`가 CORS 필터보다 먼저 실행되어 OPTIONS 요청을 차단
  - OPTIONS 요청에 대한 명시적 처리 없음

---

## ✅ 해결 방법

### 1. CORS 설정 수정 (`SecurityConfig.java`)

#### 변경 사항

**로컬 환경에서 명시적 origin 지정**
```java
// 변경 전 (문제 코드)
if (isLocal) {
    configuration.setAllowedOriginPatterns(Arrays.asList("*")); // ❌
}

// 변경 후 (해결 코드)
if (isLocal) {
    List<String> allowedOrigins = Arrays.asList(
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    );
    configuration.setAllowedOrigins(allowedOrigins); // ✅ 명시적 origin 지정
    log.info("🌐 CORS 허용 Origins: {}", allowedOrigins);
}
```

**헤더 설정 개선**
```java
// 로컬 환경에서 모든 헤더 허용
if (isLocal) {
    configuration.setAllowedHeaders(Arrays.asList("*")); // ✅
    log.info("🌐 CORS 허용 Headers: * (로컬 환경 - 모든 헤더 허용)");
}
```

**CORS 설정 로그 추가**
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    // ... 설정 코드 ...
    
    // 디버깅 로그 추가
    log.info("🔧 Active Profiles: {}", Arrays.toString(activeProfiles));
    log.info("🌐 CORS 설정: 로컬 환경 - localhost 허용");
    log.info("🌐 CORS 허용 Origins: {}", allowedOrigins);
    log.info("🌐 CORS 허용 Methods: {}", allowedMethods);
    log.info("🌐 CORS AllowCredentials: true");
    log.info("✅ CORS 설정 완료: 모든 경로(/**)에 적용됨");
    
    return source;
}
```

### 2. `permitAll()` 경로 수정 (`SecurityConfig.java`)

#### 변경 사항

**프로덕션 환경**
```java
.authorizeHttpRequests(authz -> authz
    // CORS preflight 요청 허용
    .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
    .requestMatchers("/api/v1/auth/**").permitAll() // ✅ v1 경로 추가
    .requestMatchers("/api/v1/common-codes/**").permitAll() // ✅ v1 경로 추가
    .requestMatchers("/api/v1/admin/css-themes/**").permitAll() // ✅ v1 경로 추가
    // ... 기타 설정 ...
)
```

**개발 환경**
```java
.authorizeHttpRequests(authz -> authz
    // CORS preflight 요청 허용
    .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
    .requestMatchers("/api/v1/auth/**").permitAll() // ✅ v1 경로 추가
    .requestMatchers("/api/v1/common-codes/**").permitAll() // ✅ v1 경로 추가
    .requestMatchers("/api/v1/admin/css-themes/**").permitAll() // ✅ v1 경로 추가
    // ... 기타 설정 ...
)
```

### 3. 중복 CORS 설정 제거

#### `DevelopmentConfig.java` 수정

**중복 CORS 설정 주석 처리**
```java
// @Override
// public void addCorsMappings(CorsRegistry registry) {
//     // 중복 설정 제거 - SecurityConfig에서 관리
// }

// @Bean
// public CorsConfigurationSource developmentCorsConfigurationSource() {
//     // 중복 Bean 제거 - SecurityConfig에서 관리
// }
```

#### `WebMvcConfig.java` 수정

**CorsFilter 등록 제거**
```java
// 제거된 코드
// @Bean
// public FilterRegistrationBean<CorsFilter> corsFilterRegistration() {
//     // 중복 필터 제거 - Spring Security CORS 사용
// }
```

**SecurityFilter URL 패턴 업데이트**
```java
@Bean
public FilterRegistrationBean<SecurityFilter> securityFilterRegistration(SecurityFilter securityFilter) {
    FilterRegistrationBean<SecurityFilter> registration = new FilterRegistrationBean<>();
    registration.setFilter(securityFilter);
    registration.addUrlPatterns("/api/*", "/api/**", "/api/v1/*", "/api/v1/**"); // ✅ v1 경로 추가
    registration.setName("securityFilter");
    registration.setOrder(2);
    return registration;
}
```

### 4. SecurityFilter OPTIONS 요청 처리 (`SecurityFilter.java`)

#### 변경 사항

**OPTIONS 요청 즉시 통과 처리**
```java
@Override
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException {
    HttpServletRequest httpRequest = (HttpServletRequest) request;
    HttpServletResponse httpResponse = (HttpServletResponse) response;
    
    try {
        // 0. OPTIONS 요청 (CORS preflight)은 즉시 통과
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            log.debug("🔓 SecurityFilter: OPTIONS 요청 감지 - 즉시 통과: {}", httpRequest.getRequestURI());
            chain.doFilter(request, response);
            return;
        }
        
        // ... 기타 보안 검사 ...
    } catch (Exception e) {
        // ...
    }
}
```

### 5. 프론트엔드 최적화 (`App.js`)

#### 변경 사항

**로그인 전 불필요한 API 호출 방지**
```javascript
useEffect(() => {
  initializeDynamicThemeSystem({
    theme: 'ios',
    enableThemeWatcher: true,
    enableDeviceWatcher: true,
    loadConsultantColors: !!user, // ✅ 로그인 상태에 따라 동적으로 설정
    autoDetectTheme: false,
    // ...
  });
}, [user]); // ✅ user 의존성 추가
```

---

## 📝 변경된 파일 목록

### 백엔드 파일

1. **`src/main/java/com/coresolution/consultation/config/SecurityConfig.java`**
   - CORS 설정: 와일드카드 → 명시적 origin 지정
   - `permitAll()` 경로에 `/api/v1/**` 추가
   - OPTIONS 요청 `permitAll()` 추가
   - CORS 설정 로그 추가

2. **`src/main/java/com/coresolution/consultation/config/DevelopmentConfig.java`**
   - 중복 CORS 설정 주석 처리

3. **`src/main/java/com/coresolution/core/config/WebMvcConfig.java`**
   - CorsFilter 등록 제거
   - SecurityFilter URL 패턴에 `/api/v1/**` 추가

4. **`src/main/java/com/coresolution/core/security/SecurityFilter.java`**
   - OPTIONS 요청 즉시 통과 처리 추가

### 프론트엔드 파일

5. **`frontend/src/App.js`**
   - `loadConsultantColors` 플래그를 사용자 로그인 상태에 따라 동적 설정

---

## 🧪 테스트 결과

### 테스트 환경
- **프론트엔드**: http://localhost:3000
- **백엔드**: http://localhost:8080
- **테스트 계정**: test1764998982@test.com / Test1234!@#

### 테스트 항목

#### 1. CORS 설정 로그 확인
```
✅ 성공
2025-12-06 19:12:32.827 [restartedMain] INFO  c.c.c.config.SecurityConfig - 🔧 Active Profiles: [local]
2025-12-06 19:12:32.827 [restartedMain] INFO  c.c.c.config.SecurityConfig - 🌐 CORS 설정: 로컬 환경 - localhost 허용
2025-12-06 19:12:32.827 [restartedMain] INFO  c.c.c.config.SecurityConfig - 🌐 CORS 허용 Origins: [http://localhost:3000, http://localhost:3001, http://127.0.0.1:3000, http://127.0.0.1:3001]
2025-12-06 19:12:32.827 [restartedMain] INFO  c.c.c.config.SecurityConfig - 🌐 CORS 허용 Methods: [GET, POST, PUT, DELETE, PATCH, OPTIONS]
2025-12-06 19:12:32.827 [restartedMain] INFO  c.c.c.config.SecurityConfig - 🌐 CORS 허용 Headers: * (로컬 환경 - 모든 헤더 허용)
2025-12-06 19:12:32.827 [restartedMain] INFO  c.c.c.config.SecurityConfig - 🌐 CORS AllowCredentials: true
2025-12-06 19:12:32.832 [restartedMain] INFO  c.c.c.config.SecurityConfig - ✅ CORS 설정 완료: 모든 경로(/**)에 적용됨
```

#### 2. 로그인 전 공개 API 호출
- ✅ `/api/v1/auth/config/oauth2` - 200 OK
- ✅ `/api/v1/common-codes?codeGroup=NOTIFICATION_TYPE` - 200 OK
- ✅ `/api/v1/common-codes/core/groups/USER_ROLE` - 200 OK
- ✅ `/api/v1/common-codes/core/groups/ROLE` - 200 OK
- ✅ `/api/v1/auth/tenant/check-multi` - 200 OK
- ✅ `/api/v1/auth/csrf-token` - 200 OK

#### 3. OPTIONS preflight 요청
- ✅ 모든 OPTIONS 요청 - 200 OK
- ✅ CORS 헤더 정상 반환

#### 4. 로그인 기능
- ✅ 로그인 요청 - 200 OK
- ✅ 세션 설정 정상
- ✅ 관리자 대시보드로 리다이렉트 성공

#### 5. 로그인 후 API 호출
- ✅ `/api/v1/permissions/my-permissions` - 200 OK
- ✅ `/api/v1/permissions/groups/my` - 200 OK
- ✅ `/api/v1/schedules/today/statistics` - 200 OK
- ✅ `/api/v1/admin/consultants/with-vacation` - 200 OK

### 테스트 결과 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| CORS 설정 로드 | ✅ 성공 | 로그 확인 완료 |
| 로그인 전 공개 API | ✅ 성공 | 모든 API 200 OK |
| OPTIONS preflight | ✅ 성공 | 모든 요청 200 OK |
| 로그인 기능 | ✅ 성공 | 정상 로그인 및 리다이렉트 |
| 로그인 후 API | ✅ 성공 | 모든 API 200 OK |
| CORS 오류 | ✅ 해결 | 오류 없음 |

---

## 🔑 핵심 해결 포인트

### 1. 와일드카드와 Credentials 충돌 해결
- **문제**: `allowedOriginPatterns("*")` + `allowCredentials(true)` = CORS 오류
- **해결**: 명시적 origin 목록 지정 (`http://localhost:3000`, `http://localhost:3001` 등)

### 2. 중복 CORS 설정 제거
- **문제**: 여러 곳에서 CORS 설정 → 충돌 발생
- **해결**: Spring Security의 CORS 설정만 사용, 나머지 제거

### 3. API 경로 버전 일치
- **문제**: 프론트엔드는 `/api/v1/**`, SecurityConfig는 `/api/**`만 허용
- **해결**: `permitAll()`에 `/api/v1/**` 경로 추가

### 4. OPTIONS 요청 처리
- **문제**: CORS preflight 요청이 필터에서 차단
- **해결**: `SecurityFilter`와 `SecurityConfig`에서 OPTIONS 요청 명시적 허용

---

## 📚 참고 사항

### CORS 설정 원칙

1. **명시적 Origin 지정**
   - `allowCredentials(true)` 사용 시 와일드카드(`*`) 사용 불가
   - 반드시 명시적 origin 목록 지정 필요

2. **단일 CORS 설정**
   - Spring Security의 CORS 설정을 단일 소스로 사용
   - 중복 설정은 충돌을 일으킬 수 있음

3. **OPTIONS 요청 처리**
   - CORS preflight 요청은 인증 없이 허용해야 함
   - `permitAll()`과 필터에서 명시적 처리 필요

### Spring Security 필터 순서

1. `TenantContextFilter` - 테넌트 컨텍스트 설정
2. `JwtAuthenticationFilter` - JWT 인증
3. `SessionBasedAuthenticationFilter` - 세션 인증
4. CORS 필터 (Spring Security 내장)
5. `SecurityFilter` - 보안 검사

### API 경로 버전 관리

- 프론트엔드와 백엔드의 API 경로 버전을 일치시켜야 함
- `/api/v1/**` 경로를 사용하는 경우, SecurityConfig에도 동일하게 설정

---

## ✅ 최종 확인 사항

### 해결된 문제
- ✅ CORS Policy 오류 완전 해결
- ✅ 로그인 전 공개 API 호출 정상화
- ✅ 로그인 기능 정상 동작
- ✅ 세션 관리 정상 동작
- ✅ 모든 API 요청 정상 처리

### 시스템 상태
- **백엔드 서버**: 정상 실행 (포트 8080)
- **프론트엔드 서버**: 정상 실행 (포트 3000)
- **CORS 설정**: 정상 적용
- **인증/인가**: 정상 동작

---

## 📖 관련 문서

- [Spring Security CORS 설정 가이드](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html)
- [CORS MDN 문서](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [프로젝트 보안 표준](../standards/SECURITY_STANDARD.md)

---

**문서 작성 완료일**: 2025-12-06  
**최종 검증 완료**: ✅ 모든 테스트 통과

