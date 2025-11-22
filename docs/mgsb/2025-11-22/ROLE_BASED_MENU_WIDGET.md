# 역할별 메뉴 위젯 가이드

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: 역할별 동적 메뉴를 위젯으로 구성하는 방법

---

## 📋 개요

`NavigationMenuWidget`은 역할별로 다른 메뉴 구조를 동적으로 표시하는 위젯입니다. `dashboard_config` JSON을 통해 메뉴 구조를 정의하고, 역할과 권한에 따라 자동으로 필터링됩니다.

---

## 🎯 사용 목적

1. **역할별 메뉴 분리**: 각 역할(ADMIN, CONSULTANT, CLIENT 등)에 맞는 메뉴 표시
2. **동적 메뉴 구성**: DB 설정으로 메뉴 구조 변경 가능
3. **권한 기반 필터링**: 메뉴 접근 권한에 따라 자동 필터링
4. **재사용성**: 모든 업종에서 사용 가능한 공통 위젯

---

## 📝 dashboard_config JSON 예시

### 예시 1: 관리자 메뉴

```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 3
  },
  "widgets": [
    {
      "id": "admin-menu-1",
      "type": "navigation-menu",
      "position": { "row": 0, "col": 0, "span": 1 },
      "config": {
        "title": "관리 메뉴",
        "style": "sidebar",
        "showIcons": true,
        "menuItems": [
          {
            "id": "dashboard",
            "label": "대시보드",
            "icon": "bi-speedometer2",
            "path": "/admin/dashboard",
            "roles": ["ADMIN", "BRANCH_MANAGER"]
          },
          {
            "id": "user-management",
            "label": "사용자 관리",
            "icon": "bi-people",
            "path": "/admin/users",
            "roles": ["ADMIN"],
            "permission": "USER_MANAGEMENT"
          },
          {
            "id": "consultant-management",
            "label": "상담사 관리",
            "icon": "bi-person-badge",
            "path": "/admin/consultants",
            "roles": ["ADMIN", "BRANCH_MANAGER"],
            "children": [
              {
                "id": "consultant-list",
                "label": "상담사 목록",
                "icon": "bi-list",
                "path": "/admin/consultants",
                "roles": ["ADMIN", "BRANCH_MANAGER"]
              },
              {
                "id": "consultant-approval",
                "label": "상담사 승인",
                "icon": "bi-check-circle",
                "path": "/admin/consultants/approval",
                "roles": ["ADMIN"],
                "badge": "3"
              }
            ]
          },
          {
            "id": "mapping-management",
            "label": "매핑 관리",
            "icon": "bi-link-45deg",
            "path": "/admin/mapping-management",
            "roles": ["ADMIN"],
            "permission": "MAPPING_MANAGEMENT"
          },
          {
            "id": "statistics",
            "label": "통계",
            "icon": "bi-graph-up",
            "path": "/admin/statistics",
            "roles": ["ADMIN", "BRANCH_MANAGER"]
          }
        ]
      }
    }
  ]
}
```

### 예시 2: 상담사 메뉴

```json
{
  "widgets": [
    {
      "id": "consultant-menu-1",
      "type": "navigation-menu",
      "position": { "row": 0, "col": 0, "span": 1 },
      "config": {
        "title": "상담사 메뉴",
        "style": "vertical",
        "menuItems": [
          {
            "id": "schedule",
            "label": "일정 관리",
            "icon": "bi-calendar",
            "path": "/consultant/schedule",
            "roles": ["CONSULTANT"]
          },
          {
            "id": "clients",
            "label": "내담자 관리",
            "icon": "bi-people",
            "path": "/consultant/clients",
            "roles": ["CONSULTANT"]
          },
          {
            "id": "sessions",
            "label": "상담 세션",
            "icon": "bi-chat-dots",
            "path": "/consultant/sessions",
            "roles": ["CONSULTANT"]
          },
          {
            "id": "reports",
            "label": "상담 리포트",
            "icon": "bi-file-text",
            "path": "/consultant/reports",
            "roles": ["CONSULTANT"]
          }
        ]
      }
    }
  ]
}
```

### 예시 3: 내담자 메뉴

```json
{
  "widgets": [
    {
      "id": "client-menu-1",
      "type": "navigation-menu",
      "position": { "row": 0, "col": 0, "span": 1 },
      "config": {
        "title": "내담자 메뉴",
        "style": "vertical",
        "menuItems": [
          {
            "id": "my-sessions",
            "label": "내 상담",
            "icon": "bi-calendar-check",
            "path": "/client/sessions",
            "roles": ["CLIENT"]
          },
          {
            "id": "messages",
            "label": "메시지",
            "icon": "bi-chat",
            "path": "/client/messages",
            "roles": ["CLIENT"],
            "badge": "5"
          },
          {
            "id": "mindfulness",
            "label": "마음건강 가이드",
            "icon": "bi-heart",
            "path": "/client/mindfulness-guide",
            "roles": ["CLIENT"]
          }
        ]
      }
    }
  ]
}
```

---

## 🔧 메뉴 항목 설정

### 기본 속성

```json
{
  "id": "unique-menu-id",           // 고유 ID (필수)
  "label": "메뉴 이름",              // 표시될 텍스트 (필수)
  "icon": "bi-icon-name",           // Bootstrap Icons 클래스 (선택)
  "path": "/path/to/page",         // 라우트 경로 (선택)
  "roles": ["ADMIN", "USER"],       // 접근 가능한 역할 배열 (선택)
  "permission": "PERMISSION_CODE",  // 권한 코드 (선택)
  "menuGroup": "MENU_GROUP_CODE",   // 메뉴 그룹 코드 (선택)
  "badge": "3",                     // 배지 텍스트 (선택)
  "children": []                    // 하위 메뉴 배열 (선택)
}
```

### 역할 필터링

```json
{
  "roles": ["ADMIN", "BRANCH_MANAGER"]
}
```

- 지정된 역할만 해당 메뉴를 볼 수 있습니다.
- `roles`가 없으면 모든 역할에서 표시됩니다.

### 권한 필터링

```json
{
  "permission": "USER_MANAGEMENT"
}
```

또는

```json
{
  "menuGroup": "ADMIN_MENU"
}
```

- `hasMenuAccess()` 함수를 통해 권한을 확인합니다.
- 권한이 없으면 메뉴가 자동으로 숨겨집니다.

### 하위 메뉴 (드롭다운)

```json
{
  "id": "parent-menu",
  "label": "부모 메뉴",
  "children": [
    {
      "id": "child-1",
      "label": "자식 메뉴 1",
      "path": "/path/1"
    },
    {
      "id": "child-2",
      "label": "자식 메뉴 2",
      "path": "/path/2"
    }
  ]
}
```

---

## 🎨 스타일 옵션

### style 속성

- `vertical`: 세로 메뉴 (기본값)
- `horizontal`: 가로 메뉴
- `sidebar`: 사이드바 스타일

```json
{
  "config": {
    "style": "sidebar",
    "showIcons": true
  }
}
```

---

## 🔄 동적 메뉴 로드

### API에서 메뉴 구조 로드

```json
{
  "id": "dynamic-menu-1",
  "type": "navigation-menu",
  "config": {
    "title": "동적 메뉴",
    "dataSource": {
      "type": "api",
      "url": "/api/v1/menus/by-role",
      "params": {
        "role": "{user.role}"
      }
    }
  }
}
```

위젯이 API에서 메뉴 구조를 자동으로 로드합니다.

---

## 📊 역할별 메뉴 매핑

### TenantRole과 메뉴 연결

각 `TenantRole`에 `metadata_json`에 메뉴 구조를 저장:

```json
{
  "menuConfig": {
    "menuItems": [
      {
        "id": "dashboard",
        "label": "대시보드",
        "path": "/admin/dashboard"
      }
    ]
  }
}
```

그리고 `dashboard_config`에서 참조:

```json
{
  "widgets": [
    {
      "type": "navigation-menu",
      "config": {
        "dataSource": {
          "type": "role-metadata",
          "roleId": "{currentUser.currentTenantRoleId}"
        }
      }
    }
  ]
}
```

---

## ✅ 완료된 작업

- [x] NavigationMenuWidget 컴포넌트 생성
- [x] 역할 기반 필터링
- [x] 권한 기반 필터링
- [x] 하위 메뉴 지원
- [x] 다양한 스타일 옵션 (vertical, horizontal, sidebar)
- [x] 위젯 레지스트리 등록

---

## 🚀 향후 작업

- [ ] API 기반 동적 메뉴 로드
- [ ] 메뉴 드래그 앤 드롭 편집기
- [ ] 메뉴 아이콘 선택 UI
- [ ] 메뉴 순서 변경 기능
- [ ] 메뉴 캐싱 및 성능 최적화

---

## 📚 참고 문서

- [위젯 아키텍처](./WIDGET_ARCHITECTURE.md)
- [위젯 사용 예시](./WIDGET_USAGE_EXAMPLES.md)
- [대시보드 설정 JSON 스키마](./META_SYSTEM_DASHBOARD_SCHEMA.md)

