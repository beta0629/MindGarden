# MindGarden 어드민/상용화 UX — 전체적 문제 디테일 분석 + 개선 로드맵

**작성일**: 2026-06-30  
**담당**: core-planner (오케스트레이션·기획)  
**범위**: 어드민·ERP·테넌트 포털 전반 — 사이드바 단일 화면을 넘어 **상용 B2B SaaS 대비 UX·프로세스·거버넌스**  
**코드 변경**: 없음 (본 문서만)

### 필수 참조 (인용)

| 문서 | 역할 |
|------|------|
| `docs/project-management/ADMIN_UI_DENSITY_AUDIT_20260627.md` | 24건 밀도 anti-pattern inventory, P0 3화면, Modify-first 정책 |
| `docs/project-management/2026-06-30/INTEGRATED_SCHEDULE_UX_BENCHMARK.md` | 9제품 벤치마크, P0-1~P0-3 로드맵 |
| `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` | core-planner→서브에이전트 위임·테스터 게이트 |
| `docs/project-management/2026-06-30/INTEGRATED_SCHEDULE_SIDEBAR_CARD_COMPACT_ROW_SPEC.md` | compact row 실험 스펙·실패 교훈 |
| Git `0676dfa2d` (revert 5건 묶음) · `93c39c35b` (선택 복원) | 2026-06-30 방법론 실패 사례 |

---

## 목차

1. [Executive Summary](#1-executive-summary)  
2. [문제 트리 (3층)](#2-문제-트리-3층)  
3. [오늘 사고 Root Cause Analysis](#3-오늘-사고-root-cause-analysis)  
4. [벤치마크 대비 갭 매트릭스](#4-벤치마크-대비-갭-매트릭스)  
5. [개선 원칙 (Must / Must Not) — 팀 규칙 10条](#5-개선-원칙-must--must-not--팀-규칙-10条)  
6. [로드맵 (Phase 0~4, 12주)](#6-로드맵-phase-04-12주)  
7. [통합일정 다음 액션 (단일 화면)](#7-통합일정-다음-액션-단일-화면)  
8. [측정 / KPI](#8-측정--kpi)  
9. [분배실행 (후속 배치)](#9-분배실행-후속-배치)

---

## 1. Executive Summary

MindGarden 어드민은 기능은 쌓였으나 **상용 B2B SaaS($45~$99/월) 대비 정보 밀도·컨텍스트 유지·패턴 일관성**에서 구조적 격차가 있다. 2026-06-27 밀도 감사(`ADMIN_UI_DENSITY_AUDIT_20260627.md`)는 24건 inventory 중 **P0 3화면**(내담자·상담사·스태프)이 card-default + 인라인 4~5버튼 anti-pattern임을 확정했고, 통합일정 벤치마크는 **밀도 토글·side peek·저장 필터** 부재를 P0로 격상했다.

2026-06-30 통합일정 compact row 실험은 **검증·토글 없이 레이아웃을 기본값으로 강제**한 채 5커밋이 연쇄 배포되었고, 롤백(`0676dfa2d`) 시 **5건을 한 revert로 묶어** 사용자가 원했던 여백·중앙정렬·헤더 수정까지 함께 되돌아갔다. 이후 **수동 cherry-pick 복원(`93c39c35b`)** 으로 일부만 되살렸으나, **good SHA 정의·prod/dev 게이트·실험 vs 기본값** 구분이 없어 프로세스 비용이 UX 문제만큼 크다.

L1(거버넌스) 문제가 L2(UX 플랫폼 SSOT 부재)와 L3(화면별 patch-on-patch)를 증폭한다. `EntityRowActions`·`ListTableView`·디자인 토큰은 존재하나 **24 LNB 화면 중 3곳만** overflow SSOT를 쓰고, **밀도/side peek/saved filter는 admin 전역 0건**이다.

개선은 **Phase 0 거버넌스(1주)** → **Phase 1 공통 패턴(밀도 토글 shell, side peek, saved filter)** → **Phase 2 고빈도 5화면** → **Phase 3 ERP·inventory 잔여** 순이며, 모든 UX 실험은 **comfortable 기본 + compact 선택 + 사용자 검수 gate**를 전제로 한다.

당장 P0는 (1) Git·SHA·실험 플래그 정책, (2) `EntityRowActions` SSOT 확산 선행, (3) 통합일정 good SHA·검수 체크리스트, (4) 내담자/상담사/스태프 default=list 전환, (5) side peek shell 프로토타입이다. **코드 변경은 core-planner → core-designer / core-coder → core-tester** 파이프라인만 허용한다(`CORE_PLANNER_DELEGATION_ORDER.md`).

---

## 2. 문제 트리 (3층)

### L1 — 프로세스 / 거버넌스

| ID | 문제 | 증거 | 영향 |
|----|------|------|------|
| L1-1 | **Good SHA·baseline 미정의** | compact row 실험 전·후 “승인 baseline” 문서·태그 없음 | 롤백·복원 시 **어디까지 되돌릴지** 합의 불가 |
| L1-2 | **커밋 단위 = 기능 단위 아님** | `3cae2b392`(compact row) ~ `779b6646a`(패딩) ~ `3e9f4f637`(헤더)가 한 실험 배치로 연쇄 | revert 1건이 **5커밋 일괄** (`0676dfa2d`) |
| L1-3 | **실험 vs 기본값 미분리** | compact row가 **기본 렌더**로 배포, feature flag·토글 없음 | 사용자 “이름 안 보임” → 전체 revert 압력 |
| L1-4 | **prod/dev 게이트 부재** | dev 반영 후 **20+ row·1280px·DnD** 스크린샷 gate 없이 연속 merge | 운영·개발 동일 실패 반복 |
| L1-5 | **수동 cherry-pick 의존** | `93c39c35b`가 revert 후 **6파일 수동 복원** | 재현·감사 어려움, 누락·회귀 위험 |
| L1-6 | **오케스트레이션 미준수** | UI 실험이 designer→coder→**tester gate** 없이 진행된 흔적 | `CORE_PLANNER_DELEGATION_ORDER.md` 테스터 필수 위반 |
| L1-7 | **문서·코드 SSOT 불일치** | `INTEGRATED_SCHEDULE_CARD_LAYOUT_SPEC`(172px) vs 실제 full-width stack vs compact row 스펙(72px) | 기획·디자인·구현 **3축 스펙** |

```text
[L1 인과 — 오늘 사고 축]

  실험=기본값 배포
       → 사용자 반발
       → revert 5건 묶음 (0676dfa2d)
       → 원치 않는 롤백 (여백·헤더까지)
       → 수동 cherry-pick (93c39c35b)
       → good SHA 모호 + 검수 비용 ↑
```

### L2 — UX 플랫폼 (횡단)

| ID | 문제 | 현재 | 벤치마크 (HubSpot·Notion·Linear) |
|----|------|------|----------------------------------|
| L2-1 | **디자인 토큰 SSOT 붕괴** | `unified-design-tokens.css`에 compact grid·client-actions **중복 블록** (감사 §4) | 토큰 1곳 + BEM 1파일 |
| L2-2 | **컴ponent SSOT 미확산** | `EntityRowActions`: LNB 24화면 중 **~3곳**; 나머지 `CardActionGroup`/인라인 MGButton 3~5개 | Primary 1 + overflow (⋯) |
| L2-3 | **밀도 패턴 부재** | admin 전역 **compact/comfortable 토글 0건**; viewMode default=card/smallCard 6화면 | Default/Compact 토글 또는 Display options |
| L2-4 | **Side peek / Preview 부재** | `sidePeek`/`savedFilter` grep **0건**; UnifiedModal 남용 | 목록 유지 + 우측 preview |
| L2-5 | **Saved filter / view 부재** | 통합일정 3칩 고정; localStorage persist **0건** | View tabs + 저장 뷰 |
| L2-6 | **viewMode persist 없음** | remount 시 card default reset | localStorage/URL |
| L2-7 | **AdminCommonLayout 불일치** | 대시보드 V2·통계·휴면 등 **자체 셸** | B0KlA 단일 셸 |
| L2-8 | **API·표시 경계** | `StandardizedApi`/`safeDisplay` 미적용 화면 다수 (알림·모니터링·공통코드) | React #130·KPI 표시 방어 (`CORE_PLANNER_DELEGATION_ORDER` §인시던트) |
| L2-9 | **Modify-first 정책 미집행** | compact variant·page-specific CSS patch **누적** | default=list, 신규 variant 예외 승인 |

### L3 — 화면 / 도메인 (inventory 기준)

#### L3-A — LNB IA 24 leaf 화면 (라우트 SSOT: `menuItems.js`)

| # | 화면 | 핵심 갭 | 심각도 |
|---|------|---------|--------|
| 1 | 대시보드 | AdminCommonLayout X, 위젯 compact 카드 | P2 |
| 2 | **통합 스케줄** | 밀도 토글 X, side peek X, 3칩만, compact 실험 롤백 | **P0** |
| 3 | 알림·메시지 | StandardizedApi/safeDisplay X | P2 |
| 4 | 상담일지 | table-default ✓ (양호) | P3 |
| 5 | **매칭 관리** | MappingListBlock card-default; EntityRowActions △ | **P1** |
| 6~7 | billing | ajax 레거시 | P2 |
| 8 | PG 승인 | — | P3 |
| 9 | **사용자 관리** | card grid only, ViewModeToggle X | **P1** |
| 10 | 계좌 | EntityRowActions X | P2 |
| 11~12 | 디러티·커뮤니티 | table-default ✓ | P3 |
| 13~19 | 콘텐츠·쇼핑 | table 위주, overflow △ | P2~P3 |
| 20~24 | 테넌트·설정·코드 | API 레거시 혼용 | P2 |

#### L3-B — 밀도 감사 24건 (컴포넌트·뷰 축, `ADMIN_UI_DENSITY_AUDIT` §3)

| 심각도 | 건수 | 대표 |
|--------|------|------|
| **P0** | 3 | ClientComprehensiveManagement, ConsultantComprehensiveManagement, StaffManagement |
| **P1** | 7 | FinancialManagement, MappingListBlock, UserManagement, MappingCard, PgConfigurationList… |
| **P2** | 7 | SessionManagement, AdminDashboard 위젯, 통합일정 모달 compact… |
| **P3** | 7 | RefundManagement, PsychDocumentListBlock, ListTableView 기반 화면 |

#### L3-C — ERP·확장 라우트 (LNB 외)

| 영역 | 갭 |
|------|-----|
| ERP FinancialManagement | card-default, compact/card/table 3분기 |
| ERP SalaryManagement | largeCard default |
| tenant PgConfigurationList | card only, footer 4~5버튼 |
| consultant ConsultantClientList | detailed card grid only |

```text
[L1→L2→L3 전파]

  거버넌스(실험·revert) ──► 플랫폼 SSOT 미완 ──► 화면별 patch-on-patch
         │                         │                      │
         └─ 오늘 통합일정 사고 ◄────┴─ compact 강제 재발 위험 ─┘
```

---

## 3. 오늘 사고 Root Cause Analysis

### 3.1 타임라인 (2026-06-30)

| 시각(순) | SHA | 이벤트 |
|----------|-----|--------|
| 1 | `779b6646a` ~ `3cae2b392` | 사이드바 패딩·풀스택 버튼·**Compact List Row**·헤더 회기추가 제거 등 **5커밋 연쇄** |
| 2 | `0676dfa2d` | **revert 5건 묶음** — “이름이 안 보임” → compact row + 관련 UI 전부 롤백 |
| 3 | `61e6bb82d` | 380px·필터 1줄 유지 (부분 정리) |
| 4 | `93c39c35b` | revert **이후** 여백·중앙정렬·풀스택·헤더만 **수동 선택 복원** (compact row **제외**) |

### 3.2 5 Whys

| Why | 답 |
|-----|-----|
| **1. 왜 사용자가 롤백을 요구했는가?** | Compact row 배포 후 사이드바 카드에서 **내담자·상담사 이름 가독성**이 떨어졌다(revert 메시지 명시). |
| **2. 왜 가독성이 떨어졌는가?** | 380px 1줄 row + ellipsis + 메타·CTA 우측 밀집; **comfortable 대비 정보 손실** (HubSpot Compact 태그 축소 불만과 동형). |
| **3. 왜 검증 전에 기본 UI가 바뀌었는가?** | **밀도 토글·feature flag 없이** compact가 **유일한 렌더 경로**로 구현됨 (`INTEGRATED_SCHEDULE_UX_BENCHMARK` P0-1 위반). |
| **4. 왜 revert가 과잉 롤백이 되었는가?** | **기능 단위 브랜치·커밋 분리 없이** 패딩·헤더·compact가 **한 실험 묶음**; `git revert` **5 SHA 일괄**. |
| **5. 왜 복원이 수동 cherry-pick이 되었는가?** | **good SHA(승인 baseline) 문서·태그 부재**; “compact만 빼고 나머지 유지”를 **기계적으로 표현할 merge/revert 전략** 없음. |

### 3.3 기여 요인 (Fishbone 요약)

| 카테고리 | 요인 |
|----------|------|
| **프로세스** | 실험 플래그 없음, tester gate 생략, prod 스크린샷 gate 없음 |
| **설계** | compact row 스펙은 HubSpot 1줄 벤치마크만 따르고 **토글·side peek 선행조건** 미기재 |
| **구현** | 5커밋이 layout·padding·header를 분리하지 않음 |
| **운영** | revert = 전체 되돌리기만 선택; **선택적 revert playbook** 없음 |

### 3.4 재발 방지 규칙 (거버넌스)

| # | 규칙 |
|---|------|
| R1 | **UX 레이아웃 실험은 feature flag 또는 사용자 토글 필수** — 기본값 변경은 **별도 승인 PR** |
| R2 | **1 PR = 1 가설** — compact row / padding / header는 **커밋·PR 분리** |
| R3 | **실험 시작 전 `good SHA` 기록** — `docs/project-management/YYYY-MM-DD/<screen>_BASELINE_SHA.md`에 SHA·스크린샷·체크리스트 |
| R4 | **revert는 커밋 단위** — 2개 이상 묶음 revert 금지(예외: release tag revert만) |
| R5 | **복원은 `git cherry-pick -x` + 문서화** — 수동 diff 복붙 금지 |
| R6 | **배포 전 core-tester gate** — 20+ mock row, 1280/768, DnD, 이름 가시성 (`ADMIN_UI_DENSITY_AUDIT` §2.3) |
| R7 | **compact 재도입 조건** — P0-1 밀도 토글 + P0-2 side peek **선행 완료** (`INTEGRATED_SCHEDULE_UX_BENCHMARK` §3) |

---

## 4. 벤치마크 대비 갭 매트릭스

벤치마크 SSOT: `INTEGRATED_SCHEDULE_UX_BENCHMARK.md`, `ADMIN_UI_DENSITY_AUDIT_20260627.md`

| ID | 갭 | P | Effort | 선행조건 | 벤치마크 근거 |
|----|-----|---|--------|----------|---------------|
| G-01 | **밀도/레이아웃 토글** (comfortable↔compact) | **P0** | M | good SHA 정책(R1~R3) | HubSpot Default/Compact, Notion card_layout |
| G-02 | **Side peek / Preview 패널** | **P0** | L | AdminCommonLayout split shell, UnifiedModal 남용 정리 | Notion side peek, HubSpot preview, Linear Peek |
| G-03 | **Saved filter + 세그먼트** | **P0** | M | 필터 상수 SSOT (`integratedScheduleSidebarFilterConstants.js`) | HubSpot view tabs, TherapyNotes 숏컷 |
| G-04 | **EntityRowActions SSOT 확산** | **P0** | M | overflow portal 버그 회귀 테스트 (`EntityRowActions` history) | Stripe/HubSpot row Manage(⋯) |
| G-05 | **default viewMode = list/table** (P0 3화면) | **P0** | L | G-04 완료 | ADMIN_UI_DENSITY_AUDIT Batch A |
| G-06 | **디자인 토큰·CSS dedup** | **P1** | M | G-05 이후 compact CSS deprecate | tokens 중복 §4 |
| G-07 | **MappingListBlock table-default** | **P1** | M | G-04 | Batch B |
| G-08 | **ERP FinancialManagement table-default** | **P1** | S | — | RefundManagement 준수 사례 |
| G-09 | **UserManagement ListTableView** | **P1** | M | G-04, ViewModeToggle | card grid only |
| G-10 | **회기·결제 상태 정합 (백엔드)** | **P1** | L | 상태 머신 SSOT | Jane Packages Usage |
| G-11 | **StandardizedApi / safeDisplay 잔여 전환** | **P1** | M | — | CORE_PLANNER #130 인시던트 |
| G-12 | **Agenda/액션 큐 보조 뷰** (통합일정) | **P2** | M | G-01~G-03 | TherapyNotes Agenda |
| G-13 | **consultant·tenant card→table** | **P2** | M | G-04 | Batch C |
| G-14 | **AdminCommonLayout 셸 통일** (대시보드·통계) | **P2** | M | — | B0KlA |
| G-15 | **Compact row 재시도** (통합일정) | **P2** | S | **G-01 + G-02 + R7** | 오늘 revert 교훈 |

**Effort**: S ≤3일, M 1~2주, L 3주+ (1 FTE coder 기준 추정)

### P0 Top 5 (즉시)

1. **G-01 + R1~R7** — 거버넌스·밀도 토글 (기본값=comfortable, compact=선택)  
2. **G-04** — EntityRowActions SSOT (side peek·목록 행 액션 선행)  
3. **G-02** — Side peek shell (통합일정·매칭 관리 pilot)  
4. **G-05** — 내담자/상담사/스태프 default=list  
5. **G-03** — Saved filter (통합일정 3칩 + 저장 뷰)

---

## 5. 개선 원칙 (Must / Must Not) — 팀 규칙 10条

| # | Must ✅ | Must Not ❌ |
|---|---------|-------------|
| 1 | **Modify-first** — 기존 `ListTableView`·`ViewModeToggle`·`EntityRowActions` 위에 개선 | 신규 admin 카드 variant·page-specific compact CSS **예외 승인 없이** 추가 |
| 2 | **default = list/table** (데이터 목록 화면) | card/smallCard/largeCard를 **default**로 두기 |
| 3 | **Primary 1 + overflow (⋯)** 행 액션 | 행당 MGButton 3~5개 인라인 |
| 4 | **밀도·레이아웃 실험 = 토글 + comfortable default** | 검증 없이 compact 1줄 row **기본값** 강제 |
| 5 | **Side peek로 상세** — 목록·캘린더 컨텍스트 유지 | 목록 스캔 화면에서 UnifiedModal만으로 상세 |
| 6 | **1 PR = 1 가설**, good SHA 문서화 | 패딩·헤더·layout을 **한 revert 묶음**으로 배포 |
| 7 | **core-planner → designer/coder → tester** 파이프라인 | 메인 어시스턴트 직접 코드 수정 (`CORE_PLANNER_DELEGATION_ORDER`) |
| 8 | **디자인 토큰 `var(--mg-*)` only** | HEX·임의 px (토큰 없는 값) |
| 9 | **viewMode·filter persist** (localStorage/URL) | remount 시 card reset |
| 10 | **20+ row·1280/768·DnD·이름 가시성** 배포 gate | 스크린샷·회귀 없이 prod 반영 |

---

## 6. 로드맵 (Phase 0~4, 12주)

### Phase 0 — 거버넌스·Git·체크리스트 (Week 1)

| 항목 | 내용 |
|------|------|
| **목표** | 오늘 사고형 revert·수동 복원 **재발 방지** |
| **Owner** | core-planner (문서) + shell (템플릿) + generalPurpose (문서) |
| **산출물** | `UX_EXPERIMENT_BASELINE_TEMPLATE.md`, PR template B2B checklist (`ADMIN_UI_DENSITY_AUDIT` §6.1), revert/cherry-pick playbook |
| **완료 조건** | 통합일정 good SHA 문서 1건; R1~R7 팀 합의; tester gate 체크리스트 PR template 반영 |
| **롤백 SHA 정책** | Phase 0 종료 시점 **`develop` HEAD**를 baseline; 실험 전 태그 `ux-baseline/integrated-schedule/YYYY-MM-DD` |

### Phase 1 — 공통 패턴 (Week 2~4)

| 항목 | 내용 |
|------|------|
| **목표** | L2 플랫폼: 밀도 토글 shell, side peek shell, saved filter hook |
| **Owner** | core-designer (`gemini-3.1-pro`) → core-coder → core-tester |
| **범위** | `DensityToggle`, `SidePeekPanel`, `SavedViewChips` (가칭) — **통합일정 pilot** |
| **선행** | Phase 0 완료, G-04 EntityRowActions 안정 |
| **완료 조건** | 통합일정: comfortable default, compact **토글 ON** 시만, side peek prototype, filter 1개 저장/복원 |
| **롤백 SHA** | Phase 1 **시작 SHA**; 토글 default off 커밋을 **good SHA**로 명명 |

### Phase 2 — 고빈도 5화면 (Week 5~8)

| # | 화면 | 작업 |
|---|------|------|
| 1 | 통합일정 | G-01~G-03 productionize, G-15 compact **토글 하** 재시도 |
| 2 | ClientComprehensiveManagement | default=list, overflow |
| 3 | ConsultantComprehensiveManagement | 동일 + admin-compact deprecate |
| 4 | StaffManagement | EntityRowActions 추출 |
| 5 | MappingManagement / MappingListBlock | table-default |

| | |
|--|--|
| **Owner** | core-designer (화면별 handoff) → core-coder → core-tester |
| **완료 조건** | 5화면 20+ row 스크린; default list/table; overflow; viewMode persist |
| **롤백 SHA** | **화면별** baseline SHA (5개 문서) |

### Phase 3 — ERP·inventory 잔여 (Week 9~12)

| 항목 | 내용 |
|------|------|
| **목표** | FinancialManagement, UserManagement, PgConfigurationList, billing API, consultant list, tokens dedup |
| **Owner** | core-coder (batch) + core-tester |
| **완료 조건** | `ADMIN_UI_DENSITY_AUDIT` P1 → P2 이하; ajax→StandardizedApi 잔여 0 (admin scope) |
| **롤백 SHA** | Batch 단위 (ERP / settings / consultant) |

### Phase 4 — 상용화 polish (Week 12+, 연속)

| 항목 | 내용 |
|------|------|
| KPI 대시보드, Jane급 회기 자동 정합(G-10), AdminCommonLayout 통일(G-14) |
| **Owner** | core-planner orchestration |

### Phase별 Owner 서브에이전트 요약

| Phase | designer | coder | tester | debugger | explore |
|-------|----------|-------|--------|----------|---------|
| 0 | — | — | checklist | — | — |
| 1 | ● | ● | ● | △ | — |
| 2 | ● | ● | ● | △ | — |
| 3 | △ | ● | ● | — | △ |
| 4 | △ | ● | ● | ● | — |

---

## 7. 통합일정 다음 액션 (단일 화면)

### 7.1 Good SHA 정의 방법

| 단계 | action |
|------|--------|
| 1 | **Baseline 선언**: 현재 승인 UI = `93c39c35b` (compact row **미포함**, 380px·필터 1줄·여백 복원 포함) + 후속 `61e6bb82d` 폭/필터 |
| 2 | **문서**: `docs/project-management/2026-06-30/INTEGRATED_SCHEDULE_GOOD_SHA.md` 생성 — SHA, 스크린샷 경로, 검수 서명란 |
| 3 | **태그**: `git tag ux-good/integrated-schedule/2026-06-30 93c39c35b` (팀 합의 후) |
| 4 | **실험 브랜치**: `feat/integrated-schedule-density-toggle` — **baseline에서 분기**, main 직접 실험 금지 |
| 5 | **prod cherry-pick**: **good SHA에서만** pick; 실험 커밋은 **토글 default-off** 조건 |

### 7.2 검수 체크리스트 (배포 gate)

- [ ] 사이드바 **380px**, 필터 칩 **1줄** 유지  
- [ ] 카드당 **상담사·내담자 이름** ellipsis 전 **가독성** (최소 8자 노출 또는 tooltip)  
- [ ] comfortable(default) / compact(toggle) **양쪽** 20+ row 스크린  
- [ ] DnD grip vs 버튼 **클릭 충돌 없음**  
- [ ] 1280px / 768px breakpoint  
- [ ] Primary 1 + overflow; danger는 overflow 내부  
- [ ] 콘솔 React **#130 0건** (`/admin/integrated-schedule`)  
- [ ] `userId` ADMIN 전달 여부 (delegation doc 인시던트)  
- [ ] **core-tester** 서명  

### 7.3 Prod cherry-pick 절차

```text
1. good SHA 문서·태그 확인
2. feature branch에서 PR → dev 배포 → 검수 체크리스트 100%
3. prod: cherry-pick -x <SHA> (커밋 단위, 묶음 금지)
4. 실패 시: tag baseline으로 revert 단일 커밋 (revert of cherry-pick)
5. post-deploy: 24h 모니터링 + 스크린 아카이브
```

### 7.4 통합일정 단기 작업 순서 (분배)

| 순 | 작업 | 담당 |
|----|------|------|
| 1 | GOOD_SHA 문서 + baseline 태그 | generalPurpose |
| 2 | 밀도 토글 + side peek **와이어** (compact는 toggle off) | core-designer |
| 3 | DensityToggle + comfortable 유지 구현 | core-coder |
| 4 | 검수 체크리스트 실행 | core-tester |

---

## 8. 측정 / KPI

### 8.1 화면당 정보 가시성

| 지표 | 정의 | 목표 |
|------|------|------|
| **Rows per viewport (RpV)** | 1280×900, comfortable mode, 스크롤 없이 보이는 **완전한 행** 수 | 통합일정 ≥12 (comfortable), compact toggle ON 시 ≥20 |
| **Name visibility rate** | mock 20건 중 ellipsis로 **이름 전체 불가** 비율 | 0% (tooltip 허용) |
| **Primary action reach** | 행당 클릭 수 (Primary CTA까지) | ≤1 click |
| **Overflow ratio** | secondary/danger가 overflow 안에 있는 행 비율 | 100% (목록 화면) |

### 8.2 r2Protected · D11 · 사용자 검수 gate

| Gate | 내용 |
|------|------|
| **r2Protected** | 운영 반영 전 `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` — hardcode·tenant·API 경계 |
| **D11** | 디자인 시스템 11항목 (토큰·BEM·아토믹·AdminCommonLayout·반응형·a11y 등 — `core-solution-design-system-css` 스킬) — PR당 self-check |
| **사용자 검수 gate** | P0 화면·UX 실험: **스크린샷 3종**(comfortable/compact/peek) + 운영자 1인 sign-off **없으면 prod cherry-pick 금지** |

### 8.3 프로세스 KPI

| 지표 | 목표 (Phase 0 후 4주) |
|------|------------------------|
| Bundled revert (>1 feature commit) | **0건** |
| UX PR without tester sign-off | **0건** |
| 화면 without good SHA doc (P0/P1) | **0건** |
| `useState('smallCard')` 신규 admin | **0건** |

### 8.4 추적 보드 (권장)

- `ADMIN_UI_DENSITY_AUDIT` inventory 24건 → **Kanban**: Todo / In Progress / Good SHA / Prod  
- 주간 core-planner 리포트: P0 Top 5 진행률, revert/incident 0 목표

---

## 9. 분배실행 (후속 배치)

부모 에이전트는 아래 순서로 Task 호출. **의존성 없는 0·1번은 병렬 가능.**

| Phase | subagent | model | 전달 prompt 요약 |
|-------|----------|-------|------------------|
| **0a** | generalPurpose | — | `INTEGRATED_SCHEDULE_GOOD_SHA.md` 작성 — baseline `93c39c35b`, 검수 체크list §7.2, revert playbook |
| **0b** | generalPurpose | — | PR template에 B2B checklist + UX experiment R1~R7 추가 (`ADMIN_UI_DENSITY_AUDIT` §6.1) |
| **1a** | core-designer | gemini-3.1-pro | 통합일정 밀도 토글 + side peek 와이어; **compact default off**; `INTEGRATED_SCHEDULE_UX_BENCHMARK` P0-1~2 |
| **1b** | core-coder | — | Phase 1 구현 — 파일: `IntegratedMatchingSchedule.*`, `MappingScheduleCard.*`, `MatchingScheduleSidebar.*`; comfortable default 유지 |
| **1c** | core-tester | — | §7.2 체크리스트 + #130 스모크 + DnD |
| **2a** | core-coder | — | Batch A: Client/Consultant/Staff default=list (`ADMIN_UI_DENSITY_AUDIT` Batch A) |
| **2b** | core-designer | gemini-3.1-pro | EntityRowActions overflow handoff (3화면) |

**완료 보고 주체**: 각 서브에이전트 → **core-planner** → 사용자.

---

## 부록 A — Git SHA 참조 (2026-06-30)

| SHA | 설명 |
|-----|------|
| `3cae2b392` | feat: Compact List Row (안 1) — **실험** |
| `554d9f428` | fix: full-width stack buttons |
| `779b6646a` | fix: B0KlA padding |
| `3e9f4f637` | fix: 헤더 회기 추가 제거 |
| `0676dfa2d` | **revert 5건 묶음** — compact + 위 4건 |
| `61e6bb82d` | fix: 380px·필터 1줄 유지 |
| `93c39c35b` | **good candidate** — 여백·중앙정렬·헤더만 복원, compact **제외** |

## 부록 B — inventory 교차 참조

- **LNB 24 leaf**: `frontend/src/components/dashboard-v2/constants/menuItems.js`  
- **밀도 24건**: `ADMIN_UI_DENSITY_AUDIT_20260627.md` §3  
- **통합일정 파일**: `frontend/src/components/admin/mapping-management/` (53 files)

---

## 변경 이력

| 날짜 | 작성 | 내용 |
|------|------|------|
| 2026-06-30 | core-planner | 초版 — L1~L3 문제 트리, 06030 RCA, 12주 로드맵, 통합일정 next action, KPI |
