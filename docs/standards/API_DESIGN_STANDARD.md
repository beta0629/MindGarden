# API 설계 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 RESTful API 설계 및 구현 표준입니다.  
**테넌트 기반 멀티 테넌시 아키텍처**를 기반으로 합니다.

### 참조 문서
- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
- [보안 정책](../guides/SECURITY_POLICY.md)
- [API 경로 표준화 계획](../project-management/archive/2025-11-20/API_PATH_STANDARDIZATION_PLAN.md)

---

## 🎯 핵심 원칙

### 1. RESTful 설계
- ✅ 리소스 중심 URL 설계
- ✅ HTTP 메서드 적절히 사용
- ✅ 상태 코드 표준 준수

### 2. 테넌트 격리
- ✅ 모든 API는 테넌트 컨텍스트 필수
- ✅ 테넌트 ID는 헤더로 전달
- ❌ URL에 테넌트 ID 노출 금지

### 3. 버전 관리
- ✅ `/api/v1/` 접두사 필수
- ✅ 하위 호환성 보장
- ✅ 버전 업그레이드 계획

### 4. 보안
- ✅ 인증/인가 필수
- ✅ HTTPS 사용
- ✅ Rate Limiting 적용

---

## 📋 URL 설계 규칙

### 기본 형식
```
https://api.mindgarden.com/api/v1/{resource}
```

### 버전 관리
```
/api/v1/users          -- ✅ 현재 버전
/api/v2/users          -- ✅ 다음 버전 (하위 호환성 유지)
/api/users             -- ❌ 버전 없음 (금지)
```

### 리소스 명명
```
/api/v1/users          -- ✅ 복수형, 소문자
/api/v1/user           -- ❌ 단수형
/api/v1/Users          -- ❌ 대문자
/api/v1/user-profiles  -- ✅ 하이픈 사용
/api/v1/userProfiles   -- ❌ camelCase
```

### 계층 구조
```
/api/v1/users/{userId}/consultations          -- ✅ 사용자의 상담 목록
/api/v1/consultations?userId={userId}         -- ✅ 대안 (쿼리 파라미터)
/api/v1/users/{userId}/consultations/{id}     -- ✅ 특정 상담
```

### 동작 표현
```
/api/v1/users/{id}/activate    -- ✅ 동사 사용 (예외적 허용)
/api/v1/users/{id}/deactivate  -- ✅ 동사 사용 (예외적 허용)
/api/v1/users/{id}/status      -- ❌ 모호함
```

---

## 🔑 HTTP 메서드

### GET - 조회
```http
GET /api/v1/users              -- 목록 조회
GET /api/v1/users/{id}         -- 단건 조회
GET /api/v1/users/{id}/stats   -- 통계 조회
```

### POST - 생성
```http
POST /api/v1/users             -- 사용자 생성
POST /api/v1/users/bulk        -- 대량 생성
```

### PUT - 전체 수정
```http
PUT /api/v1/users/{id}         -- 전체 필드 수정
```

### PATCH - 부분 수정
```http
PATCH /api/v1/users/{id}       -- 일부 필드 수정
```

### DELETE - 삭제
```http
DELETE /api/v1/users/{id}      -- 소프트 삭제
```

---

## 📊 요청/응답 형식

### 표준 응답 구조
```json
{
  "success": true,
  "message": "요청이 성공적으로 처리되었습니다",
  "data": {
    "id": 123,
    "name": "홍길동",
    "email": "hong@example.com"
  },
  "timestamp": "2025-12-02T10:30:00Z"
}
```

### 에러 응답 구조
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "사용자를 찾을 수 없습니다",
    "details": {
      "userId": 123
    }
  },
  "timestamp": "2025-12-02T10:30:00Z"
}
```

### 목록 응답 (페이징)
```json
{
  "success": true,
  "data": {
    "items": [
      { "id": 1, "name": "홍길동" },
      { "id": 2, "name": "김철수" }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "totalElements": 100,
      "totalPages": 5
    }
  },
  "timestamp": "2025-12-02T10:30:00Z"
}
```

---

## 🔐 인증/인가

### 헤더 구조
```http
Authorization: Bearer {JWT_TOKEN}
X-Tenant-ID: tenant-001
Content-Type: application/json
```

### 테넌트 ID 전달
```http
-- ✅ 헤더 사용 (권장)
X-Tenant-ID: tenant-001

-- ❌ URL 사용 (금지)
/api/v1/tenants/tenant-001/users
```

### 권한 체크
```java
@PreAuthorize("hasPermission(#userId, 'USER', 'READ')")
@GetMapping("/api/v1/users/{userId}")
public ResponseEntity<?> getUser(@PathVariable Long userId) {
    // 권한 체크 후 실행
}
```

---

## 📈 페이징/정렬/필터링

### 페이징 파라미터
```http
GET /api/v1/users?page=1&size=20

-- 파라미터
page: 페이지 번호 (1부터 시작)
size: 페이지 크기 (기본 20, 최대 100)
```

### 정렬 파라미터
```http
GET /api/v1/users?sort=createdAt,desc&sort=name,asc

-- 형식: {필드},{방향}
createdAt,desc  -- 생성일 내림차순
name,asc        -- 이름 오름차순
```

### 필터링 파라미터
```http
GET /api/v1/users?role=CONSULTANT&isActive=true&search=홍길동

-- 파라미터
role: 역할 필터
isActive: 활성 상태 필터
search: 검색어 (이름, 이메일 등)
```

### 날짜 범위 필터
```http
GET /api/v1/consultations?startDate=2025-12-01&endDate=2025-12-31

-- 형식: YYYY-MM-DD
```

---

## 🚫 금지 사항

### 브랜치 관련
```http
-- ❌ 브랜치 코드 사용 금지
GET /api/v1/users?branchCode=MAIN001
GET /api/v1/branches/{branchId}/users

-- ✅ 테넌트 ID 사용
Header: X-Tenant-ID: tenant-001
GET /api/v1/users
```

### URL에 민감 정보
```http
-- ❌ 민감 정보 노출 금지
GET /api/v1/users?password=1234
GET /api/v1/users?ssn=123456-1234567

-- ✅ Body에 포함
POST /api/v1/users
Body: { "password": "encrypted_value" }
```

### 동사형 URL
```http
-- ❌ 동사형 URL (일반적으로 금지)
GET /api/v1/getUsers
POST /api/v1/createUser
DELETE /api/v1/deleteUser

-- ✅ 명사형 URL + HTTP 메서드
GET /api/v1/users
POST /api/v1/users
DELETE /api/v1/users/{id}

-- ✅ 예외: 동작이 명확한 경우
POST /api/v1/users/{id}/activate
POST /api/v1/users/{id}/deactivate
```

---

## 📝 상태 코드

### 성공 (2xx)
```
200 OK              -- 조회/수정 성공
201 Created         -- 생성 성공
204 No Content      -- 삭제 성공 (응답 본문 없음)
```

### 클라이언트 에러 (4xx)
```
400 Bad Request     -- 잘못된 요청
401 Unauthorized    -- 인증 실패
403 Forbidden       -- 권한 없음
404 Not Found       -- 리소스 없음
409 Conflict        -- 중복 데이터
422 Unprocessable   -- 유효성 검증 실패
429 Too Many Requests -- Rate Limit 초과
```

### 서버 에러 (5xx)
```
500 Internal Server Error -- 서버 오류
502 Bad Gateway           -- 게이트웨이 오류
503 Service Unavailable   -- 서비스 이용 불가
```

---

## 🔄 에러 코드 체계

### 형식
```
{DOMAIN}_{ERROR_TYPE}_{DETAIL}
```

### 예시
```
USER_NOT_FOUND              -- 사용자 없음
USER_ALREADY_EXISTS         -- 사용자 중복
USER_INVALID_PASSWORD       -- 비밀번호 오류

TENANT_NOT_FOUND            -- 테넌트 없음
TENANT_ACCESS_DENIED        -- 테넌트 접근 거부

PERMISSION_DENIED           -- 권한 없음
PERMISSION_INVALID_ROLE     -- 잘못된 역할

VALIDATION_REQUIRED_FIELD   -- 필수 필드 누락
VALIDATION_INVALID_FORMAT   -- 형식 오류
```

---

## 📊 API 예시

### 사용자 관리 API

#### 사용자 목록 조회
```http
GET /api/v1/users?page=1&size=20&role=CONSULTANT
Header: X-Tenant-ID: tenant-001
Header: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "username": "consultant01",
        "email": "consultant01@example.com",
        "role": "CONSULTANT",
        "isActive": true,
        "createdAt": "2025-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "totalElements": 50,
      "totalPages": 3
    }
  }
}
```

#### 사용자 생성
```http
POST /api/v1/users
Header: X-Tenant-ID: tenant-001
Header: Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "username": "consultant01",
  "email": "consultant01@example.com",
  "password": "SecurePass123!",
  "role": "CONSULTANT",
  "name": "홍길동",
  "phone": "010-1234-5678"
}

Response 201:
{
  "success": true,
  "message": "사용자가 생성되었습니다",
  "data": {
    "id": 123,
    "username": "consultant01",
    "email": "consultant01@example.com",
    "role": "CONSULTANT",
    "createdAt": "2025-12-02T10:30:00Z"
  }
}
```

#### 사용자 수정
```http
PATCH /api/v1/users/123
Header: X-Tenant-ID: tenant-001
Header: Authorization: Bearer {token}

Request Body:
{
  "name": "홍길동",
  "phone": "010-9876-5432"
}

Response 200:
{
  "success": true,
  "message": "사용자 정보가 수정되었습니다",
  "data": {
    "id": 123,
    "name": "홍길동",
    "phone": "010-9876-5432",
    "updatedAt": "2025-12-02T10:35:00Z"
  }
}
```

#### 사용자 삭제 (소프트 삭제)
```http
DELETE /api/v1/users/123
Header: X-Tenant-ID: tenant-001
Header: Authorization: Bearer {token}

Response 204 No Content
```

---

### 상담 관리 API

#### 상담 목록 조회
```http
GET /api/v1/consultations?consultantId=123&status=COMPLETED&startDate=2025-12-01
Header: X-Tenant-ID: tenant-001
Header: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 456,
        "consultantId": 123,
        "clientId": 789,
        "status": "COMPLETED",
        "scheduledAt": "2025-12-01T14:00:00Z",
        "completedAt": "2025-12-01T15:00:00Z",
        "notes": "상담 완료"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "totalElements": 10,
      "totalPages": 1
    }
  }
}
```

---

## 🛡️ 보안 고려사항

### Rate Limiting
```http
-- 응답 헤더
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1638360000

-- 초과 시
Response 429:
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
    "retryAfter": 60
  }
}
```

### CORS 설정
```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("https://mindgarden.com");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}
```

### CSRF 보호
```java
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf()
            .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse());
        return http.build();
    }
}
```

---

## 📖 API 문서화

### Swagger/OpenAPI
```java
@Configuration
@EnableSwagger2
public class SwaggerConfig {
    @Bean
    public Docket api() {
        return new Docket(DocumentationType.SWAGGER_2)
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.coresolution"))
                .paths(PathSelectors.ant("/api/v1/**"))
                .build()
                .apiInfo(apiInfo());
    }
}
```

### 주석 작성
```java
/**
 * 사용자 목록 조회
 * 
 * @param page 페이지 번호 (1부터 시작)
 * @param size 페이지 크기 (기본 20, 최대 100)
 * @param role 역할 필터 (ADMIN, CONSULTANT, CLIENT, STAFF)
 * @return 사용자 목록
 */
@GetMapping("/api/v1/users")
@ApiOperation(value = "사용자 목록 조회", notes = "테넌트별 사용자 목록을 조회합니다")
public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getUsers(
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(required = false) String role
) {
    // 구현
}
```

---

## ✅ 체크리스트

### 새 API 개발 시
- [ ] `/api/v1/` 접두사 사용
- [ ] 테넌트 ID 헤더 검증
- [ ] 인증/인가 체크
- [ ] 표준 응답 구조 사용
- [ ] 에러 처리 구현
- [ ] 페이징 구현 (목록 API)
- [ ] 소프트 삭제 구현 (삭제 API)
- [ ] Rate Limiting 적용
- [ ] API 문서화 (Swagger)
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성

### 기존 API 수정 시
- [ ] 하위 호환성 확인
- [ ] 브랜치 관련 로직 제거
- [ ] 테넌트 격리 확인
- [ ] 버전 업그레이드 필요 여부 검토

---

## 📞 문의

API 설계 관련 문의:
- 백엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-02

