# 어드민 대시보드 V2 KPI 영역(ContentKpiRow) 디버그 보고서

**작성일**: 2025-03-15  
**담당**: core-debugger  
**관련 DOM**: `#root` → … → `main.mg-v2-desktop-layout__main` → `div.mg-v2-content-area` → `div.mg-v2-content-kpi-row`

---

## 1. 증상 요약

- **사용자 관찰**: "총 사용자 변동 없음 9 상담사 3 · 내담자 6 변동 없음 예약된 상담 변동 없음 0 완료율 0% 45.8%" 처럼 텍스트가 한 덩어리로 나열된 것처럼 보임(카드 구분·레이아웃 깨짐 의심).
- **관련 코드**: `ContentKpiRow.js`(items map → `mg-v2-content-kpi-card`), `ContentKpiRow.css`(row: grid, card: flex, BEM), `AdminDashboardV2.js`(kpiItems, stats/todayStats 연동).

---

## 2. 시나리오 판단 (코드·구조 기준)

| 시나리오 | 해당 여부 | 근거 |
|----------|-----------|------|
| **(A) 카드가 3개로 나뉘지 않고 한 줄로 붙어 보임** | **부분 해당** | `ContentKpiRow.css`가 로드되지 않으면 `.mg-v2-content-kpi-row`에 `display: grid`가 적용되지 않아, 기본 `display: block`으로 3개 카드가 세로로 쌓일 수 있음. 그 경우에도 카드 경계는 있으나, **카드 스타일(배경·테두리·패딩)이 없으면** 시각적으로 한 덩어리처럼 보일 수 있음. |
| **(B) 스타일 미적용으로 텍스트만 나열** | **가능성 있음** | `.mg-v2-content-kpi-card`의 `display: flex`, `background`, `border`, `padding` 등이 적용되지 않으면 레이아웃·시각 구분이 사라져 “텍스트만 나열”처럼 보임. 전역 CSS에서 해당 클래스 덮어쓰기는 **확인되지 않음**(아래 3절). |
| **(C) 값이 0/비어 있음·잘못 표시(완료율 0%와 45.8% 혼재)** | **해당** | 완료율 카드: `value` = `stats.consultationStats?.completionRate != null ? \`${...}%\` : todayStats.completedToday`, `badge` = `completionRateChange`. API가 `completionRate: 0`, `completionRateChange: 45.8`을 주면 화면에 "0%"와 "+45.8%"가 함께 노출되어 “0% 45.8%”로 읽힘. 또한 `completionRate`가 null일 때 fallback이 `todayStats.completedToday`(건수)라 **완료율 카드에 건수 숫자만 나오는** 단위 혼재 가능. |
| **(D) 반응형에서 깨짐** | **추가 확인 필요** | `ContentKpiRow.css`는 `minmax(240px, 1fr)` + `auto-fit`으로 반응형 정의. 768px 이하에서 `.mg-v2-content-kpi-card__value` 폰트만 축소. 모바일 레이아웃에서 부모 overflow/폭 제약은 코드상 명시적 충돌 없음. |
| **(E) 그 외(아이콘·클릭·접근성)** | **현재 보고와 직접 연관 낮음** | 카드 클릭 핸들러는 AdminDashboardV2 KPI에는 미사용. 접근성·아이콘 이슈는 별도 검증 필요. |

**종합**: 사용자 문구 기준으로는 **(B) 스타일 미적용** 또는 **(C) 완료율 값/단위 표시 혼란**이 동시에 작용한 것으로 보는 것이 타당함. “한 덩어리”는 (B), “0% 45.8%”는 (C).

---

## 3. 원인 후보 검증

### 3.1 레이아웃

| 검증 항목 | 결과 |
|-----------|------|
| **전역 CSS 덮어쓰기** | `frontend/src/styles` 내 `.mg-v2-content-kpi-row`, `.mg-v2-content-kpi-card` 선택자 **없음**. `ContentKpiRow.css`만 해당 클래스 정의. |
| **ContentKpiRow.css 로드** | `ContentKpiRow.js`에서 `import './ContentKpiRow.css'`로 로드. AdminDashboardV2는 `content`에서 `ContentKpiRow`만 import하므로, 해당 페이지 진입 시 컴포넌트와 함께 CSS 번들에 포함됨. 빌드/캐시 이슈 시 미적용 가능성은 있음. |
| **클래스명·부모 제약** | 부모: `ContentArea` → `.mg-v2-content-area` (flex column, gap, width 100%, min-width 0). `DesktopLayout.css`에서 `.mg-v2-desktop-layout__main > *`에 `flex: 1 1 0%` 적용되며, 그 **직계 자식은 ContentArea 하나**이므로 KPI row는 ContentArea의 flex 자식. 별도 width 제한 없이 stretch되어 row가 전체 폭을 쓰는 구조라, **부모 때문에 grid가 깨질 가능성은 낮음**. |
| **반응형 충돌** | 전역 `_responsive.css`, `unified-design-tokens.css` 등에서 `.mg-v2-content-kpi-*` 직접 규칙 없음. `MappingStatsSection.css`는 `.mg-v2-content-kpi-card--clickable` 등 보조만 정의·덮어쓰기 아님. |

**레이아웃 쪽 가설**: (1) 특정 환경에서 `ContentKpiRow.css` 미적용(빌드/캐시), (2) 또는 다른 페이지/조건에서 더 높은 특이도 규칙이 있을 수 있으나, 현재 코드베이스에서는 미발견.

### 3.2 데이터(stats / todayStats / 완료율)

| 항목 | 내용 |
|------|------|
| **stats 초기값** | `consultationStats: { totalCompleted: 0, completionRate: 0, completionRateChange: null, ... }`. `loadStats`에서 `/api/v1/admin/statistics/consultation-completion` 응답으로 채움. |
| **todayStats 초기값** | `totalToday: 0, completedToday: 0, ...`. `loadTodayStats`에서 `/api/v1/schedules/today/statistics` 응답으로 채움. |
| **로딩 시점** | `loadStats`는 마운트 시 `useEffect` 및 의존 배열로 호출. `loadTodayStats`는 `loadStats` 완료 후 및 `sessionLoading` 해제 후에도 호출됨. KPI는 로딩 전 초기값으로 먼저 그려질 수 있음. |
| **완료율 value 로직** | `value: stats.consultationStats?.completionRate != null ? \`${stats.consultationStats.completionRate}%\` : todayStats.completedToday`. 따라서 `completionRate`가 `0`이면 "0%", null/undefined면 **오늘 완료 건수(숫자)**가 그대로 노출됨 → **완료율인데 건수 단위**로 보일 수 있음. |
| **완료율 badge** | `completionRateChange != null`이면 `"+45.8%"` 형태. API(`AdminController` 등)가 `completionRate: 0`, `completionRateChange: 45.8`을 줄 수 있어, **메인 값 "0%"와 배지 "45.8%"가 함께 보이는** 현상 발생. |

**데이터 쪽 결론**: (C)의 원인은 (1) 완료율 카드 value가 “비율”과 “변동률”을 동시에 노출해 혼동을 주는 것, (2) completionRate가 없을 때 건수(`completedToday`)를 그대로 넣어 단위가 섞이는 것.

---

## 4. 수정 제안서 (core-coder / core-designer 전달용)

### 4.1 레이아웃·스타일 (증상 A/B 대응)

- **대상 파일**: `frontend/src/components/dashboard-v2/content/ContentKpiRow.css`, `ContentKpiRow.js`
- **방향**  
  - **ContentKpiRow.css**:  
    - `.mg-v2-content-kpi-row`가 grid가 적용되지 않았을 때를 대비해, 상위에서 이미 쓰는 패턴을 참고해 `display: grid`를 유지하고, 필요 시 `min-width: 0` 등으로 flex 자식 수축 시 그리드가 깨지지 않도록 할지 검토.  
    - (선택) 스켈레톤/로딩 시 카드 경계가 보이도록 최소 border/background fallback 유지.  
  - **ContentKpiRow.js**:  
    - CSS 모듈이 아니라 전역 BEM이므로, 빌드 후 실제 페이지에서 `.mg-v2-content-kpi-row`, `.mg-v2-content-kpi-card`에 기대한 스타일이 적용되는지 확인용 주석 또는 스토리북/테스트에서 DOM 검증 추가 권장.
- **전달 문구 예시 (core-coder)**  
  “어드민 대시보드 V2 KPI 영역이 일부 환경에서 카드 구분 없이 한 덩어리처럼 보인다는 보고가 있음. `ContentKpiRow.css`가 항상 로드되는지, 그리고 `.mg-v2-content-kpi-row`에 `display: grid`가 확실히 적용되도록 하고, 필요 시 부모 flex 맥락에서 `min-width: 0` 등으로 그리드가 찌그러지지 않게 해 주세요.”

### 4.2 완료율 값·표시 (증상 C 대응)

- **대상 파일**: `frontend/src/components/dashboard-v2/AdminDashboardV2.js` (kpiItems 중 `id: 'completion'` 항목)
- **방향**  
  - **value**  
    - `completionRate != null`이면 `\`${stats.consultationStats.completionRate}%\`` 유지.  
    - `completionRate == null`일 때 `todayStats.completedToday`(건수)를 **그대로 value에 넣지 말고**, `'-'` 또는 `'N/A'` 또는 “오늘 완료 N건”처럼 **문자열로 단위를 명시**하거나, 별도 subtitle로만 표시.  
  - **badge**  
    - `completionRateChange`는 “전월 대비 변동” 의미이므로, value가 "0%"일 때 "+45.8%"만 있으면 혼동을 줄 수 있음.  
    - 라벨/툴팁으로 “전월 대비 변동”임을 명시하거나, 완료율 카드에서 value는 “현재 완료율”, subtitle/badge는 “변동”으로 역할을 나누어 표기하도록 수정 권장.
- **전달 문구 예시 (core-coder)**  
  “완료율 KPI 카드에서 value가 completionRate가 null일 때 오늘 완료 건수(숫자)로 나와 단위가 섞입니다. null이면 value는 '-' 또는 'N/A' 등으로 하고, 오늘 완료 건수는 필요 시 subtitle 등 별도 필드로만 표시해 주세요. 그리고 value '0%'와 badge '45.8%'가 나란히 나와 혼동을 주므로, badge는 ‘전월 대비 변동’임을 라벨/툴팁으로 구분해 주세요.”

### 4.3 (선택) 반응형·접근성

- **대상**: `ContentKpiRow.css`, `ContentKpiRow.js`
- **방향**: 768px 이하에서 카드가 한 줄로 넘치지 않는지, 터치 타겟·포커스 보이는 곳 등은 기존 디자인 시스템에 맞춰 점검. 필요 시 core-designer와 “완료율 카드 라벨/변동 표시” UX 정리.

---

## 5. 체크리스트 (수정 후 확인)

- [ ] 어드민 대시보드 V2 진입 후 `div.mg-v2-content-kpi-row`에 `display: grid`, `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))` 적용 여부(개발자 도구).
- [ ] 동일 영역에서 `.mg-v2-content-kpi-card` 3개가 각각 배경·테두리·패딩으로 구분되어 보이는지.
- [ ] 완료율 카드: API가 `completionRate: 0`, `completionRateChange: 45.8`일 때 value "0%", badge "+45.8%"가 의미적으로 구분되어 보이는지(라벨/툴팁 포함).
- [ ] 완료율 카드: `completionRate`가 null일 때 value에 건수만 나오지 않고, '-'/N/A 또는 단위가 명시된 문자열만 노출되는지.
- [ ] 768px 이하에서 KPI 카드 행이 깨지지 않고 읽기 좋은지.
- [ ] (선택) ContentKpiRow를 쓰는 다른 화면(매핑 관리, ERP 대시보드 등)에서도 레이아웃/스타일 정상 여부.

---

## 6. 참조

- `frontend/src/components/dashboard-v2/content/ContentKpiRow.js` (items → mg-v2-content-kpi-card 렌더)
- `frontend/src/components/dashboard-v2/content/ContentKpiRow.css` (row grid, card flex, BEM)
- `frontend/src/components/dashboard-v2/AdminDashboardV2.js` (kpiItems 정의, stats/todayStats, 완료율 value/badge 로직)
- `frontend/src/components/dashboard-v2/templates/DesktopLayout.css` (main > * flex)
- `frontend/src/components/dashboard-v2/content/ContentArea.css` (mg-v2-content-area)
- 백엔드: `AdminController` consultation-completion 응답 (`completionRate`, `completionRateChange`)
