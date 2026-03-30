# 역할 시스템 표준화 계획

**작성일**: 2025-12-05  
**상태**: 계획 수립

---

## 📋 표준화 문서 확인 결과

### TENANT_ROLE_SYSTEM_STANDARD.md

**표준 관리자 역할**:
- ✅ `ADMIN`: 기본 관리자
- ✅ `TENANT_ADMIN`: 테넌트 관리자
- ✅ `PRINCIPAL`: 원장
- ✅ `OWNER`: 사장

**제거된 레거시 역할** (사용 금지):
- ❌ `BRANCH_ADMIN`, `BRANCH_SUPER_ADMIN`, `BRANCH_MANAGER` (브랜치 개념 제거)
- ❌ `HQ_ADMIN`, `SUPER_HQ_ADMIN`, `HQ_MASTER`, `HQ_SUPER_ADMIN` (본사 개념 제거)

**핵심 원칙**:
- 브랜치 개념 완전 제거
- 본사 개념 완전 제거
- 표준 관리자 역할만 사용

---

### PERMISSION_SYSTEM_STANDARD.md

**ADMIN 역할 자동 권한 부여 대상**:
- ⚠️ **문제**: 문서에 HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER가 포함되어 있음
- ✅ **수정 필요**: 표준 역할만 포함하도록 수정

**표준 관리자 역할만**:
- `ADMIN`
- `TENANT_ADMIN`
- `PRINCIPAL`
- `OWNER`

---

## 🔍 현재 상황 분석

### 1. UserRole.java

**현재 상태**:
- ✅ `isAdmin()` 메서드: 표준 역할만 체크 (수정 완료)
- ❌ 레거시 역할들이 여전히 enum에 존재
- ❌ 레거시 역할 체크 메서드들이 여전히 존재:
  - `isHeadquartersAdmin()` - HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER 체크
  - `isBranchAdmin()` - BRANCH_MANAGER, BRANCH_SUPER_ADMIN, ADMIN 체크
  - `isBranchSuperAdmin()` - BRANCH_SUPER_ADMIN 체크
  - `isMaster()` - HQ_MASTER 체크
  - `canViewBranchDetails()` - HQ_MASTER만 체크
  - `canAccessERD()` - BRANCH_SUPER_ADMIN만 체크
  - `canAccessPayment()` - ADMIN, BRANCH_SUPER_ADMIN 체크
  - `canApprovePayment()` - BRANCH_SUPER_ADMIN만 체크
  - `canRegisterScheduler()` - ADMIN, BRANCH_SUPER_ADMIN 체크
  - `canViewSchedulerConsultants()` - ADMIN, BRANCH_SUPER_ADMIN 체크
  - `isBranchManager()` - BRANCH_MANAGER 체크
  - `hasBranchManagementAccess()` - BRANCH_MANAGER, BRANCH_SUPER_ADMIN, ADMIN, HQ_SUPER_ADMIN, SUPER_HQ_ADMIN 체크
  - `isSuperAdmin()` - HQ_SUPER_ADMIN, HQ_MASTER 체크
  - `isAdminOrSuperAdmin()` - ADMIN, HQ_SUPER_ADMIN 체크

**수정 필요**:
- [ ] 레거시 역할 체크 메서드들을 @Deprecated 처리
- [ ] 표준 역할로 대체하는 메서드 추가
- [ ] 레거시 역할 enum 값은 하위 호환성을 위해 유지하되 사용 금지 주석 추가

---

### 2. AdminRoleUtils.java

**현재 상태**: 확인 필요

**수정 필요**:
- [ ] 레거시 역할 체크 로직 제거
- [ ] 표준 관리자 역할만 체크하도록 수정

---

### 3. SessionUtils.java

**현재 상태**: 확인 필요

**수정 필요**:
- [ ] 레거시 역할 체크 로직 제거
- [ ] 표준 관리자 역할만 체크하도록 수정

---

### 4. Controller 계층

**현재 상태**: 20개 파일에서 HQ/BRANCH 역할 사용

**수정 필요**:
- [ ] `AdminController.java` - 레거시 역할 체크 제거
- [ ] `ErpController.java` - 레거시 역할 체크 제거
- [ ] `SuperAdminController.java` - 레거시 역할 체크 제거
- [ ] `BranchManagementController.java` - 레거시 역할 체크 제거
- [ ] `PermissionManagementController.java` - 레거시 역할 체크 제거
- [ ] 기타 15개 Controller 파일

---

### 5. Service 계층

**현재 상태**: 확인 필요

**수정 필요**:
- [ ] `PermissionInitializationServiceImpl.java` - 레거시 역할 권한 생성 제거
- [ ] `DynamicPermissionServiceImpl.java` - 레거시 역할 체크 제거
- [ ] 기타 Service 파일들

---

## 🎯 수정 계획

### Phase 1: UserRole.java 표준화 (우선순위: HIGH)

#### 1.1 레거시 역할 체크 메서드 @Deprecated 처리

**수정 전**:
```java
public boolean isHeadquartersAdmin() {
    return this == HQ_ADMIN || this == SUPER_HQ_ADMIN || this == HQ_MASTER;
}
```

**수정 후**:
```java
/**
 * @Deprecated - 🚨 레거시 역할 체크 메서드
 * 본사 개념이 제거되었으므로 더 이상 사용하지 마세요.
 * 대신 isAdmin() 메서드를 사용하세요.
 * 
 * 제거 예정: 2026-01-01
 */
@Deprecated
public boolean isHeadquartersAdmin() {
    // 하위 호환성을 위해 표준 관리자 역할로 매핑
    return isAdmin();
}
```

#### 1.2 표준 역할로 대체하는 메서드 추가

**추가할 메서드**:
```java
/**
 * 표준 관리자 역할인지 확인
 * 표준 관리자 역할: ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER
 */
public boolean isAdmin() {
    return this == ADMIN || 
           this == TENANT_ADMIN || 
           this == PRINCIPAL || 
           this == OWNER;
}

/**
 * 모든 표준 관리자 역할 목록 반환
 */
public static UserRole[] getAdminRoles() {
    return new UserRole[]{ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER};
}
```

#### 1.3 레거시 역할 enum 값에 주석 추가

**수정 내용**:
```java
/**
 * @Deprecated - 🚨 레거시 역할: 본사 개념 제거
 * 더 이상 사용하지 마세요. ADMIN으로 대체하세요.
 * 하위 호환성을 위해 enum 값은 유지하되 사용 금지.
 * 
 * 제거 예정: 2026-01-01
 */
HQ_ADMIN("헤드쿼터어드민"),

/**
 * @Deprecated - 🚨 레거시 역할: 본사 개념 제거
 * 더 이상 사용하지 마세요. ADMIN으로 대체하세요.
 */
SUPER_HQ_ADMIN("본사고급관리자"),

/**
 * @Deprecated - 🚨 레거시 역할: 본사 개념 제거
 * 더 이상 사용하지 마세요. ADMIN으로 대체하세요.
 */
HQ_MASTER("본사총관리자"),

/**
 * @Deprecated - 🚨 레거시 역할: 브랜치 개념 제거
 * 더 이상 사용하지 마세요. ADMIN으로 대체하세요.
 */
BRANCH_SUPER_ADMIN("본점수퍼어드민"),

/**
 * @Deprecated - 🚨 레거시 역할: 브랜치 개념 제거
 * 더 이상 사용하지 마세요. ADMIN으로 대체하세요.
 */
BRANCH_ADMIN("지점관리자"),

/**
 * @Deprecated - 🚨 레거시 역할: 브랜치 개념 제거
 * 더 이상 사용하지 마세요. STAFF로 대체하세요.
 */
BRANCH_MANAGER("지점장"),
```

---

### Phase 2: AdminRoleUtils.java 표준화 (우선순위: HIGH)

#### 2.1 레거시 역할 체크 제거

**수정 전**:
```java
public static boolean isHqMaster(User user) {
    return user != null && user.getRole() == UserRole.HQ_MASTER;
}
```

**수정 후**:
```java
/**
 * @Deprecated - 🚨 레거시 역할 체크 메서드
 * 더 이상 사용하지 마세요. isAdmin() 메서드를 사용하세요.
 */
@Deprecated
public static boolean isHqMaster(User user) {
    // 하위 호환성을 위해 표준 관리자 역할로 매핑
    return isAdmin(user);
}

/**
 * 표준 관리자 역할인지 확인
 */
public static boolean isAdmin(User user) {
    return user != null && user.getRole().isAdmin();
}
```

---

### Phase 3: SessionUtils.java 표준화 (우선순위: HIGH)

#### 3.1 레거시 역할 체크 제거

**수정 내용**:
- 레거시 역할 체크 로직을 표준 역할로 대체
- `isAdmin()` 메서드가 표준 역할만 체크하도록 확인

---

### Phase 4: Controller 계층 표준화 (우선순위: HIGH)

#### 4.1 AdminController.java

**수정 내용**:
- `HQ_MASTER`, `BRANCH_SUPER_ADMIN` 체크를 `isAdmin()`으로 대체
- 레거시 역할 관련 로직 제거

#### 4.2 ErpController.java

**수정 내용**:
- `HQ_MASTER`, `BRANCH_SUPER_ADMIN`, `SUPER_HQ_ADMIN` 체크를 `isAdmin()`으로 대체

#### 4.3 SuperAdminController.java

**수정 내용**:
- `HQ_MASTER` 체크를 `isAdmin()`으로 대체
- 또는 Controller 자체를 재검토 (SuperAdmin 개념이 표준에 맞는지)

#### 4.4 BranchManagementController.java

**수정 내용**:
- 브랜치 관리 개념 자체가 표준화에 맞지 않음
- 테넌트 관리로 전환 또는 Controller 제거 검토

---

### Phase 5: Service 계층 표준화 (우선순위: MEDIUM)

#### 5.1 PermissionInitializationServiceImpl.java

**수정 내용**:
- 레거시 역할 권한 생성 제거
- 표준 역할 권한만 생성

#### 5.2 DynamicPermissionServiceImpl.java

**수정 내용**:
- 레거시 역할 체크 제거
- 표준 역할만 체크

---

## 📊 작업 우선순위

### Critical (즉시 수정)
1. ✅ UserRole.java - `isAdmin()` 메서드 표준화 (완료)
2. ⏳ UserRole.java - 레거시 역할 체크 메서드 @Deprecated 처리
3. ⏳ AdminRoleUtils.java - 레거시 역할 체크 제거
4. ⏳ SessionUtils.java - 레거시 역할 체크 제거

### High (우선 수정)
5. ⏳ Controller 계층 - 레거시 역할 체크 제거 (20개 파일)
6. ⏳ Service 계층 - 레거시 역할 체크 제거

### Medium (점진적 수정)
7. ⏳ PermissionInitializationServiceImpl - 레거시 역할 권한 생성 제거
8. ⏳ DynamicPermissionServiceImpl - 레거시 역할 체크 제거

---

## 🔧 수정 방법

### 1. 레거시 역할 체크를 표준 역할로 대체

**수정 전**:
```java
if (user.getRole() == UserRole.HQ_MASTER || 
    user.getRole() == UserRole.BRANCH_SUPER_ADMIN) {
    // 관리자 권한 처리
}
```

**수정 후**:
```java
if (user.getRole().isAdmin()) {
    // 관리자 권한 처리
}
```

### 2. 레거시 역할 체크 메서드를 표준 메서드로 대체

**수정 전**:
```java
if (AdminRoleUtils.isHqMaster(user)) {
    // 관리자 권한 처리
}
```

**수정 후**:
```java
if (AdminRoleUtils.isAdmin(user)) {
    // 관리자 권한 처리
}
```

### 3. 레거시 역할 enum 값 사용 금지

**수정 전**:
```java
User admin = User.builder()
    .role(UserRole.HQ_MASTER)
    .build();
```

**수정 후**:
```java
User admin = User.builder()
    .role(UserRole.ADMIN)  // 표준 관리자 역할 사용
    .build();
```

---

## 📝 체크리스트

### Phase 1: UserRole.java
- [ ] 레거시 역할 체크 메서드 @Deprecated 처리
- [ ] 표준 역할로 대체하는 메서드 추가
- [ ] 레거시 역할 enum 값에 주석 추가

### Phase 2: AdminRoleUtils.java
- [ ] 레거시 역할 체크 메서드 @Deprecated 처리
- [ ] 표준 역할 체크 메서드 추가

### Phase 3: SessionUtils.java
- [ ] 레거시 역할 체크 제거
- [ ] 표준 역할 체크로 대체

### Phase 4: Controller 계층
- [ ] AdminController.java
- [ ] ErpController.java
- [ ] SuperAdminController.java
- [ ] BranchManagementController.java
- [ ] PermissionManagementController.java
- [ ] 기타 15개 Controller 파일

### Phase 5: Service 계층
- [ ] PermissionInitializationServiceImpl.java
- [ ] DynamicPermissionServiceImpl.java
- [ ] 기타 Service 파일들

---

## 🚨 주의사항

1. **하위 호환성**: 레거시 역할 enum 값은 유지하되 사용 금지
2. **점진적 제거**: 한 번에 모든 것을 제거하지 않고 단계적으로 진행
3. **테스트 필수**: 각 단계마다 테스트 실행하여 회귀 방지
4. **문서화**: 모든 변경사항을 WORK_LOG.md에 기록

---

## 🔗 참조 문서

- [테넌트 역할 시스템 표준](../../standards/TENANT_ROLE_SYSTEM_STANDARD.md)
- [권한 시스템 표준](../../standards/PERMISSION_SYSTEM_STANDARD.md)
- [작업 로그](./WORK_LOG.md)

---

**최종 업데이트**: 2025-12-05

