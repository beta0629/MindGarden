# 어드민 대시보드 V2 — 단계별 현황 도넛 차트 색상 스펙

**대상**: Admin Dashboard V2 단계별 현황 도넛 차트(Chart.js Doughnut)  
**목적**: Canvas 기반 차트에 B0KlA 팔레트를 hex로 명시하여, CSS 변수 미해석으로 인한 검정 표시 문제를 방지  
**참조**: B0KlA fallback — `ContentKpiRow.css`, `AdminMetricsVisualization.css`, `MappingKpiSection.css`

---

## 1. 원칙: Canvas/Chart.js에는 hex(또는 rgb) 사용

- **Chart.js(Canvas)**는 `var(--ad-b0kla-green)` 등 **CSS 변수를 해석하지 못함** → 세그먼트가 검정으로만 렌더됨.
- 도넛·막대·라인 등 **Canvas 기반 차트**에는 반드시 **hex 또는 rgb 문자열**을 전달한다.
- CSS에서는 계속 `var(--ad-b0kla-*)`를 사용하고, **차트 데이터(backgroundColor, borderColor 등)에만** 아래 hex 값을 사용한다.

---

## 2. 5단계 세그먼트별 색상 정의 (B0KlA 일치)

| 순서 | 단계 라벨     | 용도   | Hex     | CSS 변수(참고)              |
|------|----------------|--------|---------|-----------------------------|
| 1    | 매칭           | Green  | `#4b745c` | `var(--ad-b0kla-green)`     |
| 2    | 입금 확인      | Orange | `#e8a87c` | `var(--ad-b0kla-orange)`    |
| 3    | 회기 권한      | Green  | `#4b745c` | `var(--ad-b0kla-green)`     |
| 4    | 스케줄 등록    | Blue   | `#6d9dc5` | `var(--ad-b0kla-blue)`      |
| 5    | 회계처리       | Gray   | `#64748b` | `var(--ad-b0kla-text-secondary)` |

- **회계처리(Gray)** 대안: `#4a5568` (더 진한 보조 텍스트). 프로젝트에서 text-secondary fallback으로 `#64748b` / `#4a5568` 둘 다 사용 중이므로, 기본값은 `#64748b`, 필요 시 `#4a5568`로 통일 가능.

---

## 3. 구현 시 참고 (코더용)

- **라벨 배열** (표준 표기): `['매칭', '입금 확인', '회기 권한', '스케줄 등록', '회계처리']`
- **색상 배열(hex)** — Chart.js `backgroundColor` 등에 그대로 전달:
  ```js
  ['#4b745c', '#e8a87c', '#4b745c', '#6d9dc5', '#64748b']
  ```
- 상수명 예: `STEP_CHART_COLORS_HEX` 또는 기존 `STEP_CHART_COLORS`를 위 hex 배열로 교체. **CSS 변수 문자열은 사용하지 않는다.**

---

## 4. 관련 문서

- `docs/design-system/PENCIL_DESIGN_GUIDE.md` — B0KlA 팔레트·토큰
- `frontend/src/components/dashboard-v2/content/ContentKpiRow.css` — B0KlA 악센트 hex fallback
- `frontend/src/components/admin/AdminDashboard/organisms/AdminMetricsVisualization.css` — 그리드 타일 색상 fallback
