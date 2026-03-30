# 위젯 사용 예시

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: 위젯을 사용한 dashboard_config JSON 예시 모음

---

## 📋 개요

이 문서는 `dashboard_config` JSON을 사용하여 다양한 위젯을 구성하는 예시를 제공합니다.

---

## 🎯 공통 위젯 예시

### 예시 1: 기본 관리자 대시보드 (모든 업종 공통)

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
      "id": "welcome-1",
      "type": "welcome",
      "position": { "row": 0, "col": 0, "span": 3 },
      "config": {
        "title": "환영합니다",
        "welcomeMessage": "{name}님, 환영합니다!",
        "showTime": true,
        "quickCards": [
          {
            "icon": "bi-calendar-check",
            "title": "일정 관리",
            "url": "/schedule"
          },
          {
            "icon": "bi-gear",
            "title": "설정",
            "url": "/settings"
          }
        ]
      }
    },
    {
      "id": "summary-1",
      "type": "summary-statistics",
      "position": { "row": 1, "col": 0, "span": 1 },
      "config": {
        "title": "시스템 현황",
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
          "url": "/api/v1/statistics/summary",
          "refreshInterval": 60000
        }
      }
    },
    {
      "id": "activity-1",
      "type": "activity-list",
      "position": { "row": 1, "col": 1, "span": 2 },
      "config": {
        "title": "최근 활동",
        "maxItems": 5,
        "dataSource": {
          "type": "api",
          "url": "/api/v1/activities/recent"
        },
        "viewAllUrl": "/activities",
        "viewAllLabel": "전체보기"
      }
    },
    {
      "id": "quick-actions-1",
      "type": "quick-actions",
      "position": { "row": 2, "col": 0, "span": 3 },
      "config": {
        "title": "빠른 액션",
        "actions": [
          {
            "id": "profile",
            "label": "프로필",
            "icon": "bi-person-circle",
            "url": "/profile"
          },
          {
            "id": "schedule",
            "label": "스케줄",
            "icon": "bi-calendar",
            "url": "/schedule"
          },
          {
            "id": "settings",
            "label": "설정",
            "icon": "bi-gear",
            "url": "/settings"
          }
        ]
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

---

## 🏥 상담소 특화 위젯 예시

### 예시 2: 상담소 관리자 대시보드

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
        "title": "상담소 관리 시스템",
        "welcomeMessage": "{name}님, 오늘도 좋은 하루 되세요!"
      }
    },
    {
      "id": "consultation-summary-1",
      "type": "consultation-summary",
      "position": { "row": 1, "col": 0, "span": 2 },
      "visibility": {
        "roles": ["ADMIN", "CONSULTANT"]
      },
      "config": {
        "title": "상담 요약",
        "dataSource": {
          "type": "api",
          "url": "/api/v1/consultation/summary",
          "refreshInterval": 60000
        },
        "scheduleUrl": "/consultant/schedule",
        "mappingManagementUrl": "/admin/mapping-management"
      }
    },
    {
      "id": "consultation-schedule-1",
      "type": "consultation-schedule",
      "position": { "row": 1, "col": 2, "span": 1 },
      "visibility": {
        "roles": ["CONSULTANT", "ADMIN"]
      },
      "config": {
        "title": "오늘의 상담 일정",
        "maxItems": 10,
        "dataSource": {
          "type": "api",
          "url": "/api/v1/consultation/schedules/today"
        },
        "viewAllUrl": "/consultant/schedule"
      }
    },
    {
      "id": "consultation-stats-1",
      "type": "consultation-stats",
      "position": { "row": 2, "col": 0, "span": 3 },
      "visibility": {
        "roles": ["ADMIN"]
      },
      "config": {
        "title": "상담 통계",
        "dataSource": {
          "type": "api",
          "url": "/api/v1/consultation/stats"
        },
        "metrics": [
          {
            "key": "monthlyConsultations",
            "label": "이번 달 상담",
            "icon": "bi-calendar",
            "format": "number"
          },
          {
            "key": "averageRating",
            "label": "평균 평점",
            "icon": "bi-star",
            "format": "number"
          },
          {
            "key": "activeMappings",
            "label": "활성 매핑",
            "icon": "bi-link-45deg",
            "format": "number"
          }
        ]
      }
    }
  ]
}
```

---

## 🎓 학원 특화 위젯 예시 (향후 구현)

### 예시 3: 학원 관리자 대시보드

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
        "title": "학원 관리 시스템",
        "welcomeMessage": "{name}님, 환영합니다!"
      }
    },
    {
      "id": "academy-schedule-1",
      "type": "academy-schedule",
      "position": { "row": 1, "col": 0, "span": 2 },
      "config": {
        "title": "오늘의 수업 일정",
        "dataSource": {
          "type": "api",
          "url": "/api/v1/academy/schedules/today"
        }
      }
    },
    {
      "id": "academy-attendance-1",
      "type": "academy-attendance",
      "position": { "row": 1, "col": 2, "span": 1 },
      "config": {
        "title": "출석 현황",
        "dataSource": {
          "type": "api",
          "url": "/api/v1/academy/attendance/today"
        }
      }
    }
  ]
}
```

---

## 🔧 위젯 설정 상세 설명

### WelcomeWidget 설정

```json
{
  "id": "welcome-1",
  "type": "welcome",
  "config": {
    "title": "환영합니다",
    "welcomeMessage": "{name}님, 환영합니다!",  // {name}은 사용자 이름으로 치환
    "showTime": true,  // 현재 시간 표시 여부
    "profileImageUrl": "/custom-avatar.png",  // 커스텀 프로필 이미지 (선택)
    "defaultAvatar": "/default-avatar.svg",  // 기본 아바타 (선택)
    "quickCards": [  // 빠른 액션 카드
      {
        "icon": "bi-calendar-check",
        "title": "일정 관리",
        "description": "일정을 확인하고 관리하세요",
        "url": "/schedule"  // 또는 "onClick": "functionName"
      }
    ]
  }
}
```

### SummaryStatisticsWidget 설정

```json
{
  "id": "summary-1",
  "type": "summary-statistics",
  "config": {
    "title": "통계 요약",
    "statistics": [
      {
        "key": "totalUsers",  // 데이터에서 가져올 키
        "label": "총 사용자",
        "icon": "bi-people",
        "format": "number",  // number, currency, percentage
        "suffix": "명"  // 선택적 접미사
      }
    ],
    "dataSource": {
      "type": "api",  // "api" 또는 정적 데이터
      "url": "/api/v1/statistics/summary",
      "params": {},  // API 파라미터
      "refreshInterval": 60000  // 자동 새로고침 간격 (ms)
    },
    "viewMoreUrl": "/statistics"  // 선택적 "자세히 보기" 링크
  }
}
```

### ActivityListWidget 설정

```json
{
  "id": "activity-1",
  "type": "activity-list",
  "config": {
    "title": "최근 활동",
    "maxItems": 5,  // 최대 표시 항목 수
    "dataSource": {
      "type": "api",
      "url": "/api/v1/activities/recent",
      "refreshInterval": 30000
    },
    "iconMap": {  // 활동 타입별 아이콘 매핑 (선택)
      "profile": "bi-person-circle",
      "schedule": "bi-calendar-check",
      "payment": "bi-credit-card"
    },
    "viewAllUrl": "/activities",
    "viewAllLabel": "전체보기",
    "emptyMessage": "최근 활동이 없습니다"
  }
}
```

### QuickActionsWidget 설정

```json
{
  "id": "quick-actions-1",
  "type": "quick-actions",
  "config": {
    "title": "빠른 액션",
    "actions": [
      {
        "id": "profile",
        "label": "프로필",
        "icon": "bi-person-circle",  // Bootstrap Icons 클래스
        "url": "/profile",  // 또는 "onClick": "functionName"
        "tooltip": "프로필 보기",
        "roles": ["ADMIN", "USER"]  // 선택적: 특정 역할만 표시
      }
    ]
  }
}
```

### ConsultationSummaryWidget 설정

```json
{
  "id": "consultation-summary-1",
  "type": "consultation-summary",
  "visibility": {
    "roles": ["ADMIN", "CONSULTANT"]  // 특정 역할만 표시
  },
  "config": {
    "title": "상담 요약",
    "dataSource": {
      "type": "api",
      "url": "/api/v1/consultation/summary"
    },
    "scheduleUrl": "/consultant/schedule",
    "mappingManagementUrl": "/admin/mapping-management",
    "specialtyMap": {  // 전문 분야 한글 매핑 (선택)
      "DEPRESSION": "우울증",
      "ANXIETY": "불안장애"
    }
  }
}
```

---

## 📊 위젯 위치 및 크기 설정

### position 설정

```json
{
  "position": {
    "row": 0,  // 그리드 행 위치 (0부터 시작)
    "col": 0,  // 그리드 열 위치 (0부터 시작)
    "span": 1  // 차지할 열 수 (1 = 1열, 2 = 2열, 3 = 전체)
  }
}
```

### size 설정

```json
{
  "size": {
    "width": "100%",  // 또는 "300px", "auto"
    "height": "auto",  // 또는 "400px"
    "minWidth": "200px",
    "minHeight": "150px",
    "maxWidth": "100%",
    "maxHeight": "600px"
  }
}
```

---

## 🔍 위젯 가시성 제어

### 역할 기반 필터링

```json
{
  "visibility": {
    "roles": ["ADMIN", "CONSULTANT"]  // 이 역할만 위젯 표시
  }
}
```

### 조건 기반 필터링 (향후 구현)

```json
{
  "visibility": {
    "conditions": [
      {
        "field": "user.role",
        "operator": "equals",
        "value": "ADMIN"
      }
    ]
  }
}
```

---

## 🎨 테마 설정

```json
{
  "theme": {
    "mode": "light",  // "light" 또는 "dark"
    "primaryColor": "#007bff",
    "fontSize": "medium"  // "small", "medium", "large"
  }
}
```

---

## 🔄 자동 새로고침 설정

```json
{
  "refresh": {
    "enabled": true,
    "interval": 30000  // 30초마다 새로고침 (ms)
  }
}
```

---

## 📚 참고 문서

- [위젯 아키텍처](./WIDGET_ARCHITECTURE.md)
- [대시보드 설정 JSON 스키마](./META_SYSTEM_DASHBOARD_SCHEMA.md)



