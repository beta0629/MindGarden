# 위젯 설정 가이드

**작성일**: 2025-11-24  
**목적**: 대시보드 위젯 설정 방법 안내

---

## 📍 위젯 설정 위치

### 1. 위젯 컴포넌트 등록 (개발자용)

**파일**: `frontend/src/components/dashboard/widgets/WidgetRegistry.js`

위젯 타입과 React 컴포넌트를 매핑하는 레지스트리입니다.

```javascript
// 공통 위젯 (모든 업종)
const COMMON_WIDGETS = {
  'statistics': StatisticsWidget,
  'chart': ChartWidget,
  'welcome': WelcomeWidget,
  // ...
};

// 상담소 특화 위젯
const CONSULTATION_WIDGETS = {
  'consultation-summary': ConsultationSummaryWidget,
  'consultation-schedule': ConsultationScheduleWidget,
  // ...
};

// 학원 특화 위젯
const ACADEMY_WIDGETS = {
  // 'academy-schedule': AcademyScheduleWidget,  // 주석 처리됨 (아직 미구현)
  // 'academy-attendance': AcademyAttendanceWidget
};
```

**새 위젯 추가 방법**:
1. 위젯 컴포넌트 파일 생성 (`frontend/src/components/dashboard/widgets/`)
2. `WidgetRegistry.js`에서 import
3. 적절한 카테고리에 추가 (COMMON_WIDGETS, CONSULTATION_WIDGETS, ACADEMY_WIDGETS 등)

---

### 2. 대시보드 설정 UI (관리자용)

**파일**: `frontend/src/components/admin/DashboardFormModal.js`

관리자가 대시보드를 생성/수정할 때 사용하는 모달입니다.

**접근 방법**:
- 관리자 페이지 → 대시보드 관리 → 대시보드 생성/수정
- `dashboardConfig` 필드에 JSON 형식으로 위젯 설정 입력

**설정 예시**:
```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 3,
    "gap": "md"
  },
  "widgets": [
    {
      "id": "widget-1",
      "type": "welcome",
      "position": { "row": 0, "col": 0, "span": 3 },
      "config": {}
    },
    {
      "id": "widget-2",
      "type": "summary-statistics",
      "position": { "row": 1, "col": 0, "span": 2 },
      "config": {}
    }
  ]
}
```

---

### 3. 데이터베이스 저장 위치

**테이블**: `tenant_dashboards`  
**필드**: `dashboard_config` (JSON 타입)

대시보드 설정이 JSON 형식으로 저장됩니다.

**확인 방법**:
```sql
SELECT 
    dashboard_id,
    name,
    dashboard_config
FROM tenant_dashboards
WHERE tenant_id = 'your-tenant-id';
```

---

### 4. 기본 대시보드 자동 생성 (백엔드)

**파일**: `src/main/java/com/coresolution/core/service/impl/TenantDashboardServiceImpl.java`

온보딩 시 역할별 기본 위젯이 자동으로 생성됩니다.

**역할별 기본 위젯**:
- **관리자 (ADMIN)**: welcome, summary-statistics, activity-list
- **학생 (STUDENT)**: schedule, notification
- **선생님 (TEACHER)**: schedule, summary-statistics
- **기본**: welcome, summary-statistics

**코드 위치**: `createDefaultDashboardConfig()` 메서드 (약 487-519줄)

---

### 5. 대시보드 렌더링 (프론트엔드)

**파일**: `frontend/src/components/dashboard/DynamicDashboard.js`

`dashboardConfig` JSON을 읽어서 위젯을 동적으로 렌더링합니다.

**동작 방식**:
1. `dashboardConfig.widgets` 배열을 순회
2. 각 위젯의 `type`으로 `WidgetRegistry`에서 컴포넌트 조회
3. `position` 정보로 레이아웃 배치
4. `config` 정보를 props로 전달하여 렌더링

---

## 🛠️ 위젯 설정 방법

### 방법 1: 관리자 UI에서 설정 (권장)

1. **관리자 페이지 접속**
   - 로그인 → 관리자 메뉴 → 대시보드 관리

2. **대시보드 생성/수정**
   - "대시보드 생성" 버튼 클릭
   - 또는 기존 대시보드 "수정" 버튼 클릭

3. **위젯 설정 입력**
   - "대시보드 설정 (JSON)" 필드에 JSON 입력
   - 또는 향후 드래그 앤 드롭 UI 사용 (개발 예정)

4. **저장**
   - "생성" 또는 "수정" 버튼 클릭

### 방법 2: 데이터베이스 직접 수정 (고급)

```sql
UPDATE tenant_dashboards
SET dashboard_config = '{
  "version": "1.0",
  "layout": { "type": "grid", "columns": 3 },
  "widgets": [
    {
      "id": "widget-1",
      "type": "welcome",
      "position": { "row": 0, "col": 0, "span": 3 }
    }
  ]
}'
WHERE dashboard_id = 'your-dashboard-id';
```

### 방법 3: 백엔드 코드에서 기본 설정 수정

`TenantDashboardServiceImpl.java`의 `createDefaultDashboardConfig()` 메서드 수정

---

## 📋 위젯 설정 JSON 스키마

### 전체 구조

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
      "id": "widget-uuid",
      "type": "widget-type",
      "position": {
        "row": 0,
        "col": 0,
        "span": 1
      },
      "size": {
        "width": "auto",
        "height": "auto"
      },
      "config": {},
      "visibility": {
        "roles": ["ADMIN"],
        "conditions": []
      }
    }
  ],
  "theme": {
    "mode": "light",
    "primaryColor": "#007bff"
  },
  "refresh": {
    "enabled": true,
    "interval": 30000
  }
}
```

### 위젯 객체 상세

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | string | ✅ | 위젯 고유 ID (UUID 권장) |
| `type` | string | ✅ | 위젯 타입 (WidgetRegistry에 등록된 타입) |
| `position` | object | ✅ | 위젯 위치 (row, col, span) |
| `size` | object | ❌ | 위젯 크기 (width, height) |
| `config` | object | ❌ | 위젯별 설정 (위젯 타입에 따라 다름) |
| `visibility` | object | ❌ | 표시 조건 (roles, conditions) |

---

## 🎯 학원 위젯 추가 방법

### 1. 위젯 컴포넌트 생성

```javascript
// frontend/src/components/dashboard/widgets/academy/AcademyScheduleWidget.js
import React from 'react';

const AcademyScheduleWidget = ({ config, dashboard }) => {
  // 위젯 로직 구현
  return (
    <div className="academy-schedule-widget">
      {/* 위젯 UI */}
    </div>
  );
};

export default AcademyScheduleWidget;
```

### 2. WidgetRegistry에 등록

```javascript
// frontend/src/components/dashboard/widgets/WidgetRegistry.js
import AcademyScheduleWidget from './academy/AcademyScheduleWidget';

const ACADEMY_WIDGETS = {
  'academy-schedule': AcademyScheduleWidget,  // 주석 해제 및 추가
  'academy-attendance': AcademyAttendanceWidget
};
```

### 3. 대시보드 설정에 추가

```json
{
  "widgets": [
    {
      "id": "academy-schedule-1",
      "type": "academy-schedule",
      "position": { "row": 0, "col": 0, "span": 2 },
      "config": {
        "title": "학원 일정",
        "showCalendar": true
      }
    }
  ]
}
```

---

## 📚 참고 문서

- [대시보드 설정 JSON 스키마](../2025-11-22/META_SYSTEM_DASHBOARD_SCHEMA.md)
- [위젯 아키텍처](../2025-11-22/WIDGET_ARCHITECTURE.md)
- [전체 위젯 목록](../2025-11-22/COMPLETE_WIDGET_LIST.md)
- [동적 대시보드 개발자 가이드](../2025-01/DYNAMIC_DASHBOARD_DEVELOPER_GUIDE.md)

---

## 💡 팁

1. **위젯 타입 확인**: `WidgetRegistry.js`의 `getSupportedWidgetTypes()` 메서드로 사용 가능한 위젯 타입 확인
2. **위젯 테스트**: 먼저 간단한 위젯으로 테스트한 후 복잡한 위젯 추가
3. **JSON 검증**: JSON 형식 오류 방지를 위해 JSON 검증 도구 사용
4. **역할별 위젯**: `visibility.roles`로 특정 역할에게만 위젯 표시 가능

---

**작성자**: 개발팀  
**최종 업데이트**: 2025-11-24

