# LNB 메뉴 구조 및 권한 스펙 (DB 기반 재구성)

> MindGarden 프로젝트에서 **LNB(좌측 메뉴) 메뉴 목록을 DB 기반으로 재구성**하기 위한 설계 스펙.  
> 코더가 이 스펙만 보고 DB·API·프론트를 구현할 수 있도록 구체적으로 정의함.

**문서 버전**: 1.0  
**작성일**: 2025-02  
**참조**: [MENU_PERMISSION_SYSTEM_OVERVIEW.md](../planning/MENU_PERMISSION_SYSTEM_OVERVIEW.md), 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)

---

## 1. 개요 및 목표

- **현상**: `AdminCommonLayout` + `DesktopLnb` / `MobileLnbDrawer`는 현재 **상수**(`DEFAULT_MENU_ITEMS`, `ERP_MENU_ITEMS` 등)만 사용하며, DB 메뉴 API를 호출하지 않음.
- **목표**: LNB 메뉴를 **DB 기반**으로 전환하여, 역할/권한에 따라 동일한 레이아웃에서 **다른 메뉴 트리**를 노출.
- **역할 정의**: `ADMIN`, `STAFF`, `CONSULTANT`, `CLIENT` 4개. HQ/지점 관련은 레거시 역할 매핑 시 `ADMIN` 등으로 통합.

---

## 2. LNB 메뉴 구조 (메인 메뉴 + 서브 메뉴)

트리 구조: **1 depth = 메인 메뉴**, **2 depth = 서브 메뉴**. 메인만 있고 자식이 없는 항목도 허용.

### 2.1 어드민(ADMIN/STAFF) 영역 — 메인 메뉴

| menu_code       | 메뉴명(표시) | menu_path              | sort_order | 비고 |
|-----------------|-------------|------------------------|------------|------|
| ADM_DASHBOARD   | 대시보드    | /admin/dashboard-v2    | 10         | 메인만 (자식 없음) |
| ADM_MAPPING     | 매칭 관리   | /admin/mapping-management | 20     | 메인만 |
| ADM_USERS       | 사용자/권한 | #                       | 30         | 서브 있음 (아래 참조) |
| ADM_ERP         | ERP 관리    | /erp/dashboard         | 40         | 서브 있음 |
| ADM_SETTINGS    | 설정        | #                       | 50         | 서브 있음 |
| ADM_REPORTS     | 보고서      | #                       | 60         | 서브 있음 (선택) |
| ADM_NOTIFICATIONS | 알림     | /admin/system-notifications | 70   | 메인만 |

`#`는 클릭 시 첫 번째 서브로 이동하거나, 서브 목록만 열기용(구현 시 결정).

### 2.2 어드민 — 서브 메뉴 (2 depth)

**ADM_USERS (사용자/권한)**  
| menu_code       | 메뉴명         | menu_path                    | sort_order |
|-----------------|----------------|------------------------------|------------|
| ADM_USERS_LIST  | 사용자 관리    | /admin/user-management      | 1          |
| ADM_ACCOUNTS    | 계좌 관리      | /admin/accounts              | 2          |

*(제거됨: `ADM_PERMISSIONS` 권한 관리 — DB `is_active=0`, `/admin/permissions` → 사용자 관리 리다이렉트. 마이그레이션 `V20260323_001`.)*

**ADM_ERP (ERP 관리)**  
| menu_code       | 메뉴명         | menu_path         | sort_order |
|-----------------|----------------|-------------------|------------|
| ERP_DASHBOARD   | ERP 대시보드   | /erp/dashboard    | 1          |
| ERP_PURCHASE    | 구매 관리      | /erp/purchase     | 2          |
| ERP_FINANCIAL   | 재무 관리      | /erp/financial    | 3          |
| ERP_BUDGET      | 예산 관리      | /erp/budget       | 4          |
| ERP_TAX         | 세무 관리      | /erp/tax          | 5          |

**ADM_SETTINGS (설정)**  
| menu_code           | 메뉴명           | menu_path                | sort_order |
|---------------------|------------------|---------------------------|------------|
| ADM_SETTINGS_TENANT | 테넌트 프로필    | /tenant/profile           | 1          |
| ADM_SETTINGS_SYSTEM | 시스템 설정      | /admin/system-config      | 2          |
| ADM_SETTINGS_CODES  | 공통코드         | /admin/common-codes       | 3          |
| ADM_SETTINGS_PG     | PG 설정          | /tenant/pg-configuration  | 4          |

**ADM_REPORTS (보고서)**  
| menu_code        | 메뉴명        | menu_path           | sort_order |
|------------------|---------------|---------------------|------------|
| ADM_REPORTS_STAT | 통계          | /admin/statistics    | 1          |
| ADM_REPORTS_COMP | 컴플라이언스  | /admin/compliance    | 2          |

### 2.3 내담자(CLIENT) 영역 — 메인 메뉴 (자식 없음, 플랫 리스트)

| menu_code     | 메뉴명     | menu_path              | sort_order |
|---------------|------------|------------------------|------------|
| CLT_DASHBOARD | 대시보드   | /client/dashboard      | 10         |
| CLT_SCHEDULE  | 스케줄     | /client/schedule       | 20         |
| CLT_SESSIONS  | 회기 관리  | /client/session-management | 30  |
| CLT_PAYMENT   | 결제 내역  | /client/payment-history| 40         |
| CLT_SETTINGS  | 설정       | /client/settings       | 50         |

### 2.4 상담사(CONSULTANT) 영역 — 메인 메뉴 (자식 없음)

| menu_code       | 메뉴명     | menu_path                    | sort_order |
|-----------------|------------|------------------------------|------------|
| CST_DASHBOARD   | 대시보드   | /consultant/dashboard        | 10         |
| CST_SCHEDULE    | 스케줄     | /consultant/schedule         | 20         |
| CST_RECORDS     | 상담 기록  | /consultant/consultation-records | 30    |
| CST_AVAILABILITY| 가능 시간  | /consultant/availability     | 40         |
| CST_MESSAGES    | 메시지     | /consultant/messages         | 50         |

### 2.5 HQ(본사) 영역 — 별도 라우트/레이아웃

HQ는 역할이 `ADMIN`으로 매핑되며, **menu_location** 또는 **경로 prefix**로 구분할 수 있음. LNB는 “어드민”과 동일한 API를 쓰되, `menu_location = 'HQ'`인 메뉴만 필터해 사용하거나, 별도 엔드포인트 확장 시 사용.

| menu_code   | 메뉴명       | menu_path                  | sort_order |
|-------------|--------------|----------------------------|------------|
| HQ_DASHBOARD| 대시보드     | /hq/dashboard              | 10         |
| HQ_BRANCH   | 지점 관리    | /hq/branch-management     | 20         |
| HQ_FIN_BRANCH | 지점별 재무 | /hq/erp/branch-financial   | 30         |
| HQ_FIN_CONSOL | 통합 재무   | /hq/erp/consolidated      | 40         |
| HQ_REPORTS  | 재무 보고서  | /hq/erp/reports           | 50         |

---

## 3. 아이콘 매핑

- **DB**: `menus.icon`에 문자열 저장. 프론트에서 이 문자열을 **lucide-react** 컴포넌트와 매핑.
- **매핑표** (기존 `menuItems.js`의 lucide 아이콘과 동일하게 유지):

| icon 코드 (DB 저장값) | Lucide 컴포넌트 |
|----------------------|-----------------|
| LayoutDashboard      | LayoutDashboard |
| Link                 | Link            |
| Settings             | Settings        |
| Users                | Users           |
| FileText             | FileText        |
| Calendar             | Calendar        |
| MessageCircle        | MessageCircle   |
| CreditCard           | CreditCard      |
| ShoppingCart         | ShoppingCart    |
| DollarSign           | DollarSign      |
| PieChart             | PieChart        |
| Receipt              | Receipt         |
| Building2            | Building2       |
| BarChart3            | BarChart3       |
| gear-fill (레거시)   | Settings        |
| speedometer2 (레거시)| LayoutDashboard |
| list-ul (레거시)     | FileText        |
| people-fill (레거시) | Users           |
| cart-check (레거시)  | ShoppingCart    |
| graph-up (레거시)    | DollarSign      |
| piggy-bank (레거시)  | PieChart        |

프론트: `icon` 문자열 → `lucide-react` 컴포넌트 매핑 객체를 두고, 없으면 기본 `FileText` 등으로 폴백.

---

## 4. 권한별 메뉴 노출 매트릭스

행 = 메뉴(메인 또는 서브), 열 = 역할. 셀: **O** = 노출, **-** = 비노출, **조건** = 설명.

### 4.1 어드민/사무원 영역 (메인)

| 메뉴(메인)     | ADMIN | STAFF | CONSULTANT | CLIENT |
|----------------|-------|-------|------------|--------|
| 대시보드       | O     | O     | -          | -      |
| 매칭 관리      | O     | O*    | -          | -      |
| 사용자/권한    | O     | O*    | -          | -      |
| ERP 관리       | O     | -**   | -          | -      |
| 설정           | O     | O*    | -          | -      |
| 보고서         | O     | O*    | -          | -      |
| 알림           | O     | O     | -          | -      |

- \* STAFF: 테넌트별 권한(예: `MAPPING_VIEW`, `USER_VIEW`, `SYSTEM_SETTINGS_MANAGE`)이 있으면 해당 메인/서브만 노출. 없으면 비노출.
- \*\* STAFF: ERP 관련 권한(예: `ERP_ACCESS`) 부여 시에만 ERP 메인/서브 노출 가능(선택 정책).

### 4.2 어드민 — 서브 메뉴 (사용자/권한, ERP, 설정, 보고서)

| 서브 메뉴        | ADMIN | STAFF | CONSULTANT | CLIENT |
|------------------|-------|-------|------------|--------|
| 사용자 관리      | O     | O*    | -          | -      |
| 권한 관리        | O     | O*    | -          | -      |
| 계좌 관리        | O     | O*    | -          | -      |
| ERP 대시보드     | O     | 조건  | -          | -      |
| 구매/재무/예산/세무 | O  | 조건  | -          | -      |
| 테넌트 프로필   | O     | O     | -          | -      |
| 시스템 설정      | O     | O*    | -          | -      |
| 공통코드         | O     | O*    | -          | -      |
| PG 설정          | O     | O*    | -          | -      |
| 통계/컴플라이언스 | O    | O*    | -          | -      |

\* 권한 그룹: `USER_VIEW`/`USER_MANAGE`, `PERMISSION_MANAGEMENT`, `SYSTEM_SETTINGS_MANAGE`, `COMMON_CODE_MANAGE` 등에 따라 서브 노출.  
조건: `ERP_ACCESS` 등 ERP 권한 보유 시에만 노출.

### 4.3 내담자(CLIENT) 메뉴

| 메뉴             | ADMIN | STAFF | CONSULTANT | CLIENT |
|------------------|-------|-------|------------|--------|
| 대시보드         | -     | -     | -          | O      |
| 스케줄           | -     | -     | -          | O      |
| 회기 관리        | -     | -     | -          | O      |
| 결제 내역        | -     | -     | -          | O      |
| 설정             | -     | -     | -          | O      |

### 4.4 상담사(CONSULTANT) 메뉴

| 메뉴             | ADMIN | STAFF | CONSULTANT | CLIENT |
|------------------|-------|-------|------------|--------|
| 대시보드         | -     | -     | O          | -      |
| 스케줄           | -     | -     | O          | -      |
| 상담 기록        | -     | -     | O          | -      |
| 가능 시간        | -     | -     | O          | -      |
| 메시지           | -     | -     | O          | -      |

### 4.5 권한 그룹 요약 (노출 조건 참고)

- **ERP_ACCESS**: ERP 관리 메인 + 서브 전체.
- **MENU_PERMISSION_MGMT / PERMISSION_MANAGEMENT**: 권한 관리 서브.
- **USER_VIEW / USER_MANAGE**: 사용자 관리 서브.
- **SYSTEM_SETTINGS_MANAGE**: 시스템 설정·공통코드 등.
- **MAPPING_VIEW / MAPPING_MANAGE**: 매칭 관리 메인.

역할만으로 부족한 경우, 백엔드에서 “역할 + 권한(permission)”으로 메뉴를 필터링해 반환하는 API를 사용.

---

## 5. DB와의 매핑

### 5.1 menus 테이블 컬럼과 스펙 대응

| 컬럼               | 용도 |
|--------------------|------|
| id                 | PK |
| menu_code          | 고유 코드. 스펙의 메인/서브 menu_code와 1:1 대응. |
| menu_name          | 표시명 (한글). |
| menu_name_en       | 영문명 (선택). |
| menu_path          | 라우트 경로. `#`인 경우 클릭 시 첫 번째 자식으로 이동하거나 서브만 펼치기. |
| parent_menu_id     | 부모 메뉴 id. NULL이면 1 depth(메인). |
| depth              | 0 = 메인, 1 = 서브(현재 스펙은 2 depth만 사용). |
| required_role      | 이 메뉴를 볼 수 있는 **최소 역할**. 예: ADMIN, STAFF, CONSULTANT, CLIENT. |
| min_required_role  | 동일 의미로 사용 가능. 정렬: CLIENT < CONSULTANT < STAFF < ADMIN. |
| is_admin_only      | true면 관리자 전용(현재 getAdminMenus()에서 사용). 역할 기반으로 확장 시 false로 두고 required_role로 제어 가능. |
| menu_location      | LNB 구역. 예: DASHBOARD, ADMIN_ONLY, HQ, CLIENT, CONSULTANT. |
| icon               | 아이콘 문자열. 위 아이콘 매핑표와 매핑. |
| sort_order         | 동일 depth 내 정렬. 작을수록 위. |
| is_active          | true만 노출. |
| description        | 설명(관리용). |

### 5.2 메인만 있는 메뉴 vs 메인+서브

- **메인만**: `parent_menu_id = NULL`, 자식 행이 없음. 예: 대시보드, 매칭 관리, 알림(어드민); 내담자/상담사 전체.
- **메인+서브**: 메인 행은 `parent_menu_id = NULL`. 서브 행은 해당 메인의 `id`를 `parent_menu_id`로 가짐.  
  메인 행의 `menu_path`가 `#`이면 “링크 없음, 서브만 펼치기” 또는 “첫 번째 서브로 리다이렉트”로 구현.

### 5.3 신규/보완 메뉴 migration 제안

기존 `V20251203_002`, `V20260212_003` 등에는 `SYSTEM_ADMIN`, `ERP_MAIN`, `ERP_DASHBOARD` 등이 이미 정의되어 있음.  
**LNB 통일용**으로는 아래 **ADM_*** / **CLT_*** / **CST_*** 코드를 새로 넣거나, 기존 코드와 1:1 매핑해서 사용**.  
기존 `SYSTEM_ADMIN` 하위 구조를 그대로 쓸 경우, 메인 메뉴를 `SYSTEM_ADMIN` 자식들로 두고 경로/정렬만 위 표에 맞추면 됨.  
(이미 있는 menu_code는 제외하고, 없는 것만 INSERT.)

| menu_code       | menu_name     | menu_path                 | parent_code | required_role | is_admin_only | menu_location | icon             | sort_order |
|-----------------|---------------|---------------------------|-------------|---------------|---------------|---------------|------------------|------------|
| ADM_DASHBOARD   | 대시보드      | /admin/dashboard-v2       | NULL        | ADMIN         | true          | ADMIN_ONLY    | LayoutDashboard  | 10         |
| ADM_MAPPING     | 매칭 관리     | /admin/mapping-management | NULL        | ADMIN         | true          | ADMIN_ONLY    | Link             | 20         |
| ADM_USERS       | 사용자/권한   | #                         | NULL        | ADMIN         | true          | ADMIN_ONLY    | Users            | 30         |
| ADM_USERS_LIST  | 사용자 관리   | /admin/user-management    | ADM_USERS   | ADMIN         | true          | ADMIN_ONLY    | Users            | 1          |
| ADM_ACCOUNTS    | 계좌 관리     | /admin/accounts           | ADM_USERS   | ADMIN         | true          | ADMIN_ONLY    | CreditCard       | 2          |

> 레거시 `ADM_PERMISSIONS`(권한 관리)는 `V20260323_001`에서 `is_active=0` 처리. 프론트는 `/admin/permissions` → 사용자 관리 리다이렉트.
| ADM_ERP         | ERP 관리      | /erp/dashboard            | NULL        | ADMIN         | true          | ADMIN_ONLY    | LayoutDashboard  | 40         |
| (ERP_MAIN 등 기존과 통합 시 위와 같이 서브는 parent = ADM_ERP) |
| ADM_SETTINGS    | 설정          | #                         | NULL        | ADMIN         | true          | ADMIN_ONLY    | Settings         | 50         |
| ADM_SETTINGS_*  | (서브들)      | (경로)                    | ADM_SETTINGS| ADMIN         | true          | ADMIN_ONLY    | (해당)           | 1,2,3,4    |
| ADM_REPORTS     | 보고서        | #                         | NULL        | ADMIN         | true          | ADMIN_ONLY    | FileText         | 60         |
| ADM_NOTIFICATIONS | 알림       | /admin/system-notifications | NULL      | ADMIN         | true          | ADMIN_ONLY    | MessageCircle    | 70         |
| CLT_DASHBOARD   | 대시보드      | /client/dashboard         | NULL        | CLIENT        | false         | CLIENT        | LayoutDashboard  | 10         |
| (이하 CLT_*, CST_* 표 정의대로) |

migration 시 `parent_menu_id`는 `(SELECT id FROM menus WHERE menu_code = 'ADM_USERS' LIMIT 1)` 형태로 넣거나, application에서 부모 code로 조회 후 insert 가능.

---

## 6. API 및 프론트 연동 방향

### 6.1 LNB용 메뉴 API

- **현재**: `GET /api/v1/menus/admin` (관리자 전용 트리), `GET /api/v1/menus/user` (세션 역할 기준 트리).
- **사용 방향**:  
  - **어드민 LNB**: 로그인 사용자가 ADMIN/STAFF이면 `GET /api/v1/menus/admin` 또는 **역할+권한을 반영한** `GET /api/v1/menus/user` 호출.  
  - **내담자/상담사 LNB**: `GET /api/v1/menus/user`만 호출.  
  - 응답은 **MenuDTO 트리**(상위 노드에 `children` 리스트)로, “현재 사용자 역할/권한에 맞는” 메뉴만 포함되도록 백엔드에서 필터링.

**확장 시 권장**  
- `GET /api/v1/menus/user`가 세션의 역할 + (선택) 권한 목록을 사용해, 위 매트릭스에 맞게 필터된 트리를 반환.  
- `GET /api/v1/menus/admin`은 기존처럼 is_admin_only 메뉴만 반환하거나, “ADMIN/STAFF용 전체 트리”로 재정의 후 역할/권한 필터 적용.

### 6.2 프론트 연동 (구현 담당: 코더)

- **공통 레이아웃**: `AdminCommonLayout`(또는 역할별 공통 레이아웃)에서, 마운트 시 **LNB용 메뉴 API 한 번 호출**.
- **역할 분기**: 현재 사용자 역할(ADMIN / STAFF / CONSULTANT / CLIENT)에 따라 호출할 API 결정(`/menus/admin` vs `/menus/user` 등).
- **전달**: 응답 메뉴 트리(배열 또는 트리)를 `DesktopLayout` / `MobileLayout`에 전달 → `DesktopLnb`, `MobileLnbDrawer`에 **menuItems**(또는 트리 구조 그대로) 전달.
- **렌더링**:  
  - 현재 LNB는 **플랫 리스트**(menuItems.map).  
  - DB 트리(메인+서브)를 사용할 경우, **1 depth**는 메인, **2 depth**는 서브로 렌더링(예: 메인 클릭 시 서브 펼침, 또는 서브를 들여쓰기해 플랫 리스트로 펼쳐서 표시).  
  - 각 항목: `menuPath` → `to`, `menuName` → `label`, `icon` → 위 매핑으로 Lucide 컴포넌트.

구현 세부(호출 시점, 캐싱, 에러 시 폴백 상수 사용 여부 등)는 코더가 결정.

---

## 7. 체크리스트 (구현 시)

- [ ] DB: 위 메인/서브 menu_code·경로·역할·정렬이 `menus` 테이블에 반영되어 있는가?
- [ ] API: 역할(및 필요 시 권한)에 따라 필터된 메뉴 트리가 `GET /api/v1/menus/user` 또는 admin 확장으로 반환되는가?
- [ ] 프론트: 공통 레이아웃에서 해당 API 호출 후, 트리를 LNB 컴포넌트에 전달하는가?
- [ ] LNB: 메인/서브 트리 또는 플랫 리스트로 렌더링하고, `menu_path`·`menu_name`·`icon` 매핑이 적용되었는가?
- [ ] 권한 매트릭스: ADMIN/STAFF/CONSULTANT/CLIENT별 노출이 위 표와 일치하는가?

---

**문서 위치**: `docs/design-system/LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md`
