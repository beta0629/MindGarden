# 세션 관리 표준

## 목적
세션 속성 접근 방식을 표준화하여 코드 일관성과 유지보수성을 향상시킵니다.

## 핵심 원칙

### 1. 하드코딩 금지
```java
// ❌ 잘못된 예시
String role = (String) session.getAttribute("role");
String tenantId = (String) session.getAttribute("tenantId");

// ✅ 올바른 예시
String role = SessionUtils.getRoleName(session);
String tenantId = SessionUtils.getTenantId(session);
```

### 2. SessionUtils 사용 필수
모든 세션 속성 접근은 `SessionUtils`의 표준 메서드를 통해야 합니다.

### 3. SessionConstants 상수 사용
세션 속성명은 반드시 `SessionConstants`에 정의된 상수를 사용해야 합니다.

## 세션 속성명 표준

### 표준 속성명 (SessionConstants)

```java
// User 객체
USER_OBJECT = "user"

// 테넌트 관련
TENANT_ID = "tenantId"
ROLE_ID = "roleId"  // tenant_role_id

// 역할 관련
ROLE = "role"  // UserRole enum의 name()

// 세션 관리
SESSION_ID = "sessionId"
```

**참고**: 
- ❌ `BRANCH_CODE`는 제거됨 (브랜치 개념 제거)
- 브랜치 관련 모든 코드는 테넌트 시스템으로 전환됨

## SessionUtils 표준 메서드

### 1. 사용자 정보 조회
```java
// User 객체 조회
User user = SessionUtils.getCurrentUser(session);

// 사용자 로그인 여부
boolean isLoggedIn = SessionUtils.isLoggedIn(session);
```

### 2. 테넌트 정보 조회
```java
// 테넌트 ID
String tenantId = SessionUtils.getTenantId(session);

// 역할 ID (tenant_role_id)
String roleId = SessionUtils.getRoleId(session);
```

### 3. 역할 정보 조회
```java
// 역할 (UserRole enum)
UserRole role = SessionUtils.getRole(session);

// 역할 이름 (String)
String roleName = SessionUtils.getRoleName(session);
```

### 4. 관리자 여부 확인
```java
// 관리자 여부 (표준 역할만)
boolean isAdmin = SessionUtils.isAdmin(session);
```

**표준 관리자 역할** (TENANT_ROLE_SYSTEM_STANDARD.md 참조):
- `ADMIN`: 기본 관리자
- `TENANT_ADMIN`: 테넌트 관리자
- `PRINCIPAL`: 원장
- `OWNER`: 사장

**제거된 레거시 역할**:
- `BRANCH_ADMIN`, `BRANCH_SUPER_ADMIN`, `BRANCH_MANAGER` (브랜치 개념 제거)
- `HQ_ADMIN`, `SUPER_HQ_ADMIN`, `HQ_MASTER`, `HQ_SUPER_ADMIN` (본사 개념 제거)

## 컨트롤러 표준 패턴

### 예시 1: MenuController
```java
@GetMapping("/admin")
public ResponseEntity<ApiResponse<List<MenuDTO>>> getAdminMenus(HttpSession session) {
    User user = SessionUtils.getCurrentUser(session);
    if (user == null || !SessionUtils.isAdmin(session)) {
        return ResponseEntity.status(403)
            .body(ApiResponse.error("관리자만 접근 가능합니다."));
    }
    // ...
}
```

### 예시 2: PermissionGroupController
```java
@GetMapping("/my")
public ResponseEntity<ApiResponse<List<String>>> getMyPermissionGroups(HttpSession session) {
    String tenantId = SessionUtils.getTenantId(session);
    String roleId = SessionUtils.getRoleId(session);
    
    if (tenantId == null || roleId == null) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error("세션 정보가 부족합니다."));
    }
    // ...
}
```

## SessionConstants 확장

### 추가된 상수
```java
// 테넌트 관련
public static final String TENANT_ID = "TENANT_ID";
public static final String ROLE_ID = "ROLE_ID";  // tenant_role_id

// User 객체 키
public static final String USER_OBJECT = "user";

// 세션 관리
public static final String SESSION_ID = "sessionId";
```

**제거된 상수**:
- ❌ `BRANCH_CODE` (브랜치 개념 제거)

## SessionUtils 확장

### 추가된 메서드
```java
// 테넌트 ID 조회 (User 객체에서 추출)
public static String getTenantId(HttpSession session) {
    // 1. 세션에서 직접 조회 시도
    String tenantId = (String) session.getAttribute(SessionConstants.TENANT_ID);
    if (tenantId != null) {
        return tenantId;
    }
    
    // 2. User 객체에서 추출
    User user = getCurrentUser(session);
    if (user != null && user.getTenantId() != null) {
        session.setAttribute(SessionConstants.TENANT_ID, user.getTenantId());
        return user.getTenantId();
    }
    
    return null;
}

// 역할 ID 조회 (UserRoleAssignment를 통해 조회)
public static String getRoleId(HttpSession session) {
    // 1. 세션에서 직접 조회 시도
    String roleId = (String) session.getAttribute(SessionConstants.ROLE_ID);
    if (roleId != null) {
        return roleId;
    }
    
    // 2. UserRoleAssignment를 통해 조회
    // 로그인 시 자동으로 세션에 저장됨
    
    return null;
}

// 역할 조회
public static UserRole getRole(HttpSession session) {
    User user = getCurrentUser(session);
    return user != null ? user.getRole() : null;
}

// 역할 이름 조회
public static String getRoleName(HttpSession session) {
    UserRole role = getRole(session);
    return role != null ? role.name() : null;
}

// 관리자 여부 확인 (표준 역할만)
public static boolean isAdmin(HttpSession session) {
    UserRole role = getRole(session);
    if (role == null) {
        return false;
    }
    String roleName = role.name();
    // 표준 관리자 역할만
    return "ADMIN".equals(roleName) || 
           "TENANT_ADMIN".equals(roleName) ||
           "PRINCIPAL".equals(roleName) ||
           "OWNER".equals(roleName);
}
```

**제거된 메서드**:
- ❌ `getBranchCode()` (브랜치 개념 제거)

## 마이그레이션 계획

### Phase 1: 상수 및 유틸리티 확장 ✅
1. `SessionConstants`에 누락된 상수 추가
2. `SessionUtils`에 표준 메서드 추가

### Phase 2: 컨트롤러 마이그레이션 ✅
1. `MenuController` - 하드코딩 제거
2. `PermissionGroupController` - 하드코딩 제거
3. `MenuPermissionController` - 하드코딩 제거
4. `TenantCommonCodeController` - 하드코딩 제거

### Phase 3: 브랜치 관련 코드 제거 ✅
1. `SessionUtils.getBranchCode()` 제거
2. `SessionConstants.BRANCH_CODE` 제거
3. 브랜치 관련 세션 저장 로직 제거
4. 레거시 브랜치 역할 체크 제거

### Phase 4: 검증
1. 모든 세션 접근이 `SessionUtils`를 통해 이루어지는지 확인
2. 하드코딩된 세션 속성명 검사 (CI/BI 체크)
3. 통합 테스트 실행

## 금지 사항

### ❌ 하드코딩된 세션 속성명
```java
session.getAttribute("role")
session.getAttribute("tenantId")
session.getAttribute("roleId")
session.getAttribute("user")
```

### ❌ 브랜치 관련 코드
```java
session.getAttribute("branchCode")
SessionUtils.getBranchCode(session)
// 브랜치 개념이 제거되었으므로 사용 금지
```

### ❌ 레거시 브랜치 역할 체크
```java
// ❌ 잘못된 예시
if (roleName.equals("BRANCH_SUPER_ADMIN")) {
    // 브랜치 개념 제거됨
}

// ✅ 올바른 예시
if (SessionUtils.isAdmin(session)) {
    // 표준 관리자 역할 체크
}
```

### ✅ 표준 방법
```java
String role = SessionUtils.getRoleName(session);
UserRole roleEnum = SessionUtils.getRole(session);
String tenantId = SessionUtils.getTenantId(session);
String roleId = SessionUtils.getRoleId(session);
boolean isAdmin = SessionUtils.isAdmin(session);
```

## 참고 문서
- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md) - 표준 역할 정의
- 기존 `SessionUtils.getCurrentUser()`는 그대로 유지
- `SessionManager`는 레거시 코드와의 호환성을 위해 유지하되, 새 코드는 `SessionUtils` 사용 권장
