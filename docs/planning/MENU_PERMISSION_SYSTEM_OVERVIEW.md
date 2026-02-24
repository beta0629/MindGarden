# 현재 시스템 메뉴·권한 구조 요약

> 재조정 시 참고용. 프론트·백엔드·역할·권한 코드를 한눈에 볼 수 있도록 정리함.

---

## 1. 역할(Role) 정의

**위치**: `frontend/src/constants/roles.js`, `frontend/src/constants/menu.js` (ROLES)

| 역할 코드 | 설명 |
|-----------|------|
| **CLIENT** | 내담자 |
| **CONSULTANT** | 상담사 |
| **ADMIN** | (지점) 관리자 |
| **BRANCH_SUPER_ADMIN** | 지점 수퍼 관리자 |
| **BRANCH_MANAGER** | 지점장 |
| **HQ_ADMIN** | 본사 관리자 |
| **SUPER_HQ_ADMIN** | 수퍼 본사 관리자 |
| **HQ_MASTER** | 본사 총관리자 (모든 권한) |
| **HQ_SUPER_ADMIN** | (호환) 본사 최고관리자 |

---

## 2. 메뉴가 노출되는 경로 (2가지)

### 2-1. `/admin` 라우트 (AdminLayout + API 메뉴)

- **레이아웃**: `AdminLayout.js` → `AdminMenuSidebarUI`
- **메뉴 소스**: **백엔드 API**  
  - `GET /api/v1/menus/admin`  
  - `MenuController.getAdminMenus()` → `MenuService.getAdminMenus()`  
  - DB `findAdminOnlyMenus()` 기준으로 **트리 구조 메뉴** 반환
- **특징**: 관리자 여부만 체크(`SessionUtils.isAdmin`). **역할별로 다른 메뉴를 주지 않고** “관리자 전용 메뉴” 한 세트만 반환.
- **재조정 시**: DB 메뉴 테이블·초기 데이터 또는 `MenuService.getAdminMenus()` 로직을 역할/권한에 맞게 바꾸면 됨.

### 2-2. 각 페이지별 LNB (AdminCommonLayout + menuItems)

- **레이아웃**: `AdminCommonLayout` → `DesktopLayout` / `MobileLayout` → LNB에 `menuItems` 표시
- **메뉴 소스**: **프론트 상수**  
  - `frontend/src/components/dashboard-v2/constants/menuItems.js`
  - `DEFAULT_MENU_ITEMS` (대시보드, 매칭관리, 설정, 사용자, 보고서)
  - `CLIENT_MENU_ITEMS`, `CONSULTANT_MENU_ITEMS`, `ERP_MENU_ITEMS`, `HQ_MENU_ITEMS`
- **특징**: 페이지마다 `menuItems={DEFAULT_MENU_ITEMS}` 등으로 **하드코딩**. **역할에 따라 자동 전환이 없음**.
- **재조정 시**: 역할별로 다른 `menuItems`를 넘기거나, 역할+권한으로 `menuItems`를 필터링하는 공통 로직을 두면 됨.

### 2-3. 참고: 역할별 메뉴 구조(정적, 현재 미사용 가능성)

- **위치**: `frontend/src/constants/menu.js`
- **내용**: 역할별 MAIN/SUB 그룹
  - `ADMIN_MENU_ITEMS` (admin, users, system)
  - `BRANCH_SUPER_ADMIN_MENU_ITEMS`, `HQ_ADMIN_MENU_ITEMS`, `SUPER_HQ_ADMIN_MENU_ITEMS`
  - `BRANCH_BRANCH_SUPER_ADMIN_MENU_ITEMS`, `BRANCH_MANAGER_MENU_ITEMS`
  - `CONSULTANT_MENU_ITEMS`, `CLIENT_MENU_ITEMS`
- **사용처**: 코드베이스에서 직접 import하는 곳이 없음. **AdminLayout은 API 메뉴만 사용**.
- **재조정 시**: 역할별 메뉴를 “API 대신” 또는 “API와 매핑”해서 쓰려면 이 상수와 연동하는 레이어를 만들 수 있음.

---

## 3. 권한(Permission) 코드

**위치**: `frontend/src/utils/permissionUtils.js` (PERMISSIONS, PermissionChecks)

**API**: `GET /api/v1/permissions/my-permissions` → 사용자별 권한 코드 배열 반환.

### 3-1. 권한 코드 일람 (주요)

| 분류 | 권한 코드 | 용도 |
|------|-----------|------|
| 사용자 | USER_VIEW, USER_MANAGE, USER_ROLE_CHANGE, USER_MANAGEMENT_DUPLICATE | 사용자 조회/관리/역할변경 |
| 상담사 | CONSULTANT_VIEW, CONSULTANT_MANAGE, CONSULTANT_SPECIALTY_MANAGE, CONSULTANT_AVAILABILITY_MANAGE, VACATION_MANAGE, CONSULTANT_TRANSFER, CONSULTANT_RATING_VIEW | 상담사 조회/관리/전문분야/가능시간/휴가/이전/평점 |
| 내담자 | CLIENT_VIEW, CLIENT_MANAGE, CLIENT_FUNCTIONS_VIEW | 내담자 조회/관리 |
| 매칭 | MAPPING_VIEW, MAPPING_MANAGE, CONSULTATION_PACKAGE_MANAGE, DUPLICATE_MAPPING_MANAGE | 매칭 조회/관리 |
| 스케줄 | SCHEDULE_VIEW, SCHEDULE_MANAGE | 스케줄 조회/관리 |
| 상담일지 | CONSULTATION_RECORD_VIEW/MANAGE, CONSULTATION_HISTORY_VIEW, CONSULTATION_REPORT_VIEW | 상담일지·이력·리포트 |
| 재무 | FINANCIAL_VIEW, FINANCIAL_MANAGE, TAX_MANAGE, SALARY_MANAGE, REFUND_MANAGE, BRANCH_FINANCIAL_VIEW, ANNUAL_FINANCIAL_REPORT_VIEW | 재무/세무/급여/환불/지점재무 |
| 결제 | PAYMENT_ACCESS, PAYMENT_METHOD_MANAGE | 결제 접근/결제수단 |
| ERP | ERP_ACCESS, ERP_DASHBOARD_VIEW, ERP_SYNC_*, PURCHASE_REQUEST_*, APPROVAL_MANAGE, ITEM_MANAGE, BUDGET_MANAGE | ERP 전반 |
| 지점 | BRANCH_VIEW, BRANCH_MANAGE | 지점 조회/관리 |
| 시스템 | PERMISSION_MANAGEMENT, SYSTEM_SETTINGS_MANAGE, COMMON_CODE_MANAGE, NOTIFICATION_MANAGE, SYSTEM_NOTIFICATION_MANAGE, MENU_MANAGE | 권한/설정/공통코드/알림/메뉴 |
| 보고서 | REPORT_VIEW, DASHBOARD_VIEW, DATA_EXPORT, DATA_IMPORT, HQ_DASHBOARD_VIEW, INTEGRATED_FINANCE_VIEW | 대시보드/리포트/데이터 |
| 기타 | AUDIT_LOG_VIEW, SYSTEM_HEALTH_CHECK, ANNOUNCEMENT_MANAGE, FAQ_MANAGE, CUSTOMER_SUPPORT_MANAGE, SOCIAL_ACCOUNT_VIEW | 감사/헬스체크/공지/FAQ/고객지원 |

### 3-2. 편의 함수 (PermissionChecks)

- 사용자: `canManageUsers`, `canViewUsers`, `canChangeUserRoles`
- 상담사: `canManageConsultants`, `canViewConsultants`, `canManageConsultantAvailability`, `canManageVacations`
- 내담자: `canManageClients`, `canViewClients`
- 매칭: `canManageMappings`, `canViewMappings`
- 스케줄: `canManageSchedules`, `canViewSchedules`
- 재무/ERP/시스템/대시보드 등: 동일한 이름 패턴으로 `permissionUtils.js` 내에 정의됨.

---

## 4. 역할별 메뉴 그룹·기능 (정의만, 검증용)

**위치**: `frontend/src/utils/menuPermissionValidator.js` (MENU_PERMISSIONS)

| 역할 | menuGroups | 비고 |
|------|------------|------|
| CLIENT | COMMON_MENU, CLIENT_MENU | |
| CONSULTANT | COMMON_MENU, CONSULTANT_MENU | |
| ADMIN | COMMON_MENU, ADMIN_MENU | |
| BRANCH_SUPER_ADMIN | COMMON_MENU, ADMIN_MENU, BRANCH_SUPER_ADMIN_MENU | |
| HQ_ADMIN | COMMON_MENU, HQ_ADMIN_MENU | |
| SUPER_HQ_ADMIN | COMMON_MENU, HQ_ADMIN_MENU | |
| HQ_MASTER | 전 그룹 + ALL_FEATURES | |
| BRANCH_MANAGER | COMMON_MENU, ADMIN_MENU | |

- `hasMenuAccess(menuGroup)`: API로 사용자 권한 조회 후 `menuGroupPermissionMap`으로 메뉴 그룹 접근 여부 판단.
- `hasFeature(feature)`: 위 `MENU_PERMISSIONS[user.role].features` 기준 동기 체크.

---

## 5. 백엔드 메뉴·메뉴 권한 API

| API | 설명 |
|-----|------|
| GET /api/v1/menus/user | 역할별 메뉴 (MenuController, 세션 역할 사용) |
| GET /api/v1/menus/admin | 관리자 전용 메뉴 (isAdmin만 허용, 역할 구분 없음) |
| GET /api/v1/menus/all | 전체 활성 메뉴 |
| GET /api/v1/admin/menu-permissions/roles/{roleId} | 역할별 메뉴 권한 목록 (MenuPermissionController) |
| POST /api/v1/admin/menu-permissions/grant | 메뉴 권한 부여 |
| (기타) revoke 등 | menuPermissionApi.js 참고 |

---

## 6. 재조정 시 체크 포인트

1. **관리자 사이드바(실제 노출)**  
   - `/admin` 진입 시 메뉴는 **DB + getAdminMenus()** 결과.  
   - 역할/권한별로 다른 메뉴를 보이게 하려면:  
     - DB 메뉴 데이터에 역할/권한 매핑을 두거나,  
     - `MenuService.getAdminMenus()` 에서 세션 역할/권한으로 필터링하도록 변경.

2. **페이지별 LNB (dashboard-v2 menuItems)**  
   - 현재는 역할 무관하게 페이지가 고정된 `DEFAULT_MENU_ITEMS` 등 사용.  
   - 재조정 시:  
     - 역할/권한에 따라 다른 메뉴 배열을 선택하거나,  
     - `permissionUtils.hasPermission` / `PermissionChecks` 로 항목별 노출 여부 결정.

3. **권한과 메뉴 연결**  
   - `menuPermissionValidator.js`의 `menuGroupPermissionMap`은 권한 코드와 메뉴 그룹을 연결.  
   - 백엔드 `MenuPermissionController` / `MenuPermissionService` 와 역할별 메뉴 권한 데이터를 맞추면, “역할/권한 → 메뉴 노출”을 일원화할 수 있음.

4. **정적 상수 (menu.js)**  
   - 역할별 MAIN/SUB 구조가 이미 정의돼 있으나 **현재 사용처 없음**.  
   - API/DB 기반으로 갈지, 프론트 정적 메뉴를 다시 쓸지 정한 뒤, 한쪽으로 통일하는 것이 좋음.

---

**문서 위치**: `docs/planning/MENU_PERMISSION_SYSTEM_OVERVIEW.md`
