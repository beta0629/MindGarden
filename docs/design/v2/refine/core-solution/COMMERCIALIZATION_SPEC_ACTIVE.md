# Core Solution Phase 3 — 상용화 스펙 Active SSOT

> **Status**: **Active (Commercial)**  
> **Scope**: Core Solution 메인 앱 UI (`frontend/`). Trinity(`frontend-trinity/`) 제외.  
> **Date**: 2026-06-18  
> **Authority**: Phase 3 상용화 Gate·Batch·품질 바의 **단일 SSOT**. Step A 사용자 승인(2026-06-18) 반영.

---

## Executive Summary

본 문서는 Core Solution Phase 3 상용화 스펙의 **단일 SSOT(Single Source of Truth)** 입니다.  
Gate 결정·Batch 범위·품질 바·금지사항·모델 스택·진행 상태를 한곳에서 확인하고, 하위 스펙 문서·체크리스트·디자인 계획으로 위임합니다.

**2026-06-18 Step A**: 사용자가 P0 8건 Gate A(스펙 검수)를 승인했습니다. Step B(VISUAL_DESIGN_PACK_PHASE1 검수) 진행 중입니다.

---

## 확정 Gate 결정 (2026-06-18 사용자 승인)

| 항목 | 확정 내용 |
|------|-----------|
| **역할 진행 순서** | **ADMIN → CONSULTANT → CLIENT** (Phase 1은 ADMIN 단일) |
| **KPI 3종** | 1. 오늘 상담 일정 · 2. 상담사별 오늘 일정 · 3. 신규 상담 접수 |
| **KPI 상호작용** | **KpiFlipCard 3D flip** — 클릭 시 앞면 요약 → 뒷면 상세 ([KPI_FLIP_CARD_SPEC](./KPI_FLIP_CARD_SPEC.md)) |
| **Core Flow Pipeline** | **전체 너비 균등 분배** (Grid/Flex) — Phase 3 Batch 2 일괄 반영 |
| **Public Main** | **Rebuild** — Shield H2 로고 + Calm Forest (`--mg-v2-*`) |
| **Hotfix 정책** | **금지** — Core Flow Pipeline·Public Main·`/` 허브·KpiFlipCard 등 선행 UI hotfix 불가. **Phase 3 Batch 일괄**만 허용 |

---

## 미확정 → 상용화 기본값 (명시)

아래는 사용자 Gate에서 미확정이거나 Phase 1 시안 단계에서 채택할 **기본값**입니다. 변경 시 본 문서·[DESIGN_REVIEW_CHECKLIST](./DESIGN_REVIEW_CHECKLIST.md) Gate A 재승인.

| 항목 | 상용화 기본값 | SSOT |
|------|---------------|------|
| **Hero·마케팅 카피** | 현장형 상담센터 운영 플랫폼 톤 — [CORE_SOLUTION_IDENTITY](./CORE_SOLUTION_IDENTITY.md) **1안 추천** ("예약부터 회기, 정산까지…") | [CORE_SOLUTION_IDENTITY §3](./CORE_SOLUTION_IDENTITY.md) |
| **Public CTA 「시작하기」** | Trinity 실제 퍼널 **`https://apply.e-trinity.co.kr`** (퍼널 SSOT). CS `/onboarding`은 **구조 샘플만** | [SAMPLE_PAGES_POLICY](../SAMPLE_PAGES_POLICY.md) |
| **로그인 진입** | CS **`/login`** 유지 (UnifiedLogin·Tablet·Mobile) | [DESIGN_V2_VISUAL_SPEC §Auth](../../DESIGN_V2_VISUAL_SPEC.md) |

---

## Batch 1~4 P0 범위 요약

[DESIGN_REVIEW_CHECKLIST §2.1 P0](./DESIGN_REVIEW_CHECKLIST.md#21-admin--p0-phase-13-batch-13) 8건 + [§3 Batch 표](./DESIGN_REVIEW_CHECKLIST.md#3-phase-3-implementation-batch) 기준.

### P0 8건 (CS-ADM-001 ~ CS-ADM-008)

| ID | 영역 | 작업 | Batch | 스펙 |
|----|------|------|-------|------|
| CS-ADM-001 | Public Main (`/`, `/landing`) | Rebuild | **1** | [PHASE1_PUBLIC_MAIN_SPEC](./PHASE1_PUBLIC_MAIN_SPEC.md) |
| CS-ADM-002 | Admin Main Hub (`/` 로그인) | Rebuild | **2** | [PHASE1_ADMIN_MAIN_HUB_SPEC](./PHASE1_ADMIN_MAIN_HUB_SPEC.md) |
| CS-ADM-003 | KpiFlipCard ×3 | Rebuild | **2** | [KPI_FLIP_CARD_SPEC](./KPI_FLIP_CARD_SPEC.md) |
| CS-ADM-004 | Core Flow Pipeline (5단계 균등 너비) | Refactor | **2** | [PHASE1_ADMIN §3.4](./PHASE1_ADMIN_MAIN_HUB_SPEC.md) |
| CS-ADM-005 | B0KlA App Shell (GNB 64 + LNB 260) | Refactor | **2** | [COMMERCIALIZATION Keep/Refactor](./COMMERCIALIZATION_DESIGN_PLAN.md#keep--refactor--rebuild-표) |
| CS-ADM-006 | Admin Dashboard (AdminDashboardV2) | Refactor | **3** | [PHASE1_ADMIN_MAIN_HUB_SPEC](./PHASE1_ADMIN_MAIN_HUB_SPEC.md) |
| CS-ADM-007 | 통합 매칭·스케줄 | Refactor | **3** | [PHASE1_ADMIN §3.3](./PHASE1_ADMIN_MAIN_HUB_SPEC.md) |
| CS-ADM-008 | `/admin-dashboard-sample` (회귀 기준) | Keep | **2** (동기화) | [SAMPLE_PAGES_POLICY](../SAMPLE_PAGES_POLICY.md) |

### Batch 1~4 요약

| Batch | 이름 | P0 포함 | Gate |
|-------|------|---------|------|
| **Batch 1** | Public & Auth First Impression | CS-ADM-001 (+ P1 Auth 101~103) | 시안(B) → React(C) |
| **Batch 2** | Admin Shell + Main Hub | CS-ADM-002~005, 008 (+ 공통 115) | 시안(B) → React(C) |
| **Batch 3** | Admin Core Ops | CS-ADM-006~007 | 시안(B) → React(C) |
| **Batch 4** | Admin Extended (P1~P2) | CS-ADM-104~114, 201~206, 208 | 시안(B) → React(C) |

**의존성**: Batch 1·2 병렬 착수 가능 → Batch 2 완료 후 Batch 3 → Batch 4. Batch 간 **선행 hotfix 금지**.

---

## 상용화 품질 바 (요약)

Phase 1 시안(Gate 2) 및 Phase 3 React(Gate 3) 완료 시 **모두 충족**해야 상용화 게이트 통과.

| 영역 | 핵심 기준 |
|------|-----------|
| 타이포 | `--mg-v2-font-size-*` only; Off-black `--mg-v2-color-text-primary` |
| 간격 | 8px 그리드 `--mg-v2-space-*` only |
| 색상 | Calm Forest `#3D5246` only; `#3B82F6`·`#8B5CF6` **0건** |
| 인터랙션 | hover + `:focus-visible` 2px+; disabled 토큰 |
| 상태 | Empty / Loading / Error 시안·구현 각 1종 |
| 모바일 | 375px 시안 필수; 터치 44×44px; 가로 스크롤 없음 |
| a11y | `aria-label`, 시맨틱 랜드마크, `prefers-reduced-motion` (KpiFlipCard) |
| 코드 (Phase 3) | z-index `--mg-v2-z-*`; MGButton; UnifiedModal; visual regression |

**전체 체크리스트 SSOT**: [COMMERCIALIZATION_DESIGN_PLAN § 상용화 품질 바](./COMMERCIALIZATION_DESIGN_PLAN.md#상용화-품질-바-측정-가능-체크리스트)

---

## 금지사항

| 금지 | 대안 |
|------|------|
| **Phase 3 선행 hotfix** (Pipeline·Public Main·`/` 허브·KpiFlipCard) | 해당 **Batch 일괄** React 반영 |
| **frontend React/CSS 수정 (Phase 1)** | Step B 시안 확정 후 Step C `core-coder` |
| **static HTML mockup** 신규·선행 | Figma/PNG/PDF 시안 1벌 |
| **Trinity 코드** (`frontend-trinity/`) | 본 SSOT 범위 외 |
| **전역 버튼/색상 일괄 치환 스크립트** | Phase 3 시안 범위 파일만 `core-coder` 일괄 |

---

## 모델 스택 (서브에이전트)

| 역할 | 모델 | 담당 |
|------|------|------|
| **designer** | `gemini-3.1-pro` | core-designer — Phase 1 시안·VISUAL_DESIGN_PACK |
| **coder** | `claude-4.6-opus-high-thinking` | core-coder — Phase 3 Batch React 일괄 |
| **tester** | (기본) | core-tester — Gate 3 visual regression·a11y |

---

## 문서 허브

| 문서 | 역할 |
|------|------|
| [PHASE1_PUBLIC_MAIN_SPEC](./PHASE1_PUBLIC_MAIN_SPEC.md) | Public Main Rebuild 스펙 |
| [PHASE1_ADMIN_MAIN_HUB_SPEC](./PHASE1_ADMIN_MAIN_HUB_SPEC.md) | Admin Hub·Pipeline·KPI IA |
| [KPI_FLIP_CARD_SPEC](./KPI_FLIP_CARD_SPEC.md) | KpiFlipCard 3D flip 핸드오프 |
| [DESIGN_REVIEW_CHECKLIST](./DESIGN_REVIEW_CHECKLIST.md) | 전체 페이지·Batch·3단계 게이트 |
| [COMMERCIALIZATION_DESIGN_PLAN](./COMMERCIALIZATION_DESIGN_PLAN.md) | 의사결정·품질 바·Phase 1 브리프 |
| [DESIGN_PHASE3_MASTER_PLAN](./DESIGN_PHASE3_MASTER_PLAN.md) | Phase 0~4 로드맵 |
| [CORE_SOLUTION_IDENTITY](./CORE_SOLUTION_IDENTITY.md) | 제품 톤·카피 3안 |
| [DESIGN_V2_TOKEN_SSOT](../../DESIGN_V2_TOKEN_SSOT.md) | Calm Forest `--mg-v2-*` |

---

## 진행 상태

| Step | 이름 | 상태 | 비고 |
|------|------|------|------|
| **A** | 스펙 문서 검수 (Gate 1) | ☑ **완료** | **2026-06-18 사용자 승인** — P0 8건 Gate A |
| **B** | 시안/와이어 검수 (Gate 2) | **진행 중** | VISUAL_DESIGN_PACK_PHASE1 검수 대기 |
| **C** | React 스테이징 (Gate 3) | ☐ | Step B 확정 후 Batch 1→2 순 |
| **D** | prod sign-off | ☐ | Batch 1~4 완료 후 |

---

## 다음 단계

1. **Step B** — `core-designer` 산출 **VISUAL_DESIGN_PACK_PHASE1** (1440px + 375px) 사용자 검수  
2. **Step C** — `core-coder` Phase 3 **Batch 1** (Public & Auth) → **Batch 2** (Shell + Hub + KpiFlipCard + Pipeline) 일괄 반영  
3. Gate 3 통과 후 Batch 3 → Batch 4 순차 진행

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-18 | Active Commercial SSOT 신규 — Step A 사용자 승인·Gate 결정·Batch P0·금지사항·모델 스택 통합 |
