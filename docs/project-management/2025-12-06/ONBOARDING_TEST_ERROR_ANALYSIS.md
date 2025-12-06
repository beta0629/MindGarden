# 온보딩 테스트 오류 분석 리포트

**분석 일시**: 2025-12-06 13:28:04 (KST)  
**오류 상태 코드**: 401 Unauthorized

---

## 1. 오류 현상

### 1.1 테스트 요청
```http
POST /api/v1/onboarding/requests HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "tenantId": "test-tenant-error-check",
  "tenantName": "테스트테넌트",
  "requestedBy": "test@test.com",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"Test1234!@#\"}"
}
```

### 1.2 응답
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer
Content-Length: 0
```

---

## 2. 원인 분석

### 2.1 SecurityConfig 설정 확인
- ✅ **개발 환경 설정**: `.requestMatchers("/api/v1/onboarding/**").permitAll()` 추가됨
- ✅ **파일 위치**: `src/main/java/com/coresolution/consultation/config/SecurityConfig.java` (158번째 줄)
- ⚠️ **문제**: 서버가 재시작되지 않아 변경사항이 적용되지 않았을 가능성

### 2.2 필터 체인 순서
1. **TenantContextFilter** - 테넌트 컨텍스트 설정
2. **JwtAuthenticationFilter** - JWT 토큰 인증
3. **SessionBasedAuthenticationFilter** - 세션 기반 인증
4. **Spring Security Filter Chain** - SecurityConfig 설정 적용

### 2.3 CustomAuthenticationEntryPoint
- **위치**: `src/main/java/com/coresolution/consultation/config/CustomAuthenticationEntryPoint.java`
- **동작**: 인증 실패 시 401 반환
- **문제**: `permitAll()` 설정이 있어도 인증이 요구되고 있음

---

## 3. 가능한 원인

### 3.1 서버 재시작 필요
- **확인**: SecurityConfig 변경사항이 적용되려면 서버 재시작 필요
- **현재 상태**: 서버는 실행 중이지만 변경사항이 반영되지 않았을 수 있음

### 3.2 환경 설정 확인 필요
- **확인 사항**: `isProductionEnvironment()` 메서드가 `true`를 반환하는지 확인
- **영향**: 운영 환경 설정이 적용되면 온보딩 API가 인증을 요구할 수 있음

### 3.3 필터 체인 순서 문제
- **가능성**: 다른 필터가 먼저 인증을 요구하고 있을 수 있음
- **확인 필요**: SessionBasedAuthenticationFilter나 다른 필터의 동작 확인

---

## 4. 해결 방안

### 4.1 즉시 조치
1. **서버 재시작**
   ```bash
   # 서버 중지 후 재시작
   cd MindGarden
   ./start-local.sh
   ```

2. **환경 설정 확인**
   - `application.yml` 또는 `application.properties`에서 `spring.profiles.active` 확인
   - 개발 환경이면 `dev` 또는 `local` 프로파일이 활성화되어야 함

### 4.2 추가 확인 사항
1. **운영 환경 설정 확인**
   - `SecurityConfig.isProductionEnvironment()` 메서드 확인
   - 운영 환경이면 온보딩 API도 인증을 요구할 수 있음

2. **필터 체인 로그 확인**
   - `SessionBasedAuthenticationFilter`의 로그 확인
   - 필터가 어떻게 동작하는지 확인

### 4.3 대안
1. **운영 환경에도 온보딩 API 추가**
   - 운영 환경 설정에도 `.requestMatchers("/api/v1/onboarding/**").permitAll()` 추가

2. **CustomAuthenticationEntryPoint 수정**
   - 온보딩 API 경로는 401 대신 다른 응답 반환 (하지만 권장하지 않음)

---

## 5. 다음 단계

### 5.1 서버 재시작 후 테스트
1. 서버 재시작
2. 온보딩 테스트 재실행
3. 결과 확인

### 5.2 여전히 실패하는 경우
1. 운영 환경 설정 확인
2. 필터 체인 로그 상세 확인
3. SecurityConfig의 환경 분기 로직 확인

---

## 6. 참고 사항

### 6.1 SecurityConfig 구조
- **개발 환경**: `isProductionEnvironment() == false`일 때
  - CSRF 비활성화
  - `.requestMatchers("/api/v1/onboarding/**").permitAll()` 설정됨
  - `.anyRequest().permitAll()` 설정됨

- **운영 환경**: `isProductionEnvironment() == true`일 때
  - CSRF 활성화
  - 온보딩 API에 대한 명시적 설정 없음 (인증 필요할 수 있음)

### 6.2 테스트 코드 컴파일 오류
- **오류**: `PasskeyControllerTest`, `GoogleOAuth2ServiceTest`, `PasskeyServiceTest`
- **영향**: 서버 실행에는 영향 없음 (테스트 코드만 컴파일 실패)
- **우선순위**: 낮음 (서버 실행 후 해결 가능)

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-06 13:28:04 (KST)

