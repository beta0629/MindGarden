# 동적 대시보드 라우팅 시스템

## 📋 개요

현재 프론트엔드는 하드코딩된 역할 기반 대시보드 라우팅을 사용하고 있습니다. 이를 테넌트 대시보드 관리 시스템과 연동하여 완전히 동적인 대시보드 라우팅 시스템으로 전환합니다.

### 현재 문제점

1. **하드코딩된 역할 매핑**
   ```javascript
   // frontend/src/utils/session.js
   const ROLE_DASHBOARD_MAP = {
     'CLIENT': '/client/dashboard',
     'CONSULTANT': '/consultant/dashboard',
     'ADMIN': '/admin/dashboard',
     // ... 하드코딩된 역할들
   };
   ```

2. **고정된 대시보드 컴포넌트**
   - `ClientDashboard`, `AdminDashboard`, `HQDashboard` 등 고정 컴포넌트
   - 새로운 역할 추가 시 코드 수정 필요

3. **테넌트별 커스터마이징 불가**
   - 모든 테넌트가 동일한 대시보드 구조 사용
   - 테넌트 관리자가 대시보드를 커스터마이징해도 프론트엔드에 반영 안 됨

## 🎯 목표

1. **동적 대시보드 조회**
   - 사용자 로그인 시 백엔드에서 역할별 대시보드 정보 조회
   - `TenantDashboard` API를 통해 동적으로 대시보드 정보 가져오기

2. **동적 라우팅**
   - 하드코딩된 `ROLE_DASHBOARD_MAP` 제거
   - 사용자 역할에 맞는 대시보드로 자동 라우팅

3. **대시보드 컴포넌트 동적 로드**
   - 대시보드 타입(`dashboard_type`)에 따라 적절한 컴포넌트 로드
   - 또는 범용 대시보드 컴포넌트 사용

## 🏗️ 구현 계획

### Phase 1: 백엔드 API 확장

#### 1.1 사용자 역할별 대시보드 조회 API

```
GET /api/v1/users/{userId}/dashboard
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "dashboardId": "dashboard-uuid",
    "dashboardNameKo": "학생 대시보드",
    "dashboardType": "STUDENT",
    "tenantRoleId": "role-uuid",
    "roleNameKo": "학생",
    "dashboardConfig": {
      "widgets": [],
      "layout": "grid"
    }
  }
}
```

#### 1.2 현재 사용자 대시보드 조회 API

```
GET /api/v1/tenant/dashboards/current
```

세션 기반으로 현재 사용자의 역할에 맞는 대시보드 자동 조회

### Phase 2: 프론트엔드 동적 라우팅

#### 2.1 대시보드 조회 유틸리티

```javascript
// frontend/src/utils/dashboardUtils.js

/**
 * 사용자의 역할에 맞는 대시보드 정보 조회
 */
export const getCurrentUserDashboard = async (userId, tenantId) => {
  try {
    const response = await apiGet(`/api/v1/users/${userId}/dashboard?tenantId=${tenantId}`);
    return response.data;
  } catch (error) {
    console.error('대시보드 조회 실패:', error);
    return null;
  }
};

/**
 * 동적 대시보드 경로 생성
 */
export const getDynamicDashboardPath = (dashboard) => {
  if (!dashboard) return '/dashboard';
  
  // 대시보드 타입 기반 경로 생성
  const type = dashboard.dashboardType?.toLowerCase() || 'default';
  return `/dashboard/${type}`;
};
```

#### 2.2 동적 대시보드 컴포넌트

```javascript
// frontend/src/components/dashboard/DynamicDashboard.js

const DynamicDashboard = ({ dashboard, user }) => {
  // 대시보드 타입에 따라 적절한 컴포넌트 로드
  const DashboardComponent = getDashboardComponent(dashboard.dashboardType);
  
  return (
    <DashboardComponent 
      user={user}
      dashboard={dashboard}
      config={dashboard.dashboardConfig}
    />
  );
};
```

#### 2.3 로그인 후 동적 라우팅

```javascript
// frontend/src/components/auth/UnifiedLogin.js

// 로그인 성공 후
const dashboard = await getCurrentUserDashboard(user.id, tenantId);
if (dashboard) {
  const dashboardPath = getDynamicDashboardPath(dashboard);
  navigate(dashboardPath);
} else {
  // 기본 대시보드로 폴백
  navigate('/dashboard');
}
```

### Phase 3: 대시보드 관리 UI

#### 3.1 대시보드 관리 페이지

```
/admin/dashboards
```

- 테넌트의 모든 대시보드 목록
- 대시보드 추가/수정/삭제
- 대시보드 이름 수정
- 대시보드 활성화/비활성화

#### 3.2 대시보드 설정 UI

- 위젯 구성 관리
- 레이아웃 설정
- 대시보드 미리보기

## 🔄 마이그레이션 전략

### 단계별 전환

1. **Phase 1: 백엔드 API 구현** ✅ (완료)
   - `TenantDashboardService` 구현 완료
   - `TenantDashboardController` 구현 완료

2. **Phase 2: 프론트엔드 통합**
   - 동적 대시보드 조회 유틸리티 추가
   - 로그인 후 대시보드 조회 및 라우팅
   - 기존 하드코딩된 라우팅과 병행 운영

3. **Phase 3: 레거시 제거**
   - 하드코딩된 `ROLE_DASHBOARD_MAP` 제거
   - 모든 대시보드 라우팅을 동적 시스템으로 전환

4. **Phase 4: 대시보드 관리 UI**
   - 관리자 대시보드 관리 페이지 구현
   - 대시보드 커스터마이징 UI

## 📊 데이터 흐름

```
1. 사용자 로그인
   ↓
2. AuthResponse에 currentTenantRole 정보 포함
   ↓
3. 프론트엔드에서 tenantRoleId로 대시보드 조회
   GET /api/v1/tenant/dashboards?tenantRoleId={roleId}
   ↓
4. 대시보드 정보 기반으로 동적 라우팅
   navigate(`/dashboard/${dashboardType}`)
   ↓
5. DynamicDashboard 컴포넌트가 dashboardConfig 기반으로 렌더링
```

## 🔌 API 명세

### 현재 사용자 대시보드 조회

```
GET /api/v1/tenant/dashboards/current
```

**응답**:
```json
{
  "success": true,
  "data": {
    "dashboardId": "dashboard-uuid",
    "dashboardNameKo": "학생 대시보드",
    "dashboardType": "STUDENT",
    "isActive": true,
    "dashboardConfig": {}
  }
}
```

### 역할별 대시보드 조회

```
GET /api/v1/tenant/dashboards?tenantRoleId={roleId}
```

## 🎨 프론트엔드 컴포넌트 구조

```
frontend/src/components/dashboard/
├── DynamicDashboard.js       # 동적 대시보드 로더
├── DashboardLoader.js        # 대시보드 정보 로더
├── DashboardRouter.js        # 대시보드 라우터
└── types/
    ├── StudentDashboard.js   # 학생 대시보드
    ├── TeacherDashboard.js   # 선생님 대시보드
    └── AdminDashboard.js     # 관리자 대시보드 (기존 재사용)
```

## ✅ 완료된 작업

1. ✅ `TenantDashboard` 엔티티 및 Repository
2. ✅ `TenantDashboardService` 및 구현체
3. ✅ `TenantDashboardController` (대시보드 CRUD API)
4. ✅ 온보딩 시 기본 대시보드 자동 생성
5. ✅ 문서화 (`TENANT_DASHBOARD_MANAGEMENT_SYSTEM.md`)

## 🚧 다음 단계

**상세 작업 계획은 `DYNAMIC_DASHBOARD_NEXT_STEPS.md` 참조**

주요 작업:
1. ✅ 프론트엔드 동적 대시보드 조회 유틸리티 구현 (완료)
2. ✅ 로그인 후 동적 라우팅 로직 추가 (완료)
3. ✅ DynamicDashboard 컴포넌트 생성 (완료)
4. **대시보드 관리 UI 구현** (`/admin/dashboards`) - 다음 단계
5. **레거시 코드 정리** - 점진적 마이그레이션
6. **통합 테스트 및 검증** - 시스템 재부팅 후 진행

## 📚 관련 문서

- [테넌트 대시보드 관리 시스템](./TENANT_DASHBOARD_MANAGEMENT_SYSTEM.md)
- [업종별 역할 시스템 설계](./BUSINESS_CATEGORY_ROLE_SYSTEM.md)
- [동적 권한 관리 시스템](./SSO_AND_PERMISSION_VERIFICATION_REPORT.md)

