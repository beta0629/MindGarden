# GATE-03 — 사용자 sign-off 시트 (1페이지 · dev only)

**Gate ID**: `GATE-03` · **환경**: dev only — `https://mindgarden.dev.core-solution.co.kr`  
**develop**: `419a0177d` (#545) · **dev FE bundle**: `main.4278ef57.js` · deploy run [`28875323851`](https://github.com/beta0629/MindGarden/actions/runs/28875323851)  
**prod sign-off 없음** · **EAS OTA publish 금지** · **ROLE-03 P0-2 Renewal → post-GATE-03 defer**

**SSOT (상세)**: [`GATE_02_DEV_INTEGRATION_CHECKLIST_20260713.md`](./GATE_02_DEV_INTEGRATION_CHECKLIST_20260713.md) · evidence pack: [`DASH_10_EVIDENCE_PACK_20260713.md`](./DASH_10_EVIDENCE_PACK_20260713.md)

**공통 선행**: ADMIN/CLIENT/CONSULTANT 각 역할 로그인 · 테넌트 URL 필수 · 콘솔 React #130·blocking error 0 · bundle `main.4278ef57.js` 확인

---

## 이미 완료 (간단 표기)

| 항목 | evidence | 상태 |
|------|----------|------|
| HF-02 F1~F6 header 6 routes | dev Playwright @ `mindgarden.dev` · headerDedup **7/7** @ `419a0177d` | ☑ |
| 거버넌스 H1~H3 | prod workflow 미실행 · tenant URL SSOT · role 4종 | ☑ |

---

## C1 — Admin G1-02 (`/admin/dashboard` · PR-DASH-05)

- [ ] **C1-1** — KPI Zone 1280px: KpiFlipCard **4-grid** 가로 스크롤 없이 노출
- [ ] **C1-2** — 다크 토글 ON/OFF: KPI·Pipeline 색상 `var(--mg-dark-*)` cascade
- [ ] **C1-3** — CoreFlowPipeline: 단계 데이터 렌더 · 클릭/터치 타겟 **≥44px**
- [ ] **C1-4** — Pending Lists: Schedule vs Deposit **데이터 분리** · ListTableView(Compact)
- [ ] **C1-5** — Chart.js (metrics 있을 때): 다크 전환 시 축·그리드·툴팁 테마 동기화
- [ ] **C1-6** — 환불 StatCard: 분산 CTA 0 · **단일 CTA** (환불 관리 가기)
- [ ] **C1-7** — ProfileCard 오용: 목록형 위젯에 ProfileCard **0건**

---

## E1 — dark-c3b P1 (ADM-01 · #540)

- [ ] **E1** — `/admin/sessions` 다크 ON: SessionManagement 모달·테이블·폼 cascade · hex 0
- [ ] **E2** — `/admin/wellness` 다크 ON: WellnessManagement B0KlA + 폼·테이블 cascade
- [ ] **E3** — `/admin/common-codes` 다크 ON: CommonCodeManagement 테이블·필터 cascade
- [ ] **E4** — 라이트 복귀: 토글 OFF → C-2/C-2b 회귀 0

---

## G1 — Client Dashboard v1.3 (ROLE-01 · `/client/dashboard`)

- [ ] **G1-1** — Client 로그인 → 대시보드: KPI·CTA·quick menu · `clientDashboardRoutes.js` SSOT (#532)
- [ ] **G1-2** — App/Web: 웹↔Expo cross-import 0 · API-only 공유
- [ ] **G1-3** — 콘솔: React #130 0

---

## G2 — Consultant Dashboard V2 웹 (ROLE-02 · `/consultant/dashboard-v2`)

- [ ] **G2-1** — Consultant 로그인: B0KlA ContentKpiRow·QuickActionBar · AdminCommonLayout children
- [ ] **G2-2** — P0-6 polish (#539): spacing·ListTableView(Compact) · `a02f3843f`
- [ ] **G2-3** — 1280/414: 반응형 회귀 0

---

## G3 — Consultant Expo home (ROLE-03 P0-3~4 · #544+#545)

- [ ] **G3-1** — Expo dev 로그인 → 홈 탭: KPI StatCard row · 인사·요약
- [ ] **G3-2** — NextSessionCard: 다음 상담 카드·empty state
- [ ] **G3-3** — UrgentClientBanner: 고위험 내담자 배너·CTA
- [ ] **G3-4** — QuickActionBar: **5개** 액션 (일정·가용시간·메시지·일지·급여)
- [ ] **G3-5** — App/Web 분리: 웹↔Expo cross-import **0** · API-only (`useConsultantHome`)
- [ ] **G3-6** — Expo OTA: **publish 금지** — channel report only (`eas.json`: development · preview · internal-dev)

---

## 서명

| | |
|---|---|
| **검수자** | _______________ |
| **일자** | **2026-07-13** |
| **환경** | `https://mindgarden.dev.core-solution.co.kr` · develop `419a0177d` |
| **prod 승인** | **없음** (dev sign-off only) |
