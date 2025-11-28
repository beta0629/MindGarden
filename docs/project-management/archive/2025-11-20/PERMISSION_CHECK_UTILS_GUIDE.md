# PermissionCheckUtils 사용 가이드

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 표준 유틸리티로 정의 완료

---

## 📋 개요

`PermissionCheckUtils`는 CoreSolution 플랫폼의 **표준 권한 체크 유틸리티**입니다. 모든 Controller에서 일관성 있게 권한을 체크하기 위해 사용합니다.

**핵심 원칙**:
- ✅ **동적 권한 시스템 사용**: `DynamicPermissionService` 기반
- ✅ **일관된 응답 형식**: `ResponseEntity<?>` 반환
- ✅ **Spring Security 통합**: 자동으로 SecurityContext 설정
- ✅ **명확한 에러 메시지**: 권한별 사용자 친화적 메시지

---

## 🎯 사용 패턴

### 1. 기본 권한 체크

**Controller에서 사용**:

```java
@RestController
@RequestMapping("/api/example")
@RequiredArgsConstructor
public class ExampleController {
    
    private final DynamicPermissionService dynamicPermissionService;
    
    @GetMapping("/data")
    public ResponseEntity<?> getData(HttpSession session) {
        // 권한 체크
        ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkPermission(
            session, 
            "DATA_VIEW",  // 권한 코드
            dynamicPermissionService
        );
        
        if (permissionCheck != null) {
            return permissionCheck; // 401 또는 403 응답
        }
        
        // 권한 있음 - 비즈니스 로직 실행
        // ...
    }
}
```

**응답 형식**:
- 권한 있음: `null` 반환 (계속 진행)
- 권한 없음: `ResponseEntity` 반환 (401 또는 403)

---

### 2. 인증만 체크 (권한 체크 없음)

```java
@GetMapping("/public-data")
public ResponseEntity<?> getPublicData(HttpSession session) {
    // 인증만 체크 (권한 체크 없음)
    User currentUser = PermissionCheckUtils.checkAuthentication(session);
    if (currentUser == null) {
        return ResponseEntity.status(401).body(Map.of(
            "success", false,
            "message", "로그인이 필요합니다."
        ));
    }
    
    // 비즈니스 로직 실행
    // ...
}
```

---

### 3. 인증 체크 및 응답 생성

```java
@GetMapping("/protected-data")
public ResponseEntity<?> getProtectedData(HttpSession session) {
    // 인증 체크 및 자동 응답 생성
    ResponseEntity<?> authResponse = PermissionCheckUtils.checkAuthenticationWithResponse(session);
    if (authResponse != null) {
        return authResponse; // 401 응답
    }
    
    // 인증됨 - 비즈니스 로직 실행
    // ...
}
```

---

### 4. 편의 메서드 사용

```java
@GetMapping("/admin-data")
public ResponseEntity<?> getAdminData(HttpSession session) {
    // 관리자 권한 체크 (편의 메서드)
    ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkAdminPermission(
        session, 
        dynamicPermissionService
    );
    
    if (permissionCheck != null) {
        return permissionCheck;
    }
    
    // 관리자 권한 있음 - 비즈니스 로직 실행
    // ...
}
```

---

## 📚 권한 코드 정의

권한 코드는 데이터베이스의 `permissions` 테이블에 정의되어 있습니다.

**일반적인 권한 코드 예시**:
- `USER_MANAGE` - 사용자 관리
- `CONSULTANT_MANAGE` - 상담사 관리
- `CLIENT_MANAGE` - 내담자 관리
- `SCHEDULE_MANAGE` - 스케줄 관리
- `SCHEDULE_VIEW` - 스케줄 조회
- `SCHEDULE_CREATE` - 스케줄 생성
- `SCHEDULE_MODIFY` - 스케줄 수정
- `SCHEDULE_DELETE` - 스케줄 삭제
- `STATISTICS_VIEW` - 통계 조회
- `FINANCIAL_MANAGE` - 재무 관리
- `FINANCIAL_VIEW` - 재무 조회
- `ERP_ACCESS` - ERP 접근
- `MAPPING_MANAGE` - 매핑 관리
- `MAPPING_VIEW` - 매핑 조회

**권한 코드는 동적으로 관리**되므로, 새로운 권한을 추가할 때는 데이터베이스에 등록하면 됩니다.

---

## 🔧 메서드 상세

### checkPermission

**시그니처**:
```java
public static ResponseEntity<?> checkPermission(
    HttpSession session, 
    String permissionCode, 
    DynamicPermissionService dynamicPermissionService
)
```

**동작**:
1. 세션에서 사용자 정보 조회
2. 인증되지 않은 경우 401 응답 반환
3. Spring Security 컨텍스트에 인증 정보 설정
4. `DynamicPermissionService`로 권한 체크
5. 권한 없으면 403 응답 반환
6. 권한 있으면 `null` 반환

**반환값**:
- `null`: 권한 있음 (계속 진행)
- `ResponseEntity<?>`: 권한 없음 (401 또는 403)

---

### checkAuthentication

**시그니처**:
```java
public static User checkAuthentication(HttpSession session)
```

**동작**:
- 세션에서 사용자 정보만 조회
- 권한 체크 없음

**반환값**:
- `User`: 인증된 사용자
- `null`: 인증되지 않음

---

### checkAuthenticationWithResponse

**시그니처**:
```java
public static ResponseEntity<?> checkAuthenticationWithResponse(HttpSession session)
```

**동작**:
- 인증 체크 및 자동 응답 생성

**반환값**:
- `null`: 인증됨
- `ResponseEntity<?>`: 인증되지 않음 (401)

---

### checkAdminPermission

**시그니처**:
```java
public static ResponseEntity<?> checkAdminPermission(
    HttpSession session, 
    DynamicPermissionService dynamicPermissionService
)
```

**동작**:
- `USER_MANAGE` 권한 체크 (관리자 권한)

**반환값**:
- `null`: 권한 있음
- `ResponseEntity<?>`: 권한 없음 (401 또는 403)

---

### checkStatisticsPermission

**시그니처**:
```java
public static ResponseEntity<?> checkStatisticsPermission(
    HttpSession session, 
    DynamicPermissionService dynamicPermissionService
)
```

**동작**:
- `STATISTICS_VIEW` 권한 체크

**반환값**:
- `null`: 권한 있음
- `ResponseEntity<?>`: 권한 없음 (401 또는 403)

---

## ⚠️ 주의사항

### 1. DynamicPermissionService 주입 필수

`PermissionCheckUtils.checkPermission()`을 사용할 때는 반드시 `DynamicPermissionService`를 주입해야 합니다.

```java
// ✅ 올바른 사용
@RequiredArgsConstructor
public class ExampleController {
    private final DynamicPermissionService dynamicPermissionService;
    
    @GetMapping("/data")
    public ResponseEntity<?> getData(HttpSession session) {
        ResponseEntity<?> check = PermissionCheckUtils.checkPermission(
            session, 
            "DATA_VIEW", 
            dynamicPermissionService  // 필수
        );
        // ...
    }
}
```

### 2. null 체크 필수

`checkPermission()`이 `null`을 반환하면 권한이 있다는 의미입니다.

```java
// ✅ 올바른 사용
ResponseEntity<?> check = PermissionCheckUtils.checkPermission(...);
if (check != null) {
    return check; // 권한 없음
}
// 권한 있음 - 계속 진행

// ❌ 잘못된 사용
if (PermissionCheckUtils.checkPermission(...) == null) {
    // 권한 없음으로 처리 (잘못됨!)
}
```

### 3. 권한 코드는 문자열 상수로 관리

권한 코드는 하드코딩하지 말고 상수로 관리하는 것을 권장합니다.

```java
// ✅ 권장
public class PermissionConstants {
    public static final String DATA_VIEW = "DATA_VIEW";
    public static final String DATA_MANAGE = "DATA_MANAGE";
}

// 사용
PermissionCheckUtils.checkPermission(
    session, 
    PermissionConstants.DATA_VIEW, 
    dynamicPermissionService
);

// ❌ 비권장 (하드코딩)
PermissionCheckUtils.checkPermission(
    session, 
    "DATA_VIEW",  // 하드코딩
    dynamicPermissionService
);
```

---

## 🔄 마이그레이션 가이드

### SecurityUtils에서 마이그레이션

**기존 코드 (SecurityUtils)**:
```java
ResponseEntity<?> check = SecurityUtils.checkPermission(session, UserRole.ADMIN);
if (check != null) {
    return check;
}
```

**새 코드 (PermissionCheckUtils)**:
```java
ResponseEntity<?> check = PermissionCheckUtils.checkPermission(
    session, 
    "USER_MANAGE",  // 권한 코드로 변경
    dynamicPermissionService
);
if (check != null) {
    return check;
}
```

---

## 📊 사용 예시

### 예시 1: 스케줄 조회

```java
@GetMapping("/schedules")
public ResponseEntity<?> getSchedules(HttpSession session) {
    // 스케줄 조회 권한 체크
    ResponseEntity<?> check = PermissionCheckUtils.checkPermission(
        session, 
        "SCHEDULE_VIEW", 
        dynamicPermissionService
    );
    if (check != null) {
        return check;
    }
    
    // 권한 있음 - 스케줄 조회
    List<Schedule> schedules = scheduleService.getAllSchedules();
    return ResponseEntity.ok(Map.of(
        "success", true,
        "data", schedules
    ));
}
```

### 예시 2: 스케줄 생성

```java
@PostMapping("/schedules")
public ResponseEntity<?> createSchedule(
    @RequestBody ScheduleCreateRequest request,
    HttpSession session
) {
    // 스케줄 생성 권한 체크
    ResponseEntity<?> check = PermissionCheckUtils.checkPermission(
        session, 
        "SCHEDULE_CREATE", 
        dynamicPermissionService
    );
    if (check != null) {
        return check;
    }
    
    // 권한 있음 - 스케줄 생성
    Schedule schedule = scheduleService.createSchedule(request);
    return ResponseEntity.ok(Map.of(
        "success", true,
        "data", schedule
    ));
}
```

### 예시 3: 통계 조회 (편의 메서드 사용)

```java
@GetMapping("/statistics")
public ResponseEntity<?> getStatistics(HttpSession session) {
    // 통계 조회 권한 체크 (편의 메서드)
    ResponseEntity<?> check = PermissionCheckUtils.checkStatisticsPermission(
        session, 
        dynamicPermissionService
    );
    if (check != null) {
        return check;
    }
    
    // 권한 있음 - 통계 조회
    Statistics stats = statisticsService.getStatistics();
    return ResponseEntity.ok(Map.of(
        "success", true,
        "data", stats
    ));
}
```

---

## 🔗 관련 문서

- [권한 관리 표준화 분석](./PERMISSION_STANDARDIZATION_ANALYSIS.md)
- [표준화 계획](./CORESOLUTION_STANDARDIZATION_PLAN.md)

---

**마지막 업데이트**: 2025-11-20

