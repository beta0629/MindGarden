# GNB / LNB 메뉴 링크 점검 가이드

**문서 위치**: `docs/standards/GNB_LNB_LINK_AUDIT_GUIDE.md`  
**작성일**: 2026-02-25  
**적용**: 프론트엔드 메뉴·네비게이션 수정 시 참조

---

## 개요

본 문서는 **상단(GNB)·좌측(LNB) 메뉴 링크**가 실제 프론트엔드 라우트(`App.js`)와 일치하는지 점검한 결과와, 수정 시 참고할 **권장 사항·우선순위**를 정리한 표준 가이드입니다. 메뉴/탭 경로 추가·변경 시 이 문서의 라우트 목록과 불일치 목록을 참고하여 404 및 잘못된 링크를 방지합니다. 문서 작성·갱신은 `.cursor/skills/core-solution-documentation` 스킬에 따릅니다.

---

## 목차

1. [현재 프론트엔드 라우트 목록](#1-현재-프론트엔드-라우트-목록)
2. [GNB 링크 현황](#2-gnb-링크-현황)
3. [LNB 링크 현황](#3-lnb-링크-현황)
4. [불일치/오류 목록](#4-불일치오류-목록)
5. [수정 권장 사항 (우선순위별)](#5-수정-권장-사항-우선순위별)
6. [참고 파일 목록](#6-참고-파일-목록)
7. [수정 이력](#7-수정-이력)

---

## 1. 현재 프론트엔드 라우트 목록

라우트 정의 위치: `frontend/src/App.js` (React Router `Routes` / `Route`).

### 1.1 공개·테스트

| path | 비고 |
|------|------|
| `/` | TabletHomepage |
| `/landing` | CounselingCenterLanding |
| `/login` | UnifiedLogin |
| `/login/tablet` | TabletLogin |
| `/register` | TabletRegister |
| `/forgot-password` | ForgotPassword |
| `/reset-password` | ResetPassword |
| `/auth/oauth2/callback` | OAuth2Callback |
| `/oauth2/callback` | OAuth2Callback |
| `/privacy` | PrivacyPolicy |
| `/terms` | TermsOfService |
| `/help` | HelpPage |
| `/test/modal` | 테스트 |
| `/test/loading` | 테스트 |
| `/test/header` | UnifiedHeader |
| `/test/notifications` | NotificationTest |
| `/test/payment` | PaymentTest |
| `/test/ios-cards` | IOSCardSample |
| `/test/design-sample` | MindGardenDesignSample |
| `/test/premium-sample` | PremiumDesignSample |
| `/test/advanced-sample` | AdvancedDesignSample |
| `/test/components` | ComponentTestPage |
| `/design-system` | MindGardenDesignSystemShowcase |
| `/filter-search` | FilterSearchShowcase |

### 1.2 대시보드·마이페이지

| path | 비고 |
|------|------|
| `/dashboard` | DynamicDashboard |
| `/client/dashboard` | ClientDashboard |
| `/consultant/dashboard` | CommonDashboard |
| `/admin/dashboard` | AdminDashboardV2 |
| `/admin/dashboard-legacy` | AdminDashboard |
| `/admin/dashboard-widget` | WidgetBasedAdminDashboard |
| `/admin/dashboard-old` | DynamicDashboard |
| `/super_admin/dashboard` | DynamicDashboard |
| `/branch_super_admin/dashboard` | DynamicDashboard |
| `/branch_manager/dashboard` | DynamicDashboard |
| `/client/mypage` | MyPage |
| `/consultant/mypage` | MyPage |
| `/admin/mypage` | MyPage |
| `/super_admin/mypage` | MyPage |
| `/branch_super_admin/mypage` | Navigate → /super_admin/mypage |
| `/branch_manager/mypage` | MyPage |

### 1.3 Admin 레이아웃(중첩)

| path | 비고 |
|------|------|
| `/admin` | AdminLayout (index → /admin/common-codes) |
| `/admin/common-codes` | TenantCommonCodeManager (중첩) |
| `/admin/menu-permissions` | MenuPermissionManagement (중첩) |
| `/admin/permission-groups` | PermissionGroupManagement (중첩) |

### 1.4 관리자 전용

| path | 비고 |
|------|------|
| `/admin/permissions` | PermissionManagement (AdminCommonLayout) |
| `/admin/user-management` | UserManagementPage |
| `/admin/mapping-management` | MappingManagement |
| `/admin/common-codes` | CommonCodeManagement (단독 라우트도 있음) |
| `/admin/sessions` | SessionManagement |
| `/admin/accounts` | AccountManagement |
| `/admin/dashboards` | DashboardManagement |
| `/admin/cache-monitoring` | CacheMonitoringDashboard |
| `/admin/security-monitoring` | SecurityMonitoringDashboard |
| `/admin/api-performance` | ApiPerformanceMonitoring |
| `/admin/system-notifications` | SystemNotificationManagement |
| `/admin/system-config` | SystemConfigManagement |
| `/admin/psych-assessments` | PsychAssessmentManagement |
| `/admin/branding` | BrandingManagementPage |
| `/admin/messages` | AdminMessages |
| `/admin/wellness` | WellnessManagement |
| `/admin/schedule` | SchedulePage |
| `/admin/schedules` | UnifiedScheduleComponent (AdminCommonLayout) |
| `/admin/statistics` | StatisticsDashboard (AdminCommonLayout) |
| `/admin/statistics-dashboard` | StatisticsDashboard (AdminCommonLayout) |
| `/admin/system` | ComingSoon |
| `/admin/logs` | ComingSoon |
| `/admin/settings` | ComingSoon |
| `/admin/consultant-comprehensive` | Navigate → /admin/user-management?type=consultant |
| `/admin/client-comprehensive` | Navigate → /admin/user-management?type=client |
| `/admin/compliance` | ComplianceMenu |
| `/admin/compliance/dashboard` | ComplianceDashboard |
| `/admin/compliance/personal-data-processing` | ComplianceDashboard |
| `/admin/compliance/impact-assessment` | ComplianceDashboard |
| `/admin/compliance/breach-response` | ComplianceDashboard |
| `/admin/compliance/education` | ComplianceDashboard |
| `/admin/compliance/policy` | ComplianceDashboard |
| `/admin/compliance/destruction` | ComplianceDashboard |
| `/admin/compliance/audit` | ComplianceDashboard |
| `/admin/branches` | BranchManagement (AdminCommonLayout) |
| `/admin/branch-create` | ComingSoon |
| `/admin/branch-hierarchy` | ComingSoon |
| `/admin/branch-managers` | ComingSoon |
| `/admin/branch-status` | ComingSoon |
| `/admin/branch-consultants` | ComingSoon |
| `/admin/erp/dashboard` | ErpDashboard |
| `/admin/erp/purchase` | PurchaseRequestForm |
| `/admin/erp/financial` | IntegratedFinanceDashboard |
| `/admin/erp/budget` | ComingSoon |
| `/admin/erp/reports` | ComingSoon |
| `/branch-super-admin/system` | ComingSoon |
| `/branch-super-admin/logs` | ComingSoon |
| `/branch-super-admin/settings` | ComingSoon |

### 1.5 상담사·내담자·공통

| path | 비고 |
|------|------|
| `/consultant/schedule` | ConsultantSchedule |
| `/consultant/schedule-new` | SchedulePage |
| `/consultant/consultation-record/:consultationId` | ConsultationRecordScreen |
| `/consultant/consultation-record-view/:recordId` | ConsultationRecordView |
| `/consultant/send-message/:consultationId` | ConsultantMessageScreen |
| `/consultant/clients` | ConsultantClientList |
| `/consultant/client/:id` | ConsultantClientList |
| `/consultant/availability` | ConsultantAvailability |
| `/consultant/consultation-records` | ConsultantRecords |
| `/consultant/reports` | ConsultantRecords |
| `/consultant/messages` | ConsultantMessages |
| `/client/messages` | ClientMessageScreen |
| `/client/schedule` | ClientSchedule |
| `/client/session-management` | ClientSessionManagement |
| `/client/payment-history` | ClientPaymentHistory |
| `/client/settings` | ClientSettings |
| `/client/activity-history` | ActivityHistory |
| `/client/wellness` | WellnessNotificationList |
| `/client/wellness/:id` | WellnessNotificationDetail |
| `/client/mindfulness-guide` | MindfulnessGuide |
| `/consultation-history` | ConsultationHistory |
| `/consultation-report` | ConsultationReport |
| `/notifications` | UnifiedNotifications |
| `/system-notifications` | SystemNotifications |
| `/schedule` | SchedulePage |
| `/super_admin/schedule` | SchedulePage |

### 1.6 ERP

| path | 비고 |
|------|------|
| `/erp/purchase` | PurchaseManagement |
| `/erp/financial` | FinancialManagement |
| `/erp/budget` | BudgetManagement |
| `/erp/tax` | ImprovedTaxManagement |
| `/erp/dashboard` | ErpDashboard |
| `/erp/purchase-requests` | PurchaseRequestForm |
| `/erp/refund-management` | RefundManagement |
| `/erp/approvals` | AdminApprovalDashboard |
| `/erp/super-approvals` | SuperAdminApprovalDashboard |
| `/erp/items` | ItemManagement |
| `/erp/budgets` | ComingSoon |
| `/erp/salary` | SalaryManagement |
| `/erp/orders` | ComingSoon |

### 1.7 테넌트·학원

| path | 비고 |
|------|------|
| `/tenant/profile` | TenantProfile |
| `/tenant/settings` | TenantProfile |
| `/academy` | AcademyDashboard |
| `/admin/academy` | AcademyDashboard |
| `/academy/register` | AcademyRegister |

### 1.8 미정의 라우트 (컴포넌트에서 사용하나 App.js에 없음)

| path | 사용처 | 비고 |
|------|--------|------|
| `/tenant/pg-configurations` | PgConfigurationList | **라우트 없음** |
| `/tenant/pg-configurations/new` | PgConfigurationCreate | **라우트 없음** |
| `/tenant/pg-configurations/:id` | PgConfigurationDetail | **라우트 없음** |
| `/tenant/pg-configurations/:id/edit` | PgConfigurationEdit | **라우트 없음** |

---

## 2. GNB 링크 현황

### 2.1 GNB 역할 구분

- **DesktopGnb** (`dashboard-v2/organisms/DesktopGnb.js`): 로고 영역 + GnbRight(검색, 캘린더, 알림, 로그아웃). **직접적인 메뉴 링크(to/href) 없음.** 로고 클릭은 상위에서 주입하지 않으면 동작 없음.
- **UnifiedHeader** (`common/UnifiedHeader.js`): 로그인/공통 헤더. 로고 클릭 → `navigate('/')`, 프로필 클릭 → `navigate(\`/${role.toLowerCase()}/mypage\`)`.
- **SimpleHamburgerMenu** (`layout/SimpleHamburgerMenu.js`): 메뉴 경로는 **백엔드 `/api/v1/menu/structure`** 에서 로드. 경로는 서버 메뉴 데이터에 의존.
- **TabletBottomNavigation** (`layout/TabletBottomNavigation.js`): 하단 탭 링크(모바일/태블릿용 GNB 대체).

### 2.2 UnifiedHeader 링크

| 링크/동작 | 사용 path | 실제 라우트 존재 | 비고 |
|-----------|-----------|------------------|------|
| 로고 클릭 | `/` | ✅ | 홈 |
| 프로필(마이페이지) | `/${role}/mypage` (예: `/admin/mypage`) | ✅ | client/consultant/admin 등 mypage 라우트 있음 |

### 2.3 TabletBottomNavigation 링크 (GNB 대체)

| 역할 | label | path | 라우트 존재 | 비고 |
|------|--------|------|-------------|------|
| CLIENT | 홈 | getLegacyDashboardPath('CLIENT') = `/client/dashboard` | ✅ | |
| CLIENT | 상담 | `/client/consultations` | ❌ | **라우트 없음** (상담 목록 페이지 미정의) |
| CLIENT | 과제 | `/client/tasks` | ❌ | **라우트 없음** |
| CLIENT | 프로필 | `/client/profile` | ❌ | 마이페이지는 `/client/mypage` 로 정의됨 |
| CONSULTANT | 홈 | `/consultant/dashboard` | ✅ | |
| CONSULTANT | 일정 | `/consultant/schedule` | ✅ | |
| CONSULTANT | 내담자 | `/consultant/clients` | ✅ | |
| CONSULTANT | 프로필 | `/consultant/profile` | ❌ | 마이페이지는 `/consultant/mypage` |
| ADMIN | 홈 | `/admin/dashboard` | ✅ | |
| ADMIN | 사용자 | `/admin/users` | ❌ | 실제 라우트는 `/admin/user-management` |
| ADMIN | 설정 | `/admin/system` | ✅ | ComingSoon |
| ADMIN | 프로필 | `/admin/profile` | ❌ | 실제 라우트는 `/admin/mypage` |

### 2.4 GNB 요약

- **UnifiedHeader**: 문제 없음.
- **TabletBottomNavigation**: `/client/consultations`, `/client/tasks`, `/client/profile`, `/consultant/profile`, `/admin/users`, `/admin/profile` 가 실제 라우트와 불일치하거나 없음.

---

## 3. LNB 링크 현황

LNB 메뉴 소스: `frontend/src/components/dashboard-v2/constants/menuItems.js` (및 API 폴백 시 `getLnbMenus()` → `normalizeLnbTree()`).

### 3.1 DEFAULT_MENU_ITEMS (어드민 LNB 폴백)

| 구분 | label | path (to) | 라우트 존재 | 비고 |
|------|--------|------------|-------------|------|
| 메인 | 대시보드 | `/admin/dashboard-v2` | ❌ | **실제 라우트는 `/admin/dashboard`** (오타/이름 불일치) |
| 메인 | 매칭 관리 | `/admin/mapping-management` | ✅ | |
| 메인 | 사용자/권한 | `/admin/user-management` | ✅ | |
| 서브 | 사용자 관리 | `/admin/user-management` | ✅ | |
| 서브 | 권한 관리 | `/admin/permissions` | ✅ | |
| 서브 | 계좌 관리 | `/admin/accounts` | ✅ | |
| 메인 | ERP 관리 | `/erp/dashboard` | ✅ | |
| 서브 | ERP 대시보드 | `/erp/dashboard` | ✅ | |
| 서브 | 구매 관리 | `/erp/purchase` | ✅ | |
| 서브 | 재무 관리 | `/erp/financial` | ✅ | |
| 서브 | 예산 관리 | `/erp/budget` | ✅ | |
| 서브 | 세무 관리 | `/erp/tax` | ✅ | |
| 메인 | 설정 | `/tenant/profile` | ✅ | |
| 서브 | 테넌트 프로필 | `/tenant/profile` | ✅ | |
| 서브 | 시스템 설정 | `/admin/system-config` | ✅ | |
| 서브 | 공통코드 | `/admin/common-codes` | ✅ | |
| 서브 | PG 설정 | `/tenant/profile` | ✅ | 선택 B 적용: 라우트 없는 pg-configurations 대신 테넌트 프로필로 연결 |
| 메인 | 보고서 | `/admin/statistics` | ✅ | |
| 서브 | 통계 | `/admin/statistics` | ✅ | |
| 서브 | 컴플라이언스 | `/admin/compliance` | ✅ | |
| 메인 | 알림 | `/admin/system-notifications` | ✅ | |

### 3.2 CLIENT_MENU_ITEMS

| label | path | 라우트 존재 | 비고 |
|--------|------|-------------|------|
| 대시보드 | `/client/dashboard` | ✅ | |
| 스케줄 | `/client/schedule` | ✅ | |
| 회기 관리 | `/client/session-management` | ✅ | |
| 결제 내역 | `/client/payment-history` | ✅ | |
| 설정 | `/client/settings` | ✅ | |

### 3.3 CONSULTANT_MENU_ITEMS

| label | path | 라우트 존재 | 비고 |
|--------|------|-------------|------|
| 대시보드 | `/consultant/dashboard` | ✅ | |
| 스케줄 | `/consultant/schedule` | ✅ | |
| 상담 기록 | `/consultant/consultation-records` | ✅ | |
| 가능 시간 | `/consultant/availability` | ✅ | |
| 메시지 | `/consultant/messages` | ✅ | |

### 3.4 ERP_MENU_ITEMS

| label | path | 라우트 존재 | 비고 |
|--------|------|-------------|------|
| ERP 대시보드 | `/erp/dashboard` | ✅ | |
| 구매 관리 | `/erp/purchase` | ✅ | |
| 재무 관리 | `/erp/financial` | ✅ | |
| 예산 관리 | `/erp/budget` | ✅ | (ComingSoon) |
| 세무 관리 | `/erp/tax` | ✅ | |

### 3.6 LNB 요약

- **DEFAULT_MENU_ITEMS**: `/admin/dashboard-v2` → `/admin/dashboard` 로 수정 필요. PG 설정은 `/tenant/profile` 로 연결(선택 B 적용).
- **CLIENT/CONSULTANT/ERP 메뉴**: 모두 실제 라우트와 일치.

---

## 4. 불일치/오류 목록

### 4.1 라우트 없음 (메뉴/링크는 있는데 App.js에 Route 없음)

| path | 사용처 | 조치 |
|------|--------|------|
| `/tenant/pg-configurations` | PgConfigurationList, LNB "PG 설정" 기대 경로 | App.js에 Route 추가 또는 LNB를 기존 tenant 라우트에 맞춤 |
| `/tenant/pg-configurations/new` | PgConfigurationCreate | 동일 |
| `/tenant/pg-configurations/:id` | PgConfigurationDetail | 동일 |
| `/tenant/pg-configurations/:id/edit` | PgConfigurationEdit | 동일 |
| `/client/consultations` | TabletBottomNavigation (CLIENT 상담) | 라우트 추가 또는 탭에서 다른 경로로 변경 |
| `/client/tasks` | TabletBottomNavigation (CLIENT 과제) | 라우트 추가 또는 탭에서 제거/대체 |
| `/admin/dashboard-v2` | DEFAULT_MENU_ITEMS "대시보드" | 라우트는 `/admin/dashboard` 하나만 있음 → 메뉴 path 수정 권장 |

### 4.2 path 오타/불일치

| 메뉴/상수에서 사용 | 실제 라우트 | 위치 |
|-------------------|-------------|------|
| `/admin/dashboard-v2` | `/admin/dashboard` | menuItems.js DEFAULT_MENU_ITEMS |
| `/tenant/pg-configuration` (단수) | (없음, 컴포넌트는 `/tenant/pg-configurations` 사용) | menuItems.js DEFAULT_MENU_ITEMS |
| `/admin/users` | `/admin/user-management` | TabletBottomNavigation, constants/adminRoutes.js USERS |
| `/admin/profile` | `/admin/mypage` | TabletBottomNavigation |
| `/client/profile` | `/client/mypage` | TabletBottomNavigation |
| `/consultant/profile` | `/consultant/mypage` | TabletBottomNavigation |

### 4.3 중복·이중 정의

- `/admin/common-codes`: 중첩 라우트(`/admin` 하위)와 단독 라우트 둘 다 존재. 동작은 하되, 한쪽으로 통일하면 유지보수에 유리.

### 4.4 백엔드 메뉴 API와의 관계

- **LNB**: `getLnbMenus()` → `/api/v1/menus/lnb` 에서 메뉴 트리 조회. 실패 시 프론트 `DEFAULT_MENU_ITEMS` 사용.
- **햄버거 메뉴**: `loadMenuStructure()` → `/api/v1/menu/structure` 에서 메뉴 구조 로드. 표시되는 path는 백엔드 메뉴 데이터에 따름.
- 백엔드 메뉴의 `menuPath`가 위 "실제 라우트 목록"과 다르면 동일한 불일치가 발생할 수 있음. **백엔드 메뉴 마스터/시드 데이터의 path도 위 표와 맞추는 것이 좋음.**

---

## 5. 수정 권장 사항 (우선순위별)

### 우선순위 1 (즉시 수정 권장)

1. **LNB 대시보드 링크**
   - **파일**: `frontend/src/components/dashboard-v2/constants/menuItems.js`
   - **변경**: `DEFAULT_MENU_ITEMS` 첫 번째 항목 `to: '/admin/dashboard-v2'` → `to: '/admin/dashboard'`
   - **이유**: 어드민 LNB "대시보드" 클릭 시 404 방지.

2. **TabletBottomNavigation 관리자 탭**
   - **파일**: `frontend/src/components/layout/TabletBottomNavigation.js`
   - **변경**:  
     - "사용자" `/admin/users` → `/admin/user-management`  
     - "프로필" `/admin/profile` → `/admin/mypage`
   - **이유**: 실제 라우트와 일치시켜 404 및 빈 페이지 방지.

3. **TabletBottomNavigation 프로필 경로 통일**
   - **파일**: 동일
   - **변경**:  
     - CLIENT "프로필" `/client/profile` → `/client/mypage`  
     - CONSULTANT "프로필" `/consultant/profile` → `/consultant/mypage`
   - **이유**: 마이페이지 라우트는 역할별 `/mypage` 로만 정의되어 있음.

### 우선순위 2 (라우트 추가 또는 메뉴 정리)

4. **PG 설정 라우트 및 LNB**
   - **선택 A**: `App.js`에 `/tenant/pg-configurations`, `/tenant/pg-configurations/new`, `/tenant/pg-configurations/:id`, `/tenant/pg-configurations/:id/edit` 추가 후, LNB의 "PG 설정"을 `to: '/tenant/pg-configurations'` 로 변경.
   - **선택 B**: PG 설정을 테넌트 프로필/설정 내 탭으로만 제공한다면 LNB에서 "PG 설정" 항목을 제거하거나 `to: '/tenant/profile'` 등으로 연결.
   - **현재**: LNB는 `/tenant/pg-configuration` (단수), 컴포넌트는 `/tenant/pg-configurations` (복수) 사용, App.js에는 해당 라우트 없음.

5. **TabletBottomNavigation CLIENT "상담"·"과제"**
   - `/client/consultations`, `/client/tasks` 에 해당하는 페이지/라우트가 없으면:
     - 해당 기능이 있으면: `App.js`에 라우트 추가 후 연결.
     - 없으면: 탭에서 제거하거나 "준비 중" 등으로 대체.

### 우선순위 3 (일관성·유지보수)

6. **adminRoutes.js**
   - **파일**: `frontend/src/constants/adminRoutes.js`
   - **내용**: `ADMIN_ROUTES.USERS` 가 `/admin/users` 로 되어 있음. 실제 사용처가 "사용자 관리" 페이지라면 `/admin/user-management` 로 맞추는 것이 좋음. (다른 코드에서 `ADMIN_ROUTES.USERS`를 "사용자 관리" 페이지로만 사용하는지 확인 후 변경.)

7. **중첩 라우트 정리**
   - `/admin/common-codes` 를 중첩만 사용할지, 단독만 사용할지 정한 뒤 한쪽 정의 제거하여 혼동 방지.

8. **백엔드 메뉴 path 검증**
   - `/api/v1/menus/lnb`, `/api/v1/menu/structure` 응답의 `menuPath` 값을 위 "1. 현재 프론트엔드 라우트 목록"과 대조해 불일치 항목 수정. (DB/시드 또는 관리 화면에서 path 수정.)

---

## 6. 참고 파일 목록

| 구분 | 파일 경로 |
|------|-----------|
| 라우트 정의 | `frontend/src/App.js` |
| LNB 기본 메뉴 | `frontend/src/components/dashboard-v2/constants/menuItems.js` |
| LNB 렌더 | `frontend/src/components/dashboard-v2/organisms/DesktopLnb.js`, `MobileLnbDrawer.js` |
| LNB API 정규화 | `frontend/src/utils/lnbMenuUtils.js` |
| 메뉴 API | `frontend/src/utils/menuApi.js` (getLnbMenus 등) |
| GNB(데스크톱) | `frontend/src/components/dashboard-v2/organisms/DesktopGnb.js` |
| 통합 헤더 | `frontend/src/components/common/UnifiedHeader.js` |
| 햄버거 메뉴 | `frontend/src/components/layout/SimpleHamburgerMenu.js` |
| 하단 탭(모바일) | `frontend/src/components/layout/TabletBottomNavigation.js` |
| 관리자 라우트 상수 | `frontend/src/constants/adminRoutes.js` |
| 메뉴 상수(레거시) | `frontend/src/constants/menu.js` |

---

## 참조 (문서관리)

- **문서 위치 체계**: `.cursor/skills/core-solution-documentation/SKILL.md` — 표준·가이드는 `docs/standards/`, 파일명은 `*_GUIDE.md` 또는 `*_STANDARD.md`.
- **표준 문서 목록**: [docs/standards/README.md](./README.md).

---

## 7. 수정 이력

| 일자 | 적용 내용 |
|------|-----------|
| 2026-02-25 | **우선순위 1** 반영: LNB `dashboard-v2` → `dashboard`, LNB PG 설정 `pg-configuration` → `pg-configurations`, TabletBottomNavigation ADMIN/CLIENT/CONSULTANT profile→mypage, users→user-management, CLIENT 상담/과제 → schedule/session-management, adminRoutes.js USERS → user-management |
| 2026-02-25 | HQ 메뉴 전면 삭제(LNB·라우트·리다이렉트), PG 설정 링크를 `/tenant/profile` 로 변경 |
| 2026-02-25 | 문서관리 규칙 적용: `docs/standards/GNB_LNB_LINK_AUDIT_GUIDE.md` 로 이동, 개요·목차·참조 추가 |
