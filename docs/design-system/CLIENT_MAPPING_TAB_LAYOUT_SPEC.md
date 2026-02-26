# 매칭 관리 탭 레이아웃·구조 디자인 스펙

**대상**: 어드민 내담자 관리 페이지 — "매칭 관리" 영역 (`ClientMappingTab`, `.mg-v2-client-mapping`)  
**참조**: [어드민 대시보드 샘플](https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), `docs/design-system/CLIENT_CONSULTATION_TAB_LAYOUT_SPEC.md`  
**버전**: 1.0.0  
**작성**: Core Designer (디자인 전용 스펙, 구현은 core-coder 담당)

---

## 1. 목표

- 매칭 관리 탭을 **상담 이력 탭과 동일한 레이아웃·디자인 패턴**으로 통일하여, 내담자 관리 페이지 내 탭 간 시각적·구조적 일관성을 확보한다.
- "총 N건의 매칭", "매칭 정보가 없습니다" 등이 **정렬·간격 없이 나열되는 현상**을 제거하고, **페이지 헤더(세로 스택 + 좌측 악센트 바)** 와 **내담자별 카드형 블록** 구조를 적용한다.

---

## 2. 참조 기준 요약

| 항목 | 기준 |
|------|------|
| 레이아웃 | 메인 영역 패딩 24–32px, 섹션별 블록 구분 |
| 섹션 블록 | 배경 #F5F3EF(또는 `--ad-b0kla-card-bg`), 테두리 1px #D4CFC8, corner-radius 16px, 패딩 24px, 내부 gap 16px |
| 섹션 제목 | 왼쪽 **세로 악센트 바** (폭 4px, 주조 #3D5246, radius 2px) + 제목 텍스트(12px·굵게 또는 1.125rem·700) |
| 색상 | 주조 #3D5246, 본문 #2C2C2C, 보조 텍스트 #5C6B61, 서페이스/카드 #F5F3EF, 테두리 #D4CFC8 |
| 타이포 | Noto Sans KR, 제목 20–24px / 600, 본문 14–16px, 라벨/캡션 12px |
| 동일 페이지 내 참고 | 상담 이력 탭: `mg-v2-consultation-page-header` + `mg-v2-consultation-client-block` + `__header` / `__count` 별도 줄 |

---

## 3. DOM 구조 및 클래스명

아래는 **최상위부터 하위까지** 적용할 블록/컴포넌트 클래스명과 역할이다. 코더는 이 구조에 맞춰 마크업과 스타일을 적용하면 된다.

### 3.1 최상위 래퍼

| 클래스명 | 역할 | 비고 |
|----------|------|------|
| `mg-v2-client-mapping` | 매칭 관리 탭 전체 컨테이너 | **필수**: 패딩·gap 정의 필요 (아래 4.1 참고) |
| `mg-v2-client-list-block` | 목록 블록 영역으로의 의미 | 상담 이력·개요 탭과 동일 네이밍 유지 시 사용 |

- **권장**: 루트를 `mg-v2-client-mapping mg-v2-client-list-block`로 두고, **스타일은 `mg-v2-client-mapping`에만** 적용하여 "매칭 탭만의 레이아웃"이 명확히 되도록 한다.

### 3.2 페이지 레벨 섹션 헤더 (매칭 관리)

| 클래스명 | 역할 | 비고 |
|----------|------|------|
| `mg-v2-mapping-page-header` | 탭 제목 + 설명을 담는 **세로 스택** 영역 | **신규 권장**. 상담 이력의 `mg-v2-consultation-page-header`와 동일 패턴 |
| `mg-v2-mapping-page-header__title` | "매칭 관리" 제목 | `mg-v2-h2` 또는 동일 스타일(폰트·색·margin) 적용 |
| `mg-v2-mapping-page-header__desc` | "내담자와 상담사의 매칭 정보를 확인하고 관리할 수 있습니다." | 14px 또는 `var(--font-size-sm)`, 색 `var(--color-text-secondary)` / `#5C6B61` |

- **섹션 제목 스타일(선택)**: 샘플처럼 **좌측 세로 악센트 바**를 쓰려면, `mg-v2-mapping-page-header`에 `padding-left: 20px`, `position: relative`를 두고 `::before`로 폭 4px, 배경 #3D5246, border-radius 2px, 왼쪽 정렬 세로 바를 넣을 수 있다.

### 3.3 내담자 목록 컨테이너

| 클래스명 | 역할 | 비고 |
|----------|------|------|
| `mg-v2-client-list mg-v2-content-area` | 내담자별 블록을 세로로 나열하는 영역 | `mg-v2-content-area`: flex column, gap `var(--mg-layout-grid-gap, 1.5rem)` 사용 |

- **필수**: `mg-v2-client-list`에 **아래로 쌓이는 레이아웃 + 블록 간 간격**이 있어야 한다.

### 3.4 내담자별 블록 (한 명당 하나의 섹션 블록)

각 내담자별로 "이름·이메일·상세보기 버튼 + 총 N건의 매칭 + (빈 상태 또는 매칭 카드 그리드)"를 담는 **하나의 섹션 블록**으로 둔다.

| 클래스명 | 역할 | 비고 |
|----------|------|------|
| `mg-v2-mapping-client-block` | **내담자 1인당 카드형 블록** (섹션 블록 스타일) | **신규 권장**. 배경·테두리·radius·패딩·좌측 악센트(선택) 적용 |
| `mg-v2-mapping-client-block__header` | 블록 상단: 이름·이메일(좌) + 버튼(우) | flex, space-between, align-items: center |
| `mg-v2-mapping-client-block__info` | 이름 + 이메일 세로 스택 | `mg-v2-profile-card__info`와 동일 구조 가능 |
| `mg-v2-mapping-client-block__name` | 내담자 이름 | `mg-v2-profile-card__name` 동일 스타일 |
| `mg-v2-mapping-client-block__email` | 이메일 (또는 `mg-v2-client-email`) | 보조 텍스트 색·크기 |
| `mg-v2-mapping-client-block__actions` | "상세보기" 버튼 영역 | `mg-v2-profile-card__actions`와 동일 정렬 |
| `mg-v2-mapping-client-block__count` | "총 N건의 매칭" 캡션 | **헤더와 별도 줄**로 두는 것을 권장. 12px, 보조 텍스트 색 |

- **주의**: "총 N건의 매칭"은 **헤더와 같은 flex 행에 넣지 말고**, 헤더 바로 아래 별도 행(블록)으로 두면 정렬이 깨지지 않는다. 즉 `__header` 다음에 `__count` 한 줄, 그 다음 빈 상태 또는 그리드.

### 3.5 빈 상태 (내담자당 매칭 없음)

| 클래스명 | 역할 | 비고 |
|----------|------|------|
| `mg-v2-mapping-list-block__empty` | 아이콘 + 문구 세로 중앙 정렬 | 기존 유지. padding 3rem 2rem, flex column, align/justify center |
| `mg-v2-mapping-list-block__empty-icon` | Handshake 아이콘 등 | 80×80 또는 32px 아이콘, 배경·색 B0KlA 토큰 |
| `mg-v2-mapping-list-block__empty-desc` | "매칭 정보가 없습니다." | 14px, 보조 텍스트 색 |

### 3.6 매칭 카드 그리드

| 클래스명 | 역할 | 비고 |
|----------|------|------|
| `mg-v2-mapping-list-block__grid` | 매칭 카드들을 세로로 나열 | 기존 유지. flex column, gap 1rem 또는 `var(--mg-spacing-md)` 권장 |

- **참고**: 현재 `mg-mobile-card-stack` 사용 구간을 `mg-v2-mapping-list-block__grid`로 통일해도 된다 (스펙상 동일 역할).

### 3.7 매칭 카드 (1건당)

| 클래스명 | 역할 | 비고 |
|----------|------|------|
| `mg-v2-card mg-v2-mapping-card` | 카드 컨테이너 | `mg-v2-card`: 배경·테두리·radius·패딩(unified-design-tokens 기준) |
| `mg-v2-card-header` | 상단: 매칭 정보 + 상태 배지 | flex, space-between |
| `mg-v2-mapping-info` | "매칭 #id" + 날짜 | 제목 `mg-v2-h4`, 날짜 14px |
| `mg-v2-mapping-date` | 생성일 등 | 아이콘 + 텍스트 |
| `mg-v2-mapping-status` | 상태 배지 영역 | |
| `mg-v2-status-badge` | 매칭 상태 배지 | 기존 스타일·`--status-bg-color` 유지 |
| `mg-v2-card-content` | 본문: 상담사·패키지·회기·시작일·종료일·메모 등 | |
| `mg-v2-mapping-details` | 라벨+값 목록 | `mg-v2-form-label` 등으로 라벨 스타일 통일 |
| `mg-v2-card-footer` | 하단: 상세보기·수정 버튼 | 기존 유지 |

### 3.8 전체 빈 상태 (등록된 내담자 없음)

| 클래스명 | 역할 | 비고 |
|----------|------|------|
| `mg-v2-mapping-list-block__empty` | 동일 | padding 넉넉히, 중앙 정렬 |
| `mg-v2-mapping-list-block__empty-icon` | User 아이콘 48px 등 | |
| `mg-v2-mapping-list-block__empty-title` | "등록된 내담자가 없습니다" | 1.125rem, 700 |
| `mg-v2-mapping-list-block__empty-desc` | "내담자를 등록한 후 매칭 정보를 확인할 수 있습니다." | 14px, margin-bottom |

---

## 4. 간격·정렬 규칙

### 4.1 최상위 (`mg-v2-client-mapping`)

- **padding**: `var(--mg-layout-section-padding, 1.5rem)` 또는 24px. (상단은 탭 바로 아래이므로 필요 시 0 또는 작은 값.)
- **display**: block (기본) 또는 flex column.
- **gap**: 페이지 헤더와 리스트 사이 `var(--mg-layout-gap, 1.5rem)` 또는 24px.

### 4.2 페이지 헤더 (`mg-v2-mapping-page-header`)

- **margin-bottom**: `var(--spacing-lg)` 또는 24px.
- **padding-bottom**: `var(--spacing-md)` 또는 1rem.
- **border-bottom**: 1px solid `var(--color-border-light)` / `var(--ad-b0kla-border)`.
- **제목**: margin 0 0 0.25rem 0(또는 0); **설명**: margin 0.25rem 0 0 0; 폰트 크기·색상은 위 3.2 참고.

### 4.3 내담자 목록 (`mg-v2-client-list` + `mg-v2-content-area`)

- **gap**: `var(--mg-layout-grid-gap, 1.5rem)` (블록 간 24px 수준).
- **width**: 100%, min-width: 0.

### 4.4 내담자별 블록 (`mg-v2-mapping-client-block`)

- **padding**: 24px 또는 `var(--mg-layout-section-padding, 1.5rem)`.
- **margin-bottom**: 0 (리스트 gap으로 블록 간격 처리).
- **background**: `var(--ad-b0kla-card-bg)` 또는 #F5F3EF.
- **border**: 1px solid `var(--ad-b0kla-border)` 또는 #D4CFC8.
- **border-radius**: 16px 또는 `var(--ad-b0kla-radius)`.
- **내부**: `__header`와 `__count` 사이, `__count`와 그리드/빈 상태 사이 **gap 16px** 수준.

### 4.5 헤더 내부 (`mg-v2-mapping-client-block__header`)

- **margin-bottom**: `var(--spacing-sm)` 또는 0.5rem (그 다음 `__count`와의 간격).
- **flex**: align-items: center, justify-content: space-between.

### 4.6 "총 N건의 매칭" (`mg-v2-mapping-client-block__count`)

- **margin**: 0 0 1rem 0 (또는 gap으로 대체).
- **font-size**: 12px 또는 `var(--font-size-xs)`.
- **color**: `var(--color-text-secondary)` / #5C6B61.

### 4.7 매칭 카드 그리드 (`mg-v2-mapping-list-block__grid`)

- **gap**: 1rem 또는 `var(--mg-spacing-md)`.
- **margin-top**: 0 (블록 내부 gap으로 처리해도 됨).

### 4.8 빈 상태 (`mg-v2-mapping-list-block__empty`)

- **padding**: 3rem 2rem (기존 MappingListBlock.css 유지).
- **min-height**: 필요 시 120px~160px로 고정하면 레이아웃이 안정적.

---

## 5. 권장 DOM 구조 요약 (코더용)

```
.mg-v2-client-mapping.mg-v2-client-list-block
├── .mg-v2-mapping-page-header
│   ├── .mg-v2-mapping-page-header__title (또는 h2.mg-v2-h2)
│   └── .mg-v2-mapping-page-header__desc
│
├── [내담자 없음 시]
│   └── .mg-v2-mapping-list-block__empty
│       ├── .mg-v2-mapping-list-block__empty-icon
│       ├── .mg-v2-mapping-list-block__empty-title
│       └── .mg-v2-mapping-list-block__empty-desc
│
└── [내담자 있음 시]
    └── .mg-v2-client-list.mg-v2-content-area
        └── (반복) .mg-v2-mapping-client-block
            ├── .mg-v2-mapping-client-block__header
            │   ├── .mg-v2-mapping-client-block__info
            │   │   ├── .mg-v2-mapping-client-block__name (또는 .mg-v2-profile-card__name)
            │   │   └── .mg-v2-mapping-client-block__email
            │   └── .mg-v2-mapping-client-block__actions (버튼)
            ├── .mg-v2-mapping-client-block__count  ("총 N건의 매칭")
            ├── [매칭 없음 시] .mg-v2-mapping-list-block__empty (+ __empty-icon, __empty-desc)
            └── [매칭 있음 시] .mg-v2-mapping-list-block__grid
                └── (반복) .mg-v2-card.mg-v2-mapping-card
                    ├── .mg-v2-card-header (+ mg-v2-mapping-info, mg-v2-mapping-status)
                    ├── .mg-v2-card-content (+ .mg-v2-mapping-details)
                    └── .mg-v2-card-footer
```

---

## 6. 체크리스트 (구현 후 검증)

- [ ] 탭 진입 시 "매칭 관리" 제목과 설명이 **한 블록으로 정렬**되어 있고, 아래와 시각적으로 구분된다(밑줄·여백).
- [ ] 내담자가 있을 때 **내담자별 블록**이 카드 형태(배경·테두리·radius)로 구분되고, 블록 간 **세로 간격**이 동일하다.
- [ ] 각 블록에서 **이름·이메일(좌)** 와 **상세보기(우)** 가 한 줄에 정렬되고, 그 아래 **"총 N건의 매칭"** 이 별도 줄로 나온다.
- [ ] "매칭 정보가 없습니다"는 해당 블록 안에서 **중앙 정렬**되고, 아이콘·문구 간격이 적절하다.
- [ ] 매칭 카드가 **세로로 일정 gap**으로 나열되고, 카드 내 헤더(매칭 정보·날짜·상태)와 본문·푸터가 정리되어 있다.
- [ ] 등록된 내담자가 없을 때 **전체 빈 상태**가 중앙에 크게 표시된다.
- [ ] 색상·폰트는 `unified-design-tokens.css` 및 어드민 B0KlA 토큰(`--ad-b0kla-*`)을 사용하며, 샘플 및 상담 이력 탭과 동일한 톤을 유지한다.

---

## 7. 참고 파일 (구현 시)

- **컴포넌트**: `frontend/src/components/admin/ClientComprehensiveManagement/ClientMappingTab.js`
- **동일 레이아웃 스펙**: `docs/design-system/CLIENT_CONSULTATION_TAB_LAYOUT_SPEC.md`
- **참고 레이아웃**: `ClientConsultationTab.js`, `ClientOverviewTab.js`
- **스타일 참고**: `frontend/src/styles/unified-design-tokens.css`, `MappingListBlock.css`, `ContentSection.css`, `ContentCard.css`, `ProfileCard.css`, `ClientManagementPage.css`
- **디자인 기준**: `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`, 어드민 대시보드 샘플 URL

이 스펙은 **디자인 전용**이며, 실제 코드 수정은 core-coder가 수행한다.
