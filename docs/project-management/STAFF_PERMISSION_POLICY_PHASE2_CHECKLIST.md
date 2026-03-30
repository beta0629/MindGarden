# 스태프 권한 정책 점검 Phase 2 — 수정 제안 및 체크리스트

**작성**: core-debugger  
**목적**: Phase 3 core-coder 전달용 수정 제안·체크리스트, 기획(core-planner) 보고  
**정책**: 스태프(STAFF) 로그인 시 **ERP만 제외**하고, 나머지 메뉴·라우트·기능은 어드민(ADMIN)과 동일하게 노출·동작.

---

## 1. ADMIN 전용 유지 vs STAFF 허용 구분

### 1.1 ADMIN 전용 유지 (수정 없음 또는 STAFF 제외 유지)

| 구분 | 경로/API/기능 | 사유 |
|-----|----------------|------|
| 프론트 라우트 | `/admin/permissions` | 권한·역할 관리 — 시스템 보안 정책상 ADMIN만 |
| 백엔드 | `MenuController.getAdminMenus` | 메뉴 목록은 STAFF도 받아야 하므로 **STAFF 허용으로 변경** (아래 백엔드 항목 참고) |
| 백엔드 | `AdminController.initializeDefaultCodes` | `SessionUtils.isAdmin(session)` → **ADMIN 전용 유지** (테넌트 초기화) |
| 프론트/백엔드 | ERP 전체 (ErpController, FinancialStatement, canAccessERP, LNB ERP 노드) | 정책상 STAFF 제외 유지 (Phase 1 유지 사항) |

### 1.2 STAFF도 허용 (수정 대상)

- `/admin` 레이아웃 및 그 하위: 공통코드, 패키지요금, 메뉴/권한관리 **메뉴 노출** (실제 권한 관리 화면은 ADMIN 전용)
- `/admin/common-codes`, `/admin/tenant-common-codes`, `/admin/package-pricing`, `/admin/menu-permissions`, `/admin/permission-groups` → STAFF 접근 허용 (단, `/admin/permissions` 페이지는 ADMIN 전용)
- `/admin/user-management`, `/admin/client-comprehensive`, `/admin/mapping-management`, `/admin/consultation-logs`, `/admin/integrated-schedule`, `/admin/sessions`, `/admin/accounts`, `/admin/dashboards`, `/admin/schedules`, `/admin/statistics`, 기타 관리자 운영 기능
- 백엔드: `getAdminMenus`, `getMenusByRole("STAFF")`, AdminController 대부분, ScheduleController, **Salary 관련** (아래 1.3 참고)

### 1.3 Salary 관련 (SalaryManagementController, SalaryConfigController)

- **판단**: `/api/v1/admin/salary`, `/api/v1/admin/salary-config`는 **ERP 대시보드(/erp/*)가 아닌 관리자 영역의 급여·설정 관리**이므로 **일반 관리 기능**으로 본다.
- **제안**: STAFF도 접근 허용. (이미 동적 권한 `SALARY_MANAGE` 등으로 제어되면, 권한 그룹에 STAFF를 넣을 수 있도록 하고, 역할 체크는 `isAdminOrStaffRoleFromCommonCode` 사용.)

---

## 2. 프론트엔드 — 구체적 수정 제안

### 2.1 App.js

| 위치 | 현재 | 수정 방향 |
|------|------|-----------|
| **라인 388~393** `/admin` 레이아웃 | `requiredRoles={[USER_ROLES.ADMIN]}` | `requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}` 로 변경. |
| **라인 381~385** `/admin/permissions` | `AdminCommonLayout` 만 사용, ProtectedRoute 없음 | `ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}` 으로 감싸서 **ADMIN 전용** 유지. |
| **기타 `/admin/*` 단독 라우트** | 별도 ProtectedRoute 없이 배치된 라우트들 | STAFF도 접근 가능해야 하므로, **부모 레이아웃**을 ADMIN+STAFF로 통일한 뒤, `/admin` 진입점만 위와 같이 `[ADMIN, STAFF]`로 두면, 해당 레이아웃 하위로 들어가는 모든 자식 경로는 이미 동일 보호 적용. **단, `/admin/permissions`는 위와 같이 별도 라우트로 두고 `requiredRoles={[ADMIN]}` 유지.** |

**체크리스트**

- [ ] App.js: `/admin` 레이아웃의 `ProtectedRoute`를 `requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}` 로 변경.
- [ ] App.js: `/admin/permissions` 라우트를 `ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}` 로 감싸서 ADMIN 전용 유지.

### 2.2 ProtectedRoute.js

- **현재**: `allowed = requiredRoles.some((role) => hasRole(role)) || isAdmin()` 이므로, `requiredRoles`에 STAFF를 넣으면 `hasRole('STAFF')`로 통과 가능. **즉, App.js에서 requiredRoles를 [ADMIN, STAFF]로 주면 추가 수정 없이 동작.**
- **선택 사항**: “관리자 또는 스태프”를 여러 곳에서 쓰이게 하려면 SessionContext에 `isAdminOrStaff()` 를 추가하고, ProtectedRoute에서 `allowed = ... || isAdminOrStaff()` 를 사용하도록 할 수 있음. **Phase 2에서는 필수 아님** — requiredRoles 확장만으로 충분.

**체크리스트**

- [ ] (선택) SessionContext에 `isAdminOrStaff: () => state.user?.role === 'ADMIN' || state.user?.role === 'STAFF'` 추가 후, ProtectedRoute에서 `isAdminOrStaff()` 사용 검토. 없으면 생략 가능.

### 2.3 SessionContext.js

- **위치**: 약 473라인 `isAdmin: () => state.user?.role === 'ADMIN'`
- **수정**: **변경 없음.** isAdmin은 “ADMIN만” 유지. STAFF 접근은 `requiredRoles={[ADMIN, STAFF]}` 및 백엔드 `isAdminOrStaff` 계열로 처리.
- **선택**: `isAdminOrStaff()` 추가 시 위 2.2와 연동.

**체크리스트**

- [ ] (선택) SessionContext에 `isAdminOrStaff` 추가 시, 기존 `isAdmin` 동작 유지 여부 확인.

### 2.4 MenuConstants.js

- **위치**: `isAdminRole` (약 419라인) `const isAdminRole = (userRole) => userRole === 'ADMIN';`
- **수정**: “관리자 레이아웃/메뉴 노출”을 ADMIN+STAFF로 통일하려면, **ADMIN_ONLY 메뉴를 STAFF도 볼 수 있게** 해야 함.  
  - `isAdminRole` → `isAdminOrStaffRole` 로 의미 확장: `userRole === 'ADMIN' || userRole === 'STAFF'`  
  - 또는 `isAdminRole`은 유지하고, `checkMenuPermission` 내부에서 `MENU_PERMISSION_LEVELS.ADMIN_ONLY` 일 때 `isAdminRole(userRole) || userRole === 'STAFF'` 로 변경.
- **권장**: `isAdminOrStaffRole(userRole) = (userRole === 'ADMIN' || userRole === 'STAFF')` 함수 추가 후, `ADMIN_ONLY` 분기(405~406라인)에서 `return isAdminOrStaffRole(userRole);` 로 변경. ERP 메뉴는 이미 별도 필터링(LNB 등)되므로 여기서 STAFF를 넣어도 ERP는 기존 로직으로 제외 가능.

**체크리스트**

- [ ] MenuConstants.js: `isAdminOrStaffRole(userRole)` 추가 (`userRole === 'ADMIN' || userRole === 'STAFF'`).
- [ ] MenuConstants.js: `MENU_PERMISSION_LEVELS.ADMIN_ONLY` 처리 시 `return isAdminOrStaffRole(userRole);` 로 변경 (기존 `isAdminRole` 대체).

### 2.5 quickActionsConfig.js

- **위치**: `ADMIN_ACTIONS` (약 114~138라인), `roles: ['ADMIN', 'HQ_MASTER', ...]` 및 165라인 부근 `if (['ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_MASTER'].includes(user.role))`
- **수정**:  
  - `ADMIN_ACTIONS` 각 항목의 `roles` 배열에 `'STAFF'` 추가.  
  - 165라인 조건을 `['ADMIN', 'STAFF', 'BRANCH_SUPER_ADMIN', 'HQ_MASTER'].includes(user.role)` 로 변경하여 STAFF도 빠른 액션에 포함.

**체크리스트**

- [ ] quickActionsConfig.js: `ADMIN_ACTIONS` 내 각 액션의 `roles`에 `'STAFF'` 추가.
- [ ] quickActionsConfig.js: `generateQuickActionsConfig`에서 관리자 액션 추가 조건에 `'STAFF'` 포함.

---

## 3. 백엔드 — 구체적 수정 제안

### 3.1 SessionUtils (consultation)

- **파일**: `src/main/java/com/coresolution/consultation/utils/SessionUtils.java`
- **현재**: `isAdmin(HttpSession session)` 만 존재 (role.isAdmin()).
- **수정**: `isAdminOrStaff(HttpSession session)` 추가.  
  - `UserRole role = getRole(session); return role != null && (role.isAdmin() || role.isStaff());`

**체크리스트**

- [ ] SessionUtils: `public static boolean isAdminOrStaff(HttpSession session)` 추가 (role.isAdmin() || role.isStaff()).

### 3.2 MenuController

- **파일**: `src/main/java/com/coresolution/core/controller/MenuController.java`
- **위치**: getAdminMenus (약 97~106라인) — `if (!SessionUtils.isAdmin(session))` → 403.
- **수정**: `if (!SessionUtils.isAdmin(session) && !SessionUtils.isAdminOrStaff(session))` 가 아니라, **“관리자 메뉴”를 ADMIN과 STAFF 모두에게 주어야 하므로** `if (!SessionUtils.isAdminOrStaff(session))` 로 변경. (즉, isAdmin → isAdminOrStaff 로 교체.)

**체크리스트**

- [ ] MenuController.getAdminMenus: `SessionUtils.isAdmin(session)` → `SessionUtils.isAdminOrStaff(session)` 로 변경.

### 3.3 MenuServiceImpl

- **파일**: `src/main/java/com/coresolution/core/service/impl/MenuServiceImpl.java`
- **위치**: getMenusByRole (약 30~44라인). 현재 `"ADMIN".equals(role)` 일 때만 전체 메뉴, 그 외는 비관리자 메뉴만.
- **수정**: STAFF도 “관리자와 동일(ERP 제외)”이므로, `"ADMIN".equals(role) || "STAFF".equals(role)` 일 때 `menuRepository.findAllActiveMenusOrdered()` 사용. 단, **STAFF인 경우 반환 전에 ERP 메뉴(예: ADM_ERP 또는 menuCode/경로로 판단)를 제거**하는 로직이 이미 getLnbMenus 쪽에 있으므로, getMenusByRole에서 STAFF를 ADMIN과 동일하게 “전체 활성 메뉴”로 조회한 뒤, 서비스 또는 컨트롤러에서 ERP 제외할지 결정.  
  - **간단안**: getMenusByRole에서 role이 `ADMIN` 또는 `STAFF`이면 동일하게 `findAllActiveMenusOrdered()` 호출. ERP 제외는 기존처럼 LNB/프론트에서 처리하거나, getLnbMenus와 동일하게 STAFF일 때 ERP 노드 제거하는 로직을 getAdminMenus 호출 경로에 적용. (getAdminMenus는 “관리자 전용 메뉴”만 반환하는 메서드이므로, STAFF도 이 목록을 받을 수 있게 하고, 반환 목록에서 STAFF인 경우 ERP 제외 필터를 적용할 수 있음. 구현 위치는 MenuController에서 role 확인 후 필터링하거나, MenuServiceImpl에 getAdminMenusForRole(role) 같은 메서드로 STAFF면 ERP 제외 후 반환.)

**제안 요약**:  
- `getMenusByRole(String role)`: `"STAFF".equals(role)` 일 때도 `findAllActiveMenusOrdered()` 사용 (ADMIN과 동일).  
- getAdminMenus()를 호출하는 쪽(MenuController)에서 세션 역할이 STAFF면 반환 목록에서 ERP 메뉴(예: menuCode `ADM_ERP`) 제거 후 반환하거나, MenuService에 `getAdminMenus(String role)` 오버로드를 두어 STAFF일 때 ERP 제외 후 반환.

**체크리스트**

- [ ] MenuServiceImpl.getMenusByRole: 조건을 `"ADMIN".equals(role) || "STAFF".equals(role)` 로 바꾸고, STAFF일 때도 `findAllActiveMenusOrdered()` 사용.
- [ ] MenuController 또는 MenuServiceImpl: getAdminMenus 호출 시 STAFF인 경우 반환 메뉴에서 ERP 노드(ADM_ERP 등) 제거하도록 처리.

### 3.4 AdminController

- **파일**: `src/main/java/com/coresolution/consultation/controller/AdminController.java`
- **수정 방향**: “일반 관리 기능”은 STAFF 허용. `isAdminRoleFromCommonCode` 만 쓰는 곳은 `isAdminOrStaffRoleFromCommonCode`(아래 정의)로 교체. **단, initializeDefaultCodes** 등 “시스템/테넌트 초기화”는 ADMIN 전용 유지(`SessionUtils.isAdmin(session)` 유지).

**공통 메서드 추가 제안**  
- `private boolean isAdminOrStaffRoleFromCommonCode(UserRole role)`  
  - `return isAdminRoleFromCommonCode(role) || isStaffRoleFromCommonCode(role);`  
  - (이미 `isStaffRoleFromCommonCode` 존재 여부 확인 후, 없으면 동일 패턴으로 구현.)

**교체 대상 (isAdminRoleFromCommonCode → isAdminOrStaffRoleFromCommonCode)**  
- 2504: 스케줄 통계 분기  
- 2621, 2657: 사용자 상세/소셜 계정 조회  
- 2971, 3026, 3066, 3103, 3136, 3162: 기타 관리자 전용 API들 (사용자 목록, 업데이트 등)  
- 3539: **initializeDefaultCodes** 는 **SessionUtils.isAdmin(session)** 유지 (ADMIN 전용).

**체크리스트**

- [ ] AdminController: `isAdminOrStaffRoleFromCommonCode(UserRole role)` 추가 (기존 isStaffRoleFromCommonCode 활용).
- [ ] AdminController: 위 목록의 `isAdminRoleFromCommonCode(currentUser.getRole())` 호출을 `isAdminOrStaffRoleFromCommonCode(currentUser.getRole())` 로 변경 (initializeDefaultCodes 제외).
- [ ] AdminController: initializeDefaultCodes 의 `SessionUtils.isAdmin(session)` 은 변경하지 않음 (ADMIN 전용 유지).

### 3.5 ScheduleController

- **파일**: `src/main/java/com/coresolution/consultation/controller/ScheduleController.java`
- **이미 있음**: `isAdminOrStaffRole` 성격의 `canRegisterOrModifyOthersSchedule` (1214라인) — `isAdminRoleFromCommonCode(role) || isStaffRoleFromCommonCode(role) || role.isAdmin() || role.isStaff()`.
- **수정**: `isAdminRoleFromCommonCode(role)` 단독 사용처를 **“관리자 또는 스태프”** 허용으로 통일.  
  - 213, 238, 305, 629, 1117, 1281, 1340, 1389, 1438 라인 등: `isAdminRoleFromCommonCode(currentUser.getRole())` → `isAdminOrStaffRoleFromCommonCode(currentUser.getRole())` 또는 기존 `canRegisterOrModifyOthersSchedule(role)` 사용 가능한 곳은 그대로 두고, **단독 isAdminRoleFromCommonCode** 만 `isAdminOrStaffRoleFromCommonCode` 로 교체.

**체크리스트**

- [ ] ScheduleController: private 메서드 `isAdminOrStaffRoleFromCommonCode(UserRole role)` 추가 (isAdminRoleFromCommonCode || isStaffRoleFromCommonCode).
- [ ] ScheduleController: “관리자만” 체크하는 모든 `isAdminRoleFromCommonCode(role)` 를 `isAdminOrStaffRoleFromCommonCode(role)` 로 변경 (스케줄 조회/등록/수정/삭제 등).

### 3.6 SalaryManagementController

- **파일**: `src/main/java/com/coresolution/consultation/controller/SalaryManagementController.java`
- **판단**: 일반 관리 기능(급여 프로필·계산·설정)이므로 **STAFF 포함**.
- **수정**: `isAdminRoleFromCommonCode` → `isAdminOrStaffRoleFromCommonCode` 로 교체.  
  - 204, 226, 254 라인 등: `if (!isAdminRoleFromCommonCode(currentUser.getRole()))` → `if (!isAdminOrStaffRoleFromCommonCode(currentUser.getRole()))`  
  - `isAdminOrStaffRoleFromCommonCode` 메서드 추가 (isAdminRoleFromCommonCode || isStaffRoleFromCommonCode).

**체크리스트**

- [ ] SalaryManagementController: `isAdminOrStaffRoleFromCommonCode(UserRole role)` 추가.
- [ ] SalaryManagementController: 권한 체크하는 모든 `isAdminRoleFromCommonCode(currentUser.getRole())` 를 `isAdminOrStaffRoleFromCommonCode(currentUser.getRole())` 로 변경.

### 3.7 SalaryConfigController

- **파일**: `src/main/java/com/coresolution/consultation/controller/SalaryConfigController.java`
- **판단**: 동일하게 일반 관리 기능 — **STAFF 포함**.
- **수정**: 120, 238 라인 등 `isAdminRoleFromCommonCode` → `isAdminOrStaffRoleFromCommonCode` 로 교체.  
  - `isAdminOrStaffRoleFromCommonCode` 메서드 추가.

**체크리스트**

- [ ] SalaryConfigController: `isAdminOrStaffRoleFromCommonCode(UserRole role)` 추가.
- [ ] SalaryConfigController: 모든 `isAdminRoleFromCommonCode` 호출을 `isAdminOrStaffRoleFromCommonCode` 로 변경.

---

## 4. Phase 3 적용 후 확인 체크리스트

- [ ] STAFF 계정으로 로그인 후 `/admin` 진입 가능한지.
- [ ] STAFF로 `/admin/permissions` 접근 시 거부(리다이렉트 또는 403)되는지.
- [ ] STAFF로 `/admin/common-codes`, 사용자 관리, 매칭, 스케줄, 통계 등 비-ERP 관리 메뉴 접근·동작 가능한지.
- [ ] STAFF로 ERP 메뉴/라우트(/erp/*, canAccessERP, LNB ERP 노드) 노출·접근되지 않는지.
- [ ] 백엔드: GET /api/v1/menus/admin 등 메뉴 API가 STAFF 세션으로 200 및 동일(또는 ERP 제외) 목록 반환하는지.
- [ ] 백엔드: AdminController 사용자 목록/상세, ScheduleController 스케줄 API, Salary 관련 API가 STAFF 세션으로 정상 응답하는지.
- [ ] ADMIN 전용: initializeDefaultCodes, /admin/permissions 는 STAFF 요청 시 403 또는 리다이렉트되는지.

---

## 5. core-coder 전달용 요약

- **프론트**: App.js `/admin` 레이아웃은 `[ADMIN, STAFF]`, `/admin/permissions` 만 `[ADMIN]`. MenuConstants.js에서 ADMIN_ONLY 메뉴를 STAFF도 보이게 `isAdminOrStaffRole` 도입. quickActionsConfig.js에 STAFF 추가.
- **백엔드**: SessionUtils에 `isAdminOrStaff`, MenuController는 `isAdminOrStaff`, MenuServiceImpl은 STAFF도 전체 메뉴 조회 후 ERP 제외 처리. AdminController/ScheduleController/SalaryManagementController/SalaryConfigController에서 `isAdminOrStaffRoleFromCommonCode` 사용. ADMIN 전용은 initializeDefaultCodes, /admin/permissions 화면만 유지.

이 문서를 Phase 3 core-coder에게 전달하고, 위 체크리스트대로 구현 후 4절 확인으로 마무리하면 됩니다.

---

## 6. 기획(core-planner) 보고 요약

- **Phase 2 결과**: 위반 지점별 수정 제안과 체크리스트를 위 문서에 정리함. 코드 수정은 하지 않았으며, core-coder가 Phase 3에서 적용할 수 있도록 파일·라인·조건문 수준으로 명시함.
- **ADMIN 전용 유지**: `/admin/permissions`, `initializeDefaultCodes`, ERP 전반(기존 유지).
- **STAFF 허용 확대**: `/admin` 레이아웃·공통코드·패키지요금·메뉴/권한 메뉴 노출, 사용자/매칭/스케줄/통계, Salary API·설정, 메뉴 API, QuickActions.
- **Salary**: ERP/재무 전용이 아닌 일반 관리 기능으로 판단하여 STAFF 포함 제안 반영함.
