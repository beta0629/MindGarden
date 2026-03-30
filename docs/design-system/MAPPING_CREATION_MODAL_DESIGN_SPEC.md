# 새 매칭 모달(MappingCreationModal) 디자인 스펙 — 창의적 전면 재구성

**버전**: 1.0.0  
**최종 업데이트**: 2025-02-22  
**기준**: 어드민 대시보드 샘플 / B0KlA 토큰 / mindgarden-design-system.pen  
**개념**: 기존 4단계 폼 구조 폐기 → **플로우 차트형 스텝 온보딩 + 카드 선택 UI**

---

## 1. 개요

새 매칭 모달을 **플로우 차트형 온보딩**으로 전면 재설계합니다.

- **시각적 플로우**: 상담사 → 패키지 → 내담자 → 결제 정보 → 완료 (좌→우 연결선)
- **카드 선택형**: 상담사·패키지·내담자는 **클릭 가능한 타일 카드**로 선택
- **단계별 펼침**: 한 단계가 완료되면 다음 단계 활성화, 이전 단계는 요약으로 축소
- **B0KlA 비주얼**: 어드민 대시보드와 동일한 색상·radius·섹션 블록

---

## 2. 플로우 구조

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  mg-v2-mapping-create-modal                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  헤더: 새 매칭 만들기  │  [X 닫기]                                                      │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌─ 플로우 스텝 인디케이터 (가로 파이프라인) ───────────────────────────────────────────────┐  │
│  │  [1.상담사] ─── [2.패키지] ─── [3.내담자] ─── [4.결제] ─── [5.완료]                     │  │
│  │     ● 완료         ● 완료         ○ 진행         ○ 대기      ○ 대기                    │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌─ 스텝 1: 상담사 선택 (카드 그리드) ─────────────────────────────────────────────────────┐  │
│  │  [SearchInput] 상담사 이름·이메일로 검색...                                              │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                                        │  │
│  │  │ 김상담   │ │ 이상담   │ │ 박상담   │ │ 최상담   │  ← 클릭 시 선택 (좌측 악센트 바)     │  │
│  │  │ email   │ │ email   │ │ email   │ │ email   │                                        │  │
│  │  │ 활성 3명 │ │ 활성 2명 │ │ 활성 5명 │ │ 활성 1명 │                                        │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘                                        │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│  [다음: 패키지 선택 →]                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **스텝 2**: 패키지 카드 선택 (회기·가격 하이라이트)
- **스텝 3**: 내담자 검색 + 필터 + 카드 그리드
- **스텝 4**: 결제 정보 (지불방법·참조번호·특이사항)
- **스텝 5**: 완료 요약 + Link2 아이콘 시각화

---

## 3. 마크업·CSS 클래스

### 3.1 최상위 래퍼

```html
<div class="mg-v2-mapping-create-modal mg-v2-ad-b0kla">
  <div class="mg-v2-mapping-create-modal__overlay" onclick="onClose">
    <div class="mg-v2-mapping-create-modal__dialog" onclick="stopPropagation">
      <!-- 헤더 -->
      <header class="mg-v2-mapping-create-modal__header">...</header>
      <!-- 플로우 스텝 -->
      <nav class="mg-v2-mapping-create-modal__flow">...</nav>
      <!-- 본문 -->
      <main class="mg-v2-mapping-create-modal__body">...</main>
      <!-- 푸터 -->
      <footer class="mg-v2-mapping-create-modal__footer">...</footer>
    </div>
  </div>
</div>
```

- **오버레이**: `mg-v2-modal-overlay` 또는 `mg-v2-mapping-create-modal__overlay`
- **다이얼로그**: `mg-v2-mapping-create-modal__dialog` — B0KlA 카드 스타일, max-width 920px, radius `var(--ad-b0kla-radius)`

### 3.2 헤더

```html
<header class="mg-v2-mapping-create-modal__header">
  <div class="mg-v2-mapping-create-modal__header-left">
    <span class="mg-v2-mapping-create-modal__header-icon"><Link2 size={24} /></span>
    <h2 class="mg-v2-mapping-create-modal__header-title">새 매칭 만들기</h2>
    <p class="mg-v2-mapping-create-modal__header-desc">상담사와 내담자를 연결합니다</p>
  </div>
  <button type="button" class="mg-v2-modal-close mg-v2-mapping-create-modal__close" aria-label="닫기">
    <XCircle size={24} />
  </button>
</header>
```

- **토큰**: `--ad-b0kla-title-color`, `--ad-b0kla-text-secondary`
- **아이콘**: Link2 (lucide-react)

### 3.3 플로우 스텝 인디케이터

```html
<nav class="mg-v2-mapping-create-modal__flow" aria-label="매칭 생성 단계">
  <ol class="mg-v2-mapping-create-modal__flow-list">
    <li class="mg-v2-mapping-create-modal__flow-step mg-v2-mapping-create-modal__flow-step--done" data-step="1">
      <span class="mg-v2-mapping-create-modal__flow-dot"></span>
      <span class="mg-v2-mapping-create-modal__flow-label">상담사</span>
    </li>
    <li class="mg-v2-mapping-create-modal__flow-connector"></li>
    <li class="mg-v2-mapping-create-modal__flow-step mg-v2-mapping-create-modal__flow-step--done" data-step="2">
      <span class="mg-v2-mapping-create-modal__flow-dot"></span>
      <span class="mg-v2-mapping-create-modal__flow-label">패키지</span>
    </li>
    <li class="mg-v2-mapping-create-modal__flow-connector"></li>
    <li class="mg-v2-mapping-create-modal__flow-step mg-v2-mapping-create-modal__flow-step--active" data-step="3">
      <span class="mg-v2-mapping-create-modal__flow-dot"></span>
      <span class="mg-v2-mapping-create-modal__flow-label">내담자</span>
    </li>
    <li class="mg-v2-mapping-create-modal__flow-connector"></li>
    <li class="mg-v2-mapping-create-modal__flow-step" data-step="4">
      <span class="mg-v2-mapping-create-modal__flow-dot"></span>
      <span class="mg-v2-mapping-create-modal__flow-label">결제</span>
    </li>
    <li class="mg-v2-mapping-create-modal__flow-connector"></li>
    <li class="mg-v2-mapping-create-modal__flow-step" data-step="5">
      <span class="mg-v2-mapping-create-modal__flow-dot"></span>
      <span class="mg-v2-mapping-create-modal__flow-label">완료</span>
    </li>
  </ol>
</nav>
```

- **상태 클래스**:
  - `--done`: 완료 (체크 또는 채워진 원, `--ad-b0kla-green`)
  - `--active`: 현재 단계 (강조, `--ad-b0kla-green` 배경)
  - 기본: 대기 (회색 점, `--ad-b0kla-text-secondary`)
- **연결선**: `mg-v2-mapping-create-modal__flow-connector` — 가로선 2px, `var(--ad-b0kla-border)`

### 3.4 스텝 1: 상담사 카드

```html
<section class="mg-v2-mapping-create-modal__step" data-step="1">
  <div class="mg-v2-mapping-create-modal__step-header">
    <div class="mg-v2-mapping-create-modal__accent-bar"></div>
    <h3 class="mg-v2-mapping-create-modal__step-title">상담사를 선택하세요</h3>
  </div>
  <div class="mg-v2-mapping-create-modal__search-wrap">
    <SearchInput placeholder="상담사 이름 또는 이메일로 검색..." value={...} onChange={...} />
  </div>
  <div class="mg-v2-mapping-create-modal__card-grid">
    <button type="button" class="mg-v2-mapping-create-modal__card mg-v2-mapping-create-modal__card--selected"
            data-consultant-id="123">
      <div class="mg-v2-mapping-create-modal__card-accent"></div>
      <div class="mg-v2-mapping-create-modal__card-avatar">김</div>
      <div class="mg-v2-mapping-create-modal__card-body">
        <span class="mg-v2-mapping-create-modal__card-name">김상담</span>
        <span class="mg-v2-mapping-create-modal__card-meta">kim@example.com</span>
        <span class="mg-v2-mapping-create-modal__card-badge">활성 3명</span>
      </div>
    </button>
    <!-- 반복 -->
  </div>
</section>
```

- **카드 스타일**: `mg-v2-ad-b0kla__card` 참고, padding 1rem, radius `var(--ad-b0kla-radius-sm)`
- **선택 시**: `--selected` → 좌측 4px 악센트 `var(--ad-b0kla-green)`, 배경 `var(--ad-b0kla-green-bg)`
- **아바타**: 48px 원, `--ad-b0kla-green-bg` 배경, `--ad-b0kla-green` 텍스트

### 3.5 스텝 2: 패키지 카드

```html
<section class="mg-v2-mapping-create-modal__step" data-step="2">
  <div class="mg-v2-mapping-create-modal__step-header">
    <div class="mg-v2-mapping-create-modal__accent-bar"></div>
    <h3 class="mg-v2-mapping-create-modal__step-title">패키지를 선택하세요</h3>
  </div>
  <div class="mg-v2-mapping-create-modal__package-grid">
    <button type="button" class="mg-v2-mapping-create-modal__package-card mg-v2-mapping-create-modal__package-card--selected">
      <div class="mg-v2-mapping-create-modal__package-card-accent"></div>
      <span class="mg-v2-mapping-create-modal__package-card-name">10회기 기본</span>
      <span class="mg-v2-mapping-create-modal__package-card-sessions">10회</span>
      <span class="mg-v2-mapping-create-modal__package-card-price">500,000원</span>
    </button>
  </div>
</section>
```

- **패키지 카드**: 가로로 넓은 타일, 회기·가격 강조 (24px, 700, `--ad-b0kla-title-color`)

### 3.6 스텝 3: 내담자 카드

- 스텝 1과 동일한 카드 그리드 패턴
- **필터**: `mg-v2-ad-b0kla__pill-toggle` 또는 `mg-v2-ad-b0kla__pill` (전체/매칭없음/활성 등)
- **정렬**: `mg-v2-mapping-create-modal__filter-row` 내 select

### 3.7 스텝 4: 결제 정보

```html
<section class="mg-v2-mapping-create-modal__step mg-v2-mapping-create-modal__step--form" data-step="4">
  <div class="mg-v2-mapping-create-modal__step-header">
    <div class="mg-v2-mapping-create-modal__accent-bar"></div>
    <h3 class="mg-v2-mapping-create-modal__step-title">결제 정보</h3>
  </div>
  <div class="mg-v2-mapping-create-modal__summary-bar">
    <span>상담사: 김상담</span>
    <span><Link2 size={14} /></span>
    <span>내담자: 이내담</span>
    <span>|</span>
    <span>10회기 · 500,000원</span>
  </div>
  <div class="mg-v2-mapping-create-modal__form-row">
    <FormInput label="지불 방법" ... />
    <FormInput label="참조번호" ... />
  </div>
  <div class="mg-v2-mapping-create-modal__form-row">
    <FormInput label="특이사항" type="textarea" ... />
  </div>
</section>
```

- **요약 바**: 선택된 상담사·내담자·패키지를 한 줄로 표시, Link2 아이콘으로 연결 시각화

### 3.8 스텝 5: 완료

```html
<section class="mg-v2-mapping-create-modal__step mg-v2-mapping-create-modal__step--completion" data-step="5">
  <div class="mg-v2-mapping-create-modal__completion-icon">
    <CheckCircle size={64} />
  </div>
  <h3 class="mg-v2-mapping-create-modal__completion-title">매칭이 완료되었습니다</h3>
  <div class="mg-v2-mapping-create-modal__completion-flow">
    <span class="mg-v2-mapping-create-modal__completion-node">김상담</span>
    <span class="mg-v2-mapping-create-modal__completion-link"><Link2 size={20} /></span>
    <span class="mg-v2-mapping-create-modal__completion-node">이내담</span>
  </div>
  <div class="mg-v2-mapping-create-modal__completion-meta">
    10회기 패키지 · 500,000원
  </div>
</section>
```

- **완료 아이콘**: `--ad-b0kla-green`, 64px
- **플로우 시각화**: 상담사 ↔ 내담자 Link2로 연결 표시

### 3.9 푸터 (액션 버튼)

```html
<footer class="mg-v2-mapping-create-modal__footer">
  <button type="button" class="mg-v2-button mg-v2-button-secondary" onclick="onPrev">이전</button>
  <button type="button" class="mg-v2-button mg-v2-button-primary" onclick="onNext" disabled={!canProceed}>
    다음
  </button>
  <!-- 스텝 4: -->
  <button type="button" class="mg-v2-button mg-v2-button-primary" onclick="onCreate">매칭 생성</button>
  <!-- 스텝 5: -->
  <button type="button" class="mg-v2-button mg-v2-button-primary" onclick="onClose">완료</button>
</footer>
```

- **버튼**: `mg-v2-button`, `mg-v2-button-primary`, `mg-v2-button-secondary`
- **토큰**: `--ad-b0kla-green` (primary), `--ad-b0kla-border` (secondary)

---

## 4. B0KlA 토큰 적용

| 요소 | 토큰 |
|------|------|
| 모달 배경 | `--ad-b0kla-card-bg` |
| 테두리 | `--ad-b0kla-border` |
| radius | `--ad-b0kla-radius` (24px), `--ad-b0kla-radius-sm` (12px) |
| 제목 | `--ad-b0kla-title-color` |
| 보조 텍스트 | `--ad-b0kla-text-secondary` |
| 주조(완료·선택) | `--ad-b0kla-green` |
| 주조 배경 | `--ad-b0kla-green-bg` |
| 악센트 바 | 4px, `--ad-b0kla-green` |
| 섀도우 | `--ad-b0kla-shadow` |

---

## 5. 반응형

- **768px 이하**: 플로우 스텝 → 2행 또는 드롭다운 스텝 선택
- **480px 이하**: 카드 그리드 1열, 패키지 카드 세로 스택

---

## 6. 아이콘 (lucide-react)

| 용도 | 아이콘 |
|------|--------|
| 매칭/연결 | Link2 |
| 닫기 | XCircle |
| 완료 | CheckCircle |
| 검색 | Search (SearchInput 내장) |

---

## 7. 구현 체크리스트

| # | 항목 |
|---|------|
| 1 | SearchInput (dashboard-v2/atoms) |
| 2 | FormInput, CustomSelect (공통 폼) |
| 3 | B0KlA 토큰 (AdminDashboardB0KlA.css) |
| 4 | 클래스 prefix: `mg-v2-mapping-create-modal__` |
| 5 | UnifiedModal 또는 커스텀 오버레이 사용 가능 |
| 6 | mg-v2-button (MGButton 또는 클래스 직접) |
