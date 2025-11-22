# 기본 대시보드 표시 검증 문서

**작성일**: 2025-11-23  
**목적**: 1월 심사/발표를 위한 기본 대시보드 표시 검증  
**상태**: 검증 진행 중

---

## 📋 기본 대시보드 표시 개요

온보딩 후 관리자가 로그인했을 때 기본 대시보드가 올바르게 표시되는지 확인합니다.

**검증 항목**:
1. 역할별 대시보드 라우팅
2. 기본 위젯 3-5개 표시
3. 대시보드 레이아웃 기본 구조

---

## ✅ 검증 체크리스트

### 1. 역할별 대시보드 라우팅 ✅

**위치**: `dashboardUtils.js`, `DynamicDashboard.js`

**확인 사항**:
- [x] `redirectToDynamicDashboard()` 함수 존재
- [x] 동적 대시보드 조회 우선
- [x] 레거시 역할 기반 라우팅 (하위 호환성)
- [ ] 실제 로그인 후 대시보드 라우팅 테스트

**라우팅 로직**:
```javascript
// 1차: 동적 대시보드 조회 시도
const dashboard = await getDashboardFromAuthResponse(authResponse);

if (dashboard) {
  // 동적 대시보드로 라우팅
  navigate(getDynamicDashboardPath(dashboard));
} else {
  // 2차: 레거시 역할 기반 라우팅
  const legacyPath = getLegacyDashboardPath(userRole);
  navigate(legacyPath);
}
```

**테스트 방법**:
1. 관리자 계정으로 로그인
2. 로그인 후 자동 리다이렉트 확인
3. 올바른 대시보드 경로로 이동하는지 확인

**예상 경로**:
- 관리자: `/admin/dashboard` 또는 동적 대시보드 경로
- 상담사: `/consultant/dashboard`
- 내담자: `/client/dashboard`

---

### 2. 기본 위젯 표시 확인 ✅

**위치**: `WidgetRegistry.js`, `DynamicDashboard.js`

**확인 사항**:
- [x] 위젯 레지스트리 존재 (`WidgetRegistry.js`)
- [x] 공통 위젯 20개 이상 구현됨
- [x] 위젯 컴포넌트 매핑 정상
- [ ] 실제 대시보드에서 위젯 표시 확인

**기본 위젯 목록 (공통 위젯)**:
1. `welcome` - 환영 위젯
2. `summary-statistics` - 통계 요약 위젯
3. `activity-list` - 활동 목록 위젯
4. `schedule` - 일정 위젯
5. `notification` - 알림 위젯
6. `quick-actions` - 빠른 액션 위젯

**위젯 레지스트리 구조**:
```javascript
const COMMON_WIDGETS = {
  'statistics': StatisticsWidget,
  'chart': ChartWidget,
  'table': TableWidget,
  'calendar': CalendarWidget,
  'form': FormWidget,
  'custom': CustomWidget,
  'summary-statistics': SummaryStatisticsWidget,
  'activity-list': ActivityListWidget,
  'welcome': WelcomeWidget,
  'quick-actions': QuickActionsWidget,
  'navigation-menu': NavigationMenuWidget,
  'message': MessageWidget,
  'notification': NotificationWidget,
  'schedule': ScheduleWidget,
  // ... 기타 위젯들
};
```

**확인 쿼리**:
```sql
-- 대시보드 위젯 구성 확인
SELECT 
    td.dashboard_id,
    td.dashboard_name,
    td.dashboard_type,
    td.role_code,
    JSON_EXTRACT(td.dashboard_config, '$.widgets') as widgets
FROM tenant_dashboards td
WHERE td.tenant_id = 'test-tenant-001'
  AND td.is_default = TRUE
ORDER BY td.created_at;
```

**예상 결과**:
- 각 역할별 기본 대시보드에 3-5개의 위젯이 포함됨
- 위젯 타입이 `COMMON_WIDGETS`에 등록된 타입인지 확인

---

### 3. 대시보드 레이아웃 기본 구조 ✅

**위치**: `DynamicDashboard.js`, `dashboard_config` JSON

**확인 사항**:
- [x] `dashboard_config` JSON 스키마 정의됨
- [x] `DynamicDashboard` 컴포넌트 존재
- [x] 위젯 레이아웃 렌더링 로직
- [ ] 실제 대시보드 레이아웃 표시 확인

**대시보드 설정 구조**:
```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 12,
    "rows": "auto"
  },
  "widgets": [
    {
      "id": "widget-1",
      "type": "welcome",
      "position": { "x": 0, "y": 0, "w": 12, "h": 2 },
      "config": {}
    },
    {
      "id": "widget-2",
      "type": "summary-statistics",
      "position": { "x": 0, "y": 2, "w": 6, "h": 4 },
      "config": {}
    },
    {
      "id": "widget-3",
      "type": "activity-list",
      "position": { "x": 6, "y": 2, "w": 6, "h": 4 },
      "config": {}
    }
  ]
}
```

**확인 쿼리**:
```sql
-- 대시보드 설정 확인
SELECT 
    dashboard_id,
    dashboard_name,
    dashboard_config,
    JSON_EXTRACT(dashboard_config, '$.layout') as layout,
    JSON_EXTRACT(dashboard_config, '$.widgets') as widgets,
    JSON_LENGTH(JSON_EXTRACT(dashboard_config, '$.widgets')) as widget_count
FROM tenant_dashboards
WHERE tenant_id = 'test-tenant-001'
  AND is_default = TRUE;
```

**예상 결과**:
- `layout` 필드가 존재하고 타입이 정의됨
- `widgets` 배열에 최소 3개 이상의 위젯이 포함됨
- 각 위젯에 `position` 정보가 포함됨

---

## 🔍 통합 테스트 시나리오

### 시나리오 1: 관리자 대시보드 접근

1. **관리자 로그인**
   - 생성된 관리자 계정으로 로그인
   - 이메일: `admin@consultation.com` (온보딩 시 생성)
   - 비밀번호: `test1234` (checklistJson에서 설정)

2. **대시보드 자동 라우팅**
   - 로그인 성공 후 자동으로 대시보드로 리다이렉트
   - 경로: `/admin/dashboard` 또는 동적 대시보드 경로

3. **대시보드 표시 확인**
   - 대시보드가 정상적으로 로드됨
   - 기본 위젯 3-5개가 표시됨
   - 위젯 데이터가 정상적으로 로드됨

4. **위젯 동작 확인**
   - 각 위젯이 정상적으로 렌더링됨
   - 위젯 내부 데이터가 표시됨
   - 위젯 상호작용 (클릭, 스크롤 등) 정상 동작

---

### 시나리오 2: 역할별 대시보드 확인

1. **다양한 역할로 로그인 테스트**
   - 관리자 (ADMIN)
   - 상담사 (CONSULTANT)
   - 내담자 (CLIENT)

2. **각 역할별 대시보드 확인**
   - 역할에 맞는 대시보드로 라우팅됨
   - 역할에 맞는 위젯이 표시됨
   - 역할에 맞는 권한이 적용됨

---

## 🐛 발견된 이슈 및 해결 방안

### 이슈 1: (추가 이슈 발견 시 기록)

---

## 📝 다음 단계

1. [ ] 실제 관리자 계정으로 로그인 테스트
2. [ ] 대시보드 라우팅 확인
3. [ ] 기본 위젯 표시 확인
4. [ ] 위젯 데이터 로드 확인
5. [ ] 대시보드 레이아웃 확인

---

## 📊 기본 위젯 우선순위 (MVP)

**1월 심사/발표용 최소 위젯**:
1. `welcome` - 환영 메시지 (필수)
2. `summary-statistics` - 기본 통계 (필수)
3. `activity-list` - 최근 활동 (권장)
4. `schedule` - 일정 (권장)
5. `notification` - 알림 (선택)

**참고**: 
- MVP에서는 위젯이 표시되는 것만 확인하면 됨
- 실제 데이터는 데모용 더미 데이터로도 충분
- 위젯 기능 완전성보다는 **대시보드 구조와 확장 가능성**을 보여주는 것이 중요

---

**마지막 업데이트**: 2025-11-23

