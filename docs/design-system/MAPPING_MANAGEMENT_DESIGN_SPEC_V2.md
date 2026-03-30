# 매칭 관리 페이지 신규 디자인 스펙 V2

**버전**: 2.0.0 (완전 재설계)  
**최종 업데이트**: 2025-02-22  
**기준**: 어드민 대시보드 샘플 (https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample) / AdminDashboardV2  
**개념**: 기존 레이아웃·구성 전부 폐기, **칸반형 + 타일 KPI** 창의적 재해석

---

## 1. 개요

mapping-management 페이지를 **어드민 대시보드 비주얼을 따르되**, KPI·필터·목록을 **칸반 컬럼 + 인라인 타일**로 재구성한 신규 디자인 스펙입니다.  
기존 `MappingStats`, `MappingCard`, `MappingFilterSection` 구조를 사용하지 않고, **완전히 새로운 시각·마크업·클래스**로 구현합니다.

---

## 2. 전체 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ContentArea (.mg-v2-content-area)                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ ContentHeader                                                         │  │
│  │ [매칭 관리]  [상담사와 내담자 간의 매칭을 관리합니다.]  [+ 새 매칭]      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ mg-v2-mapping-v2__toolbar (검색 + 필터 툴바)                           │  │
│  │ [SearchInput 300px] [상태 pill: 전체|결제대기|입금확인|활성|종료|회기소진]│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ mg-v2-mapping-v2__kpi-strip (인라인 KPI 타일)                          │  │
│  │ [전체 N] [결제대기 N] [활성 N] [종료·기타 N]  (클릭 시 해당 필터 적용)   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ mg-v2-mapping-v2__kanban (칸반 컬럼 영역)                              │  │
│  │ ┌─────────┬─────────┬─────────┬─────────┐                             │  │
│  │ │결제대기 │입금확인 │  활성   │종료·기타│                             │  │
│  │ │  (N)    │  (N)    │  (N)    │  (N)    │                             │  │
│  │ ├─────────┼─────────┼─────────┼─────────┤                             │  │
│  │ │ [카드]  │ [카드]  │ [카드]  │ [카드]  │                             │  │
│  │ │ [카드]  │ [카드]  │ [카드]  │ [카드]  │                             │  │
│  │ │ ...     │ ...     │ ...     │ ...     │                             │  │
│  │ └─────────┴─────────┴─────────┴─────────┘                             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [또는 필터=전체일 때: mg-v2-mapping-v2__list (단일 리스트 뷰)]               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 검색 표준화

### 3.1 사용 컴포넌트

- **경로**: `frontend/src/components/dashboard-v2/atoms/SearchInput`
- **클래스**: `mg-v2-search-input`
- **props**: `value`, `onChange`, `placeholder="상담사, 내담자, 패키지명으로 검색..."`

### 3.2 import 예시

```js
import { SearchInput } from '../../dashboard-v2/atoms';
// 또는
import SearchInput from '../../dashboard-v2/atoms/SearchInput';
```

### 3.3 스타일

- SearchInput은 B0KlA 토큰 사용 (`--ad-b0kla-card-bg`, `--ad-b0kla-border`, `--ad-b0kla-placeholder`)
- width: 300px (SEARCH_INPUT_WIDTH), 모바일에서 100% 또는 min-width 200px

---

## 4. 아이콘 목록 (어드민 대시보드와 동일)

### 4.1 lucide-react

| 용도 | 아이콘 | import |
|------|--------|--------|
| 새 매칭 | Plus | `import { Plus } from 'lucide-react'` |
| 상세보기 | Eye | `Eye` |
| 수정 | Edit | `Edit` |
| 환불/취소 | XCircle | `XCircle` |
| 결제 | CreditCard | `CreditCard` |
| 입금 | DollarSign | `DollarSign` |
| 승인 | CheckCircle | `CheckCircle` |
| 패키지 | Package | `Package` |
| 사용자 | User | `User` |
| 일정 | Calendar | `Calendar` |
| 시계 | Clock | `Clock` |
| 검색 | Search | `Search` (SearchInput 내장) |
| ERP 연동 | Database | `Database` |
| 매칭/연결 | Link2 | `Link2` |

### 4.2 react-icons/fa (선택 사용)

| 용도 | 아이콘 | import |
|------|--------|--------|
| 전체 사용자 | FaUsers | `import { FaUsers } from 'react-icons/fa'` |
| 링크/매칭 | FaLink | `FaLink` |
| 일정 | FaCalendarAlt | `FaCalendarAlt` |

- **기본 권장**: lucide-react 우선. 어드민 대시보드 KPI/관리 카드와 통일감을 위해 react-icons/Fa* 사용 가능.

---

## 5. 신규 마크업·CSS 클래스

### 5.1 최상위 래퍼

```html
<div class="mg-v2-ad-b0kla mg-v2-mapping-management-v2">
  <div class="mg-v2-ad-b0kla__container">
    <div class="mg-v2-content-area">
      ...
    </div>
  </div>
</div>
```

### 5.2 헤더 (ContentHeader 재사용)

- `ContentHeader` 사용
- `title="매칭 관리"`, `subtitle="상담사와 내담자 간의 매칭을 관리합니다."`
- `actions`: `Plus` 아이콘 + "새 매칭" 버튼 (`mg-v2-button mg-v2-button-primary`)

### 5.3 툴바 (검색 + 상태 필터)

```html
<div class="mg-v2-mapping-v2__toolbar">
  <div class="mg-v2-mapping-v2__search-wrap">
    <SearchInput value={...} onChange={...} placeholder="상담사, 내담자, 패키지명으로 검색..." />
  </div>
  <div class="mg-v2-mapping-v2__filter-pills">
    <button type="button" class="mg-v2-ad-b0kla__pill mg-v2-ad-b0kla__pill--active">전체</button>
    <button type="button" class="mg-v2-ad-b0kla__pill">결제대기</button>
    <button type="button" class="mg-v2-ad-b0kla__pill">입금확인</button>
    <button type="button" class="mg-v2-ad-b0kla__pill">활성</button>
    <button type="button" class="mg-v2-ad-b0kla__pill">종료·기타</button>
  </div>
</div>
```

- **클래스**:
  - `mg-v2-mapping-v2__toolbar`: flex, gap 1rem, align-center, flex-wrap
  - `mg-v2-mapping-v2__search-wrap`: flex-shrink 0
  - `mg-v2-mapping-v2__filter-pills`: `mg-v2-ad-b0kla__pill-toggle` 또는 유사 스타일 (flex, gap 4px)

### 5.4 KPI 스트립 (인라인 타일)

```html
<div class="mg-v2-mapping-v2__kpi-strip">
  <button type="button" class="mg-v2-mapping-v2__kpi-tile mg-v2-mapping-v2__kpi-tile--active" data-filter="ALL">
    <span class="mg-v2-mapping-v2__kpi-tile-value">42</span>
    <span class="mg-v2-mapping-v2__kpi-tile-label">전체</span>
  </button>
  <button type="button" class="mg-v2-mapping-v2__kpi-tile" data-filter="PENDING_PAYMENT">
    <span class="mg-v2-mapping-v2__kpi-tile-value">3</span>
    <span class="mg-v2-mapping-v2__kpi-tile-label">결제대기</span>
  </button>
  ...
</div>
```

- **클래스**:
  - `mg-v2-mapping-v2__kpi-strip`: display flex, gap 0.75rem, flex-wrap
  - `mg-v2-mapping-v2__kpi-tile`: B0KlA 카드 스타일 축소 (padding 1rem, radius 12px), 클릭 시 필터
  - `mg-v2-mapping-v2__kpi-tile--active`: 배경 `var(--ad-b0kla-green-bg)`, 테두리 `var(--ad-b0kla-green)`
  - `mg-v2-mapping-v2__kpi-tile-value`: 1.5rem, 700, `var(--ad-b0kla-title-color)`
  - `mg-v2-mapping-v2__kpi-tile-label`: 12px, `var(--ad-b0kla-text-secondary)`

### 5.5 칸반 영역

```html
<div class="mg-v2-mapping-v2__kanban">
  <div class="mg-v2-mapping-v2__kanban-col" data-status="PENDING_PAYMENT">
    <header class="mg-v2-mapping-v2__kanban-col-header">
      <span class="mg-v2-mapping-v2__kanban-col-title">결제대기</span>
      <span class="mg-v2-mapping-v2__kanban-col-count">3</span>
    </header>
    <div class="mg-v2-mapping-v2__kanban-col-body">
      <article class="mg-v2-mapping-v2__card">...</article>
      ...
    </div>
  </div>
  <div class="mg-v2-mapping-v2__kanban-col" data-status="PAYMENT_CONFIRMED">...</div>
  <div class="mg-v2-mapping-v2__kanban-col" data-status="ACTIVE">...</div>
  <div class="mg-v2-mapping-v2__kanban-col" data-status="TERMINATED_ETC">...</div>
</div>
```

- **클래스**:
  - `mg-v2-mapping-v2__kanban`: display grid, `grid-template-columns: repeat(4, minmax(240px, 1fr))`, gap 1.5rem
  - `mg-v2-mapping-v2__kanban-col`: `mg-v2-ad-b0kla__card` 스타일, 세로 스크롤 가능
  - `mg-v2-mapping-v2__kanban-col-header`: 좌측 악센트 바(4px) + 제목 + 카운트
  - `mg-v2-mapping-v2__kanban-col-body`: min-height 200px, overflow-y auto

### 5.6 매칭 카드 (신규)

```html
<article class="mg-v2-mapping-v2__card">
  <div class="mg-v2-mapping-v2__card-accent" data-status="PENDING_PAYMENT"></div>
  <div class="mg-v2-mapping-v2__card-header">
    <span class="mg-v2-mapping-v2__card-badge">결제대기</span>
    <div class="mg-v2-mapping-v2__card-actions">
      <button type="button" class="mg-v2-mapping-v2__card-action" title="상세보기"><Eye size={16} /></button>
      <button type="button" class="mg-v2-mapping-v2__card-action" title="수정"><Edit size={16} /></button>
    </div>
  </div>
  <div class="mg-v2-mapping-v2__card-body">
    <div class="mg-v2-mapping-v2__card-relation">
      <span class="mg-v2-mapping-v2__card-name mg-v2-mapping-v2__card-name--consultant">김상담</span>
      <span class="mg-v2-mapping-v2__card-relation-icon"><Link2 size={14} /></span>
      <span class="mg-v2-mapping-v2__card-name mg-v2-mapping-v2__card-name--client">이내담</span>
    </div>
    <div class="mg-v2-mapping-v2__card-meta">
      <span><Package size={14} /> 10회기 패키지</span>
      <span><CreditCard size={14} /> 500,000원</span>
    </div>
    <div class="mg-v2-mapping-v2__card-sessions">
      <span>회기: 3/10</span>
    </div>
  </div>
  <div class="mg-v2-mapping-v2__card-footer">
    <!-- 상태별 CTA: 결제확인, 입금확인, 환불 등 -->
  </div>
</article>
```

- **시각적 특징**:
  - 상단 좌측 **세로 악센트 바** (4px, status별 색상)
  - **상담사 ↔ 내담자** 연결선(Link2 아이콘)으로 관계 시각화
  - 패키지·금액·회기 정보 한 줄 컴팩트 표시
  - 푸터에 상태별 CTA 버튼만 노출

---

## 6. B0KlA 토큰 적용

| 요소 | 토큰 | 용도 |
|------|------|------|
| 배경 | `--ad-b0kla-bg` | 페이지 배경 |
| 카드 | `--ad-b0kla-card-bg` | 카드·컬럼 배경 |
| 테두리 | `--ad-b0kla-border` | 테두리 |
| radius | `--ad-b0kla-radius` (24px), `--ad-b0kla-radius-sm` (12px) | 카드·버튼 |
| 제목 | `--ad-b0kla-title-color` | 제목·이름 |
| 보조 | `--ad-b0kla-text-secondary` | 라벨·메타 |
| placeholder | `--ad-b0kla-placeholder` | 검색 placeholder |
| 주조 | `--ad-b0kla-green` | 활성·확인 |
| 주조 배경 | `--ad-b0kla-green-bg` | KPI 활성 타일 |
| 경고 | `--ad-b0kla-orange` | 결제대기 |
| 정보 | `--ad-b0kla-blue` | 입금확인 등 |
| 그림자 | `--ad-b0kla-shadow` | 카드 |

---

## 7. 상태별 시각 매핑

| 상태 | accent 색상 | badge 배경 |
|------|-------------|------------|
| PENDING_PAYMENT | `--ad-b0kla-orange` | `--ad-b0kla-orange-bg` |
| PAYMENT_CONFIRMED, DEPOSIT_PENDING | `--ad-b0kla-blue` | `--ad-b0kla-blue-bg` |
| ACTIVE | `--ad-b0kla-green` | `--ad-b0kla-green-bg` |
| TERMINATED, SESSIONS_EXHAUSTED, INACTIVE, SUSPENDED | `--ad-b0kla-text-secondary` 또는 gray | #edf2f7 |

---

## 8. 반응형

- **768px 이하**: 칸반 → 세로 스택 (1열), 툴바 세로 배치
- **900px 이하**: 칸반 2열
- **1200px 이상**: 칸반 4열

```css
@media (max-width: 1200px) {
  .mg-v2-mapping-v2__kanban {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .mg-v2-mapping-v2__kanban {
    grid-template-columns: 1fr;
  }
  .mg-v2-mapping-v2__toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .mg-v2-mapping-v2__search-wrap {
    width: 100%;
  }
}
```

---

## 9. 빈 상태 (Empty State)

- 칸반 컬럼 내 매칭이 없을 때:
  ```html
  <div class="mg-v2-mapping-v2__empty-col">
    <span class="mg-v2-mapping-v2__empty-icon"><Link2 size={32} /></span>
    <p class="mg-v2-mapping-v2__empty-text">매칭이 없습니다</p>
  </div>
  ```
- 전체 결과가 없을 때: 기존 `mg-v2-ad-b0kla__chart-placeholder` 스타일 활용

---

## 10. 구현용 체크리스트

| # | 항목 | 사용 대상 |
|---|------|----------|
| 1 | 검색 | `SearchInput` (dashboard-v2/atoms) |
| 2 | 아이콘 | lucide-react (Plus, Eye, Edit, Link2, Package, CreditCard, DollarSign, CheckCircle, User, Calendar, Clock, Database, XCircle) |
| 3 | 토큰 | AdminDashboardB0KlA.css B0KlA 변수 |
| 4 | 클래스 prefix | `mg-v2-mapping-v2__`, `mg-v2-ad-b0kla__` |
| 5 | 헤더 | ContentHeader |
| 6 | 툴바 | mg-v2-mapping-v2__toolbar, mg-v2-ad-b0kla__pill |
| 7 | KPI | mg-v2-mapping-v2__kpi-strip, mg-v2-mapping-v2__kpi-tile |
| 8 | 칸반 | mg-v2-mapping-v2__kanban, mg-v2-mapping-v2__kanban-col |
| 9 | 카드 | mg-v2-mapping-v2__card (신규) |
| 10 | CSS 파일 | MappingManagementPageV2.css (신규) |

---

## 11. 대안: 단일 리스트 뷰 (필터=전체일 때)

필터가 "전체"일 때 칸반 대신 **단일 리스트**로 보여줄 수 있는 옵션:

- `mg-v2-mapping-v2__list`: 그리드 `repeat(auto-fill, minmax(340px, 1fr))`
- 각 아이템은 동일한 `mg-v2-mapping-v2__card` 사용
- 칸반/리스트 토글 버튼 추가 가능 (아이콘: LayoutGrid / List)

---

## 12. 참조 파일

| 파일 | 용도 |
|------|------|
| `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` | B0KlA 토큰·pill·카드 |
| `frontend/src/components/dashboard-v2/atoms/SearchInput.js` | 검색 컴포넌트 |
| `frontend/src/components/dashboard-v2/content/ContentHeader.js` | 헤더 |
| `frontend/src/components/dashboard-v2/content/ContentArea.js` | 메인 래퍼 |
| `frontend/src/components/admin/AdminDashboard/organisms/CoreFlowPipeline.js` | 파이프라인 구조 참고 (아이콘: Link2, DollarSign 등) |
