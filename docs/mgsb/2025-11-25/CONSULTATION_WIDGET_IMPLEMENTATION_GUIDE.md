# 상담소 기본 기능 위젯 구현 가이드

상담소의 기본 기능(내담자/상담사 관리, 스케줄 등록, 회기 관리, 매칭 시스템)을 위젯 방식으로 구현하는 가이드입니다.

## 📋 목차
1. [구현 가능 여부](#구현-가능-여부)
2. [위젯 구성 전략](#위젯-구성-전략)
3. [각 기능별 위젯 구현](#각-기능별-위젯-구현)
4. [통합 대시보드 예제](#통합-대시보드-예제)

---

## 구현 가능 여부

✅ **완전히 구현 가능합니다!**

현재 시스템에는 다음이 이미 구축되어 있습니다:
- ✅ `FormWidget` - 등록/수정 폼 위젯
- ✅ `TableWidget` - 목록 조회/관리 위젯
- ✅ `MappingManagementWidget` - 매칭 관리 위젯
- ✅ `ScheduleRegistrationWidget` - 스케줄 등록 위젯
- ✅ 백엔드 API 엔드포인트 (`/api/admin/consultants`, `/api/admin/clients`, `/api/admin/mappings`, `/api/schedules`)

---

## 위젯 구성 전략

### 1. 기본 위젯 타입 활용

| 기능 | 위젯 타입 | 설명 |
|------|----------|------|
| 내담자 목록 | `table` | 내담자 조회 및 관리 |
| 내담자 등록 | `form` | 내담자 등록 폼 |
| 상담사 목록 | `table` | 상담사 조회 및 관리 |
| 상담사 등록 | `form` | 상담사 등록 폼 |
| 스케줄 등록 | `schedule-registration` | 스케줄 등록 및 관리 |
| 매칭 관리 | `mapping-management` | 상담사-내담자 매칭 |
| 회기 관리 | `table` 또는 `custom` | 회기 조회 및 관리 |

### 2. 위젯 Config 구조

모든 위젯은 `config`를 통해 설정됩니다:

```json
{
  "id": "widget-id",
  "type": "widget-type",
  "config": {
    "title": "위젯 제목",
    "dataSource": {
      "type": "api",
      "url": "/api/endpoint",
      "params": {}
    },
    "actions": {
      "create": { "url": "/api/endpoint", "method": "POST" },
      "update": { "url": "/api/endpoint/{id}", "method": "PUT" },
      "delete": { "url": "/api/endpoint/{id}", "method": "DELETE" }
    }
  }
}
```

---

## 각 기능별 위젯 구현

### 1. 내담자 관리 위젯

#### 1.1 내담자 목록 위젯 (TableWidget)

```json
{
  "id": "widget-client-list",
  "type": "table",
  "config": {
    "title": "내담자 관리",
    "dataSource": {
      "type": "api",
      "url": "/api/admin/clients",
      "params": {
        "page": 0,
        "size": 10
      },
      "refreshInterval": 60000
    },
    "columns": [
      {
        "key": "id",
        "label": "ID",
        "sortable": true
      },
      {
        "key": "name",
        "label": "이름",
        "editable": true
      },
      {
        "key": "email",
        "label": "이메일",
        "editable": true
      },
      {
        "key": "phone",
        "label": "전화번호",
        "editable": true
      },
      {
        "key": "createdAt",
        "label": "등록일",
        "format": "date"
      }
    ],
    "pagination": {
      "enabled": true,
      "pageSize": 10
    },
    "actions": {
      "create": {
        "url": "/api/admin/clients",
        "method": "POST",
        "modal": true
      },
      "update": {
        "url": "/api/admin/clients/{id}",
        "method": "PUT",
        "modal": true
      },
      "delete": {
        "url": "/api/admin/clients/{id}",
        "method": "DELETE",
        "confirm": true
      }
    },
    "showCreateButton": true,
    "showEditButton": true,
    "showDeleteButton": true
  }
}
```

#### 1.2 내담자 등록 위젯 (FormWidget)

```json
{
  "id": "widget-client-register",
  "type": "form",
  "config": {
    "title": "내담자 등록",
    "fields": [
      {
        "name": "name",
        "type": "text",
        "label": "이름",
        "required": true
      },
      {
        "name": "email",
        "type": "email",
        "label": "이메일",
        "required": true
      },
      {
        "name": "phone",
        "type": "text",
        "label": "전화번호",
        "required": true
      },
      {
        "name": "username",
        "type": "text",
        "label": "아이디",
        "required": true
      },
      {
        "name": "password",
        "type": "password",
        "label": "비밀번호",
        "required": true
      },
      {
        "name": "branchCode",
        "type": "select",
        "label": "지점",
        "required": true,
        "options": [
          { "value": "BRANCH01", "label": "본점" },
          { "value": "BRANCH02", "label": "강남점" }
        ]
      }
    ],
    "submit": {
      "url": "/api/admin/clients",
      "method": "POST",
      "onSuccess": {
        "refreshWidgets": ["widget-client-list"],
        "showMessage": "내담자가 등록되었습니다."
      }
    }
  }
}
```

### 2. 상담사 관리 위젯

#### 2.1 상담사 목록 위젯 (TableWidget)

```json
{
  "id": "widget-consultant-list",
  "type": "table",
  "config": {
    "title": "상담사 관리",
    "dataSource": {
      "type": "api",
      "url": "/api/admin/consultants",
      "params": {
        "page": 0,
        "size": 10
      }
    },
    "columns": [
      {
        "key": "id",
        "label": "ID"
      },
      {
        "key": "name",
        "label": "이름",
        "editable": true
      },
      {
        "key": "email",
        "label": "이메일",
        "editable": true
      },
      {
        "key": "phone",
        "label": "전화번호",
        "editable": true
      },
      {
        "key": "specialty",
        "label": "전문분야",
        "editable": true
      },
      {
        "key": "grade",
        "label": "등급",
        "editable": true
      }
    ],
    "actions": {
      "create": {
        "url": "/api/admin/consultants",
        "method": "POST"
      },
      "update": {
        "url": "/api/admin/consultants/{id}",
        "method": "PUT"
      },
      "delete": {
        "url": "/api/admin/consultants/{id}",
        "method": "DELETE"
      }
    }
  }
}
```

#### 2.2 상담사 등록 위젯 (FormWidget)

```json
{
  "id": "widget-consultant-register",
  "type": "form",
  "config": {
    "title": "상담사 등록",
    "fields": [
      {
        "name": "name",
        "type": "text",
        "label": "이름",
        "required": true
      },
      {
        "name": "email",
        "type": "email",
        "label": "이메일",
        "required": true
      },
      {
        "name": "phone",
        "type": "text",
        "label": "전화번호",
        "required": true
      },
      {
        "name": "username",
        "type": "text",
        "label": "아이디",
        "required": true
      },
      {
        "name": "password",
        "type": "password",
        "label": "비밀번호",
        "required": true
      },
      {
        "name": "specialty",
        "type": "select",
        "label": "전문분야",
        "required": true,
        "options": [
          { "value": "COUNSELING", "label": "상담" },
          { "value": "PSYCHOLOGY", "label": "심리" }
        ]
      },
      {
        "name": "branchCode",
        "type": "select",
        "label": "지점",
        "required": true
      }
    ],
    "submit": {
      "url": "/api/admin/consultants",
      "method": "POST",
      "onSuccess": {
        "refreshWidgets": ["widget-consultant-list"]
      }
    }
  }
}
```

### 3. 스케줄 등록 위젯

#### 3.1 스케줄 등록 위젯 (ScheduleRegistrationWidget)

```json
{
  "id": "widget-schedule-registration",
  "type": "schedule-registration",
  "config": {
    "title": "일정 등록",
    "dataSource": {
      "type": "api",
      "url": "/api/schedules",
      "params": {
        "date": "${today}",
        "userId": "${user.id}"
      },
      "refreshInterval": 30000
    },
    "maxItems": 10,
    "showTodayOnly": true,
    "actions": {
      "create": {
        "url": "/api/schedules/consultant",
        "method": "POST",
        "onSuccess": {
          "refreshWidgets": ["widget-schedule-registration", "widget-consultation-summary"],
          "notifyErp": true
        }
      },
      "update": {
        "url": "/api/schedules/{id}",
        "method": "PUT"
      },
      "cancel": {
        "url": "/api/schedules/{id}/cancel",
        "method": "POST"
      }
    }
  }
}
```

### 4. 매칭 관리 위젯

#### 4.1 매칭 관리 위젯 (MappingManagementWidget)

```json
{
  "id": "widget-mapping-management",
  "type": "mapping-management",
  "config": {
    "title": "상담사-내담자 매칭",
    "dataSource": {
      "type": "api",
      "url": "/api/admin/mappings",
      "params": {
        "status": "ACTIVE"
      },
      "refreshInterval": 60000
    },
    "maxItems": 10,
    "showStats": true,
    "actions": {
      "create": {
        "url": "/api/admin/mappings",
        "method": "POST",
        "modal": true
      },
      "update": {
        "url": "/api/admin/mappings/{id}",
        "method": "PUT",
        "modal": true
      },
      "delete": {
        "url": "/api/admin/mappings/{id}",
        "method": "DELETE",
        "confirm": true
      }
    },
    "mappingUrl": "/admin/mapping-management?mappingId={mappingId}",
    "viewAllUrl": "/admin/mapping-management",
    "createUrl": "/admin/mapping-management?action=create"
  }
}
```

### 5. 회기 관리 위젯

#### 5.1 회기 관리 위젯 (TableWidget 또는 CustomWidget)

```json
{
  "id": "widget-session-management",
  "type": "table",
  "config": {
    "title": "회기 관리",
    "dataSource": {
      "type": "api",
      "url": "/api/admin/mappings/{mappingId}/sessions",
      "params": {
        "mappingId": "${selectedMappingId}"
      }
    },
    "columns": [
      {
        "key": "sessionNumber",
        "label": "회기"
      },
      {
        "key": "scheduleDate",
        "label": "일정",
        "format": "date"
      },
      {
        "key": "status",
        "label": "상태"
      },
      {
        "key": "consultationType",
        "label": "상담 유형"
      },
      {
        "key": "notes",
        "label": "비고"
      }
    ],
    "actions": {
      "create": {
        "url": "/api/admin/mappings/{mappingId}/sessions",
        "method": "POST"
      },
      "update": {
        "url": "/api/admin/sessions/{id}",
        "method": "PUT"
      },
      "delete": {
        "url": "/api/admin/sessions/{id}",
        "method": "DELETE"
      }
    }
  }
}
```

또는 기존 `SessionManagementWidget` 활용:

```json
{
  "id": "widget-session-management",
  "type": "session-management",
  "config": {
    "title": "회기 관리",
    "dataSource": {
      "type": "api",
      "url": "/api/admin/session-extensions/requests",
      "params": {}
    },
    "maxItems": 10
  }
}
```

---

## 통합 대시보드 예제

### 관리자 대시보드 Config

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
      "id": "widget-client-list",
      "type": "table",
      "position": { "row": 0, "col": 0, "span": 2 },
      "config": {
        "title": "내담자 관리",
        "dataSource": {
          "type": "api",
          "url": "/api/admin/clients"
        },
        "columns": [
          { "key": "name", "label": "이름" },
          { "key": "email", "label": "이메일" },
          { "key": "phone", "label": "전화번호" }
        ],
        "actions": {
          "create": { "url": "/api/admin/clients", "method": "POST" },
          "update": { "url": "/api/admin/clients/{id}", "method": "PUT" },
          "delete": { "url": "/api/admin/clients/{id}", "method": "DELETE" }
        }
      }
    },
    {
      "id": "widget-client-register",
      "type": "form",
      "position": { "row": 0, "col": 2, "span": 1 },
      "config": {
        "title": "내담자 등록",
        "fields": [
          { "name": "name", "type": "text", "label": "이름", "required": true },
          { "name": "email", "type": "email", "label": "이메일", "required": true },
          { "name": "phone", "type": "text", "label": "전화번호", "required": true }
        ],
        "submit": {
          "url": "/api/admin/clients",
          "method": "POST"
        }
      }
    },
    {
      "id": "widget-consultant-list",
      "type": "table",
      "position": { "row": 1, "col": 0, "span": 2 },
      "config": {
        "title": "상담사 관리",
        "dataSource": {
          "type": "api",
          "url": "/api/admin/consultants"
        },
        "columns": [
          { "key": "name", "label": "이름" },
          { "key": "email", "label": "이메일" },
          { "key": "specialty", "label": "전문분야" }
        ],
        "actions": {
          "create": { "url": "/api/admin/consultants", "method": "POST" },
          "update": { "url": "/api/admin/consultants/{id}", "method": "PUT" },
          "delete": { "url": "/api/admin/consultants/{id}", "method": "DELETE" }
        }
      }
    },
    {
      "id": "widget-consultant-register",
      "type": "form",
      "position": { "row": 1, "col": 2, "span": 1 },
      "config": {
        "title": "상담사 등록",
        "fields": [
          { "name": "name", "type": "text", "label": "이름", "required": true },
          { "name": "email", "type": "email", "label": "이메일", "required": true },
          { "name": "specialty", "type": "select", "label": "전문분야", "required": true }
        ],
        "submit": {
          "url": "/api/admin/consultants",
          "method": "POST"
        }
      }
    },
    {
      "id": "widget-mapping-management",
      "type": "mapping-management",
      "position": { "row": 2, "col": 0, "span": 3 },
      "config": {
        "title": "상담사-내담자 매칭",
        "dataSource": {
          "type": "api",
          "url": "/api/admin/mappings"
        },
        "showStats": true,
        "actions": {
          "create": { "url": "/api/admin/mappings", "method": "POST" },
          "update": { "url": "/api/admin/mappings/{id}", "method": "PUT" },
          "delete": { "url": "/api/admin/mappings/{id}", "method": "DELETE" }
        }
      }
    },
    {
      "id": "widget-schedule-registration",
      "type": "schedule-registration",
      "position": { "row": 3, "col": 0, "span": 2 },
      "config": {
        "title": "일정 등록",
        "dataSource": {
          "type": "api",
          "url": "/api/schedules",
          "params": { "date": "${today}" }
        },
        "actions": {
          "create": {
            "url": "/api/schedules/consultant",
            "method": "POST",
            "onSuccess": {
              "refreshWidgets": ["widget-schedule-registration", "widget-consultation-summary"],
              "notifyErp": true
            }
          }
        }
      }
    },
    {
      "id": "widget-session-management",
      "type": "session-management",
      "position": { "row": 3, "col": 2, "span": 1 },
      "config": {
        "title": "회기 관리",
        "dataSource": {
          "type": "api",
          "url": "/api/admin/session-extensions/requests"
        }
      }
    }
  ]
}
```

---

## 백엔드 API 엔드포인트

### 내담자 관리
- `GET /api/admin/clients` - 내담자 목록 조회
- `POST /api/admin/clients` - 내담자 등록
- `PUT /api/admin/clients/{id}` - 내담자 수정
- `DELETE /api/admin/clients/{id}` - 내담자 삭제

### 상담사 관리
- `GET /api/admin/consultants` - 상담사 목록 조회
- `POST /api/admin/consultants` - 상담사 등록
- `PUT /api/admin/consultants/{id}` - 상담사 수정
- `DELETE /api/admin/consultants/{id}` - 상담사 삭제

### 매칭 관리
- `GET /api/admin/mappings` - 매칭 목록 조회
- `POST /api/admin/mappings` - 매칭 생성
- `PUT /api/admin/mappings/{id}` - 매칭 수정
- `DELETE /api/admin/mappings/{id}` - 매칭 삭제

### 스케줄 관리
- `GET /api/schedules` - 스케줄 목록 조회
- `POST /api/schedules/consultant` - 스케줄 등록
- `PUT /api/schedules/{id}` - 스케줄 수정
- `DELETE /api/schedules/{id}` - 스케줄 삭제

### 회기 관리
- `GET /api/admin/mappings/{mappingId}/sessions` - 회기 목록 조회
- `POST /api/admin/mappings/{mappingId}/sessions` - 회기 등록
- `PUT /api/admin/sessions/{id}` - 회기 수정
- `DELETE /api/admin/sessions/{id}` - 회기 삭제

---

## 구현 단계

### Phase 1: 기본 위젯 구성 (1주)
1. 내담자 목록/등록 위젯
2. 상담사 목록/등록 위젯
3. 기본 테이블/폼 위젯 CRUD 기능 강화

### Phase 2: 매칭 및 스케줄 위젯 (1주)
1. 매칭 관리 위젯 완성
2. 스케줄 등록 위젯 완성
3. 위젯 간 연동 (매칭 → 스케줄)

### Phase 3: 회기 관리 위젯 (1주)
1. 회기 관리 위젯 구현
2. 회기 자동 차감 기능
3. 회기 연장 요청 위젯

### Phase 4: 통합 및 최적화 (1주)
1. 대시보드 통합
2. 위젯 간 데이터 동기화
3. 성능 최적화

---

## 요약

✅ **모든 상담소 기본 기능이 위젯 방식으로 구현 가능합니다!**

1. **내담자 관리**: `table` + `form` 위젯
2. **상담사 관리**: `table` + `form` 위젯
3. **스케줄 등록**: `schedule-registration` 위젯
4. **회기 관리**: `table` 또는 `session-management` 위젯
5. **매칭 시스템**: `mapping-management` 위젯

모든 기능은 기존 백엔드 API를 활용하며, 위젯 Config만으로 구성 가능합니다.


