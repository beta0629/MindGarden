# GATE-02 — 7/13 dev 통합 검수 체크리스트 (SEQ_28 형식)

**Gate ID**: `GATE-02`  
**역할**: ADMIN (ERP·어드민 LNB 접근 권한) · **Consultant** · **Client** (ROLE sign-off 구간)  
**환경**: **dev only** — `https://mindgarden.dev.core-solution.co.kr`  
**배포 기준**: develop `419a0177d` (#545 ROLE-03 Expo wiring · prior #544 P0-3~4 · #543 DASH-03~04 · #540 ADM-01) · dev FE bundle **`main.4278ef57.js`** · deploy run [`28875323851`](https://github.com/beta0629/MindGarden/actions/runs/28875323851) @ `8bf5ace0d` (#543) · Expo-only #545는 FE redeploy 불필요  
**선행 (GATE-01)**: develop `c65d9f326` · deploy run [`28855153365`](https://github.com/beta0629/MindGarden/actions/runs/28855153365) · bundle `main.0ef5994d.js`  
**후속**: `GATE-03` 7/13 사용자 sign-off (본 문서 완료 후)  
**prod**: **GATE-04 미실행 · prod deploy/sign-off 금지**

**참조**: [`COMPREHENSIVE_IMPROVEMENT_WBS.md`](../../project-management/2026-07-07/COMPREHENSIVE_IMPROVEMENT_WBS.md) · [`HANDOFF_20260707_EOD.md`](../../project-management/2026-07-07/HANDOFF_20260707_EOD.md) · [`SEQ_28_PROD_SMOKE_CHECKLIST.md`](./SEQ_28_PROD_SMOKE_CHECKLIST.md) (형식 SSOT) · [`SCREEN_SPEC_ADMIN_DASHBOARD_G1-02_FULL.md`](../../design-system/SCREEN_SPEC_ADMIN_DASHBOARD_G1-02_FULL.md) · [`ADMIN_DARK_MODE_C3_ROADMAP.md`](../../project-management/2026-06-30/ADMIN_DARK_MODE_C3_ROADMAP.md)

---

## Critical Path 완료 evidence (5건)

| CP | Work Package | 완료 evidence | 상태 |
|----|--------------|---------------|------|
| **CP-1** | `GATE-01` parallel-4 dev smoke | 테넌트 URL E2E PASS · run baseline `28855153365` @ `c65d9f326` · HANDOFF §스냅샷 `GATE-01 tenant smoke` ☑ | ☑ |
| **CP-2** | `DASH-02` SchedulePendingList 와이어링 | PR [#529](https://github.com/beta0629/MindGarden/pull/529) `76103c3d8` (Jest guard) · PR [#541](https://github.com/beta0629/MindGarden/pull/541) `45a9d0d3c` (`BOOKED` API) · deploy run [`28871900145`](https://github.com/beta0629/MindGarden/actions/runs/28871900145) | ☑ |
| **CP-3** | `DASH-01`~`04` 위젯·다크·safeDisplay | PR [#526](https://github.com/beta0629/MindGarden/pull/526) G1-02 KPI·pending lists · parallel-4 Track B (#511+#519+#521+#523) · G1-02 widget guard **6 suites · 57 tests PASS** @ `419a0177d` (§C·§D) | ☑ |
| **CP-4** | `DASH-08` Jest·Must-not gate | 6 suites **57 tests PASS** @ develop `419a0177d` (아래 §Jest 게이트) · blocking 0 | ☑ |
| **CP-5** | `ADM-01` dark-c3b | PR [#540](https://github.com/beta0629/MindGarden/pull/540) `5f1e478f5` · P1-a/b/c (`sessions`·`wellness`·`common-codes`) · `adminDarkMode.cascade.test.js` P1 확장 | ☑ |

---

## 공통 선행

1. **테넌트 URL 필수**: `https://mindgarden.dev.core-solution.co.kr` (또는 `https://{tenant}.dev.core-solution.co.kr`). bare `dev.core-solution.co.kr` 단독 접속 → `/` 리다이렉트는 **wrong-path expected** (smoke FAIL 아님).
2. ADMIN 계정 로그인 → LNB·GNB 정상 표시.
3. 브라우저 개발자 도구 **콘솔·네트워크** 열고 진행. React #130·미처리 예외 없을 것.
4. HTML `<script>` bundle 확인: **`main.4278ef57.js`** (deploy run `28875323851` @ `8bf5ace0d` · #543 DASH-03~04).
5. **prod URL·prod deploy workflow 실행 금지** — 본 검수는 dev sign-off용 (`GATE-03` 전제).

---

## A. CP-1 — parallel-4 dev smoke (Seq GATE-01 · baseline `c65d9f326`)

| 단계 | 동작 | 기대 결과 | evidence |
|------|------|-----------|----------|
| A1 | dev ADMIN 로그인 (`mindgarden.dev…`) | LNB·GNB·대시보드 진입 **200** | E2E `admin-dashboard-lnb-console-smoke` PASS |
| A2 | **Dark P1-j~l** 대표 라우트 1곳 이상 | 다크 토글 시 cascade · hex 깨짐 0 | Track A #506~#512 merge |
| A3 | **G5-02 / G1-02** commercial·dashboard | ListTableView(Compact) · B0KlA section | Track B #511+#519+#521+#523 |
| A4 | **Header P2** 6라우트 | ContentHeader 이중 제목 0 · ACL `title` SSOT | Track C #515+#522 · routes: sessions·notifications·common-codes·system-config·accounts·dormant-users |
| A5 | 콘솔 스캔 | React #130·blocking error 0 | HANDOFF GATE-01 ☑ |

**Sign-off CP-1**

- [x] A1~A5 통과 — parallel-4 dev smoke (tenant URL) OK

---

## B. CP-2 — SchedulePendingList 데이터 와이어링 (PR-DASH-02 · Seq DASH-02)

경로: `/admin/dashboard` → **스케줄 등록 대기** 위젯

| 단계 | 동작 | 기대 결과 | evidence |
|------|------|-----------|----------|
| B1 | 대시보드 진입 | `SchedulePendingList`·`DepositPendingList` **별도 위젯** 노출 | #529 Jest · #541 merge |
| B2 | 네트워크 탭 | Schedule 쪽 `GET /api/v1/admin/schedules?status=BOOKED` (또는 동등) **2xx** · Deposit 쪽 **별도** pending deposit API | #541 `45a9d0d3c` |
| B3 | 데이터 정합 | Schedule 행 ≠ Deposit 행 (동일 pendingDepositList 복붙 **없음**) | `adminDashboardWidgets.density` PR-DASH-02 guard |
| B4 | UI | ListTableView(Compact) · 행별 인라인 버튼 0 · **전체 보기** CTA 1개 | `SchedulePendingList.g1-02.test.js` PASS |
| B5 | 빈 상태 | 「처리 대기 항목이 없습니다」+ 전체 보기 CTA 유지 | Jest empty state PASS |

**Sign-off CP-2**

- [x] B1~B5 통과 — SchedulePendingList BOOKED 와이어링 dev OK

---

## C. CP-3 — Admin Dashboard G1-02 (PR-DASH-01~04 · PR-DASH-05)

경로: `/admin/dashboard` (`AdminDashboardV2` · `AdminCommonLayout`)

### C1. PR-DASH-05 — Parallel-4 / G1-02 smoke (수동)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| C1-1 | KPI Zone (1280px 창) | KpiFlipCard **4-grid** 가로 스크롤 없이 노출 | KPI 4블록 전체 |
| C1-2 | 다크 토글 ON/OFF | KPI·Pipeline 색상 `var(--mg-dark-*)` cascade | light/dark 각 1장 |
| C1-3 | CoreFlowPipeline | 단계 데이터 렌더 · 클릭/터치 타겟 **≥44px** | Pipeline 전체 |
| C1-4 | Pending Lists | Schedule vs Deposit **데이터 분리** · ListTableView(Compact) | 두 위젯 나란히 |
| C1-5 | Chart.js (metrics 있을 때) | 다크 전환 시 축·그리드·툴팁 테마 동기화 | Chart dark |
| C1-6 | 환불 StatCard | 분산 CTA 0 · **단일 CTA** (환불 관리 가기) | StatCard |
| C1-7 | ProfileCard 오용 | 목록형 위젯에 ProfileCard **0건** | ManualMatchingQueue 등 |

**Sign-off PR-DASH-05**

- [ ] C1-1~C1-7 통과 — G1-02 parallel-4 dev smoke OK (사용자 `GATE-03` 전 검수)

### C2. PR-DASH-03~04 잔여 (다크·1280px·safeDisplay)

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| C2-1 | 414px viewport | KPI·Pipeline 겹침·잘림 0 |
| C2-2 | 위젯 null/empty 필드 | `safeDisplay` — React #130 0 |
| C2-3 | ContentHeader actions | Primary 1 + overflow |

**Jest guard (로컬 @ develop `419a0177d`)**: G1-02 widget guard **6 suites · 57 tests PASS** — `adminDashboardWidgets.density` · `SchedulePendingList.g1-02` · `DepositPendingList.g1-02` · `KpiFlipCard` · `adminDarkMode.cascade` (§D DASH-08)

**Sign-off CP-3 (자동 guard ☑ · 수동 C1 pending)**

- [x] Jest G1-02 widget guard PASS — 6 suites · 57/57 @ `419a0177d` · bundle `main.4278ef57.js`
- [ ] C1-1~C1-7 사용자 스크린 (→ `GATE-03`)

---

## D. CP-4 — Jest·Must-not gate (DASH-08)

로컬 @ develop `419a0177d`:

```bash
cd frontend && CI=true npx craco test --watchAll=false \
  --testPathPattern="SchedulePendingList.g1-02|adminDashboardWidgets.density|KpiFlipCard|DepositPendingList.g1-02|adminDarkMode.cascade"
```

| Suite | 파일 | CP | 결과 |
|-------|------|-----|------|
| Schedule pending G1-02 | `SchedulePendingList.g1-02.test.js` | CP-2 | ☑ PASS |
| Deposit pending G1-02 | `DepositPendingList.g1-02.test.js` | CP-3 | ☑ PASS |
| KPI flip | `KpiFlipCard.test.js` | CP-3 | ☑ PASS |
| Widget density guard | `adminDashboardWidgets.density.test.js` | CP-2·3 | ☑ PASS |
| Dark C-3 cascade | `adminDarkMode.cascade.test.js` | CP-4·5 | ☑ PASS |
| AdminDashboardV2 smoke | `AdminDashboardV2.smoke.test.js` | CP-3 | (선택 확장) |

**Evidence (2026-07-08 @ develop `419a0177d`)**: **6 suites · 57 tests PASS · 0 failed** (core-tester 로컬 재실행)

**Sign-off CP-4**

- [x] DASH-08 Jest gate PASS @ `419a0177d` (57/57)

---

## E. CP-5 — dark-c3b P1 (ADM-01 · sessions·wellness·common-codes)

PR [#540](https://github.com/beta0629/MindGarden/pull/540) · merge `5f1e478f5` · deploy bundle `main.908673a1.js`

| 단계 | 경로 | 동작 | 기대 결과 | 스크린샷 |
|------|------|------|-----------|----------|
| E1 | `/admin/sessions` | 다크 토글 ON | SessionManagement 모달·테이블·폼 cascade · hex 0 | dark full |
| E2 | `/admin/wellness` | 다크 토글 ON | WellnessManagement B0KlA + 폼·테이블 cascade | dark full |
| E3 | `/admin/common-codes` | 다크 토글 ON | CommonCodeManagement 테이블·필터 cascade | dark full |
| E4 | 라이트 복귀 | 토글 OFF | C-2/C-2b 회귀 0 | light 1장 |
| E5 | Jest | `adminDarkMode.cascade.test.js` P1 파일 3종 | `[data-theme="dark"]` · hex guard PASS | §D evidence |

**Jest guard (로컬 @ develop `419a0177d`)**: `adminDarkMode.cascade` ☑ PASS — sessions·wellness·common-codes P1 · DASH-08 6 suites · 57 tests 내 포함 (§D)

**Sign-off CP-5**

- [x] E5 Jest PASS @ `419a0177d` (`adminDarkMode.cascade` · §D 57/57)
- [ ] E1~E4 사용자 dark 시각 (→ `GATE-03`)

---

## F. Header hotfix dev 검증 (HF-02 · CP-6 선행)

baseline PR #515+#522 @ `aaa9ff883` · deploy run [`28858525028`](https://github.com/beta0629/MindGarden/actions/runs/28858525028) · **dev 재검증** @ bundle `main.4278ef57.js` (run [`28875323851`](https://github.com/beta0629/MindGarden/actions/runs/28875323851))

| 단계 | 경로 | 기대 결과 | dev 검증 (2026-07-08) |
|------|------|-----------|----------------------|
| F1 | `/admin/sessions` | ContentHeader **단일 h1** · ACL title SSOT | ☑ **PASS** — CLN-01 redirect → `/admin/mapping-management` · h1×1 「매칭 관리」·이중 0 |
| F2 | `/admin/notifications` | 이중 헤더 0 | ☑ **PASS** — h1×1 「알림·메시지 관리」 |
| F3 | `/admin/common-codes` | 이중 헤더 0 | ☑ **PASS** — h1×1 「공통코드 관리」 |
| F4 | `/admin/system-config` | 이중 헤더 0 | ☑ **PASS** — h1×1 「시스템 설정 관리」 |
| F5 | `/admin/accounts` | 이중 헤더 0 | ☑ **PASS** — h1×1 「계좌 관리」 |
| F6 | `/admin/lifecycle/dormant-users` | 이중 헤더 0 | ☑ **PASS** — h1×1 「휴면 사용자 관리」 |

**Jest guard (로컬 @ develop `419a0177d`)**: `headerDedup` 7 suites · **7/7 PASS** — `SessionManagement` · `AdminNotificationsPage` · `CommonCodeManagement` · `SystemConfigManagement` · `AccountManagement` · `DormantUsersPage` · `ClientDashboard`

```bash
cd frontend && CI=true npx craco test --watchAll=false --testPathPattern="headerDedup"
```

**Sign-off HF-02**

- [x] F1~F6 통과 — header P2 6라우트 dev OK (tenant `mindgarden.dev` · ADMIN 로그인 · bundle `main.4278ef57.js`)

---

## G. Role Dashboards (ROLE-01 · ROLE-02 · GATE-03 prep)

### G1. Client Dashboard v1.3 freeze (ROLE-01)

경로: `/client/dashboard` · SSOT [`CLIENT_DASHBOARD_REBUILD_HANDOFF_v1.3.md`](../../design-system/CLIENT_DASHBOARD_REBUILD_HANDOFF_v1.3.md)

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| G1-1 | Client 로그인 → 대시보드 | KPI·CTA·quick menu · `clientDashboardRoutes.js` SSOT (#532) |
| G1-2 | App/Web | 웹↔Expo cross-import 0 · API-only 공유 |
| G1-3 | 콘솔 | React #130 0 |

**Sign-off ROLE-01**

- [ ] G1-1~G1-3 통과 — Client v1.3 dev OK

### G2. Consultant Dashboard V2 (ROLE-02 · #534+#539)

경로: `/consultant/dashboard-v2` · SSOT [`SCREEN_SPEC_CONSULTANT_DASHBOARD_V2_ENHANCED.md`](../../design-system/SCREEN_SPEC_CONSULTANT_DASHBOARD_V2_ENHANCED.md)

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| G2-1 | Consultant 로그인 | B0KlA ContentKpiRow·QuickActionBar · AdminCommonLayout children |
| G2-2 | P0-6 polish (#539) | spacing·ListTableView(Compact) · `a02f3843f` |
| G2-3 | 1280/414 | 반응형 회귀 0 |

**Sign-off ROLE-02**

- [ ] G2-1~G2-3 통과 — Consultant V2 dev OK

### G3. Consultant Expo home (ROLE-03 P0-3~4 · #544+#545)

경로: Expo `app/(consultant)/(home)/index.tsx` · SSOT [`SCREEN_SPEC_CONSULTANT_DASHBOARD_V2_ENHANCED.md`](../../design-system/SCREEN_SPEC_CONSULTANT_DASHBOARD_V2_ENHANCED.md) · [`SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md`](../../design-system/SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md)

| 단계 | 동작 | 기대 결과 | Jest/코드 evidence |
|------|------|-----------|-------------------|
| G3-1 | Consultant Expo dev 로그인 → 홈 탭 | KPI StatCard row (`selectConsultantHomeKpiItems`) · 인사·요약 | #544 `482e7e7a0` hooks · `consultantHomeKpi.test.ts` ☑ |
| G3-2 | NextSessionCard | 다음 상담 카드·empty state | `ConsultantNextSessionCard` · `consultantHomeComponentUi.test.ts` ☑ |
| G3-3 | UrgentClientBanner | 고위험 내담자 배너·CTA | `ConsultantUrgentClientBanner` · `consultantHomeComponentUi.test.ts` ☑ |
| G3-4 | QuickActionBar | **5개** 액션 (일정·가용시간·메시지·일지·급여) | #545 `419a0177d` wiring · `CONSULTANT_HOME_COPY` SSOT |
| G3-5 | App/Web 분리 | 웹↔Expo cross-import **0** · API-only (`useConsultantHome` · `/api/v1/*`) | DEC-02 · `expo-app/` 내 `frontend/` import 0 |
| G3-6 | Expo OTA | **publish 금지** — channel report only | `eas.json`: `development` · `preview` · `internal-dev` |

**Jest guard (로컬 @ develop `419a0177d`)**: `consultantHome` **4 suites · 32/32 PASS** — `consultantHomeKpi` · `consultantHomeApiNormalize` · `consultantHomeComponentUi` · `useConsultantHome`

```bash
cd expo-app && CI=true npm run test:utils -- --watchAll=false \
  --testPathPattern="consultantHome|useConsultantHome"
```

**Sign-off ROLE-03 (Expo P0-3~4)**

- [x] Jest Expo consultantHome PASS — 4 suites · 32/32 @ `419a0177d`
- [ ] G3-1~G3-5 통과 — Consultant Expo home dev OK (사용자 `GATE-03` · Expo dev client / `internal-dev` APK)
- **P0-2 Renewal API 교정**: **post-GATE-03 defer** — GATE-03 blocking 아님

---

## H. Wrong-path · 거버넌스 (재확인)

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| H1 | `https://dev.core-solution.co.kr/admin/dashboard` (bare host) | 테넌트 미식별 → **`/` 리다이렉트** (버그 아님) |
| H2 | prod workflow | **미실행** · `GATE-04` 유지 |
| H3 | canonical role | ADMIN/STAFF/CONSULTANT/CLIENT 4종 · HQ_ADMIN 가설 폐기 |

**Sign-off 거버넌스**

- [x] H1 wrong-path documented
- [x] H2 prod deploy 금지 확인
- [x] H3 role SSOT (#533+#535 GATE-01)

---

## Jest 게이트 (확장 — Saved View·휴면 · 선택)

| Suite | 파일 | 비고 |
|-------|------|------|
| 휴면 페이지 | `DormantUsersPage.smoke.test.js` | Seq 28c |
| viewMode SSOT | `useViewModePreference.test.js` | Seq 28b~e |
| Client saved view | `clientComprehensiveManagement.savedView.test.js` | 28g-p5 |
| Consultant/Staff saved view | `consultantComprehensiveManagement.savedView.test.js` · `staffManagement.savedView.test.js` | 28g-p6 |
| Mapping saved view | `mappingManagement.savedView.test.js` | 28g-p7 |

로컬 (선택):

```bash
cd frontend && CI=true npx craco test --watchAll=false \
  --testPathPattern="DormantUsersPage.smoke|useViewModePreference|clientComprehensiveManagement.savedView|adminDarkMode.cascade|adminDashboardWidgets.density"
```

---

## 최종 sign-off (`GATE-03` — 사용자 · 2026-07-13)

| 항목 | CP/Seq | Jest/코드 evidence | 수동 dev | 완료 |
|------|--------|-------------------|----------|------|
| parallel-4 dev smoke (tenant URL) | CP-1 · GATE-01 | E2E ☑ | A1~A5 | [x] |
| SchedulePendingList BOOKED 와이어링 | CP-2 · DASH-02 | #541 · Jest ☑ | B1~B5 | [x] |
| G1-02 위젯 guard | CP-3 · DASH-01~04 | **6 suites · 57 tests** PASS ☑ @ `419a0177d` · #543 · bundle `main.4278ef57.js` | C1 PR-DASH-05 | [ ] |
| Jest·Must-not gate | CP-4 · DASH-08 | 57/57 PASS ☑ @ `419a0177d` | — | [x] |
| dark-c3b P1 (3 routes) | CP-5 · ADM-01 | `adminDarkMode.cascade` ☑ @ `419a0177d` · #540 | E1~E4 | [ ] |
| Header P2 6 routes | HF-02 | #515+#522 · headerDedup 7/7 ☑ | F1~F6 | [x] |
| Client dashboard v1.3 | ROLE-01 | #532 ☑ | G1 | [ ] |
| Consultant V2 B0KlA (웹) | ROLE-02 | #534+#539 ☑ | G2 | [ ] |
| Consultant Expo home P0-3~4 | ROLE-03 · CP-6b | #544+#545 · **ROLE-04** 4 suites · **32/32** ☑ @ `419a0177d` | G3 | [ ] |
| ROLE-03 P0-2 Renewal | ROLE-03 | **defer** post-GATE-03 | — | — |
| prod deploy **미실행** | GATE-04 | — | H2 | [x] |

**검수자 / 일자**: _______________ / **2026-07-13** (placeholder)  
**dev bundle**: `main.4278ef57.js` · **develop**: `419a0177d` · **prod sign-off 없음**

---

## GATE-03 사용자 sign-off 시트 (2026-07-13 · 최종 초안)

> **1-pager (인쇄용)**: [`GATE_03_USER_SIGNOFF_SHEET_20260713.md`](./GATE_03_USER_SIGNOFF_SHEET_20260713.md) · evidence pack: [`DASH_10_EVIDENCE_PACK_20260713.md`](./DASH_10_EVIDENCE_PACK_20260713.md)

> **역할**: 7/13 사용자 최종 검수용 — 본 섹션 체크 후 서명. **prod 승인 아님** · dev only.  
> **검수 순서 (권고)**: #3·#7 완료 → **#1 Admin G1-02** → **#2 dark-c3b** → **#4 Client** → **#5 Consultant 웹** → **#6 Expo**  
> **P0-2 Renewal API 교정**: **post-GATE-03 defer** — 본 sign-off **blocking 아님**

| # | 영역 | 7/13 수동 절차 (1줄) | 코드/Jest evidence | 사용자 ☑ | 비고 |
|---|------|---------------------|-------------------|---------|------|
| 1 | Admin G1-02 대시보드 | ADMIN 로그인 → `mindgarden.dev…/admin/dashboard` · 1280px·414px · 다크 ON/OFF · C1-1~C1-7 스크린·콘솔 #130 0 | G1-02 widget guard **6 suites · 57 tests** ☑ @ `419a0177d` · #543 `8bf5ace0d` · bundle `main.4278ef57.js` | [ ] | PR-DASH-05 |
| 2 | dark-c3b P1 | ADMIN → `/admin/sessions`·`/wellness`·`/common-codes` 각 다크 토글 cascade·hex 0 스크린 → 라이트 복귀 회귀 0 | `adminDarkMode.cascade` ☑ @ `419a0177d` · #540 `5f1e478f5` | [ ] | E1~E4 |
| 3 | Header P2 (HF-02) | F1~F6 6라우트 ContentHeader 단일 h1·ACL title SSOT (F1은 CLN-01 redirect) | headerDedup **7/7** ☑ @ `419a0177d` · overnight dev ☑ | [x] | CP-6 ☑ |
| 4 | Client v1.3 | CLIENT 로그인 → `/client/dashboard` · KPI·CTA·quick menu · 콘솔 #130 0 | #532 · `clientDashboardRoutes` Jest ☑ | [ ] | ROLE-01 |
| 5 | Consultant V2 웹 | CONSULTANT 로그인 → `/consultant/dashboard-v2` · B0KlA KPI·QuickAction · 1280/414 반응형 | #534+#539 `a02f3843f` ☑ | [ ] | ROLE-02 |
| 6 | Consultant Expo 홈 | Expo dev client / `internal-dev` APK · consultant 홈 탭 · KPI·NextSession·Urgent·Quick×5 · OTA **publish 금지** | #544 `482e7e7a0` · #545 `419a0177d` · **ROLE-04** 4 suites/**32** tests ☑ | [ ] | CP-6b · G3-6 report-only |
| 7 | 거버넌스 | prod workflow·EAS OTA publish **미실행** · tenant URL(`mindgarden.dev…`) 필수 | GATE-04 ☑ · H1~H3 documented | [x] | dev only |

**서명**: _______________ · **일자**: 2026-07-13 · **환경**: `https://mindgarden.dev.core-solution.co.kr` · **develop**: `419a0177d`

---

## GATE-03 evidence 표 (자동 vs 수동 · @ `419a0177d`)

| 항목 | CP/Seq | Jest/PR evidence | 7/13 수동 절차 (1줄) | 상태 |
|------|--------|------------------|---------------------|------|
| parallel-4 dev smoke | CP-1 · GATE-01 | E2E ☑ · run `28855153365` @ `c65d9f326` | (완료) tenant URL A1~A5 | ☑ 자동 |
| SchedulePendingList BOOKED | CP-2 · DASH-02 | #541 `45a9d0d3c` · `SchedulePendingList.g1-02` ☑ | (완료) B1~B5 dev | ☑ 자동 |
| G1-02 위젯 guard | CP-3 · DASH-01~04 | **6 suites · 57 tests** PASS ☑ @ `419a0177d` · #543 · bundle `main.4278ef57.js` | **#1** C1-1~C1-7 @ `/admin/dashboard` | ☐ 사용자 |
| Jest·Must-not gate | CP-4 · DASH-08 | **6 suites · 57 tests** PASS @ `419a0177d` | — | ☑ 자동 |
| dark-c3b P1 (3 routes) | CP-5 · ADM-01 | `adminDarkMode.cascade` ☑ @ `419a0177d` · #540 | **#2** E1~E4 다크 cascade 스크린 | ☐ 사용자 |
| Header P2 6 routes | HF-02 · CP-6 | headerDedup **7/7** ☑ · #515+#522 · overnight dev F1~F6 ☑ | (완료) §F | ☑ 자동+수동 |
| Client dashboard v1.3 | ROLE-01 | #532 · routes Jest ☑ | **#4** G1 @ `/client/dashboard` | ☐ 사용자 |
| Consultant V2 웹 | ROLE-02 | #534+#539 ☑ | **#5** G2 @ `/consultant/dashboard-v2` | ☐ 사용자 |
| Consultant Expo P0-3~4 | ROLE-03 · CP-6b | #544+#545 · **ROLE-04** 4 suites · **32/32** Jest ☑ @ `419a0177d` | **#6** G3 dev client 홈 스모크 | ☐ 사용자 |
| ROLE-03 P0-2 Renewal | ROLE-03 | **defer** post-GATE-03 | — | — (out) |
| prod deploy 미실행 | GATE-04 | governance ☑ | (완료) H2 | ☑ 자동 |

**Jest 재실행 명령 (core-tester 2026-07-08)**

```bash
# DASH-08 (CP-4)
cd frontend && CI=true npx craco test --watchAll=false \
  --testPathPattern="SchedulePendingList.g1-02|adminDashboardWidgets.density|KpiFlipCard|DepositPendingList.g1-02|adminDarkMode.cascade"

# HF-02 headerDedup (CP-6)
cd frontend && CI=true npx craco test --watchAll=false --testPathPattern="headerDedup"

# ROLE-04 Expo consultant home (CP-6b)
cd expo-app && CI=true npm run test:utils -- --watchAll=false \
  --testPathPattern="consultantHome|useConsultantHome"
```

---

## 미완 CP 목록 (7/13 D-day 기준)

| CP | Work Package | 자동 evidence | 사용자 검수 | 잔여 |
|----|--------------|---------------|-------------|------|
| **CP-1** | GATE-01 parallel-4 smoke | ☑ E2E · HANDOFF | — | **완료** |
| **CP-2** | DASH-02 SchedulePendingList | ☑ #541 · Jest | — | **완료** |
| **CP-3** | DASH-01~04 위젯·다크 | ☑ G1-02 widget guard 6 suites · 57/57 @ `419a0177d` · #543 | ☐ **C1** PR-DASH-05 | 사용자 #1 |
| **CP-4** | DASH-08 Jest gate | ☑ 57/57 @ `419a0177d` | — | **완료** |
| **CP-5** | ADM-01 dark-c3b | ☑ `adminDarkMode.cascade` @ `419a0177d` · #540 | ☐ **E1~E4** | 사용자 #2 |
| **CP-6** | HF-02 header 6 routes | ☑ headerDedup 7/7 · F1~F6 dev | ☑ overnight | **완료** |
| **CP-6b** | ROLE-03 Expo P0-3~4 | ☑ #544+#545 · ROLE-04 4 suites · 32/32 @ `419a0177d` | ☐ **G3** Expo 홈 | 사용자 #6 |
| **CP-7** | GATE-03 사용자 sign-off | ☑ 시트·evidence 준비 | ☐ **#1·#2·#4·#5·#6** | **7/13** |

**ROLE-01·02 수동**: CP-7에 포함 — G1(#4)·G2(#5) 각 1회 dev 스모크.

---

## 7/13 D-day 잔여 5일 일정 (사용자 검수만 · KST)

> **기준일**: 2026-07-08 (수) · **sign-off**: 2026-07-13 (월) · **prod/EAS OTA 금지**

| 일자 | 사용자 검수 | GATE-03 시트 # | 예상 소요 |
|------|-------------|----------------|-----------|
| **07-09 (목)** | Admin G1-02 대시보드 — C1-1~C1-7 · 1280/414 · 다크 | **#1** | ~45분 |
| **07-10 (금)** | dark-c3b P1 — sessions·wellness·common-codes 다크 cascade | **#2** | ~30분 |
| **07-11 (토)** | Client v1.3 + Consultant V2 웹 — `/client/dashboard` · `/consultant/dashboard-v2` | **#4** · **#5** | ~40분 |
| **07-12 (일)** | Consultant Expo 홈 — dev client/APK · KPI·NextSession·Urgent·Quick×5 | **#6** | ~30분 |
| **07-13 (월)** | 잔여 재확인 · GATE-03 시트 서명 · CP-7 close | **#1~#6** | ~20분 |

**버퍼**: 이슈 발견 시 티켓화 — **P0-2 Renewal은 defer** 유지 · 범위 축소 시 ROLE-01/02만 우선.

---

## 변경 이력

| 시각 (KST) | 변경 |
|------------|------|
| 2026-07-07 | GATE-02 초안 — CP 5건 evidence · develop `5f1e478f5` · bundle `main.908673a1.js` · SEQ_28 형식 (core-planner) |
| 2026-07-08 | Overnight CP — HF-02 F1~F6 dev ☑ @ bundle `main.4278ef57.js` · G3 ROLE-03 Expo 섹션 · GATE-03 sign-off 시트 초안 (core-tester) |
| 2026-07-08 | GATE-03 evidence 초안 — Jest @ `419a0177d` 재실행 (DASH-08 57/57 · headerDedup 7/7 · ROLE-04 32/32) · evidence 표·미완 CP·5일 일정 (core-tester) |
| 2026-07-08 | HF-02·GATE-03 검수 Jest evidence 반영 — §C 6/57 · §E cascade · §F headerDedup 7/7 · §G Expo 4/32 @ `419a0177d` · bundle `main.4278ef57.js` · C1·E1~E4·G1~G3 사용자 ☐ 유지 (core-coder) |
| 2026-07-08 | GATE-03 1-pager·DASH-10 evidence pack 신규 — cross-link 추가 (docs-only) |
