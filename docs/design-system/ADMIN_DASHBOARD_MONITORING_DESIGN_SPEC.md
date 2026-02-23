# 관리자 대시보드 모니터링 섹션 디자인 스펙

**버전**: 1.0.0  
**최종 업데이트**: 2026-02-24  
**기준**: 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample) / B0KlA·mg-* 토큰 / 아토믹 디자인  
**대상**: AI 및 보안 모니터링, 시스템 모니터링 두 섹션

---

## 1. 개요

관리자 대시보드의 다음 두 Organism 섹션에 대한 **UI/UX·레이아웃·비주얼** 설계 스펙입니다.  
core-coder는 이 스펙만으로 **추측 없이** 동일 비주얼을 구현할 수 있어야 합니다.

| 섹션 | 내용 |
|------|------|
| **AI 및 보안 모니터링** | 긴급/높음 KPI, 이상 탐지, 보안 위협, 감사 로그, AI 호출/예산 |
| **시스템 모니터링** | 스케줄러 실행, CPU/메모리/JVM, AI 호출·비용 |

- **단일 소스**: `unified-design-tokens.css`, `dashboard-tokens-extension.css`, `mindgarden-design-system.css`, B0KlA·mg-* 클래스만 사용.
- **참조 구현(구조만)**: `AdminDashboardMonitoring.js`, `DashboardSection.js/css`, AIMonitoringWidget, SecurityAuditWidget, SchedulerStatusWidget, SystemMetricsWidget, AIUsageWidget.

---

## 2. 레이아웃 스펙

### 2.1 전체 구조

- 각 섹션은 **하나의 `DashboardSection`(Organism)** 으로 래핑.
- 섹션 내부는 **단일 그리드 컨테이너**로 위젯(카드) 배치.
- 섹션과 섹션 사이 **세로 간격**: `var(--mg-spacing-xl)` (또는 `margin-bottom` on section).

### 2.2 그리드 배치

| 섹션 | 데스크톱(≥1025px) | 태블릿(769px~1024px) | 모바일(≤768px) |
|------|-------------------|----------------------|----------------|
| **AI 및 보안 모니터링** | 2열 (`mg-grid--cols-2`) | 2열 유지 | 1열 |
| **시스템 모니터링** | 3열 (`mg-grid--cols-3`) | 2열 | 1열 |

- **그리드 클래스**: `mg-grid mg-grid--cols-2`, `mg-grid mg-grid--cols-3`.
- **그리드 gap**:  
  - 2열: `var(--mg-grid-gap-md)` 또는 `var(--mg-spacing-md)`.  
  - 3열: `var(--mg-grid-gap-lg)` 또는 `var(--mg-spacing-lg)`.
- **반응형**:  
  - 1024px 이하에서 3열 → 2열 전환 (`grid-template-columns: repeat(2, 1fr)`).  
  - 768px 이하에서 모든 섹션 1열 (`grid-template-columns: 1fr`).

### 2.3 섹션 헤더 구조

- **컨테이너**: `mg-dashboard-section-header` (flex, space-between, flex-wrap, 하단 1px 구분선).
- **좌측**: `mg-dashboard-section-title-wrap` (flex, align-center, gap `var(--mg-spacing-md)`).
  - **아이콘**: `mg-dashboard-section-icon` (색상 `var(--ad-b0kla-icon-color)`, font-size `var(--font-size-xl)`).
  - **제목**: `mg-dashboard-section-title` (h2, `var(--font-size-xl)`, `var(--font-weight-semibold)`, `var(--ad-b0kla-title-color)`).
  - **서브타이틀**: `mg-dashboard-section-subtitle` (p, `var(--font-size-sm)`, `var(--ad-b0kla-text-secondary)`).
- **우측(선택)**: `mg-dashboard-section-actions` (버튼·링크 등). gap `var(--mg-spacing-sm)`.
- **헤더 하단 여백**: `margin-bottom: var(--mg-spacing-lg)`; 패딩/구분선: `padding-bottom: var(--mg-spacing-md)`, `border-bottom: 1px solid var(--ad-b0kla-border)`.

### 2.4 카드/위젯 간 간격·여백 원칙

- **섹션 카드(래퍼)**: `mg-dashboard-section--card` — padding `var(--mg-spacing-xl)`, margin-bottom `var(--mg-spacing-xl)`.
- **섹션 본문**: `mg-dashboard-section-content` — 그리드만 자식으로 두고, 그리드 gap으로 카드 간 간격 통일.
- **위젯(카드) 내부**: 기존 `mg-card__header`, `mg-card__body`, `mg-stats-grid` 등 사용 시 `var(--mg-spacing-md)`, `var(--mg-spacing-sm)`으로 내부 여백 유지.
- **모니터링 그리드 보조 클래스**: `mg-monitoring-section-grid` (필요 시 gap 오버라이드용. 기본은 그리드 gap으로 충분).

---

## 3. 컴포넌트 구성 (아토믹)

### 3.1 Organism

- **AI 및 보안 모니터링**: `DashboardSection` + 2열 그리드 → 자식으로 `AIMonitoringWidget`, `SecurityAuditWidget`.
- **시스템 모니터링**: `DashboardSection` + 3열 그리드 → 자식으로 `SchedulerStatusWidget`, `SystemMetricsWidget`, `AIUsageWidget`.

클래스: `mg-dashboard-section mg-dashboard-section--card`, 내부 `mg-dashboard-section-header`, `mg-dashboard-section-content`, 그리드 `mg-grid mg-grid--cols-* mg-monitoring-section-grid`.

### 3.2 Molecule / Atom 단위 (위젯 내부)

아래는 위젯에서 **재사용할 Molecule/Atom** 클래스 규칙. 기존 `WIDGET_CONSTANTS.CSS_CLASSES` 및 `mg-*` 네이밍과 동일하게 유지.

| 용도 | 클래스/패턴 | 비고 |
|------|-------------|------|
| 위젯 루트 카드 | `mg-widget mg-widget--{type} mg-card mg-card--elevated` | BaseWidget 루트 |
| 위젯 헤더 | `mg-widget__header mg-card__header`, `mg-card__header mg-flex mg-align-center mg-gap-sm` | 제목 + 액션 |
| 위젯 본문 | `mg-widget__content`, `mg-card__body` | |
| KPI/통계 그리드 | `mg-stats-grid` | 3열 등 |
| KPI 카드 한 칸 | `mg-stats-card`, `mg-stats-card--error` / `--warning` / `--info` | 좌측 악센트(아이콘) + 값 + 라벨 |
| KPI 값 | `mg-stats-card__value` | 숫자 강조 (24px, semibold) |
| KPI 라벨 | `mg-stats-card__label` | 12px, 보조 텍스트 색 |
| 리스트 블록 | `mg-card`, `mg-card__header`, `mg-card__body` | 이상 탐지/보안 위협/감사 로그 목록 |
| 리스트 | `mg-list mg-list--divided`, `mg-list__item` | |
| 배지(심각도) | `mg-badge mg-badge--sm`, `mg-badge--error` / `--warning` / `--info` / `--success` | 긴급/높음/중간/낮음 |
| 텍스트 버튼(전체보기 등) | `mg-button mg-button--sm mg-button--text` | |
| 프로그레스 바 컨테이너 | `mg-progress-bar` (또는 프로젝트 progress 컴포넌트 클래스) | |
| 프로그레스 바 채움 | `mg-progress-bar__fill--success` / `--warning` / `--error` | CPU/메모리 등 |
| 빈 상태 | `mg-empty-state`, `mg-text-muted` | |
| 유틸 | `mg-flex`, `mg-gap-sm`, `mg-mb-md`, `mg-mt-md`, `mg-text-body`, `mg-font-medium`, `mg-text-lg`, `mg-font-bold` | |

### 3.3 클래스명 규칙 요약

- **섹션**: `mg-dashboard-section`, `mg-dashboard-section--card`, `mg-dashboard-section-header`, `mg-dashboard-section-title`, `mg-dashboard-section-subtitle`, `mg-dashboard-section-icon`, `mg-dashboard-section-actions`, `mg-dashboard-section-content`.
- **그리드**: `mg-grid`, `mg-grid--cols-2`, `mg-grid--cols-3`, `mg-monitoring-section-grid`.
- **위젯/카드**: `mg-widget`, `mg-card`, `mg-card__header`, `mg-card__body`, `mg-stats-grid`, `mg-stats-card`, `mg-list`, `mg-badge`, `mg-button`, `mg-progress-bar` 등 기존 `mg-*` 패턴 유지.

---

## 4. 비주얼·토큰

### 4.1 섹션·카드

| 용도 | CSS 변수/토큰 |
|------|----------------|
| 섹션(카드) 배경 | `var(--ad-b0kla-card-bg)` 또는 `var(--mg-white)` |
| 섹션 테두리 | `var(--ad-b0kla-border)` |
| 섹션 모서리 | `var(--ad-b0kla-radius)` 또는 `var(--border-radius-lg)` |
| 섹션 그림자 | `var(--ad-b0kla-shadow)` |
| 패딩 | `var(--mg-spacing-xl)` (섹션), `var(--mg-spacing-md)` (헤더/내부) |

### 4.2 타이포·색상

| 용도 | 토큰 |
|------|------|
| 제목 | `var(--ad-b0kla-title-color)`, `var(--font-size-xl)`, `var(--font-weight-semibold)` |
| 서브타이틀/보조 텍스트 | `var(--ad-b0kla-text-secondary)`, `var(--font-size-sm)` |
| 아이콘(헤더) | `var(--ad-b0kla-icon-color)` |
| 본문 | `var(--mg-text-primary)` 또는 `var(--mg-gray-800)` |
| Muted | `var(--mg-text-secondary)` 또는 `var(--ad-b0kla-text-secondary)` |

### 4.3 KPI·경고(긴급/높음)·프로그레스 시각적 위계

- **KPI 숫자(메트릭 값)**  
  - `mg-stats-card__value`: `var(--font-size-2xl)` 또는 24px, `var(--font-weight-semibold)`, `var(--ad-b0kla-title-color)`.
- **KPI 라벨**  
  - `mg-stats-card__label`: `var(--font-size-xs)` (12px), `var(--ad-b0kla-text-secondary)`.
- **심각도 배지**  
  - 긴급(CRITICAL): `mg-badge--error` → `var(--mg-error-500)` / `var(--ad-b0kla-danger)` 계열.  
  - 높음(HIGH): `mg-badge--warning` → `var(--mg-warning-500)` / `var(--ad-b0kla-orange)` 계열.  
  - 중간(MEDIUM): `mg-badge--info` → `var(--mg-primary-*)` / `var(--ad-b0kla-blue)` 계열.  
  - 낮음(LOW): `mg-badge--success` → `var(--ad-b0kla-green)` 계열.
- **KPI 카드 좌측 악센트**  
  - `mg-stats-card--error`: 왼쪽 4px 세로 바(또는 아이콘 영역) `var(--mg-error-500)`.  
  - `mg-stats-card--warning`: `var(--mg-warning-500)`.  
  - `mg-stats-card--info`: `var(--ad-b0kla-blue)`.
- **프로그레스 바**  
  - 정상: `mg-progress-bar__fill--success` → 녹색 계열 `var(--ad-b0kla-green)` / `var(--mg-success-500)`.  
  - 주의(예: 75% 이상): `mg-progress-bar__fill--warning` → `var(--ad-b0kla-orange)` / `var(--mg-warning-500)`.  
  - 위험(예: 90% 이상): `mg-progress-bar__fill--error` → `var(--ad-b0kla-danger)` / `var(--mg-error-500)`.
- **메트릭 숫자 색(CPU/메모리 등)**  
  - 기존 유틸 클래스: `mg-text-success`, `mg-text-warning`, `mg-text-error` (같은 임계값 75%/90% 등 적용).

### 4.4 간격·그리드

- `var(--mg-spacing-xs)`, `var(--mg-spacing-sm)`, `var(--mg-spacing-md)`, `var(--mg-spacing-lg)`, `var(--mg-spacing-xl)`.
- 그리드 gap: `var(--mg-grid-gap-md)`, `var(--mg-grid-gap-lg)` (또는 `var(--spacing-md)`, `var(--spacing-lg)`).

---

## 5. 창의적 변경 제안

아래는 **한눈에 보이도록** 개선할 때 적용할 수 있는 구체적 제안입니다. 구현 시 우선순위는 팀 정책에 따릅니다.

### 5.1 KPI 상단 배치

- **AI 및 보안 모니터링**: 위젯 내부에서 **긴급/높음/O늘 AI 호출** 등 KPI를 **카드 최상단**에 `mg-stats-grid`로 배치. (이미 AIMonitoringWidget에서 사용 중 — 유지 권장.)
- **시스템 모니터링**: 각 위젯에서 **핵심 숫자 1~2개**(예: 스케줄러 성공률, CPU%, 오늘 AI 비용)를 위쪽에 크게 두고, 세부 목록/차트는 아래로 배치.

### 5.2 카드 비대칭/2단 배치

- **AI 및 보안**: 2열이지만, “AI 모니터링”을 **약 60% 너비**, “보안 감사 로그”를 **약 40%** 로 비대칭 배치하는 옵션. (예: `grid-template-columns: 1.5fr 1fr`.)  
  - 모바일에서는 1열로 동일.
- **시스템 모니터링**: “시스템 메트릭”(CPU/메모리/JVM)을 **2열 차지**, “스케줄러”와 “AI 사용량”을 각각 1열로 나란히 두는 **2+1 레이아웃** 옵션.  
  - 예: `grid-template-columns: 1fr 1fr;` + 시스템 메트릭만 `grid-column: span 2`.

### 5.3 섹션 헤더 액션

- 각 섹션 헤더 우측에 **“전체 모니터링 보기”** 같은 단일 링크/버튼(`mg-dashboard-section-actions`)을 두어, 해당 모니터링 전용 페이지로 이동하게 하면 탐색이 명확해짐.

### 5.4 시각적 위계 강화

- **긴급/높음** KPI 카드는 **좌측 악센트 바**(4px, 주조/에러/경고 색) + 아이콘으로 구분해, 스캔 시 먼저 눈에 들어오도록 유지.
- 위젯 카드에 **호버 시** `var(--ad-b0kla-shadow-hover)` 적용해 깊이감을 주면 “클릭 가능/포커스 가능” 영역이 분명해짐.

---

## 6. 체크리스트 (core-coder 구현 시)

- [ ] 두 섹션 모두 `DashboardSection` + `mg-dashboard-section--card` 사용.
- [ ] 그리드: AI/보안 2열, 시스템 3열; 1024px 이하 3→2열, 768px 이하 1열.
- [ ] 섹션 헤더: 아이콘 + 제목 + 서브타이틀 + (선택) 액션; 토큰 `--ad-b0kla-*`, `--mg-spacing-*` 사용.
- [ ] 위젯 내부: `mg-stats-grid`, `mg-stats-card`, `mg-card`, `mg-list`, `mg-badge`, `mg-progress-bar` 등 기존 `mg-*` 클래스만 사용.
- [ ] KPI/경고/프로그레스 색상: `mg-badge--error`/`--warning`/`--info`/`--success`, `mg-progress-bar__fill--*`, `mg-text-error`/`mg-text-warning`/`mg-text-success`로 위계 유지.
- [ ] 색·간격·radius는 `unified-design-tokens.css`, `dashboard-tokens-extension.css`의 `--mg-*`, `--ad-b0kla-*` 만 사용 (하드코딩 금지).

---

**문서 끝.**  
구현 시 `frontend/src/components/admin/AdminDashboard/AdminDashboardMonitoring.js`, `DashboardSection.css`, 위젯 컴포넌트 및 `unified-design-tokens.css`·`dashboard-tokens-extension.css`를 함께 참고하면 됩니다.
