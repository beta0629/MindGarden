# ERP 컴포넌트 분석 및 위젯화 계획

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: ERP 관련 모든 컴포넌트를 분석하고 위젯화 계획 수립

---

## 📋 ERP 컴포넌트 전체 목록

### 1. 대시보드/메인 컴포넌트

| 컴포넌트 | 파일 경로 | 설명 | 위젯화 필요 | 우선순위 |
|---------|----------|------|------------|---------|
| `ErpDashboard` | `erp/ErpDashboard.js` | ERP 메인 대시보드 (통계 카드, 빠른 액션) | ✅ 필요 | 높음 |
| `IntegratedFinanceDashboard` | `erp/IntegratedFinanceDashboard.js` | 통합 재무 대시보드 | ✅ 필요 | 높음 |
| `AdminApprovalDashboard` | `erp/AdminApprovalDashboard.js` | 관리자 승인 대시보드 | ✅ 필요 | 중간 |
| `SuperAdminApprovalDashboard` | `erp/SuperAdminApprovalDashboard.js` | 수퍼 관리자 승인 대시보드 | ✅ 필요 | 중간 |

### 2. 관리 페이지 컴포넌트

| 컴포넌트 | 파일 경로 | 설명 | 위젯화 필요 | 우선순위 |
|---------|----------|------|------------|---------|
| `FinancialManagement` | `erp/FinancialManagement.js` | 재무 관리 (거래 내역, 대시보드) | ✅ 필요 | 높음 |
| `PurchaseManagement` | `erp/PurchaseManagement.js` | 구매 관리 (아이템, 요청, 주문) | ✅ 필요 | 높음 |
| `BudgetManagement` | `erp/BudgetManagement.js` | 예산 관리 | ✅ 필요 | 중간 |
| `ItemManagement` | `erp/ItemManagement.js` | 아이템 관리 | ✅ 필요 | 중간 |
| `TaxManagement` | `erp/TaxManagement.js` | 세금 관리 | ✅ 필요 | 중간 |
| `SalaryManagement` | `erp/SalaryManagement.js` | 급여 관리 | ✅ 필요 | 중간 |
| `RefundManagement` | `erp/RefundManagement.js` | 환불 관리 | ✅ 필요 | 중간 |
| `ImprovedTaxManagement` | `erp/ImprovedTaxManagement.js` | 개선된 세금 관리 | ✅ 필요 | 낮음 |

### 3. 폼 컴포넌트

| 컴포넌트 | 파일 경로 | 설명 | 위젯화 필요 | 우선순위 |
|---------|----------|------|------------|---------|
| `PurchaseRequestForm` | `erp/PurchaseRequestForm.js` | 구매 요청 폼 | ⚠️ 부분 | 낮음 |
| `FinancialTransactionForm` | `erp/FinancialTransactionForm.js` | 재무 거래 폼 | ⚠️ 부분 | 낮음 |
| `QuickExpenseForm` | `erp/QuickExpenseForm.js` | 빠른 지출 폼 | ⚠️ 부분 | 낮음 |
| `SalaryProfileFormModal` | `erp/SalaryProfileFormModal.js` | 급여 프로필 폼 모달 | ❌ 불필요 | 낮음 |
| `SalaryConfigModal` | `erp/SalaryConfigModal.js` | 급여 설정 모달 | ❌ 불필요 | 낮음 |

### 4. 뷰 컴포넌트

| 컴포넌트 | 파일 경로 | 설명 | 위젯화 필요 | 우선순위 |
|---------|----------|------|------------|---------|
| `FinancialCalendarView` | `erp/FinancialCalendarView.js` | 재무 캘린더 뷰 | ✅ 필요 | 중간 |

### 5. 환불 관련 컴포넌트 (refund 폴더)

| 컴포넌트 | 파일 경로 | 설명 | 위젯화 필요 | 우선순위 |
|---------|----------|------|------------|---------|
| `RefundStatsCards` | `erp/refund/RefundStatsCards.js` | 환불 통계 카드 | ✅ 필요 | 중간 |
| `RefundReasonStats` | `erp/refund/RefundReasonStats.js` | 환불 사유 통계 | ✅ 필요 | 낮음 |
| `RefundHistoryTable` | `erp/refund/RefundHistoryTable.js` | 환불 이력 테이블 | ✅ 필요 | 중간 |
| `RefundFilters` | `erp/refund/RefundFilters.js` | 환불 필터 | ⚠️ 부분 | 낮음 |
| `RefundAccountingStatus` | `erp/refund/RefundAccountingStatus.js` | 환불 회계 상태 | ✅ 필요 | 중간 |
| `ErpSyncStatus` | `erp/refund/ErpSyncStatus.js` | ERP 동기화 상태 | ✅ 필요 | 중간 |

### 6. 공통 컴포넌트 (common 폴더)

| 컴포넌트 | 파일 경로 | 설명 | 위젯화 상태 |
|---------|----------|------|------------|
| `ErpHeader` | `erp/common/ErpHeader.js` | ERP 헤더 | ✅ 완료 (ErpCardWidget로 활용 가능) |
| `ErpCard` | `erp/common/ErpCard.js` | ERP 카드 | ✅ 완료 (ErpCardWidget) |
| `ErpButton` | `erp/common/ErpButton.js` | ERP 버튼 | ❌ 위젯화 불필요 (공통 컴포넌트) |
| `ErpModal` | `erp/common/ErpModal.js` | ERP 모달 | ❌ 위젯화 불필요 (공통 컴포넌트) |

### 7. 기타 컴포넌트

| 컴포넌트 | 파일 경로 | 설명 | 위젯화 필요 |
|---------|----------|------|------------|
| `ErpReportModal` | `erp/ErpReportModal.js` | ERP 보고서 모달 | ❌ 불필요 |
| `ConsultantProfileModal` | `erp/ConsultantProfileModal.js` | 상담사 프로필 모달 | ❌ 불필요 |

---

## 🎯 위젯화 우선순위

### 높은 우선순위 (즉시 위젯화 필요)

1. **ErpDashboard** → `erp-dashboard` 위젯
   - 통계 카드 그리드
   - 빠른 액션 섹션
   - 최근 활동

2. **IntegratedFinanceDashboard** → `integrated-finance-dashboard` 위젯
   - 통합 재무 통계
   - 수입/지출 차트
   - 거래 내역

3. **FinancialManagement** → `financial-management` 위젯
   - 재무 거래 목록
   - 재무 대시보드 통계
   - 필터 및 검색

4. **PurchaseManagement** → `purchase-management` 위젯
   - 아이템 목록
   - 구매 요청 목록
   - 구매 주문 목록

### 중간 우선순위

5. **AdminApprovalDashboard** → `admin-approval-dashboard` 위젯
6. **SuperAdminApprovalDashboard** → `super-admin-approval-dashboard` 위젯
7. **BudgetManagement** → `budget-management` 위젯
8. **ItemManagement** → `item-management` 위젯
9. **RefundStatsCards** → `refund-stats-cards` 위젯
10. **RefundHistoryTable** → `refund-history-table` 위젯
11. **RefundAccountingStatus** → `refund-accounting-status` 위젯
12. **ErpSyncStatus** → `erp-sync-status` 위젯
13. **FinancialCalendarView** → `financial-calendar` 위젯
14. **TaxManagement** → `tax-management` 위젯
15. **SalaryManagement** → `salary-management` 위젯
16. **RefundManagement** → `refund-management` 위젯

### 낮은 우선순위

17. **RefundReasonStats** → `refund-reason-stats` 위젯
18. **ImprovedTaxManagement** → `improved-tax-management` 위젯

---

## 📝 위젯화 계획

### Phase 1: 핵심 대시보드 위젯 (1주)

1. **ErpDashboardWidget**
   - 통계 카드 그리드 (총 아이템, 승인 대기, 주문 수, 예산 사용률)
   - 빠른 액션 그리드
   - API: `/api/erp/items`, `/api/erp/purchase-requests/pending-admin`, `/api/erp/purchase-orders`, `/api/erp/budgets`

2. **IntegratedFinanceDashboardWidget**
   - 통합 재무 통계
   - 수입/지출 차트
   - API: `/api/erp/financial/overview`, `/api/erp/financial/transactions`

3. **FinancialManagementWidget**
   - 재무 거래 목록
   - 필터 및 검색
   - API: `/api/erp/financial/transactions`

4. **PurchaseManagementWidget**
   - 아이템/요청/주문 탭
   - API: `/api/erp/items`, `/api/erp/purchase-requests`, `/api/erp/purchase-orders`

### Phase 2: 관리 위젯 (1주)

5. **BudgetManagementWidget**
6. **ItemManagementWidget**
7. **RefundManagementWidget**
8. **TaxManagementWidget**
9. **SalaryManagementWidget**

### Phase 3: 승인 및 상태 위젯 (3일)

10. **AdminApprovalDashboardWidget**
11. **SuperAdminApprovalDashboardWidget**
12. **ErpSyncStatusWidget**
13. **RefundAccountingStatusWidget**

### Phase 4: 통계 및 차트 위젯 (3일)

14. **RefundStatsCardsWidget**
15. **RefundHistoryTableWidget**
16. **FinancialCalendarWidget**
17. **RefundReasonStatsWidget**

---

## 🔗 API 엔드포인트 확인 필요

다음 API 엔드포인트들이 실제로 존재하는지 확인이 필요합니다:

- `/api/erp/items` ✅
- `/api/erp/purchase-requests` ✅
- `/api/erp/purchase-requests/pending-admin` ✅
- `/api/erp/purchase-requests/pending-super-admin` ✅
- `/api/erp/purchase-orders` ❓
- `/api/erp/budgets` ✅
- `/api/erp/financial/overview` ❓
- `/api/erp/financial/transactions` ❓
- `/api/erp/refund/stats` ❓
- `/api/admin/salary/tax/statistics` ✅

---

## 📊 위젯 분류

### 공통 위젯 (모든 업종에서 사용 가능)
- `erp-dashboard`
- `purchase-request` (이미 완료)
- `erp-card` (이미 완료)

### ERP 특화 위젯 (ERP 기능이 활성화된 테넌트에서만 사용)
- `integrated-finance-dashboard`
- `financial-management`
- `purchase-management`
- `budget-management`
- `item-management`
- `tax-management`
- `salary-management`
- `refund-management`
- `admin-approval-dashboard`
- `super-admin-approval-dashboard`
- `refund-stats-cards`
- `refund-history-table`
- `refund-accounting-status`
- `erp-sync-status`
- `financial-calendar`
- `refund-reason-stats`

---

## ✅ 다음 단계

1. **API 엔드포인트 확인**: 백엔드 컨트롤러에서 실제 존재하는 API 확인
2. **Phase 1 위젯 구현**: 핵심 대시보드 위젯부터 구현
3. **WidgetRegistry 등록**: ERP 특화 위젯을 별도 카테고리로 등록
4. **문서 업데이트**: 위젯 사용 가이드 작성

