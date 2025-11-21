# 코어솔루션 표준화 계획

## 📋 개요

CoreSolution 플랫폼 전반에 걸쳐 표준화가 필요한 부분을 식별하고, 체계적으로 표준화를 진행하여 유지보수성과 확장성을 향상시킵니다.

**작성일**: 2025-01-XX  
**버전**: 1.0.0  
**상태**: Phase 0 완료, Phase 1 진행 중

## ⚡ 즉시 조치 필요 사항

다음 항목들은 **지금 단계에서 반드시 수정**해야 하며, 추후에는 더 어려워집니다:

1. **API 응답 형식 불일치** (P0) - 프론트엔드 통합 어려움
2. **에러 처리 불일치** (P0) - 디버깅 및 에러 처리 복잡도 증가
3. **DTO 네이밍 불일치** (P1) - 개발자 혼란 및 코드 검색 어려움
4. **권한 관리 패턴 불일치** (P1) - 보안 취약점 가능성

## 🎯 표준화 목표

1. **일관된 API 구조**: 모든 API가 동일한 응답 형식과 에러 처리 방식 사용
2. **표준화된 DTO 패턴**: Request/Response DTO 명명 규칙 및 구조 통일
3. **통합된 에러 처리**: 전역 예외 처리 및 표준 에러 응답 형식
4. **표준화된 권한 관리**: 일관된 권한 체크 패턴 및 서비스
5. **API 경로 표준화**: RESTful API 경로 규칙 통일
6. **서비스 레이어 표준화**: 인터페이스/구현체 패턴 일관성
7. **로깅 표준화**: 일관된 로깅 패턴 및 레벨

## 🔍 현재 상태 분석

### 1. API 응답 형식 불일치 ⚠️

**문제점**:
- 일부 API: `{success: true, message: "...", data: {...}}` 형식
- 일부 API: `ResponseEntity<Map<String, Object>>` 직접 반환
- 일부 API: Entity 객체 직접 반환
- 일부 API: `List<Entity>` 직접 반환

**영향**:
- 프론트엔드에서 일관된 에러 처리 불가
- API 클라이언트 개발 복잡도 증가
- 문서화 어려움

**예시**:
```java
// ✅ 표준화된 형식 (CommonCodeController)
return ResponseEntity.ok(Map.of(
    "success", true,
    "data", response
));

// ❌ 비표준 형식 (일부 Controller)
return ResponseEntity.ok(entity);
return ResponseEntity.ok(list);
```

### 2. DTO 네이밍 불일치 ⚠️

**문제점**:
- `*Request`, `*Response`, `*Dto` 혼재
- 일부는 `CreateRequest`, 일부는 `Request`
- 일부는 `Response`, 일부는 `Dto`

**영향**:
- 개발자 혼란
- 코드 검색 어려움
- 일관성 부족

**예시**:
```
✅ 표준: CommonCodeCreateRequest, CommonCodeResponse
❌ 비표준: BranchDto, UserDto, PaymentRequest
```

### 3. 에러 처리 불일치 ⚠️

**문제점**:
- `ErrorResponse`가 두 곳에 존재 (`consultation.dto`, `core.dto`)
- 일부 Controller는 직접 try-catch로 처리
- 일부는 GlobalExceptionHandler 사용
- 에러 응답 형식 불일치

**영향**:
- 에러 처리 로직 중복
- 일관된 에러 응답 불가
- 디버깅 어려움

### 4. 권한 관리 패턴 불일치 ⚠️

**문제점**:
- `SecurityUtils.checkPermission()`
- `PermissionCheckUtils.checkPermission()`
- `DynamicPermissionService.hasPermission()`
- `SecurityAspect` (AOP)
- `@RequireRole` 어노테이션

**영향**:
- 권한 체크 로직 중복
- 일관성 부족
- 유지보수 어려움

### 5. API 경로 불일치 ⚠️

**문제점**:
- `/api/v1/...` (표준화된 것)
- `/api/...` (레거시)
- `/api/auth/...` (인증)
- 일관성 없음

**영향**:
- API 버전 관리 어려움
- 문서화 복잡도 증가

### 6. 서비스 레이어 불일치 ⚠️

**문제점**:
- 일부는 인터페이스/구현체 분리 (`*Service`, `*ServiceImpl`)
- 일부는 직접 구현 (인터페이스 없음)
- 일부는 `@Service`만 사용

**영향**:
- 테스트 작성 어려움
- 의존성 주입 복잡도 증가
- 확장성 제한

## 📊 우선순위 매트릭스

| 항목 | 중요도 | 긴급도 | 영향 범위 | 우선순위 |
|------|--------|--------|-----------|----------|
| API 응답 형식 표준화 | 높음 | 높음 | 전체 | **P0** |
| 에러 처리 표준화 | 높음 | 높음 | 전체 | **P0** |
| DTO 네이밍 표준화 | 중간 | 중간 | 전체 | **P1** |
| 권한 관리 표준화 | 높음 | 중간 | 보안 | **P1** |
| API 경로 표준화 | 중간 | 낮음 | API | **P2** |
| 서비스 레이어 표준화 | 중간 | 낮음 | 아키텍처 | **P2** |
| 로깅 표준화 | 낮음 | 낮음 | 운영 | **P3** |

## 🏗️ 표준화 계획

### Phase 0: 표준 정의 및 합의 (1주) 🚧 진행 중

#### 0.1 표준 응답 형식 정의 ✅ 완료

**성공 응답**:
```java
{
  "success": true,
  "message": "성공 메시지 (선택)",
  "data": {...},
  "timestamp": "2025-01-XX'T'HH:mm:ss"
}
```

**에러 응답**:
```java
{
  "success": false,
  "message": "에러 메시지",
  "errorCode": "ERROR_CODE",
  "timestamp": "2025-01-XX'T'HH:mm:ss",
  "status": 400,
  "details": "상세 정보 (선택)"
}
```

#### 0.2 DTO 네이밍 규칙 정의 ✅

**Request DTO**:
- 생성: `{Entity}CreateRequest`
- 수정: `{Entity}UpdateRequest`
- 조회: `{Entity}QueryRequest` (필요시)
- 예: `CommonCodeCreateRequest`, `TenantRoleUpdateRequest`

**Response DTO**:
- 단일: `{Entity}Response`
- 목록: `{Entity}ListResponse`
- 예: `CommonCodeResponse`, `CommonCodeListResponse`

**레거시 DTO**:
- 기존 `*Dto`는 점진적으로 `*Request`/`*Response`로 마이그레이션
- 하위 호환성 유지

#### 0.3 API 경로 규칙 정의 ✅

```
/api/v1/{resource}              # 표준 CRUD API
/api/v1/{resource}/{id}         # 리소스별 상세
/api/v1/{resource}/{id}/{action} # 리소스별 액션

예:
/api/v1/common-codes
/api/v1/tenant-roles
/api/v1/user-role-assignments
```

**레거시 경로**:
- `/api/{resource}` → 점진적으로 `/api/v1/{resource}`로 마이그레이션
- 하위 호환성 유지 (deprecated 표시)

#### 0.4 에러 처리 표준 정의 ✅ 완료

**ErrorResponse 통합**:
- ✅ `com.coresolution.core.dto.ErrorResponse` 표준 구조로 업데이트 완료
- ✅ `GlobalExceptionHandler`가 `core.dto.ErrorResponse` 사용하도록 변경 완료
- ⚠️ `com.coresolution.consultation.dto.ErrorResponse`는 하위 호환성을 위해 유지 (점진적 마이그레이션)
- ✅ `ApiResponse` 표준 응답 래퍼 생성 완료
- ✅ `BaseApiController` 기본 Controller 클래스 생성 완료

#### 0.5 권한 관리 표준 정의 ✅

**표준 패턴**:
1. **서비스 레이어**: `DynamicPermissionService.hasPermission()` 사용
2. **Controller 레이어**: `CommonCodePermissionService` 같은 도메인별 권한 서비스 사용
3. **AOP**: `@RequireRole` 어노테이션 (선택적)

**통합 방향**:
- `SecurityUtils`, `PermissionCheckUtils` → `DynamicPermissionService`로 통합
- 도메인별 권한 서비스는 `DynamicPermissionService`를 사용

### Phase 1: 핵심 표준화 (2-3주) - P0

#### 1.1 표준 응답 래퍼 생성 ✅ 완료

**파일**: `src/main/java/com/coresolution/core/dto/ApiResponse.java` ✅ 생성 완료

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .message(message)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }
}
```

#### 1.2 ErrorResponse 통합 ✅ 완료

**작업**:
1. ✅ `com.coresolution.core.dto.ErrorResponse`를 표준 구조로 업데이트 완료
2. ✅ `GlobalExceptionHandler`가 `core.dto.ErrorResponse` 사용하도록 변경 완료
3. ⚠️ `com.coresolution.consultation.dto.ErrorResponse`는 점진적 마이그레이션 예정

#### 1.3 BaseApiController 생성 ✅ 완료

**파일**: `src/main/java/com/coresolution/core/controller/BaseApiController.java` ✅ 생성 완료

**참고**: 기존 `BaseController` 인터페이스는 유지 (하위 호환성)

```java
@RestController
public abstract class BaseController {
    
    protected <T> ResponseEntity<ApiResponse<T>> success(T data) {
        return ResponseEntity.ok(ApiResponse.success(data));
    }
    
    protected <T> ResponseEntity<ApiResponse<T>> success(String message, T data) {
        return ResponseEntity.ok(ApiResponse.success(message, data));
    }
    
    protected <T> ResponseEntity<ApiResponse<T>> created(T data) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("생성되었습니다.", data));
    }
    
    protected ResponseEntity<ErrorResponse> error(String message, String errorCode, HttpStatus status) {
        return ResponseEntity.status(status)
            .body(ErrorResponse.of(message, errorCode, status.value()));
    }
}
```

#### 1.4 주요 Controller 마이그레이션 ✅ 완료

**우선순위**:
1. `CommonCodeController` ✅ (이미 표준화됨)
2. `TenantRoleController` ✅ (완료)
3. `UserRoleAssignmentController` ✅ (완료)
4. `TenantDashboardController` ✅ (완료)
5. 기타 핵심 Controller (다음 단계)

**작업**:
- ✅ 모든 응답을 `ApiResponse`로 래핑
- ✅ 에러는 GlobalExceptionHandler에 위임
- ✅ 직접 try-catch 제거
- ✅ 표준화된 로깅 패턴 적용

### Phase 2: DTO 표준화 (2주) - P1

#### 2.1 DTO 네이밍 규칙 적용

**작업**:
1. 기존 `*Dto` 파일 식별
2. `*Request`/`*Response`로 리네이밍 계획 수립
3. 점진적 마이그레이션

**우선순위**:
1. `BranchDto` → `BranchResponse`, `BranchCreateRequest`, `BranchUpdateRequest`
2. `UserDto` → `UserResponse`, `UserCreateRequest`, `UserUpdateRequest`
3. `PaymentRequest` → 유지 (이미 Request)
4. 기타 DTO

#### 2.2 DTO 구조 표준화

**공통 필드**:
- 모든 Response DTO에 `createdAt`, `updatedAt` 포함
- 모든 Request DTO에 검증 어노테이션 추가
- `koreanName` 필수 (한국 사용)

### Phase 3: 권한 관리 표준화 (1-2주) - P1

#### 3.1 권한 서비스 통합

**작업**:
1. `DynamicPermissionService`를 표준으로 정의
2. `SecurityUtils`, `PermissionCheckUtils` → `DynamicPermissionService` 사용
3. 도메인별 권한 서비스는 `DynamicPermissionService`를 주입받아 사용

**예시**:
```java
@Service
@RequiredArgsConstructor
public class CommonCodePermissionService {
    private final DynamicPermissionService dynamicPermissionService;
    
    public boolean canCreateCode(User user, String tenantId) {
        // DynamicPermissionService 사용
        return dynamicPermissionService.hasPermission(user, "COMMON_CODE:CREATE");
    }
}
```

#### 3.2 권한 체크 패턴 통일

**Controller 레이어**:
- 도메인별 권한 서비스 사용 (예: `CommonCodePermissionService`)
- 직접 권한 체크 로직 제거

**Service 레이어**:
- `DynamicPermissionService` 직접 사용 (필요시)

### Phase 4: API 경로 표준화 (1주) - P2

#### 4.1 API 경로 마이그레이션

**작업**:
1. 레거시 `/api/{resource}` → `/api/v1/{resource}` 마이그레이션
2. 하위 호환성을 위해 레거시 경로 유지 (deprecated)
3. Swagger 문서 업데이트

**우선순위**:
1. 핵심 API부터 마이그레이션
2. 점진적으로 확장

### Phase 5: 서비스 레이어 표준화 (1-2주) - P2

#### 5.1 서비스 인터페이스 추가

**작업**:
1. 인터페이스가 없는 서비스 식별
2. 인터페이스 생성
3. 구현체는 `*ServiceImpl`로 명명

**예외**:
- 유틸리티 성격의 서비스는 인터페이스 불필요
- 단순 CRUD 서비스는 인터페이스 필수

### Phase 6: 로깅 표준화 (1주) - P3

#### 6.1 로깅 패턴 정의

**표준**:
- `log.info()`: 비즈니스 로직 주요 단계
- `log.warn()`: 경고 상황 (권한 없음, 검증 실패 등)
- `log.error()`: 에러 상황 (예외 발생)

**로깅 형식**:
```java
log.info("🔧 공통코드 생성: 그룹={}, 값={}", codeGroup, codeValue);
log.warn("⚠️ 권한 없음: user={}, permission={}", userId, permission);
log.error("❌ 공통코드 생성 실패: {}", e.getMessage(), e);
```

## 📅 실행 계획

### Week 1-2: Phase 0 + Phase 1.1-1.3
- 표준 정의 문서화
- ApiResponse, ErrorResponse 통합
- BaseController 생성

### Week 3-4: Phase 1.4 + Phase 2
- 주요 Controller 마이그레이션
- DTO 네이밍 표준화 시작

### Week 5-6: Phase 3 + Phase 4
- 권한 관리 표준화
- API 경로 마이그레이션

### Week 7-8: Phase 5 + Phase 6
- 서비스 레이어 표준화
- 로깅 표준화

## ⚠️ 주의사항

### 하위 호환성 유지
- 모든 변경은 하위 호환성을 유지해야 함
- 레거시 API는 deprecated 표시 후 점진적 제거
- 프론트엔드와의 호환성 확인 필수

### 점진적 마이그레이션
- 한 번에 모든 것을 변경하지 않음
- 우선순위에 따라 단계적으로 진행
- 각 단계마다 테스트 필수

### 문서화
- 모든 표준 규칙 문서화
- 마이그레이션 가이드 제공
- 개발자 가이드 업데이트

## 📚 관련 문서

- [공통코드 표준화 계획](./COMMON_CODE_STANDARDIZATION_PLAN.md) ✅
- [API 설계 문서](../archive/legacy-docs-backup-2025-10-14/API_DESIGN.md)
- [에러 처리 가이드](./WEEK6_ERROR_HANDLING_AND_LOGGING.md)

## ✅ 체크리스트

### Phase 0: 표준 정의
- [ ] 표준 응답 형식 문서화
- [ ] DTO 네이밍 규칙 문서화
- [ ] API 경로 규칙 문서화
- [ ] 에러 처리 표준 문서화
- [ ] 권한 관리 표준 문서화

### Phase 1: 핵심 표준화
- [ ] ApiResponse 생성
- [ ] ErrorResponse 통합
- [ ] BaseController 생성
- [ ] CommonCodeController 마이그레이션 ✅
- [ ] TenantRoleController 마이그레이션
- [ ] UserRoleAssignmentController 마이그레이션
- [ ] TenantDashboardController 마이그레이션

### Phase 2: DTO 표준화
- [ ] DTO 네이밍 규칙 적용 계획 수립
- [ ] BranchDto 마이그레이션
- [ ] UserDto 마이그레이션
- [ ] 기타 주요 DTO 마이그레이션

### Phase 3: 권한 관리 표준화
- [ ] DynamicPermissionService 표준화
- [ ] SecurityUtils 통합
- [ ] PermissionCheckUtils 통합
- [ ] 도메인별 권한 서비스 표준화

### Phase 4: API 경로 표준화
- [ ] 레거시 API 경로 식별
- [ ] /api/v1 마이그레이션 계획
- [ ] 핵심 API 마이그레이션
- [ ] Swagger 문서 업데이트

### Phase 5: 서비스 레이어 표준화
- [ ] 인터페이스 없는 서비스 식별
- [ ] 인터페이스 생성
- [ ] 구현체 리네이밍

### Phase 6: 로깅 표준화
- [ ] 로깅 패턴 정의
- [ ] 주요 서비스 로깅 업데이트

---

## 🚀 즉시 시작 가능한 작업

### Phase 0 완료 ✅
- ✅ ApiResponse 생성 완료 (`src/main/java/com/coresolution/core/dto/ApiResponse.java`)
- ✅ ErrorResponse 통합 완료 (`src/main/java/com/coresolution/core/dto/ErrorResponse.java`)
- ✅ BaseApiController 생성 완료 (`src/main/java/com/coresolution/core/controller/BaseApiController.java`)
- ✅ GlobalExceptionHandler 업데이트 완료

### 다음 단계 (즉시 시작 가능)

#### 1. TenantRoleController 표준화 (우선순위: 높음)
**파일**: `src/main/java/com/coresolution/core/controller/TenantRoleController.java`

**작업**:
1. `BaseApiController` 상속
2. 모든 응답을 `ApiResponse`로 래핑
3. 직접 try-catch 제거 (GlobalExceptionHandler에 위임)
4. 에러는 `error()` 메서드 사용

**예상 시간**: 1-2시간

#### 2. UserRoleAssignmentController 표준화
**파일**: `src/main/java/com/coresolution/core/controller/UserRoleAssignmentController.java`

**작업**: 동일한 패턴 적용

**예상 시간**: 1-2시간

#### 3. TenantDashboardController 표준화
**파일**: `src/main/java/com/coresolution/core/controller/TenantDashboardController.java`

**작업**: 동일한 패턴 적용

**예상 시간**: 1-2시간

## 📊 진행 상황 추적

### 완료율
- Phase 0: 100% ✅
- Phase 1: 20% 🚧 (ApiResponse, ErrorResponse, BaseApiController 완료)
- Phase 2: 0% ⏳
- Phase 3: 0% ⏳
- Phase 4: 0% ⏳
- Phase 5: 0% ⏳
- Phase 6: 0% ⏳

### 다음 마일스톤
- **Week 1-2**: Phase 1 완료 (주요 Controller 표준화)
- **Week 3-4**: Phase 2 완료 (DTO 표준화)
- **Week 5-6**: Phase 3 완료 (권한 관리 표준화)

---

**작성일**: 2025-01-XX  
**버전**: 1.0.0  
**작성자**: CoreSolution Development Team  
**최종 업데이트**: Phase 0 완료, Phase 1 진행 중

