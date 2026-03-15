# 관리자 대시보드 지표 영역 — 옵션 C(상단 KPI 타일 + 하단 파이프라인) 디자인 스펙

**버전**: 1.0  
**상태**: 디자인 스펙 (Design Spec) — 코드 작성 없음  
**참조**: `ADMIN_DASHBOARD_METRICS_VISUALIZATION_SPEC.md` 5.4절, `ADMIN_DASHBOARD_METRICS_OPTION_A_SPEC.md`, `PENCIL_DESIGN_GUIDE.md`, `RESPONSIVE_LAYOUT_SPEC.md`, 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample

---

## 1. 개요

- **옵션 C 정의**: 상단에 **KPI 타일 그리드**를 두고, 하단에 **5단계 파이프라인**을 별도 섹션 블록으로 분리하는 레이아웃. "숫자 요약"과 "흐름 시각화"를 동시에 제공한다.
- **범위**: 레이아웃·비주얼·지표 중복 정책·반응형만 정의. 구현은 core-coder가 수행하며, 본 문서는 스펙만 산출한다.

---

## 2. 레이아웃

### 2.1 전체 구조

- **상단 블록**: KPI 타일 그리드 1개. 지표 3~5개.
- **하단 블록**: 섹션 제목("핵심 흐름" 등) + CoreFlowPipeline 5단계.
- **두 블록 관계**: 세로로 연속 배치. **동일한 페이지 본문 플로우** 안에서 위 → 아래 순서.

### 2.2 상단 KPI 그리드 영역

| 항목 | 값 | 토큰/비고 |
|------|-----|------------|
| **영역 높이** | 콘텐츠에 따라 자동(min-height 없음 권장). 타일 내부 패딩으로 일정 높이 확보 | 타일 높이는 카드 패딩 + 숫자·라벨 1~2줄 기준 |
| **열 수 (데스크톱 1280px+)** | 3~5열 | 지표 개수에 따라 3, 4 또는 5. `grid-template-columns` 또는 `repeat(auto-fit, minmax(200px, 1fr))` 등으로 유연 배치 |
| **열 수 (태블릿 768px ~ 1279px)** | 2열 | 고정 2열 권장. gap 16~20px |
| **열 수 (모바일 &lt;768px)** | 1열 세로 쌓기 **또는** 가로 스크롤 1행 | 팀 정책 선택: 1열이면 스크롤 길어짐, 가로 스크롤이면 한 화면에 1~2개 보이고 스와이프로 나머지 확인 |
| **상단 그리드 ↔ 하단 파이프라인 간격** | 24px (데스크톱), 20px (태블릿), 16px (모바일) | `var(--mg-spacing-xl)` / `var(--mg-spacing-lg)` / `var(--mg-spacing-md)` |
| **상단 블록 패딩** | 데스크톱 24px, 태블릿 20px, 모바일 16px | `RESPONSIVE_LAYOUT_SPEC.md` 섹션 패딩과 동일 |
| **타일 간 gap** | 데스크톱 20~24px, 태블릿 16px, 모바일 12~16px | `var(--mg-spacing-lg)` ~ `var(--mg-spacing-xl)` |

### 2.3 하단 파이프라인 섹션

| 항목 | 값 | 토큰/비고 |
|------|-----|------------|
| **섹션 제목** | "핵심 흐름" (또는 팀 확정 문구) | `mg-v2-ad-b0kla__section-title` |
| **제목 위치** | 하단 블록 **좌측 상단**. 제목 왼쪽에 세로 악센트 바 4px | PENCIL_DESIGN_GUIDE 2.3 섹션 블록 규칙 |
| **제목 스타일** | 16px, fontWeight 600, 색 `var(--ad-b0kla-title-color)` 또는 `var(--mg-color-text-main)` | 좌측 악센트 4px, 주조색 `var(--mg-color-primary-main)` 또는 `var(--ad-b0kla-green)` |
| **파이프라인과의 간격** | 제목 하단 ~ 파이프라인 상단 12~16px | `var(--mg-spacing-md)` |

### 2.4 블록 구분

- **상단 블록**: 하나의 **섹션 카드**(또는 `mg-v2-ad-b0kla__card` 1개)로 감쌈. 제목 없이 그리드만 넣거나, 필요 시 "요약 지표" 등 짧은 제목 + 좌측 악센트 바 적용 가능.
- **하단 블록**: **별도 섹션 카드 1개**. 제목("핵심 흐름") + 좌측 악센트 바 4px + `core-flow-pipeline` 전체. 옵션 A와 동일하게 파이프라인 **내부**에는 카드 스타일 중복 적용하지 않음.

---

## 3. 비주얼

### 3.1 상단 KPI 타일 (옵션 B와 동일)

- **클래스·토큰**: `mg-v2-ad-b0kla__kpi-card` 등 옵션 B와 동일한 토큰 사용.
- **타일 구성**: 아이콘(선택) + 숫자(24px, fontWeight 600) + 라벨(12px). 숫자 색 `var(--ad-b0kla-title-color)`, 라벨 `var(--ad-b0kla-text-secondary)`.
- **카드 스타일**: 배경 `var(--ad-b0kla-card-bg)`, 테두리 1px `var(--ad-b0kla-border)`, border-radius `var(--ad-b0kla-radius)` 또는 16px. 좌측 세로 악센트(4px)는 타일별 의미에 따라 주조/보조/포인트 색 선택 적용.
- **참조**: `ADMIN_DASHBOARD_METRICS_VISUALIZATION_SPEC.md` 5.3절(옵션 B), `AdminDashboardB0KlA.css` 내 `mg-v2-ad-b0kla__kpi-*`.

### 3.2 하단 섹션 카드

- **래퍼**: `mg-v2-ad-b0kla__card` 또는 `mg-v2-content-card`. 배경 `var(--mg-color-surface-main)` / `var(--ad-b0kla-card-bg)`, 테두리 1px `var(--ad-b0kla-border)`, border-radius 16px(`var(--ad-b0kla-radius)`).
- **섹션 제목**: 왼쪽 **세로 악센트 바** 4px, 색 `var(--mg-color-primary-main)` 또는 `var(--ad-b0kla-green)`, radius 2px. 제목 텍스트 16px, 600, `var(--ad-b0kla-title-color)`.
- **파이프라인 내부**: 옵션 A 스펙과 동일. `core-flow-pipeline`에는 카드 배경/테두리/그림자 중복 적용하지 않음. 단계 카드·커넥터·배지 스타일은 `ADMIN_DASHBOARD_METRICS_OPTION_A_SPEC.md` 및 `ADMIN_DASHBOARD_PIPELINE_MARKUP_SPEC.md` 준수.

### 3.3 요약

| 구역 | 비주얼 요약 |
|------|-------------|
| 상단 KPI 그리드 | 옵션 B와 동일 — `mg-v2-ad-b0kla__kpi-card`, 숫자 24px/600, 라벨 12px, 좌측 악센트 4px 선택 |
| 하단 섹션 | 1개 카드 래퍼 + 제목에 좌측 악센트 바 4px + CoreFlowPipeline(옵션 A 비주얼) |

---

## 4. 지표 중복 정책

옵션 C에서는 **동일 지표**(예: 매칭 건수, 입금 대기 건수)가 상단 KPI 타일과 하단 파이프라인 단계 배지에 **둘 다** 나올 수 있다. 아래 정책 중 하나로 팀 내 통일한다.

### 4.1 정책 옵션

| 정책 | 설명 | 권장 상황 |
|------|------|-----------|
| **동일 표시** | 상단 타일과 하단 파이프라인 배지에 **같은 숫자**를 그대로 표시. 예: 상단 "매칭됨 5건", 하단 1단계 배지 "5건 매칭됨". | 일관성·단순함 우선. 사용자가 위아래에서 같은 수치를 확인할 수 있음. |
| **상단만 숫자, 하단은 흐름만** | 상단 타일에는 **숫자+라벨** 표시. 하단 파이프라인 배지는 **숫자 생략 또는 "—"** 로 두고, 단계명·상태 라벨만 강조(흐름 맥락만 표시). | 중복을 줄이고, 상단에서만 수치를 읽고 하단에서는 "어디서 무엇이 진행 중인지"만 보여주고 싶을 때. |
| **상단 요약·하단 상세** | 상단은 3~4개 **요약 지표만**(총 사용자, 예약 건수, 완료율 등). 하단 파이프라인에는 5단계별 **상세 건수**만 표시. 지표 종류를 겹치지 않게 나눔. | 지표 종류를 완전히 분리해 중복을 없애는 방식. |

### 4.2 권장 (스펙 기본값)

- **기본 권장**: **동일 표시**. 같은 데이터 소스(stats)를 사용해 상단 타일과 하단 배지에 동일 숫자를 노출. 구현 단순, 사용자 인지 부담 적음.
- **대안**: "상단만 숫자, 하단은 흐름만"을 선택할 경우, 하단 배지에는 `value`를 비우거나 "—"로 두고 `label`만 표시하도록 스펙에 명시. 코더가 조건부 렌더링 시 이 정책을 따르도록 한다.

### 4.3 스펙 명시 사항

- 선택한 정책을 **문서(본 스펙 또는 팀 위키)에 명시**하고, 코더는 그에 따라 상단/하단 데이터 매핑과 표시 여부를 구현한다.
- 접근성: 동일 표시일 때 스크린 리더가 같은 수치를 두 번 읽을 수 있음. `ADMIN_DASHBOARD_METRICS_A11Y_SPEC.md`의 배지·KPI `aria-label` 규칙을 따르면, 문맥(상단 "요약", 하단 "1단계 매칭" 등)으로 구분 가능하다.

---

## 5. 반응형

`RESPONSIVE_LAYOUT_SPEC.md` 브레이크포인트 준수: **1280px(데스크톱), 768px(태블릿), 375px(모바일)**.

### 5.1 상단 KPI 그리드

| 브레이크포인트 | 동작 |
|----------------|------|
| **1280px 이상** | 3~5열 그리드. 지표 개수에 따라 열 수 조정. gap 20~24px, 패딩 24px. |
| **768px ~ 1279px** | 2열 그리드. gap 16px, 패딩 20px. |
| **375px ~ 767px** | 1열 세로 쌓기 **또는** 가로 스크롤 1행. 1열이면 gap 12px, 패딩 16px. 가로 스크롤이면 `overflow-x: auto`, 타일 min-width 유지(예: 160~200px). |

### 5.2 하단 파이프라인

| 브레이크포인트 | 동작 |
|----------------|------|
| **1280px 이상** | 5단계 한 줄 가로, 중앙 정렬. 가로 스크롤 없음(필요 시만 auto). `ADMIN_DASHBOARD_METRICS_OPTION_A_SPEC.md` 3.1절과 동일. |
| **768px ~ 1279px** | 5단계 한 줄 가로, `core-flow-pipeline__steps`에 `overflow-x: auto`. 단계 카드 min-width 140px, gap 16px. |
| **375px ~ 767px** | 5단계 한 줄 가로, 가로 스크롤 필수. `overflow-x: auto`, `-webkit-overflow-scrolling: touch`. 단계 카드 min-width 140px, gap 12~16px, steps 좌우 패딩 16px. |

### 5.3 상단↔하단 간격 (breakpoint별)

| 브레이크포인트 | 상단 그리드 ~ 하단 파이프라인 gap |
|----------------|-----------------------------------|
| 1280px+ | 24px |
| 768px ~ 1279px | 20px |
| &lt; 768px | 16px |

### 5.4 요약 표

| 구간 | 상단 그리드 | 하단 파이프라인 |
|------|-------------|-----------------|
| **1280px+** | 3~5열, gap 20~24px | 1행 가로, 중앙 정렬, 스크롤 필요 시만 |
| **768~1279px** | 2열, gap 16px | 1행 가로, overflow-x: auto |
| **375~767px** | 1열 또는 가로 스크롤, gap 12~16px | 1행 가로, overflow-x: auto, steps 패딩 16px |

---

## 6. 참조 문서

| 문서 | 용도 |
|------|------|
| `docs/design-system/v2/ADMIN_DASHBOARD_METRICS_VISUALIZATION_SPEC.md` | 옵션 C 개요, 5.4절 |
| `docs/design-system/v2/ADMIN_DASHBOARD_METRICS_OPTION_A_SPEC.md` | 파이프라인 비주얼·overflow·로딩/에러 |
| `docs/design-system/v2/ADMIN_DASHBOARD_PIPELINE_MARKUP_SPEC.md` | 파이프라인 마크업·접근성 |
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | B0KlA 팔레트·섹션 블록·악센트 바 |
| `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` | 브레이크포인트·패딩·그리드 |
| `frontend/src/styles/dashboard-tokens-extension.css` | `--ad-b0kla-*` |
| `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` | `mg-v2-ad-b0kla__kpi-card`, `mg-v2-ad-b0kla__section-title` 등 |

---

**요약**: 옵션 C는 (1) 상단 KPI 타일 그리드(옵션 B와 동일 토큰·클래스) + (2) 하단 별도 섹션 블록(제목 "핵심 흐름" + 좌측 악센트 4px + 5단계 파이프라인)으로 구성한다. 레이아웃(열 수, 간격, 제목 위치·스타일), 비주얼(상단 `mg-v2-ad-b0kla__kpi-card`, 하단 카드+악센트 바), 지표 중복 정책(동일 표시 권장), 반응형(1280/768/375px에서 상단 그리드·하단 파이프라인 각각 동작)을 정리했다. 코드는 작성하지 않으며 스펙만 산출한다.
