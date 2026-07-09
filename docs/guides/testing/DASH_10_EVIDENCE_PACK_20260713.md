# DASH-10 — Design Freeze Sign-off evidence pack (dev only)

**Work Package**: `DASH-10` · **유형**: Design Freeze Sign-off evidence pack  
**환경**: **dev only** — `https://mindgarden.dev.core-solution.co.kr`  
**develop HEAD**: `b97c0d05e` (#555 client-dashboard CL01) + **#548** Consultant ENHANCED  
**dev FE bundle**: `main.9047d69c.js`  
**prod deploy / EAS OTA publish**: **금지** · **prod sign-off 없음**

**참조**: [`GATE_02_DEV_INTEGRATION_CHECKLIST_20260713.md`](./GATE_02_DEV_INTEGRATION_CHECKLIST_20260713.md) · [`GATE_03_USER_SIGNOFF_SHEET_20260713.md`](./GATE_03_USER_SIGNOFF_SHEET_20260713.md) · [`COMPREHENSIVE_IMPROVEMENT_WBS.md`](../../project-management/2026-07-07/COMPREHENSIVE_IMPROVEMENT_WBS.md)

---

## Deploy run IDs

| Gate / WP | Run ID | merge SHA | bundle | 비고 |
|-----------|--------|-----------|--------|------|
| **GATE-01** parallel-4 dev smoke | [`28855153365`](https://github.com/beta0629/MindGarden/actions/runs/28855153365) | `c65d9f326` | `main.0ef5994d.js` | tenant URL E2E baseline |
| **DASH-02** SchedulePendingList | [`28871900145`](https://github.com/beta0629/MindGarden/actions/runs/28871900145) | #541 `45a9d0d3c` | — | BOOKED API 와이어링 |
| **HF-02** header P2 initial | [`28858525028`](https://github.com/beta0629/MindGarden/actions/runs/28858525028) | `aaa9ff883` (#515+#522) | — | 6-route header dedup |
| **Latest FE** (#543 DASH-03~04) | [`28875323851`](https://github.com/beta0629/MindGarden/actions/runs/28875323851) | `8bf5ace0d` (#543) | **`main.4278ef57.js`** | #545 Expo-only — FE redeploy 불필요 |
| **G2 Consultant ENHANCED** (#548) | — | — | **`main.2d20a7a4.js`** | GATE-03 G2 초기 Playwright @ 2026-07-08 |
| **G1·G2 GATE-03 follow-up** (#555) | [`28997842001`](https://github.com/beta0629/MindGarden/actions/runs/28997842001) | `b97c0d05e` | **`main.9047d69c.js`** | dev FE bundle SSOT · GATE-03 G2 v2.1 C01 — [`GATE_03` G2 evidence](./GATE_03_USER_SIGNOFF_SHEET_20260713.md#g2--consultant-dashboard-v2-웹-role-02--consultantdashboard--548-enhanced) |

---

## Jest evidence @ develop `419a0177d`

| Gate / WP | Suites | Tests | 명령 요약 | 상태 |
|-----------|--------|-------|-----------|------|
| **DASH-08** (CP-4) | 6 | **57** | `testPathPattern="SchedulePendingList.g1-02\|adminDashboardWidgets.density\|KpiFlipCard\|DepositPendingList.g1-02\|adminDarkMode.cascade"` | ☑ PASS |
| **HF-02** headerDedup (CP-6) | 7 | **7/7** | `testPathPattern="headerDedup"` | ☑ PASS |
| **ROLE-04** Expo consultant home (CP-6b) | 4 | **32** | `cd expo-app && testPathPattern="consultantHome\|useConsultantHome"` | ☑ PASS |
| **G2** Consultant V2 web (GATE-03) | 3 | **3/3** | `gate03-g2-consultant-dashboard.spec.ts` @ `mindgarden.dev` · bundle `main.9047d69c.js` | ☑ PASS |

**ROLE-04 suites**: `useConsultantHome.test.ts` · `consultantHomeKpi.test.ts` · `consultantHomeComponentUi.test.ts` · `consultantHomeApiNormalize.test.ts` · `expo-app/` ↔ `frontend/` cross-import **0**

---

## Merged PR #526–#545

| # | Title | merge SHA (short) | WP mapping |
|---|-------|-------------------|------------|
| [#526](https://github.com/beta0629/MindGarden/pull/526) | feat(admin): G1-02 dashboard KPI·pending lists (PR-DASH) | `c96488b80` | DASH-01 |
| [#527](https://github.com/beta0629/MindGarden/pull/527) | feat(client): PR-C1 shell + G-14 header/wellness hotfix (PR-B) | `aaa9ff883` | HF / CLN |
| [#528](https://github.com/beta0629/MindGarden/pull/528) | chore(admin): CLN-01 orphan redirects + dark-c3b (PR-C) | `025dafdc7` | CLN-01 · ADM |
| [#529](https://github.com/beta0629/MindGarden/pull/529) | test(admin): PR-DASH-02 SchedulePendingList 와이어링 회귀 방지 | `76103c3d8` | DASH-02 |
| [#530](https://github.com/beta0629/MindGarden/pull/530) | feat(consultant-dashboard): ConsultantDashboardV2 B0KlA content blocks | `27eb9dbae` | ROLE-02 |
| [#531](https://github.com/beta0629/MindGarden/pull/531) | docs(wbs): UI/UX Quality Gate + App/Web 분리 SSOT (7/13) | `dc1eae2f9` | docs |
| [#532](https://github.com/beta0629/MindGarden/pull/532) | feat(client-dashboard): wire clientDashboardRoutes SSOT for KPI·CTA·quick menu | `6467a1150` | ROLE-01 |
| [#533](https://github.com/beta0629/MindGarden/pull/533) | hotfix(auth): GATE-01 ProtectedRoute RoleUtils SSOT | `edaa0528a` | GATE-01 |
| [#534](https://github.com/beta0629/MindGarden/pull/534) | feat(consultant): PR-D Consultant V2 B0KlA + App/Web route SSOT | `8646d892e` | ROLE-02 · SAFE-03 |
| [#535](https://github.com/beta0629/MindGarden/pull/535) | hotfix(auth): GATE-01 session.js import cycle fix | `092cb71fd` | GATE-01 · SAFE |
| [#537](https://github.com/beta0629/MindGarden/pull/537) | docs(handoff): 2026-07-07 EOD handoff + WBS §1 EOD 갱신 | `07d540a51` | docs |
| [#539](https://github.com/beta0629/MindGarden/pull/539) | feat(consultant): P0-6 dashboard V2 B0KlA polish (+89/-14) | `a02f3843f` | ROLE-02 |
| [#540](https://github.com/beta0629/MindGarden/pull/540) | feat(admin): ADM-01 dark-c3b P1 cascade 잔여 보완 | `5f1e478f5` | ADM-01 |
| [#541](https://github.com/beta0629/MindGarden/pull/541) | fix(admin): DASH-02 SchedulePendingList BOOKED API 와이어링 | `45a9d0d3c` | DASH-02 |
| [#542](https://github.com/beta0629/MindGarden/pull/542) | docs(gate-02): 7/13 dev 통합 검수 체크리스트 + WBS/HANDOFF 링크 | `f0e4a5e30` | GATE-02 |
| [#543](https://github.com/beta0629/MindGarden/pull/543) | fix(admin): DASH-03~04 dark cascade·1280px·safeDisplay polish | `8bf5ace0d` | DASH-03~04 |
| [#544](https://github.com/beta0629/MindGarden/pull/544) | feat(expo): ROLE-03 consultant home P1 hooks·organisms | `482e7e7a0` | ROLE-03 |
| [#545](https://github.com/beta0629/MindGarden/pull/545) | feat(expo): wire consultant home P1 index (ROLE-03 follow-up) | `419a0177d` | ROLE-03 |

> **#536** CLOSED (superseded by #535) — merged 아님.

### Open PR

| # | Title | WP | 상태 |
|---|-------|-----|------|
| [#546](https://github.com/beta0629/MindGarden/pull/546) | feat(expo): ROLE-04 consultant home gaps — normalize, KPI, Jest | ROLE-04 | **OPEN** |

---

## Overnight worker cross-ref

| commit | WP | agent | evidence |
|--------|-----|-------|----------|
| `aff66193` | HF-02 · GATE-03 | `815a4d44` | F1~F6 dev Playwright PASS @ `mindgarden.dev` · bundle `main.4278ef57.js` · F1 CLN-01 redirect → `/admin/mapping-management` h1×1 「매칭 관리」 · headerDedup Jest **7/7** @ `419a0177d` |
| `cea8f76f` | ROLE-04 | `98aa1abd` | Expo Jest **4 suites / 32 tests PASS** @ `419a0177d` · cross-import **0** |
| `7b2deae4` | G2 GATE-03 | core-tester | CONSULTANT login **200** (비번 복구) · G2-1~G2-3 Playwright **3/3 PASS** @ `main.2d20a7a4.js` · screenshots [`evidence/gate03-g2-20260708/`](./evidence/gate03-g2-20260708/) |

---

## Critical Path status (CP-1~6b · CP-7)

| CP | Work Package | 자동 evidence | 사용자 검수 | 상태 |
|----|--------------|---------------|-------------|------|
| **CP-1** | GATE-01 parallel-4 smoke | ☑ E2E · run `28855153365` | — | ☑ |
| **CP-2** | DASH-02 SchedulePendingList | ☑ #541 · Jest | — | ☑ |
| **CP-3** | DASH-01~04 위젯·다크 | ☑ density Jest · #543 | ☐ C1 PR-DASH-05 | 사용자 |
| **CP-4** | DASH-08 Jest gate | ☑ 57/57 @ `419a0177d` | — | ☑ |
| **CP-5** | ADM-01 dark-c3b | ☑ cascade Jest · #540 | ☐ E1~E4 | 사용자 |
| **CP-6** | HF-02 header 6 routes | ☑ headerDedup 7/7 · F1~F6 dev | ☑ overnight | ☑ |
| **CP-6b** | ROLE-03 Expo P0-3~4 | ☑ #544+#545 · ROLE-04 32 tests | ☐ G3 Expo 홈 | 사용자 |
| **CP-6c** | ROLE-02 Consultant V2 web G2 | ☑ Playwright G2-1~G2-3 @ `main.9047d69c.js` | ☐ G2 사용자 sign-off | 자동 ☑ |
| **CP-7** | GATE-03 사용자 sign-off | ☑ 시트·evidence 준비 | ☐ **7/13** C1/E/G1~G3 | **잔여** |

**ROLE-03 P0-2 Renewal API 교정**: **post-GATE-03 defer** — blocking 아님

---

## prod / EAS OTA 금지 (재확인)

- **prod deploy workflow**: 미실행 · `GATE-04` 유지
- **EAS OTA publish**: 금지 — `eas.json` channel report only (development · preview · internal-dev)
- 본 evidence pack은 **dev Design Freeze sign-off** 용도이며 prod 승인을 포함하지 않음

---

## 변경 이력

| 시각 (KST) | 변경 |
|------------|------|
| 2026-07-08 | DASH-10 evidence pack 초안 — deploy·Jest·PR #526–#545 · CP 표 · overnight cross-ref (docs-only) |
| 2026-07-08 | G2 GATE-03 — Playwright 3/3 PASS @ `main.2d20a7a4.js` (#548) · evidence screenshots · GATE_03 cross-link |
| 2026-07-09 | dev FE bundle SSOT `main.9047d69c.js` — deploy run [`28997842001`](https://github.com/beta0629/MindGarden/actions/runs/28997842001) @ `b97c0d05e` · G2 Playwright QuickAction 5 + urgent ListTableView testid (v2.1 C01) |
