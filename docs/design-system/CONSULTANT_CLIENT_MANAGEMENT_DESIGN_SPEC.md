# 상담사·내담자 관리 전면 아토믹 디자인 개편 스펙

**버전**: 1.0.0  
**최종 업데이트**: 2026-02-24  
**기준**: 어드민 대시보드 샘플, MappingManagementPage, AdminDashboardV2  
**대상**: ConsultantComprehensiveManagement, ClientComprehensiveManagement 두 페이지

---

## 1. 개요

상담사 관리·내담자 관리 페이지의 **전면 아토믹 디자인 개편** UI/UX·레이아웃·비주얼 설계 스펙입니다.  
core-coder는 이 스펙만으로 **추측 없이** MappingManagementPage·AdminDashboard와 동일한 비주얼을 구현할 수 있어야 합니다.

| 페이지 | 내용 |
|--------|------|
| **상담사 관리** | 상담사 목록·필터·탭(종합관리/기본관리)·모달·통계 |
| **내담자 관리** | 내담자 목록·필터·탭(overview/consultation/mapping/statistics)·모달·통계 |

- **단일 소스**: `unified-design-tokens.css`, `dashboard-tokens-extension.css`, `AdminDashboardB0KlA.css`, B0KlA·mg-* 클래스만 사용.
- **참조 구현(구조)**: `MappingManagementPage.js`, `MappingKpiSection`, `MappingSearchSection`, `MappingListBlock`, `ContentArea`, `ContentHeader`.

---

## 2. 레이아웃 스펙

### 2.1 전체 구조

- **권장**: 매칭 페이지와 동일하게 `ContentArea` 기반 구조로 전환.
  - 루트: `mg-v2-ad-b0kla mg-v2-consultant-management` 또는 `mg-v2-client-management`
  - 컨테이너: `mg-v2-ad-b0kla__container`
  - 내부: `ContentArea` > `ContentHeader` + `[탭]` + `SearchSection` + `KpiSection` + `ListBlock` / `TabContent`
- **대안**: `AdminCommonLayout` 유지 시, main 영역 내부만 위와 동일한 `ContentHeader` + `SearchSection` + `KpiSection` + `ListBlock` 구조로 통일.

### 2.2 섹션 순서 (매칭 페이지와 동일)

1. **ContentHeader** — 제목·서브타이틀·액션(추가 버튼)
2. **탭 바** — (내담자: overview/consultation/mapping/statistics, 상담사: comprehensive/basic)
3. **SearchSection** — 검색 입력 + 필터 칩 (매칭 페이지: MappingSearchSection → MappingKpiSection 순)
4. **KpiSection** — 핵심 지표 카드
5. **ListBlock** / **TabContent** — 목록(카드/테이블) 또는 탭별 콘텐츠

### 2.3 ContentHeader

- **클래스**: `mg-v2-content-header` (ContentHeader 컴포넌트 사용)
- **구조**:
  - `mg-v2-content-header__left`: `mg-v2-content-header__title`, `mg-v2-content-header__subtitle`
  - `mg-v2-content-header__right`: 액션 버튼(추가·새로고침 등)
- **상담사**: title "상담사 관리", subtitle "상담사의 모든 정보를 종합적으로 관리하고 분석할 수 있습니다", action "➕ 새 상담사 등록"
- **내담자**: title "내담자 관리", subtitle "내담자 정보·상담 이력·매칭·통계를 종합 관리합니다", action "➕ 새 내담자 등록"
- **액션 버튼 클래스**: `mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary` 또는 동일 스타일 `mg-v2-button mg-v2-button-primary`

### 2.4 탭 바

- **클래스**: `mg-v2-ad-b0kla__pill-toggle` 또는 매칭/대시보드와 통일된 `mg-v2-tabs` / `mg-v2-section-tabs`
- **내담자 탭**: `overview`(개요), `consultation`(상담이력), `mapping`(매칭), `statistics`(통계)
- **상담사 탭**: `comprehensive`(종합관리), `basic`(기본관리)
- **활성 탭**: `mg-v2-ad-b0kla__pill--active` 또는 `mg-v2-tab-active`
- **토큰**: `var(--ad-b0kla-green)`, `var(--ad-b0kla-border)`, `var(--ad-b0kla-bg)`

### 2.5 KPI/통계 영역

- **클래스 패턴**: `mg-v2-mapping-kpi-section` 동일
  - 상담사: `mg-v2-consultant-kpi-section` 또는 공용 `mg-v2-kpi-section`
  - 내담자: `mg-v2-client-kpi-section` 또는 공용 `mg-v2-kpi-section`
- **그리드**: `mg-v2-mapping-kpi-section__grid` — `grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))`, `gap: 1rem`
- **카드**: `mg-v2-mapping-kpi-section__card` — 아이콘(`mg-v2-mapping-kpi-section__icon--{green|orange|blue|gray}`) + `mg-v2-mapping-kpi-section__info` (label + value)
- **상담사 KPI 예시**: 총 상담사, 활성 매칭, 총 스케줄, 오늘 스케줄
- **내담자 KPI 예시**: 총 내담자, 활성 내담자, 대기, 총 매칭 수

### 2.6 검색·필터 영역

- **클래스 패턴**: `mg-v2-mapping-search-section` 동일
  - 상담사: `mg-v2-consultant-search-section` 또는 공용 `mg-v2-search-section`
  - 내담자: `mg-v2-client-search-section` 또는 공용 `mg-v2-search-section`
- **구조**:
  - `mg-v2-mapping-search-section__row` (flex, 768px 이상 row)
  - `mg-v2-mapping-search-section__input-wrap` — SearchInput 또는 동일 스타일 입력
  - `mg-v2-mapping-search-section__chips` — 필터 칩
  - 칩: `mg-v2-mapping-search-section__chip`, `mg-v2-mapping-search-section__chip--active`
- **Placeholder**: "이름, 이메일, 전화번호 또는 #태그로 검색..."

### 2.7 목록 영역

- **클래스 패턴**: `mg-v2-mapping-list-block` 동일
  - 상담사: `mg-v2-consultant-list-block`
  - 내담자: `mg-v2-client-list-block`
- **컨테이너**: `ContentSection` noCard + `ContentCard` — `mg-v2-mapping-list-block__card`
- **헤더**: `mg-v2-mapping-list-block__header` — 제목 + 뷰 전환(카드/테이블) `mg-v2-ad-b0kla__pill-toggle`
- **목록 그리드**: `mg-v2-mapping-list-block__grid` — `flex-direction: column`, `gap: 0.75rem`
- **테이블 사용 시**: `mg-table`, `mg-card` 등 매칭 페이지 MappingTableView와 동일 클래스

### 2.8 반응형

| 브레이크포인트 | 동작 |
|----------------|------|
| ≥1025px | 그리드 4열(KPI), 검색+필터 가로 배치 |
| 769px~1024px | 그리드 2열, 검색+필터 가로 유지 |
| ≤768px | 그리드 1열, 검색+필터 세로, 카드 1열 |

- **검색 섹션**: 768px 미만에서 `flex-direction: column`

---

## 3. 아토믹 컴포넌트 구성

### 3.1 Organism

| Organism | 용도 | 자식 |
|----------|------|------|
| **ConsultantManagementPage** | 상담사 관리 페이지 | ContentArea > ContentHeader, ConsultantTabBar, ConsultantSearchSection, ConsultantKpiSection, ConsultantListBlock / BasicManagementSection |
| **ClientManagementPage** | 내담자 관리 페이지 | ContentArea > ContentHeader, ClientTabBar, ClientSearchSection, ClientKpiSection, ClientListBlock / ClientOverviewTab / ClientConsultationTab / ClientMappingTab / ClientStatisticsTab |

- **ContentArea**: `mg-v2-content-area`
- **ContentHeader**: `mg-v2-content-header`
- **KpiSection**: `ContentSection` noCard + `mg-v2-*-kpi-section`, 내부 `mg-v2-mapping-kpi-section__grid` 패턴
- **SearchSection**: `ContentSection` noCard + `mg-v2-*-search-section`
- **ListBlock**: `ContentSection` noCard + `ContentCard` + `mg-v2-*-list-block`
- **TabContent**: `mg-v2-tab-content` — 내담자 4개 탭, 상담사 2개 탭

### 3.2 Molecule

| Molecule | 클래스 | 용도 |
|----------|--------|------|
| **KpiSection** | `mg-v2-mapping-kpi-section__*` | 매칭·상담사·내담자 KPI 카드 공용 |
| **SearchSection** | `mg-v2-mapping-search-section__*` | 검색 + 칩 필터 |
| **FilterSection** | (SearchSection에 통합) | 상태·등급 등 필터 칩 |
| **ListSection** | `mg-v2-mapping-list-block__*` | 목록 카드/테이블 컨테이너 |
| **TabBar** | `mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill` | 탭 네비게이션 |
| **DataTable** | `mg-table`, `mg-table__header`, `mg-table__body` | 테이블 뷰 |
| **CardRow** | `mg-v2-consultant-card`, `mg-v2-client-card` | 상담사/내담자 카드 행 |
| **EmptyState** | `mg-v2-mapping-list-block__empty`, `mg-empty-state` | 빈 목록 |

### 3.3 Atom

| Atom | 클래스 | 용도 |
|------|--------|------|
| 버튼 | `mg-button`, `mg-v2-button`, `mg-v2-mapping-header-btn` | 액션 |
| 입력 | SearchInput(dashboard-v2), `mg-input` | 검색 |
| 배지 | `mg-badge`, `mg-badge--sm`, `mg-v2-status-badge` | 상태·등급 |
| 카드 | `mg-card`, `mg-card__header`, `mg-card__body` | 목록 아이템 |
| 아이콘 | lucide-react | KPI·액션 |

---

## 4. 비주얼·토큰

### 4.1 허용 토큰 (하드코딩 금지)

| 용도 | 토큰 |
|------|------|
| 배경 | `var(--ad-b0kla-bg)`, `var(--ad-b0kla-card-bg)` |
| 테두리 | `var(--ad-b0kla-border)` |
| 모서리 | `var(--ad-b0kla-radius)`, `var(--ad-b0kla-radius-sm)` |
| 그림자 | `var(--ad-b0kla-shadow)`, `var(--ad-b0kla-shadow-hover)` |
| 제목 | `var(--ad-b0kla-title-color)`, `var(--font-size-xl)` |
| 서브타이틀/보조 | `var(--ad-b0kla-text-secondary)`, `var(--ad-b0kla-subtitle-color)` |
| 주조색 | `var(--ad-b0kla-green)`, `var(--ad-b0kla-green-bg)` |
| 경고/포인트 | `var(--ad-b0kla-orange)`, `var(--ad-b0kla-orange-bg)` |
| 정보 | `var(--ad-b0kla-blue)`, `var(--ad-b0kla-blue-bg)` |
| 위험 | `var(--ad-b0kla-danger)` |
| 간격 | `var(--mg-spacing-xs)`, `--mg-spacing-sm`, `--mg-spacing-md`, `--mg-spacing-lg`, `--mg-spacing-xl`, `var(--mg-layout-gap)` |

### 4.2 카드·테이블·배지

- **카드**: `var(--ad-b0kla-card-bg)`, `1px solid var(--ad-b0kla-border)`, `var(--ad-b0kla-radius-sm)`, `var(--ad-b0kla-shadow)`
- **KPI 아이콘**: `mg-v2-mapping-kpi-section__icon--green|orange|blue|gray` — 배경·색상 토큰 사용
- **배지**: `mg-badge--success`, `mg-badge--warning`, `mg-badge--info`, `mg-badge--error` — `--mg-success-500`, `--mg-warning-500` 등
- **버튼**: `mg-v2-mapping-header-btn--primary` — `var(--ad-b0kla-green)`, `var(--ad-b0kla-card-bg)`

### 4.3 섹션 블록

- 각 콘텐츠 구역: `ContentSection` — `mg-v2-content-section`, `mg-v2-content-section--card` 또는 `--plain`
- 좌측 악센트: 필요 시 `border-left: 4px solid var(--ad-b0kla-green)` (섹션 제목용)

---

## 5. 디테일

### 5.1 모달

- **규격**: UnifiedModal·MGModal 필수 (core-solution-unified-modal 스킬)
- **size**: small / medium / large
- **상담사 모달**: view(상세), create, edit, delete — medium~large
- **내담자 모달**: ClientModal — medium~large
- **비밀번호 초기화**: PasswordResetModal — small~medium
- **삭제 확인**: MGConfirmModal — small

### 5.2 로딩

- **전체 페이지**: `UnifiedLoading type="page" text="데이터를 불러오는 중..." variant="pulse"`
- **로딩 컨테이너**: `mg-v2-ad-b0kla__container` 내부에 전체 덮기

### 5.3 빈 상태

- **클래스**: `mg-v2-mapping-list-block__empty`
  - `mg-v2-mapping-list-block__empty-icon`
  - `mg-v2-mapping-list-block__empty-title`
  - `mg-v2-mapping-list-block__empty-desc`
  - `mg-v2-mapping-list-block__empty-btn`
- **공용 빈 상태**: `mg-empty-state`, `mg-text-muted`

### 5.4 에러/성공 토스트

- 기존 `notificationManager`, `showSuccess`, `showError` 유지

---

## 6. 페이지별 구체 스펙

### 6.1 상담사 관리 (ConsultantComprehensiveManagement)

| 영역 | 클래스 | 비고 |
|------|--------|------|
| 루트 | `mg-v2-ad-b0kla mg-v2-consultant-management` | |
| ContentHeader | title "상담사 관리", subtitle "상담사의 모든 정보를 종합적으로 관리하고 분석할 수 있습니다" | |
| 탭 | `mg-v2-section-tabs` — comprehensive, basic | |
| KPI | 총 상담사, 활성 매칭, 총 스케줄, 오늘 스케줄 | `mg-v2-mapping-kpi-section__*` |
| 검색 | `UnifiedFilterSearch` 또는 `mg-v2-mapping-search-section` 패턴 | placeholder "이름, 이메일, 전화번호 또는 #태그로 검색..." |
| 목록 카드 | `mg-v2-consultant-card`, `mg-consultant-card--detailed` | 상태배지 `mg-v2-consultant-card__status-badge` |
| 기본관리 섹션 | 새 상담사 등록 버튼 + 검색/필터 + 동일 카드 목록 | |

### 6.2 내담자 관리 (ClientComprehensiveManagement)

| 영역 | 클래스 | 비고 |
|------|--------|------|
| 루트 | `mg-v2-ad-b0kla mg-v2-client-management` | |
| ContentHeader | title "내담자 관리", subtitle "내담자 정보·상담 이력·매칭·통계를 종합 관리합니다" | |
| 탭 | `mg-v2-section-tabs` — comprehensive, consultation, mapping, statistics | |
| KPI | 총 내담자, 활성, 대기, 총 매칭 | `mg-v2-mapping-kpi-section__*` |
| 검색 | 동일 | |
| TabContent | ClientOverviewTab, ClientConsultationTab, ClientMappingTab, ClientStatisticsTab | 각 탭 내부도 동일 카드·테이블 패턴 |
| 목록 카드 | `mg-v2-client-card`, `mg-v2-card`, `mg-v2-card-header`, `mg-v2-card-content`, `mg-v2-card-footer` | |

---

## 7. core-coder용 체크리스트

- [ ] 상담사·내담자 페이지 모두 `ContentArea` + `ContentHeader` 구조 적용 (또는 AdminCommonLayout 유지 시 내부 구조: ContentHeader → SearchSection → KpiSection → ListBlock).
- [ ] ContentHeader: `mg-v2-content-header`, `mg-v2-content-header__title`, `mg-v2-content-header__subtitle`, `mg-v2-content-header__right` 액션.
- [ ] KPI: `mg-v2-mapping-kpi-section__grid`, `mg-v2-mapping-kpi-section__card`, `mg-v2-mapping-kpi-section__icon--{green|orange|blue|gray}`, `mg-v2-mapping-kpi-section__label`, `mg-v2-mapping-kpi-section__value`.
- [ ] 검색: `mg-v2-mapping-search-section__row`, `mg-v2-mapping-search-section__input-wrap`, `mg-v2-mapping-search-section__chips`, `mg-v2-mapping-search-section__chip`, `mg-v2-mapping-search-section__chip--active`.
- [ ] 목록: `mg-v2-mapping-list-block__card`, `mg-v2-mapping-list-block__header`, `mg-v2-mapping-list-block__grid`, `mg-v2-mapping-list-block__empty`(빈 상태).
- [ ] 탭: `mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active`.
- [ ] 모든 색·간격·radius는 `--ad-b0kla-*`, `--mg-*` 토큰만 사용 (하드코딩 금지).
- [ ] 모달: UnifiedModal/MGModal, PasswordResetModal, MGConfirmModal.
- [ ] 로딩: UnifiedLoading type="page".
- [ ] 빈 상태: `mg-v2-mapping-list-block__empty` 또는 `mg-empty-state`.

---

**문서 끝.**  
구현 시 `MappingManagementPage.js`, `MappingKpiSection`, `MappingSearchSection`, `MappingListBlock`, `ContentArea`, `ContentHeader`, `AdminDashboardB0KlA.css`, `unified-design-tokens.css`, `dashboard-tokens-extension.css`를 함께 참고하면 됩니다.
