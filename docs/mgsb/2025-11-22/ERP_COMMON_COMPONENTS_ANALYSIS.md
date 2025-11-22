# ERP 공통 컴포넌트 분석 및 위젯화

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: ERP 컴포넌트에서 공통으로 사용되는 부분을 분석하고 위젯화

---

## 📋 공통 사용 부분 분석

### 1. 공통 유틸리티 함수 (중복 제거 완료)

#### 1.1 formatCurrency
- **중복 발견**: 15개 이상의 컴포넌트에서 각각 정의
- **해결**: `utils/formatUtils.js`에 통합
- **사용 위치**:
  - `ErpDashboard.js`
  - `IntegratedFinanceDashboard.js`
  - `FinancialManagement.js`
  - `TaxManagement.js`
  - `SalaryManagement.js`
  - `BudgetManagement.js`
  - `PurchaseRequestForm.js`
  - `ItemManagement.js`
  - `SuperAdminApprovalDashboard.js`
  - `AdminApprovalDashboard.js`
  - `RefundStatsCards.js`
  - `RefundHistoryTable.js`
  - `RefundAccountingStatus.js`
  - `FinancialCalendarView.js`
  - `ImprovedTaxManagement.js`

#### 1.2 formatDate
- **중복 발견**: 6개 이상의 컴포넌트에서 각각 정의
- **해결**: `utils/formatUtils.js`에 통합
- **사용 위치**:
  - `TaxManagement.js`
  - `SalaryManagement.js`
  - `BudgetManagement.js`
  - `SuperAdminApprovalDashboard.js`
  - `AdminApprovalDashboard.js`
  - `FinancialManagement.js`
  - `ImprovedTaxManagement.js`

#### 1.3 formatNumber
- **중복 발견**: 여러 컴포넌트에서 사용
- **해결**: `utils/formatUtils.js`에 통합

#### 1.4 formatPercent
- **신규 추가**: 퍼센트 포맷팅 함수

#### 1.5 formatFileSize
- **신규 추가**: 파일 크기 포맷팅 함수

**파일**: `frontend/src/utils/formatUtils.js` ✅ 생성 완료

---

### 2. 공통 컴포넌트 (이미 존재)

#### 2.1 StatCard
- **위치**: `components/ui/Card/StatCard.js`
- **사용 위치**:
  - `ErpDashboard.js` - 통계 카드 그리드
  - `IntegratedFinanceDashboard.js` - 재무 통계
  - `SalaryManagement.js` - 급여 통계
- **상태**: ✅ 공통 컴포넌트로 존재

#### 2.2 DashboardSection
- **위치**: `components/layout/DashboardSection.js`
- **사용 위치**:
  - `ErpDashboard.js` - 빠른 액션 섹션
  - `SalaryManagement.js` - 급여 관리 섹션
- **상태**: ✅ 공통 컴포넌트로 존재

#### 2.3 ErpCard
- **위치**: `components/erp/common/ErpCard.js`
- **사용 위치**: 여러 ERP 컴포넌트
- **상태**: ✅ 위젯화 완료 (`ErpCardWidget`)

#### 2.4 ErpHeader
- **위치**: `components/erp/common/ErpHeader.js`
- **상태**: ✅ 위젯화 완료 (`HeaderWidget`)

---

### 3. 공통 패턴 (위젯화 완료)

#### 3.1 통계 카드 그리드
- **패턴**: 여러 `StatCard`를 그리드로 배치
- **사용 위치**:
  - `ErpDashboard.js` - 4개 통계 카드
  - `IntegratedFinanceDashboard.js` - 재무 통계
  - `SalaryManagement.js` - 급여 통계
- **위젯화**: ✅ `ErpStatsGridWidget` 생성 완료

#### 3.2 빠른 액션 그리드
- **패턴**: `mg-management-card` 그리드
- **사용 위치**:
  - `ErpDashboard.js` - 빠른 액션 섹션
  - `AdminDashboard.js` - 관리 액션
- **위젯화**: ✅ `ErpManagementGridWidget` 생성 완료

---

## ✅ 완료된 작업

### 1. 공통 유틸리티 함수 통합
- ✅ `formatUtils.js` 생성
- ✅ `formatCurrency` 통합
- ✅ `formatDate` 통합
- ✅ `formatNumber` 통합
- ✅ `formatPercent` 추가
- ✅ `formatFileSize` 추가

### 2. 공통 위젯 생성
- ✅ `ErpStatsGridWidget` - 통계 카드 그리드 위젯
- ✅ `ErpManagementGridWidget` - 빠른 액션 그리드 위젯
- ✅ `ErpCardWidget` - ERP 카드 위젯 (이미 완료)
- ✅ `HeaderWidget` - 헤더 위젯 (이미 완료)

### 3. WidgetRegistry 업데이트
- ✅ ERP 위젯 카테고리 추가
- ✅ `ERP_WIDGETS` 매핑 추가
- ✅ `getErpWidgetTypes()` 함수 추가

---

## 📝 다음 단계

### Phase 1: 공통 부분 리팩토링 (1일)

1. **기존 컴포넌트에서 formatUtils 사용하도록 변경**
   - 모든 ERP 컴포넌트에서 `formatCurrency`, `formatDate` 함수를 `formatUtils`에서 import
   - 중복 정의 제거

2. **공통 위젯 사용 예시 문서 작성**
   - `ErpStatsGridWidget` 사용 예시
   - `ErpManagementGridWidget` 사용 예시

### Phase 2: 핵심 ERP 위젯 구현 (1주)

3. **ErpDashboardWidget** 구현
   - `ErpStatsGridWidget` 사용
   - `ErpManagementGridWidget` 사용
   - API 연동

4. **IntegratedFinanceDashboardWidget** 구현
   - 재무 통계 위젯
   - 차트 위젯
   - 거래 내역 위젯

---

## 🔧 사용 예시

### ErpStatsGridWidget 사용 예시

```json
{
  "id": "erp-stats-1",
  "type": "erp-stats-grid",
  "position": { "row": 0, "col": 0, "span": 12 },
  "config": {
    "title": "ERP 통계",
    "columns": 4,
    "dataSource": {
      "type": "api",
      "url": "/api/erp/dashboard/stats",
      "refreshInterval": 60000
    },
    "statistics": [
      {
        "id": "total-items",
        "key": "totalItems",
        "label": "총 아이템 수",
        "format": "number",
        "icon": "Package"
      },
      {
        "id": "pending-requests",
        "key": "pendingRequests",
        "label": "승인 대기 요청",
        "format": "number",
        "icon": "Clock",
        "changeType": "negative"
      },
      {
        "id": "total-orders",
        "key": "totalOrders",
        "label": "총 주문 수",
        "format": "number",
        "icon": "ShoppingCart",
        "changeType": "positive"
      },
      {
        "id": "budget-usage",
        "key": "budgetUsagePercentage",
        "label": "예산 사용률",
        "format": "percent",
        "icon": "TrendingUp"
      }
    ]
  }
}
```

### ErpManagementGridWidget 사용 예시

```json
{
  "id": "erp-actions-1",
  "type": "erp-management-grid",
  "position": { "row": 1, "col": 0, "span": 12 },
  "config": {
    "title": "빠른 액션",
    "columns": 4,
    "actions": [
      {
        "id": "purchase-request",
        "title": "구매 요청하기",
        "description": "상품 및 비품 구매 요청을 제출합니다",
        "icon": "ShoppingCart",
        "url": "/erp/purchase-requests",
        "permission": "PURCHASE_REQUEST_VIEW"
      },
      {
        "id": "approval-management",
        "title": "승인 관리",
        "description": "구매 요청 승인 및 거부를 관리합니다",
        "icon": "Clock",
        "url": "/erp/approvals",
        "permission": "PURCHASE_APPROVAL_MANAGE"
      },
      {
        "id": "item-management",
        "title": "아이템 관리",
        "description": "등록된 비품 및 상품을 관리합니다",
        "icon": "Package",
        "url": "/erp/items",
        "permission": "ITEM_MANAGE"
      },
      {
        "id": "budget-management",
        "title": "예산 관리",
        "description": "지점별 예산을 설정하고 관리합니다",
        "icon": "TrendingUp",
        "url": "/erp/budget",
        "permission": "BUDGET_MANAGE"
      }
    ]
  }
}
```

---

## 📊 공통 부분 사용 현황

| 공통 부분 | 중복 발견 | 해결 방법 | 상태 |
|----------|----------|----------|------|
| `formatCurrency` | 15개+ | `formatUtils.js` 통합 | ✅ 완료 |
| `formatDate` | 6개+ | `formatUtils.js` 통합 | ✅ 완료 |
| `formatNumber` | 여러 개 | `formatUtils.js` 통합 | ✅ 완료 |
| `StatCard` | 공통 컴포넌트 | 위젯화 (`ErpStatsGridWidget`) | ✅ 완료 |
| `DashboardSection` | 공통 컴포넌트 | 위젯화 (`ErpManagementGridWidget`) | ✅ 완료 |
| `mg-management-card` | 여러 개 | 위젯화 (`ErpManagementGridWidget`) | ✅ 완료 |

---

## 🎯 기대 효과

1. **코드 중복 제거**: 20개 이상의 중복 함수 제거
2. **유지보수성 향상**: 포맷팅 로직 변경 시 한 곳만 수정
3. **일관성 확보**: 모든 ERP 컴포넌트에서 동일한 포맷팅 사용
4. **재사용성 향상**: 공통 위젯으로 빠른 대시보드 구성 가능

