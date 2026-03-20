# ERP/관리자 대시보드 React #130 오류 — 기획 주관 오케스트레이션

**문서 버전**: 1.0.1  
**작성일**: 2026-02-12  
**주관**: core-planner  
**상태**: core-coder 방어 코드 1차 반영 (차트 period 라벨·ERP 적요·Chart error 표시)  

---

## 1. 증상·증거

- 브라우저: `Error: Minified React error #130` (`args[]=object`) — **객체를 React 자식으로 렌더링**할 때 발생하는 전형적 패턴.
- 사용자 플로우: OAuth 후 `/admin/dashboard` → `/erp/dashboard` 이동 후, 다시 **관리자 대시보드**로 돌아오는 구간에서 로그 상 **Bar/Line/Doughnut 차트 다수 렌더 직후** 반복 예외.
- 관련 로그: `[Dashboard Charts] consultation-completion` 응답 200·payload 정상 길이 — **데이터는 오나, 필드 형식이 프론트 가정과 다를 수 있음**.

---

## 2. 기획 판단 — 원인 후보 (우선순위)

| 순위 | 가설 | 근거 | 검증 |
|------|------|------|------|
| **P0** | **`consultation-completion`의 `monthlyData` / `weeklyData` 항목에서 `period`가 문자열이 아니라 객체** | `AdminDashboardV2.js`에서 `labels: rawData.map((d) => d.period)` 로 Chart.js/react-chartjs-2에 전달. `period`가 객체면 범례·툴팁·일부 경로에서 **텍스트 노드로 객체가 올라가며 #130** 가능. | 네트워크 탭에서 응답 JSON의 `monthlyData[0].period` 타입 확인. 객체이면 **표시 전 `String`/`formatPeriod` 정규화** 로 재현 차단. |
| **P1** | **`ErpDashboard` 최근 거래 테이블의 `description` / `memo`가 객체** | `{tx.description ?? tx.memo ?? '—'}` — 백엔드가 구조체를 내려주면 동일 유형 오류. | 응답 샘플 확인 후 **표시값은 `String(...)` 또는 안전 직렬화** 로 통일. |
| **P2** | **에러 상태 UI가 객체를 그대로 출력** | `Chart.js` `error` prop, `BaseWidget` `<p>{error}</p>`, `MGChart` `error` 등에서 문자열 미보장 시 #130. | `err?.message ?? String(err)` 패턴으로 **표시 전 문자열만** 렌더. |
| **P3** | **KPI/배지에 비문자열이 섞임** | `ContentKpiRow`의 `badge` / `subtitleBadge` 등이 이론상 객체면 동일. 현재 `AdminDashboardV2` KPI는 대부분 템플릿 문자열이라 가능성은 P0 대비 낮음. | 필요 시 해당 필드만 타입 가드. |

**참고**: 콘솔의 `🔍 Chart 최종 렌더링: { ..., chartComponent: ... }` 는 디버그 출력이며, **직접적인 원인이라기보다 같은 리렌더 구간의 타이밍 표시**로 해석.

---

## 3. 서브에이전트 분배

### 3.1 core-debugger (1차)

- [ ] 프로덕션/스테이징에서 `consultation-completion` 응답 **원문** 저장 (월간·주간 각 1건).
- [ ] React **development 빌드** 또는 소스맵으로 #130 전체 메시지 확인.
- [ ] React DevTools **Components**에서 예외 시점 트리 상 마지막 유효 컴포넌트 기록.
- 산출물: 이 문서 **§5 확정 표** 작성.

### 3.2 core-coder (2차, 수정)

**권장 수정 (P0 방어적 코딩, API 스키마와 무관하게 안전)**  

- [ ] `frontend/src/components/dashboard-v2/AdminDashboardV2.js`  
  - 차트용 `labels` 생성 시 `period` **정규화 함수** 도입: `null` → `''`, 객체 → `String(표시용필드)` 또는 `JSON.stringify`(최후 수단), 그 외 `String(p)`.
- [ ] `frontend/src/components/erp/ErpDashboard.js`  
  - 최근 거래 셀: `description` / `memo` 를 **문자열만** 렌더 (객체 시 `JSON.stringify` 또는 `'[내용]'` 플레이스홀더).
- [ ] (선택) `frontend/src/components/common/Chart.js`, `MGChart.js`, `BaseWidget.js`  
  - `error` 표시: 항상 **문자열**로 변환 후 렌더.

### 3.3 core-tester (3차)

- [ ] 관리자 대시보드: 월간/주간 토글, 예약 vs 완료 차트, 단계별 도넛, ERP 왕복 네비게이션 시 **콘솔 무오류**.
- [ ] `consultation-completion` 목킹: `period` 객체/문자열 혼합 시에도 화면 유지.

### 3.4 백엔드 (선택, 스키마 정합)

- [ ] `consultation-completion` DTO에서 `period` 타입을 **문서화**하고, 가능하면 항상 문자열(예: `YYYY-MM`, `MM/DD`)로 통일 — 프론트 방어코딩과 병행.

---

## 4. 연관 파일 (코더 참고)

| 파일 | 비고 |
|------|------|
| `frontend/src/components/dashboard-v2/AdminDashboardV2.js` | `rawData.map((d) => d.period)` → Chart `labels` |
| `frontend/src/components/erp/ErpDashboard.js` | 최근 거래 `description` / `memo` |
| `frontend/src/components/common/Chart.js` | `error` 렌더 |
| `frontend/src/components/dashboard/widgets/BaseWidget.js` | `{error}` |

---

## 5. 확정 표 (debugger 기입)

| 항목 | 내용 |
|------|------|
| 실제 `period` 타입·샘플 | |
| 스택에서 지목된 컴포넌트 | |
| 조치 PR | |

---

## 6. 연관: 전역 점검

동일 유형 오류가 다른 화면에도 넓게 있을 수 있으므로, **프론트 전역 감사**는 기획 주관 문서  
`docs/project-management/FRONTEND_REACT_CHILD_SAFETY_FULL_AUDIT_ORCHESTRATION.md`  
(explore → debugger 분류 → coder 배치 수정 → tester 회귀)로 진행한다.

---

## 7. 변경 이력

| 버전 | 일자 | 내용 |
|------|------|------|
| 1.0.1 | 2026-02-12 | core-coder: `AdminDashboardV2` `formatChartPeriodLabel`/`chartPeriodObjectToLabel`, `ErpDashboard` 적요 안전 렌더, `Chart.js` error 문자열화 |
| 1.0.0 | 2026-02-12 | 초안: 로그 기반 가설·분배 |
