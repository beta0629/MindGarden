# 상담소 특화 관리 위젯 목록

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: 상담소 특화 관리 기능 위젯화 완료 상태 문서

---

## 📋 개요

상담소 특화 관리 기능(매칭 관리, 회기 관리, 일정 등록 등)을 위젯으로 변환 완료했습니다. 이제 상담소 관리자 대시보드도 `dashboard_config` JSON으로 완전히 동적으로 구성할 수 있습니다.

---

## ✅ 완료된 상담소 특화 관리 위젯

### 관리 기능 위젯

| 기존 컴포넌트 | 위젯 타입 | 상태 |
|--------------|----------|------|
| `MappingManagement` | `mapping-management` | ✅ 완료 |
| `SessionManagement` | `session-management` | ✅ 완료 |
| (일정 등록) | `schedule-registration` | ✅ 완료 |
| (입금 확인 대기) | `pending-deposit` | ✅ 완료 |

---

## 📊 위젯 상세 설명

### 1. 매칭 관리 위젯 (`mapping-management`)

**기능:**
- 매칭 목록 조회 및 통계 표시
- 매칭 상태별 필터링 (활성, 대기, 종료)
- 매칭 상세 보기 및 생성

**설정 예시:**
```json
{
  "id": "mapping-1",
  "type": "mapping-management",
  "position": { "row": 0, "col": 0, "span": 2 },
  "config": {
    "title": "매칭 관리",
    "showStats": true,
    "maxItems": 5,
    "dataSource": {
      "type": "api",
      "url": "/api/admin/mappings",
      "refreshInterval": 60000
    },
    "mappingUrl": "/admin/mapping-management?mappingId={mappingId}",
    "viewAllUrl": "/admin/mapping-management",
    "createUrl": "/admin/mapping-management?action=create"
  },
  "visibility": {
    "roles": ["ADMIN", "BRANCH_ADMIN"]
  }
}
```

### 2. 회기 관리 위젯 (`session-management`)

**기능:**
- 회기 목록 조회 및 통계 표시
- 회기 추가 요청 알림
- 회기 상태별 필터링 (완료, 대기, 예정)

**설정 예시:**
```json
{
  "id": "session-1",
  "type": "session-management",
  "position": { "row": 0, "col": 2, "span": 1 },
  "config": {
    "title": "회기 관리",
    "showExtensionRequests": true,
    "maxItems": 5,
    "dataSource": {
      "type": "api",
      "url": "/api/admin/sessions",
      "refreshInterval": 60000
    },
    "sessionUrl": "/admin/sessions?sessionId={sessionId}",
    "viewAllUrl": "/admin/sessions",
    "addSessionUrl": "/admin/sessions?action=add"
  },
  "visibility": {
    "roles": ["ADMIN", "BRANCH_ADMIN"]
  }
}
```

### 3. 일정 등록 위젯 (`schedule-registration`)

**기능:**
- 일정 목록 조회 및 오늘의 통계
- 일정 등록 및 관리
- 지난 일정 자동 완료 처리

**설정 예시:**
```json
{
  "id": "schedule-1",
  "type": "schedule-registration",
  "position": { "row": 1, "col": 0, "span": 2 },
  "config": {
    "title": "일정 관리",
    "showTodayOnly": true,
    "showAutoComplete": true,
    "maxItems": 5,
    "dataSource": {
      "type": "api",
      "url": "/api/schedules/today",
      "refreshInterval": 60000
    },
    "scheduleUrl": "/admin/schedules?scheduleId={scheduleId}",
    "viewAllUrl": "/admin/schedules",
    "createUrl": "/admin/schedules?action=create"
  },
  "visibility": {
    "roles": ["ADMIN", "BRANCH_ADMIN", "CONSULTANT"]
  }
}
```

### 4. 입금 확인 대기 위젯 (`pending-deposit`)

**기능:**
- 입금 확인 대기 매칭 목록
- 대기 건수, 금액, 최장 대기 시간 통계
- 입금 확인 처리

**설정 예시:**
```json
{
  "id": "pending-deposit-1",
  "type": "pending-deposit",
  "position": { "row": 1, "col": 2, "span": 1 },
  "config": {
    "title": "입금 확인 대기",
    "showAlert": true,
    "showWhenEmpty": false,
    "maxItems": 5,
    "dataSource": {
      "type": "api",
      "url": "/api/admin/mappings/pending-deposit",
      "refreshInterval": 30000
    },
    "mappingUrl": "/admin/mapping-management?mappingId={mappingId}&action=deposit",
    "viewAllUrl": "/admin/mapping-management?filter=pending-deposit"
  },
  "visibility": {
    "roles": ["ADMIN", "BRANCH_ADMIN"],
    "permissions": ["MAPPING_VIEW"]
  }
}
```

---

## 🎯 전체 상담소 관리자 대시보드 구성 예시

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
      "id": "mapping-1",
      "type": "mapping-management",
      "position": { "row": 0, "col": 0, "span": 2 },
      "config": {
        "title": "매칭 관리",
        "showStats": true,
        "maxItems": 5
      },
      "visibility": {
        "roles": ["ADMIN", "BRANCH_ADMIN"]
      }
    },
    {
      "id": "pending-deposit-1",
      "type": "pending-deposit",
      "position": { "row": 0, "col": 2, "span": 1 },
      "config": {
        "title": "입금 확인 대기",
        "showAlert": true
      },
      "visibility": {
        "roles": ["ADMIN", "BRANCH_ADMIN"],
        "permissions": ["MAPPING_VIEW"]
      }
    },
    {
      "id": "session-1",
      "type": "session-management",
      "position": { "row": 1, "col": 0, "span": 1 },
      "config": {
        "title": "회기 관리",
        "showExtensionRequests": true
      },
      "visibility": {
        "roles": ["ADMIN", "BRANCH_ADMIN"]
      }
    },
    {
      "id": "schedule-1",
      "type": "schedule-registration",
      "position": { "row": 1, "col": 1, "span": 2 },
      "config": {
        "title": "일정 관리",
        "showTodayOnly": true,
        "showAutoComplete": true
      },
      "visibility": {
        "roles": ["ADMIN", "BRANCH_ADMIN", "CONSULTANT"]
      }
    }
  ]
}
```

---

## 🔄 컴포넌트 → 위젯 매핑 완료도

### 상담소 특화 관리 컴포넌트
- ✅ `MappingManagement` → `mapping-management`
- ✅ `SessionManagement` → `session-management`
- ✅ (일정 등록) → `schedule-registration`
- ✅ (입금 확인 대기) → `pending-deposit`

---

## 📝 위젯 등록 상태

모든 상담소 특화 관리 위젯이 `WidgetRegistry.js`에 등록되어 있으며, 업종별 필터링이 지원됩니다:

```javascript
// 상담소 특화 위젯
CONSULTATION_WIDGETS = {
  // ... 기존 위젯들 ...
  'mapping-management': MappingManagementWidget,
  'session-management': SessionManagementWidget,
  'schedule-registration': ScheduleRegistrationWidget,
  'pending-deposit': PendingDepositWidget
}
```

---

## ✅ 완료 체크리스트

- [x] 매칭 관리 위젯화
- [x] 회기 관리 위젯화
- [x] 일정 등록 위젯화
- [x] 입금 확인 대기 위젯화
- [x] 위젯 레지스트리 등록
- [x] 역할 기반 필터링 지원
- [x] API 데이터 소스 지원
- [x] 위젯 문서화

---

## 🚀 다음 단계

1. **위젯 스타일링 개선**: 각 위젯의 CSS 완성
2. **위젯 편집기**: 드래그 앤 드롭으로 관리자 대시보드 구성
3. **위젯 테스트**: 각 위젯의 동작 검증
4. **성능 최적화**: 위젯 렌더링 최적화
5. **권한 기반 필터링**: 위젯별 세부 권한 체크

---

## 📚 참고 문서

- [완전한 위젯 목록](./COMPLETE_WIDGET_LIST.md)
- [관리자 위젯 목록](./ADMIN_WIDGET_LIST.md)
- [위젯 아키텍처](./WIDGET_ARCHITECTURE.md)
- [위젯 사용 예시](./WIDGET_USAGE_EXAMPLES.md)
- [대시보드 설정 JSON 스키마](./META_SYSTEM_DASHBOARD_SCHEMA.md)

