# Ops Portal 표준화 가이드

## 개요

Ops Portal의 모든 컨트롤러와 온보딩 시스템을 표준화하여 일관성과 유지보수성을 향상시킵니다.

## 표준화 원칙

### 1. 컨트롤러 구조 표준화

모든 Ops Portal 컨트롤러는 다음 구조를 따라야 합니다:

```java
@Slf4j
@RestController
@RequestMapping("/api/v1/ops/{resource}")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class {Resource}OpsController extends BaseApiController {
    
    private final {Resource}Service service;
    
    @GetMapping
    public ResponseEntity<ApiResponse<{Type}>> getResource() {
        // 1. 권한 체크 (항상 첫 번째)
        OpsPermissionUtils.requireAdminOrOps();
        
        // 2. 비즈니스 로직
        {Type} result = service.getResource();
        
        // 3. 표준 응답 반환
        return success(result);
    }
}
```

### 2. 권한 체크 표준화

**중앙화된 권한 체크 유틸리티 사용**

모든 권한 체크는 `OpsPermissionUtils`를 사용해야 합니다:

```java
// ✅ 올바른 방법
OpsPermissionUtils.requireAdminOrOps();  // ADMIN 또는 OPS 역할 필요
OpsPermissionUtils.requireAdmin();        // ADMIN 역할만 필요
OpsPermissionUtils.requireOps();          // OPS 역할만 필요

// ❌ 잘못된 방법
@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")  // 개발 환경에서 작동하지 않음
// 수동 권한 체크 코드 중복
```

**권한 체크 위치**

권한 체크는 항상 메서드의 **첫 번째 줄**에 위치해야 합니다:

```java
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<Resource>> getResource(@PathVariable Long id) {
    // ✅ 권한 체크가 첫 번째
    OpsPermissionUtils.requireAdminOrOps();
    
    // 비즈니스 로직
    Resource resource = service.findById(id);
    return success(resource);
}
```

### 3. 응답 형식 표준화

모든 API 응답은 `ApiResponse` 래퍼를 사용해야 합니다:

```java
// ✅ 올바른 방법
return success(data);                    // 200 OK
return created("메시지", data);          // 201 Created
return updated("메시지", data);          // 200 OK (업데이트)
return noContent("메시지");              // 204 No Content

// ❌ 잘못된 방법
return ResponseEntity.ok(data);         // ApiResponse 래퍼 없음
return new ResponseEntity<>(data, HttpStatus.OK);
```

### 4. 예외 처리 표준화

예외는 `GlobalExceptionHandler`에 위임합니다:

```java
// ✅ 올바른 방법
if (resource == null) {
    throw new EntityNotFoundException("리소스를 찾을 수 없습니다: " + id);
}

// ❌ 잘못된 방법
if (resource == null) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ApiResponse.error("리소스를 찾을 수 없습니다"));
}
```

### 5. 로깅 표준화

중요한 작업은 로깅해야 합니다:

```java
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<Resource>> getResource(@PathVariable Long id) {
    OpsPermissionUtils.requireAdminOrOps();
    
    log.debug("리소스 조회: id={}", id);  // 디버그 레벨
    Resource resource = service.findById(id);
    
    log.info("리소스 조회 완료: id={}", id);  // 정보 레벨 (중요한 작업)
    return success(resource);
}
```

## 표준화 체크리스트

### 컨트롤러 작성 시 확인사항

- [ ] `BaseApiController`를 상속하는가?
- [ ] `@RequestMapping("/api/v1/ops/{resource}")` 경로를 사용하는가?
- [ ] 모든 메서드에서 `OpsPermissionUtils`를 사용하는가?
- [ ] 권한 체크가 메서드의 첫 번째 줄에 있는가?
- [ ] `ApiResponse` 래퍼를 사용하는가?
- [ ] 예외를 `GlobalExceptionHandler`에 위임하는가?
- [ ] 적절한 로깅을 포함하는가?

## 현재 표준화 상태

### ✅ 완료된 컨트롤러

- `DashboardOpsController` - 완전 표준화
- `TenantOpsController` - 완전 표준화
- `PricingPlanOpsController` - 완전 표준화
- `FeatureFlagOpsController` - 완전 표준화
- `TenantPgConfigurationOpsController` - 완전 표준화
- `ErdOpsController` - 완전 표준화
- `OnboardingController` - 완전 표준화 (2025-11-23)

### 📋 표준화 필요

- `TenantPgConfigurationController` - `@PreAuthorize` 사용 중
- `ErdController` - `@PreAuthorize` 사용 중

## 온보딩 시스템 표준화

### 온보딩 컨트롤러 구조

온보딩 컨트롤러는 두 가지 접근 패턴을 사용합니다:

1. **공개 엔드포인트** (온보딩 신청자용)
   - 권한 체크 없음
   - `validateOnboardingAccess()`로 기존 테넌트 사용자 차단

2. **관리자 엔드포인트** (Ops Portal용)
   - `OpsPermissionUtils.requireAdminOrOps()` 사용

```java
// 공개 엔드포인트 예시
@PostMapping("/requests")
public ResponseEntity<ApiResponse<OnboardingRequest>> create(
        @RequestBody @Valid OnboardingCreateRequest payload,
        HttpSession session) {
    // 기존 테넌트 사용자 차단
    validateOnboardingAccess(session);
    
    // 비즈니스 로직
    OnboardingRequest request = onboardingService.create(...);
    return created("온보딩 요청이 생성되었습니다.", request);
}

// 관리자 엔드포인트 예시
@GetMapping("/requests")
public ResponseEntity<ApiResponse<Page<OnboardingRequest>>> getRequests(
        @RequestParam(required = false) OnboardingStatus status,
        @PageableDefault(size = 20) Pageable pageable) {
    // 권한 체크
    OpsPermissionUtils.requireAdminOrOps();
    
    // 비즈니스 로직
    Page<OnboardingRequest> requests = onboardingService.findByStatus(status, pageable);
    return success(requests);
}
```

## 마이그레이션 가이드

### 기존 컨트롤러를 표준화하는 방법

1. **`@PreAuthorize` 제거**
   ```java
   // Before
   @PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
   @GetMapping
   public ResponseEntity<ApiResponse<List<Resource>>> getResources() {
       // ...
   }
   
   // After
   @GetMapping
   public ResponseEntity<ApiResponse<List<Resource>>> getResources() {
       OpsPermissionUtils.requireAdminOrOps();
       // ...
   }
   ```

2. **수동 권한 체크 코드 제거**
   ```java
   // Before
   @GetMapping
   public ResponseEntity<ApiResponse<Resource>> getResource() {
       Authentication auth = SecurityContextHolder.getContext().getAuthentication();
       if (auth == null) {
           throw new AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
       }
       boolean hasAdminRole = auth.getAuthorities().stream()
           .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
       // ...
   }
   
   // After
   @GetMapping
   public ResponseEntity<ApiResponse<Resource>> getResource() {
       OpsPermissionUtils.requireAdminOrOps();
       // ...
   }
   ```

3. **응답 형식 통일**
   ```java
   // Before
   return ResponseEntity.ok(ApiResponse.success(data));
   
   // After
   return success(data);
   ```

## 중앙화된 유틸리티

### OpsPermissionUtils

모든 권한 체크를 중앙화한 유틸리티 클래스:

```java
// 위치: com.coresolution.core.util.OpsPermissionUtils

// 사용 예시
OpsPermissionUtils.requireAdminOrOps();  // ADMIN 또는 OPS
OpsPermissionUtils.requireAdmin();        // ADMIN만
OpsPermissionUtils.requireOps();          // OPS만
```

**장점:**
- 일관된 권한 체크 로직
- 중앙화된 로깅
- 유지보수 용이
- 테스트 용이

## 참고 문서

- [Ops Portal 인증/권한 시스템 분석](./OPS_PERMISSION_SYSTEM_ANALYSIS.md)
- [Ops Portal 인증 수정 내역](./OPS_PORTAL_AUTH_FIX.md)
- [BaseApiController 문서](../../../src/main/java/com/coresolution/core/controller/BaseApiController.java)

## 업데이트 이력

- 2025-11-23: 초기 문서 작성, OnboardingController 표준화 완료

