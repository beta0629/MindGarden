# 어드민 대시보드 V2 — 단계별 현황 도넛 차트 색상 스펙

**버전**: 1.0  
**상태**: 디자인/데이터 스펙 (코드 수정 없음)  
**참조**: `ADMIN_DASHBOARD_METRICS_VISUALIZATION_SPEC.md`, Chart.js Doughnut, B0KlA 토큰

---

## 1. 개요

- **대상**: AdminDashboardV2의 "단계별 현황" 도넛 차트(Chart.js Doughnut).
- **목적**: 도넛이 검정으로만 나오는 원인(CSS 변수 미해석)을 막기 위해, **데이터·마크업 구조**에서 색상을 **hex(또는 rgb) 문자열**로만 전달해야 한다는 점을 명시하고, 라벨–색상 1:1 대응표를 제안한다.

---

## 2. Chart.js 색상 요구사항 (필수)

### 2.1 backgroundColor / borderColor

- **Chart.js(Canvas)는 `data.datasets[0].backgroundColor` 및 `borderColor`에 해석 가능한 색상 문자열만 사용할 수 있다.**
- **허용**: `#RRGGBB`, `#RGB`, `rgb(r,g,b)`, `rgba(r,g,b,a)` 등 **hex 또는 rgb 형식의 문자열**.
- **비허용**: `var(--ad-b0kla-green)` 등 **CSS 변수 문자열**. Canvas 컨텍스트는 CSS 변수를 해석하지 않아 **검정(#000 또는 기본값)으로 그려진다.**

### 2.2 구현 시 권장 사항

- 디자이너가 B0KlA 5단계에 대한 **hex(또는 rgb) 색상 스펙**을 확정한 뒤, 코더는 `STEP_CHART_COLORS_HEX` 같은 **hex 문자열 배열 상수**를 두고, `data.datasets[0].backgroundColor` 및 `data.datasets[0].borderColor`에는 **반드시 해당 hex/rgb 배열(또는 배열 요소)**만 전달한다.
- CSS 변수 배열을 그대로 넘기지 않는다.

---

## 3. 라벨–색상 1:1 대응 (확인용)

현재 코드 기준 라벨 순서(`STEP_CHART_LABELS`)와, B0KlA 토큰 대응 hex 권장값이다. **배열 인덱스가 같아야** 도넛 조각과 범례가 일치한다.

| 순서(index) | 라벨 (STEP_CHART_LABELS) | 현재 CSS 변수 (참고) | 권장 hex (B0KlA 토큰 기준) |
|-------------|---------------------------|----------------------|----------------------------|
| 0 | 매칭 | `var(--ad-b0kla-green)` | `#059669` |
| 1 | 입금 확인 | `var(--ad-b0kla-orange)` | `#fb923c` |
| 2 | 회기 권한 | `var(--ad-b0kla-green)` | `#059669` |
| 3 | 스케줄 등록 | `var(--ad-b0kla-blue)` | `#60a5fa` |
| 4 | 회계처리 | `var(--ad-b0kla-text-secondary)` | `#4b5563` |

- **hex 출처**: `unified-design-tokens.css` → `--cs-success-600`, `--cs-orange-400`, `--cs-primary-400`, `--cs-secondary-600` (B0KlA는 이 토큰들을 참조).
- 디자이너가 단계별로 다른 hex를 확정하면, 위 표의 "권장 hex" 열을 스펙에 맞게 갱신하고, 코더는 그에 맞춰 `STEP_CHART_COLORS_HEX`를 수정하면 된다.

---

## 4. 데이터·마크업 구조 요약

- **labels**: `STEP_CHART_LABELS` (5개) — 유지.
- **data**: `stepValues` (5개 숫자) — 유지.
- **backgroundColor**: **hex(또는 rgb) 문자열 배열 5개** (예: `STEP_CHART_COLORS_HEX`). CSS 변수 배열 사용 금지.
- **borderColor**: 조각 테두리도 **hex/rgb 문자열** (단일 값이면 동일 적용, 배열이면 인덱스별 1:1). 카드 배경과 구분하려면 밝은 hex(예: `#ffffff` 또는 카드 배경 hex) 사용 가능.

---

## 5. 참조 문서

| 문서 | 용도 |
|------|------|
| `docs/design-system/v2/ADMIN_DASHBOARD_METRICS_VISUALIZATION_SPEC.md` | 지표 시각화·옵션 C·B0KlA 토큰 |
| `frontend/src/styles/dashboard-tokens-extension.css` | `--ad-b0kla-*` 정의 |
| `frontend/src/styles/unified-design-tokens.css` | `--cs-*` hex 값 |

---

**요약**: 도넛 차트의 `backgroundColor`/`borderColor`는 **반드시 hex 또는 rgb 문자열**로 전달하고, CSS 변수는 사용하지 않는다. 라벨 순서와 동일한 순서의 hex 배열(예: `STEP_CHART_COLORS_HEX`)을 사용하며, 디자이너 hex 스펙 확정 후 코더가 해당 상수로 반영하면 된다.
