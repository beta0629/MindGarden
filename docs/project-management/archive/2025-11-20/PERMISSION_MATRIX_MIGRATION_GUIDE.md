# PermissionMatrix 마이그레이션 가이드

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 마이그레이션 완료

---

## 📋 개요

`PermissionMatrix`는 정적 권한 매트릭스 클래스로, Phase 3.4에서 데이터베이스 기반 동적 권한 시스템으로 마이그레이션되었습니다. 이 문서는 기존 코드를 새로운 시스템으로 마이그레이션하는 방법을 안내합니다.

---

## 🔄 마이그레이션 매핑

### 1. 메뉴 그룹 권한 체크

**기존 코드:**
```java
PermissionMatrix.hasMenuAccess(role, "ADMIN_MENU");
```

**새 코드:**
```java
// DynamicPermissionService 주입 필요
@Autowired
private DynamicPermissionService dynamicPermissionService;

// 사용
dynamicPermissionService.hasMenuGroupAccess(role.name(), "ADMIN_MENU");
// 또는
dynamicPermissionService.hasMenuGroupAccess(user, "ADMIN_MENU");
```

---

### 2. API 패턴 권한 체크

**기존 코드:**
```java
PermissionMatrix.hasApiAccess(role, "/api/admin/users");
```

**새 코드:**
```java
dynamicPermissionService.hasApiAccess(role.name(), "/api/admin/users");
// 또는
dynamicPermissionService.hasApiAccess(user, "/api/admin/users");
```

---

### 3. 기능 권한 체크

**기존 코드:**
```java
PermissionMatrix.hasFeature(role, "MANAGE_USERS");
```

**새 코드:**
```java
dynamicPermissionService.hasPermission(role.name(), "MANAGE_USERS");
// 또는
dynamicPermissionService.hasPermission(user, "MANAGE_USERS");
```

---

### 4. 역할별 권한 정보 조회

**기존 코드:**
```java
Map<String, Object> permissions = PermissionMatrix.getRolePermissions(role);
```

**새 코드:**
```java
List<Map<String, Object>> permissions = dynamicPermissionService.getRolePermissions(role.name());
// 또는
List<Map<String, Object>> permissions = dynamicPermissionService.getUserPermissions(user);
```

**응답 형식 차이:**
- 기존: `Map<String, Object>` (role, menuGroups, apiPatterns, features 포함)
- 새: `List<Map<String, Object>>` (각 권한별 상세 정보)

---

## 📝 사용 예시

### Controller에서 사용

```java
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    
    private final DynamicPermissionService dynamicPermissionService;
    
    @GetMapping("/menu")
    public ResponseEntity<?> getMenu(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        
        // 메뉴 그룹 권한 체크
        if (!dynamicPermissionService.hasMenuGroupAccess(user, "ADMIN_MENU")) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "해당 메뉴에 접근할 권한이 없습니다."
            ));
        }
        
        // ... 메뉴 조회 로직
    }
}
```

### Service에서 사용

```java
@Service
@RequiredArgsConstructor
public class MyService {
    
    private final DynamicPermissionService dynamicPermissionService;
    
    public void doSomething(User user) {
        // 기능 권한 체크
        if (!dynamicPermissionService.hasPermission(user, "MANAGE_USERS")) {
            throw new UnauthorizedException("사용자 관리 권한이 없습니다.");
        }
        
        // ... 비즈니스 로직
    }
}
```

---

## ⚠️ 주의사항

### 1. 권한 코드 형식

**메뉴 그룹:**
- 기존: `"ADMIN_MENU"` (메뉴 그룹명)
- 새: `"MENU_GROUP_ADMIN"` (권한 코드)

**API 패턴:**
- 기존: `"/api/admin/**"` (API 경로 패턴)
- 새: `"API_ACCESS_ADMIN"` (권한 코드)

**기능 권한:**
- 기존과 동일: `"MANAGE_USERS"` (권한 코드)

### 2. 하위 호환성

`SecurityUtils`의 메서드들은 하위 호환성을 위해 유지되며, 내부적으로 `DynamicPermissionService`를 사용합니다. 하지만 새로운 코드에서는 직접 `DynamicPermissionService`를 사용하는 것을 권장합니다.

### 3. 폴백 메커니즘

`SecurityUtils`의 메서드들은 `DynamicPermissionService`를 사용할 수 없는 경우 `PermissionMatrix`로 폴백합니다. 이는 하위 호환성을 위한 것이며, 정상적인 환경에서는 `DynamicPermissionService`가 사용됩니다.

---

## 🔗 관련 문서

- [PermissionMatrix 마이그레이션 계획](./PERMISSION_MATRIX_MIGRATION_PLAN.md)
- [권한 관리 표준화 분석](./PERMISSION_STANDARDIZATION_ANALYSIS.md)
- [PermissionCheckUtils 가이드](./PERMISSION_CHECK_UTILS_GUIDE.md)

---

**마지막 업데이트**: 2025-11-20

