# 업종별 역할 시스템 설계

## 1. 개요

현재 시스템은 `User.role`이 하드코딩된 enum(`CLIENT`, `CONSULTANT`, `ADMIN` 등)으로 되어 있어 업종별로 다른 역할을 지원하지 못합니다.

**요구사항:**
- 상담소: 내담자, 상담사, 관리자, 수퍼관리자
- 학원: 학생, 선생님, 관리자, 원장
- 기타: 손님, 관리자1, 사장 등등

**해결 방안:**
업종별 역할 템플릿(`RoleTemplate`)과 테넌트 역할(`TenantRole`)을 활용하여 동적 역할 시스템을 구축합니다.

## 2. 데이터 모델

### 2.1 기존 구조

```
RoleTemplate (업종별 역할 템플릿)
  ├─ business_type: "ACADEMY", "CONSULTATION" 등
  ├─ template_code: "STUDENT", "TEACHER", "PRINCIPAL" 등
  └─ name_ko: "학생", "선생님", "원장" 등

TenantRole (테넌트별 커스텀 역할)
  ├─ tenant_id: 테넌트 ID
  ├─ role_template_id: 템플릿 참조
  └─ name_ko: "학생", "선생님" 등 (커스터마이징 가능)

User (현재)
  └─ role: UserRole enum (하드코딩) ❌
```

### 2.2 새로운 구조

```
UserRoleAssignment (신규)
  ├─ assignment_id: PK
  ├─ user_id: FK → users.id
  ├─ tenant_id: FK → tenants.tenant_id
  ├─ tenant_role_id: FK → tenant_roles.tenant_role_id
  ├─ branch_id: FK → branches.id (선택, NULL = 전체 브랜치)
  ├─ effective_from: 역할 시작일
  ├─ effective_to: 역할 종료일 (NULL = 무기한)
  └─ is_active: 활성 여부

RolePermission (브랜치별 권한 설정)
  ├─ tenant_role_id: FK → tenant_roles.tenant_role_id
  ├─ permission_code: 권한 코드
  ├─ policy_json: ABAC 정책 (브랜치별 조건 포함)
  └─ scope: 권한 범위 (SELF, BRANCH, TENANT, ALL)

User (수정)
  ├─ role: UserRole enum (레거시 호환용, nullable)
  └─ (TenantRole은 UserRoleAssignment로 조회)
```

## 3. 역할 관리 시스템

### 3.1 역할 생성 방식

**역할은 동적으로 생성/수정/삭제 가능합니다:**

1. **기본 역할 자동 생성** (필수)
   - 테넌트 가입 시 업종별 기본 역할 2개 자동 생성
   - 레벨 1 (기본 사용자): 내담자/학생/손님
   - 레벨 2 (서비스 제공자): 상담사/선생님/관리자
   - `RoleTemplate` 기반으로 자동 생성

2. **옵션 역할 추가** (관리 페이지에서)
   - 레벨 3 (관리자): 필요에 따라 추가
   - 레벨 4 (최고 관리자): 필요에 따라 추가 (없을 수도 있음)
   - 템플릿 기반 또는 커스텀 생성 가능

3. **커스텀 역할 생성**
   - 테넌트 관리자가 필요에 따라 새로운 역할 직접 생성
   - `role_template_id` 없이 `TenantRole` 생성 가능
   - 권한을 직접 설정

4. **역할 수정**
   - 역할명, 설명, 권한 등 수정 가능
   - 템플릿 기반 역할도 커스터마이징 가능
   - 레벨 1, 2는 삭제 불가 (필수 역할)

### 3.2 역할 레벨 구조

**역할은 최소 2개, 최대 4개까지 구성 가능합니다:**

#### 레벨 1: 기본 사용자 (필수)
- 상담소: 내담자
- 학원: 학생
- 기타: 손님

#### 레벨 2: 서비스 제공자 (필수)
- 상담소: 상담사
- 학원: 선생님
- 기타: 관리자

#### 레벨 3: 관리자 (옵션)
- 상담소: 관리자
- 학원: 관리자
- 기타: 사장

#### 레벨 4: 최고 관리자 (옵션, 없을 수도 있음)
- 상담소: 수퍼관리자 (옵션)
- 학원: 원장 (옵션)
- 기타: 원장 (옵션)

**구성 예시:**
- 최소 구성: 레벨 1 + 레벨 2 (2개 역할)
- 일반 구성: 레벨 1 + 레벨 2 + 레벨 3 (3개 역할)
- 최대 구성: 레벨 1 + 레벨 2 + 레벨 3 + 레벨 4 (4개 역할)

> **중요**: 
> - 레벨 1, 2는 필수 (기본 템플릿에서 자동 생성)
> - 레벨 3, 4는 옵션 (관리 페이지에서 필요에 따라 추가/삭제 가능)
> - 역할은 동적으로 추가/수정/삭제 가능

## 4. 구현 계획

### Phase 1: 데이터 모델 확장

1. **UserRoleAssignment 엔티티 생성**
   - `user_id`, `tenant_id`, `tenant_role_id` 매핑
   - 유효 기간 관리 (`effective_from`, `effective_to`)
   - 활성 역할 조회 쿼리

2. **User 엔티티 수정**
   - `role` 필드를 nullable로 변경 (레거시 호환)
   - 현재 테넌트의 역할은 `UserRoleAssignment`로 조회

### Phase 2: 서비스 레이어

1. **TenantRoleService 확장**
   - 테넌트별 역할 목록 조회
   - 역할 생성/수정/삭제 (동적 관리)
   - 템플릿 기반 역할 생성
   - 커스텀 역할 생성
   - 사용자 역할 할당/해제
   - 현재 활성 역할 조회

2. **AuthService 수정**
   - 로그인 시 테넌트별 역할 조회
   - `AuthResponse`에 `tenantRole` 정보 추가

### Phase 3: 프론트엔드

1. **역할 관리 페이지** (`/admin/roles` 또는 `/tenant/{tenantId}/roles`)
   - 역할 목록 조회 (테이블 형태)
   - 역할 생성 버튼 (템플릿 기반 또는 커스텀)
   - 역할 수정/삭제 기능
   - 권한 설정 UI (체크박스/드롭다운)
   - 역할별 사용자 수 표시
   - 템플릿 기반 역할 생성 (템플릿 선택 → 역할 생성)
   - 커스텀 역할 생성 (이름, 설명, 권한 직접 설정)

2. **역할별 대시보드 라우팅**
   - `TenantRole.name` 또는 `template_code`로 대시보드 경로 결정
   - 동적 라우팅 (역할명 기반)
   - 예: "학생" → `/academy/student/dashboard`
   - 새로운 역할 추가 시 대시보드 경로 자동 매핑 또는 기본 경로 사용

3. **역할별 대시보드 컴포넌트**

   **레벨 1 (기본 사용자) - 각각 별도 대시보드:**
   - `ClientDashboard` (상담소 내담자): 상담 신청, 상담 내역 조회
   - `StudentDashboard` (학원 학생): 수강 신청, 출석 확인, 성적 조회
   - `CustomerDashboard` (기타 손님): 서비스 이용 내역

   **레벨 2 (서비스 제공자) - 각각 별도 대시보드:**
   - `ConsultantDashboard` (상담소 상담사): 상담 일정, 상담 내역 관리
   - `TeacherDashboard` (학원 선생님): 반 관리, 출석 체크, 성적 입력
   - `StaffDashboard` (기타 관리자): 서비스 제공 관리

   **레벨 3 (관리자) - 관리자 대시보드:**
   - `AdminDashboard`: 강좌/반 관리, 수강 등록 관리, 통계 등
   - 업종별로 동일한 관리자 대시보드 사용

   **레벨 4 (최고 관리자) - 레벨 3과 동일한 대시보드:**
   - `AdminDashboard` (레벨 3과 동일)
   - 권한으로만 구분 (더 많은 권한, 모든 기능 접근 가능)
   - 별도 대시보드 없음

## 5. API 설계

### 5.1 역할 관리 API

#### 5.1.1 역할 목록 조회
```http
GET /api/tenants/{tenantId}/roles
```

**Response:**
```json
{
  "tenantId": "academy-001",
  "roles": [
    {
      "tenantRoleId": "role-001",
      "name": "학생",
      "nameKo": "학생",
      "description": "수강생 역할",
      "roleTemplateId": "template-001",
      "templateCode": "ACADEMY_STUDENT",
      "isActive": true,
      "userCount": 150
    },
    {
      "tenantRoleId": "role-002",
      "name": "보조강사",
      "nameKo": "보조강사",
      "description": "보조 강사 역할",
      "roleTemplateId": null,
      "templateCode": null,
      "isActive": true,
      "userCount": 5
    }
  ]
}
```

#### 5.1.2 역할 생성 (브랜치별 권한 설정)
```http
POST /api/tenants/{tenantId}/roles
Content-Type: application/json

{
  "name": "보조강사",
  "nameKo": "보조강사",
  "description": "보조 강사 역할",
  "roleTemplateId": null,  // 템플릿 기반이면 템플릿 ID, 커스텀은 null
  "permissions": [
    {
      "permissionCode": "ACADEMY_VIEW_CLASS",
      "scope": "BRANCH",  // BRANCH: 브랜치별 권한, TENANT: 전체 권한
      "policyJson": "{\"branch_id\": \"${user.branchId}\", \"own_branch_only\": true}"
    },
    {
      "permissionCode": "ACADEMY_MANAGE_CLASS",
      "scope": "BRANCH",
      "policyJson": "{\"allowed_branch_ids\": [1, 2]}"
    }
  ]
}
```

**브랜치별 권한 설정:**
- `scope: "BRANCH"`: 브랜치별로 다른 권한 적용
- `scope: "TENANT"`: 전체 테넌트 권한 (모든 브랜치)
- `policyJson`: 브랜치별 조건 정의

#### 5.1.3 역할 수정
```http
PUT /api/tenants/{tenantId}/roles/{tenantRoleId}
Content-Type: application/json

{
  "name": "보조강사",
  "nameKo": "보조강사",
  "description": "보조 강사 역할 (수정됨)",
  "isActive": true
}
```

#### 5.1.4 역할 삭제
```http
DELETE /api/tenants/{tenantId}/roles/{tenantRoleId}
```

### 5.2 사용자 역할 할당 API

#### 5.2.1 사용자 역할 조회
```http
GET /api/users/{userId}/roles?tenantId={tenantId}
```

**Response:**
```json
{
  "userId": 1,
  "tenantId": "academy-001",
  "roles": [
    {
      "assignmentId": "assign-001",
      "tenantRoleId": "role-001",
      "roleName": "학생",
      "roleNameKo": "학생",
      "branchId": 1,
      "branchName": "본원",
      "effectiveFrom": "2025-01-01",
      "effectiveTo": null,
      "isActive": true
    }
  ]
}
```

#### 5.2.2 역할 할당 (브랜치별)
```http
POST /api/users/{userId}/roles
Content-Type: application/json

{
  "tenantId": "academy-001",
  "tenantRoleId": "role-001",
  "branchId": 1,  // 특정 브랜치에 할당 (NULL = 전체 브랜치)
  "effectiveFrom": "2025-01-01",
  "effectiveTo": null
}
```

**브랜치별 역할 할당 예시:**
- `branchId: 1`: 본원에만 역할 할당
- `branchId: 2`: 분원에만 역할 할당
- `branchId: null`: 전체 브랜치에 역할 할당 (본원 + 분원 모두)

#### 5.2.3 역할 해제
```http
DELETE /api/users/{userId}/roles/{assignmentId}
```

## 6. 마이그레이션 전략

### 6.1 기존 데이터 마이그레이션

1. **User.role → TenantRole 매핑**
   - `CLIENT` → `CONSULTATION_CLIENT` 템플릿 찾기
   - `CONSULTANT` → `CONSULTATION_CONSULTANT` 템플릿 찾기
   - `ADMIN` → 업종별 `ADMIN` 템플릿 찾기

2. **UserRoleAssignment 생성**
   - 각 User에 대해 해당 테넌트의 TenantRole 찾기
   - UserRoleAssignment 레코드 생성

### 6.2 호환성 유지

- `User.role` 필드는 유지 (레거시 코드 호환)
- 새로운 코드는 `UserRoleAssignment` 사용
- 점진적 마이그레이션

## 7. 권한 체크 로직

### 7.1 브랜치별 역할 조회

```java
public TenantRole getCurrentTenantRole(Long userId, String tenantId, Long branchId) {
    return userRoleAssignmentRepository
        .findActiveRoleByUserAndTenantAndBranch(userId, tenantId, branchId)
        .map(UserRoleAssignment::getTenantRole)
        .orElse(null);
}
```

### 7.2 브랜치별 권한 체크

```java
public boolean hasPermission(Long userId, String tenantId, Long branchId, String permissionCode) {
    // 1. 사용자의 브랜치별 역할 조회
    UserRoleAssignment assignment = userRoleAssignmentRepository
        .findActiveRoleByUserAndTenantAndBranch(userId, tenantId, branchId)
        .orElse(null);
    
    if (assignment == null) return false;
    
    // 2. 역할의 권한 조회
    List<RolePermission> permissions = rolePermissionRepository
        .findByTenantRoleId(assignment.getTenantRoleId());
    
    // 3. 권한 코드 매칭 및 ABAC 정책 검증
    for (RolePermission permission : permissions) {
        if (permission.getPermissionCode().equals(permissionCode)) {
            // ABAC 정책 검증 (브랜치별 조건 포함)
            return evaluatePolicy(permission.getPolicyJson(), userId, tenantId, branchId);
        }
    }
    
    return false;
}

// ABAC 정책 평가 (브랜치별 조건 포함)
private boolean evaluatePolicy(String policyJson, Long userId, String tenantId, Long branchId) {
    // policyJson 예시: {"branch_id": "${user.branchId}", "scope": "BRANCH"}
    // 브랜치별 권한 조건 검증
    // ...
}
```

### 7.3 브랜치별 권한 예시

**예시 1: 본원 선생님 (모든 반 관리 가능)**
```json
{
  "tenantRoleId": "role-001",
  "permissionCode": "ACADEMY_MANAGE_CLASS",
  "scope": "TENANT",
  "policyJson": "{\"branch_id\": null, \"all_branches\": true}"
}
```

**예시 2: 분원 선생님 (자신의 브랜치만 관리)**
```json
{
  "tenantRoleId": "role-001",
  "permissionCode": "ACADEMY_MANAGE_CLASS",
  "scope": "BRANCH",
  "policyJson": "{\"branch_id\": \"${user.branchId}\", \"own_branch_only\": true}"
}
```

**예시 3: 특정 브랜치만 접근 가능**
```json
{
  "tenantRoleId": "role-002",
  "permissionCode": "ACADEMY_VIEW_ATTENDANCE",
  "scope": "BRANCH",
  "policyJson": "{\"allowed_branch_ids\": [1, 2, 3]}"
}
```

## 8. 프론트엔드 라우팅

### 8.1 동적 역할별 대시보드 매핑

역할은 동적으로 생성되므로, 템플릿 코드나 역할명 기반으로 라우팅합니다.

```javascript
// 템플릿 코드 기반 매핑 (기본 템플릿)
const TEMPLATE_ROLE_DASHBOARD_MAP = {
  // 레벨 1 (기본 사용자) - 각각 별도 대시보드
  'CONSULTATION_CLIENT': '/client/dashboard',      // 상담소 내담자
  'ACADEMY_STUDENT': '/academy/student/dashboard', // 학원 학생
  'OTHER_CUSTOMER': '/customer/dashboard',          // 기타 손님
  
  // 레벨 2 (서비스 제공자) - 각각 별도 대시보드
  'CONSULTATION_CONSULTANT': '/consultant/dashboard', // 상담소 상담사
  'ACADEMY_TEACHER': '/academy/teacher/dashboard',    // 학원 선생님
  'OTHER_STAFF': '/staff/dashboard',                  // 기타 관리자 (레벨 2)
  
  // 레벨 3, 4 (관리자 - 동일한 대시보드, 권한으로만 구분)
  'CONSULTATION_ADMIN': '/admin/dashboard',        // 상담소 관리자 (레벨 3)
  'CONSULTATION_SUPER_ADMIN': '/admin/dashboard',  // 상담소 수퍼관리자 (레벨 4, 권한으로만 구분)
  'ACADEMY_ADMIN': '/admin/dashboard',             // 학원 관리자 (레벨 3)
  'ACADEMY_PRINCIPAL': '/admin/dashboard',         // 학원 원장 (레벨 4, 권한으로만 구분)
  'OTHER_ADMIN': '/admin/dashboard',               // 기타 관리자 (레벨 3)
  'OTHER_OWNER': '/admin/dashboard'                // 기타 사장 (레벨 4, 권한으로만 구분)
};

// 역할명 기반 매핑 (커스텀 역할 포함)
const ROLE_NAME_DASHBOARD_MAP = {
  // 레벨 1 (기본 사용자)
  '학생': '/academy/student/dashboard',
  '내담자': '/client/dashboard',
  '손님': '/customer/dashboard',
  
  // 레벨 2 (서비스 제공자)
  '선생님': '/academy/teacher/dashboard',
  '상담사': '/consultant/dashboard',
  '관리자': '/staff/dashboard',  // 기타 업종의 관리자 (레벨 2)
  
  // 레벨 3, 4 (관리자 - 동일한 대시보드)
  '관리자': '/admin/dashboard',  // 레벨 3 관리자
  '원장': '/admin/dashboard',     // 레벨 4 최고 관리자 (권한으로만 구분)
  '수퍼관리자': '/admin/dashboard',
  '사장': '/admin/dashboard',
  // ... 동적으로 추가 가능
};

// 대시보드 경로 결정 함수
function getDashboardPath(tenantRole) {
  // 1. 템플릿 코드로 먼저 확인
  if (tenantRole.templateCode && TEMPLATE_ROLE_DASHBOARD_MAP[tenantRole.templateCode]) {
    return TEMPLATE_ROLE_DASHBOARD_MAP[tenantRole.templateCode];
  }
  
  // 2. 역할명으로 확인
  if (tenantRole.nameKo && ROLE_NAME_DASHBOARD_MAP[tenantRole.nameKo]) {
    return ROLE_NAME_DASHBOARD_MAP[tenantRole.nameKo];
  }
  
  // 3. 레벨 4 (최고 관리자)는 레벨 3과 동일한 관리자 대시보드
  // 권한으로만 구분되므로 같은 경로 반환
  if (isLevel4Role(tenantRole)) {
    return '/admin/dashboard';
  }
  
  // 4. 기본 대시보드 (권한 기반)
  return getDefaultDashboardByPermissions(tenantRole.permissions);
}

// 레벨 4 역할 확인 (최고 관리자)
function isLevel4Role(tenantRole) {
  const level4RoleNames = ['원장', '수퍼관리자', '사장'];
  return level4RoleNames.includes(tenantRole.nameKo) || 
         tenantRole.templateCode?.includes('PRINCIPAL') ||
         tenantRole.templateCode?.includes('SUPER_ADMIN');
}
```

### 8.2 역할 정보 조회

```javascript
// 로그인 응답에 tenantRole 정보 포함
{
  "success": true,
  "user": {
    "id": 1,
    "email": "student@academy.com",
    "tenantId": "academy-001",
    "tenantRole": {
      "tenantRoleId": "role-001",
      "name": "학생",
      "nameKo": "학생",
      "templateCode": "ACADEMY_STUDENT",  // 템플릿 기반이면 있음
      "permissions": ["ACADEMY_VIEW_CLASS", "ACADEMY_VIEW_ATTENDANCE"]
    }
  }
}
```

### 8.3 역할 관리 페이지 UI

**페이지 경로:** `/admin/roles` 또는 `/tenant/{tenantId}/roles`

**기능:**
1. **역할 목록 테이블**
   - 역할명, 설명, 템플릿 여부, 사용자 수, 활성 상태
   - 정렬/필터링 기능

2. **역할 생성 모달/폼**
   - 템플릿 선택 (드롭다운): "템플릿에서 선택" 또는 "커스텀 생성"
   - 역할명 입력 (한글/영문)
   - 설명 입력
   - 권한 선택 (체크박스 목록)
   - 저장 버튼

3. **역할 수정**
   - 역할 클릭 또는 수정 버튼
   - 역할명, 설명, 권한 수정
   - 활성/비활성 토글

4. **역할 삭제**
   - 삭제 버튼 (사용자가 할당된 역할은 삭제 불가 경고)
   - 확인 다이얼로그

**API 호출 예시:**
```javascript
// 역할 목록 조회
GET /api/tenants/{tenantId}/roles

// 역할 생성 (템플릿 기반)
POST /api/tenants/{tenantId}/roles
{
  "roleTemplateId": "template-001",
  "name": "보조강사",
  "nameKo": "보조강사",
  "description": "보조 강사 역할"
}

// 역할 생성 (커스텀)
POST /api/tenants/{tenantId}/roles
{
  "name": "보조강사",
  "nameKo": "보조강사",
  "description": "보조 강사 역할",
  "permissions": [
    {
      "permissionCode": "ACADEMY_VIEW_CLASS",
      "scope": "BRANCH"
    }
  ]
}

// 역할 수정
PUT /api/tenants/{tenantId}/roles/{tenantRoleId}
{
  "name": "보조강사",
  "nameKo": "보조강사",
  "description": "보조 강사 역할 (수정됨)",
  "isActive": true
}

// 역할 삭제
DELETE /api/tenants/{tenantId}/roles/{tenantRoleId}
```

## 9. 역할 관리 정책

### 9.1 역할 생성 권한

- **원장/최고관리자**: 모든 역할 생성/수정/삭제 가능
- **관리자**: 제한된 역할 생성/수정 가능 (시스템 역할 제외)
- **일반 사용자**: 역할 관리 불가

### 9.2 역할 삭제 제약

- **필수 역할 (레벨 1, 2)**: 삭제 불가 (기본 역할)
- **옵션 역할 (레벨 3, 4)**: 삭제 가능 (관리 페이지에서)
- 사용자가 할당된 역할은 삭제 불가 (먼저 사용자 역할 해제 필요)
- 시스템 필수 역할은 삭제 불가 (`is_system_template = true`)

### 9.3 역할 수정 제약

- 시스템 템플릿 기반 역할도 커스터마이징 가능
- 권한 추가는 가능, 권한 삭제는 제한적 (보안 정책에 따라)

### 9.4 브랜치별 권한 관리

- **같은 역할, 다른 브랜치**: 브랜치별로 다른 권한 설정 가능
- **본원 vs 분원**: 본원은 전체 권한, 분원은 제한된 권한
- **권한 상속**: 테넌트 레벨 권한은 모든 브랜치에 적용
- **브랜치별 정책**: `policyJson`에 브랜치 ID 조건 포함

## 10. 구현 우선순위

### Phase 1: 백엔드 기반 구축
1. ✅ 설계 문서 작성
2. ⏳ UserRoleAssignment 엔티티 생성
3. ⏳ TenantRoleService 확장 (역할 CRUD)
4. ⏳ 역할 관리 API 구현 (생성/수정/삭제/조회)
5. ⏳ 마이그레이션 스크립트 작성

### Phase 2: 프론트엔드 관리 페이지
6. ⏳ 역할 관리 페이지 컴포넌트 생성 (`/admin/roles`)
   - 역할 목록 테이블
   - 역할 생성 모달/폼
   - 역할 수정 모달/폼
   - 역할 삭제 확인 다이얼로그
   - 권한 설정 UI

### Phase 3: 동적 라우팅 및 대시보드
7. ⏳ 동적 대시보드 라우팅 구현
8. ⏳ 역할별 대시보드 컴포넌트 생성

   **레벨 1 (필수) - 각각 별도 대시보드:**
   - `ClientDashboard` (상담소 내담자)
   - `StudentDashboard` (학원 학생)
   - `CustomerDashboard` (기타 손님)

   **레벨 2 (필수) - 각각 별도 대시보드:**
   - `ConsultantDashboard` (상담소 상담사)
   - `TeacherDashboard` (학원 선생님)
   - `StaffDashboard` (기타 관리자)

   **레벨 3, 4 (옵션) - 동일한 관리자 대시보드:**
   - `AdminDashboard` (레벨 3, 4 공통 사용)
   - 레벨 4는 권한으로만 구분 (별도 대시보드 없음)

