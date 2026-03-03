# ERP 대시보드 디자인 제안서

**대상**: MindGarden ERP 대시보드  
**목적**: 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)과 동일한 비주얼·레이아웃 패턴으로 통일하여 사용자 편의 및 일관성 확보  
**참조**: `docs/design-system/PENCIL_DESIGN_GUIDE.md`, AdminCommonLayout + ContentArea + ContentHeader + B0KlA 카드 패턴(시스템 설정, 심리검사 관리, 패키지 요금 등)  
**산출**: 디자인 관점 제안만 포함, 코드 미포함  

---

## 1. 현황 요약 (Before)

| 구분 | 현재 ERP 대시보드 | 어드민 대시보드 샘플·B0KlA 페이지 |
|------|-------------------|-------------------------------------|
| **상단 영역** | `mg-dashboard-header` + `mg-dashboard-title` / `mg-dashboard-subtitle` (커스텀 헤더) | `ContentHeader` (`mg-v2-content-header`, `mg-v2-content-header__title` / `__subtitle`, `__right` 액션) |
| **본문 래퍼** | `mg-dashboard-layout` > `mg-dashboard-content` | `ContentArea` (`mg-v2-content-area`) |
| **통계 영역** | `mg-dashboard-stats` + `StatCard` 4칸 (총 아이템, 승인 대기, 총 주문, 예산 사용률) | `ContentKpiRow` + `mg-v2-content-kpi-card` (B0KlA KPI 카드 그리드) |
| **빠른 액션** | `DashboardSection` (`mg-dashboard-section--card`) 내부 `mg-management-grid` + `mg-management-card` | 섹션을 `mg-v2-ad-b0kla__card`로 감싼 뒤, `mg-management-grid mg-v2-ad-b0kla__admin-grid` + `mg-v2-ad-b0kla__admin-card` (버튼 카드) |
| **섹션 블록** | `mg-dashboard-section--card` (ad-b0kla 토큰 일부 사용) | `mg-v2-ad-b0kla__card` + 필요 시 `mg-v2-ad-b0kla__section-title`·좌측 악센트 |

**차이로 인한 문제**: ERP만 다른 클래스·토큰 체계를 사용하여 어드민과 비주얼·간격·호버가 달라 보이고, 신규 개발 시 "어디를 따라 가야 하는지" 불명확함.

---

## 2. 레이아웃 개선안

### 2.1 상단: ContentHeader 도입

- **Before**: ERP 전용 `mg-dashboard-header`, `mg-dashboard-header-content`, `mg-dashboard-title`, `mg-dashboard-subtitle`, `mg-dashboard-header-right` 사용.
- **After**: 어드민과 동일하게 **ContentHeader** 사용.
  - **제목**: "ERP 관리 시스템" → `ContentHeader`의 `title` (클래스: `mg-v2-content-header__title`).
  - **부제**: "통합 자원 관리 및 회계 시스템" + 터넌트 정보(선택) → `ContentHeader`의 `subtitle` (클래스: `mg-v2-content-header__subtitle`).
  - **우측 액션**: "새로고침" 버튼 → `ContentHeader`의 `actions` 슬롯에 배치 (클래스: `mg-v2-content-header__right`).
- **구조 제안**:  
  `AdminCommonLayout` > **ContentArea** > **ContentHeader** (title, subtitle, actions) > 통계 행 > 빠른 액션 섹션 > 최근 활동 섹션.

→ 상단 바 높이·타이포·여백이 어드민과 동일해지고, 브레드크럼이 있는 레이아웃과도 정렬이 맞춰진다.

### 2.2 통계 영역: B0KlA KPI 카드 그리드로 전환

- **Before**: `mg-dashboard-stats` + `StatCard` 4칸. 그리드/카드 스타일이 `dashboard-common-v3.css`, `unified-design-tokens.css`의 `mg-dashboard-stats`·`mg-dashboard-stat-card` 계열.
- **After**: 어드민 대시보드 개요와 동일하게 **ContentKpiRow** + **mg-v2-content-kpi-card** 사용 (B0KlA KPI 카드).
  - **그리드**: `mg-v2-content-kpi-row` (grid, auto-fit, minmax(240px, 1fr), gap: `var(--mg-layout-grid-gap)`).
  - **카드**: `mg-v2-content-kpi-card` (배경 `var(--ad-b0kla-card-bg)`, 테두리 `var(--ad-b0kla-border)`, radius `var(--ad-b0kla-radius)`, 패딩 1.5rem).
  - **아이콘 변형**: green / orange / blue / gray 등 기존 ContentKpiRow 변형 활용 (예: 승인 대기는 orange, 예산은 blue 등).
- **카드 수·순서 제안** (유지): 4개  
  1) 총 아이템 수 → 2) 승인 대기 요청 → 3) 총 주문 수 → 4) 예산 사용률.  
  (필요 시 "미결제 건수" 등 5번째 KPI 추가 시에도 동일 그리드에 한 칸 더 추가하면 됨.)
- **클릭 동작**: 각 KPI 카드는 현재처럼 해당 메뉴로 이동하도록 유지. 카드에 `cursor: pointer`, 호버 시 `box-shadow` 강화 (ContentKpiRow.css의 hover와 동일).

→ 통계 영역이 어드민 "대시보드 개요" KPI 행과 동일한 비주얼이 되어, 한 플랫폼 내 일관성이 확보된다.

### 2.3 빠른 액션 섹션: 어드민처럼 카드 그리드(mg-v2-ad-b0kla__card)로 재구성

- **Before**: `DashboardSection` (클래스 `mg-dashboard-section mg-dashboard-section--card`)로 감싼 뒤, 내부에 `mg-management-grid` + `mg-management-card` (div + onClick).
- **After**:
  - **섹션 래퍼**: "빠른 액션" 영역 전체를 **하나의** `mg-v2-ad-b0kla__card` 블록으로 감싼다. (어드민의 "대시보드 개요" 하단 카드 블록과 동일한 카드 스타일.)
  - **섹션 제목**: 카드 상단에 **좌측 악센트 바**(폭 4px, `var(--ad-b0kla-green)` 또는 `var(--mg-color-primary-main)`, radius 2px) + 제목 텍스트 "빠른 액션" (클래스 예: `mg-v2-ad-b0kla__section-title`, 16px, fontWeight 700, `var(--ad-b0kla-title-color)`).
  - **카드 그리드**: `mg-management-grid`와 **동일 그리드**를 쓰되, **B0KlA 어드민 카드** 스타일 적용.
    - 그리드: `mg-management-grid mg-v2-ad-b0kla__admin-grid` (grid, auto-fit, minmax(200px, 1fr), gap 1rem).
    - 개별 카드: **버튼**으로 마크업하고 클래스 `mg-v2-ad-b0kla__admin-card` 사용. (어드민 샘플처럼 `button` + `mg-v2-ad-b0kla__admin-icon`, `mg-v2-ad-b0kla__admin-label`, `mg-v2-ad-b0kla__admin-desc`.)
  - **아이콘**: `mg-v2-ad-b0kla__admin-icon` + 변형 `--green` / `--orange` / `--blue` / `--gray` 등으로 기능별 구분 가능.

→ 빠른 액션이 "시스템 설정", "심리검사 관리" 등 다른 어드민 페이지의 카드 그리드와 동일한 카드·호버·간격을 갖게 된다.

### 2.4 최근 활동 섹션

- **Before**: `DashboardSection` (`mg-dashboard-section--card`) + 내부 `mg-empty-state`.
- **After**: 동일하게 **한 블록**으로 두되, 블록 스타일만 B0KlA로 통일.
  - 래퍼: `mg-v2-ad-b0kla__card`.
  - 제목: 좌측 악센트 바 + "최근 활동" (`mg-v2-ad-b0kla__section-title`).
  - 빈 상태: 기존 `mg-empty-state` 유지하되, 텍스트 색은 `var(--mg-color-text-secondary)` 또는 `var(--ad-b0kla-text-secondary)` 사용.

→ 레이아웃 구조는 그대로 두고, 카드·타이포·색만 어드민과 맞춘다.

---

## 3. 비주얼 스펙 (토큰·클래스·수치)

### 3.1 사용할 토큰·클래스 (단일 소스 준수)

- **색상**: `var(--mg-color-background-main)`, `var(--mg-color-primary-main)`, `var(--mg-color-text-main)`, `var(--mg-color-text-secondary)`, `var(--mg-color-surface-main)`, `var(--mg-color-border-main)` 및 B0KlA 확장 `var(--ad-b0kla-card-bg)`, `var(--ad-b0kla-border)`, `var(--ad-b0kla-title-color)`, `var(--ad-b0kla-subtitle-color)`, `var(--ad-b0kla-text-secondary)`, `var(--ad-b0kla-green)`, `var(--ad-b0kla-orange)`, `var(--ad-b0kla-blue)` 등.
- **간격**: `var(--mg-spacing-xs)` ~ `var(--mg-spacing-xl)`, `var(--mg-layout-gap)`, `var(--mg-layout-grid-gap)`.
- **radius**: `var(--ad-b0kla-radius)` (카드 16~24px), `var(--ad-b0kla-radius-sm)` (작은 요소), 아이콘 16px.
- **타이포**: Noto Sans KR. 제목 28px/700(ContentHeader), 섹션 제목 16px/700, 본문 14~15px, 라벨/캡션 12px. (ContentHeader.css, AdminDashboardB0KlA.css 기준.)

### 3.2 카드 호버·여백·radius 제안

| 요소 | 클래스 | 호버 | 여백 | radius |
|------|--------|------|------|--------|
| KPI 카드 | `mg-v2-content-kpi-card` | box-shadow 강화 (0 12px 32px rgba(0,0,0,0.08)) | padding 1.5rem, gap 1.5rem | `var(--ad-b0kla-radius)` |
| 빠른 액션 카드 | `mg-v2-ad-b0kla__admin-card` | translateY(-2px), box-shadow `var(--ad-b0kla-shadow)` | padding 1.5rem, gap 1rem | 16px |
| 섹션 카드(블록) | `mg-v2-ad-b0kla__card` | 없음 (컨테이너) | padding 1.5rem, margin-bottom 1.5rem | `var(--ad-b0kla-radius)` |
| 섹션 제목 악센트 | — | — | 왼쪽 4px 세로 바 | 2px |

### 3.3 반응형

- **ContentArea / ContentKpiRow / admin-grid**: 기존 어드민과 동일. 768px 이하에서 KPI 카드 폰트 크기 조정, 그리드 단수 조정 등 `ContentKpiRow.css`, `AdminDashboardB0KlA.css` 미디어쿼리 따름.
- **ERP 전용**: 본문 패딩 24~32px, `var(--mg-layout-grid-gap)` 유지. 375~3840 브레이크포인트는 `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` 및 PENCIL_DESIGN_GUIDE 기준.

---

## 4. 섹션별 Before → After 요약

1. **상단**  
   - **Before**: `mg-dashboard-header` + 자체 타이틀/서브타이틀/새로고침.  
   - **After**: `ContentArea` 직하위에 `ContentHeader` (title="ERP 관리 시스템", subtitle=통합 자원 관리 설명 + 터넌트, actions=새로고침 버튼).

2. **통계**  
   - **Before**: `mg-dashboard-stats` + StatCard 4칸.  
   - **After**: `ContentKpiRow` + `mg-v2-content-kpi-card` 4칸 (동일 순서·지표). 토큰·호버는 B0KlA KPI와 동일.

3. **빠른 액션**  
   - **Before**: `DashboardSection` (`mg-dashboard-section--card`) + `mg-management-grid` + `mg-management-card` (div).  
   - **After**: `mg-v2-ad-b0kla__card` 1개로 섹션 감싼 뒤, 제목은 좌측 악센트 바 + "빠른 액션", 그리드는 `mg-management-grid mg-v2-ad-b0kla__admin-grid`, 개별 항목은 `button.mg-v2-ad-b0kla__admin-card` + 아이콘/라벨/설명.

4. **최근 활동**  
   - **Before**: `DashboardSection` (`mg-dashboard-section--card`) + `mg-empty-state`.  
   - **After**: `mg-v2-ad-b0kla__card` + 악센트 제목 "최근 활동" + 동일 빈 상태. 색상만 `var(--mg-*)`/`var(--ad-b0kla-*)` 사용.

---

## 5. 기획서와의 관계

- **ERP_DASHBOARD_IMPROVEMENT_PLAN** 등 별도 ERP 대시보드 기획서는 확인되지 않았으며, 본 제안은 **(1) 레이아웃·(2) 비주얼**을 어드민 샘플 및 B0KlA 패턴에 맞추는 **독립 디자인 제안**으로 작성되었다.
- 향후 `ERP_LAYOUT_DESIGN_REVIEW.md`, `ERP_SECTION_AUDIT_AND_PLANNING.md` 등과 통합 기획이 생기면, 본 제안의 "ContentArea + ContentHeader + B0KlA 카드/KPI" 구조를 공통 기준으로 두고 맞추면 된다.

---

## 6. 적용 시 체크리스트 (디자이너·코더)

- [ ] ERP 대시보드 본문이 `ContentArea`로 감싸져 있는가?
- [ ] 상단이 `ContentHeader` (title, subtitle, actions)로만 구성되는가?
- [ ] 통계가 `ContentKpiRow` + `mg-v2-content-kpi-card`를 쓰는가? (`mg-dashboard-stats` 미사용)
- [ ] 빠른 액션이 `mg-v2-ad-b0kla__card` + `mg-v2-ad-b0kla__admin-grid` + `mg-v2-ad-b0kla__admin-card`를 쓰는가? (`mg-dashboard-section--card` + `mg-management-card` 미사용)
- [ ] 색·간격·radius에 `var(--mg-*)`, `var(--ad-b0kla-*)`(또는 `mg-v2-*` 클래스)만 사용했는가?
- [ ] PENCIL_DESIGN_GUIDE 및 어드민 대시보드 샘플과 비주얼이 일치하는가?

---

**문서 버전**: 1.0  
**작성**: Core Designer (디자인 전용 제안, 코드 미포함)
