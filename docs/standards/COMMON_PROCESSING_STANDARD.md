# 공통 처리 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 공통 처리 및 유틸리티 표준입니다.  
반복되는 작업을 표준화하여 코드 재사용성과 일관성을 보장합니다.

### 참조 문서
- [백엔드 코딩 표준](./BACKEND_CODING_STANDARD.md)
- [세션 표준](./SESSION_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)

### 구현 위치
- **세션 유틸리티**: `src/main/java/com/coresolution/consultation/utils/SessionUtils.java`
- **권한 체크 유틸리티**: `src/main/java/com/coresolution/consultation/util/PermissionCheckUtils.java`
- **보안 유틸리티**: `src/main/java/com/coresolution/consultation/util/SecurityUtils.java`

---

## 🎯 공통 처리 원칙

### 1. 중복 제거
```
동일한 로직은 공통 유틸리티로 추출
```

**장점**:
- ✅ 코드 재사용성 향상
- ✅ 일관된 동작 보장
- ✅ 유지보수 용이

### 2. 표준 유틸리티 사용
```
프로젝트에서 제공하는 표준 유틸리티 우선 사용
```

**원칙**:
- ✅ 기존 유틸리티 재사용
- ❌ 유사한 유틸리티 중복 생성 금지
- ❌ 직접 구현보다 유틸리티 사용 우선

### 3. 명확한 책임 분리
```
각 유틸리티는 단일 책임만 수행
```

**원칙**:
- ✅ 하나의 유틸리티 = 하나의 책임
- ❌ 여러 기능을 하나의 유틸리티에 혼재 금지

---

## 🔧 세션 관리

### 1. SessionUtils 사용

#### 현재 사용자 조회
```java
@GetMapping("/profile")
public ResponseEntity<ApiResponse<UserResponse>> getProfile(HttpSession session) {
    // 표준 유틸리티 사용
    User currentUser = SessionUtils.getCurrentUser(session);
    
    if (currentUser == null) {
        throw new UnauthorizedException("로그인이 필요합니다.");
    }
    
    return success(userService.getUserProfile(currentUser.getId()));
}
```

#### 테넌트 ID 조회
```java
@GetMapping("/dashboard")
public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(HttpSession session) {
    String tenantId = SessionUtils.getTenantId(session);
    
    if (tenantId == null) {
        throw new RuntimeException("테넌트 정보를 찾을 수 없습니다.");
    }
    
    return success(dashboardService.getDashboard(tenantId));
}
```

#### 역할 ID 조회
```java
@GetMapping("/permissions")
public ResponseEntity<ApiResponse<List<PermissionResponse>>> getPermissions(HttpSession session) {
    String roleId = SessionUtils.getRoleId(session);
    
    if (roleId == null) {
        throw new RuntimeException("역할 정보를 찾을 수 없습니다.");
    }
    
    return success(permissionService.getPermissions(roleId));
}
```

#### 관리자 여부 확인
```java
@PostMapping("/users")
public ResponseEntity<ApiResponse<UserResponse>> createUser(
        @RequestBody UserCreateRequest request,
        HttpSession session) {
    
    // 관리자 권한 확인
    if (!SessionUtils.isAdmin(session)) {
        throw new ForbiddenException("관리자 권한이 필요합니다.");
    }
    
    return created(userService.create(request));
}
```

### 2. 금지 사항

```java
// ❌ 금지: 세션 속성 직접 접근
User user = (User) session.getAttribute("user");
String tenantId = (String) session.getAttribute("tenantId");

// ✅ 권장: 표준 유틸리티 사용
User user = SessionUtils.getCurrentUser(session);
String tenantId = SessionUtils.getTenantId(session);
```

---

## 🔐 권한 체크

### 1. PermissionCheckUtils 사용

#### 기본 사용법
```java
@RequiredArgsConstructor
public class ResourceController extends BaseApiController {
    
    private final DynamicPermissionService dynamicPermissionService;
    
    @GetMapping("/data")
    public ResponseEntity<?> getData(HttpSession session) {
        // 권한 체크
        ResponseEntity<?> check = PermissionCheckUtils.checkPermission(
            session, 
            "DATA_VIEW", 
            dynamicPermissionService
        );
        
        if (check != null) {
            return check; // 401 또는 403 응답
        }
        
        // 권한 있음 - 비즈니스 로직 실행
        return success(dataService.getData());
    }
}
```

#### 권한 코드 확인
```java
// 여러 권한 중 하나라도 있으면 허용
boolean hasPermission = PermissionCheckUtils.hasAnyPermission(
    session,
    Arrays.asList("DATA_VIEW", "DATA_EDIT"),
    dynamicPermissionService
);

// 모든 권한이 있어야 허용
boolean hasAllPermissions = PermissionCheckUtils.hasAllPermissions(
    session,
    Arrays.asList("DATA_VIEW", "DATA_EDIT"),
    dynamicPermissionService
);
```

---

## 🛡️ 보안 처리

### 1. SecurityUtils 사용

#### SQL Injection 방지
```java
// SQL Injection 패턴 체크
boolean isSqlInjection = SecurityUtils.checkSQLInjection(userInput);

if (isSqlInjection) {
    throw new SecurityException("잘못된 입력입니다.");
}
```

#### XSS 방지
```java
// XSS 패턴 체크
boolean isXssAttempt = SecurityUtils.checkXSS(userInput);

if (isXssAttempt) {
    throw new SecurityException("잘못된 입력입니다.");
}
```

---

## 📋 공통 유틸리티 목록

### 1. 세션 관리 유틸리티

| 유틸리티 클래스 | 위치 | 용도 |
|---------------|------|------|
| SessionUtils | `consultation/utils/SessionUtils.java` | 세션 정보 조회 |

**주요 메서드**:
- `getCurrentUser(HttpSession)` - 현재 사용자 조회
- `getTenantId(HttpSession)` - 테넌트 ID 조회
- `getRoleId(HttpSession)` - 역할 ID 조회
- `getRole(HttpSession)` - 역할 조회
- `isAdmin(HttpSession)` - 관리자 여부 확인
- `isLoggedIn(HttpSession)` - 로그인 여부 확인

### 2. 권한 체크 유틸리티

| 유틸리티 클래스 | 위치 | 용도 |
|---------------|------|------|
| PermissionCheckUtils | `consultation/util/PermissionCheckUtils.java` | 권한 체크 |
| OpsPermissionUtils | `core/util/OpsPermissionUtils.java` | Ops 권한 체크 |

**주요 메서드**:
- `checkPermission(...)` - 권한 체크 (ResponseEntity 반환)
- `hasPermission(...)` - 권한 확인 (boolean 반환)
- `hasAnyPermission(...)` - 여러 권한 중 하나 확인
- `hasAllPermissions(...)` - 모든 권한 확인

### 3. 암호화 유틸리티

| 유틸리티 클래스 | 위치 | 용도 |
|---------------|------|------|
| PersonalDataEncryptionUtil | `consultation/util/PersonalDataEncryptionUtil.java` | 개인정보 암호화 |
| EncryptionUtil | `consultation/util/EncryptionUtil.java` | 일반 암호화 |

**주요 메서드**:
- `encrypt(String)` - 암호화
- `decrypt(String)` - 복호화
- `safeEncrypt(String)` - 안전한 암호화
- `safeDecrypt(String)` - 안전한 복호화

### 4. 보안 유틸리티

| 유틸리티 클래스 | 위치 | 용도 |
|---------------|------|------|
| SecurityUtils | `consultation/util/SecurityUtils.java` | 보안 체크 |

**주요 메서드**:
- `checkSQLInjection(String)` - SQL Injection 체크
- `checkXSS(String)` - XSS 체크

---

## 🔄 공통 처리 패턴

### 1. 테넌트 컨텍스트 설정

#### 패턴
```java
@GetMapping
public ResponseEntity<ApiResponse<List<ResourceResponse>>> findAll(HttpSession session) {
    // 1. 테넌트 ID 조회 (표준 유틸리티 사용)
    String tenantId = SessionUtils.getTenantId(session);
    
    if (tenantId == null) {
        throw new RuntimeException("테넌트 정보를 찾을 수 없습니다.");
    }
    
    // 2. 테넌트 컨텍스트 설정
    TenantContextHolder.setTenantId(tenantId);
    
    try {
        // 3. 비즈니스 로직 실행
        List<ResourceResponse> list = resourceService.findAll(tenantId);
        return success(list);
    } finally {
        // 4. 컨텍스트 정리
        TenantContextHolder.clear();
    }
}
```

### 2. 권한 체크 패턴

#### 패턴
```java
@PostMapping
public ResponseEntity<ApiResponse<ResourceResponse>> create(
        @RequestBody ResourceCreateRequest request,
        HttpSession session) {
    
    // 1. 권한 체크 (표준 유틸리티 사용)
    ResponseEntity<?> check = PermissionCheckUtils.checkPermission(
        session, 
        "RESOURCE_CREATE", 
        dynamicPermissionService
    );
    
    if (check != null) {
        return check; // 401 또는 403 응답
    }
    
    // 2. 테넌트 ID 조회
    String tenantId = SessionUtils.getTenantId(session);
    
    // 3. 생성자 ID 조회
    User currentUser = SessionUtils.getCurrentUser(session);
    String createdBy = currentUser.getId().toString();
    
    // 4. 비즈니스 로직 실행
    ResourceResponse response = resourceService.create(request, tenantId, createdBy);
    return created(response);
}
```

### 3. 데이터 변환 패턴

#### Entity → Response DTO
```java
/**
 * Entity를 Response DTO로 변환
 */
public static ResourceResponse fromEntity(Resource entity) {
    return ResourceResponse.builder()
        .id(entity.getId())
        .field1(entity.getField1())
        .field2(entity.getField2())
        .createdAt(entity.getCreatedAt())
        .build();
}

/**
 * Entity List를 Response DTO List로 변환
 */
public static List<ResourceResponse> fromEntityList(List<Resource> entities) {
    return entities.stream()
        .map(ResourceResponse::fromEntity)
        .collect(Collectors.toList());
}
```

### 4. 검증 패턴

#### 파라미터 검증
```java
/**
 * 파라미터 검증 유틸리티
 */
public class ValidationUtils {
    
    /**
     * 필수 값 검증
     */
    public static void requireNonNull(Object value, String fieldName) {
        if (value == null) {
            throw new ValidationException(fieldName + "은(는) 필수입니다.");
        }
    }
    
    /**
     * 문자열 길이 검증
     */
    public static void validateLength(String value, int min, int max, String fieldName) {
        if (value == null || value.length() < min || value.length() > max) {
            throw new ValidationException(
                String.format("%s은(는) %d자 이상 %d자 이하여야 합니다.", fieldName, min, max)
            );
        }
    }
}
```

---

## 📊 공통 상수 관리

### 1. 세션 상수

```java
/**
 * 세션 상수 클래스
 * 모든 세션 속성명은 여기서 관리
 */
public class SessionConstants {
    public static final String USER_OBJECT = "user";
    public static final String TENANT_ID = "tenantId";
    public static final String ROLE_ID = "roleId";
    public static final String PERMISSIONS = "permissions";
}
```

### 2. 사용 원칙

```java
// ❌ 금지: 하드코딩된 세션 속성명
session.getAttribute("user");
session.setAttribute("tenantId", tenantId);

// ✅ 권장: 상수 사용
session.getAttribute(SessionConstants.USER_OBJECT);
session.setAttribute(SessionConstants.TENANT_ID, tenantId);

// ✅ 더 권장: 표준 유틸리티 사용
SessionUtils.getCurrentUser(session);
SessionUtils.setTenantId(session, tenantId);
```

---

## ✅ 체크리스트

### 공통 처리 적용 시
- [ ] 기존 유틸리티 확인 후 사용
- [ ] 세션 접근은 SessionUtils 사용
- [ ] 권한 체크는 PermissionCheckUtils 사용
- [ ] 암호화는 PersonalDataEncryptionUtil 사용
- [ ] 상수는 표준 상수 클래스 사용
- [ ] 유사한 유틸리티 중복 생성 금지

### 새 유틸리티 생성 시
- [ ] 기존 유틸리티로 해결 가능한지 확인
- [ ] 단일 책임 원칙 준수
- [ ] 명확한 JavaDoc 작성
- [ ] 테스트 코드 작성
- [ ] 표준 패키지 위치 사용

---

## 🚫 금지 사항

### 1. 직접 세션 접근 금지
```java
// ❌ 금지
User user = (User) session.getAttribute("user");

// ✅ 권장
User user = SessionUtils.getCurrentUser(session);
```

### 2. 권한 체크 로직 중복 금지
```java
// ❌ 금지: 직접 권한 체크 로직 구현
if (user.getRole() != UserRole.ADMIN) {
    return ResponseEntity.status(403).build();
}

// ✅ 권장: 표준 유틸리티 사용
ResponseEntity<?> check = PermissionCheckUtils.checkPermission(
    session, "RESOURCE_CREATE", dynamicPermissionService
);
if (check != null) {
    return check;
}
```

### 3. 유틸리티 중복 생성 금지
```java
// ❌ 금지: 유사한 기능의 유틸리티 중복 생성
public class MySessionUtils {
    public static User getUser(HttpSession session) {
        // SessionUtils와 유사한 기능
    }
}

// ✅ 권장: 기존 유틸리티 사용
SessionUtils.getCurrentUser(session);
```

---

## 💡 베스트 프랙티스

### 1. 유틸리티 메서드 체이닝
```java
// 여러 단계의 처리
String tenantId = Optional.ofNullable(SessionUtils.getTenantId(session))
    .orElseThrow(() -> new RuntimeException("테넌트 정보를 찾을 수 없습니다."));

User currentUser = Optional.ofNullable(SessionUtils.getCurrentUser(session))
    .orElseThrow(() -> new UnauthorizedException("로그인이 필요합니다."));
```

### 2. 공통 예외 처리
```java
/**
 * 공통 예외 처리 유틸리티
 */
public class ExceptionUtils {
    
    /**
     * EntityNotFoundException 생성
     */
    public static EntityNotFoundException entityNotFound(String entityName, Object id) {
        return new EntityNotFoundException(entityName, id);
    }
    
    /**
     * ValidationException 생성
     */
    public static ValidationException validationError(String message) {
        return new ValidationException(message);
    }
}
```

### 3. 공통 변환 유틸리티
```java
/**
 * 공통 변환 유틸리티
 */
public class ConversionUtils {
    
    /**
     * String을 Long으로 안전하게 변환
     */
    public static Long toLong(String value, Long defaultValue) {
        try {
            return value != null ? Long.parseLong(value) : defaultValue;
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
    
    /**
     * List를 Page로 변환
     */
    public static <T> Page<T> toPage(List<T> list, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), list.size());
        return new PageImpl<>(list.subList(start, end), pageable, list.size());
    }
}
```

---

## 📞 문의

공통 처리 표준 관련 문의:
- 백엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-03

