# ERP 재무 관리(Financial Management) 모듈 전체 리뉴얼 기획서

**문서 버전**: 1.0.0  
**작성일**: 2025-03-04  
**담당**: core-planner (기획만 수행, 설계·구현은 core-designer → core-coder 위임)  
**참조**: core-solution-planning, ERP_FINANCIAL_MANAGEMENT_IMPROVEMENT_PLAN.md, ERP_FINANCIAL_MANAGEMENT_UI_SPEC.md, unified-design-tokens.css, AdminCommonLayout

---

## 1. 제목·목표

- **제목**: 재무 관리(Financial Management) 모듈 **전체 리뉴얼** 기획.
- **목표**:
  1. **달력**: 프로젝트에서 이미 구현해 둔 공통 달력(mg-calendar)과 재무 달력 통일.
  2. **색상**: 아토믹 디자인·디자인 토큰 기반으로 통일, 하드코딩 색상 제거.
  3. **카드**: 필요한 정보만 노출하도록 정리, 조잡한 카드 UI 개선.
  4. **필터**: 필수 필터만 유지하고 단순화(기간, 거래 유형, 카테고리 중심).
  5. 전체 정보 구조·레이아웃 정리로 사용성 개선.

기획만 수행하며, 디자인·코드 수정은 **core-designer** → **core-coder** 순서로 위임한다.

---

## 2. 현재 재무 관리 범위 파악

### 2.1 라우트·페이지·컴포넌트 목록

| 구분 | 라우트 | 페이지/컴포넌트 | 비고 |
|------|--------|-----------------|------|
| 재무 관리(상세) | `/erp/financial` | `FinancialManagement.js` | 거래 내역·달력·대시보드 탭 |
| 통합 재무(어드민) | `/admin/erp/financial` | `IntegratedFinanceDashboard.js` | 개요·분개·원장·재무제표·정산·리포트 탭 |
| 예산 | `/erp/budget`, `/erp/budgets` | `BudgetManagement.js` | 예산·카테고리·리포트 탭 |
| 거래 등록 폼 | (모달) | `FinancialTransactionForm.js` | 통합 재무 대시보드에서 호출 |
| 재무 달력 뷰 | (탭 내부) | `FinancialCalendarView.js` | FinancialManagement 내 "달력 뷰" 탭 |
| 기타 ERP | `/erp/dashboard`, `/erp/tax`, `/erp/salary` 등 | ErpDashboard, TaxManagement 등 | 재무와 연동되나 본 리뉴얼 “재무 관리” 범위에는 포함·제외 선택 가능 |

**본 리뉴얼의 핵심 적용 대상**  
- **1차**: `FinancialManagement.js`(거래/달력/대시보드), `FinancialCalendarView.js`(달력 뷰).  
- **2차(선택)**: `IntegratedFinanceDashboard.js` 내 개요·리포트 탭의 카드/색상/필터.

### 2.2 화면별 제공 기능·사용 컴포넌트 현황

| 화면 | 제공 기능 | 사용 컴포넌트/UI | 비고 |
|------|-----------|------------------|------|
| **FinancialManagement** | 탭(거래/달력/대시보드), 거래 목록, 필터, 카드 그리드, 페이지네이션, 상세 모달 | AdminCommonLayout, ContentHeader, ContentArea, Pill 탭, 태그 필터, MGCard, FinancialCalendarView, UnifiedModal/ConfirmModal | 달력은 자체 구현 뷰 사용 |
| **FinancialManagement – 거래 탭** | 필터(거래 유형, 카테고리, 연동 유형, 검색), 거래 카드 그리드, 거래 추가/내보내기 버튼 | mg-v2-filter-section, mg-v2-tag-group, mg-financial-transaction-cards-grid, MGCard, Button(Eye/Pencil/Trash2) | 필터 4그룹+검색+버튼 2개 |
| **FinancialManagement – 달력 탭** | 월별 달력 그리드, 범례, 날짜 클릭 시 일별 상세 패널, 월 통계 카드 | FinancialCalendarView 전용 마크업(mg-v2-calendar-grid, mg-financial-calendar-*), **공통 mg-calendar 미사용** | 아래 §3에서 정리 |
| **FinancialManagement – 대시보드 탭** | KPI 카드(총 수입/지출/순이익/거래 건수 등), 빠른 액션 | mg-v2-ad-b0kla__card, B0KlA 스타일 | 카드 다수, 정리 여지 있음 |
| **IntegratedFinanceDashboard** | 탭(개요·분개·원장·재무제표·정산·일/월/년 리포트), KPI 카드, 차트, 테이블 | DashboardSection, StatCard, 자체 탭·카드·스타일 | 카드·색상 토큰 정리 대상 |
| **BudgetManagement** | 예산 목록, 카테고리, 리포트, erp-stat-card 등 | ContentArea, erp-container, erp-card | 재무 리뉴얼 2차에서 통일 시 참고 |

### 2.3 공통 컴포넌트 사용 현황

- **레이아웃**: AdminCommonLayout, ContentHeader, ContentArea — 재무 관리·통합 재무에서 사용 중.
- **달력**: **공통 달력(mg-calendar)은 CalendarShowcase·디자인 시스템 쇼케이스에서만 사용.** 재무 달력은 `FinancialCalendarView`가 **별도 마크업·클래스**(mg-v2-calendar-grid, mg-financial-calendar-*)로 구현되어 있음.
- **카드**: MGCard, mg-v2-ad-b0kla__card 혼용. ERP 전용 erp-stat-card, erp-budget-card 등 별도 스타일 다수.
- **버튼/폼**: Button, mg-v2-button-*, mg-v2-form-label, mg-v2-tag 등 사용. 일부 Bootstrap pagination 등 레거시 혼재.

---

## 3. 기존 달력·디자인 시스템 정리

### 3.1 프로젝트에서 “이미 구현해 둔 달력”

| 항목 | 경로 | API(props)·스타일 | 용도 |
|------|------|-------------------|------|
| **공통 달력(쇼케이스)** | `frontend/src/components/mindgarden/CalendarShowcase.js` | `currentDate`, `selectedDate` state. 이전/다음 월 `ChevronLeft`/`ChevronRight`. **클래스**: `mg-calendar`, `mg-calendar-header`, `mg-calendar-title`, `mg-calendar-nav-btn`, `mg-calendar-grid`, `mg-calendar-day-header`, `mg-calendar-day`(.today, .selected, .has-event) | 디자인 시스템 쇼케이스용 |
| **달력 토큰/스타일** | `frontend/src/styles/unified-design-tokens.css` (Calendar 섹션) | `.mg-calendar`(배경 white, radius, shadow), `.mg-calendar-header`(flex), `.mg-calendar-title`, `.mg-calendar-nav-btn`(light-beige/cream), `.mg-calendar-grid`(7열), `.mg-calendar-day`(hover, .today=mint-green, .selected=olive-green, .has-event::after dot) | 아토믹·토큰 기반 달력 |

- **공통 달력은 “재사용 가능한 하나의 컴포넌트”로 분리되어 있지 않고**, CalendarShowcase가 **mg-calendar 클래스**를 사용하는 **참조 구현** 상태. 재무 달력은 이 구조를 쓰지 않고 별도 구현.

### 3.2 아토믹 디자인·디자인 토큰 정의 위치

| 구분 | 파일/위치 | 내용 |
|------|-----------|------|
| **디자인 토큰(색·레이아웃)** | `frontend/src/styles/unified-design-tokens.css` | `--mg-primary-*`, `--mg-success-*`, `--mg-error-*`, `--mg-warning-*`, `--mg-color-*`, `--mg-layout-section-bg`, `--mg-layout-section-border`, `--mg-layout-grid-gap` 등 |
| **달력(공통)** | 동일 파일 내 “Calendar” 섹션 | `.mg-calendar`, `.mg-calendar-header`, `.mg-calendar-grid`, `.mg-calendar-day` 등 |
| **재무 달력 전용** | 동일 파일 “Financial Calendar Classes” | `.mg-v2-calendar-grid`, `.mg-v2-calendar-header`, `.mg-v2-calendar-cell`, `.mg-v2-legend-*` 등. **하드코딩**: `#495057`, `#dee2e6`, `#e3f2fd`, `#fff3cd` 등 |
| **B0KlA(어드민)** | AdminDashboardB0KlA.css 등 | `mg-v2-ad-b0kla__*`, Pill, card, section-title |
| **ERP 공통** | `frontend/src/components/erp/ErpCommon.css` | `.erp-system`, `.mg-v2-erp-financial`, `.mg-financial-filter-actions`, 기타 erp-* |

**사용 규칙**: 하드코딩 색상 금지, `var(--mg-*)` 토큰 사용. 어드민은 B0KlA·AdminCommonLayout 적용.

### 3.3 재무 관리에서 공통 달력과 이탈한 부분

| 위치 | 현재 구현 | 공통(mg-calendar)와의 차이 |
|------|-----------|----------------------------|
| **FinancialCalendarView.js** | 자체 헤더·네비·그리드·범례·일별 상세·월 통계 | **그리드**: `mg-v2-calendar-grid` + `mg-financial-calendar-cell-*` (날짜 셀 구조·클래스명 전부 다름). **헤더**: `mg-v2-calendar-header`(요일), `mg-financial-calendar-nav`(이전/다음). **공통**: `mg-calendar` / `mg-calendar-grid` / `mg-calendar-day` 미사용. |
| **FinancialCalendarView 스타일** | unified-design-tokens.css “Financial Calendar Classes” + ErpCommon 등 | 요일 헤더 배경 `#495057`, 그리드 gap `#dee2e6`, today `#e3f2fd`, selected `#fff3cd` 등 **색상 하드코딩**. 공통 달력은 var(--*)·semantic 색 사용. |
| **날짜 셀 내용** | 일별 수입/지출 요약, 거래 건수, 매핑 표시 | 공통 달력은 “날짜 + 선택 + has-event 점” 수준. 재무는 **셀 내부 콘텐츠**가 많아, 공통 그리드 구조를 쓰되 **셀 내용만 재무 도메인**으로 채우는 방식으로 통일 가능. |

**정리**: 재무 달력은 **구조·클래스·색상** 모두 공통 달력(mg-calendar)과 불일치. 리뉴얼 시 **공통 달력 구조·토큰을 기준으로 재무 뷰를 맞추거나**, 공통 달력 컴포넌트를 **재사용 가능하게 추출한 뒤** 재무에서 해당 컴포넌트를 사용하도록 통일한다.

---

## 4. 리뉴얼 방향 정의

### 4.1 달력 통일

- **목표**: 재무 관리 전반에서 **우리가 구현해 둔 달력**(mg-calendar 계열)과 동일한 구조·토큰 사용.
- **적용 위치**: `FinancialManagement.js` 내 “달력 뷰” 탭 → `FinancialCalendarView` (또는 이를 대체하는 뷰).
- **방안**:
  - **A안**: `FinancialCalendarView`를 **mg-calendar**, `mg-calendar-header`, `mg-calendar-grid`, `mg-calendar-day` 클래스를 사용하도록 리팩터. 월 네비(이전/다음)는 `mg-calendar-nav-btn`, 요일 헤더는 `mg-calendar-day-header`. 날짜 셀 내부는 “일별 수입/지출 요약”만 표시(필요 시 `.has-event` 활용 또는 셀 내 작은 텍스트). 색상은 `var(--mg-*)`만 사용.
  - **B안**: `CalendarShowcase` 기반으로 **재사용 가능한 달력 Organism**(예: `SharedCalendar.js`)을 추출하고, 재무는 “월별 + 일별 데이터”를 props로 넘겨 같은 컴포넌트 사용. 재무 전용 “일별 상세 패널”은 달력 하단 또는 측면 블록으로 유지.
- **범례·일별 상세·월 통계**: 달력 그리드만 공통화하고, 범례/상세/월통계는 기존처럼 재무 전용 블록으로 두되, **색상·타이포·간격은 토큰·B0KlA**로 통일.

### 4.2 색상·카드(아토믹·디자인 토큰)

- **색상**: 모든 재무 관련 화면에서 **하드코딩 hex 제거**. `unified-design-tokens.css`의 `--mg-color-*`, `--mg-success-*`, `--mg-error-*`, `--mg-primary-*` 등만 사용. Financial Calendar Classes의 `#495057`, `#dee2e6`, `#e3f2fd`, `#fff3cd` 등 → 토큰으로 교체.
- **카드**:
  - **원칙**: “필요한 것만” 노출. 조잡한 카드 정리.
  - **거래 목록 카드**: 거래 1건당 카드에는 **필수만** — 거래일, 유형(수입/지출), 카테고리, 금액, 상태, 매핑 여부(아이콘/뱃지). 상세(매칭 정보, 설명 등)는 “보기” 클릭 시 모달 또는 접기 영역으로.
  - **대시보드 KPI 카드**: **수입 합계, 지출 합계, 순이익, (선택) 거래 건수** 4개 수준으로 유지. 부가 지표는 “접기” 또는 2차 탭으로.
  - **통합 재무 개요**: 카드 수 줄이기, 동일하게 `mg-v2-ad-b0kla__card` + 토큰, 좌측 악센트 바 등 B0KlA 일관 적용.
- **컴포넌트**: MGCard 또는 `mg-v2-ad-b0kla__card` 중 하나로 통일. erp-stat-card 등 ERP 전용 카드는 **토큰·B0KlA 카드 스타일로 점진 대체**.

### 4.3 필터 단순화

- **현재 필터(FinancialManagement 거래 탭)**  
  - 거래 유형: 전체/수입/지출 (태그)  
  - 카테고리: 전체/상담료/급여/임대료/관리비/사무용품/기타 (태그)  
  - 연동 유형: 전체/매핑연동/환불처리/결제/급여/구매 (태그)  
  - 검색: 텍스트(상담사명, 내담자명, 설명)  
  - 버튼: 필터 초기화, 검색  
  - (state에는 dateRange/startDate/endDate 있으나 **UI에 기간 선택 없음**)

- **필수만 유지하는 방향**  
  - **기간**: **필수**. 오늘/주/이번달/직접입력(시작일~종료일) 등 1줄 드롭다운 또는 기간 픽커 1개. API는 기존 `startDate`/`endDate` 활용.  
  - **거래 유형**: 유지(전체/수입/지출). 태그 1줄.  
  - **카테고리**: 유지하되, “자주 쓰는” 것만 기본 노출하고 나머지는 “기타” 또는 접기로 묶을 수 있음.  
  - **연동 유형**: **제거 또는 접기**. 고급 필터로 넣거나, “연동 유형” 드롭다운 1개로 축소.  
  - **검색**: 유지. 1개 input + (선택) 검색 버튼.  
  - **UI**: “기간 + 거래 유형 + 카테고리” 한 줄(또는 두 줄), 그 다음 줄에 검색 + 필터 초기화. 드롭다운 1~2개 + 태그 그룹 1~2개 수준으로 단순화.

- **제거·축소 제안**  
  - 연동 유형 태그 그룹 제거 또는 “고급 필터” 접기 내부로 이동.  
  - 카테고리 옵션 수가 많으면 “주요” + “기타”로 묶거나 드롭다운 1개로 변경 가능(디자이너에서 최종 결정).

### 4.4 정보 구조(페이지별 블록·숨기기/접기)

| 화면 | 상단 | 본문 | 숨기기/접기 제안 |
|------|------|------|-------------------|
| **FinancialManagement** | ContentHeader + 탭(거래/달력/대시보드) | 탭별 1개 섹션 블록 | 필터: 거래 탭에서만 노출, 기본 1~2줄. 연동 유형 접기. |
| **거래 탭** | 필터(기간+유형+카테고리+검색) | 거래 카드 그리드 + 페이지네이션 | 카드 본문: 상세 필드는 “보기” 클릭 시 모달. |
| **달력 탭** | (없음 또는 제목 1줄) | 공통 달력 + 범례 + 일별 상세 패널 + 월 통계 | 일별 상세: 날짜 선택 시에만 표시. 월 통계: 카드 4개(수입/지출/순이익/거래 건수)만. |
| **대시보드 탭** | 제목 | KPI 카드 4개 + (선택) 빠른 액션 | 부가 지표는 접기 또는 생략. |
| **IntegratedFinanceDashboard** | 헤더 + 탭 | 탭별 콘텐츠(개요 카드, 차트, 테이블) | 개요 카드 수 축소, 토큰·B0KlA 카드로 통일. |

---

## 5. 범위·단계·산출물

### 5.1 범위 제안

- **1차 리뉴얼(권장 우선)**  
  - **FinancialManagement.js** 전체(탭, 필터, 거래 목록, 대시보드 탭).  
  - **FinancialCalendarView.js** — 달력 공통(mg-calendar)과 통일, 색상 토큰화, 카드(월 통계) 정리.  
  - 필터: 기간 추가 + 필수만(기간/거래 유형/카테고리/검색) + 단순화된 UI.  
  - 카드: 거래 카드·대시보드 카드 “필요한 것만” + 토큰·B0KlA.

- **2차 리뉴얼(선택)**  
  - **IntegratedFinanceDashboard.js** — 개요·리포트 탭의 카드·색상·필터.  
  - **BudgetManagement** — 카드·색상만 토큰/B0KlA로 통일(기능 변경 없음).

- **제외**: API·백엔드·권한 로직 변경 없음. 다른 ERP 메뉴(구매·세무·급여 등)는 본 기획서에서 “재무 관리” 범위만 다룸.

### 5.2 단계별 작업 순서

| Phase | 담당 | 목표 | 산출물 |
|-------|------|------|--------|
| **0. 탐색(선택)** | explore | 재무 관련 컴포넌트·클래스·토큰 사용처 일괄 검색, 리뉴얼 대상 파일 목록 확정 | 파일·클래스 목록, 하드코딩 색상 위치 요약 |
| **1. 설계** | core-designer | 재무 관리(거래/달력/대시보드)·필터·카드·달력 통일 스펙. 사용성·정보 노출·레이아웃(§0.4). 화면설계서 | docs/design-system/ 내 화면설계서(SCREEN_SPEC_ERP_FINANCIAL_RENEWAL.md 등) |
| **2. 구현** | core-coder | 설계서·본 기획서 기준으로 달력 통일, 토큰·카드·필터 단순화, 정보 구조 반영 | 코드 반영, 체크리스트 충족 |

**순서**: 기획 확정 → (필요 시 explore) → **core-designer** → **core-coder**.

### 5.3 산출물

- **리뉴얼 기획서**: 본 문서(`docs/planning/ERP_FINANCIAL_MANAGEMENT_RENEWAL_PLAN.md`). 현재 구조, 문제점, 목표, 공통 컴포넌트(달력·카드·색상), 필터 단순화안, 화면별 변경 요약, 단계별 태스크 포함.
- **화면설계서**: Phase 1(core-designer) 산출물. `docs/design-system/` 저장. 코더가 구현할 수 있을 정도의 블록·컴포넌트·토큰 명시.
- **core-designer / core-coder 전달용 작업 목록·체크리스트**: 아래 §7·§8에 정리. 파일/화면 단위로 실행 가능.

---

## 6. 리스크·제약

- **기존 동작 유지**: API 파라미터(transactionType, category, relatedEntityType, search, startDate, endDate 등)는 유지. 변경은 UI·표현·필터 항목 축소만.
- **반응형**: 필터·카드 그리드·달력은 반응형 유지. 태그 줄바꿈, 카드 컬럼 수 등 RESPONSIVE_LAYOUT_SPEC 준수.
- **멀티테넌트·권한**: tenantId·branchCode·역할 체크 로직 변경 없음.
- **코드/디자인 수정**: 기획자는 하지 않음. 설계·구현은 core-designer, core-coder에 위임.

---

## 7. core-designer 전달용: 작업 목록·체크리스트

다음 내용을 **core-designer** 호출 시 전달한다. (mcp_task 또는 동일 메커니즘으로 core-designer 서브에이전트 호출 시 아래 프롬프트 요약 또는 전문을 전달.)

### 7.1 전달 문구(요약)

- “ERP 재무 관리 모듈 전체 리뉴얼을 위한 **화면설계서**를 작성해 주세요. 참조: `docs/planning/ERP_FINANCIAL_MANAGEMENT_RENEWAL_PLAN.md`. 다음을 반영해 주세요.”
- 사용성: 관리자가 거래 조회·기간 필터·달력으로 일별 확인·대시보드 KPI를 빠르게 보는 흐름. 자주 쓰는 동작(기간 선택, 거래 유형, 검색)을 앞에.
- 정보 노출: 거래 카드는 필수(일자, 유형, 카테고리, 금액, 상태, 매핑 여부). 상세는 모달. 대시보드는 수입/지출/순이익/거래 건수. 달력은 일별 요약+선택 시 상세.
- 레이아웃: AdminCommonLayout + ContentHeader + ContentArea. 탭(거래/달력/대시보드) → 필터(거래 탭만, 1~2줄) → 본문(카드 그리드 또는 달력 또는 KPI 카드). 달력은 **공통 mg-calendar 구조·클래스** 사용하도록 스펙에 명시.

### 7.2 설계 시 반영할 항목 체크리스트

- [ ] **달력**: 재무 달력이 `mg-calendar`, `mg-calendar-header`, `mg-calendar-grid`, `mg-calendar-day`, `mg-calendar-nav-btn` 등 **공통 달력 클래스**를 쓰는 구조로 스펙에 명시. 날짜 셀 내 수입/지출 요약 표시 방식, 범례·일별 상세 패널·월 통계 블록 배치.
- [ ] **색상**: 모든 영역에서 `var(--mg-*)` 토큰만 사용. 하드코딩 hex 없음. B0KlA 어드민 색상 참조.
- [ ] **카드**: 거래 카드·대시보드 카드에 “필요한 것만” 노출. 카드 컴포넌트는 `mg-v2-ad-b0kla__card` 또는 MGCard 중 하나로 통일 명시.
- [ ] **필터**: 기간(필수, 드롭다운 또는 기간 픽커 1개), 거래 유형(태그), 카테고리(태그 또는 드롭다운 1개), 검색 1개. 연동 유형은 제거 또는 고급 필터 접기. 1~2줄 레이아웃.
- [ ] **정보 구조**: 거래 탭 = 필터 + 카드 그리드. 달력 탭 = 달력 + 범례 + (선택 시) 일별 상세 + 월 통계. 대시보드 탭 = KPI 4개 카드.
- [ ] **산출물**: `docs/design-system/SCREEN_SPEC_ERP_FINANCIAL_RENEWAL.md`(또는 동의한 경로)에 저장. 코드 작성 없음.

---

## 8. core-coder 전달용: 작업 목록·체크리스트

다음 내용을 **core-coder** 호출 시 전달한다. Phase 2(구현)에서 **core-designer 산출물(화면설계서)** 이 있으면 해당 문서 경로를 함께 전달한다.

### 8.1 전달 문구(요약)

- “`docs/planning/ERP_FINANCIAL_MANAGEMENT_RENEWAL_PLAN.md`와 화면설계서(`docs/design-system/SCREEN_SPEC_ERP_FINANCIAL_RENEWAL.md`)를 참고해 재무 관리 리뉴얼을 구현해 주세요. 스킬: /core-solution-frontend, /core-solution-atomic-design, /core-solution-unified-modal.”

### 8.2 구현 작업 목록(파일·화면 단위)

1. **FinancialCalendarView.js**
   - [ ] 달력 영역을 **mg-calendar**, **mg-calendar-header**, **mg-calendar-grid**, **mg-calendar-day**, **mg-calendar-nav-btn**, **mg-calendar-day-header** 클래스를 사용하는 구조로 변경. (기존 mg-v2-calendar-grid, mg-financial-calendar-cell-* 제거 또는 래퍼만 유지 후 내부를 공통 구조로.)
   - [ ] 월 네비게이션: ChevronLeft, ChevronRight + mg-calendar-nav-btn.
   - [ ] 날짜 셀: 해당 일 수입/지출 요약 표시 방식은 스펙에 따름. 색상은 `var(--mg-success-*)`, `var(--mg-error-*)` 등 토큰만 사용.
   - [ ] 범례·일별 상세 패널·월 통계: 인라인 하드코딩 색상 제거, 토큰·B0KlA 클래스 적용.
   - [ ] unified-design-tokens.css 내 “Financial Calendar Classes”에서 하드코딩 색(#495057, #dee2e6 등) 제거, var(--mg-*)로 교체.

2. **FinancialManagement.js**
   - [ ] **필터**: 기간 UI 추가(startDate/endDate 또는 dateRange 드롭다운 + 선택 시 날짜 입력). API 호출에 startDate/endDate 반영.
   - [ ] **필터 단순화**: 연동 유형 태그 그룹 제거 또는 “고급 필터” 접기로 이동. 기본 1~2줄에 기간+거래 유형+카테고리+검색만 노출.
   - [ ] 거래 목록 카드: 카드 본문 필드 “필요한 것만” 유지(일자, 유형, 카테고리, 금액, 상태, 매핑). 상세는 기존 모달 유지. 카드 스타일 mg-v2-ad-b0kla__card 또는 MGCard + 토큰.
   - [ ] 대시보드 탭: KPI 카드 4개(수입/지출/순이익/거래 건수) 유지, 색상·카드 클래스 토큰·B0KlA 통일.
   - [ ] 탭: 기존 Pill 탭 유지. Lucide 아이콘만 사용(이모지 없음).

3. **스타일**
   - [ ] ErpCommon.css, IntegratedFinanceDashboard.css 등 재무 관련에서 하드코딩 색상 제거, var(--mg-*) 적용.
   - [ ] 달력 관련 클래스가 unified-design-tokens.css의 mg-calendar 계열과 충돌 없이 재무에서만 확장 사용하도록 정리.

4. **통합 재무 대시보드(2차, 선택)**
   - [ ] IntegratedFinanceDashboard 개요 탭 카드 수·스타일을 B0KlA·토큰으로 통일. 필터 있는 탭이 있으면 동일하게 단순화.

### 8.3 완료 기준 체크리스트

- [ ] 재무 “달력 뷰”가 **mg-calendar** 계열 클래스로 렌더링되는가?
- [ ] 재무 관련 화면에 **하드코딩 hex 색상이 없고** var(--mg-*)만 사용하는가?
- [ ] 거래 탭 필터에 **기간**이 포함되어 있고, **필수 필터만** 노출(기간, 거래 유형, 카테고리, 검색)되는가?
- [ ] 거래 카드·대시보드 카드가 “필요한 것만” 노출하고, B0KlA/토큰을 따르는가?
- [ ] AdminCommonLayout + ContentHeader + ContentArea 구조가 유지되는가?

---

## 9. 실행 위임문

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 0 (선택)**  
   - **서브에이전트**: **explore**  
   - **전달**: “재무 관리(FinancialManagement, FinancialCalendarView, IntegratedFinanceDashboard) 관련 컴포넌트와 CSS에서 하드코딩 색상(#으로 시작하는 hex) 사용 위치, mg-calendar vs mg-v2-calendar-grid 사용 위치 목록을 검색해 파일 경로와 줄 번호를 정리해 주세요.”  
   - **산출물**: 파일·위치 목록(리뉴얼 시 제거/교체할 부분 확인용).

2. **Phase 1 (설계)**  
   - **서브에이전트**: **core-designer**  
   - **전달**: §7 “core-designer 전달용: 작업 목록·체크리스트” 전체 + 본 기획서 경로(`docs/planning/ERP_FINANCIAL_MANAGEMENT_RENEWAL_PLAN.md`) + “화면설계서는 docs/design-system/SCREEN_SPEC_ERP_FINANCIAL_RENEWAL.md(또는 동의한 경로)에 저장해 주세요. 코드 작성 없음.”  
   - **산출물**: 화면설계서(블록·컴포넌트·토큰·달력 통일 스펙).

3. **Phase 2 (구현)**  
   - **서브에이전트**: **core-coder**  
   - **전달**: §8 “core-coder 전달용: 작업 목록·체크리스트” 전체 + 본 기획서 경로 + Phase 1에서 생성된 화면설계서 경로.  
   - **참조 스킬**: /core-solution-frontend, /core-solution-atomic-design, /core-solution-unified-modal.  
   - **작업**: 달력 공통화, 필터 단순화, 카드·색상 토큰 통일, 정보 구조 반영.  
   - **완료 기준**: §8.3 체크리스트 충족.

기획은 여기까지이며, 실제 설계·구현은 core-designer와 core-coder가 수행합니다.

---

## 10. 기획 요약 재확인 및 분배실행 표

**작성일**: 2025-03-04  
**용도**: 부모 에이전트가 Phase 0(선택) → Phase 1 → Phase 2를 호출할 때 사용. 기획만 수행하고 실제 호출은 부모가 분배실행 표대로 진행.

### 10.1 기획 요약 재확인

| 구분 | 범위 | 내용 |
|------|------|------|
| **1차(권장 우선)** | FinancialManagement.js, FinancialCalendarView.js | 달력 공통화(mg-calendar 계열), 필터 단순화(기간 필수 + 거래 유형/카테고리/검색), 카드·색상 토큰 통일, 정보 구조 정리 |
| **2차(선택)** | IntegratedFinanceDashboard.js, BudgetManagement.js | 개요·리포트 탭 카드/색상/필터, 예산 카드 토큰·B0KlA 통일 |

**병렬 가능 여부**
- Phase 0(explore)과 Phase 1(core-designer)은 **순차**: Phase 0 결과는 설계 시 참고용으로만 쓰며, Phase 0 생략 시 Phase 1부터 진행 가능.
- **Phase 1 완료 후 Phase 2**. Phase 2 내에서 파일 단위(FinancialCalendarView / FinancialManagement / 스타일) 병렬은 core-coder 재량.

---

### 10.2 분배실행 표 (호출 시 전달할 프롬프트 전문)

아래 표의 **전달할 prompt 전문**을 그대로 복사해 해당 서브에이전트 호출 시 사용한다.

| Phase | subagent_type | 적용 스킬 | 전달할 prompt 전문 |
|-------|---------------|-----------|--------------------|
| **Phase 0 (선택)** | explore | — | 아래 [Phase 0 전문] |
| **Phase 1 (설계)** | core-designer | /core-solution-atomic-design, B0KlA·unified-design-tokens 참조 | 아래 [Phase 1 전문] |
| **Phase 2 (구현)** | core-coder | /core-solution-frontend, /core-solution-atomic-design, /core-solution-unified-modal | 아래 [Phase 2 전문] |

---

#### [Phase 0 전문] — explore (선택, 있으면 생략 가능)

```
재무 관리(FinancialManagement, FinancialCalendarView, IntegratedFinanceDashboard) 관련 컴포넌트와 CSS에서 다음을 검색해 파일 경로와 줄 번호를 정리해 주세요.

1. 하드코딩 색상: #으로 시작하는 hex 색상 사용 위치 (예: #495057, #dee2e6, #e3f2fd, #fff3cd).
2. 달력 클래스 사용처: mg-calendar, mg-calendar-grid, mg-calendar-day vs mg-v2-calendar-grid, mg-financial-calendar-* 클래스가 사용되는 파일과 위치.

산출물: 파일 경로·줄 번호 목록(리뉴얼 시 제거/교체할 부분 확인용). 목록이 없으면 "해당 없음"으로 보고.
```

---

#### [Phase 1 전문] — core-designer (필수)

```
ERP 재무 관리 모듈 전체 리뉴얼을 위한 화면설계서를 작성해 주세요. 코드 작성 없이 설계 스펙만 산출합니다.

【참조 문서】
- 기획서: docs/planning/ERP_FINANCIAL_MANAGEMENT_RENEWAL_PLAN.md (전체, 특히 §3 달력·§4 리뉴얼 방향·§7 core-designer 체크리스트)
- 어드민 대시보드 샘플: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample
- 디자인 토큰: frontend/src/styles/unified-design-tokens.css (mg-calendar 섹션, B0KlA, 색상 토큰)

【반영할 사용자 관점 (§0.4)】
1. 사용성: 관리자가 거래 조회·기간 필터·달력으로 일별 확인·대시보드 KPI를 빠르게 보는 흐름. 자주 쓰는 동작(기간 선택, 거래 유형, 검색)을 앞에 배치.
2. 정보 노출: 거래 카드는 필수만(일자, 유형, 카테고리, 금액, 상태, 매핑 여부). 상세는 모달. 대시보드는 수입/지출/순이익/거래 건수 4개. 달력은 일별 요약 + 날짜 선택 시 상세 패널.
3. 레이아웃: AdminCommonLayout + ContentHeader + ContentArea. 탭(거래/달력/대시보드) → 필터(거래 탭만, 1~2줄) → 본문(카드 그리드 또는 달력 또는 KPI 카드). 달력은 공통 mg-calendar 구조·클래스를 쓰도록 스펙에 명시.

【설계 시 반영할 체크리스트】
- 달력: 재무 달력이 mg-calendar, mg-calendar-header, mg-calendar-grid, mg-calendar-day, mg-calendar-nav-btn, mg-calendar-day-header 등 공통 달력 클래스를 쓰는 구조로 스펙에 명시. 날짜 셀 내 수입/지출 요약 표시 방식, 범례·일별 상세 패널·월 통계 블록 배치.
- 색상: 모든 영역에서 var(--mg-*) 토큰만 사용. 하드코딩 hex 없음. B0KlA 어드민 색상 참조.
- 카드: 거래 카드·대시보드 카드에 "필요한 것만" 노출. 카드 컴포넌트는 mg-v2-ad-b0kla__card 또는 MGCard 중 하나로 통일 명시.
- 필터: 기간(필수, 드롭다운 또는 기간 픽커 1개), 거래 유형(태그), 카테고리(태그 또는 드롭다운 1개), 검색 1개. 연동 유형은 제거 또는 고급 필터 접기. 1~2줄 레이아웃.
- 정보 구조: 거래 탭 = 필터 + 카드 그리드. 달력 탭 = 달력 + 범례 + (선택 시) 일별 상세 + 월 통계. 대시보드 탭 = KPI 4개 카드.

【산출물】
- docs/design-system/SCREEN_SPEC_ERP_FINANCIAL_RENEWAL.md (또는 동의한 경로)에 저장.
- 코더가 구현할 수 있을 정도로 블록·컴포넌트·클래스·토큰을 명시. 코드 작성 없음.
```

---

#### [Phase 2 전문] — core-coder (Phase 1 산출물 확보 후 호출)

```
docs/planning/ERP_FINANCIAL_MANAGEMENT_RENEWAL_PLAN.md(§8 작업 목록·체크리스트)와 화면설계서 docs/design-system/SCREEN_SPEC_ERP_FINANCIAL_RENEWAL.md를 참고해 재무 관리 리뉴얼을 구현해 주세요. 스킬: /core-solution-frontend, /core-solution-atomic-design, /core-solution-unified-modal.

【구현 작업 목록】
1. FinancialCalendarView.js
   - 달력 영역을 mg-calendar, mg-calendar-header, mg-calendar-grid, mg-calendar-day, mg-calendar-nav-btn, mg-calendar-day-header 클래스 사용 구조로 변경. (기존 mg-v2-calendar-grid, mg-financial-calendar-cell-* 제거 또는 내부를 공통 구조로.)
   - 월 네비: ChevronLeft, ChevronRight + mg-calendar-nav-btn.
   - 날짜 셀: 해당 일 수입/지출 요약 표시는 화면설계서 따름. 색상은 var(--mg-success-*), var(--mg-error-*) 등 토큰만 사용.
   - 범례·일별 상세 패널·월 통계: 인라인 하드코딩 색상 제거, 토큰·B0KlA 클래스 적용.
   - unified-design-tokens.css "Financial Calendar Classes"에서 하드코딩 색(#495057, #dee2e6 등) 제거, var(--mg-*)로 교체.

2. FinancialManagement.js
   - 필터: 기간 UI 추가(startDate/endDate 또는 dateRange 드롭다운 + 선택 시 날짜 입력). API 호출에 startDate/endDate 반영.
   - 필터 단순화: 연동 유형 태그 그룹 제거 또는 "고급 필터" 접기로 이동. 기본 1~2줄에 기간+거래 유형+카테고리+검색만 노출.
   - 거래 목록 카드: 필수만(일자, 유형, 카테고리, 금액, 상태, 매핑). 상세는 기존 모달 유지. 카드 스타일 mg-v2-ad-b0kla__card 또는 MGCard + 토큰.
   - 대시보드 탭: KPI 카드 4개(수입/지출/순이익/거래 건수) 유지, 색상·카드 클래스 토큰·B0KlA 통일.
   - 탭: 기존 Pill 탭 유지. Lucide 아이콘만 사용(이모지 없음).

3. 스타일
   - ErpCommon.css, 재무 관련 CSS에서 하드코딩 색상 제거, var(--mg-*) 적용.
   - 달력 관련 클래스가 unified-design-tokens.css의 mg-calendar 계열과 충돌 없이 재무에서만 확장 사용하도록 정리.

4. (2차 선택) IntegratedFinanceDashboard: 개요 탭 카드 수·스타일을 B0KlA·토큰으로 통일. 필터 있는 탭이 있으면 동일하게 단순화.

【완료 기준 (§8.3)】
- 재무 "달력 뷰"가 mg-calendar 계열 클래스로 렌더링되는가?
- 재무 관련 화면에 하드코딩 hex 색상이 없고 var(--mg-*)만 사용하는가?
- 거래 탭 필터에 기간이 포함되어 있고, 필수 필터만 노출(기간, 거래 유형, 카테고리, 검색)되는가?
- 거래 카드·대시보드 카드가 "필요한 것만" 노출하고 B0KlA/토큰을 따르는가?
- AdminCommonLayout + ContentHeader + ContentArea 구조가 유지되는가?
```

---

### 10.3 실행 순서 및 부모 호출 요약

| 순서 | Phase | 호출 | 비고 |
|------|-------|------|------|
| 0 | Phase 0 (선택) | explore, prompt = [Phase 0 전문] | 생략 가능. 있으면 리뉴얼 대상 위치 확인용 |
| 1 | Phase 1 | core-designer, prompt = [Phase 1 전문] | 산출물: SCREEN_SPEC_ERP_FINANCIAL_RENEWAL.md |
| 2 | Phase 2 | core-coder, prompt = [Phase 2 전문] | Phase 1 산출물 경로 확정 후 호출. Phase 2 내 파일 단위 병렬은 코더 재량 |

---

### 10.4 최종 보고 요약 포맷 (부모 → 사용자)

Phase 1·Phase 2 실행 후 부모 에이전트가 기획에게 결과를 전달하면, 아래 포맷으로 사용자에게 "재무관리 리뉴얼 기획·설계·구현 결과"를 보고할 수 있다.

```markdown
## 재무관리 리뉴얼 기획·설계·구현 결과

### 1. 수행 범위
- 1차: FinancialManagement.js, FinancialCalendarView.js (달력 공통화, 필터 단순화, 카드·색상 토큰)
- 2차(선택): IntegratedFinanceDashboard·BudgetManagement 반영 여부

### 2. Phase별 결과
| Phase | 담당 | 결과 요약 |
|-------|------|-----------|
| Phase 0(선택) | explore | [생략 시 "미실행". 실행 시 하드코딩/달력 클래스 목록 요약] |
| Phase 1 | core-designer | 화면설계서 작성 완료: docs/design-system/SCREEN_SPEC_ERP_FINANCIAL_RENEWAL.md [또는 실제 저장 경로] |
| Phase 2 | core-coder | [구현 완료 항목: 달력 공통화 / 필터 기간+단순화 / 카드·토큰 / 스타일 정리. 완료 기준 §8.3 체크 결과] |

### 3. 산출물
- 기획서: docs/planning/ERP_FINANCIAL_MANAGEMENT_RENEWAL_PLAN.md
- 화면설계서: docs/design-system/SCREEN_SPEC_ERP_FINANCIAL_RENEWAL.md
- 수정된 파일: [FinancialCalendarView.js, FinancialManagement.js, ErpCommon.css, unified-design-tokens.css 등]

### 4. 참고·후속
- API·백엔드·권한 변경 없음. 2차(통합 재무·예산)는 선택 적용.
- 추가 테스트·E2E는 core-tester 위임 가능.
```
