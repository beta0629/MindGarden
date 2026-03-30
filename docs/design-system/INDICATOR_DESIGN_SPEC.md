# 인디케이터(Indicator) 전역 디자인 스펙

MindGarden 프로젝트에서 **인디케이터를 하나의 디자인 시스템으로 통일**하기 위한 스펙. 코더는 이 문서의 클래스명·토큰·크기만 보고 구현 가능하도록 구체적으로 기술한다.

**참조**
- 어드민 대시보드 샘플: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample
- 표준 인디케이터: `frontend/src/styles/mindgarden-design-system.css` (612~758행)
- 로딩 컴포넌트: `frontend/src/styles/06-components/_base/_loading.css`
- 디자인 토큰: `frontend/src/styles/unified-design-tokens.css`
- 모달·간격 스타일 참고: `docs/design-system/MODAL_BUTTON_AND_SPACING_SPEC.md`

---

## 1. 공통 원칙

### 1.1 사용할 CSS 변수

인디케이터 구현 시 **하드코딩된 색·간격·radius 금지**. 아래 토큰만 사용한다.

| 용도 | CSS 변수 | 비고 |
|------|----------|------|
| 주조색 | `var(--mg-primary-500)` | active, primary 스피너 등 |
| 성공/가능 | `var(--mg-success-500)` 또는 `var(--cs-success-500)` | available, active 상태 |
| 경고/대기 | `var(--mg-warning-500)` 또는 `var(--cs-warning-500)` | pending, busy |
| 오류/불가 | `var(--mg-error-500)` 또는 `var(--cs-error-500)` | error, booked, unavailable |
| 중립/비활성 | `var(--cs-secondary-200)`, `var(--cs-secondary-500)`, `var(--cs-secondary-700)` | inactive, 배경, 텍스트 |
| 간격 | `var(--spacing-xs)` (0.5rem), `var(--spacing-sm)` (1rem), `var(--spacing-md)` (1.5rem), `var(--spacing-lg)` (2rem) | gap, padding, margin |
| 모서리 | `var(--border-radius-full)` (50% 또는 9999px), `var(--border-radius-sm)` (0.25rem), `var(--border-radius-md)` (0.375rem) | 원형·pill·카드 |
| 타이포 | `var(--font-size-xs)` (0.75rem), `var(--font-weight-semibold)` (600) | 라벨·뱃지 |

### 1.2 클래스명 규칙

- **접두사**: 모든 인디케이터 공통 클래스는 `mg-` 로 시작.
- **BEM 스타일**: 블록__요소, 블록--수정자.
  - 예: `mg-step-indicator`, `mg-step-indicator__step`, `mg-step-indicator__step--active`, `mg-status-indicator--error`.

### 1.3 단일 소스

- 색·간격·radius는 `unified-design-tokens.css` 및 `mindgarden-design-system.css`에 정의된 변수만 사용. 이외 임의 값 사용 금지.

---

## 2. 유형별 스펙

### 2.1 Step Indicator (단계 인디케이터)

**용도**: 스케줄 모달, 공통코드 관리 등 다단계 플로우의 현재 단계 표시.

| 요소 | 클래스명 | 스펙 |
|------|----------|------|
| 컨테이너 | `mg-step-indicator` | 배경 `var(--color-bg-primary)` 또는 `#FAF9F7`, 테두리 `1px solid var(--color-border-secondary)`, `border-radius: var(--border-radius-md)`, 패딩 `var(--spacing-lg)`, 하단 `margin-bottom: var(--spacing-lg)`. |
| 스텝 목록 래퍼 | `mg-step-indicator__steps` | `display: flex; align-items: center; justify-content: space-between; position: relative; margin-bottom: var(--spacing-md)`. |
| 단일 스텝 | `mg-step-indicator__step` | `display: flex; flex-direction: column; align-items: center; flex: 1; position: relative`. |
| 스텝 원(아이콘) | `mg-step-indicator__step-icon` | 크기 **40px × 40px**, `border-radius: var(--border-radius-full)`, `border: 2px solid`, 하단 `margin-bottom: var(--spacing-sm)`, `z-index: 2`. |
| 스텝 원 — 활성 | `mg-step-indicator__step-icon--active` | 배경·테두리 `var(--mg-primary-500)`, 텍스트 `var(--mg-white)` 또는 `color-text-inverse`. |
| 스텝 원 — 비활성 | `mg-step-indicator__step-icon--inactive` | 배경 `var(--color-bg-accent)` 또는 `var(--cs-secondary-200)`, 텍스트 `var(--color-text-muted)` 또는 `var(--cs-secondary-500)`, 테두리 동일. |
| 스텝 제목 | `mg-step-indicator__title` | `font-size: var(--font-size-xs)`, `font-weight: var(--font-weight-medium)`, 텍스트 중앙. |
| 스텝 제목 — 활성/비활성 | `mg-step-indicator__title--active` / `--inactive` | active: `color: var(--mg-primary-500)`, `font-weight: var(--font-weight-semibold)`. inactive: `color: var(--color-text-muted)`. |
| 연결선 | `mg-step-indicator__line` | `position: absolute`, 높이 **2px**, top 기준 스텝 아이콘 중앙(예: 20px). 좌우는 스텝 간 연결 영역. |
| 연결선 — 활성/비활성 | `mg-step-indicator__line--active` / `--inactive` | active: `background-color: var(--mg-primary-500)`. inactive: `background-color: var(--color-border-secondary)`. |
| 진행률 바 트랙 | `mg-step-indicator__progress` | 높이 **4px**, 배경 `var(--color-bg-accent)`, `border-radius: var(--border-radius-sm)`, `overflow: hidden`. |
| 진행률 바 채움 | `mg-step-indicator__progress-fill` | 높이 100%, 배경 `var(--mg-primary-500)`, `border-radius: var(--border-radius-sm)`, `transition: width 0.3s ease`. |

**기존 StepIndicator 컴포넌트가 따를 클래스 매핑**

- `step-indicator-container` → `mg-step-indicator`
- `step-indicator-steps` → `mg-step-indicator__steps`
- `step-indicator-step` → `mg-step-indicator__step`
- `step-indicator-icon` + `.active` / `.inactive` → `mg-step-indicator__step-icon` + `--active` / `--inactive`
- `step-indicator-title` + `.active` / `.inactive` → `mg-step-indicator__title` + `--active` / `--inactive`
- `step-indicator-line` + `.active` / `.inactive` → `mg-step-indicator__line` + `--active` / `--inactive`
- `step-indicator-progress-bar` → `mg-step-indicator__progress`
- `step-indicator-progress-fill` → `mg-step-indicator__progress-fill`

---

### 2.2 Loading Indicator (로딩 인디케이터)

**원칙**: 위드젯·인라인·풀스크린 모두 **전역 클래스만 사용**. 위드젯별 커스텀 `.loading-indicator` 제거.

| 요소 | 클래스명 | 스펙 |
|------|----------|------|
| 컨테이너 | `mg-loading-container` | `display: flex; align-items: center; justify-content: center`. |
| 변형 | `mg-loading-container--inline` | `display: inline-flex`, 패딩 `var(--spacing-xs)`. |
| 변형 | `mg-loading-container--centered` | 영역 가득 채워 중앙 정렬 (min-height 필요 시 200px). |
| 변형 | `mg-loading-container--fullscreen` | `position: fixed; inset: 0`, 반투명 배경, `z-index: 9999`. |
| 콘텐츠 래퍼 | `mg-loading-content` | `flex-direction: column`, `gap: var(--spacing-sm)`. |
| 스피너 | `mg-loading-spinner` | 원형 border 스피너. **기본**: 24px × 24px, border 3px, 배경 ring `var(--cs-secondary-200)`, 상단 색 `var(--mg-primary-500)`, `border-radius: 50%`, 애니메이션 `mg-spin`. |
| 스피너 크기 | `mg-loading-spinner--small` | 16px × 16px, border 2px. |
| 스피너 크기 | `mg-loading-spinner--large` | 32px × 32px, border 4px. |
| 도트 로딩 | `mg-loading-dots` | `display: flex`, `gap: var(--spacing-xs)`. |
| 도트 한 개 | `mg-loading-dot` | **8px × 8px**, `background: var(--mg-primary-500)`, `border-radius: 50%`, 바운스 애니메이션. |

**색상**: 기본 primary (`var(--mg-primary-500)`). 특수 요청이 없으면 변경하지 않음.

**위드젯**: PerformanceWidget, ApiPerformanceWidget, SecurityMonitoringWidget 등에서는 `.loading-indicator` + 커스텀 스피너 제거 후, `mg-loading-container` + `mg-loading-spinner`(또는 `mg-loading-dots`) + 필요 시 `mg-loading-text` 사용.

---

### 2.3 Status Indicator (상태 인디케이터)

**두 가지 패턴**을 구분한다.

#### A. 도트만 (availability, unread, 시스템 상태 점 등)

| 요소 | 클래스명 | 스펙 |
|------|----------|------|
| 도트 | `mg-status-dot` | 크기 **8px × 8px** 통일. `border-radius: var(--border-radius-full)`. `flex-shrink: 0`. |
| 변형 | `mg-status-dot--success` | `background-color: var(--mg-success-500)`. (available, healthy, online) |
| 변형 | `mg-status-dot--warning` | `background-color: var(--mg-warning-500)`. (pending, busy, away) |
| 변형 | `mg-status-dot--error` | `background-color: var(--mg-error-500)`. (error, unavailable, offline) |
| 변형 | `mg-status-dot--neutral` | `background-color: var(--cs-secondary-500)`. (inactive, unknown) |

**매핑**: success = active/available/healthy, warning = pending/busy, error = error/unavailable, neutral = inactive.

#### B. 뱃지 + 도트 (라벨과 함께 쓰는 상태 뱃지)

| 요소 | 클래스명 | 스펙 |
|------|----------|------|
| 뱃지 | `mg-status-indicator` | `display: inline-flex; align-items: center; gap: var(--spacing-xs)`, 패딩 `var(--spacing-xs) var(--spacing-sm)`, `border-radius: var(--border-radius-full)`, `font-size: var(--font-size-xs)`, `font-weight: var(--font-weight-semibold)`. |
| 뱃지 내 도트 | `mg-status-indicator::before` | `content: ''`, **8px × 8px**, `border-radius: 50%`, `background-color: currentColor`. |
| 변형 | `mg-status-indicator--active` | 배경 `var(--cs-success-100)`, 색 `var(--cs-success-700)`. |
| 변형 | `mg-status-indicator--inactive` | 배경 `var(--cs-secondary-100)`, 색 `var(--cs-secondary-700)`. |
| 변형 | `mg-status-indicator--pending` | 배경 `var(--cs-warning-100)`, 색 `var(--cs-warning-700)`. |
| 변형 | `mg-status-indicator--error` | 배경 `var(--cs-error-100)`, 색 `var(--cs-error-700)`. |

SystemStatus의 `.status-indicator` + `.status-dot[data-status]`는 점만 쓰면 `mg-status-dot--success/warning/error`, 뱃지 형태면 `mg-status-indicator` + 수정자로 통일 권장.

---

### 2.4 Time-slot Indicator (시간 슬롯 인디케이터)

**용도**: 예약 가능/불가 표시용 원형 아이콘.

| 요소 | 클래스명 | 스펙 |
|------|----------|------|
| 컨테이너 | `mg-time-slot-indicator` | **24px × 24px**, `border-radius: var(--border-radius-full)`, `display: flex; align-items: center; justify-content: center`, `flex-shrink: 0`, `margin-right: var(--spacing-sm)`. |
| 변형 | `mg-time-slot-indicator--available` | `background-color: var(--mg-success-500)` (또는 `var(--color-success)`). |
| 변형 | `mg-time-slot-indicator--booked` | `background-color: var(--cs-secondary-200)` 또는 `var(--color-neutral-light)`. |
| 내부 텍스트 | `mg-time-slot-indicator__text` | `color: white`, `font-size: var(--font-size-xs)`, `font-weight: var(--font-weight-semibold)` (숫자 등 표시 시). |

기존 `.time-slot-indicator`, `.time-slot-indicator--booked`, `.time-slot-indicator__text`를 위 클래스로 교체.

---

### 2.5 Selection / Availability (선택·가능 여부)

| 용도 | 클래스명 | 크기 | 스펙 |
|------|----------|------|------|
| 선택됨 표시(체크 등) | `mg-selection-indicator` | **24px × 24px** | `position: absolute` 등 레이아웃은 기존 유지. 원형 `border-radius: var(--border-radius-full)`, 배경 `var(--mg-success-500)`, 아이콘 색 흰색. |
| 가용 여부 도트 | `mg-availability-dot` 또는 `mg-status-dot` | **8px × 8px** | `mg-status-dot--success` / `--warning` / `--error` 재사용. `background: currentColor` 쓰는 경우 부모에 색 지정. |

ScheduleModal의 `.availability-indicator`(8px), `.selection-indicator`(24px)를 위와 같이 매핑.

---

### 2.6 Progress Bar (진행률 바)

이미 디자인 시스템에 정의된 것 사용.

| 요소 | 클래스명 | 스펙 |
|------|----------|------|
| 트랙 | `mg-progress` | `width: 100%`, 높이 **8px**, 배경 `var(--cs-secondary-200)`, `border-radius: var(--border-radius-full)`, `overflow: hidden`. |
| 채움 | `mg-progress__bar` | 높이 100%, 배경 `var(--mg-primary-500)`, `border-radius: var(--border-radius-full)`, `transition: width 0.3s ease`. |
| 크기 | `mg-progress--small` | 높이 4px. |
| 크기 | `mg-progress--large` | 높이 12px. |

---

## 3. 클래스명 규칙 요약

- **접두사**: `mg-`.
- **BEM**: `mg-{타입}-indicator`, `mg-{타입}-indicator__요소`, `mg-{타입}-indicator--수정자`.
- **도트 단독**: `mg-status-dot`, `mg-status-dot--success` 등.

---

## 4. 마이그레이션 가이드 (기존 → 새 클래스)

| 기존 클래스(또는 패턴) | 새 클래스 |
|------------------------|-----------|
| `.loading-indicator` (위드젯 등) | `mg-loading-container` + `mg-loading-spinner`(또는 `mg-loading-dots`) + 필요 시 `mg-loading-text` |
| `.step-indicator-container` | `mg-step-indicator` |
| `.step-indicator-steps` | `mg-step-indicator__steps` |
| `.step-indicator-step` | `mg-step-indicator__step` |
| `.step-indicator-icon.active` / `.inactive` | `mg-step-indicator__step-icon--active` / `--inactive` |
| `.step-indicator-title.active` / `.inactive` | `mg-step-indicator__title--active` / `--inactive` |
| `.step-indicator-line.active` / `.inactive` | `mg-step-indicator__line--active` / `--inactive` |
| `.step-indicator-progress-bar` | `mg-step-indicator__progress` |
| `.step-indicator-progress-fill` | `mg-step-indicator__progress-fill` |
| `.step-indicator` (CommonCodeManagement / ImprovedCommonCodeManagement) | `mg-step-indicator` + 내부 `mg-step-indicator__steps` 등 위 구조로 정리 |
| `mg-status-indicator` (기존 유지) | 그대로 사용. 수정자 `--active`, `--inactive`, `--pending`, `--error` |
| `.status-indicator` + `.status-dot[data-status]` (SystemStatus) | `mg-status-indicator` 또는 도트만 쓰면 `mg-status-dot mg-status-dot--success/warning/error` |
| `.status-dot.available` / `.busy` / `.unavailable` | `mg-status-dot--success` / `mg-status-dot--warning` / `mg-status-dot--error` |
| `.availability-indicator` (8px 도트) | `mg-availability-dot` 또는 `mg-status-dot` + `mg-status-dot--*` |
| `.selection-indicator` (24px 원) | `mg-selection-indicator` |
| `.time-slot-indicator` | `mg-time-slot-indicator mg-time-slot-indicator--available` |
| `.time-slot-indicator--booked` | `mg-time-slot-indicator--booked` |
| `.time-slot-indicator__text` | `mg-time-slot-indicator__text` (유지) |
| `.user-status-indicator`, `.user-status-indicator--online` 등 | `mg-status-dot mg-status-dot--success` 등으로 통일 가능 |

---

## 5. 예외·선택 적용 (지표/차트 성격 인디케이터)

다음은 **지표·차트·도메인 전용** 성격이 있어, **클래스명까지 통일하지 않아도 됨**. 가능하면 **색상·간격만 토큰**으로 맞추고, 기존 클래스명 유지 가능.

| 유형 | 권장 조치 |
|------|-----------|
| emotion-indicators (감정 바) | 색상: `var(--mg-*)` / `var(--cs-*)`, 간격: `var(--spacing-xs)`, `var(--spacing-sm)`. 클래스명 기존 유지 가능. |
| dropout-risk-indicator | 동일. 토큰 기반 색·간격만 적용. |
| tax-type-indicator | 동일. |
| recording-indicator, typing-indicator (채팅) | 가능하면 8px 도트는 `mg-status-dot` + 수정자로 통일. 애니메이션만 있는 경우 색상만 토큰. |
| unread-indicator | 8px 도트면 `mg-status-dot--*` 사용 권장. |
| preview-scale-indicator | 레이블/바는 `mg-progress` 사용 권장, 나머지 색·간격 토큰. |

별도 섹션으로 두고, 신규 구현 시에는 가능한 범위에서 `mg-*` 클래스와 토큰을 쓰도록 하고, 레거시는 점진적으로 맞춘다.

---

## 6. 체크리스트 (구현 후 검증)

- [ ] Step Indicator가 `mg-step-indicator` + BEM 요소/수정자만 사용하는가?
- [ ] 모든 로딩 UI가 `mg-loading-container`, `mg-loading-spinner`(또는 `mg-loading-dots`) 등 전역 클래스만 쓰는가? 위드젯 커스텀 `.loading-indicator` 제거했는가?
- [ ] 상태 도트가 8px 통일·`mg-status-dot` + `--success`/`--warning`/`--error`/`--neutral` 사용하는가?
- [ ] 시간 슬롯 표시가 `mg-time-slot-indicator`, `--available`, `--booked` 사용하는가?
- [ ] Selection 24px·Availability 8px가 각각 `mg-selection-indicator`, `mg-availability-dot`(또는 `mg-status-dot`)로 통일되었는가?
- [ ] 색·간격·radius에 하드코딩 없이 `var(--mg-*)`, `var(--cs-*)`, `var(--spacing-*)`, `var(--border-radius-*)`만 사용하는가?
- [ ] 예외 항목(emotion, dropout-risk, tax-type 등)은 색·간격만 토큰으로 맞추었는가?

---

*문서 버전: 1.0 | 적용 범위: 인디케이터 전역 통일*
