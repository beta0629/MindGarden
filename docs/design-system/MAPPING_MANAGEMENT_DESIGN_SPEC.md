# 매칭 관리 페이지 디자인 스펙 (Mapping Management)

**버전**: 1.0.0  
**최종 업데이트**: 2025-02-22  
**기준**: 어드민 대시보드 샘플 (https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample) / AdminDashboardV2  
**참조**: mindgarden-design-system.pen B0KlA, AdminDashboardB0KlA.css, dashboard-v2 content 컴포넌트

---

## 1. 개요

`admin/mapping-management` 페이지가 어드민 대시보드(AdminDashboardV2, admin-dashboard-sample)와 **동일한 비주얼 언어**를 따르도록 하는 디자인 스펙입니다. core-coder가 바로 적용 가능한 CSS 클래스명, 토큰명, 구조를 명시합니다.

---

## 2. 레이아웃·쓰임새

- **부모**: `MappingManagement` → `DesktopLayout`/`MobileLayout` → `MappingManagementPage` (ContentArea 내부)
- **좌측 GNB/LNB**: AdminDashboardV2와 동일 (기존 유지)
- **메인 콘텐츠**: `ContentArea` (`.mg-v2-content-area`) 내부, `gap: var(--mg-layout-grid-gap, 1.5rem)`
- **전체 래퍼**: `mg-v2-ad-b0kla mg-v2-ad-dashboard-v2` (이미 적용됨)

---

## 3. B0KlA 토큰 (AdminDashboardB0KlA.css)

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `--ad-b0kla-bg` | #fcfbfa | 페이지 배경 |
| `--ad-b0kla-card-bg` | #ffffff | 카드·섹션 배경 |
| `--ad-b0kla-border` | #e2e8f0 | 테두리 |
| `--ad-b0kla-radius` | 24px | 카드 corner-radius |
| `--ad-b0kla-radius-sm` | 12px | 버튼·입력 필드 radius |
| `--ad-b0kla-shadow` | 0 8px 24px rgba(0,0,0,0.05) | 카드 그림자 |
| `--ad-b0kla-title-color` | #2d3748 | 제목 텍스트 |
| `--ad-b0kla-subtitle-color` | #718096 | 부제목 |
| `--ad-b0kla-text-secondary` | #64748b | 라벨·보조 텍스트 |
| `--ad-b0kla-placeholder` | #a0aec0 | placeholder |
| `--ad-b0kla-green` | #4b745c | 주조·활성 |
| `--ad-b0kla-green-bg` | #ebf2ee | green 아이콘 배경 |
| `--ad-b0kla-orange` | #e8a87c | 오렌지 |
| `--ad-b0kla-orange-bg` | #fcf3ed | 오렌지 배경 |
| `--ad-b0kla-blue` | #6d9dc5 | 블루 |
| `--ad-b0kla-blue-bg` | #f0f5f9 | 블루 배경 |

---

## 4. 헤더 (타이틀·설명·버튼)

### 4.1 현재 vs 목표

| 구분 | 현재 | 목표 |
|------|------|------|
| 구조 | `mg-v2-ad-b0kla__header` + `mg-v2-mapping-header__title` | ContentHeader와 동일 레이아웃 |
| 타이틀 | 28px, 700, ad-b0kla-title-color | 동일 유지 |
| 부제목 | 15px, ad-b0kla-subtitle-color | 동일 유지 |
| 액션 | `mg-v2-button mg-v2-button-primary` | B0KlA 버튼 토큰 적용 |

### 4.2 적용 스펙

- **컨테이너**: `mg-v2-content-header` (ContentHeader와 동일)
- **좌측**: `mg-v2-content-header__left` → `mg-v2-content-header__title`, `mg-v2-content-header__subtitle`
- **우측 액션**: `mg-v2-content-header__actions` (신규 추가) 또는 기존 `mg-v2-ad-b0kla__header-right` 유지
- **버튼**: `mg-v2-button-primary` 또는 B0KlA 버튼 스타일
  - 배경: `var(--ad-b0kla-green)`
  - 텍스트: `var(--ad-b0kla-card-bg)`
  - padding: 10px 20px, height 40px, border-radius 10px

### 4.3 MappingContentHeader 수정 방향

```html
<!-- 권장 마크업 -->
<header class="mg-v2-content-header">
  <div class="mg-v2-content-header__left">
    <h1 class="mg-v2-content-header__title">매칭 관리</h1>
    <p class="mg-v2-content-header__subtitle">상담사와 내담자 간의 매칭을 관리합니다.</p>
  </div>
  <div class="mg-v2-content-header__actions">
    <button type="button" class="mg-v2-button mg-v2-button-primary">…</button>
  </div>
</header>
```

- ContentHeader에 `actions` prop 추가하여 우측 버튼 영역 지원하거나,
- MappingContentHeader에서 `mg-v2-content-header`를 사용하고 `display: flex; justify-content: space-between; align-items: center;`로 좌/우 배치

---

## 5. 필터/검색 영역 (MappingFilterSection)

### 5.1 적용 스펙

- **섹션 래퍼**: `ContentSection` with `noCard` → `mg-v2-content-section mg-v2-content-section--plain`
- **필터 영역 컨테이너**: `mg-v2-ad-b0kla__card`로 감싸서 B0KlA 카드 스타일 적용 (선택)
- **UnifiedFilterSearch** 래퍼: `mg-v2-filter-search mg-v2-filter-search--compact`

### 5.2 B0KlA 필터/검색 오버라이드

```css
/* MappingFilterSection.css 또는 AdminDashboardB0KlA.css 하단 */
.mg-v2-ad-b0kla .mg-v2-mapping-filter-section .mg-v2-filter-search__row {
  display: flex;
  gap: var(--mg-spacing-md, 1rem);
  align-items: center;
}

.mg-v2-ad-b0kla .mg-v2-mapping-filter-section .mg-v2-search-bar__wrapper {
  background: var(--ad-b0kla-card-bg);
  border: 1px solid var(--ad-b0kla-border);
  border-radius: 16px;
  padding: 12px 20px;
  box-shadow: var(--ad-b0kla-shadow);
}

.mg-v2-ad-b0kla .mg-v2-mapping-filter-section .mg-v2-search-bar__input::placeholder {
  color: var(--ad-b0kla-placeholder);
}

.mg-v2-ad-b0kla .mg-v2-mapping-filter-section .mg-v2-filter-search__panel {
  background: var(--ad-b0kla-card-bg);
  border: 1px solid var(--ad-b0kla-border);
  border-radius: var(--ad-b0kla-radius-sm);
}
```

### 5.3 SearchBar / QuickFilters

- B0KlA 샘플 검색: `mg-v2-ad-b0kla__search` (width 300px, padding 12px 20px, radius 16px)
- UnifiedFilterSearch의 SearchBar 래퍼에 `mg-v2-ad-b0kla__search` 스타일을 상속하거나, `.mg-v2-ad-b0kla .mg-v2-search-bar__wrapper`로 오버라이드

---

## 6. 통계 카드 (MappingStatsSection → MappingStats)

### 6.1 현재 vs 목표

| 구분 | 현재 | 목표 |
|------|------|------|
| 구조 | `mg-v2-mapping-stats-container`, `mg-v2-mapping-stat-card` | ContentKpiRow / mg-v2-ad-b0kla__kpi-* |
| 카드 | 글래스·커스텀 색상 | B0KlA KPI 카드 |
| 아이콘 | 원형, 이모지 | 56x56, border-radius 16px, 배경색 토큰 |
| 숫자 | 커스텀 | 1.75rem, 700, ad-b0kla-title-color |
| 라벨 | 14px | 14px, ad-b0kla-text-secondary |

### 6.2 적용 스펙

**옵션 A**: ContentKpiRow 재사용 (권장)

- `ContentKpiRow` + `ContentKpiRow`의 `items` prop에 stat 데이터 전달
- 각 item: `{ id, icon, label, value, badge?, iconVariant: 'green'|'orange'|'blue' }`
- MappingStats를 ContentKpiRow용 데이터로 변환하는 어댑터 추가

**옵션 B**: MappingStats에 B0KlA 오버라이드 적용

```css
/* mg-v2-ad-b0kla 내부 MappingStats B0KlA 스타일 */
.mg-v2-ad-b0kla .mg-v2-mapping-stats-container {
  background: transparent;
  border: none;
  padding: 0;
  margin-bottom: 0;
}

.mg-v2-ad-b0kla .mg-v2-mapping-stats-header {
  margin-bottom: var(--mg-spacing-md);
  padding: 0;
  text-align: left;
  border: none;
  background: transparent;
}

.mg-v2-ad-b0kla .mg-v2-mapping-stats-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ad-b0kla-title-color);
}

.mg-v2-ad-b0kla .mg-v2-mapping-stats-subtitle {
  font-size: 13px;
  color: var(--ad-b0kla-text-secondary);
}

.mg-v2-ad-b0kla .mg-v2-mapping-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  padding: 0;
  background: transparent;
}

.mg-v2-ad-b0kla .mg-v2-mapping-stat-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: var(--ad-b0kla-card-bg);
  border: 1px solid var(--ad-b0kla-border);
  border-radius: var(--ad-b0kla-radius);
  box-shadow: var(--ad-b0kla-shadow);
  transition: all 0.2s;
}

.mg-v2-ad-b0kla .mg-v2-mapping-stat-card:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

.mg-v2-ad-b0kla .mg-v2-mapping-stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  /* data-color에 따른 배경: green/orange/blue 매핑 */
}

.mg-v2-ad-b0kla .mg-v2-mapping-stat-label {
  font-size: 14px;
  color: var(--ad-b0kla-text-secondary);
}

.mg-v2-ad-b0kla .mg-v2-mapping-stat-count {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--ad-b0kla-title-color);
}

.mg-v2-ad-b0kla .mg-v2-mapping-stats-summary {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--ad-b0kla-bg);
  border: 1px solid var(--ad-b0kla-border);
  border-radius: var(--ad-b0kla-radius-sm);
}
```

### 6.3 아이콘 배경 매핑

| 상태 | iconVariant | 배경 클래스 | 토큰 |
|------|-------------|-------------|------|
| 결제대기 | orange | mg-v2-ad-b0kla__kpi-icon--orange | ad-b0kla-orange-bg |
| 활성 | green | mg-v2-ad-b0kla__kpi-icon--green | ad-b0kla-green-bg |
| 전체·결제확인 등 | blue | mg-v2-ad-b0kla__kpi-icon--blue | ad-b0kla-blue-bg |

---

## 7. 매칭 목록 (MappingListSection → MappingCard)

### 7.1 목록 그리드

- **컨테이너**: `mg-v2-ad-b0kla__card` (기존 사용 중)
- **그리드**: `mg-v2-mapping-list-grid`
  - `grid-template-columns: repeat(auto-fill, minmax(380px, 1fr))`
  - `gap: var(--mg-layout-grid-gap, 1.5rem)`
  - 모바일: `grid-template-columns: 1fr`

### 7.2 MappingCard B0KlA 스타일

현재 MappingCard는 `mg-v2-card mg-v2-card-glass`(글래스모피즘) 사용. B0KlA는 솔리드 카드.

**적용 스펙** (mg-v2-ad-b0kla 내부 오버라이드):

```css
.mg-v2-ad-b0kla .mg-v2-mapping-list-grid .mg-v2-card.mg-v2-card-glass,
.mg-v2-ad-b0kla .mg-v2-mapping-list-card .mg-v2-card {
  background: var(--ad-b0kla-card-bg);
  border: 1px solid var(--ad-b0kla-border);
  border-radius: var(--ad-b0kla-radius-sm);
  box-shadow: var(--ad-b0kla-shadow);
  backdrop-filter: none;
}

.mg-v2-ad-b0kla .mg-v2-mapping-list-grid .mg-v2-card:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

.mg-v2-ad-b0kla .mg-v2-mapping-card-header,
.mg-v2-ad-b0kla .mg-v2-card-header {
  background: transparent;
  border-bottom: 1px solid var(--ad-b0kla-border);
  padding: 1rem 1.25rem;
}

.mg-v2-ad-b0kla .mg-v2-mapping-card-body,
.mg-v2-ad-b0kla .mg-v2-mapping-participant-label,
.mg-v2-ad-b0kla .mg-v2-mapping-package-label {
  color: var(--ad-b0kla-text-secondary);
}

.mg-v2-ad-b0kla .mg-v2-mapping-participant-name,
.mg-v2-ad-b0kla .mg-v2-mapping-package-name {
  color: var(--ad-b0kla-title-color);
}

.mg-v2-ad-b0kla .mg-v2-mapping-amount {
  color: var(--ad-b0kla-green);
}

.mg-v2-ad-b0kla .mg-v2-mapping-card-footer,
.mg-v2-ad-b0kla .mg-v2-card-footer {
  background: var(--ad-b0kla-bg);
  border-top: 1px solid var(--ad-b0kla-border);
  padding: 1rem 1.25rem;
}
```

### 7.3 상태 뱃지 (Badge)

- B0KlA pill 스타일: `mg-v2-ad-b0kla__pill` 참고
- 상태별 색상: 기존 `statusInfo.color` 유지하되, 배경은 `*20` 투명도 또는 B0KlA green/orange/blue-bg 활용

---

## 8. 빈 상태 (Empty State)

### 8.1 적용 스펙

- **컨테이너**: `mg-v2-mapping-empty` (기존)
- **아이콘**: `mg-v2-mapping-empty__icon`
  - font-size: 3rem, opacity: 0.6
  - B0KlA chart-placeholder-icon 스타일 참고 (`mg-v2-ad-b0kla__chart-placeholder-icon`)
- **제목**: `mg-v2-mapping-empty__title`
  - font-size: 1.5rem, font-weight: 600, color: var(--ad-b0kla-title-color)
- **설명**: `mg-v2-mapping-empty__desc`
  - font-size: 1rem, color: var(--ad-b0kla-text-secondary)
- **버튼**: `mg-v2-button mg-v2-button-primary` (B0KlA 주조 버튼)

```css
.mg-v2-ad-b0kla .mg-v2-mapping-empty {
  text-align: center;
  padding: var(--mg-spacing-xxxl) var(--mg-spacing-lg);
  color: var(--ad-b0kla-text-secondary);
}

.mg-v2-ad-b0kla .mg-v2-mapping-empty__icon {
  font-size: 3rem;
  margin-bottom: var(--mg-spacing-lg);
  opacity: 0.6;
}

.mg-v2-ad-b0kla .mg-v2-mapping-empty__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ad-b0kla-title-color);
  margin: 0 0 var(--mg-spacing-sm) 0;
}

.mg-v2-ad-b0kla .mg-v2-mapping-empty__desc {
  font-size: 1rem;
  color: var(--ad-b0kla-text-secondary);
  margin: 0 0 var(--mg-spacing-lg) 0;
}
```

---

## 9. 체크리스트 (core-coder용)

| # | 항목 | 사용할 클래스/토큰 | 파일 |
|---|------|-------------------|------|
| 1 | 헤더 | mg-v2-content-header, mg-v2-content-header__title, mg-v2-content-header__subtitle | MappingContentHeader.js/.css |
| 2 | 헤더 버튼 | mg-v2-button-primary, ad-b0kla-green 배경 | MappingContentHeader.js |
| 3 | 필터 섹션 | mg-v2-content-section--plain, mg-v2-filter-search | MappingFilterSection.js/.css |
| 4 | 검색바 | ad-b0kla-card-bg, ad-b0kla-border, ad-b0kla-placeholder | MappingFilterSection.css 또는 B0KlA 오버라이드 |
| 5 | 통계 카드 | mg-v2-ad-b0kla__kpi-* 또는 B0KlA 오버라이드 | MappingStatsSection.css, AdminDashboardB0KlA.css |
| 6 | 목록 그리드 | mg-v2-ad-b0kla__card, mg-v2-mapping-list-grid | MappingListSection.css |
| 7 | MappingCard | ad-b0kla-card-bg, ad-b0kla-border, ad-b0kla-radius-sm | AdminDashboardB0KlA.css 오버라이드 |
| 8 | 빈 상태 | mg-v2-mapping-empty__*, ad-b0kla-title-color, ad-b0kla-text-secondary | MappingListSection.css |
| 9 | CSS 로드 순서 | AdminDashboardB0KlA.css, MappingManagementPage.css | MappingManagementPage.js |

---

## 10. 참조 파일

| 파일 | 용도 |
|------|------|
| `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` | B0KlA 토큰·카드·KPI 스타일 |
| `frontend/src/components/dashboard-v2/content/ContentHeader.css` | 헤더 스타일 |
| `frontend/src/components/dashboard-v2/content/ContentKpiRow.css` | KPI 카드 스타일 |
| `frontend/src/components/dashboard-v2/content/ContentSection.css` | 섹션 스타일 |
| `frontend/src/components/dashboard-v2/content/ContentCard.css` | 카드 래퍼 스타일 |
| `frontend/src/styles/unified-design-tokens.css` | 전역 토큰 (참조만) |
| `mindgarden-design-system.pen` | B0KlA 시각 정의 |
| `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` | 반응형 토큰 |
