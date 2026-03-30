# 브랜치 개념 제거 표준화 작업

**작성일**: 2025-12-03  
**목적**: 브랜치 개념 제거 후 표준화 문서 업데이트 및 코드 정리

---

## 작업 완료 내역

### 1. 표준화 문서 업데이트 ✅

#### SESSION_STANDARD.md
- `BRANCH_CODE` 상수 제거 명시
- `getBranchCode()` 메서드 제거 명시
- 브랜치 관련 코드 사용 금지 명시
- 표준 관리자 역할만 사용하도록 명확화

#### TENANT_ROLE_SYSTEM_STANDARD.md
- 레거시 브랜치 역할 완전 제거 명시
- "호환성 유지" 섹션 업데이트 → "브랜치 개념 완전 제거"로 변경
- 표준 관리자 역할만 사용하도록 명확화

### 2. 코드 표준화 ✅

#### SessionUtils.java
- `isAdmin()` 메서드에서 브랜치/본사 레거시 역할 제거
- 표준 관리자 역할만 확인: `ADMIN`, `TENANT_ADMIN`, `PRINCIPAL`, `OWNER`
- 주석에 브랜치 제거 명시

#### SessionConstants.java
- `BRANCH_CODE` 상수 제거 (주석으로 명시)
- 브랜치 개념 제거 명시

#### AuthController.java
- 브랜치 코드 세션 저장 로직 제거
- `mapUserRoleToTenantRoleName()` 메서드 개선 (표준 역할만 매핑)

---

## 표준 관리자 역할

### ✅ 사용 가능한 역할
- `ADMIN`: 기본 관리자
- `TENANT_ADMIN`: 테넌트 관리자
- `PRINCIPAL`: 원장
- `OWNER`: 사장

### ❌ 제거된 레거시 역할
- `BRANCH_ADMIN`, `BRANCH_SUPER_ADMIN`, `BRANCH_MANAGER` (브랜치 개념 제거)
- `HQ_ADMIN`, `SUPER_HQ_ADMIN`, `HQ_MASTER`, `HQ_SUPER_ADMIN` (본사 개념 제거)

---

## 코드 작성 규칙

### ✅ 올바른 예시
```java
// SessionUtils 사용
boolean isAdmin = SessionUtils.isAdmin(session);
String tenantId = SessionUtils.getTenantId(session);
String roleId = SessionUtils.getRoleId(session);

// 표준 관리자 역할 체크
if (SessionUtils.isAdmin(session)) {
    // 관리자 권한 처리
}
```

### ❌ 금지 사항
```java
// 브랜치 코드 사용 금지
session.getAttribute("branchCode");
SessionUtils.getBranchCode(session);  // 메서드 제거됨

// 레거시 브랜치 역할 체크 금지
if (roleName.equals("BRANCH_SUPER_ADMIN")) {
    // 사용 금지
}
```

---

## 참고 문서

- [세션 관리 표준](../../standards/SESSION_STANDARD.md)
- [테넌트 역할 시스템 표준](../../standards/TENANT_ROLE_SYSTEM_STANDARD.md)

---

**작성자**: AI Assistant  
**검토 완료**: 브랜치 개념 제거 표준화 완료

