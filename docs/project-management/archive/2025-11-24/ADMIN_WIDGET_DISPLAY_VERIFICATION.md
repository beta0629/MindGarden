# 관리자 위젯 화면 표시 확인

**작성일**: 2025-11-24  
**목적**: 관리자 생성 시 기본 위젯이 화면에 표시되는지 확인

---

## ✅ 구현 상태

### 1. 백엔드: 기본 위젯 설정 자동 생성

**위치**: `TenantDashboardServiceImpl.createDefaultDashboards()`

**동작**:
1. 온보딩 승인 시 역할별 대시보드 자동 생성
2. `RoleTemplate.default_widgets_json`에서 기본 위젯 설정 로드
3. `dashboard_config` JSON에 위젯 정보 저장

**관리자 기본 위젯**:
- `welcome` - 환영 위젯
- `summary-statistics` - 통계 요약
- `activity-list` - 최근 활동

---

### 2. 프론트엔드: 위젯 렌더링

**위치**: `frontend/src/components/dashboard/DynamicDashboard.js`

**동작 흐름**:

```
1. DynamicDashboard 컴포넌트 로드
   ↓
2. getCurrentUserDashboard()로 대시보드 조회
   ↓
3. dashboardConfig 파싱 (JSON → 객체)
   ↓
4. dashboardConfig.widgets가 있으면
   ↓
5. WidgetBasedDashboard 렌더링
   ↓
6. 각 위젯을 WidgetRegistry에서 가져와서 렌더링
```

**핵심 코드** (line 224-232):
```javascript
// dashboardConfig가 있으면 위젯 기반 렌더링
if (dashboardConfig && dashboardConfig.widgets && Array.isArray(dashboardConfig.widgets) && dashboardConfig.widgets.length > 0) {
  const businessType = dashboard?.businessType || 
                      dashboard?.categoryCode || 
                      currentUser?.tenant?.businessType || 
                      currentUser?.tenant?.categoryCode ||
                      null;
  return <WidgetBasedDashboard dashboardConfig={dashboardConfig} dashboard={dashboard} user={currentUser} businessType={businessType} />;
}
```

---

### 3. WidgetBasedDashboard 컴포넌트

**위치**: `frontend/src/components/dashboard/DynamicDashboard.js` (line 252-417)

**기능**:
- `dashboardConfig.widgets` 배열을 순회
- 각 위젯의 `type`으로 `WidgetRegistry`에서 컴포넌트 조회
- `position` 정보로 그리드 레이아웃 배치
- `config` 정보를 props로 전달하여 렌더링

**위젯 렌더링 로직** (line 294-331):
```javascript
const renderWidget = (widget) => {
  // 업종 정보를 전달하여 특화 위젯 필터링
  const WidgetComponent = getWidgetComponent(widget.type, businessType);
  
  if (!WidgetComponent) {
    console.warn(`⚠️ 지원되지 않는 위젯 타입: ${widget.type}`);
    return <div>지원되지 않는 위젯 타입: {widget.type}</div>;
  }
  
  return (
    <div key={widget.id}>
      <WidgetComponent widget={widget} user={user} />
    </div>
  );
};
```

---

### 4. WidgetRegistry

**위치**: `frontend/src/components/dashboard/widgets/WidgetRegistry.js`

**등록된 위젯**:
- ✅ `welcome` - WelcomeWidget
- ✅ `summary-statistics` - SummaryStatisticsWidget
- ✅ `activity-list` - ActivityListWidget
- ✅ 기타 30+ 위젯들

---

## 🧪 테스트 방법

### Step 1: 관리자 계정으로 로그인

```
URL: https://dev.core-solution.co.kr/login
계정: test-academy-1763988263@example.com
비밀번호: Test1234!@#
```

### Step 2: 대시보드 접속

관리자 로그인 후 자동으로 `/admin/dashboard` 또는 역할별 대시보드로 이동

### Step 3: 위젯 확인

다음 위젯들이 표시되어야 함:
1. **환영 위젯** (welcome) - 상단 전체 너비
2. **통계 요약** (summary-statistics) - 중간 전체 너비
3. **최근 활동** (activity-list) - 하단 전체 너비

---

## 🔍 확인 사항

### 브라우저 콘솔 확인

1. **대시보드 로드 로그**:
```
🎯 동적 대시보드 렌더링: {
  userRole: "ADMIN",
  isAdmin: true,
  hasDashboard: true,
  hasDashboardConfig: true,
  ...
}
```

2. **위젯 렌더링 로그**:
```
✅ 위젯 렌더링: welcome
✅ 위젯 렌더링: summary-statistics
✅ 위젯 렌더링: activity-list
```

### 네트워크 탭 확인

1. **대시보드 API 호출**:
```
GET /api/v1/tenant/dashboards/current
```

2. **응답 확인**:
```json
{
  "success": true,
  "data": {
    "dashboardId": "...",
    "dashboardConfig": {
      "version": "1.0",
      "layout": { "type": "grid", "columns": 3 },
      "widgets": [
        { "id": "welcome-xxx", "type": "welcome", ... },
        { "id": "summary-statistics-xxx", "type": "summary-statistics", ... },
        { "id": "activity-list-xxx", "type": "activity-list", ... }
      ]
    }
  }
}
```

---

## ⚠️ 문제 발생 시

### 문제 1: 위젯이 표시되지 않음

**원인**:
- `dashboardConfig`가 없음
- `dashboardConfig.widgets`가 비어있음
- 위젯 타입이 `WidgetRegistry`에 등록되지 않음

**해결**:
1. 브라우저 콘솔에서 `dashboardConfig` 확인
2. DB에서 `tenant_dashboards.dashboard_config` 확인
3. `WidgetRegistry`에 위젯 타입 등록 확인

### 문제 2: 위젯이 깨져서 표시됨

**원인**:
- 위젯 컴포넌트 오류
- CSS 스타일 문제
- 레이아웃 설정 오류

**해결**:
1. 브라우저 콘솔 오류 확인
2. 위젯 컴포넌트 파일 확인
3. CSS 클래스 확인

---

## 📋 체크리스트

- [ ] 관리자 계정으로 로그인 성공
- [ ] 대시보드 페이지 로드 성공
- [ ] `dashboardConfig`가 정상적으로 로드됨
- [ ] `dashboardConfig.widgets` 배열에 위젯이 있음
- [ ] `WidgetBasedDashboard` 컴포넌트가 렌더링됨
- [ ] 환영 위젯이 표시됨
- [ ] 통계 요약 위젯이 표시됨
- [ ] 최근 활동 위젯이 표시됨
- [ ] 위젯들이 올바른 위치에 배치됨
- [ ] 위젯들이 정상적으로 동작함

---

## 🎯 결론

**화면은 이미 구현되어 있습니다!**

- ✅ 백엔드: 관리자 생성 시 기본 위젯 자동 설정 (메타 시스템)
- ✅ 프론트엔드: `DynamicDashboard` → `WidgetBasedDashboard` → 위젯 렌더링
- ✅ 위젯 레지스트리: 모든 위젯 타입 등록 완료

**테스트만 진행하면 됩니다!**

---

**최종 업데이트**: 2025-11-24

