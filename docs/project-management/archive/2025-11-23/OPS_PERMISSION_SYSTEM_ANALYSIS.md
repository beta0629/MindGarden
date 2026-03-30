# Ops Portal 권한 시스템 상세 분석

## 개요

Ops Portal의 권한 시스템은 Spring Security와 JWT 기반 인증을 사용하며, 복잡한 다층 권한 체크 구조를 가지고 있습니다.

**작성일**: 2025-11-23  
**분석 범위**: Ops Portal 인증 및 권한 체크 메커니즘

---

## 1. 권한 시스템 아키텍처

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    클라이언트 요청                            │
│              (Authorization: Bearer <JWT>)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Spring Security Filter Chain                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. TenantContextFilter                                │   │
│  │    - 테넌트 컨텍스트 설정                             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2. JwtAuthenticationFilter                            │   │
│  │    - JWT 토큰 검증                                     │   │
│  │    - SecurityContext에 인증 정보 설정                   │   │
│  │    - 권한(GrantedAuthority) 생성 및 설정               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 3. SessionBasedAuthenticationFilter                   │   │
│  │    - 세션 기반 인증 (기존 시스템)                      │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SecurityConfig.authorizeHttpRequests()          │
│  - HTTP 레벨 권한 체크                                        │
│  - /api/v1/ops/** → authenticated()                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              @PreAuthorize (Method Security)                 │
│  - 메서드 레벨 권한 체크                                      │
│  - hasRole('ADMIN') or hasRole('OPS')                       │
│  ⚠️ 현재 작동하지 않음 → 수동 권한 체크로 대체               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              컨트롤러 메서드 내 수동 권한 체크                │
│  - SecurityContextHolder에서 Authentication 추출            │
│  - authorities에서 ROLE_ADMIN 또는 ROLE_OPS 확인            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 권한 체크 레벨

1. **HTTP 레벨** (`SecurityConfig.authorizeHttpRequests()`)
   - URL 패턴 기반 접근 제어
   - `/api/v1/ops/**` → `authenticated()` (인증 필요)

2. **메서드 레벨** (`@PreAuthorize`)
   - 메서드 실행 전 권한 체크
   - ⚠️ **현재 작동하지 않음** (원인 분석 필요)

3. **수동 체크** (컨트롤러 내부)
   - `SecurityContextHolder`에서 직접 권한 확인
   - 현재 사용 중인 방식

---

## 2. 권한 상수 정의

### 2.1 SecurityRoleConstants

```java
// Spring Security 역할 상수 (GrantedAuthority에 사용)
public static final String ROLE_ADMIN = "ROLE_ADMIN";
public static final String ROLE_OPS = "ROLE_OPS";
public static final String ROLE_HQ_ADMIN = "ROLE_HQ_ADMIN";
public static final String ROLE_PREFIX = "ROLE_";

// JWT 토큰의 actorRole 값 (문자열)
public static final String ACTOR_ROLE_HQ_ADMIN = "HQ_ADMIN";
public static final String ACTOR_ROLE_SUPER_HQ_ADMIN = "SUPER_HQ_ADMIN";
public static final String ACTOR_ROLE_ADMIN = "ADMIN";
public static final String ACTOR_ROLE_OPS = "OPS";
```

### 2.2 권한 매핑 로직

#### JWT 토큰의 actorRole → Spring Security 권한

| actorRole (JWT) | GrantedAuthority (Spring Security) |
|----------------|-----------------------------------|
| `HQ_ADMIN` | `ROLE_ADMIN`, `ROLE_OPS`, `ROLE_HQ_ADMIN` |
| `SUPER_HQ_ADMIN` | `ROLE_ADMIN`, `ROLE_OPS`, `ROLE_HQ_ADMIN` |
| `ADMIN` | `ROLE_ADMIN`, `ROLE_OPS` |
| `OPS` | `ROLE_OPS` |

#### User 엔티티의 role → Spring Security 권한

| User.role (DB) | GrantedAuthority (Spring Security) |
|---------------|-----------------------------------|
| `HQ_MASTER` | `ROLE_ADMIN`, `ROLE_OPS`, `ROLE_HQ_ADMIN` |
| `SUPER_HQ_ADMIN` | `ROLE_ADMIN`, `ROLE_OPS`, `ROLE_HQ_ADMIN` |
| `HQ_ADMIN` | `ROLE_ADMIN`, `ROLE_OPS`, `ROLE_HQ_ADMIN` |
| `BRANCH_SUPER_ADMIN` | `ROLE_ADMIN` |
| `ADMIN` | `ROLE_ADMIN`, `ROLE_OPS` |
| `BRANCH_MANAGER` | `ROLE_ADMIN`, `ROLE_OPS` |

---

## 3. JWT 인증 필터 동작 방식

### 3.1 JwtAuthenticationFilter 흐름

```java
1. Authorization 헤더에서 JWT 토큰 추출
   - "Bearer <token>" 형식

2. 토큰 유효성 검사
   - jwtService.isTokenValid(token)

3. 사용자 정보 조회
   - DB에서 사용자 조회 시도 (userService.findByEmail)
   - 사용자 있음 → createAuthoritiesFromUser()
   - 사용자 없음 → createAuthoritiesFromActorRole() (Ops Portal 전용)

4. SecurityContext에 인증 정보 설정
   - UsernamePasswordAuthenticationToken 생성
   - authorities 포함
   - SecurityContextHolder.getContext().setAuthentication()
```

### 3.2 권한 생성 로직

#### createAuthoritiesFromActorRole() (Ops Portal 전용)

```java
// JWT 토큰의 actorRole을 Spring Security 권한으로 변환
if (actorRole == "HQ_ADMIN" || actorRole == "SUPER_HQ_ADMIN") {
    authorities.add("ROLE_ADMIN");
    authorities.add("ROLE_OPS");
    authorities.add("ROLE_HQ_ADMIN");
} else if (actorRole == "ADMIN") {
    authorities.add("ROLE_ADMIN");
    authorities.add("ROLE_OPS");
} else if (actorRole == "OPS") {
    authorities.add("ROLE_OPS");
}
```

---

## 4. Spring Security 설정 분석

### 4.1 SecurityConfig 주요 설정

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)  // @PreAuthorize 활성화
public class SecurityConfig {
    // ...
}
```

**설정 확인**:
- ✅ `@EnableMethodSecurity(prePostEnabled = true)` 설정됨
- ✅ `@PreAuthorize` 사용 가능해야 함
- ⚠️ **하지만 실제로 작동하지 않음**

### 4.2 개발 환경 HTTP 권한 설정

```java
.authorizeHttpRequests(authz -> authz
    .requestMatchers("/api/v1/ops/auth/**").permitAll()
    .requestMatchers("/api/v1/ops/**").authenticated()  // 인증 필요
    .anyRequest().permitAll()  // 나머지는 허용
)
```

**주의사항**:
- `.anyRequest().permitAll()`은 HTTP 레벨 권한만 제어
- `@PreAuthorize`는 메서드 레벨 권한이므로 별개
- 하지만 `@PreAuthorize`가 작동하지 않는 이유는 다른 곳에 있을 수 있음

---

## 5. @PreAuthorize가 작동하지 않는 원인 분석

### 5.1 가능한 원인들

#### 원인 1: SecurityContext에 인증 정보가 없음
- **확인**: JWT 필터가 실행되지만 SecurityContext에 설정되지 않음
- **증상**: `@PreAuthorize`가 `Authentication`을 찾지 못함
- **해결**: JWT 필터 로그 확인 필요

#### 원인 2: Method Security 프록시 문제
- **확인**: 컨트롤러가 프록시로 감싸지지 않음
- **증상**: `@PreAuthorize`가 실행되지 않음
- **해결**: Spring AOP 프록시 설정 확인

#### 원인 3: 권한 형식 불일치
- **확인**: `hasRole('ADMIN')`은 `ROLE_ADMIN`을 찾음
- **증상**: 권한이 있어도 인식하지 못함
- **해결**: 권한 형식 확인 (현재는 `ROLE_ADMIN` 형식으로 설정됨)

#### 원인 4: 필터 체인 순서 문제
- **확인**: JWT 필터가 다른 필터보다 먼저 실행되어야 함
- **증상**: 인증 정보가 덮어씌워짐
- **해결**: 필터 순서 확인 (현재는 올바름)

### 5.2 실제 문제

**현재 상황**:
- JWT 필터는 정상 작동 (로그 확인됨)
- SecurityContext에 인증 정보 설정됨 (로그 확인됨)
- 하지만 `@PreAuthorize`가 작동하지 않음

**가능한 원인**:
1. **Method Security가 프록시를 생성하지 못함**
   - 컨트롤러가 `@RestController`로 선언되어 있어 프록시 생성 문제 가능
   - 하지만 일반적으로는 문제 없어야 함

2. **SecurityContext가 요청 간 공유되지 않음**
   - 필터에서 설정한 SecurityContext가 컨트롤러까지 전달되지 않음
   - 하지만 로그상으로는 설정되어 있음

3. **@PreAuthorize가 예외를 던지지 않고 조용히 실패**
   - 권한이 없을 때 예외를 던져야 하는데, 조용히 통과함
   - 이 경우 `AccessDeniedException`이 발생해야 함

---

## 6. 현재 해결 방법: 수동 권한 체크

### 6.1 구현 패턴

```java
@GetMapping("/requests")
public ResponseEntity<ApiResponse<Page<OnboardingRequest>>> getRequests(...) {
    // 1. 인증 정보 확인
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) {
        throw new AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
    }
    
    // 2. 권한 체크
    boolean hasAdminRole = auth.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    boolean hasOpsRole = auth.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_OPS"));
    
    if (!hasAdminRole && !hasOpsRole) {
        throw new AccessDeniedException("접근 권한이 없습니다.");
    }
    
    // 3. 비즈니스 로직 실행
    // ...
}
```

### 6.2 적용된 컨트롤러

- ✅ `TenantOpsController` - 테넌트 관리 API
- ✅ `DashboardOpsController` - 대시보드 메트릭 API
- ✅ `OnboardingController` - 온보딩 요청 API (일부)

### 6.3 아직 @PreAuthorize 사용 중인 컨트롤러

- ⚠️ `OnboardingController` - `/requests/{id}/retry`, `/requests/{id}/decision`
- ⚠️ `PricingPlanOpsController` - 모든 메서드
- ⚠️ `FeatureFlagOpsController` - 모든 메서드
- ⚠️ `TenantPgConfigurationOpsController` - 모든 메서드
- ⚠️ `ErdOpsController` - 모든 메서드

---

## 7. 권한 체크 통합 방안

### 7.1 옵션 1: 모든 컨트롤러에 수동 권한 체크 적용 (현재 방식)

**장점**:
- 확실하게 작동함
- 디버깅이 쉬움
- 로깅이 명확함

**단점**:
- 코드 중복
- 유지보수 어려움
- 일관성 문제

### 7.2 옵션 2: @PreAuthorize 문제 해결

**필요한 작업**:
1. Method Security 프록시 설정 확인
2. SecurityContext 전달 확인
3. 권한 형식 일치 확인

**장점**:
- 선언적 권한 체크
- 코드 중복 제거
- Spring Security 표준 방식

**단점**:
- 문제 원인 파악이 어려움
- 디버깅이 복잡함

### 7.3 옵션 3: 공통 권한 체크 유틸리티 생성

```java
public class OpsPermissionUtils {
    public static void requireAdminOrOps() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
        }
        
        boolean hasAdminRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean hasOpsRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_OPS"));
        
        if (!hasAdminRole && !hasOpsRole) {
            throw new AccessDeniedException("접근 권한이 없습니다.");
        }
    }
}
```

**사용 예시**:
```java
@GetMapping("/requests")
public ResponseEntity<ApiResponse<Page<OnboardingRequest>>> getRequests(...) {
    OpsPermissionUtils.requireAdminOrOps();
    // 비즈니스 로직
}
```

**장점**:
- 코드 중복 제거
- 일관성 유지
- 유지보수 용이

---

## 8. 권장 사항

### 8.1 단기 해결책 (현재)

1. **모든 Ops Portal 컨트롤러에 수동 권한 체크 적용**
   - 이미 적용된 컨트롤러: `TenantOpsController`, `DashboardOpsController`, `OnboardingController` (일부)
   - 추가 적용 필요: 나머지 Ops 컨트롤러들

2. **공통 유틸리티 생성**
   - `OpsPermissionUtils.requireAdminOrOps()` 메서드 생성
   - 모든 컨트롤러에서 재사용

### 8.2 장기 해결책

1. **@PreAuthorize 문제 원인 파악 및 해결**
   - Method Security 프록시 설정 확인
   - SecurityContext 전달 확인
   - 로그 분석을 통한 원인 파악

2. **권한 시스템 통합**
   - @PreAuthorize와 수동 체크 중 하나로 통일
   - 일관된 권한 체크 패턴 적용

---

## 9. 현재 상태 요약

### 9.1 작동하는 부분

- ✅ JWT 인증 필터
- ✅ SecurityContext에 인증 정보 설정
- ✅ 권한(GrantedAuthority) 생성 및 설정
- ✅ 수동 권한 체크 (컨트롤러 내부)

### 9.2 작동하지 않는 부분

- ❌ `@PreAuthorize` 어노테이션
- ⚠️ 일부 컨트롤러의 권한 체크 누락

### 9.3 다음 단계

1. 나머지 Ops 컨트롤러에 수동 권한 체크 적용
2. 공통 유틸리티 생성
3. @PreAuthorize 문제 원인 파악 (선택사항)

---

## 10. 참고 파일

- `SecurityConfig.java` - Spring Security 설정
- `JwtAuthenticationFilter.java` - JWT 인증 필터
- `SecurityRoleConstants.java` - 권한 상수 정의
- `TenantOpsController.java` - 수동 권한 체크 예시
- `DashboardOpsController.java` - 수동 권한 체크 예시
- `OnboardingController.java` - 수동 권한 체크 예시 (일부)

