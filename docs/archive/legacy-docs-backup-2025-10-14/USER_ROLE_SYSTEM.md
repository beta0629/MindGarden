# 사용자 역할 시스템 (User Role System)

## 개요
본 시스템은 상담 관리 시스템의 사용자 권한을 체계적으로 관리하기 위한 역할 기반 접근 제어(RBAC) 시스템입니다.

## 역할 정의

### 1. 내담자 역할
- **CLIENT**: 내담자
  - 기본 사용자 역할
  - 자신의 상담 일정 및 정보만 조회 가능

### 2. 상담사 역할
- **CONSULTANT**: 상담사
  - 자신의 상담 일정 관리
  - 내담자 상담 진행 및 기록 작성

### 3. 지점 관리자 역할
- **ADMIN**: 지점 관리자
  - 지점 내 상담사 및 내담자 관리
  - 지점 내 스케줄 관리
  - 매핑 승인 및 관리

- **BRANCH_SUPER_ADMIN**: 지점 수퍼 관리자
  - 지점 내 최고 권한
  - 모든 지점 관리 기능 접근 가능

### 4. 본사 관리자 역할
- **HQ_ADMIN**: 본사 관리자
  - 지점 생성/삭제/관리
  - 지점 내역 조회 불가 (보안상 제한)

- **SUPER_HQ_ADMIN**: 본사 고급 관리자
  - 고급 지점 관리 기능
  - 지점 내역 조회 불가 (보안상 제한)

- **HQ_MASTER**: 본사 총관리자
  - 시스템 전체 관리 권한
  - 모든 지점 내역 조회 가능
  - 최고 권한

## 권한 체계

### 관리자 권한 확인 메서드

#### `isAdmin()`
모든 관리자 역할을 확인합니다.
```java
public boolean isAdmin() {
    return this == HQ_ADMIN || this == SUPER_HQ_ADMIN || this == HQ_MASTER ||
           this == BRANCH_SUPER_ADMIN || this == ADMIN;
}
```

#### `isMaster()`
본사 총관리자 역할을 확인합니다.
```java
public boolean isMaster() {
    return this == HQ_MASTER;
}
```

#### `isHeadquartersAdmin()`
본사 관리자 역할을 확인합니다.
```java
public boolean isHeadquartersAdmin() {
    return this == HQ_ADMIN || this == SUPER_HQ_ADMIN || this == HQ_MASTER;
}
```

#### `canViewBranchDetails()`
지점 내역 조회 권한을 확인합니다. (HQ_MASTER만 가능)
```java
public boolean canViewBranchDetails() {
    return this == HQ_MASTER;
}
```

#### `canAccessERD()`
ERD 메뉴 접근 권한을 확인합니다. (지점 수퍼 관리자만 가능)
```java
public boolean canAccessERD() {
    return this == BRANCH_SUPER_ADMIN;
}
```

#### `canAccessPayment()`
결제 기능 접근 권한을 확인합니다. (지점 관리자만 가능)
```java
public boolean canAccessPayment() {
    return this == ADMIN || this == BRANCH_SUPER_ADMIN;
}
```

#### `canRequestSupplyPurchase()`
비품구매 요청 권한을 확인합니다. (상담사만 가능)
```java
public boolean canRequestSupplyPurchase() {
    return this == CONSULTANT;
}
```

#### `canRequestPaymentApproval()`
비품구매 결제 요청 권한을 확인합니다. (관리자가 수퍼관리자에게 요청)
```java
public boolean canRequestPaymentApproval() {
    return this == ADMIN;
}
```

#### `canApprovePayment()`
비품구매 결제 승인 권한을 확인합니다. (지점수퍼관리자만 가능)
```java
public boolean canApprovePayment() {
    return this == BRANCH_SUPER_ADMIN;
}
```

#### `canRegisterScheduler()`
스케줄러 등록 권한을 확인합니다. (지점 관리자만 가능)
```java
public boolean canRegisterScheduler() {
    return this == ADMIN || this == BRANCH_SUPER_ADMIN;
}
```

#### `canViewSchedulerConsultants()`
스케줄러 상담사 조회 권한을 확인합니다. (지점 관리자만 가능)
```java
public boolean canViewSchedulerConsultants() {
    return this == ADMIN || this == BRANCH_SUPER_ADMIN;
}
```

#### `isBranchAdmin()`
지점 관리자 역할을 확인합니다.
```java
public boolean isBranchAdmin() {
    return this == ADMIN || this == BRANCH_SUPER_ADMIN;
}
```

#### `isBranchSuperAdmin()`
지점 수퍼 관리자 역할을 확인합니다.
```java
public boolean isBranchSuperAdmin() {
    return this == BRANCH_SUPER_ADMIN;
}
```

## 역할별 접근 권한

### 상담사 (CONSULTANT)
- ✅ 자신의 상담 일정 관리
- ✅ 내담자 상담 진행 및 기록 작성
- ✅ 비품구매 요청 가능
- ❌ 관리자 기능 접근 불가

### 지점 관리자 (ADMIN)
- ✅ 지점 내 상담사 목록 조회
- ✅ 지점 내 내담자 목록 조회
- ✅ 지점 내 매핑 관리
- ✅ 지점 내 스케줄 생성/수정/삭제
- ✅ 지점 내 통계 조회
- ✅ 결제 기능 접근 가능
- ✅ 비품구매 결제 요청 가능
- ✅ 스케줄러 등록 가능
- ✅ 스케줄러 상담사 조회 가능
- ❌ ERD 메뉴 접근 불가
- ❌ 최종 결제 승인 불가
- ❌ 다른 지점 데이터 접근
- ❌ 지점 생성/삭제

### 지점 수퍼 관리자 (BRANCH_SUPER_ADMIN)
- ✅ 지점 내 상담사 목록 조회
- ✅ 지점 내 내담자 목록 조회
- ✅ 지점 내 매핑 관리
- ✅ 지점 내 스케줄 생성/수정/삭제
- ✅ 지점 내 통계 조회
- ✅ ERD 메뉴 접근 가능
- ✅ 결제 기능 접근 가능
- ✅ 비품구매 최종 승인 가능
- ✅ 스케줄러 등록 가능
- ✅ 스케줄러 상담사 조회 가능
- ❌ 다른 지점 데이터 접근
- ❌ 지점 생성/삭제

### 본사 관리자 (HQ_ADMIN, SUPER_HQ_ADMIN)
- ✅ 지점 생성/삭제/관리
- ✅ 지점 설정 관리
- ✅ 시스템 설정 관리
- ❌ 지점 내역 조회 (보안상 제한)
- ❌ 지점 내 상담사/내담자 개별 정보 접근
- ❌ ERD 메뉴 접근 불가
- ❌ 결제 기능 접근 불가
- ❌ 스케줄러 기능 접근 불가

### 본사 총관리자 (HQ_MASTER)
- ✅ 모든 지점 데이터 접근
- ✅ 모든 지점 내역 조회
- ✅ 지점 생성/삭제/관리
- ✅ 시스템 전체 통계 조회
- ✅ 모든 사용자 관리
- ✅ 시스템 설정 관리
- ✅ 최고 권한
- ❌ ERD 메뉴 접근 불가 (지점 수퍼 관리자 전용)
- ❌ 결제 기능 접근 불가 (지점 관리자 전용)
- ❌ 스케줄러 기능 접근 불가 (지점 관리자 전용)

## 비품구매 워크플로우

### 1단계: 상담사 비품구매 요청
- **역할**: `CONSULTANT`
- **권한**: `canRequestSupplyPurchase()`
- **기능**: 필요한 비품 구매 요청서 작성 및 제출

### 2단계: 관리자 결제 요청
- **역할**: `ADMIN` (지점 관리자)
- **권한**: `canRequestPaymentApproval()`
- **기능**: 
  - 상담사 요청 검토 및 승인/반려
  - 승인된 요청을 지점수퍼관리자에게 결제 승인 요청

### 3단계: 지점수퍼관리자 최종 승인
- **역할**: `BRANCH_SUPER_ADMIN` (지점 수퍼 관리자)
- **권한**: `canApprovePayment()`
- **기능**:
  - 최종 결제 승인/반려
  - 예산 관리 및 구매 실행

### 워크플로우 흐름도
```
상담사(CONSULTANT) → 비품구매 요청
       ↓
관리자(ADMIN) → 검토 후 결제 요청
       ↓
지점수퍼관리자(BRANCH_SUPER_ADMIN) → 최종 승인 및 결제
```

## API 권한 체크

### AdminController
```java
// 상담사 목록 조회 권한 체크
UserRole userRole = currentUser.getRole();
boolean hasPermission = userRole.isAdmin();
```

### ScheduleController
```java
// 스케줄 생성 권한 체크
UserRole userRole = currentUser.getRole();
boolean hasPermission = userRole.isAdmin();
```

## 데이터베이스 호환성

### 기존 역할 매핑
```java
public static UserRole fromString(String role) {
    // 기존 데이터 호환성을 위한 매핑
    switch (normalizedRole) {
        case "SUPER_ADMIN":
        case "SUPERADMIN":
        case "ROOT":
            return HQ_SUPER_ADMIN;
        case "HQ_ADMIN":
        case "HEADQUARTERS_ADMIN":
            return HQ_ADMIN;
        case "SUPER_HQ_ADMIN":
        case "SUPER_HEADQUARTERS_ADMIN":
            return SUPER_HQ_ADMIN;
        case "BRANCH_SUPER_ADMIN":
        case "BRANCHSUPERADMIN":
            return BRANCH_SUPER_ADMIN;
        // ... 기타 매핑
    }
}
```

## 변경 이력

### 2025-09-12
- `SUPER_ADMIN`을 `HQ_SUPER_ADMIN`으로 명시적 변경
- `SUPER_HQ_ADMIN`의 표시명을 "본사최고관리자"로 명확화
- 권한 체크 로직을 `UserRole.isAdmin()` 메서드로 통일
- 기존 호환성 유지를 위한 `fromString()` 메서드 개선

## 사용 예시

### 권한 체크 예시
```java
// 컨트롤러에서 권한 체크
User currentUser = SessionUtils.getCurrentUser(session);
if (currentUser == null) {
    return ResponseEntity.status(401).body(Map.of("success", false, "message", "로그인이 필요합니다."));
}

UserRole userRole = currentUser.getRole();
if (!userRole.isAdmin()) {
    return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
}
```

### 역할별 기능 제한 예시
```java
// 지점 관리 기능은 본사 관리자만 접근 가능
if (userRole.isHeadquartersAdmin()) {
    // 지점 생성/삭제 기능
} else {
    // 접근 거부
}
```

## 주의사항

1. **기존 호환성**: `SUPER_ADMIN`은 `HQ_SUPER_ADMIN`으로 매핑되어 기존 데이터와 호환됩니다.
2. **권한 체크**: 모든 API에서 `UserRole.isAdmin()` 메서드를 사용하여 일관된 권한 체크를 수행합니다.
3. **지점코드 필터링**: 지점 관리자는 자신의 지점코드에 해당하는 데이터만 접근할 수 있습니다.
4. **세션 관리**: 사용자 역할은 HTTP 세션에 저장되며, 모든 API 호출 시 세션에서 확인됩니다.
