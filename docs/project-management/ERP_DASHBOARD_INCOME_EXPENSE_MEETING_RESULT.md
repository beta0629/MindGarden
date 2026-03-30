# ERP 대시보드 수입·지출 내역 영역 전환 및 시각화 회의 결과

**작성일**: 2025-03-19  
**참여 역할**: 기획(core-planner), 디자인(core-designer), 퍼블리셔(core-publisher), 컴포넌트 매니저(core-component-manager), 코더(core-coder)  
**대상**: `frontend/src/components/erp/ErpDashboard.js` ContentArea (`erp-dashboard__content`, ariaLabel="운영 현황")

---

## 1. 목표·범위

- **목표**: ERP 대시보드의 **콘텐츠 영역**을 수입·지출 내역 중심으로 전환하고, 시인성·시각화를 강화한다.
- **범위**
  - **포함**: ErpDashboard.js 내 ContentArea 구성 변경(요약 KPI, 차트, 최근 거래), 수입·지출 데이터 연동, 기존 B0KlA·AdminCommonLayout·디자인 토큰 준수.
  - **제외**: 통합 재무 페이지(`/admin/erp/financial`) 자체 변경 없음. 해당 페이지는 “상세·탭별” 용도로 유지하고, ERP 대시보드는 “요약” 용도로 수입·지출을 노출.
- **참고**: 현재 ContentArea는 ContentHeader, ContentKpiRow(구매/아이템/예산 중심), 데이터 동기화 카드, 빠른 액션, 최근 활동(빈 상태)으로 구성되어 있으며, 수입·지출 API는 호출하지 않음.

---

## 2. 기획 요약

- **수입·지출 “영역” 범위**
  - **메인 콘텐츠**: (1) 이번 달(또는 선택 기간) 수입/지출/순이익 요약 KPI, (2) 기간별 수입·지출 시각화(차트 1종 이상), (3) 최근 거래 목록(또는 요약 리스트).
  - **기존 구매/예산 KPI**: 상단 한 줄(ContentKpiRow) 유지하되, 수입·지출 요약 KPI를 그 위 또는 동일 행 레벨에 추가하는 방식 권장. 또는 “구매·예산 요약”을 한 블록으로 묶어 빠른 액션 위/아래에 두고, 메인 시선은 수입·지출 요약 → 차트 → 최근 거래 순으로 유도.
- **수입·지출 데이터 소스**
  - **기존 API 재사용**: `GET /api/v1/erp/finance/dashboard` (옵션: `startDate`, `endDate`). 응답 `data.financialData`: totalIncome, totalExpense, netProfit, incomeByCategory, expenseByCategory, transactionCount; `data.recentTransactions` 등. ERP 대시보드 전용 신규 API는 불필요하며, 위 API 호출을 ErpDashboard에 추가하면 됨.
- **시각화 종류·우선순위**
  - **1단계**: 요약 KPI 카드(수입/지출/순이익), 기간별 수입·지출 막대 또는 라인 차트 1종, 최근 거래 테이블·리스트.
  - **2단계(선택)**: 계정·카테고리별 비중(도넛/파이), 추가 차트.

---

## 3. 디자인 요약

- **레이아웃**: 요약 KPI → 차트 → 최근 내역 순서 권장. 상단에서 수입·지출·순이익 등 핵심 숫자를 먼저 보여주고, 차트로 기간별 추이와 비율을 이해한 뒤, 아래로 최근 거래 내역을 확인하는 정보 위계가 자연스럽고 “한눈에 들어오는” 흐름이 됨.
- **카드/차트 비주얼 톤**: B0KlA·디자인 토큰 기준. 수입은 녹색(`var(--mg-success-500)` 또는 주조 계열), 지출은 주황/빨강(`var(--mg-warning-500)` 또는 `var(--mg-error-500)`), 순이익은 주조색(`var(--mg-color-primary-main)`)으로 강조해 의미 대비를 분명히 하고 기존 팔레트와 맞춤.
- **시인성**: 제목·핵심 숫자 20~24px·fontWeight 600, 본문 14~16px, 라벨·캡션 12px·`var(--mg-color-text-secondary)`. 섹션 블록은 패딩 24px·내부 gap 16px·좌측 세로 악센트(4px)로 구분. 수입/지출/순이익은 강조 색을 숫자·라벨·차트에 일관 적용해 색만으로도 구분되게 함.

---

## 4. 퍼블리셔 마크업 구조 요약

- **아토믹 디자인 기반 구조**
  - (1) 상단 요약 KPI: `<section class="erp-dashboard__summary" aria-labelledby="erp-dashboard-summary-heading">`, 내부 그리드 `<div class="mg-v2-erp-dashboard-kpi-grid">`, 카드 `<article class="mg-v2-card-container">`, 제목 `<h2 id="erp-dashboard-summary-heading">` 또는 `<h3>`.
  - (2) 차트 영역: `<section class="erp-dashboard__charts" aria-labelledby="erp-dashboard-charts-heading">`, 그리드 `<div class="erp-dashboard__chart-grid">`, 차트별 `<figure class="erp-dashboard__chart-item">`, 제목 `<figcaption>` 또는 `<h3 id="erp-dashboard-charts-heading">`.
  - (3) 최근 거래: `<section class="erp-dashboard__recent" aria-labelledby="erp-dashboard-recent-heading">`, `<div class="erp-dashboard__table-wrapper">`, `<table class="erp-dashboard__transactions-table">`, thead/tbody/th/td 시맨틱 유지. KPI 카드는 기존 `mg-v2-erp-dashboard-kpi-grid`, `mg-v2-card-container`, `mg-v2-erp-dashboard-kpi-label`, `mg-v2-erp-dashboard-kpi-value` 등 재사용.
- **접근성**: 각 섹션에 `aria-labelledby`로 해당 제목 id 연결. 차트/요약 영역에 `aria-label="수입·지출 요약"`, `aria-label="수입·지출 차트"` 등 목적 보완. 테이블에는 `<caption>` 또는 `aria-label`로 “최근 거래 목록” 명시, 정렬/필터 버튼이 있으면 `aria-label`로 동작 설명.

---

## 5. 컴포넌트 검토·제안

- **재사용 가능한 컴포넌트**: StatCard, ContentKpiRow, MGChart·MGStatistics·MGStatisticsCard, DashboardSection, 공통 Chart(Bar/Line/Pie/Doughnut). IntegratedFinanceDashboard는 StatCard·DashboardSection 사용, ErpDashboard는 ContentKpiRow 사용. 공통 테이블 컴포넌트는 없고 IntegratedFinanceDashboard는 네이티브 table·mg-table 클래스 사용 중.
- **신규 컴포넌트 제안**: 수입·지출 요약 KPI는 ContentKpiRow 재사용으로 충분. 수입/지출 트렌드 시각화가 필요하면 **FinanceTrendChart**(막대/라인, 기간별 수입·지출 비교)를 `frontend/src/components/common/` 또는 `frontend/src/components/erp/shared/`에 두고 ErpDashboard(요약)와 IntegratedFinanceDashboard(상세) 양쪽에서 import. 테이블 재사용이 필요하면 **FinanceTransactionTable**(컬럼·정렬·페이징 공통화)을 같은 공용 위치에 두고 두 페이지에서만 참조.
- **중복 방지**: 수입·지출 관련 KPI·차트·테이블 UI를 `frontend/src/components/erp/shared/` 또는 common에 공용 컴포넌트(FinanceTrendChart, 필요 시 FinanceTransactionTable, KPI는 ContentKpiRow/StatCard)로 두고, ErpDashboard는 “요약용”, IntegratedFinanceDashboard는 “상세·탭별”로 동일 컴포넌트만 import해 사용.

---

## 6. 구현 순서·권고

- **구현 순서**: (1) 데이터 연동(수입·지출 API 호출 추가) → (2) KPI/요약 영역 → (3) 차트 1종 → (4) 최근 거래 목록. 데이터를 먼저 붙이고, 요약·차트·목록 순으로 가는 구성에 합의.
- **loadDashboardData vs 별도 함수**: 수입·지출 전용 상태·에러·새로고침을 나누어 다루기 쉽도록, `GET /api/v1/erp/finance/dashboard` 호출과 그 결과를 담당하는 **별도 함수(예: loadIncomeExpenseSummary)**를 두고, 기존 loadDashboardData는 품목·구매요청·발주·예산만 담당하도록 유지하는 것을 권장. ContentArea를 수입·지출 중심으로 전환할 때도 관심사가 분리되어 유지보수에 유리함.

---

## 7. 다음 단계 (우선 적용할 작업 3개 이내)

1. **데이터 연동**: ErpDashboard에 `loadIncomeExpenseSummary` 도입, `GET /api/v1/erp/finance/dashboard` 호출 및 상태(financialData, recentTransactions 등) 저장. 기간 파라미터(startDate/endDate)는 기본 “이번 달”로 설정해 두고 선택 옵션은 이후 확장.
2. **수입·지출 요약 KPI 영역**: ContentArea 상단에 수입/지출/순이익 요약 카드 추가(ContentKpiRow 또는 StatCard 재사용). 디자인 토큰에 따른 수입(녹색)·지출(주황/빨강)·순이익(주조색) 강조 적용.
3. **차트 1종 + 최근 거래 목록**: 기간별 수입·지출 막대 또는 라인 차트 1개 배치(공용 Chart 또는 FinanceTrendChart 후보 사용), 그 아래 최근 거래 목록 테이블/리스트(기존 `recentTransactions` 데이터 연동). 퍼블리셔 제안 마크업(erp-dashboard__summary, erp-dashboard__charts, erp-dashboard__recent 등)과 접근성(aria-labelledby, aria-label) 반영.

---

*본 문서는 코드 수정 없이 회의 결과만 정리한 것이며, 실제 구현 시 위 순서와 역할별 합의를 참고하여 core-designer → core-coder 등 분배실행 표에 따라 진행할 수 있음.*
