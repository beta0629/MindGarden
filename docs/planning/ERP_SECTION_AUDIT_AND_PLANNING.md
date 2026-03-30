# ERP 섹션 전방위 점검 및 기획 종합 문서

**작성일**: 2025-03-04  
**목적**: ERP 메뉴 전반 오류 원인(tenant 미적용 등) 점검, 불필요/추가 메뉴 정리, 수정 우선순위 및 서브에이전트 실행 계획 정리

---

## 1. ERP 현황·메뉴 목록

### 1.1 프론트엔드 라우트 (App.js 기준)

| 경로 | 컴포넌트 | 비고 |
|------|----------|------|
| `/erp/purchase` | PurchaseManagement | 구매 관리 |
| `/erp/financial` | FinancialManagement | 재무 관리 |
| `/erp/budget` | BudgetManagement | 예산 관리 |
| `/erp/tax` | ImprovedTaxManagement | 세무 관리 |
| `/erp/dashboard` | ErpDashboard | ERP 대시보드 |
| `/erp/purchase-requests` | PurchaseRequestForm | 구매 요청 |
| `/erp/refund-management` | RefundManagement | 환불 관리 |
| `/erp/approvals` | AdminApprovalDashboard | 구매 승인(관리자) |
| `/erp/super-approvals` | SuperAdminApprovalDashboard | 구매 승인(슈퍼관리자) |
| `/erp/items` | ItemManagement | 아이템 관리 |
| `/erp/budgets` | ComingSoon | 예산(대체 라우트) |
| `/erp/salary` | SalaryManagement | 급여 관리 |
| `/erp/orders` | ComingSoon | 주문 관리 |
| `/admin/erp/dashboard` | ErpDashboard | Admin ERP 대시보드 |
| `/admin/erp/purchase` | PurchaseRequestForm | Admin 구매 |
| `/admin/erp/financial` | IntegratedFinanceDashboard | Admin 통합 재무 |
| `/admin/erp/budget` | ComingSoon | Admin 예산 |
| `/admin/erp/reports` | ComingSoon | ERP 보고서 |

### 1.2 LNB 메뉴 (menuItems.js / ERP_MENU_ITEMS)

- **ERP 관리** (children): ERP 대시보드, 구매 관리, 재무 관리, 예산 관리, 세무 관리  
- 경로: `/erp/dashboard`, `/erp/purchase`, `/erp/financial`, `/erp/budget`, `/erp/tax`

### 1.3 위젯·기타 진입점

- **ErpManagementGridWidget**: `/erp/dashboard`, `/erp/financial-management`, `/erp/purchase-management`, `/erp/budget-management`, `/erp/quick-expense-form`, `/erp/reports`, `/erp/tax-management`, `/erp/analytics`, `/erp/settings` (일부 경로는 실제 라우트와 불일치)
- **ErpStatsGridWidget**: `/api/v1/erp/dashboard/statistics` 호출, 클릭 시 `/erp/dashboard` 등
- **AdminDashboard**: 카드 클릭 시 `/erp/dashboard`, `/erp/purchase-requests`, `/erp/approvals`, `/erp/super-approvals`, `/erp/items`, `/erp/budgets`, `/erp/orders`

### 1.4 백엔드 ERP API 목록 (컨트롤러 기준)

- **ErpController** `@RequestMapping("/api/v1/erp")`: items, purchase-requests, purchase-orders, budgets, stats, debug/transactions, finance/dashboard, finance/statistics, finance/category-analysis, finance/daily-report, finance/monthly-report, finance/yearly-report, finance/balance-sheet, finance/income-statement, finance/transactions, finance/quick-expense, finance/quick-income, recurring-expenses, common-codes/financial 등
- **AccountingController** `/api/v1/erp/accounting/entries`: 분개 CRUD, approve, post
- **LedgerController** `/api/v1/erp/accounting/ledgers`: 계정별/기간별/잔액 조회
- **FinancialStatementController** `/api/v1/erp/accounting/statements`: 손익계산서, 재무상태표, 현금흐름
- **SettlementController** `/api/v1/erp/settlement`: 정산 규칙, 계산, 결과, 승인
- **HQErpController** `/api/v1/hq/erp`: branch-financial, consolidated, reports (본사/지점 재무)

**주의**: 백엔드는 전부 **`/api/v1/erp`** 또는 `/api/v1/hq/erp`만 노출. **`/api/erp`** prefix 매핑은 없음 (SecurityConfig·DynamicPermissionServiceImpl에서 `/api/erp/**` 패턴만 참조).

---

## 2. 테넌트 사용 점검 결과

### 2.1 테넌트 적용이 잘 된 부분

| 영역 | 내용 |
|------|------|
| **AccountingController** | `TenantContextHolder.getRequiredTenantId()` 사용 후 서비스에 tenantId 전달 |
| **LedgerController** | 동일 |
| **FinancialStatementController** | 동일 |
| **SettlementController** | 동일 |
| **ErpServiceImpl** | `BaseTenantAwareService` 상속, `getTenantId()` → `TenantContextHolder.getRequiredTenantId()` 사용, Item/Budget/PurchaseRequest 등 Repository 호출 시 tenantId 필터 적용 |
| **FinancialTransactionRepository** | `findByTenantId*` 계열 메서드 다수, Deprecated 무테넌트 메서드 주석으로 위험 표시 |
| **ItemRepository** | `findAllActiveByTenantId`, `findByTenantIdAndIdAndActive` 등 tenant 필터 적용 |
| **Session/Tenant 설정** | `SessionBasedAuthenticationFilter`, `TenantContextFilter`에서 로그인/세션 기반으로 `TenantContextHolder.setTenantId()` 호출 |

### 2.2 테넌트 미적용·잘못 사용 가능 지점 (오류 후보)

| 위치 | 파일/엔드포인트 | 내용 |
|------|-----------------|------|
| **ErpController** | `getAllItems()` | `TenantContextHolder.getTenantId()`(nullable)만 로깅에 사용. 실제 필터링은 `ErpServiceImpl.getTenantId()`(getRequiredTenantId)에서 수행. 필터에서 tenant 미설정 시 **getRequiredTenantId()에서 예외** 가능. |
| **ErpController** | `getFinanceDashboard()` | 세션에서 tenantId 취득 후 null이면 400 반환하나, **서비스 호출 시 "임시로 null 전달 (Service에서 tenantId 사용하도록 변경 필요)"** 주석 존재 → 하위 서비스가 null 받으면 500 가능. |
| **ErpController** | `getBranchFinanceStatistics()`, `getCategoryAnalysis()`, `getDailyFinanceReport()`, `getMonthlyFinanceReport()`, `getYearlyFinanceReport()`, `getIncomeStatement()` | 동일하게 **레거시 호환으로 null 전달** 주석. TenantContextHolder는 설정한 뒤 clear()하지만, 실제 서비스 인자로 null이 넘어가는지 여부 확인 필요. |
| **ErpController** | `createTransaction()`, `getTransactions()`, `quickExpense()`, `quickIncome()` | `TenantContextHolder.getTenantId()`(nullable) 사용. **null이면 서비스/Repository에서 findByTenantId(null) 호출 가능** → 500 또는 데이터 오염. |
| **ErpController** | `getDebugTransactions()` | `TenantContextHolder.getTenantId()`만 사용, null 시 필터링 없이 전체 조회 가능성. |
| **HQErpController** | `getBranchFinancialData()` | **tenantId 미사용**. `branchCode` 기반 조회만 수행. 멀티테넌트 정책상 지점=테넌트라면 tenantId와 매핑 필요. |
| **FinancialTransactionRepository** | `findByIsDeletedFalse()`, `findByCategoryAndIsDeletedFalse()` 등 **Deprecated** 메서드 | tenantId 없이 조회. 어디서도 호출하지 않도록 유지·점검 필요. |

### 2.3 프론트엔드 API 경로 불일치 (404/호출 실패 가능)

백엔드는 **`/api/v1/erp`** 만 노출하는데, 아래는 **`/api/erp`** 사용 → **404 가능**.

| 파일 | 사용 경로 | 권장 |
|------|-----------|------|
| BudgetManagement.js | `apiPut(\`/api/erp/budgets/${id}\`)`, `apiDelete(\`/api/erp/budgets/${id}\`)` | `/api/v1/erp/budgets/${id}` |
| ItemManagement.js | `apiPut(\`/api/erp/items/${id}\`)`, `apiDelete(\`/api/erp/items/${id}\`)` | `/api/v1/erp/items/${id}` |
| AdminApprovalDashboard.js | `fetch(\`/api/erp/purchase-requests/${id}/approve-admin\`)`, reject 동일 | `/api/v1/erp/purchase-requests/${id}/approve-admin` |
| SuperAdminApprovalDashboard.js | `fetch(\`/api/erp/purchase-requests/${id}/approve-super-admin\`)`, reject 동일 | `/api/v1/erp/purchase-requests/...` |
| ErpReportModal.js | `apiGet(\`/api/erp/reports?${params}\`)`, `fetch(\`/api/erp/reports/download?${params}\`)` | 백엔드에 `/api/v1/erp/reports` 없음 → 구현 또는 HQ 경로(`/api/v1/hq/erp/reports`) 연동 검토 |
| ErpPurchaseRequestPanel.js | `apiGet(\`/api/erp/purchase-requests/requester/${user.id}\`)` | `/api/v1/erp/purchase-requests/requester/${user.id}` |
| ErpPurchaseRequestWidget.js | 동일 | 동일 |
| PurchaseRequestWidget.js | 동일 | 동일 |
| FinancialManagement.js | `fetch(\`/api/erp/finance/transactions/${id}\`)` (DELETE 등) | `/api/v1/erp/finance/transactions/${id}` |

---

## 3. 오류 가능 지점 및 수정 제안

### 3.1 디버거 관점 (500/오류 원인 의심)

- **tenantId null로 Repository 호출**: `TenantContextHolder.getTenantId()`가 null인 상태에서 서비스가 `findByTenantId(tenantId)` 호출 시 DB/JPQL에서 500 또는 예외. **대응**: 컨트롤러 진입 시 tenantId 검증 후 없으면 403/400 반환, 서비스에서는 `getRequiredTenantId()` 사용 또는 null이면 예외 throw.
- **재무 대시보드/통계/리포트 계열**: 주석상 "임시로 null 전달"인 서비스 메서드 인자 확인. null 전달 시 하위에서 `findByTenantId(null)` 호출 여부 확인 후, **반드시 tenantId 전달**로 수정.
- **ErpController.getItem 등**: ErpServiceImpl은 getRequiredTenantId() 사용으로, **필터에서 TenantContext 미설정**이면 요청 시 예외 발생. 세션 로그인 플로우에서 TenantContext 설정이 항상 선행되는지 확인 필요.

### 3.2 코더 관점 (일관된 패턴 제안)

- **컨트롤러**: ERP 진입 시 `TenantContextHolder.getTenantId()` 또는 세션 tenantId 검증 후, null/빈값이면 즉시 403/400 반환. 필요 시 `TenantContextHolder.setTenantId(tenantId)` 설정 후 서비스 호출.
- **서비스**: tenantId는 항상 `TenantContextHolder.getRequiredTenantId()` 또는 컨트롤러에서 넘긴 값만 사용. Repository에는 **null을 넘기지 않음**.
- **프론트**: 모든 ERP API 호출을 **`/api/v1/erp`** 로 통일. `constants/api.js`의 `ERP_API` 및 페이지별 하드코딩 경로를 `/api/v1/erp` 기준으로 정리.
- **StandardizedApi**: ERP 호출 시 X-Tenant-Id/세션 기반 tenant 전달이 되도록 이미 되어 있는지 확인. 없으면 표준 API 유틸 사용으로 통일.

### 3.3 탐색(explore) 관점 요약

- **백엔드 경로**: `consultation/controller/erp/` (ErpController, AccountingController, LedgerController, FinancialStatementController, SettlementController), `consultation/controller/HQErpController.java`.
- **프론트 경로**: `frontend/src/components/erp/` (대부분 ERP 페이지), `frontend/src/components/dashboard/widgets/erp/`, `dashboard-v2/constants/menuItems.js` (ERP_MENU_ITEMS).
- **tenant 사용 패턴**: Controller 일부는 `getTenantId()`(nullable), 일부는 세션에서 가져와 set 후 `getRequiredTenantId()`; Service는 BaseTenantAwareService로 getRequiredTenantId() 일관 사용. Repository는 tenantId 파라미터 필수 메서드와 Deprecated 무테넌트 메서드 혼재.

---

## 4. 디자인·레이아웃 회의 (불필요/추가 메뉴, 레이아웃 제안)

### 4.1 불필요한 메뉴 (제거 또는 접기 권장)

| 메뉴/경로 | 권장 | 이유 |
|-----------|------|------|
| **예산 관리** `/erp/budgets` vs `/erp/budget` | 하나로 통합 | 라우트가 `/erp/budget`(BudgetManagement)와 `/erp/budgets`(ComingSoon) 이중화. LNB는 `/erp/budget` 사용. `/erp/budgets`는 ComingSoon이므로 실제 기능은 BudgetManagement 한 경로로 통합. |
| **주문 관리** `/erp/orders` | ComingSoon 유지 또는 메뉴에서 숨김 | 현재 ComingSoon. 사용하지 않으면 LNB/위젯에서 제거하거나 "준비 중" 접기. |
| **ERP 설정/분석/리포트** (위젯 내 링크) | 실제 라우트와 맞추기 | 위젯은 `/erp/settings`, `/erp/analytics`, `/erp/reports` 등으로 링크하나, App.js에는 해당 라우트 없음. 메뉴 노출 시 실제 페이지 또는 ComingSoon으로 연결. |
| **Admin ERP 중복 라우트** `/admin/erp/*` | 정리 | `/erp/*`와 역할이 겹침. 어드민 전용 화면(IntegratedFinanceDashboard 등)만 `/admin/erp/` 유지하고, 나머지는 `/erp/`로 통일해도 됨. |

### 4.2 추가해야 할 메뉴

- **현재 없음.**  
  필요 시: "ERP 보고서" 메뉴를 실제 구현(`/api/v1/erp/reports` 또는 HQ 연동) 후 `/erp/reports`로 연결하는 것은 추후 검토.

### 4.3 레이아웃 제안 (간단)

- **사이드바/탭**: ERP는 LNB에서 "ERP 관리" 하위 5개(대시보드, 구매, 재무, 예산, 세무) 유지. 내부 화면은 기존처럼 탭/카드 레이아웃 유지 가능.
- **권한별 노출**: ERP_ACCESS 권한이 있을 때만 ERP 메뉴/위젯 노출 (이미 MenuService, DynamicPermissionService에서 ERP_ACCESS·ADM_ERP 처리).
- **어드민 공통 레이아웃**: 신규/개선 ERP 페이지는 **AdminCommonLayout** 사용 권장 (기획 스킬 §0.2.1). 현재 일부 ERP 페이지는 자체 헤더/컨테이너만 쓰고 있음 → 통일 시 LNB/GNB와 일관성 확보.
- **반응형**: 목록·카드는 카드형/그리드로 반응형 유지.

---

## 5. 다음 단계 (수정 작업 우선순위)

### Phase 1: tenant 안정화 (우선)

1. **ErpController**  
   - 재무 대시보드/통계/리포트/손익계산서 등에서 "임시로 null 전달"하는 서비스 호출 제거. **tenantId를 세션/Context에서 취득해 서비스에 반드시 전달.**  
   - `getTenantId()`만 쓰는 메서드: tenantId null이면 403/400 반환 후 서비스 호출 금지.  
   - (선택) 진입 시 `TenantContextHolder.setTenantId(sessionTenantId)`로 통일해, 서비스는 getRequiredTenantId()만 사용하도록 정리.

2. **HQErpController**  
   - 지점별 재무가 테넌트 단위와 매핑되는 정책이면, **tenantId 기반 조회**로 보강. branchCode만으로 조회 시 테넌트 격리 위반 가능성 점검.

3. **Repository**  
   - Deprecated 무테넌트 메서드 호출처가 없음 확인. 있으면 제거 후 tenantId 필수 메서드로 교체.

**실행**: core-debugger로 500 재현·로그 확인 후, core-coder로 위 수정 적용.

### Phase 2: API 경로 통일 (프론트)

4. **프론트엔드**  
   - BudgetManagement, ItemManagement, AdminApprovalDashboard, SuperAdminApprovalDashboard, ErpReportModal, ErpPurchaseRequestPanel, ErpPurchaseRequestWidget, PurchaseRequestWidget, FinancialManagement 등에서 **`/api/erp` → `/api/v1/erp`** 로 일괄 변경.  
   - ErpReportModal: `/api/v1/erp/reports` 미구현 시, 임시 비활성화 또는 HQ `/api/v1/hq/erp/reports` 연동 검토.

**실행**: core-coder. 참조: `frontend/src/constants/api.js` ERP_API, StandardizedApi 사용.

### Phase 3: 메뉴·라우트 정리

5. **라우트 정리**  
   - `/erp/budgets` vs `/erp/budget` 통합. ComingSoon인 `/erp/budgets` 제거 또는 `/erp/budget`으로 리다이렉트.  
   - 위젯 링크(`/erp/settings`, `/erp/analytics`, `/erp/reports`)를 실제 라우트 또는 ComingSoon 페이지와 맞춤.

6. **레이아웃**  
   - ERP 주요 페이지에 AdminCommonLayout 적용 검토 (선택, 디자이너·코더 협의).

**실행**: core-coder + (레이아웃 변경 시) core-designer.

### Phase 4: 테스트·검증

7. **테넌트 격리**  
   - 테넌트 A/B로 로그인해 ERP 항목(아이템, 구매요청, 재무, 예산) 조회/등록 시 A 데이터만 보이는지 확인.  
   - tenantId 없이 호출 시 403/400 반환하는지 확인.

8. **E2E**  
   - ERP 메뉴 접근 → 목록 조회 → 일부 등록/수정 시나리오 (core-tester 활용).

---

## 6. 서브에이전트 실행 위임 요약

| Phase | 담당 | 전달할 태스크 요약 |
|-------|------|---------------------|
| 1 | **core-debugger** | ERP 500 재현 절차, ErpController 재무 대시보드/통계/리포트 호출 시 tenantId null 전달 여부·로그 확인, 수정 제안서 작성. |
| 1 | **core-coder** | ErpController/HQErpController tenant 주입·null 검증 추가, 서비스에 tenantId 필수 전달. Deprecated Repository 호출 제거. |
| 2 | **core-coder** | 프론트 ERP API 경로 `/api/erp` → `/api/v1/erp` 통일 (BudgetManagement, ItemManagement, AdminApprovalDashboard, SuperAdminApprovalDashboard, ErpReportModal, ErpPurchaseRequestPanel, ErpPurchaseRequestWidget, PurchaseRequestWidget, FinancialManagement). |
| 3 | **core-coder** | ERP 라우트·메뉴 정리 (/erp/budgets 통합, 위젯 링크와 실제 경로 일치). 필요 시 core-designer와 레이아웃(AdminCommonLayout) 검토. |
| 4 | **core-tester** | ERP 테넌트 격리 시나리오 및 E2E (메뉴 접근, 목록, 등록/수정) 테스트 작성·실행. |

**실행 순서 권장**: Phase 1 (debugger → coder) → Phase 2 (coder) → Phase 3 (coder) → Phase 4 (tester).  
기획만 수행하며, 실제 호출은 부모 에이전트 또는 사용자가 수행합니다.
