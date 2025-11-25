# 대시보드 설정 JSON 스키마

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: `dashboard_config` JSON 필드의 표준 스키마 정의

---

## 📋 개요

`TenantDashboard.dashboardConfig` 필드는 JSON 형태로 대시보드의 레이아웃, 위젯 구성, 테마 등을 저장합니다. 이 문서는 표준 스키마를 정의하여 일관된 대시보드 설정을 보장합니다.

---

## 🏗️ 전체 스키마 구조

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
      "type": "statistics",
      "position": {
        "row": 0,
        "col": 0,
        "span": 1
      },
      "size": {
        "width": "auto",
        "height": "auto"
      },
      "cardStyle": {
        "style": "v2",
        "variant": "elevated",
        "padding": "md",
        "borderRadius": "md",
        "shadow": "md",
        "hoverEffect": true,
        "border": false,
        "borderColor": null,
        "backgroundColor": null,
        "glassEffect": false
      },
      "config": {},
      "visibility": {
        "conditions": [],
        "roles": []
      }
    }
  ],
  "theme": {
    "mode": "light",
    "primaryColor": "#007bff",
    "fontSize": "medium"
  },
  "cardLayout": {
    "defaultStyle": "v2",
    "defaultVariant": "elevated",
    "defaultPadding": "md",
    "defaultBorderRadius": "md",
    "hoverEffect": true,
    "shadow": "md"
  },
  "refresh": {
    "enabled": true,
    "interval": 30000
  },
  "permissions": {
    "editable": true,
    "removable": true
  }
}
```

---

## 📝 필드 상세 설명

### 루트 레벨 필드

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `version` | string | ✅ | "1.0" | 스키마 버전 |
| `layout` | object | ✅ | - | 레이아웃 설정 |
| `widgets` | array | ✅ | [] | 위젯 배열 |
| `theme` | object | ❌ | - | 테마 설정 |
| `refresh` | object | ❌ | - | 자동 새로고침 설정 |
| `permissions` | object | ❌ | - | 권한 설정 |

---

## 🎨 Layout 설정

### Layout 타입

```json
{
  "layout": {
    "type": "grid",
    "columns": 3,
    "gap": "md",
    "responsive": true
  }
}
```

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `type` | string | ✅ | "grid" | 레이아웃 타입: `grid`, `list`, `masonry`, `custom` |
| `columns` | integer | ❌ | 3 | 그리드 컬럼 수 (1-12) |
| `gap` | string | ❌ | "md" | 위젯 간격: `sm`, `md`, `lg`, `xl` |
| `responsive` | boolean | ❌ | true | 반응형 레이아웃 활성화 |

### Layout 타입별 설명

#### Grid Layout
```json
{
  "layout": {
    "type": "grid",
    "columns": 3,
    "gap": "md"
  }
}
```
- 고정 그리드 레이아웃
- 위젯을 균등한 그리드로 배치

#### List Layout
```json
{
  "layout": {
    "type": "list",
    "gap": "md"
  }
}
```
- 세로 목록 레이아웃
- 위젯을 세로로 순차 배치

#### Masonry Layout
```json
{
  "layout": {
    "type": "masonry",
    "columns": 3,
    "gap": "md"
  }
}
```
- 벽돌 쌓기 레이아웃
- 위젯 높이가 다를 때 최적 배치

#### Custom Layout
```json
{
  "layout": {
    "type": "custom",
    "css": "custom-dashboard-layout"
  }
}
```
- 커스텀 CSS 클래스 사용
- 완전한 커스터마이징 가능

---

## 🧩 Widget 설정

### Widget 기본 구조

```json
{
  "id": "widget-uuid",
  "type": "statistics",
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
    "conditions": [],
    "roles": []
  }
}
```

### Widget 필드

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | string | ✅ | - | 위젯 고유 ID (UUID 권장) |
| `type` | string | ✅ | - | 위젯 타입 (아래 위젯 타입 참조) |
| `position` | object | ✅ | - | 위젯 위치 |
| `size` | object | ❌ | - | 위젯 크기 |
| `config` | object | ✅ | {} | 위젯별 설정 |
| `visibility` | object | ❌ | - | 위젯 표시 조건 |

### Position 설정

```json
{
  "position": {
    "row": 0,
    "col": 0,
    "span": 1
  }
}
```

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `row` | integer | ✅ | 0 | 그리드 행 위치 (0부터 시작) |
| `col` | integer | ✅ | 0 | 그리드 열 위치 (0부터 시작) |
| `span` | integer | ❌ | 1 | 위젯이 차지할 컬럼 수 (1-12) |

### Size 설정

```json
{
  "size": {
    "width": "auto",
    "height": "auto",
    "minWidth": "200px",
    "minHeight": "150px",
    "maxWidth": "100%",
    "maxHeight": "500px"
  }
}
```

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `width` | string | ❌ | "auto" | 너비: `auto`, `100%`, `200px` 등 |
| `height` | string | ❌ | "auto" | 높이: `auto`, `100%`, `300px` 등 |
| `minWidth` | string | ❌ | - | 최소 너비 |
| `minHeight` | string | ❌ | - | 최소 높이 |
| `maxWidth` | string | ❌ | - | 최대 너비 |
| `maxHeight` | string | ❌ | - | 최대 높이 |

### CardStyle 설정 (동적 카드 레이아웃)

```json
{
  "cardStyle": {
    "style": "v2",
    "variant": "elevated",
    "padding": "md",
    "borderRadius": "md",
    "shadow": "md",
    "hoverEffect": true,
    "border": false,
    "borderColor": null,
    "backgroundColor": null,
    "glassEffect": false
  }
}
```

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `style` | string | ❌ | "v2" | 카드 스타일: `v2`, `glass`, `flat`, `bordered`, `minimal` |
| `variant` | string | ❌ | "elevated" | 카드 Variant: `elevated`, `outlined`, `filled`, `text` |
| `padding` | string | ❌ | "md" | 패딩 크기: `none`, `sm`, `md`, `lg`, `xl` |
| `borderRadius` | string | ❌ | "md" | 보더 반경: `none`, `sm`, `md`, `lg`, `full` |
| `shadow` | string | ❌ | "md" | 그림자 크기: `none`, `sm`, `md`, `lg`, `xl` |
| `hoverEffect` | boolean | ❌ | true | 호버 효과 활성화 |
| `border` | boolean | ❌ | false | 테두리 표시 |
| `borderColor` | string | ❌ | null | 테두리 색상 (CSS 색상 값) |
| `backgroundColor` | string | ❌ | null | 배경 색상 (CSS 색상 값) |
| `glassEffect` | boolean | ❌ | false | 글래스모피즘 효과 |

### CardLayout 설정 (대시보드 기본 카드 스타일)

```json
{
  "cardLayout": {
    "defaultStyle": "v2",
    "defaultVariant": "elevated",
    "defaultPadding": "md",
    "defaultBorderRadius": "md",
    "hoverEffect": true,
    "shadow": "md"
  }
}
```

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `defaultStyle` | string | ❌ | "v2" | 기본 카드 스타일 |
| `defaultVariant` | string | ❌ | "elevated" | 기본 카드 Variant |
| `defaultPadding` | string | ❌ | "md" | 기본 패딩 크기 |
| `defaultBorderRadius` | string | ❌ | "md" | 기본 보더 반경 |
| `hoverEffect` | boolean | ❌ | true | 기본 호버 효과 |
| `shadow` | string | ❌ | "md" | 기본 그림자 크기 |

### Visibility 설정

```json
{
  "visibility": {
    "conditions": [
      {
        "field": "user.role",
        "operator": "equals",
        "value": "ADMIN"
      }
    ],
    "roles": ["ADMIN", "MANAGER"]
  }
}
```

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `conditions` | array | ❌ | [] | 조건 배열 (모든 조건 만족 시 표시) |
| `roles` | array | ❌ | [] | 역할 배열 (해당 역할만 표시) |

---

## 📊 위젯 타입

### 1. Statistics Widget

통계 정보를 표시하는 위젯

```json
{
  "id": "widget-stats-1",
  "type": "statistics",
  "position": { "row": 0, "col": 0, "span": 1 },
  "config": {
    "title": "총 사용자",
    "value": 1234,
    "icon": "users",
    "color": "primary",
    "trend": {
      "enabled": true,
      "value": 5.2,
      "direction": "up"
    },
    "dataSource": {
      "type": "api",
      "url": "/api/v1/statistics/users",
      "method": "GET",
      "refreshInterval": 60000
    }
  }
}
```

**Config 필드:**
- `title` (string, 필수): 위젯 제목
- `value` (number/string, 선택): 표시할 값
- `icon` (string, 선택): 아이콘 이름
- `color` (string, 선택): 색상: `primary`, `success`, `warning`, `danger`, `info`
- `trend` (object, 선택): 추이 표시
- `dataSource` (object, 선택): 데이터 소스

### 2. Chart Widget

차트를 표시하는 위젯

```json
{
  "id": "widget-chart-1",
  "type": "chart",
  "position": { "row": 0, "col": 1, "span": 2 },
  "config": {
    "title": "월별 매출",
    "chartType": "line",
    "dataSource": {
      "type": "api",
      "url": "/api/v1/statistics/sales",
      "method": "GET"
    },
    "options": {
      "responsive": true,
      "maintainAspectRatio": false,
      "scales": {
        "y": {
          "beginAtZero": true
        }
      }
    }
  }
}
```

**Chart Types:**
- `line`: 선 그래프
- `bar`: 막대 그래프
- `pie`: 원형 그래프
- `doughnut`: 도넛 그래프
- `area`: 영역 그래프
- `scatter`: 산점도

### 3. Table Widget

테이블을 표시하는 위젯

```json
{
  "id": "widget-table-1",
  "type": "table",
  "position": { "row": 1, "col": 0, "span": 3 },
  "config": {
    "title": "최근 주문",
    "dataSource": {
      "type": "api",
      "url": "/api/v1/orders",
      "method": "GET"
    },
    "columns": [
      { "field": "id", "header": "ID", "width": "80px" },
      { "field": "customer", "header": "고객", "width": "150px" },
      { "field": "amount", "header": "금액", "width": "100px", "format": "currency" }
    ],
    "pagination": {
      "enabled": true,
      "pageSize": 10
    },
    "sorting": {
      "enabled": true,
      "defaultSort": "id",
      "defaultOrder": "desc"
    }
  }
}
```

### 4. Calendar Widget

캘린더를 표시하는 위젯

```json
{
  "id": "widget-calendar-1",
  "type": "calendar",
  "position": { "row": 0, "col": 2, "span": 1 },
  "config": {
    "title": "일정",
    "dataSource": {
      "type": "api",
      "url": "/api/v1/schedules",
      "method": "GET"
    },
    "view": "month",
    "events": {
      "enabled": true,
      "colorField": "type"
    }
  }
}
```

### 5. Form Widget

폼을 표시하는 위젯

```json
{
  "id": "widget-form-1",
  "type": "form",
  "position": { "row": 1, "col": 0, "span": 2 },
  "config": {
    "title": "빠른 작업",
    "fields": [
      {
        "name": "title",
        "type": "text",
        "label": "제목",
        "required": true
      },
      {
        "name": "description",
        "type": "textarea",
        "label": "설명"
      }
    ],
    "submit": {
      "url": "/api/v1/tasks",
      "method": "POST"
    }
  }
}
```

### 6. Custom Widget

커스텀 컴포넌트를 표시하는 위젯

```json
{
  "id": "widget-custom-1",
  "type": "custom",
  "position": { "row": 0, "col": 0, "span": 1 },
  "config": {
    "component": "CustomWidgetComponent",
    "props": {
      "customProp": "value"
    }
  }
}
```

---

## 🎨 Theme 설정

```json
{
  "theme": {
    "mode": "light",
    "primaryColor": "#007bff",
    "secondaryColor": "#6c757d",
    "fontSize": "medium",
    "fontFamily": "default"
  }
}
```

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `mode` | string | ❌ | "light" | 테마 모드: `light`, `dark`, `auto` |
| `primaryColor` | string | ❌ | "#007bff" | 주요 색상 (HEX) |
| `secondaryColor` | string | ❌ | "#6c757d" | 보조 색상 (HEX) |
| `fontSize` | string | ❌ | "medium" | 폰트 크기: `small`, `medium`, `large` |
| `fontFamily` | string | ❌ | "default" | 폰트 패밀리 |

---

## 🔄 Refresh 설정

```json
{
  "refresh": {
    "enabled": true,
    "interval": 30000,
    "widgets": ["widget-1", "widget-2"]
  }
}
```

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `enabled` | boolean | ❌ | false | 자동 새로고침 활성화 |
| `interval` | integer | ❌ | 30000 | 새로고침 간격 (밀리초) |
| `widgets` | array | ❌ | [] | 새로고침할 위젯 ID 배열 (비어있으면 전체) |

---

## 🔐 Permissions 설정

```json
{
  "permissions": {
    "editable": true,
    "removable": true,
    "resizable": true,
    "draggable": true
  }
}
```

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `editable` | boolean | ❌ | true | 위젯 편집 가능 여부 |
| `removable` | boolean | ❌ | true | 위젯 삭제 가능 여부 |
| `resizable` | boolean | ❌ | true | 위젯 크기 조절 가능 여부 |
| `draggable` | boolean | ❌ | true | 위젯 드래그 가능 여부 |

---

## 📋 완전한 예시

### 예시 1: 관리자 대시보드

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
      "id": "widget-stats-users",
      "type": "statistics",
      "position": { "row": 0, "col": 0, "span": 1 },
      "config": {
        "title": "총 사용자",
        "value": 1234,
        "icon": "users",
        "color": "primary",
        "dataSource": {
          "type": "api",
          "url": "/api/v1/statistics/users",
          "method": "GET"
        }
      }
    },
    {
      "id": "widget-stats-orders",
      "type": "statistics",
      "position": { "row": 0, "col": 1, "span": 1 },
      "config": {
        "title": "오늘 주문",
        "value": 56,
        "icon": "shopping-cart",
        "color": "success",
        "dataSource": {
          "type": "api",
          "url": "/api/v1/statistics/orders/today",
          "method": "GET"
        }
      }
    },
    {
      "id": "widget-chart-sales",
      "type": "chart",
      "position": { "row": 0, "col": 2, "span": 1 },
      "config": {
        "title": "월별 매출",
        "chartType": "line",
        "dataSource": {
          "type": "api",
          "url": "/api/v1/statistics/sales",
          "method": "GET"
        }
      }
    },
    {
      "id": "widget-table-recent",
      "type": "table",
      "position": { "row": 1, "col": 0, "span": 3 },
      "config": {
        "title": "최근 활동",
        "dataSource": {
          "type": "api",
          "url": "/api/v1/activities/recent",
          "method": "GET"
        },
        "columns": [
          { "field": "id", "header": "ID" },
          { "field": "user", "header": "사용자" },
          { "field": "action", "header": "작업" },
          { "field": "timestamp", "header": "시간" }
        ],
        "pagination": {
          "enabled": true,
          "pageSize": 10
        }
      }
    }
  ],
  "theme": {
    "mode": "light",
    "primaryColor": "#007bff"
  },
  "refresh": {
    "enabled": true,
    "interval": 60000
  }
}
```

### 예시 2: 학생 대시보드

```json
{
  "version": "1.0",
  "layout": {
    "type": "list",
    "gap": "md"
  },
  "widgets": [
    {
      "id": "widget-schedule",
      "type": "calendar",
      "position": { "row": 0, "col": 0, "span": 1 },
      "config": {
        "title": "내 일정",
        "dataSource": {
          "type": "api",
          "url": "/api/v1/schedules/my",
          "method": "GET"
        },
        "view": "month"
      }
    },
    {
      "id": "widget-grades",
      "type": "table",
      "position": { "row": 1, "col": 0, "span": 1 },
      "config": {
        "title": "성적",
        "dataSource": {
          "type": "api",
          "url": "/api/v1/grades/my",
          "method": "GET"
        },
        "columns": [
          { "field": "subject", "header": "과목" },
          { "field": "score", "header": "점수" },
          { "field": "grade", "header": "등급" }
        ]
      }
    }
  ],
  "theme": {
    "mode": "light"
  }
}
```

---

## ✅ 스키마 검증

### 필수 필드 검증

1. `version`: 반드시 존재해야 함
2. `layout`: 반드시 존재해야 함
3. `layout.type`: 반드시 존재해야 함
4. `widgets`: 반드시 배열이어야 함
5. 각 위젯의 `id`, `type`, `position`: 반드시 존재해야 함

### 타입 검증

- `version`: string
- `layout.columns`: integer (1-12)
- `widgets`: array
- `widgets[].position.row`: integer (>= 0)
- `widgets[].position.col`: integer (>= 0)
- `widgets[].position.span`: integer (1-12)

### 값 검증

- `layout.type`: `grid`, `list`, `masonry`, `custom` 중 하나
- `layout.gap`: `sm`, `md`, `lg`, `xl` 중 하나
- `theme.mode`: `light`, `dark`, `auto` 중 하나
- `refresh.interval`: 양수 (밀리초)

---

## 🔧 백엔드 검증 로직

백엔드에서 JSON 스키마 검증을 수행해야 합니다:

```java
// TenantDashboardServiceImpl.java
private void validateDashboardConfig(String dashboardConfig) {
    if (dashboardConfig == null || dashboardConfig.trim().isEmpty()) {
        return; // null 또는 빈 문자열은 허용 (기본 설정 사용)
    }
    
    try {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode config = mapper.readTree(dashboardConfig);
        
        // 필수 필드 검증
        if (!config.has("version")) {
            throw new IllegalArgumentException("dashboardConfig에 version 필드가 없습니다.");
        }
        
        if (!config.has("layout")) {
            throw new IllegalArgumentException("dashboardConfig에 layout 필드가 없습니다.");
        }
        
        // 위젯 검증
        if (config.has("widgets") && config.get("widgets").isArray()) {
            for (JsonNode widget : config.get("widgets")) {
                validateWidget(widget);
            }
        }
        
    } catch (JsonProcessingException e) {
        throw new IllegalArgumentException("dashboardConfig JSON 파싱 실패: " + e.getMessage());
    }
}

private void validateWidget(JsonNode widget) {
    if (!widget.has("id")) {
        throw new IllegalArgumentException("위젯에 id 필드가 없습니다.");
    }
    if (!widget.has("type")) {
        throw new IllegalArgumentException("위젯에 type 필드가 없습니다.");
    }
    if (!widget.has("position")) {
        throw new IllegalArgumentException("위젯에 position 필드가 없습니다.");
    }
}
```

---

## 📚 관련 문서

- [동적 대시보드 개발자 가이드](../2025-01/DYNAMIC_DASHBOARD_DEVELOPER_GUIDE.md)
- [테넌트 대시보드 관리 시스템](../TENANT_DASHBOARD_MANAGEMENT_SYSTEM.md)
- [메타 시스템 아키텍처](./META_SYSTEM_ARCHITECTURE.md)

---

**마지막 업데이트**: 2025-11-22

