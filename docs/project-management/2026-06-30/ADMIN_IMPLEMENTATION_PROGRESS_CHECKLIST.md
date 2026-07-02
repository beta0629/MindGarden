# MindGarden 어드민 UX/시각화 — 구현 진행 체크리스트

**작성일**: 2026-07-01  
**담당**: core-planner (갱신 주체)  
**거버넌스**: [`ADMIN_IMPLEMENTATION_GOVERNANCE.md`](./ADMIN_IMPLEMENTATION_GOVERNANCE.md)  
**Good SHA**: develop `f5b83ca81` · prod `d681275bd` · rollback 금지 패턴 `0676dfa2d`

**상태 범례**: ☐ pending · ◐ in_progress · ☑ done

**V1+ 정책**: V0-user ☑ 완료 (2026-07-01) — V1+ 착수 가능.

---

## P0 — 거버넌스·설계 감리 (Week 1)

| Phase | Seq | 작업명 | 담당 | 감독者 (sign-off) | 선행조건 | DoD | good SHA / rollback SHA | 상태 | dev/prod run · 사용자 검수 |
|-------|-----|--------|------|-------------------|----------|-----|-------------------------|------|---------------------------|
| P0-doc | 1 | GOOD SHA baseline 문서화 (`INTEGRATED_SCHEDULE_GOOD_SHA` 요약) | planner | **planner** | — | develop `93c39c35b`·prod `488b0dc0f`·`61e6bb82d`·금지 `0676dfa2d` 명시; §7.2 gate 항목 인용; governance와 교차 링크 | good: `93c39c35b` / rollback: 단일 revert only | ☑ done | — |
| P0-doc | 2 | 본 progress checklist 작성 | planner | **planner** | Seq 1 | Phase·담당·감독·DoD·상태 열 완비; V0~V1+ 구분 | — | ☑ done | — |
| P0-doc | 3 | governance 문서 작성 (RACI·병렬 시퀀스) | planner | **planner** | Seq 1 | RACI 표; mermaid 2종; 1 PR=1 가설; 병렬 tester gate 규칙 | — | ☑ done | — |
| P0-design-review | 4 | 통합일정 handoff vs 현재 코드 gap 분석 (readonly) | designer | **designer** → planner 합류 | Seq 1~3 ☑ | gap list only; `SidePeekShell`·`DensityToggle`·`SessionProgress` 존재/부재; R-PARTIES·Must not 체크; **코드 변경 없음** | baseline: `93c39c35b` | ☑ done | Task [066a8c23](066a8c23-f0de-4ae3-8a93-d679f59c9728) · V0-coder 착수 **가능** |
| P0-component | 5 | SidePeekShell·DensityToggle SSOT 중복 검토 (제안서) | component-manager | **component-manager** → designer | Seq 4 gap 초안 | 기존 컴포넌트 vs 신규; reuse 권고; 문서만 | — | ☐ pending | — |

---

## V0 — 통합일정 Pilot ONLY

> **범위**: `IntegratedMatchingSchedule` only — SidePeekShell stub/MVP, SessionProgress on card. (DensityToggle **제거** — 2026-07-01 사용자 결정: 표준 레이아웃만 유지)  
> **착수 조건**: P0-design-review **designer sign-off** + planner synthesis.

| Phase | Seq | 작업명 | 담당 | 감독者 (sign-off) | 선행조건 | DoD | good SHA / rollback SHA | 상태 | dev/prod run · 사용자 검수 |
|-------|-----|--------|------|-------------------|----------|-----|-------------------------|------|---------------------------|
| V0-coder | 6 | `SidePeekShell` stub 또는 MVP (360px, R-PEEK) | coder | **designer** (감리) | Seq 4 ☑, Seq 5 권고 반영 | handoff §3.1 Peek; 행 클릭 시 peek; UnifiedModal 전체 전환 금지; 1 PR | branch from `93c39c35b` | ☑ done | develop push 후 dev FE 배포 |
| V0-coder | 7 | 사이드바 카드 `SessionProgress` / `SessionProgressIndicator` 주입 | coder | **designer** | Seq 6 또는 동일 PR 정책 준수 | L-B progress; stripe 금지; aria-valuenow; 회기/결제 시각화 | `8d5b8a073` | ☑ done | prod 반영 |
| V0-coder | 8 | ~~`DensityToggle`~~ — **cancelled/skipped** (표준 레이아웃만 유지; 토글·localStorage 제거) | coder | **designer** | Seq 6~7 | ~~comfortable default; compact 토글~~ → **제거됨** (2026-07-01); 380px·필터 1줄·comfortable 카드 유지 | 동일 | ⏭ skipped | 사용자: 「표준만 진행」 |
| V0-design-gate | 9 | V0 구현 디자인 감리 (handoff 대비) | designer | **designer** | Seq 6~8 PR | R-PARTIES hide 없음; Must not 0건; B0KlA 토큰 | — | ☑ done | V0-user 동반 sign-off |
| V0-tester | 10 | QA gate — PER_PAGE G1-01 DoD + Must not grep | tester | **tester** | Seq 9 ☑ | §7.2: 380px·필터 1줄·20+ row 이름 0% 손실·DnD·1280/768·#130 0건·Primary1+overflow; Jest 해당 범위 | good: `488b0dc0f` | ☑ done | Jest sidePeek·SessionProgress |
| V0-deploy-dev | 11 | develop 반영 | deployer | **deployer** → planner | Seq 10 ☑ | dev deploy run ID 기록; 스크린 아카이브 | — | ☑ done | dev run: `28491931243` · prod run: `28500083503` |
| V0-user | 12 | 사용자 검수 (dev 스크린 3종 + 시나리오) | 사용자 | **사용자** | Seq 11 ☑ | comfortable default 확인; compact off 기본; 이름 가독성; prod cherry-pick **전** sign-off | prod good: `488b0dc0f` | ☑ done | 2026-07-01 사용자 prod 검수 OK |

### V0 PER_PAGE DoD 요약 (G1-01 — tester Seq 10)

- comfortable default (DensityToggle **제거** — 표준 레이아웃 고정)
- side peek prototype (stub 이상)
- 380px sidebar · 필터 칩 1줄 유지
- 20+ row 이름 가시성 손실 0% (tooltip 허용)
- DnD · React #130 · 1280px/768px gate
- good SHA 문서·태그 정합

---

## V1+ — V0-user ☑ 후에만 개시 (checklist 선행 기재)

| Phase | Seq | 작업명 | 담당 | 감독者 | 선행조건 | DoD (요약) | good SHA | 상태 | 비고 |
|-------|-----|--------|------|--------|----------|------------|----------|------|------|
| V1-design | 13 | G2 P0 3화면 handoff (내담자·상담사·스태프) | designer | designer | V0-user ☑ | list+peek wire; Must not | — | ◐ waived | pilot: handoff §3.2 + PER_PAGE G2-01 |
| V1-coder | 14 | G2-01 내담자 default=list + SidePeekShell | coder | designer | Seq 13 ☑ | table default; overflow | `e77ae3512` | ☑ done | route: `/admin/user-management?type=client` |
| V1-coder | 15 | G2-02 상담사 default=list | coder | designer | Seq 13 ☑ | 동일 | `b601dc4eb` | ☑ done | route: `/admin/user-management?type=consultant` |
| V1-coder | 16 | G2-03 스태ff default=list + SidePeekShell | coder | designer | Seq 13 ☑ | Primary1+overflow | `9a8ae8659` | ☑ done | route: `/admin/user-management?type=staff` |
| V1-coder | 16b | G2 smallCard default + 공통 로딩바 | coder | designer | Seq 14~16 | smallCard default | `9e68fd248` | ☑ done | prod |
| V1-tester | 17 | G2 P0 3화면 QA gate (×3 또는 1 suite) | tester | tester | Seq 14~16 | 20+ row; viewMode persist | — | ☐ pending | 병렬 3 PR 시 gate 3 |
| V1-deploy-dev | 18 | develop 반영 | deployer | deployer | Seq 17 ☑ | run ID | — | ☐ pending | dev run: _(pending)_ |
| V1-user | 19 | 사용자 검수 | 사용자 | 사용자 | Seq 18 ☑ | sign-off | — | ☑ done | 2026-07-02 사용자 prod 반영 요청 |
| V2-design | 20 | G1-04 매칭 목록 table-default handoff | designer | designer | V1-user ☑ | MappingListBlock | — | ◐ waived | pilot: PER_PAGE G1-04 + handoff §3 |
| V2-coder | 21 | G1-04 default=table + peek | coder | designer | Seq 20 ☑ | card optional | `e35ab2410` | ☑ done | route: `/admin/mapping-management` |
| V2-coder | 22 | G3 ERP mini-sparkline / status (Financial 등) | coder | designer | V1-user ☑ | L-B 시각화 | — | ☐ pending | G3 default=list 등 |
| V2-tester | 23 | V2 QA gate (매칭 SidePeek) | tester | tester | Seq 21 | PER_PAGE DoD | `e35ab2410` | ☑ done | prod run: `28556626050` |
| V2-coder | 24 | QA follow-up — MappingDetailModal dead code 정리 | coder | designer | Seq 23 ☑ | `handleViewMapping`·Modal wiring 제거; Jest 회귀 0 | `553162e30` | ☑ done | route: `/admin/mapping-management` · dev run: `28558620481` · prod run: `28561691886` · prod `d681275bd` |
| V2-coder | 25 | G1 Dashboard KPI zone 시각화 pilot | coder | designer | Seq 24 ☑ | handoff §Dashboard; 기존 component·토큰 재사용 | `416f54a80` | ☑ done | route: `/admin/dashboard` · PR #447 · dev run: `28558696969` · prod run: `28561691886` · prod `d681275bd` |
| V2-tester | 25b | Dashboard KPI zone Jest gate | tester | tester | Seq 25 ☑ | KpiFlipCard·ContentKpiRow·dashboardKpiSparklineUtils 23 tests PASS | `416f54a80` | ☑ done | Jest 3 suites · 23 passed |
| V2-coder | 26 | G1-05 MappingCard SSOT (Primary1+overflow) | coder | designer | Seq 25 또는 병렬 | PER_PAGE #6 | `f5b83ca81` | ☑ done | prod run: `28561691886` · prod `d681275bd` |
| V3+ | 27+ | AdminCommonLayout 통일·알림 API·Saved View·compact row 재도입(토글 ON만) | designer/coder/tester | planner 합류 | V2 완료 | v2 로드맵 Phase 3~4 | — | ☐ pending | 개별 행 분할 예정 |

---

## 진행 요약 (planner 갱신)

| 마일스톤 | 목표일 | 상태 |
|----------|--------|------|
| P0-doc 완료 | 2026-07-01 | ☑ |
| P0-design-review 완료 | 2026-07-01 | ☑ |
| V0 dev 배포 | 2026-07-01 | ☑ run `28491931243` |
| V0 사용자 sign-off | 2026-07-01 | ☑ prod 검수 OK |
| V1 G2 prod | 2026-07-02 | ☑ `9e68fd248` |
| V2 매칭 SidePeek prod | 2026-07-02 | ☑ `e35ab2410` · QA Seq 23 |
| V2 Seq 24~26 prod | 2026-07-02 | ☑ prod run `28561691886` · main `d681275bd` (Seq 24 dead code · 25 KPI · 26 MappingCard SSOT 일괄) |
| V2 Dashboard KPI pilot | 2026-07-02 | ☑ PR #447 · dev run `28558696969` · Jest gate Seq 25b · prod run `28561691886` |
| V2 MappingCard SSOT | 2026-07-02 | ☑ `f5b83ca81` · prod run `28561691886` |
| V1 착수 | 2026-07-01 | ☑ Seq 14~16 pilot |
| **다음 (pending)** | — | **Seq 22** G3 ERP mini-sparkline |

---

## 변경 이력

| 날짜 | Seq | 변경 |
|------|-----|------|
| 2026-07-01 | 1~3 | P0-doc checklist·governance 초안 ☑ |
| 2026-07-01 | 6 | V0 SidePeekShell stub ☑ — 360px R-PEEK, 카드 상세·row click, Jest |
| 2026-07-01 | 7·10~12 | V0 마감 — SessionProgress·QA·dev/prod deploy·사용자 prod 검수 ☑ |
| 2026-07-01 | 14~16 | V1 G2 list default + SidePeekShell pilot ☑ |
| 2026-07-02 | 19 | V1-user ☑ — 사용자 prod 반영 요청 |
| 2026-07-02 | 21 | V2 G1-04 매칭 default=table + SidePeekShell pilot ☑ |
| 2026-07-02 | 23 | V2 QA gate (매칭) ☑ — prod run `28556626050` |
| 2026-07-02 | 24 | MappingDetailModal dead code ☑ — `553162e30` · dev run `28558620481` · prod run `28561691886` · main `d681275bd` |
| 2026-07-02 | 25 | Dashboard KPI zone pilot ☑ — PR #447 · dev run `28558696969` · prod run `28561691886` · main `d681275bd` |
| 2026-07-02 | 25b | Dashboard KPI Jest gate ☑ — KpiFlipCard·ContentKpiRow·dashboardKpiSparklineUtils 23 passed |
| 2026-07-02 | 26 | MappingCard SSOT ☑ — `f5b83ca81` · prod run `28561691886` · main `d681275bd` |
