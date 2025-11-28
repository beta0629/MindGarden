# 완전한 위젯 목록

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: 모든 대시보드 컴포넌트의 위젯화 완료 상태 문서

---

## 📋 개요

CommonDashboard와 AdminDashboard에서 사용하던 모든 컴포넌트를 위젯으로 변환 완료했습니다. 이제 모든 대시보드 요소를 `dashboard_config` JSON으로 동적으로 구성할 수 있습니다.

---

## ✅ 완료된 위젯 변환

### 공통 컴포넌트 기반 위젯

| 위젯 타입 | 원본 컴포넌트 | 설명 | 상태 |
|----------|-------------|------|------|
| `header` | `SimpleHeader` | 헤더 위젯 (뒤로가기, 로고, 사용자 정보, 로그아웃) | ✅ 완료 |
| `erp-card` | `ErpCard` | ERP 카드 위젯 (MindGarden 디자인 시스템 기반) | ✅ 완료 |

## 공통 위젯 (모든 업종에서 사용 가능)

| 기존 컴포넌트 | 위젯 타입 | 상태 |
|--------------|----------|------|
| `WelcomeSection` | `welcome` | ✅ 완료 |
| `SummaryPanels` (범용 부분) | `summary-statistics` | ✅ 완료 |
| `RecentActivities` | `activity-list` | ✅ 완료 |
| `QuickActions` | `quick-actions` | ✅ 완료 |
| `ClientMessageSection` | `message` | ✅ 완료 |
| `SystemNotificationSection` | `notification` | ✅ 완료 |
| `ScheduleQuickAccess` | `schedule` | ✅ 완료 |
| `RatableConsultationsSection` | `rating` (mode: 'rate') | ✅ 완료 |
| `ConsultantRatingDisplay` | `rating` (mode: 'display') | ✅ 완료 |
| `ClientPaymentSessionsSection` | `payment` | ✅ 완료 |
| `ClientPersonalizedMessages` | `personalized-message` | ✅ 완료 |
| `HealingCard` | `healing-card` | ✅ 완료 |
| `ErpPurchaseRequestPanel` | `purchase-request` | ✅ 완료 |
| (메뉴 시스템) | `navigation-menu` | ✅ 완료 |

### 상담소 특화 위젯

| 기존 컴포넌트 | 위젯 타입 | 상태 |
|--------------|----------|------|
| `SummaryPanels` (상담소 특화 부분) | `consultation-summary` | ✅ 완료 |
| (상담 일정) | `consultation-schedule` | ✅ 완료 |
| (상담 통계) | `consultation-stats` | ✅ 완료 |
| `ConsultationRecordSection` | `consultation-record` | ✅ 완료 |
| `ConsultantClientSection` | `consultant-client` | ✅ 완료 |

---

## 📊 위젯 분류

### 1. 기본 위젯 (기존부터 존재)
- `statistics` - 기본 통계 위젯
- `chart` - 차트 위젯
- `table` - 테이블 위젯
- `calendar` - 캘린더 위젯
- `form` - 폼 위젯
- `custom` - 커스텀 위젯

### 2. 범용 위젯 (MindGarden 컴포넌트 기반)
- `summary-statistics` - 통계 요약
- `activity-list` - 활동 목록
- `welcome` - 환영 메시지
- `quick-actions` - 빠른 액션
- `navigation-menu` - 네비게이션 메뉴
- `message` - 메시지 목록
- `notification` - 알림 목록
- `schedule` - 일정 목록
- `rating` - 평가 (표시/평가하기)
- `payment` - 결제 세션
- `healing-card` - 힐링 카드
- `purchase-request` - 구매 요청
- `personalized-message` - 맞춤형 메시지

### 3. 상담소 특화 위젯
- `consultation-summary` - 상담 요약
- `consultation-schedule` - 상담 일정
- `consultation-stats` - 상담 통계
- `consultation-record` - 상담일지
- `consultant-client` - 내담자 목록

---

## 🎯 위젯 사용 예시

### 전체 대시보드 구성 예시

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
        "welcomeMessage": "{name}님, 환영합니다!"
      }
    },
    {
      "id": "summary-1",
      "type": "summary-statistics",
      "position": { "row": 1, "col": 0, "span": 1 },
      "config": {
        "title": "통계 요약",
        "statistics": [
          { "key": "totalUsers", "label": "총 사용자", "icon": "bi-people" }
        ],
        "dataSource": {
          "type": "api",
          "url": "/api/v1/statistics/summary"
        }
      }
    },
    {
      "id": "schedule-1",
      "type": "schedule",
      "position": { "row": 1, "col": 1, "span": 1 },
      "config": {
        "title": "오늘의 일정",
        "showTodayOnly": true,
        "dataSource": {
          "type": "api",
          "url": "/api/v1/schedules/today"
        }
      }
    },
    {
      "id": "notification-1",
      "type": "notification",
      "position": { "row": 1, "col": 2, "span": 1 },
      "config": {
        "title": "알림",
        "maxItems": 5,
        "dataSource": {
          "type": "api",
          "url": "/api/v1/notifications"
        }
      }
    },
    {
      "id": "consultation-summary-1",
      "type": "consultation-summary",
      "position": { "row": 2, "col": 0, "span": 2 },
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
    },
    {
      "id": "rating-1",
      "type": "rating",
      "position": { "row": 2, "col": 2, "span": 1 },
      "visibility": {
        "roles": ["CLIENT"]
      },
      "config": {
        "title": "평가하기",
        "mode": "rate",
        "dataSource": {
          "type": "api",
          "url": "/api/v1/ratings/ratable"
        }
      }
    }
  ]
}
```

---

## 🔄 컴포넌트 → 위젯 매핑 완료도

### CommonDashboard 컴포넌트
- ✅ `WelcomeSection` → `welcome`
- ✅ `SummaryPanels` → `summary-statistics` + `consultation-summary`
- ✅ `QuickActions` → `quick-actions`
- ✅ `RecentActivities` → `activity-list`
- ✅ `ClientMessageSection` → `message`
- ✅ `ErpPurchaseRequestPanel` → `purchase-request`
- ✅ `SystemNotificationSection` → `notification`
- ✅ `ClientPersonalizedMessages` → `personalized-message`
- ✅ `ClientPaymentSessionsSection` → `payment`
- ✅ `ConsultantClientSection` → `consultant-client`
- ✅ `HealingCard` → `healing-card`
- ✅ `ScheduleQuickAccess` → `schedule`
- ✅ `RatableConsultationsSection` → `rating` (mode: 'rate')
- ✅ `ConsultantRatingDisplay` → `rating` (mode: 'display')
- ✅ `ConsultationRecordSection` → `consultation-record`

### AdminDashboard 컴포넌트
- ✅ (대부분 CommonDashboard와 동일)
- ✅ 메뉴 시스템 → `navigation-menu`

---

## 📝 위젯 등록 상태

모든 위젯이 `WidgetRegistry.js`에 등록되어 있으며, 업종별 필터링이 지원됩니다:

```javascript
// 공통 위젯 (모든 업종)
COMMON_WIDGETS = {
  'welcome', 'summary-statistics', 'activity-list', 'quick-actions',
  'navigation-menu', 'message', 'notification', 'schedule',
  'rating', 'payment', 'healing-card', 'purchase-request',
  'personalized-message', ...
}

// 상담소 특화 위젯
CONSULTATION_WIDGETS = {
  'consultation-summary', 'consultation-schedule', 'consultation-stats',
  'consultation-record', 'consultant-client'
}
```

---

## 🎨 위젯 스타일링

모든 위젯은 공통 CSS 클래스를 사용합니다:
- `.widget` - 기본 위젯 컨테이너
- `.widget-header` - 위젯 헤더
- `.widget-body` - 위젯 본문
- `.widget-title` - 위젯 제목
- `.widget-empty` - 빈 상태 표시
- `.widget-error` - 오류 상태 표시

---

## ✅ 완료 체크리스트

- [x] 모든 CommonDashboard 컴포넌트 위젯화
- [x] 모든 AdminDashboard 컴포넌트 위젯화
- [x] 공통 위젯과 특화 위젯 분리
- [x] 위젯 레지스트리 등록
- [x] 역할 기반 필터링 지원
- [x] API 데이터 소스 지원
- [x] 위젯 문서화

---

## 🚀 다음 단계

1. **위젯 스타일링 개선**: 각 위젯의 CSS 완성
2. **위젯 편집기**: 드래그 앤 드롭으로 대시보드 구성
3. **위젯 테스트**: 각 위젯의 동작 검증
4. **성능 최적화**: 위젯 렌더링 최적화
5. **학원 특화 위젯**: 학원 업종용 위젯 추가

---

## 📚 참고 문서

- [위젯 아키텍처](./WIDGET_ARCHITECTURE.md)
- [위젯 사용 예시](./WIDGET_USAGE_EXAMPLES.md)
- [역할별 메뉴 위젯](./ROLE_BASED_MENU_WIDGET.md)
- [대시보드 설정 JSON 스키마](./META_SYSTEM_DASHBOARD_SCHEMA.md)

