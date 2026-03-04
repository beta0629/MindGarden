# ERP 재무 관리(Financial Management) 페이지 UI 스펙

**문서 버전**: 1.0.0  
**작성일**: 2025-03-04  
**담당**: core-designer (디자인 스펙만, 코드 작성 없음)  
**참조**: ERP_FINANCIAL_MANAGEMENT_IMPROVEMENT_PLAN.md, UNIFIED_LAYOUT_SPEC.md, UNIFIED_LAYOUT_AND_PAGES_PLAN.md, PENCIL_DESIGN_GUIDE.md, 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample

---

## 1. 적용 구조 및 레이아웃

### 1.1 템플릿·영역

- **공통 레이아웃**: `AdminCommonLayout` + `ContentHeader` + `ContentArea` 적용됨.
- **ContentHeader**: 제목 "재무 관리", 부제목(선택), 우측 주요 액션(등록·엑셀 다운로드 등). 클래스: `mg-v2-content-header`, `mg-v2-content-header__title`, `mg-v2-content-header__right`.
- **ContentArea**: `mg-v2-content-area`, 내부에 아래 **탭 → 필터 → 콘텐츠 블록** 순서로 배치.

### 1.2 블록 배치 (UNIFIED_LAYOUT_SPEC §2.2·§2.3.1)

| 순서 | 영역 | 설명 | 아토믹 계층 |
|------|------|------|-------------|
| 1 | **탭 영역** | 거래 / 달력 / 대시보드 전환. ContentArea 직하단. | Molecules (Pill 토글) |
| 2 | **필터 영역** | 태그 그룹 + 검색 input + 버튼. **거래 탭**에서만 노출. 하나의 섹션 블록 또는 툴바로 배치. | Molecules |
| 3 | **거래 목록** | 카드 그리드. 섹션 블록 래퍼(배경 `var(--mg-layout-section-bg)`, 테두리·radius·악센트 바) + 그리드. | Organisms 내부 Section block + 카드 그리드 |
| 4 | **달력 뷰** | 달력 + 범례 + 상세 패널. 탭 "달력" 선택 시 동일 ContentArea 내 하나의 섹션 블록으로 표시. | Organisms (섹션 블록 1개) |
| 5 | **대시보드** | KPI 카드 + 차트/요약. 탭 "대시보드" 선택 시 ContentArea 내 섹션 블록·B0KlA 카드 그리드. | Organisms (섹션 블록 + B0KlA 카드) |

- **섹션 블록**: 배경 `var(--mg-layout-section-bg)`, 테두리 1px `var(--mg-layout-section-border)`, border-radius 16px, 패딩 `var(--mg-layout-section-padding)`. 좌측 악센트 바 4px `var(--mg-color-primary-main)`, radius 2px.
- **반응형**: 태그 필터는 줄바꿈 가능(flex-wrap). 그리드 컬럼 수는 RESPONSIVE_LAYOUT_SPEC §4.1 준수.

---

## 2. 탭 영역

- **컴포넌트/클래스**: `mg-v2-ad-b0kla__pill-toggle` 래퍼, 각 탭 버튼 `mg-v2-ad-b0kla__pill`, 활성 탭 `mg-v2-ad-b0kla__pill--active`.
- **옵션**: (1) 거래 (2) 달력 (3) 대시보드.
- **아이콘**(Lucide, 이모지 금지):  
  - 거래: `ClipboardList`  
  - 달력: `Calendar`  
  - 대시보드: `Gauge` 또는 `LayoutDashboard`

---

## 3. 필터 영역 — 태그 형태

### 3.1 원칙

- 거래 유형 / 카테고리 / 연동 유형은 **select가 아닌 태그**로 표시.
- 각 그룹별 **단일 선택**(전체 포함). 선택된 항목은 시각적 구분.

### 3.2 클래스·구조

| 요소 | 클래스/토큰 | 비고 |
|------|-------------|------|
| 그룹 래퍼 | `mg-v2-tag-group` | 거래 유형·카테고리·연동 유형 각각 또는 통합 래퍼 |
| 태그(옵션) | `mg-v2-tag` | 미선택 상태 |
| 태그(선택됨) | `mg-v2-tag--selected` | 선택 시 적용 |
| 라벨 | `mg-v2-form-label` 또는 B0KlA 캡션(12px, `var(--mg-color-text-secondary)`) | "거래 유형", "카테고리", "연동 유형" |

### 3.3 옵션 구성

- **거래 유형**: "전체" | "수입" | "지출" — 태그로 나열, 클릭 시 단일 선택.
- **카테고리**: "전체" | "상담료" | "급여" | "임대료" | … (API/기획서 옵션과 동일).
- **연동 유형**: "전체" | "매핑연동" | "환불처리" | "결제" | … (동일).
- **검색**: 텍스트 input 유지. (선택) Search 아이콘.
- **버튼**: "필터 초기화" — Lucide `RefreshCw`. "검색" — Lucide `Search`. 스타일: `mg-v2-button-secondary` / `mg-v2-button-primary`.

### 3.4 레이아웃

- 태그 그룹은 그룹별 한 줄 또는 줄바꿈 가능한 flex/grid. 모바일에서도 터치 영역 44px 이상 권장.

---

## 4. 거래 목록 블록

- **래퍼**: 섹션 블록 1개. 제목(선택) 좌측 악센트 바 + "거래 목록" 등.
- **그리드**: `mg-financial-transaction-cards-grid` 유지. gap `var(--mg-layout-grid-gap)`.
- **카드**: MGCard 또는 `mg-v2-ad-b0kla__card`. 카드 내 액션 버튼: Lucide `Eye`, `Pencil`, `Trash2` (이모지·Bootstrap 아이콘 사용 금지).
- **빈 상태**: Lucide `Inbox` + 텍스트(이모지 없음).

---

## 5. 달력 뷰 블록

- **전체**: 하나의 섹션 블록 안에 달력 헤더·네비·날짜 그리드·범례·상세 패널·월 통계 배치.
- **이모지 금지**: 제목·범례·날짜 셀·상세 패널·월 통계에서 이모지(📅💰💸🔗📊✕💎📋 등) 전부 제거.
- **아이콘 매핑**(§5.2 반영): 아래 §7 표 참조. 네비게이션: "이전" + `ChevronLeft`, "다음" + `ChevronRight`.
- **색상**: `var(--mg-*)` 토큰 사용. 인라인 하드코딩 색상 사용 금지.

---

## 6. 대시보드 탭 블록

- **카드**: `mg-v2-ad-b0kla__card` 또는 동일 스타일. KPI·메트릭 카드 좌측 세로 악센트(4px) 권장.
- **아이콘**: Lucide만 사용. 수입 `TrendingUp`, 지출 `TrendingDown`, 순이익/통계 `BarChart3`, 거래 건수 `ClipboardList`, 매핑 `Link2`, 되돌리기 등 `Undo2` 또는 `ArrowLeftCircle`.
- **빠른 액션 버튼**: `mg-v2-button-*` + Lucide 아이콘.

---

## 7. 이모지 금지 · Lucide 아이콘 매핑

**원칙**: 재무 관리 페이지·달력 탭 전체에서 이모지 사용 금지. 아래 Lucide 컴포넌트명만 사용.

### 7.1 달력 뷰 (FinancialCalendarView)

| 용도/문맥 | 기존(이모지 등) | Lucide 아이콘 |
|-----------|------------------|----------------|
| 달력 제목 | 📅 | `Calendar` |
| 네비게이션 이전/다음 | ◀ / ▶ | `ChevronLeft`, `ChevronRight` |
| 범례·수입 | 💰 | `DollarSign` |
| 범례·지출 | 💸 | `TrendingDown` 또는 `Wallet` |
| 범례·매핑 | 🔗 | `Link2` |
| 날짜 셀 수입/지출 | 💰, 💸 | `DollarSign`, `TrendingDown`(또는 `Wallet`) |
| 상세 패널 제목 | 📊 | `BarChart3` |
| 닫기 버튼 | ✕ | `X` |
| 순이익 | 💎 | `Gem` 또는 `CircleDollarSign` |
| 거래 내역 | 📋 | `ClipboardList` |
| 월 통계·총 거래 | 📊 | `BarChart3` 또는 `LayoutDashboard` |
| 매핑연동 뱃지 | 🔗 | `Link2` |

### 7.2 FinancialManagement.js (탭·버튼·에러·빈 상태·대시보드)

| 용도 | 기존 | Lucide 아이콘 |
|------|------|----------------|
| 탭 거래/달력/대시보드 | bi-list-ul, bi-calendar3, bi-speedometer2 | `ClipboardList`, `Calendar`, `Gauge` 또는 `LayoutDashboard` |
| 버튼 등록/다운로드 | bi-plus, bi-download | `Plus`, `Download` |
| 카드 보기/수정/삭제 | bi-eye, bi-pencil, bi-trash | `Eye`, `Pencil`, `Trash2` |
| 에러 | bi-exclamation-triangle-fill | `AlertTriangle` |
| 다시 시도 | bi-arrow-clockwise | `RefreshCw` |
| 빈 상태 | bi-inbox | `Inbox` |
| 대시보드 수입/지출/순이익/거래/매핑 | bi-arrow-up-circle, bi-arrow-down-circle, bi-graph-up, bi-list-ul, bi-link-45deg, bi-arrow-left-circle | `TrendingUp`, `TrendingDown`, `BarChart3`, `ClipboardList`, `Link2`, `Undo2` 또는 `ArrowLeftCircle` |

---

## 8. 토큰·클래스 요약

- **레이아웃**: `var(--mg-layout-section-bg)`, `var(--mg-layout-section-border)`, `var(--mg-layout-section-padding)`, `var(--mg-layout-grid-gap)`.
- **색상**: `var(--mg-color-primary-main)`, `var(--mg-color-text-main)`, `var(--mg-color-text-secondary)`, `var(--mg-color-border-main)`.
- **컴포넌트**: `mg-v2-content-header`, `mg-v2-content-area`, `mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active`, `mg-v2-tag-group`, `mg-v2-tag`, `mg-v2-tag--selected`, `mg-v2-ad-b0kla__card`, `mg-v2-button-primary`, `mg-v2-button-secondary`.

---

## 9. 코더 구현 체크리스트 (재무 관리 한정)

- [ ] AdminCommonLayout + ContentHeader + ContentArea 구조 유지.
- [ ] 탭이 B0KlA Pill + Lucide(ClipboardList, Calendar, Gauge/LayoutDashboard)만 사용.
- [ ] 필터가 select가 아닌 태그(`mg-v2-tag-group`, `mg-v2-tag`, `mg-v2-tag--selected`)로 표시되고, 단일 선택·시각적 구분 적용.
- [ ] 거래 목록·달력·대시보드·에러/빈 상태에 이모지 없음, §7 매핑대로 Lucide만 사용.
- [ ] 섹션 블록(배경·테두리·radius·악센트 바)·토큰 적용.
- [ ] 달력 뷰 네비게이션 ChevronLeft/ChevronRight, 범례·날짜 셀·상세·월 통계 이모지 제거 후 Lucide 대체.

---

**요약**: 재무 관리 페이지는 동일한 ContentHeader + ContentArea 안에서 탭(거래/달력/대시보드) → 필터(태그 형태) → 해당 콘텐츠 블록 순으로 배치한다. 필터는 기존 `mg-v2-tag-*` 클래스로 태그 단일 선택, 모든 UI에서 이모지 없이 §7 Lucide 매핑만 사용한다. 상세 기획·Phase·작업 목록은 `docs/planning/ERP_FINANCIAL_MANAGEMENT_IMPROVEMENT_PLAN.md` 참조.
