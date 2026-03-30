# 어드민 대시보드 V2 KPI 영역 수정 기획

## 1. 제목·목표

- **제목**: 어드민 대시보드 V2 KPI 영역(`.mg-v2-content-kpi-row`) "제대로 안 된다" 증상 정리·원인 분석·수정 Phase 분배
- **목표**: 사용자 보고된 KPI 영역 이슈를 시나리오별로 정리하고, core-debugger로 원인 분석 후 원인에 따라 core-designer 또는 core-coder로 수정을 분배하여 한 번의 기획으로 설계·구현이 이어지게 한다.

---

## 2. 범위

| 구분 | 내용 |
|------|------|
| **포함** | `div.mg-v2-content-kpi-row` (DOM: `#root` → … → `main.mg-v2-desktop-layout__main` → `div.mg-v2-content-area` 하위), 관련 컴포넌트·CSS·데이터 흐름 |
| **참조 코드** | `ContentKpiRow.js`, `ContentKpiRow.css`, `AdminDashboardV2.js` 내 `kpiItems` 구성·`stats`/`todayStats` 연동 |
| **제외** | 대시보드 V2의 파이프라인·차트·그 외 위젯 (KPI 행만 범위) |

---

## 3. 증상 정리 (가능한 시나리오)

사용자 진술 "제대로 안 된다"를 아래 시나리오로 나눈다. **실제 원인은 Phase 1(core-debugger) 분석 결과로 확정**한다.

| ID | 시나리오 | 설명 |
|----|----------|------|
| **A** | **카드가 3개로 나뉘지 않고 한 줄로 붙어 보임** | grid가 동작하지 않거나, 자식이 1개로 인식되어 카드 구분이 없어 보임. 또는 `minmax(240px, 1fr)` 미만 너비에서 한 줄로 쌓임. |
| **B** | **스타일이 적용되지 않아 텍스트만 나열** | `.mg-v2-content-kpi-row` / `.mg-v2-content-kpi-card` 등 CSS가 적용되지 않아, "총 사용자 변동 없음 9 상담사 3 · 내담자 6 …"처럼 텍스트가 한 덩어리로 보임. (제공된 사용자 설명과 유사) |
| **C** | **값이 0·비어 있음·잘못 표시** | 예: 완료율 "0% 45.8%"처럼 값·보조 텍스트가 중복·혼재되거나, `stats`/`todayStats` 미로딩·API 오류로 0/undefined만 노출. |
| **D** | **반응형에서 깨짐** | 768px 이하 또는 특정 뷰포트에서 KPI 행이 겹침·줄바꿈 이상·스크롤·가독성 저하. |
| **E** | **그 외** | 아이콘 미표시, 클릭 불가(또는 불필요한 클릭), 접근성·키보드 포커스, LNB/GNB와의 겹침 등. |

- **DOM 정보 (참고)**: 위치 top=183px, left=288px, width=1631px, height=149px.  
- **현재 스펙**: row는 `display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem`. 카드는 flex, BEM 클래스로 아이콘·정보·라벨·뱃지·값·서브타이틀 구분.

---

## 4. 원인 후보

Phase 1에서 검증할 후보만 정리. **기획은 원인 단정하지 않으며**, 디버거가 DOM/스타일/데이터를 확인한 뒤 보고한다.

### 4.1 레이아웃·비주얼 이슈 (A, B, D와 연관)

| 후보 | 내용 |
|------|------|
| **전역 CSS가 grid/flex 덮어씀** | 다른 스타일시트에서 `.mg-v2-content-kpi-row`, `.mg-v2-content-kpi-card` 또는 부모에 `display`/`grid-template-columns`/`flex` 등을 재정의하여 B0KlA 스펙이 무시됨. |
| **ContentKpiRow.css 미로드** | `ContentKpiRow.js`에서 `import './ContentKpiRow.css'` 가 번들에서 제외되거나 경로 오류로 해당 CSS가 적용되지 않음. |
| **클래스명 오타·중첩** | JSX에서 클래스명이 CSS와 불일치하거나, 상위/동일 요소에 더 높은 특이도의 스타일이 적용됨. |
| **부모 컨테이너 제약** | `.mg-v2-content-area` 등 부모의 `overflow`/`min-width`/`display`로 인해 grid 자식이 한 줄로 압축되거나 잘림. |
| **반응형 미디어쿼리** | 768px 이하에서만 깨지는 경우, `ContentKpiRow.css` 내 미디어쿼리 또는 상위 레이아웃과의 충돌. |

### 4.2 데이터·표시 이슈 (C와 연관)

| 후보 | 내용 |
|------|------|
| **stats/todayStats 초기값·로딩** | `stats`, `todayStats`가 초기값(0 등)으로만 노출되고, `loadDashboardData`/`loadTodayStats` 완료 전에 KPI가 렌더되거나 API 실패 시 갱신이 안 됨. |
| **완료율 카드 값·fallback** | `value: stats.consultationStats?.completionRate != null ? \`${stats.consultationStats.completionRate}%\` : todayStats.completedToday` 에서 `completionRate` 0과 `completedToday` 혼용 시 "0%"와 "45.8%" 등이 동시에 노출될 수 있는 구조. |
| **API 연동 오류** | `/api/v1/schedules/today/statistics`, 통계 관련 API 오류·권한·tenantId 미전달로 빈/잘못된 payload. |

---

## 5. 의존성·순서

- **Phase 1** 결과(원인 분석·수정 제안서)에 따라 **Phase 2** 담당이 결정됨.
  - 레이아웃·비주얼·B0KlA 스펙 이슈 → **core-designer** (스펙 점검·보완) 후 필요 시 **core-coder** (마크업/스타일 반영).
  - 구현 버그·데이터 흐름·API 연동 이슈 → **core-coder** (수정 구현).
- Phase 2는 Phase 1 완료 후 진행. Phase 2 내에서 designer → coder 순서가 필요할 수 있음.

---

## 6. Phase 분배 및 서브에이전트 호출 시 전달할 태스크 설명 초안

### Phase 1: 증상 확인·원인 분석 (core-debugger)

**담당**: core-debugger  
**목표**: KPI 영역 "제대로 안 된다"의 실제 증상(위 시나리오 A~E 중 해당 사항) 확인, DOM/스타일/데이터 흐름 점검, 원인 후보 검증 및 **수정 제안서** 작성. (코드 직접 수정 없음.)

**호출 시 전달할 프롬프트 초안**:

```
어드민 대시보드 V2의 KPI 영역(div.mg-v2-content-kpi-row)이 "제대로 안 된다"는 사용자 보고가 있습니다.

[참고 정보]
- DOM 경로: #root → … → main.mg-v2-desktop-layout__main → div.mg-v2-content-area → div.mg-v2-content-kpi-row
- 사용자 관찰: "총 사용자 변동 없음 9 상담사 3 · 내담자 6 변동 없음 예약된 상담 변동 없음 0 완료율 0% 45.8%" 처럼 텍스트가 한 덩어리로 나열된 것처럼 보일 수 있음 (카드 구분·레이아웃 깨짐 의심).
- 관련 코드: frontend/src/components/dashboard-v2/content/ContentKpiRow.js (items를 map해 mg-v2-content-kpi-card로 렌더), ContentKpiRow.css (row: grid, card: flex, BEM 클래스), AdminDashboardV2.js (kpiItems 배열, stats/todayStats 연동).

[요청]
1) 다음 시나리오 중 실제로 어떤 증상에 해당하는지 확인해 주세요.
   (A) 카드가 3개로 나뉘지 않고 한 줄로 붙어 보임
   (B) 스타일 미적용으로 텍스트만 나열
   (C) 값이 0/비어 있음·잘못 표시(예: 완료율 0%와 45.8% 혼재)
   (D) 반응형에서 깨짐
   (E) 그 외(아이콘·클릭·접근성 등)
2) 원인 후보 검증: 레이아웃 측면에서 전역 CSS 덮어쓰기, ContentKpiRow.css 로드 여부, 클래스명·부모 제약, 반응형 충돌 여부를 확인해 주세요. 데이터 측면에서 stats/todayStats 초기값·로딩 시점·API 연동·완료율 value/subtitle 로직을 확인해 주세요.
3) 원인 분석 결과와 함께, 수정 제안서(어떤 파일·어떤 방향으로 수정할지, core-coder 또는 core-designer에게 전달할 수 있는 수준)를 작성해 기획(core-planner)에게 보고해 주세요. 코드 직접 수정은 하지 마세요.
```

---

### Phase 2: 원인에 따른 설계 또는 구현 (core-designer / core-coder)

Phase 1 결과에 따라 **한쪽만** 또는 **순차(designer → coder)** 로 배정한다.

#### 2-A: 레이아웃·비주얼 이슈일 때 — core-designer

**담당**: core-designer  
**목표**: B0KlA KPI 행 스펙 점검·보완. (코드 작성 없음.)

**호출 시 전달할 프롬프트 초안**:

```
Phase 1(core-debugger) 분석 결과, 어드민 대시보드 V2 KPI 영역(.mg-v2-content-kpi-row) 이슈가 레이아웃·비주얼 원인으로 판단되었습니다.

[전달 자료]
- 디버거 수정 제안서(첨부 또는 요약)
- 참조: mindgarden-design-system.pen B0KlA kpiRow 스펙, 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), ContentKpiRow.js/CSS 현재 구조

[요청]
1) B0KlA KPI 행의 그리드·카드 배치·간격·반응형이 디자인 스펙과 일치하는지 점검해 주세요.
2) 필요 시 보완 스펙(레이아웃·블록·토큰·브레이크포인트)을 문서로 작성해 주세요. core-coder가 적용할 수 있는 수준으로 구체적으로 적어 주세요.
3) 사용성(편하게 사용)·정보 노출 범위·레이아웃(배치) 요구를 반영해 주세요. 코드 작성은 하지 마세요.
```

#### 2-B: 구현·데이터 이슈일 때 — core-coder

**담당**: core-coder  
**목표**: Phase 1 수정 제안서를 반영한 코드/스타일/데이터 흐름 수정.

**호출 시 전달할 프롬프트 초안**:

```
Phase 1(core-debugger) 분석 결과, 어드민 대시보드 V2 KPI 영역 이슈가 [구현/데이터 원인]으로 판단되었습니다.

[전달 자료]
- 디버거 수정 제안서(첨부 또는 요약)
- 대상: frontend/src/components/dashboard-v2/content/ContentKpiRow.js, ContentKpiRow.css, AdminDashboardV2.js 내 kpiItems·stats/todayStats 연동

[요청]
1) 수정 제안서에 적힌 항목을 반영하여 수정 구현해 주세요. (CSS 덮어쓰기 해소, 클래스/구조 수정, stats/todayStats 로딩·표시 로직, 완료율 value/subtitle 정리 등 제안서 내용에 따름.)
2) Core Solution 프론트엔드 규칙·B0KlA·unified-design-tokens.css를 참조해 주세요.
3) 변경 후 KPI 행이 3개 카드로 구분되어 보이고, 값이 올바르게 표시되는지 확인 가능하도록 해 주세요.
```

- **2-A 후 2-B**: designer가 스펙을 보완한 경우, 같은 Phase 2에서 core-coder를 호출할 때 "core-designer 산출 스펙을 반영하여 구현"을 전달문에 포함한다.

---

## 7. 리스크·제약

- **MappingStats.js** 등 다른 화면에서도 `.mg-v2-content-kpi-row`, `.mg-v2-content-kpi-card` 클래스를 사용하므로, KPI 행 전용 스타일 변경 시 해당 화면 회귀 여부 확인 필요.
- stats/todayStats는 비동기 로딩이므로, 로딩 중 KPI만 스켈레톤/플레이스홀더로 보여줄지 여부는 Phase 1·2 결과에 따라 정리.

---

## 8. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 | 체크리스트 |
|-------|-----------|------------|
| **Phase 1** | 디버거가 기획에게 원인 분석·수정 제안서 보고 완료 | 증상 시나리오(A~E) 매핑, 레이아웃/데이터 원인 후보 검증, 수정 제안서에 "누가 무엇을 수정할지" 명시 |
| **Phase 2 (designer)** | B0KlA KPI 행 스펙 점검·보완 문서 산출 | 코더가 구현 가능한 수준의 레이아웃·토큰·반응형 명세 포함 |
| **Phase 2 (coder)** | 제안서/스펙 반영 코드 반영 및 동작 확인 | KPI 행 카드 3개 구분 표시, 값 정상 표시, 기존 사용처(MappingStats 등) 회귀 없음 |

---

## 9. 실행 요청문 (분배실행)

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 1**  
   - **서브에이전트**: `core-debugger`  
   - **전달 내용**: 위 §6 Phase 1의 "호출 시 전달할 프롬프트 초안" 전문을 그대로 전달.  
   - **적용 스킬**: `/core-solution-debug`

2. **Phase 2** (Phase 1 결과 수신 후)  
   - **레이아웃·비주얼 원인**인 경우:  
     - `core-designer` 호출 → 위 §6 Phase 2의 **2-A** 프롬프트 초안 전달.  
     - 필요 시 이어서 `core-coder` 호출 → **2-B** 프롬프트에 "designer 산출 스펙 반영"을 추가해 전달.  
   - **구현·데이터 원인**인 경우:  
     - `core-coder` 호출 → 위 §6 Phase 2의 **2-B** 프롬프트 초안 전달.  
   - **적용 스킬**: designer 시 `/core-solution-design-handoff`, `/core-solution-planning` §0.4·§0.5; coder 시 `/core-solution-frontend`, `/core-solution-atomic-design`

Phase 1 결과를 기획(core-planner)에게 보고해 주시면, Phase 2 담당 및 전달문을 확정한 뒤 사용자에게 최종 보고하겠습니다.
