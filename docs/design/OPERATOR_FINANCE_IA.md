# OPERATOR 재무 IA — Phase 1

**대상**: 상담센터 센터장/원장(운영자) · 회계사 아님  
**라우트**: `/erp/dashboard` (LNB 「운영 현황」라벨 Phase 3까지 유지)  
**브랜드**: Core Solution Clinic-OS (MindGarden은 테스트 테넌트일 뿐 — 로고/히어로에 넣지 않음)

---

## Operator job

> **이번 달에 돈이 어떻게 됐지?**

수입·지출·잔여를 클리닉 언어로 한눈에 보고, 장부·상담사 지급·센터 경비로 바로 이동한다.

---

## Target IA

| 영역 | 클리닉 언어 | 라우트/비고 |
|------|-------------|-------------|
| 홈 | 이번 달 돈 | `/erp/dashboard` |
| 흐름 | 들어온 돈 · 나간 돈 · 남은 돈 | Hero KPI |
| 상담료·패키지 | (Phase 3 money group) | — |
| 상담사 지급 | 상담사 지급 | `/erp/salary` |
| 센터 경비 | 센터 경비 | `/erp/purchase` |
| 장부 | 장부 | `/erp/financial` |
| 세무사용 자료 | (세무사용) | Phase 2+ · 홈에서 리드 금지 |

---

## 6 operator metrics

**Hero (필수 3)**

1. 들어온 돈 — 이번 달 수입 (`FINANCE_DASHBOARD`)
2. 나간 돈 — 이번 달 지출
3. 남은 돈 — 수입 − 지출 (**순이익이라고 라벨하지 않음**)

**Secondary (소스 있을 때만)**

4. 아직 안 들어온 상담료 — `GET /api/v1/admin/mappings/pending-payment` (`packagePrice` 합)
5. 상담사 지급 예정 — `GET /api/v1/admin/salary/calculations/period` (미지급 합)
6. 이번 달 환불 — 당월 `categoryBreakdown`의 `CONSULTATION_REFUND` 등 환불 카테고리

소스·필드가 없으면 **카드 생략**. 숫자 날조 금지.

---

## Visualization rules

1. **메인**: 최근 12개월 들어옴 vs 나감 **grouped bar** (`FINANCE_MONTHLY_REPORT` × 12개월).
2. Empty: `최근 12개월에 등록된 수입·지출이 없습니다.`
3. Optional: 이번 달 나간 돈 구성(급여 / 임대·관리 / 환불 / 기타) — 월간 리포트·카테고리 페이로드에 있을 때만.
4. 최근 거래 테이블 유지 — 컬럼: 일자, 들어온 돈/나간 돈, 내용.
5. 홈에서 **분개·차변/대변·대차대조표·계정과목·조달 KPI**로 리드하지 않음.
6. 회계 엔진(분개/원장/재무제표)은 백엔드 역량으로 유지 가능하나 **OPERATOR UI는 이를 앞에 두지 않음**.

---

## Clinic-OS 레이아웃 스펙 (Phase 1)

- Shell: `AdminCommonLayout` → `ErpPageShell` (quiet header는 페이지 전용 — ErpFilterToolbar·ContentKpiRow 그리드 핏 금지)
- 타이틀: `이번 달 돈` — 테넌트 서브타이틀·`(터넌트: …)` 금지
- 기간: 세그먼트 1개만 — `이번 달` / `지난달` / `올해`
- 토큰: slate `#0F172A` / dusty teal `#0E5F5A`·`#0F766E` · MGChart · MGButton · KpiNumeral · 4-step type (축소 금지)
- 금지: emoji, decorative sprites, left color bars, 신규 팔레트, MindGarden 히어로 브랜딩, 조달 KPI, sync/백필, 퀵액션 icon grid
- 보조 링크 최대 3 — 장부 `/erp/financial` · 상담사 지급 `/erp/salary` · 센터 경비 `/erp/purchase`
- 상세 시각 스펙: `docs/design-system/SCREEN_SPEC_OPERATOR_FINANCE_MONEY_COCKPIT.md`

---

## 이 PR 페이지 스켈레톤 5단

운영자 홈(`/erp/dashboard`)을 stacked-widget가 아닌 **머니 콕핏**으로 완전 재구축할 때의 강제 순서.

1. **Quiet header** — 제목 `이번 달 돈` + 기간 세그먼트(이번 달/지난달/올해) 1개. 새로고침 secondary row·테넌트 서브 없음.
2. **Hero band** — full width · `들어온 돈` / `나간 돈` / `남은 돈` 거대 금액 3(`KpiNumeral`, 「순이익」라벨 금지).
3. **Main stage** — 최근 12개월 들어옴 vs 나감 grouped bars. 페이지 최대 세로(`clamp(420px, 48vh, 560px)`, leftover 240px 금지).
4. **Workbench** — 좌 `이번 달 돈이 나간 곳`(없으면 생략) · 우 `지금 손볼 일`(최대 3행, 숫자 없으면 행·블록 생략). 비율 7:5.
5. **Ledger strip** — `최근 돈 움직임`: 일자 · 내용 · 들어온/나간 금액. 매핑·카테고리·상태·작업 컬럼 기본 비노출.

**Mobile**: hero stack → chart → mix → 손볼 일 → ledger (1열).

---

## Phase 2 / 3

### Phase 2 — ONE operator ledger (`/erp/financial`) ✅ additive status

| 항목 | 상태 | 비고 |
|------|------|------|
| Canonical `/erp/financial` = 들어온 돈 · 나간 돈 | [x] | Quiet header · summary strip · table/calendar · `돈 기록` |
| `/admin/erp/financial` → `/erp/financial` (query 보존) | [x] | `RedirectWithSearch` |
| 회계 도구는 `세무사용 자료` disclosure | [x] | 분개·원장·재무제표·리포트·정산 — equal tab 아님 |
| moneyCockpit / `operatorFinanceDashboardStrings` 비겹침 | [x] | Phase 1 파일 미수정 |
| LNB 라벨 | [ ] | Phase 3 — `거래·정산` 유지 가능 |

- **Phase 3**: LNB 클리닉 라벨 + 패키지 요금 money group

---

## Explicit

Accounting engine may remain; **operator UI must not lead with it.**
