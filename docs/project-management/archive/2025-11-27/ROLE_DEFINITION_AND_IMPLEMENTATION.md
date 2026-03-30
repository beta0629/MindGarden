# 역할 정의 및 구현 가이드

**작성일**: 2025-11-27
**버전**: 1.0.0
**상태**: 구현 완료
**작성자**: CoreSolution

---

## 📋 개요

테넌트별 관리자(원장) 계정의 위젯 표시 문제를 해결하기 위해 새로운 역할들을 정의하고 구현하였습니다.

### 🎯 목표
- 원장 계정이 모든 위젯을 볼 수 있도록 역할 시스템 개선
- 학원/상담소 테넌트별 적절한 위젯 표시
- 향후 동적 역할 시스템으로의 전환 기반 마련

---

## 🔑 새로운 역할 정의

### 1. PRINCIPAL (원장)
```java
UserRole.PRINCIPAL("원장")
```

**특징:**
- 학원 업종의 최고 관리자
- 모든 위젯 표시 가능
- 테넌트 전체 관리 권한

**위젯 표시 범위:**
- ✅ 공통 위젯 (welcome, summary-statistics 등)
- ✅ 학원 위젯 (academy-* 패턴)
- ✅ 상담 위젯 (consultation-* 패턴)
- ✅ ERP 위젯 (erp-* 패턴)

### 2. OWNER (사장)
```java
UserRole.OWNER("사장")
```

**특징:**
- 사업체 대표
- 재무 및 사업 전체 관리
- 모든 위젯 표시 가능

### 3. TENANT_ADMIN (테넌트관리자)
```java
UserRole.TENANT_ADMIN("테넌트관리자")
```

**특징:**
- 테넌트 단위 최고 권한
- 테넌트 설정 및 사용자 관리
- 모든 위젯 표시 가능

---

## 🏗️ 구현 세부 사항

### UserRole.java 변경사항

#### 1. 새로운 역할 추가
```java
// 기존 호환성을 위한 역할들
HQ_SUPER_ADMIN("본사최고관리자"),
BRANCH_MANAGER("지점장"),

// 새로운 역할 시스템 (업종별 역할)
PRINCIPAL("원장"),
OWNER("사장"),
TENANT_ADMIN("테넌트관리자");
```

#### 2. fromString() 매핑 추가
```java
case "PRINCIPAL":
case "원장":
    return PRINCIPAL;
case "OWNER":
case "사장":
    return OWNER;
case "TENANT_ADMIN":
case "TENANTADMIN":
case "테넌트관리자":
    return TENANT_ADMIN;
```

#### 3. 관리자 권한 포함
```java
public boolean isAdmin() {
    return this == HQ_ADMIN || this == SUPER_HQ_ADMIN || this == HQ_MASTER ||
           this == BRANCH_SUPER_ADMIN || this == ADMIN ||
           this == HQ_SUPER_ADMIN || this == BRANCH_MANAGER || // 기존 호환성
           this == PRINCIPAL || this == OWNER || this == TENANT_ADMIN; // 새로운 역할
}
```

### 프론트엔드 변경사항

#### DynamicDashboard.js 역할 목록 확장
```javascript
const tenantAdminRoles = [
  'ADMIN', 'BRANCH_MANAGER', 'BRANCH_SUPER_ADMIN',  // 기존
  'TENANT_ADMIN', 'OWNER', 'MANAGER', 'PRINCIPAL'  // 추가
];
```

---

## 📊 위젯 표시 정책

| 역할 | 위젯 표시 범위 | 구현 상태 |
|------|---------------|-----------|
| **PRINCIPAL (원장)** | 모든 위젯 | ✅ 구현 완료 |
| **OWNER (사장)** | 모든 위젯 | ✅ 구현 완료 |
| **TENANT_ADMIN** | 모든 위젯 | ✅ 구현 완료 |
| **ADMIN** | 모든 위젯 | ✅ 기존 구현 |
| **BRANCH_MANAGER** | 모든 위젯 | ✅ 기존 구현 |
| **학원 일반 사용자** | 공통 + 학원 + ERP | ✅ 구현 완료 |
| **상담소 일반 사용자** | 공통 + 상담 + ERP | ✅ 구현 완료 |

---

## 🔄 마이그레이션 계획

### Phase 1: 현재 상태 (완료)
- ✅ UserRole enum에 새로운 역할 추가
- ✅ 프론트엔드 역할 목록 확장
- ✅ 기본 위젯 생성 로직에 적용

### Phase 2: 동적 역할 시스템 (계획)
- 🔄 UserRoleAssignment 기반 역할 관리
- 🔄 TenantRole을 통한 동적 역할 생성
- 🔄 데이터베이스 기반 권한 관리

### Phase 3: 완전 동적화 (미래)
- 🔄 하드코딩된 역할 완전 제거
- 🔄 API 기반 역할 정보 조회
- 🔄 실시간 역할 권한 관리

---

## 🧪 테스트 결과

### 원장 계정 테스트
**입력:** `userRole = "PRINCIPAL"`
**기대 결과:** 모든 위젯 표시 (19개)
**실제 결과:** ✅ 모든 위젯 표시 확인

### 학원 일반 사용자 테스트
**입력:** `businessType = "ACADEMY"`
**기대 결과:** 공통 + 학원 + ERP 위젯 (11개)
**실제 결과:** ✅ 업종별 위젯 표시 확인

---

## 📝 관련 문서 업데이트

### 업데이트된 문서
- ✅ `BUSINESS_CATEGORY_ROLE_SYSTEM.md` - 새로운 역할 정의 추가
- ✅ `ONBOARDING_ADMIN_ACCOUNT_PROCESS.md` - 계정 생성 시 역할 고려
- ✅ `DYNAMIC_ROLE_SYSTEM.md` - 현재 구현 상태 반영
- ✅ `ROLE_PERMISSION_MATRIX.md` - 새로운 역할 권한 추가

### 향후 업데이트 필요 문서
- 🔄 `TENANT_COMMON_CODE_SEPARATION_PLAN.md` - 역할 관련 내용 검토
- 🔄 `TENANT_DASHBOARD_MANAGEMENT_SYSTEM.md` - 대시보드 역할 연동
- 🔄 `INTEGRATED_SYSTEM_ARCHITECTURE.md` - 아키텍처 다이어그램 업데이트

---

## ⚠️ 중요 참고사항

1. **역할 이름 통일성**
   - 백엔드: `PRINCIPAL`, `OWNER`, `TENANT_ADMIN`
   - 프론트엔드: 동일한 이름 사용
   - 표시명: "원장", "사장", "테넌트관리자"

2. **하위 호환성 유지**
   - 기존 `ADMIN`, `BRANCH_MANAGER` 역할 계속 지원
   - 새로운 역할들을 추가적으로 지원

3. **동적 시스템 전환 준비**
   - 현재 enum 기반이지만 향후 데이터베이스 기반으로 전환 가능
   - API 엔드포인트 (`/api/tenants/{tenantId}/roles`) 이미 준비됨

---

## 🔗 관련 링크

- [BUSINESS_CATEGORY_ROLE_SYSTEM.md](../BUSINESS_CATEGORY_ROLE_SYSTEM.md)
- [ONBOARDING_ADMIN_ACCOUNT_PROCESS.md](../ONBOARDING_ADMIN_ACCOUNT_PROCESS.md)
- [DYNAMIC_ROLE_SYSTEM.md](../2025-11-20/DYNAMIC_ROLE_SYSTEM.md)
- [ROLE_PERMISSION_MATRIX.md](../2025-11-20/ROLE_PERMISSION_MATRIX.md)

---

**커밋**: `e3f315ac` - "docs: 역할 시스템 문서 업데이트"
