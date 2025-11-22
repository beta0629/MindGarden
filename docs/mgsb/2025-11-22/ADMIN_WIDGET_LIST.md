# 관리자 위젯 목록

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: AdminDashboard의 모든 컴포넌트 위젯화 완료 상태 문서

---

## 📋 개요

AdminDashboard에서 사용하던 모든 관리 컴포넌트를 위젯으로 변환 완료했습니다. 이제 관리자 대시보드도 `dashboard_config` JSON으로 완전히 동적으로 구성할 수 있습니다.

---

## ✅ 완료된 관리자 위젯 변환

### 관리자용 위젯 (관리자 역할에서만 사용)

| 기존 컴포넌트 | 위젯 타입 | 상태 |
|--------------|----------|------|
| `SystemStatus` | `system-status` | ✅ 완료 |
| `SystemTools` | `system-tools` | ✅ 완료 |
| `PermissionManagement` | `permission` | ✅ 완료 |
| `StatCard` 그룹 | `statistics-grid` | ✅ 완료 |
| 관리 기능 카드 그리드 | `management-grid` | ✅ 완료 |
| `ConsultantRatingStatistics` | `rating` (mode: 'display') | ✅ 완료 (기존 위젯 활용) |
| `StatisticsDashboard` | `statistics` + `chart` | ✅ 완료 (기존 위젯 활용) |

---

## 📊 관리자 위젯 분류

### 1. 시스템 관리 위젯
- `system-status` - 시스템 상태 모니터링
- `system-tools` - 시스템 관리 도구

### 2. 권한 관리 위젯
- `permission` - 권한 목록 및 관리

### 3. 통계 위젯
- `statistics-grid` - 통계 카드 그리드
- `statistics` - 단일 통계 카드
- `chart` - 차트 위젯

### 4. 관리 기능 위젯
- `management-grid` - 관리 기능 카드 그리드
- `quick-actions` - 빠른 액션 (기존 위젯 활용)

---

## 🎯 관리자 위젯 사용 예시

### 전체 관리자 대시보드 구성 예시

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
      "id": "stats-1",
      "type": "statistics-grid",
      "position": { "row": 0, "col": 0, "span": 3 },
      "config": {
        "title": "시스템 개요",
        "columns": 4,
        "statistics": [
          {
            "id": "total-users",
            "label": "총 사용자",
            "value": 0,
            "icon": "bi-people",
            "format": "number"
          },
          {
            "id": "total-consultants",
            "label": "상담사",
            "value": 0,
            "icon": "bi-person-badge",
            "format": "number"
          },
          {
            "id": "total-clients",
            "label": "내담자",
            "value": 0,
            "icon": "bi-people",
            "format": "number"
          },
          {
            "id": "active-mappings",
            "label": "활성 매칭",
            "value": 0,
            "icon": "bi-link",
            "format": "number"
          }
        ],
        "dataSource": {
          "type": "api",
          "url": "/api/admin/statistics/summary",
          "refreshInterval": 60000
        }
      },
      "visibility": {
        "roles": ["ADMIN", "BRANCH_ADMIN", "HQ_ADMIN"]
      }
    },
    {
      "id": "system-status-1",
      "type": "system-status",
      "position": { "row": 1, "col": 0, "span": 1 },
      "config": {
        "title": "시스템 상태",
        "autoRefresh": true,
        "refreshInterval": 60000,
        "dataSource": {
          "type": "api",
          "url": "/api/health/status"
        }
      },
      "visibility": {
        "roles": ["ADMIN", "HQ_ADMIN"]
      }
    },
    {
      "id": "system-tools-1",
      "type": "system-tools",
      "position": { "row": 1, "col": 1, "span": 1 },
      "config": {
        "title": "시스템 도구",
        "tools": [
          {
            "id": "refresh",
            "label": "새로고침",
            "icon": "bi-arrow-clockwise",
            "variant": "secondary",
            "action": { "type": "refresh" },
            "description": "통계 데이터를 새로고침합니다"
          },
          {
            "id": "logs",
            "label": "로그 보기",
            "icon": "bi-file-text",
            "variant": "warning",
            "action": { "type": "navigate", "url": "/admin/logs" },
            "description": "시스템 로그를 확인합니다"
          },
          {
            "id": "cache",
            "label": "캐시 초기화",
            "icon": "bi-trash",
            "variant": "danger",
            "action": { 
              "type": "api", 
              "url": "/api/admin/cache/clear", 
              "method": "POST" 
            },
            "description": "시스템 캐시를 초기화합니다"
          },
          {
            "id": "backup",
            "label": "백업 생성",
            "icon": "bi-download",
            "variant": "success",
            "action": { 
              "type": "api", 
              "url": "/api/admin/backup/create", 
              "method": "POST" 
            },
            "description": "데이터베이스 백업을 생성합니다"
          }
        ]
      },
      "visibility": {
        "roles": ["ADMIN", "HQ_ADMIN"]
      }
    },
    {
      "id": "management-1",
      "type": "management-grid",
      "position": { "row": 1, "col": 2, "span": 1 },
      "config": {
        "title": "관리 기능",
        "subtitle": "시스템 관리 및 설정 기능",
        "columns": 1,
        "items": [
          {
            "id": "schedules",
            "label": "스케줄 관리",
            "icon": "bi-calendar",
            "description": "상담 일정을 관리하고 조정합니다",
            "url": "/admin/schedules"
          },
          {
            "id": "consultants",
            "label": "상담사 관리",
            "icon": "bi-person-badge",
            "description": "상담사 정보를 관리합니다",
            "url": "/admin/consultant-comprehensive"
          },
          {
            "id": "clients",
            "label": "내담자 관리",
            "icon": "bi-people",
            "description": "내담자 정보를 관리합니다",
            "url": "/admin/client-comprehensive"
          }
        ]
      },
      "visibility": {
        "roles": ["ADMIN", "BRANCH_ADMIN"]
      }
    },
    {
      "id": "permission-1",
      "type": "permission",
      "position": { "row": 2, "col": 0, "span": 2 },
      "config": {
        "title": "권한 관리",
        "showCategories": true,
        "dataSource": {
          "type": "api",
          "url": "/api/admin/permissions"
        }
      },
      "visibility": {
        "roles": ["ADMIN", "HQ_ADMIN"]
      }
    }
  ]
}
```

---

## 🔄 컴포넌트 → 위젯 매핑 완료도

### AdminDashboard 컴포넌트
- ✅ `SystemStatus` → `system-status`
- ✅ `SystemTools` → `system-tools`
- ✅ `PermissionManagement` → `permission`
- ✅ `StatCard` 그룹 → `statistics-grid`
- ✅ 관리 기능 카드 그리드 → `management-grid`
- ✅ `ConsultantRatingStatistics` → `rating` (기존 위젯 활용)
- ✅ `StatisticsDashboard` → `statistics` + `chart` (기존 위젯 활용)
- ✅ `DashboardSection` → 위젯 컨테이너로 활용

---

## 📝 위젯 등록 상태

모든 관리자 위젯이 `WidgetRegistry.js`에 등록되어 있으며, 역할 기반 필터링이 지원됩니다:

```javascript
// 공통 위젯에 관리자 위젯 포함
COMMON_WIDGETS = {
  // ... 기존 위젯들 ...
  'system-status': SystemStatusWidget,
  'system-tools': SystemToolsWidget,
  'permission': PermissionWidget,
  'statistics-grid': StatisticsGridWidget,
  'management-grid': ManagementGridWidget
}
```

---

## 🎨 위젯 스타일링

모든 관리자 위젯은 공통 CSS 클래스를 사용합니다:
- `.widget` - 기본 위젯 컨테이너
- `.widget-header` - 위젯 헤더
- `.widget-body` - 위젯 본문
- `.widget-title` - 위젯 제목
- `.management-grid` - 관리 기능 그리드
- `.statistics-grid` - 통계 그리드

---

## ✅ 완료 체크리스트

- [x] SystemStatus 위젯화
- [x] SystemTools 위젯화
- [x] PermissionManagement 위젯화
- [x] StatCard 그룹 위젯화
- [x] 관리 기능 카드 그리드 위젯화
- [x] 위젯 레지스트리 등록
- [x] 역할 기반 필터링 지원
- [x] API 데이터 소스 지원
- [x] 위젯 문서화

---

## 🚀 다음 단계

1. **위젯 스타일링 개선**: 각 관리자 위젯의 CSS 완성
2. **위젯 편집기**: 드래그 앤 드롭으로 관리자 대시보드 구성
3. **위젯 테스트**: 각 위젯의 동작 검증
4. **성능 최적화**: 위젯 렌더링 최적화
5. **권한 기반 필터링**: 위젯별 세부 권한 체크

---

## 📚 참고 문서

- [완전한 위젯 목록](./COMPLETE_WIDGET_LIST.md)
- [위젯 아키텍처](./WIDGET_ARCHITECTURE.md)
- [위젯 사용 예시](./WIDGET_USAGE_EXAMPLES.md)
- [대시보드 설정 JSON 스키마](./META_SYSTEM_DASHBOARD_SCHEMA.md)



