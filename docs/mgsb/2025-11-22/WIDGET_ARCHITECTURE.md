# 위젯 아키텍처 문서

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: MindGarden 컴포넌트 위젯화 및 공통/특화 분리 구조 정의

---

## 📋 개요

MindGarden의 기존 컴포넌트들을 위젯으로 변환하여 다른 입점사(상담소, 학원 등)에서도 재사용할 수 있도록 구조화했습니다. **공통 위젯**은 모든 업종에서 사용 가능하고, **특화 위젯**은 해당 업종에서만 사용됩니다.

---

## 🏗️ 위젯 구조

### 위젯 분류

#### 1. 공통 위젯 (Common Widgets)
**위치**: `frontend/src/components/dashboard/widgets/`  
**사용 범위**: 모든 업종에서 사용 가능

- `StatisticsWidget` - 기본 통계 위젯
- `ChartWidget` - 차트 위젯
- `TableWidget` - 테이블 위젯
- `CalendarWidget` - 캘린더 위젯
- `FormWidget` - 폼 위젯
- `CustomWidget` - 커스텀 위젯
- `SummaryStatisticsWidget` - 통계 요약 위젯 (범용)
- `ActivityListWidget` - 활동 목록 위젯 (범용)
- `WelcomeWidget` - 환영 위젯 (범용)
- `QuickActionsWidget` - 빠른 액션 위젯 (범용)

#### 2. 상담소 특화 위젯 (Consultation Widgets)
**위치**: `frontend/src/components/dashboard/widgets/consultation/`  
**사용 범위**: 상담소 업종에서만 사용

- `ConsultationSummaryWidget` - 상담소 통계 요약 위젯
- `ConsultationScheduleWidget` - 상담 일정 위젯
- `ConsultationStatsWidget` - 상담 통계 위젯

#### 3. 학원 특화 위젯 (Academy Widgets)
**위치**: `frontend/src/components/dashboard/widgets/academy/`  
**사용 범위**: 학원 업종에서만 사용

- (향후 구현 예정)
- `AcademyScheduleWidget` - 학원 일정 위젯
- `AcademyAttendanceWidget` - 출석 관리 위젯

---

## 🔧 위젯 레지스트리

### WidgetRegistry.js

위젯 레지스트리는 위젯 타입을 컴포넌트로 매핑하고, 업종에 따라 적절한 위젯을 반환합니다.

```javascript
// 공통 위젯 (모든 업종)
const COMMON_WIDGETS = {
  'statistics': StatisticsWidget,
  'summary-statistics': SummaryStatisticsWidget,
  'activity-list': ActivityListWidget,
  'welcome': WelcomeWidget,
  'quick-actions': QuickActionsWidget,
  // ...
};

// 상담소 특화 위젯
const CONSULTATION_WIDGETS = {
  'consultation-summary': ConsultationSummaryWidget,
  'consultation-schedule': ConsultationScheduleWidget,
  'consultation-stats': ConsultationStatsWidget
};

// 학원 특화 위젯
const ACADEMY_WIDGETS = {
  // 'academy-schedule': AcademyScheduleWidget,
  // ...
};
```

### 위젯 조회 API

```javascript
// 업종 정보를 전달하여 특화 위젯 필터링
const WidgetComponent = getWidgetComponent(widgetType, businessType);

// 예시:
// - businessType = 'consultation' → 상담소 특화 위젯도 반환
// - businessType = 'academy' → 학원 특화 위젯도 반환
// - businessType = null → 공통 위젯만 반환
```

---

## 📝 위젯 사용 예시

### dashboard_config JSON 예시

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
      "id": "welcome-1",
      "type": "welcome",
      "position": { "row": 0, "col": 0, "span": 3 },
      "config": {
        "title": "환영합니다",
        "welcomeMessage": "{name}님, 환영합니다!",
        "quickCards": [
          {
            "icon": "bi-calendar-check",
            "title": "일정 관리",
            "url": "/schedule"
          }
        ]
      }
    },
    {
      "id": "summary-1",
      "type": "summary-statistics",
      "position": { "row": 1, "col": 0, "span": 1 },
      "config": {
        "title": "통계 요약",
        "statistics": [
          {
            "key": "totalUsers",
            "label": "총 사용자",
            "icon": "bi-people",
            "format": "number"
          },
          {
            "key": "todayCount",
            "label": "오늘 건수",
            "icon": "bi-calendar",
            "format": "number"
          }
        ],
        "dataSource": {
          "type": "api",
          "url": "/api/v1/statistics/summary"
        }
      }
    },
    {
      "id": "consultation-summary-1",
      "type": "consultation-summary",
      "position": { "row": 1, "col": 1, "span": 2 },
      "visibility": {
        "roles": ["ADMIN", "CONSULTANT"]
      },
      "config": {
        "title": "상담 요약",
        "dataSource": {
          "type": "api",
          "url": "/api/v1/consultation/summary"
        }
      }
    }
  ]
}
```

---

## 🔄 컴포넌트 → 위젯 변환 매핑

### 기존 컴포넌트 → 위젯 변환

| 기존 컴포넌트 | 위젯 타입 | 분류 |
|--------------|----------|------|
| `SummaryPanels` | `summary-statistics` (공통) + `consultation-summary` (특화) | 공통/특화 분리 |
| `RecentActivities` | `activity-list` | 공통 |
| `WelcomeSection` | `welcome` | 공통 |
| `QuickActions` | `quick-actions` | 공통 |
| (상담소 특화 기능) | `consultation-*` | 상담소 특화 |

---

## 🎯 위젯 개발 가이드

### 공통 위젯 개발

1. **위치**: `frontend/src/components/dashboard/widgets/`
2. **요구사항**:
   - 업종에 독립적인 범용 기능만 포함
   - `widget.config`를 통해 설정 가능
   - `dataSource`를 통해 API 데이터 로드 지원

3. **예시**:
```javascript
const SummaryStatisticsWidget = ({ widget, user }) => {
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  
  // API 데이터 로드 또는 정적 데이터 사용
  // ...
  
  return (
    <div className="widget widget-summary-statistics">
      {/* 위젯 UI */}
    </div>
  );
};
```

### 특화 위젯 개발

1. **위치**: `frontend/src/components/dashboard/widgets/{업종}/`
2. **요구사항**:
   - 해당 업종의 비즈니스 로직 포함
   - 공통 위젯을 확장하거나 독립적으로 구현
   - `WidgetRegistry.js`에 등록

3. **예시**:
```javascript
// consultation/ConsultationSummaryWidget.js
const ConsultationSummaryWidget = ({ widget, user }) => {
  // 상담소 특화 로직
  // - 상담 일정 표시
  // - 상담 통계
  // - 매핑 관리
  // ...
};
```

---

## 📊 위젯 등록 프로세스

1. **위젯 컴포넌트 생성**
   - 공통 위젯: `widgets/` 폴더
   - 특화 위젯: `widgets/{업종}/` 폴더

2. **WidgetRegistry.js에 등록**
   ```javascript
   // 공통 위젯
   const COMMON_WIDGETS = {
     'new-widget': NewWidget,
     // ...
   };
   
   // 특화 위젯
   const CONSULTATION_WIDGETS = {
     'consultation-new': ConsultationNewWidget,
     // ...
   };
   ```

3. **위젯 타입 문서화**
   - `dashboard_config` JSON 스키마에 추가
   - 사용 예시 추가

---

## 🔍 위젯 필터링 로직

### DynamicDashboard에서 위젯 필터링

```javascript
// 업종 정보 추출
const businessType = dashboard?.businessType || 
                    dashboard?.categoryCode || 
                    currentUser?.tenant?.businessType || 
                    null;

// 위젯 조회 시 업종 정보 전달
const WidgetComponent = getWidgetComponent(widget.type, businessType);
```

### 위젯 레지스트리 필터링

```javascript
export const getWidgetComponent = (widgetType, businessType = null) => {
  // 공통 위젯은 항상 반환
  if (COMMON_WIDGETS[normalizedType]) {
    return COMMON_WIDGETS[normalizedType];
  }
  
  // 특화 위젯은 업종에 따라 필터링
  if (businessType === 'consultation' && CONSULTATION_WIDGETS[normalizedType]) {
    return CONSULTATION_WIDGETS[normalizedType];
  }
  
  if (businessType === 'academy' && ACADEMY_WIDGETS[normalizedType]) {
    return ACADEMY_WIDGETS[normalizedType];
  }
  
  return null;
};
```

---

## ✅ 완료된 작업

- [x] 공통 위젯 생성 (SummaryStatisticsWidget, ActivityListWidget, WelcomeWidget, QuickActionsWidget)
- [x] 상담소 특화 위젯 생성 (ConsultationSummaryWidget, ConsultationScheduleWidget, ConsultationStatsWidget)
- [x] WidgetRegistry 업데이트 (공통/특화 분리)
- [x] DynamicDashboard 업종 정보 전달 로직 추가
- [x] 위젯 아키텍처 문서 작성

---

## 🚀 향후 작업

- [ ] 학원 특화 위젯 구현
- [ ] 위젯 드래그 앤 드롭 편집기
- [ ] 위젯 설정 UI 개선
- [ ] 위젯 테스트 코드 작성
- [ ] 위젯 성능 최적화

---

## 📚 참고 문서

- [대시보드 설정 JSON 스키마](./META_SYSTEM_DASHBOARD_SCHEMA.md)
- [MindGarden 재사용성 검토](../2025-11-21/MINDGARDEN_REUSABILITY_REVIEW.md)
- [메타 시스템 도입 계획](../MASTER_TODO_AND_IMPROVEMENTS.md)

