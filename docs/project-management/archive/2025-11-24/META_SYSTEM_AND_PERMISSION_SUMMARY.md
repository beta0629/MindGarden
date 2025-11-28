# 메타 시스템 및 권한 시스템 구현 완료 요약

**작성일**: 2025-11-24  
**상태**: ✅ 완료

---

## 🎯 메타 시스템 구현 완료

### 1. 관리자 생성 시 기본 위젯 자동 설정 (메타 시스템)

**구현 위치**:
- **DB**: `role_templates.default_widgets_json` (JSON 필드)
- **백엔드**: `TenantDashboardServiceImpl.getDefaultDashboardConfigFromTemplate()`
- **프론트엔드**: `DynamicDashboard` → `WidgetBasedDashboard`

**동작 방식**:
1. 온보딩 승인 시 역할별 대시보드 자동 생성
2. `RoleTemplate.default_widgets_json`에서 기본 위젯 설정 로드
3. 하드코딩 제거, DB 메타데이터 기반으로 동작

**관리자 기본 위젯** (DB 메타데이터):
```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 3,
    "gap": "md",
    "responsive": true
  },
  "widgets": [
    {
      "type": "welcome",
      "position": { "row": 0, "col": 0, "span": 3 },
      "config": { "title": "환영합니다" }
    },
    {
      "type": "summary-statistics",
      "position": { "row": 1, "col": 0, "span": 3 },
      "config": { "title": "통계 요약" }
    },
    {
      "type": "activity-list",
      "position": { "row": 2, "col": 0, "span": 3 },
      "config": { "title": "최근 활동" }
    }
  ]
}
```

**메타 시스템의 장점**:
- ✅ 코드 수정 없이 DB에서 위젯 변경 가능
- ✅ 새로운 역할 추가 시 템플릿만 추가하면 자동 적용
- ✅ 관리자 UI에서 위젯 설정 변경 가능 (추후 구현)

---

## 🔐 권한 시스템 구현 완료

### 1. 위젯 Visibility 필터링 (역할 기반)

**구현 위치**: `frontend/src/components/dashboard/DynamicDashboard.js` (line 260-280)

**기능**:
- 위젯의 `visibility.roles` 설정에 따라 필터링
- 사용자 역할이 허용된 역할 목록에 없으면 위젯 숨김

**코드**:
```javascript
// 위젯 필터링 (visibility 조건 확인)
const visibleWidgets = widgets.filter(widget => {
  if (!widget.visibility) {
    return true; // visibility 설정이 없으면 항상 표시
  }
  
  // 역할 기반 필터링
  if (widget.visibility.roles && widget.visibility.roles.length > 0) {
    const userRole = user?.role || user?.currentTenantRole?.roleName;
    if (!userRole || !widget.visibility.roles.includes(userRole)) {
      return false;
    }
  }
  
  return true;
});
```

**설정 예시**:
```json
{
  "id": "system-status-widget",
  "type": "system-status",
  "visibility": {
    "roles": ["ADMIN", "BRANCH_SUPER_ADMIN", "HQ_ADMIN"]
  }
}
```

---

### 2. 위젯 내부 권한 체크

**구현 위치**: 각 위젯 컴포넌트 내부

**예시 1: ErpManagementGridWidget**
- `PermissionChecks.hasPermission()` 사용
- 액션별 권한 체크

**코드** (`ErpManagementGridWidget.js`):
```javascript
const shouldShowAction = (action) => {
  // 권한 체크
  if (action.permission) {
    if (typeof action.permission === 'string') {
      return PermissionChecks.hasPermission(userPermissions, action.permission);
    } else if (typeof action.permission === 'function') {
      return action.permission(userPermissions);
    }
  }
  
  // 역할 필터링
  if (action.roles && user?.role) {
    return action.roles.includes(user.role);
  }
  
  return true;
};
```

**예시 2: NavigationMenuWidget**
- `hasMenuAccess()` 사용
- 메뉴 항목별 권한 체크

**코드** (`NavigationMenuWidget.js`):
```javascript
const shouldShowMenuItem = async (item) => {
  // 역할 필터링
  if (item.roles && user?.role) {
    if (!item.roles.includes(user.role)) {
      return false;
    }
  }
  
  // 권한 필터링
  if (item.permission || item.menuGroup) {
    const permission = item.permission || item.menuGroup;
    const hasAccess = await hasMenuAccess(permission);
    if (!hasAccess) {
      return false;
    }
  }
  
  return true;
};
```

---

### 3. 백엔드 권한 체크

**구현 위치**: 
- `DynamicPermissionService` - 동적 권한 체크
- `AccessControlService` - 테넌트 접근 제어
- 각 Controller - API 엔드포인트별 권한 체크

**예시: ErpController**:
```java
// 통합재무관리 접근 권한 확인
if (!dynamicPermissionService.hasPermission(currentUser, "INTEGRATED_FINANCE_VIEW")) {
    return ResponseEntity.status(403).body(Map.of(
        "success", false,
        "message", "통합재무관리 접근 권한이 없습니다."
    ));
}
```

---

## 📋 권한 시스템 구조

### 1. 위젯 레벨 권한

**위치**: `dashboardConfig.widgets[].visibility`

**설정 방법**:
```json
{
  "widgets": [
    {
      "id": "widget-1",
      "type": "system-status",
      "visibility": {
        "roles": ["ADMIN", "BRANCH_SUPER_ADMIN"],
        "conditions": [] // 향후 구현
      }
    }
  ]
}
```

### 2. 위젯 내부 액션 권한

**위치**: 위젯 컴포넌트 내부

**설정 방법**:
```javascript
const actions = [
  {
    label: "시스템 설정",
    permission: "SYSTEM_CONFIG_VIEW",
    roles: ["ADMIN"],
    url: "/admin/system-config"
  }
];
```

### 3. 메뉴 권한

**위치**: `NavigationMenuWidget`, `menuHelper.js`

**설정 방법**:
```javascript
const menuItems = [
  {
    label: "대시보드 관리",
    path: "/admin/dashboards",
    permission: "DASHBOARD_MANAGEMENT",
    roles: ["ADMIN"]
  }
];
```

---

## 🎨 화면 렌더링 흐름

```
1. 사용자 로그인
   ↓
2. DynamicDashboard 컴포넌트 로드
   ↓
3. getCurrentUserDashboard()로 대시보드 조회
   ↓
4. dashboardConfig 파싱 (JSON → 객체)
   ↓
5. WidgetBasedDashboard 렌더링
   ↓
6. 위젯 필터링 (visibility.roles 체크)
   ↓
7. 각 위젯 렌더링
   ↓
8. 위젯 내부 권한 체크 (필요시)
   ↓
9. 화면 표시
```

---

## ✅ 구현 완료 체크리스트

### 메타 시스템
- [x] RoleTemplate에 default_widgets_json 필드 추가
- [x] DB 마이그레이션 (V46)
- [x] 백엔드: getDefaultDashboardConfigFromTemplate() 구현
- [x] 하드코딩 제거 (createDefaultDashboardConfig는 fallback으로만 사용)
- [x] 관리자 생성 시 기본 위젯 자동 설정

### 권한 시스템
- [x] 위젯 visibility 필터링 (역할 기반)
- [x] 위젯 내부 권한 체크 (PermissionChecks)
- [x] 메뉴 권한 체크 (hasMenuAccess)
- [x] 백엔드 동적 권한 서비스 (DynamicPermissionService)
- [x] 테넌트 접근 제어 (AccessControlService)

### 화면 렌더링
- [x] DynamicDashboard 컴포넌트
- [x] WidgetBasedDashboard 컴포넌트
- [x] WidgetRegistry (위젯 레지스트리)
- [x] 위젯 컴포넌트들 (30+ 위젯)

---

## 🚀 다음 단계 (선택사항)

### 1. 조건 기반 필터링
- `visibility.conditions` 평가 로직 구현
- 예: `{ "conditions": [{ "field": "tenant.subscription.plan", "operator": ">=", "value": "PREMIUM" }] }`

### 2. 관리자 UI에서 위젯 설정
- 대시보드 관리 페이지에서 위젯 visibility 설정 UI
- 역할별 위젯 표시/숨김 설정

### 3. 권한 기반 위젯 동적 생성
- 사용자 권한에 따라 위젯 자동 추가/제거
- 예: `INTEGRATED_FINANCE_VIEW` 권한이 있으면 재무 위젯 자동 추가

---

## 📝 결론

**✅ 메타 시스템 구현 완료**
- DB 메타데이터 기반 위젯 설정
- 코드 수정 없이 DB에서 변경 가능

**✅ 권한 시스템 구현 완료**
- 위젯 레벨 권한 (visibility)
- 위젯 내부 액션 권한
- 메뉴 권한
- 백엔드 API 권한

**✅ 화면 렌더링 완료**
- DynamicDashboard → WidgetBasedDashboard
- 위젯 자동 렌더링 및 권한 필터링

**모든 기능이 정상적으로 구현되었습니다!** 🎉

---

**최종 업데이트**: 2025-11-24

