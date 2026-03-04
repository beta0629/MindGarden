# ERP 재무 관리(Financial Management) 리뉴얼 화면설계서

**문서 버전**: 1.0.0  
**작성일**: 2025-03-04  
**담당**: core-designer (디자인 스펙만, 코드 작성 없음)  
**참조**:  
- 기획서 `docs/planning/ERP_FINANCIAL_MANAGEMENT_RENEWAL_PLAN.md` (§3 달력, §4 리뉴얼 방향, §7 core-designer 체크리스트)  
- 어드민 대시보드 샘플: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample  
- `docs/design-system/PENCIL_DESIGN_GUIDE.md`, `docs/design-system/ERP_FINANCIAL_MANAGEMENT_UI_SPEC.md`  
- 디자인 토큰: `frontend/src/styles/unified-design-tokens.css` (Calendar 섹션, B0KlA), `frontend/src/styles/dashboard-tokens-extension.css` (ad-b0kla), `frontend/src/styles/responsive-layout-tokens.css` (mg-layout-*)

---

## 1. 적용 구조 및 레이아웃

### 1.1 템플릿·영역

| 영역 | 컴포넌트/클래스 | 설명 |
|------|-----------------|------|
| **공통 레이아웃** | `AdminCommonLayout` | 좌측 사이드바 260px(`--mg-layout-sidebar-width`), 메인 영역 배경 `var(--mg-layout-main-bg-start)` ~ `var(--mg-layout-main-bg-end)` |
| **상단 바** | `ContentHeader` | 클래스: `mg-v2-content-header`. 브레드크럼 + 페이지 제목 "재무 관리" + 우측 액션(등록·엑셀 다운로드). 배경 `var(--mg-layout-header-bg)`, 하단 1px `var(--mg-layout-header-border)`. 높이 56~64px |
| **본문** | `ContentArea` | 클래스: `mg-v2-content-area`. 패딩 `var(--mg-layout-page-padding-desktop)`(24px) ~ `var(--mg-layout-page-padding-4k)`(40px). 내부 순서: **탭 → 필터(거래 탭만) → 콘텐츠 블록** |

- **단일 소스**: 색상·간격은 `var(--mg-*)` 또는 B0KlA용 `var(--ad-b0kla-*)` 토큰만 사용. hex 하드코딩 금지.

### 1.2 블록 배치 (정보 구조)

| 순서 | 영역 | 노출 조건 | 아토믹 계층 |
|------|------|-----------|-------------|
| 1 | **탭** | 항상 | Molecules (Pill 토글) |
| 2 | **필터** | **거래 탭** 선택 시만, 1~2줄 | Molecules |
| 3 | **거래 목록** | 거래 탭 선택 시 | Organisms (섹션 블록 + 카드 그리드) |
| 4 | **달력 뷰** | 달력 탭 선택 시 | Organisms (섹션 블록 + 공통 달력 + 범례 + 일별 상세 + 월 통계) |
| 5 | **대시보드** | 대시보드 탭 선택 시 | Organisms (섹션 블록 + KPI 카드 4개) |

---

## 2. 탭 영역

- **컴포넌트/클래스**: 래퍼 `mg-v2-ad-b0kla__pill-toggle`, 각 탭 `mg-v2-ad-b0kla__pill`, 활성 탭 `mg-v2-ad-b0kla__pill--active`.
- **옵션**: (1) 거래 (2) 달력 (3) 대시보드.
- **아이콘**: Lucide만 사용, 이모지 금지.  
  - 거래: `ClipboardList`  
  - 달력: `Calendar`  
  - 대시보드: `LayoutDashboard` 또는 `Gauge`
- **스타일**: 비활성 텍스트 `var(--ad-b0kla-text-secondary)`, 활성 배경 `var(--ad-b0kla-green)`, 텍스트 #fff. Pill 높이 44px, padding 12px 20px, border-radius B0KlA 기준.

---

## 3. 필터 영역 (거래 탭 전용)

### 3.1 원칙

- **기간 필수**: 반드시 1개 기간 선택 UI. API는 기존 `startDate`/`endDate` 활용.
- **1~2줄 레이아웃**: 1줄에 기간 + 거래 유형 + 카테고리, 2줄에 검색 + (선택) 필터 초기화. 연동 유형은 **제거** 또는 **고급 필터 접기** 내부로.

### 3.2 구성 요소

| 항목 | UI 형태 | 클래스/토큰 | 비고 |
|------|---------|-------------|------|
| **기간** | 드롭다운 1개 또는 기간 픽커 1개 | `mg-v2-form-label`, B0KlA select/input 스타일. 옵션: 오늘/이번 주/이번 달/직접 입력(시작일~종료일) | 필수. 선택 시 startDate/endDate 반영 |
| **거래 유형** | 태그 단일 선택 | `mg-v2-tag-group`, `mg-v2-tag`, `mg-v2-tag--selected` | 전체 / 수입 / 지출 |
| **카테고리** | 태그 1줄 또는 드롭다운 1개 | 동일 또는 `mg-v2-select` | 전체 / 상담료 / 급여 / 임대료 / 관리비 / 사무용품 / 기타 등. 많으면 드롭다운 권장 |
| **연동 유형** | 제거 또는 "고급 필터" 접기 내부 | 접기 시에만 노출, 태그 또는 드롭다운 1개 | 기획서 §4.3: 제거 또는 고급 필터로 이동 |
| **검색** | 텍스트 input 1개 | B0KlA input, (선택) Lucide `Search` 아이콘 | 상담사명·내담자명·설명 검색 |
| **버튼** | 필터 초기화, (선택) 검색 버튼 | `mg-v2-button-secondary`(초기화, Lucide `RefreshCw`), `mg-v2-button-primary`(검색 시) | |

### 3.3 레이아웃

- **1줄**: 기간(드롭다운 또는 픽커) + 거래 유형 태그 그룹 + 카테고리 태그/드롭다운.  
- **2줄**(또는 1줄 우측): 검색 input + 필터 초기화 버튼.  
- 태그 그룹: `flex-wrap` 허용, 줄바꿈 가능. 터치 영역 최소 44px.
- **섹션 블록**: 필터 전체를 하나의 섹션 블록으로 감쌀 경우: 배경 `var(--mg-layout-section-bg)`, 테두리 1px `var(--mg-layout-section-border)`, border-radius 16px, 패딩 `var(--mg-layout-section-padding-desktop)`, 좌측 악센트 바 4px `var(--mg-color-primary-main)` 또는 `var(--ad-b0kla-green)`.

---

## 4. 거래 목록 블록 (거래 탭 본문)

### 4.1 래퍼

- **섹션 블록 1개**: 배경 `var(--mg-layout-section-bg)`, 테두리 1px `var(--mg-layout-section-border)`, border-radius 16px, 패딩 `var(--mg-layout-section-padding-desktop)`.  
- **섹션 제목**(선택): 좌측 세로 악센트 바(4px, `var(--mg-color-primary-main)`) + "거래 목록". 폰트 16px, fontWeight 600, 색상 `var(--mg-color-text-main)` 또는 `var(--ad-b0kla-title-color)`.

### 4.2 그리드

- **클래스**: `mg-financial-transaction-cards-grid` 유지 가능. gap `var(--mg-layout-grid-gap)` 또는 `var(--mg-layout-grid-gap-desktop)`(24px).  
- **반응형**: RESPONSIVE_LAYOUT_SPEC §2.3 준수. 모바일 1열, 태블릿 2열, 데스크톱 3~4열, FHD 이상 4~6열.

### 4.3 거래 카드 (필수 노출만)

- **카드 컴포넌트**: **`mg-v2-ad-b0kla__card`** 또는 **MGCard** 중 하나로 통일 명시. (구현 시 하나로 통일)
- **카드에 노출할 필드(필수만)**  
  - 거래일(일자)  
  - 유형(수입/지출) — 텍스트 또는 뱃지, 색상: 수입 `var(--mg-success-500)` 또는 `var(--ad-b0kla-green)`, 지출 `var(--mg-error-500)` 또는 `var(--ad-b0kla-danger)`  
  - 카테고리  
  - 금액(숫자, 강조)  
  - 상태(확정/대기 등)  
  - 매핑 여부 — 아이콘 또는 뱃지(Lucide `Link2` 등)
- **상세(매칭 정보, 설명 등)**: 카드 본문에 넣지 않고, **"보기" 클릭 시 모달**(UnifiedModal) 또는 접기 영역으로만 노출.
- **카드 액션 버튼**: Lucide `Eye`(보기), `Pencil`(수정), `Trash2`(삭제). 이모지·Bootstrap 아이콘 사용 금지.
- **빈 상태**: Lucide `Inbox` + 텍스트(이모지 없음). 색상 `var(--mg-color-text-secondary)`.

### 4.4 페이지네이션

- 기존 페이지네이션 유지 시, B0KlA·토큰 적용. 버튼/링크 색상 `var(--mg-*)` 사용.

---

## 5. 달력 뷰 블록 (달력 탭 본문)

### 5.1 공통 달력 구조 필수

재무 달력은 **프로젝트 공통 달력(mg-calendar)** 과 동일한 **구조·클래스**를 사용한다. 기존 `mg-v2-calendar-grid`, `mg-financial-calendar-cell-*` 등 별도 마크업은 제거하고 아래 클래스로 통일한다.

| 영역 | 사용할 클래스 | 비고 |
|------|----------------|------|
| **달력 컨테이너** | `mg-calendar` | 배경·radius·padding·shadow는 unified-design-tokens.css Calendar 섹션 기준. 배경은 `var(--mg-color-surface-main)` 또는 white, 테두리/radius 토큰 사용 |
| **헤더(월 표시 + 네비)** | `mg-calendar-header` | flex, 좌우 정렬 |
| **월 제목** | `mg-calendar-title` | 예: "2025년 3월". font-size 1.25rem, fontWeight 600, 색상 `var(--mg-color-text-main)` |
| **이전/다음 월** | `mg-calendar-nav-btn` | 버튼 2개. 아이콘: Lucide `ChevronLeft`, `ChevronRight`. 배경/호버는 토큰(`var(--light-beige)` → `var(--cream)` 등) 또는 `var(--mg-color-border-main)` 계열로 통일 |
| **요일 헤더 행** | `mg-calendar-day-header` | 7열. 일~토. text-align center, font-size 0.75rem, 색상 `var(--mg-color-text-secondary)` |
| **날짜 그리드** | `mg-calendar-grid` | `grid-template-columns: repeat(7, 1fr)`, gap 0.5rem 또는 `var(--mg-layout-grid-gap)` |
| **날짜 셀** | `mg-calendar-day` | 각 셀. modifier: `.today`, `.selected`, `.has-event` (있을 경우). hover/selected/today 배경은 **hex 금지**, `var(--mg-*)` 또는 semantic 토큰만 사용 |

- **색상 통일**: 현재 재무 달력에 쓰인 `#495057`, `#dee2e6`, `#e3f2fd`, `#fff3cd` 등 하드코딩은 모두 제거하고, `var(--mg-color-text-main)`, `var(--mg-color-border-main)`, `var(--mg-success-100)`, `var(--mg-warning-100)` 등으로 치환한다.

### 5.2 날짜 셀 내 수입/지출 요약 표시

- **방식**: 각 `mg-calendar-day` 셀 내부에 해당 일자의 **수입 합계·지출 합계** 요약만 표시. (선택) 거래 건수.
- **표현**:  
  - 수입: 짧은 텍스트(예: "+12만") 또는 작은 뱃지. 색상 `var(--mg-success-500)` 또는 `var(--mg-success-600)`.  
  - 지출: "-5만" 등. 색상 `var(--mg-error-500)` 또는 `var(--mg-error-600)`.  
- **아이콘 사용 시**: Lucide `TrendingUp`(수입), `TrendingDown`(지출). 이모지 금지.
- **선택 시**: 해당 셀에 `.selected` 적용. 배경 `var(--mg-primary-500)` 또는 B0KlA 주조(olive-green 계열) 토큰, 텍스트 흰색.

### 5.3 범례

- **위치**: 달력 그리드 바로 아래 또는 우측. 섹션 블록 내부.
- **항목**: 수입 / 지출 / (선택) 매핑됨. 색상·아이콘만 토큰·Lucide 사용.  
  - 수입: `var(--mg-success-500)`, Lucide `TrendingUp` 또는 `DollarSign`  
  - 지출: `var(--mg-error-500)`, Lucide `TrendingDown` 또는 `Wallet`  
  - 매핑: `var(--mg-primary-500)`, Lucide `Link2`
- **클래스**: 범례용 블록은 재무 전용 클래스(예: `mg-financial-calendar-legend`) 허용하되, 내부 텍스트·아이콘 색상은 `var(--mg-*)`만 사용.

### 5.4 일별 상세 패널

- **노출**: 날짜 셀 클릭 시에만 표시. 달력 하단 또는 측면 블록.
- **내용**: 해당 일자의 거래 목록(간단 목록 또는 카드형). 제목에 선택한 날짜 표시. 닫기: Lucide `X`.
- **스타일**: 섹션 블록과 동일(배경·테두리·radius·패딩 토큰). 제목 좌측 악센트 바 4px `var(--mg-color-primary-main)`.

### 5.5 월 통계 블록

- **위치**: 달력·범례·일별 상세와 같은 섹션 내, 달력 아래 또는 우측.
- **구성**: 카드 4개 — **해당 월 수입 합계 / 지출 합계 / 순이익 / 거래 건수**.  
- **카드**: `mg-v2-ad-b0kla__card`. 좌측 세로 악센트(4px)로 구분(수입=success, 지출=error, 순이익=primary, 건수=secondary). 숫자 24px fontWeight 600, 라벨 12px `var(--mg-color-text-secondary)`.  
- **색상**: 전부 `var(--mg-*)` 또는 `var(--ad-b0kla-*)`. hex 사용 금지.

### 5.6 이모지 금지 · 아이콘

- 달력 탭 전체에서 이모지 사용 금지. 네비·범례·셀·상세·월 통계 모두 Lucide 아이콘만 사용. 매핑은 `Link2`, 닫기 `X`, 순이익 `BarChart3` 또는 `CircleDollarSign` 등 기존 ERP_FINANCIAL_MANAGEMENT_UI_SPEC §7 매핑 준수.

---

## 6. 대시보드 탭 블록

### 6.1 구성

- **KPI 카드 4개만** 기본 노출: **수입 합계 / 지출 합계 / 순이익 / 거래 건수**. 부가 지표는 접기 또는 2차 탭으로.
- **래퍼**: 섹션 블록 1개(배경·테두리·radius·패딩 동일). 제목(선택) 좌측 악센트 바 + "대시보드" 또는 생략.

### 6.2 KPI 카드

- **컴포넌트**: **`mg-v2-ad-b0kla__card`** (MGCard와 혼용 시 하나로 통일 명시).
- **레이아웃**: 4열 그리드(반응형: 모바일 1~2열, 태블릿 2열, 데스크톱 4열). gap `var(--mg-layout-grid-gap)`.
- **카드 내용**:  
  - 라벨: 12px, `var(--mg-color-text-secondary)`.  
  - 숫자: 24px, fontWeight 600, `var(--mg-color-text-main)`.  
  - 좌측 세로 악센트 바 4px: 수입 `var(--mg-success-500)`, 지출 `var(--mg-error-500)`, 순이익 `var(--mg-primary-500)` 또는 `var(--ad-b0kla-green)`, 거래 건수 `var(--mg-color-secondary-main)` 또는 `var(--ad-b0kla-text-secondary)`.
- **아이콘**(선택): Lucide `TrendingUp`, `TrendingDown`, `BarChart3`, `ClipboardList`. 이모지 금지.
- **빠른 액션**: 필요 시 버튼 `mg-v2-button-primary` / `mg-v2-button-secondary` + Lucide 아이콘. 색상 토큰만 사용.

---

## 7. 색상·토큰 정리

### 7.1 색상 (전 영역)

- **원칙**: 모든 영역에서 **`var(--mg-*)`** 토큰만 사용. B0KlA 영역은 `var(--ad-b0kla-*)` 허용(해당 토큰이 내부적으로 mg/cs 참조하므로 유지). **하드코딩 hex(#xxxxxx) 사용 금지.**
- **참조**:  
  - 배경: `var(--mg-layout-section-bg)`, `var(--mg-layout-main-bg-start)`, `var(--mg-color-surface-main)`  
  - 테두리: `var(--mg-layout-section-border)`, `var(--mg-color-border-main)`  
  - 텍스트: `var(--mg-color-text-main)`, `var(--mg-color-text-secondary)`  
  - 수입/성공: `var(--mg-success-500)`, `var(--mg-success-600)`  
  - 지출/에러: `var(--mg-error-500)`, `var(--mg-error-600)`  
  - 주조/강조: `var(--mg-primary-500)`, `var(--ad-b0kla-green)`  
- **달력**: today/selected/hover 배경도 토큰으로만 정의(mint-green → `var(--mg-success-100)` 등, olive-green → `var(--mg-primary-500)` 등).

### 7.2 레이아웃 토큰

- 패딩: `var(--mg-layout-section-padding-desktop)`, `var(--mg-layout-page-padding-desktop)` 등.  
- gap: `var(--mg-layout-grid-gap)`, `var(--mg-layout-gap-desktop)`.  
- 반응형: `responsive-layout-tokens.css`의 mobile/tablet/desktop/fhd/2k/4k 값 준수.

### 7.3 컴포넌트 클래스 요약

| 용도 | 클래스/컴포넌트 |
|------|-----------------|
| 탭 래퍼/탭/활성 | `mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active` |
| 필터 태그 | `mg-v2-tag-group`, `mg-v2-tag`, `mg-v2-tag--selected` |
| 카드(거래·대시보드·월통계) | `mg-v2-ad-b0kla__card` 또는 MGCard(하나로 통일) |
| 달력 컨테이너 | `mg-calendar` |
| 달력 헤더/제목/네비/그리드/요일/날짜셀 | `mg-calendar-header`, `mg-calendar-title`, `mg-calendar-nav-btn`, `mg-calendar-grid`, `mg-calendar-day-header`, `mg-calendar-day` (.today, .selected, .has-event) |
| 버튼 | `mg-v2-button-primary`, `mg-v2-button-secondary` |
| Content 영역 | `mg-v2-content-header`, `mg-v2-content-area` |

---

## 8. 반응형

- **브레이크포인트**: RESPONSIVE_LAYOUT_SPEC §1 준수(375 / 768 / 1280 / 1920 / 2560 / 3840).  
- **필터**: 태그 줄바꿈 허용. 기간·검색은 2줄로 넘어가도 무방.  
- **거래 카드 그리드**: 모바일 1열, 태블릿 2열, 데스크톱 3~4열, FHD 이상 4~6열.  
- **대시보드 KPI**: 모바일 1~2열, 데스크톱 4열.  
- **달력**: 그리드 7열 유지, 셀 내 텍스트/숫자는 작게 유지해 줄바꿈 최소화.  
- **터치**: 버튼·태그·날짜 셀 최소 44px 터치 영역 권장.

---

## 9. 코더 구현 체크리스트 (본 스펙 기준)

- [ ] AdminCommonLayout + ContentHeader + ContentArea 구조 유지.
- [ ] 탭: `mg-v2-ad-b0kla__pill-toggle` / `__pill` / `__pill--active`, Lucide(ClipboardList, Calendar, LayoutDashboard)만 사용.
- [ ] **필터**: 거래 탭에서만 노출, **기간 필수**(드롭다운 또는 기간 픽커 1개), 거래 유형(태그), 카테고리(태그 또는 드롭다운 1개), 검색 1개. 연동 유형 제거 또는 고급 필터 접기. 1~2줄.
- [ ] **거래 카드**: `mg-v2-ad-b0kla__card` 또는 MGCard 중 하나로 통일. 필수 필드만(일자, 유형, 카테고리, 금액, 상태, 매핑 여부). 상세는 모달. Lucide Eye/Pencil/Trash2.
- [ ] **달력**: **mg-calendar, mg-calendar-header, mg-calendar-title, mg-calendar-nav-btn, mg-calendar-grid, mg-calendar-day-header, mg-calendar-day** 구조·클래스 사용. 날짜 셀 내 수입/지출 요약, 범례·일별 상세 패널·월 통계 블록 배치. 색상 전부 `var(--mg-*)` (hex 제거).
- [ ] **대시보드**: KPI 카드 4개(수입/지출/순이익/거래 건수), `mg-v2-ad-b0kla__card`, 좌측 악센트·토큰 적용.
- [ ] 전 영역 색상 `var(--mg-*)` 또는 `var(--ad-b0kla-*)` 만 사용, hex 하드코딩 없음.
- [ ] 이모지 없음, Lucide 아이콘만 사용.

---

## 10. 참조 문서

| 문서/파일 | 용도 |
|-----------|------|
| `docs/planning/ERP_FINANCIAL_MANAGEMENT_RENEWAL_PLAN.md` | 기획·달력 통일·필터 단순화·정보 구조 |
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | B0KlA 팔레트·레이아웃·섹션 블록·디자이너 체크리스트 |
| `docs/design-system/ERP_FINANCIAL_MANAGEMENT_UI_SPEC.md` | 기존 UI 스펙·아이콘 매핑 |
| `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` | 브레이크포인트·컨테이너·패딩·그리드 |
| `frontend/src/styles/unified-design-tokens.css` | Calendar 섹션(mg-calendar-*), 색상·radius·shadow |
| `frontend/src/styles/dashboard-tokens-extension.css` | ad-b0kla-* 토큰 |
| `frontend/src/styles/responsive-layout-tokens.css` | mg-layout-* |
| `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` | mg-v2-ad-b0kla__card, __pill 등 |

---

**요약**: 재무 관리 리뉴얼은 AdminCommonLayout + ContentHeader + ContentArea 안에서, 탭(거래/달력/대시보드) → 필터(거래 탭만, 기간 필수 + 거래 유형/카테고리/검색, 1~2줄) → 탭별 본문(거래 카드 그리드 / **공통 mg-calendar 구조의 달력** + 범례 + 일별 상세 + 월 통계 / 대시보드 KPI 4카드) 순으로 배치한다. 모든 색상은 `var(--mg-*)` 또는 `var(--ad-b0kla-*)` 로만 정의하고, 달력은 반드시 **mg-calendar, mg-calendar-header, mg-calendar-grid, mg-calendar-day, mg-calendar-nav-btn, mg-calendar-day-header** 클래스를 사용하는 구조로 구현한다. 코더는 본 스펙의 블록·컴포넌트·클래스·토큰을 그대로 적용하면 된다.
