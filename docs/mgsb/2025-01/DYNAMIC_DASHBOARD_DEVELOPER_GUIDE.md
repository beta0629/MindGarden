# 동적 대시보드 시스템 개발자 가이드

## 📋 개요

동적 대시보드 시스템은 테넌트별로 역할에 맞는 대시보드를 동적으로 조회하고 표시하는 시스템입니다. 이 가이드는 개발자가 이 시스템을 이해하고 확장하는 방법을 설명합니다.

## 🏗️ 아키텍처

### 백엔드 구조

```
TenantDashboard (Entity)
  ├── tenantId: 테넌트 ID
  ├── tenantRoleId: 역할 ID
  ├── dashboardName: 대시보드 이름
  ├── dashboardType: 대시보드 타입
  ├── isActive: 활성화 여부
  ├── isDefault: 기본 대시보드 여부
  └── dashboardConfig: 대시보드 설정 (JSON)

TenantDashboardService
  ├── getDashboardByRole(): 역할별 대시보드 조회
  ├── getCurrentUserDashboard(): 현재 사용자 대시보드 조회
  └── createDefaultDashboards(): 기본 대시보드 생성

TenantDashboardController
  ├── GET /api/v1/tenant/dashboards/current
  └── GET /api/v1/tenant/dashboards/by-role/{tenantRoleId}
```

### 프론트엔드 구조

```
dashboardUtils.js
  ├── getCurrentUserDashboard(): 대시보드 정보 조회
  ├── getDynamicDashboardPath(): 동적 경로 생성
  ├── redirectToDynamicDashboard(): 동적 라우팅
  └── getLegacyDashboardPath(): 레거시 폴백

DynamicDashboard.js
  ├── 대시보드 정보 로드
  ├── 적절한 컴포넌트 선택
  └── 대시보드 컴포넌트 렌더링
```

## 🔧 사용법

### 1. 동적 대시보드로 리다이렉트

```javascript
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';

// 로그인 성공 후
const authResponse = {
  user: userInfo,
  currentTenantRole: {
    tenantRoleId: 'role-uuid',
    roleName: 'ADMIN'
  }
};

await redirectToDynamicDashboard(authResponse, navigate);
```

### 2. 대시보드 정보 조회

```javascript
import { getCurrentUserDashboard } from '../../utils/dashboardUtils';

// 현재 사용자 대시보드 조회
const dashboard = await getCurrentUserDashboard(tenantId, tenantRoleId);

if (dashboard) {
  console.log('대시보드 이름:', dashboard.dashboardName);
  console.log('대시보드 타입:', dashboard.dashboardType);
  console.log('대시보드 설정:', dashboard.dashboardConfig);
}
```

### 3. 레거시 폴백 사용

```javascript
import { getLegacyDashboardPath } from '../../utils/dashboardUtils';

// 역할 기반 레거시 경로 (동적 대시보드가 없을 때)
const legacyPath = getLegacyDashboardPath('ADMIN');
// 반환: '/admin/dashboard'
```

## 🎨 새로운 대시보드 타입 추가

### 1. 백엔드: 대시보드 타입 정의

대시보드 타입은 공통코드에서 관리하거나, `TenantDashboard.dashboardType` 필드에 직접 문자열로 저장할 수 있습니다.

**공통코드 사용 (권장)**:
```sql
-- common_codes 테이블에 추가
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, sort_order, is_active)
VALUES ('DASHBOARD_TYPE', 'CUSTOM_TYPE', 'Custom Dashboard', '커스텀 대시보드', 10, TRUE);
```

### 2. 프론트엔드: 컴포넌트 매핑

`DynamicDashboard.js`에서 새로운 대시보드 타입을 처리하도록 추가:

```javascript
// DynamicDashboard.js
import CustomDashboard from './CustomDashboard';

const DASHBOARD_COMPONENTS = {
  'CommonDashboard': CommonDashboard,
  'ClientDashboard': ClientDashboard,
  'AdminDashboard': AdminDashboard,
  'CustomDashboard': CustomDashboard, // 새로 추가
  // ...
};

// getDashboardComponentName 함수 업데이트
export const getDashboardComponentName = (dashboardType) => {
  const type = dashboardType.toUpperCase();
  
  const componentMap = {
    'STUDENT': 'AcademyDashboard',
    'TEACHER': 'AcademyDashboard',
    'ADMIN': 'AdminDashboard',
    'CLIENT': 'ClientDashboard',
    'CUSTOM_TYPE': 'CustomDashboard', // 새로 추가
    'DEFAULT': 'CommonDashboard'
  };
  
  return componentMap[type] || 'CommonDashboard';
};
```

### 3. 대시보드 컴포넌트 생성

새로운 대시보드 컴포넌트를 생성:

```javascript
// CustomDashboard.js
import React from 'react';
import SimpleLayout from '../layout/SimpleLayout';

const CustomDashboard = ({ user, dashboard }) => {
  return (
    <SimpleLayout>
      <div className="custom-dashboard">
        <h1>{dashboard?.dashboardName || '커스텀 대시보드'}</h1>
        {/* 대시보드 내용 */}
      </div>
    </SimpleLayout>
  );
};

export default CustomDashboard;
```

## 📝 대시보드 설정 JSON 구조

`dashboardConfig` 필드는 JSON 형태로 대시보드의 세부 설정을 저장합니다.

### 기본 구조

```json
{
  "layout": "grid",
  "columns": 3,
  "widgets": [
    {
      "id": "widget-1",
      "type": "statistics",
      "position": { "row": 0, "col": 0 },
      "config": {
        "title": "통계",
        "dataSource": "api/statistics"
      }
    },
    {
      "id": "widget-2",
      "type": "chart",
      "position": { "row": 0, "col": 1 },
      "config": {
        "title": "차트",
        "chartType": "line"
      }
    }
  ],
  "theme": "light",
  "refreshInterval": 30000
}
```

### 설정 필드 설명

- **layout**: 레이아웃 타입 (`grid`, `list`, `custom`)
- **columns**: 그리드 컬럼 수
- **widgets**: 위젯 배열
  - **id**: 위젯 고유 ID
  - **type**: 위젯 타입 (`statistics`, `chart`, `table`, `calendar` 등)
  - **position**: 위젯 위치 (`{row, col}`)
  - **config**: 위젯별 설정
- **theme**: 테마 (`light`, `dark`)
- **refreshInterval**: 자동 새로고침 간격 (밀리초)

### 설정 사용 예시

```javascript
// DynamicDashboard.js 또는 대시보드 컴포넌트에서
const dashboardConfig = dashboard?.dashboardConfig 
  ? JSON.parse(dashboard.dashboardConfig) 
  : {};

// 위젯 렌더링
dashboardConfig.widgets?.forEach(widget => {
  // 위젯 타입에 따라 적절한 컴포넌트 렌더링
});
```

## 🔄 대시보드 라우팅 흐름

```
1. 사용자 로그인
   ↓
2. AuthResponse에 currentTenantRole 포함
   ↓
3. redirectToDynamicDashboard() 호출
   ↓
4. getCurrentUserDashboard()로 대시보드 조회
   ↓
5. 대시보드 정보 있음?
   ├─ Yes → getDynamicDashboardPath()로 경로 생성 → DynamicDashboard로 라우팅
   └─ No → getLegacyDashboardPath()로 레거시 경로 생성 → 레거시 컴포넌트로 라우팅
   ↓
6. DynamicDashboard 컴포넌트 로드
   ↓
7. getDashboardComponentName()으로 컴포넌트 선택
   ↓
8. 적절한 대시보드 컴포넌트 렌더링
```

## 🛠️ API 사용법

### 현재 사용자 대시보드 조회

```javascript
// GET /api/v1/tenant/dashboards/current
const response = await apiGet('/api/v1/tenant/dashboards/current');

if (response.success && response.data) {
  const dashboard = response.data;
  // dashboard 사용
}
```

### 역할별 대시보드 조회

```javascript
// GET /api/v1/tenant/dashboards/by-role/{tenantRoleId}
const tenantRoleId = 'role-uuid';
const response = await apiGet(`/api/v1/tenant/dashboards/by-role/${tenantRoleId}`);

if (response.success && response.data) {
  const dashboard = response.data;
  // dashboard 사용
}
```

### 대시보드 목록 조회

```javascript
// GET /api/v1/tenant/dashboards
const response = await apiGet('/api/v1/tenant/dashboards');

if (response.success && Array.isArray(response.data)) {
  const dashboards = response.data;
  // dashboards 사용
}
```

## 🐛 디버깅

### 콘솔 로그 확인

동적 대시보드 시스템은 다음과 같은 로그를 출력합니다:

- `✅ 동적 대시보드 라우팅`: 동적 대시보드 조회 성공
- `⚠️ 레거시 대시보드 라우팅`: 레거시 폴백 사용
- `🎯 동적 대시보드 렌더링`: 대시보드 컴포넌트 렌더링

### Network 탭 확인

브라우저 개발자 도구의 Network 탭에서 다음 API 호출을 확인:

1. `/api/v1/tenant/dashboards/current` - 현재 사용자 대시보드 조회
2. `/api/v1/tenant/dashboards/by-role/{tenantRoleId}` - 역할별 대시보드 조회

### 일반적인 문제 해결

#### 문제 1: 대시보드가 표시되지 않음

**원인**: 
- 대시보드가 데이터베이스에 없음
- API 호출 실패
- 역할 정보가 없음

**해결**:
1. Network 탭에서 API 응답 확인
2. 콘솔에서 에러 메시지 확인
3. 데이터베이스에서 `tenant_dashboards` 테이블 확인

#### 문제 2: 레거시 폴백이 계속 사용됨

**원인**:
- 역할에 대시보드가 매핑되지 않음
- `isActive=false`인 대시보드만 있음

**해결**:
1. 대시보드 관리 UI에서 역할별 대시보드 확인
2. 대시보드가 활성화되어 있는지 확인
3. 기본 대시보드가 설정되어 있는지 확인

#### 문제 3: OAuth2 로그인 후 대시보드가 표시되지 않음

**원인**:
- `currentTenantRole`이 `null`
- 세션에 역할 정보가 저장되지 않음

**해결**:
1. OAuth2Callback.js에서 역할 정보 설정 확인
2. 세션에 `currentTenantRoleId` 저장 확인
3. `sessionManager.getCurrentTenantRole()` 확인

## 📚 관련 문서

- [동적 대시보드 라우팅 시스템](./DYNAMIC_DASHBOARD_ROUTING_SYSTEM.md)
- [테넌트 대시보드 관리 시스템](./TENANT_DASHBOARD_MANAGEMENT_SYSTEM.md)
- [동적 대시보드 다음 단계](./DYNAMIC_DASHBOARD_NEXT_STEPS.md)
- [통합 테스트 체크리스트](./DYNAMIC_DASHBOARD_TEST_CHECKLIST.md)

## 💡 베스트 프랙티스

1. **항상 동적 대시보드 우선 사용**
   - 새로운 코드에서는 `redirectToDynamicDashboard()` 사용
   - 레거시 함수는 하위 호환성용으로만 사용

2. **에러 처리**
   - 대시보드 조회 실패 시 레거시 폴백 사용
   - 사용자에게 오류 없이 대시보드 표시

3. **성능 최적화**
   - 대시보드 정보는 세션에 캐싱 (향후 구현)
   - 역할 변경 시에만 재조회

4. **테스트**
   - 모든 시나리오에서 동적 대시보드 동작 확인
   - 에러 케이스에서 폴백 동작 확인

---

**작성일**: 2025-01-XX  
**버전**: 1.0.0  
**작성자**: CoreSolution Development Team

