# 🚀 운영 환경 설정 TO-DO 목록

## 🔐 Spring Security 설정

### 1. 인증 활성화
- [ ] `SecurityConfig.java`에서 인증 설정 변경
  ```java
  // 현재: 모든 요청 허용 (개발용)
  .anyRequest().permitAll()
  
  // 운영용으로 변경:
  .authorizeHttpRequests(authz -> authz
      .requestMatchers("/api/auth/**", "/oauth2/**").permitAll()
      .requestMatchers("/error").permitAll()
      .anyRequest().authenticated()
  )
  ```

### 2. JWT 필터 활성화
- [ ] `SecurityConfig.java`에서 JWT 필터 Bean 활성화
  ```java
  // TODO 주석 해제:
  @Bean
  public JwtAuthenticationFilter jwtAuthenticationFilter() {
      return new JwtAuthenticationFilter();
  }
  ```

- [ ] JWT 필터를 SecurityFilterChain에 추가
  ```java
  // TODO 주석 해제:
  .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
  ```

### 3. JWT 설정
- [ ] `application.yml`에 JWT 설정 추가
  ```yaml
  jwt:
    secret: ${JWT_SECRET:your-secure-secret-key}
    expiration: 86400000  # 24시간
  ```

## 🔗 OAuth2 서비스 설정

### 1. 개별 OAuth2 서비스 주입
- [ ] `OAuth2Controller.java`에서 개별 서비스 주입 활성화
  ```java
  // TODO 주석 해제:
  private final KakaoOAuth2Service kakaoOAuth2Service;
  private final NaverOAuth2Service naverOAuth2Service;
  ```

### 2. OAuth2 URL 생성 로직 활성화
- [ ] `getOAuth2Url` 메서드에서 개별 서비스 사용 로직 활성화
  ```java
  // TODO 주석 해제:
  if ("KAKAO".equalsIgnoreCase(provider)) {
      authUrl = kakaoOAuth2Service.getAuthorizationUrl(mode);
  } else if ("NAVER".equalsIgnoreCase(provider)) {
      authUrl = naverOAuth2Service.getAuthorizationUrl(mode);
  }
  ```

## 🗄️ 데이터베이스 설정

### 1. Hibernate 설정
- [ ] `application.yml`에서 `hibernate.ddl-auto` 확인
  ```yaml
  spring:
    jpa:
      hibernate:
        ddl-auto: update  # 운영에서는 validate 권장
  ```

### 2. 데이터베이스 연결
- [ ] 운영 데이터베이스 연결 정보 설정
- [ ] 데이터베이스 사용자 권한 확인
- [ ] 백업 정책 수립

## 📝 로깅 설정

### 1. 로그 레벨 조정
- [ ] 운영 환경에 맞는 로그 레벨 설정
  ```yaml
  logging:
    level:
      com.mindgarden: WARN  # 개발용 INFO에서 WARN으로 변경
      org.springframework: WARN
      org.hibernate: WARN
  ```

### 2. 로그 파일 관리
- [ ] 로그 로테이션 정책 설정
- [ ] 로그 보관 기간 설정
- [ ] 로그 모니터링 설정

## 🔒 보안 설정

### 1. CORS 설정
- [ ] 운영 도메인으로 CORS 제한
  ```java
  // 현재: 모든 Origin 허용 (개발용)
  configuration.setAllowedOriginPatterns(List.of("*"));
  
  // 운영용으로 변경:
  configuration.setAllowedOriginPatterns(List.of("https://yourdomain.com"));
  ```

### 2. 세션 관리
- [ ] 세션 타임아웃 설정
- [ ] 동시 세션 제한 설정
- [ ] 세션 고정 공격 방지

## 🌐 환경 변수

### 1. 민감 정보 관리
- [ ] OAuth2 클라이언트 ID/Secret을 환경 변수로 관리
- [ ] 데이터베이스 연결 정보를 환경 변수로 관리
- [ ] JWT 시크릿 키를 환경 변수로 관리

### 2. 프로파일 설정
- [ ] `application-prod.yml` 생성
- [ ] 운영 환경별 설정 분리

## 📊 모니터링 및 헬스체크

### 1. 애플리케이션 모니터링
- [ ] Spring Boot Actuator 활성화
- [ ] 헬스체크 엔드포인트 설정
- [ ] 메트릭 수집 설정

### 2. 로그 모니터링
- [ ] 로그 집계 시스템 연동
- [ ] 에러 알림 설정
- [ ] 성능 모니터링 설정

## 🚨 테스트 체크리스트

### 1. 보안 테스트
- [ ] 인증이 필요한 API 접근 테스트
- [ ] JWT 토큰 유효성 검증 테스트
- [ ] OAuth2 플로우 보안 테스트

### 2. 기능 테스트
- [ ] 소셜 로그인 전체 플로우 테스트
- [ ] 마이페이지 접근 테스트
- [ ] 소셜 계정 연동 테스트

### 3. 성능 테스트
- [ ] 동시 사용자 부하 테스트
- [ ] 데이터베이스 쿼리 성능 테스트
- [ ] 메모리 사용량 모니터링

---

**⚠️ 주의사항:**
- 개발 환경에서 테스트 완료 후 운영 환경에 적용
- 단계별로 적용하여 문제 발생 시 롤백 가능하도록 구성
- 모든 설정 변경 후 충분한 테스트 수행
- 운영 환경 적용 전 백업 수행
