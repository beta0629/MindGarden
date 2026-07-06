# Core Solution Phase 3 — 디자인 검수 체크리스트 (SSOT)

> **Status**: Active  
> **Scope**: Core Solution 메인 앱 UI (`frontend/`). **Trinity(`frontend-trinity/`) 제외.**  
> **품질 바 SSOT**: [COMMERCIALIZATION_DESIGN_PLAN.md](./COMMERCIALIZATION_DESIGN_PLAN.md)  
> **역할 진행 순서**: **ADMIN → CONSULTANT → CLIENT**  
> **Date**: 2026-06-18

---

## 1. 목적

Phase 3 디자인 개편 착수 전·시안 확정 후·React 반영 후 **누락 없이 검수**하기 위한 단일 SSOT입니다.  
모든 페이지·영역은 아래 표에 등록하고, **3단계 검수 게이트**를 통과해야 Phase 3 React 일괄 반영(또는 Phase 4 확장)으로 진행합니다.

| 게이트 | 시점 | 담당 | 통과 조건 |
|--------|------|------|-----------|
| **Gate 0 — 착수 전** | Phase 1 시안 작업 전 | 사용자 + 기획 | 본 체크리스트 표·Batch·우선순위 승인; [COMMERCIALIZATION § 사용자 게이트](./COMMERCIALIZATION_DESIGN_PLAN.md#사용자-게이트) 3문항 확정 |
| **Gate 1 — 스펙 검수 (Step A)** | core-designer 착수 전 | 사용자 | 대상 ID별 스펙 문서·Keep/Refactor/Rebuild 판정·P0 KPI IA 동의 |
| **Gate 2 — 시안 검수 (Step B)** | Phase 1 산출 후 | 사용자 + core-designer | [§5 디자인 검수 체크리스트](#5-디자인-검수-체크리스트-페이지시안-공통) + [상용화 품질 바](./COMMERCIALIZATION_DESIGN_PLAN.md#상용화-품질-바-측정-가능-체크리스트) 시안 항목 |
| **Gate 3 — React 검수 (Step C)** | Phase 3 구현 후 | 사용자 + core-tester | Gate 2 확정 시안 대비 visual regression·a11y·토큰 정합 |

**Hotfix vs Phase 3 Rebuild**

| 구분 | 정의 | 본 개편 정책 |
|------|------|--------------|
| **Hotfix (예외)** | 운영 장애·보안·데이터 무결성 등 **디자인 개편과 무관한** 긴급 수정 | 본 체크리스트 **범위 외**. 별도 incident 트랙 |
| **Phase 3 Rebuild/Refactor** | Calm Forest·Shield·B0KlA·상용화 바를 맞추기 위한 **일괄 디자인 반영** | 표의 `Implementation` = **Phase 3 Batch** 또는 **Phase 4** 항목만. **선행 UI hotfix 금지** (Core Flow Pipeline·Public Main·`/` 허브 등) |

---

## 2. 전체 수정 대상 목록

**범례**

- **Phase**: 문서·시안 단계(1) / React 일괄(3) / 역할 확장(4)  
- **작업 유형**: [COMMERCIALIZATION Keep/Refactor/Rebuild](./COMMERCIALIZATION_DESIGN_PLAN.md#keep--refactor--rebuild-표)  
- **Implementation**: Phase 3 Batch 번호 또는 Phase 4  
- **검수 상태**: Gate 1(A) · Gate 2(B) · Gate 3(C) 각각 ☐ — 통과 시 ☑

### 2.1 ADMIN — P0 (Phase 1~3, Batch 1~3)

| ID | Phase | 역할 | 라우트 | 페이지/영역명 | 작업 유형 | Implementation | 스펙 문서 | 우선순위 | A | B | C |
|----|-------|------|--------|---------------|-----------|----------------|-----------|----------|---|---|---|
| CS-ADM-001 | 1~3 | PUBLIC | `/`, `/landing` (비로그인) | **Public Main** — 첫인상·Hero·GNB | **Rebuild** | Batch 1 | [PHASE1_PUBLIC_MAIN_SPEC](./PHASE1_PUBLIC_MAIN_SPEC.md) | **P0** | ☑ | ☐ | ☐ |
| CS-ADM-002 | 1~3 | ADMIN | `/` (로그인) | **Admin Main Hub** — KPI 3 + 위젯 그리드 | **Rebuild** | Batch 2 | [PHASE1_ADMIN_MAIN_HUB_SPEC](./PHASE1_ADMIN_MAIN_HUB_SPEC.md) | **P0** | ☑ | ☐ | ☐ |
| CS-ADM-003 | 1~3 | ADMIN | `/` (로그인) | **KpiFlipCard ×3** — 3D flip KPI | **Rebuild** | Batch 2 | [KPI_FLIP_CARD_SPEC](./KPI_FLIP_CARD_SPEC.md) | **P0** | ☑ | ☐ | ☐ |
| CS-ADM-004 | 1~3 | ADMIN | `/`, `/admin/dashboard` | **Core Flow Pipeline** — 5단계 전체 너비 균등 | **Refactor** | Batch 2 | [PHASE1_ADMIN_MAIN_HUB_SPEC §3.4](./PHASE1_ADMIN_MAIN_HUB_SPEC.md) | **P0** | ☑ | ☐ | ☐ |
| CS-ADM-005 | 1~3 | ADMIN | 전역 셸 | **B0KlA App Shell** — GNB 64px + LNB 260px + ContentArea | **Refactor** | Batch 2 | [COMMERCIALIZATION § Keep/Refactor](./COMMERCIALIZATION_DESIGN_PLAN.md#keep--refactor--rebuild-표) · [PHASE1_ADMIN §3.1](./PHASE1_ADMIN_MAIN_HUB_SPEC.md) | **P0** | ☑ | ☐ | ☐ |
| CS-ADM-006 | 1~3 | ADMIN | `/admin/dashboard` | **Admin Dashboard (B0KlA)** — AdminDashboardV2 | **Refactor** | Batch 3 | [PHASE1_ADMIN_MAIN_HUB_SPEC](./PHASE1_ADMIN_MAIN_HUB_SPEC.md) · 코드: `AdminDashboardV2.js` | **P0** | ☑ | ☐ | ☐ |
| CS-ADM-007 | 1~3 | ADMIN | `/admin/integrated-schedule` | **통합 매칭·스케줄** | **Refactor** | Batch 3 | [PHASE1_ADMIN §3.3 KPI#2 deep link](./PHASE1_ADMIN_MAIN_HUB_SPEC.md) | **P0** | ☑ | ☐ | ☐ |
| CS-ADM-008 | 3 | ADMIN | `/admin-dashboard-sample` (샘플) | B0KlA 시각 회귀 기준 라우트 | **Keep** | Batch 2 (동기화) | [SAMPLE_PAGES_POLICY](../SAMPLE_PAGES_POLICY.md) | **P0** | ☑ | ☐ | ☐ |

### 2.2 ADMIN — P1 (Phase 3 Batch 1·4)

| ID | Phase | 역할 | 라우트 | 페이지/영역명 | 작업 유형 | Implementation | 스펙 문서 | 우선순위 | A | B | C |
|----|-------|------|--------|---------------|-----------|----------------|-----------|----------|---|---|---|
| CS-ADM-101 | 3 | PUBLIC | `/login`, `/login/tablet`, `/mobile-login` | 로그인 (UnifiedLogin·Tablet·Mobile) | **Refactor** | Batch 1 | [DESIGN_V2_VISUAL_SPEC §Auth](../../DESIGN_V2_VISUAL_SPEC.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-102 | 3 | PUBLIC | `/register`, `/forgot-password`, `/reset-password` | 회원가입·비밀번호 | **Refactor** | Batch 1 | [DESIGN_V2_VISUAL_SPEC](../../DESIGN_V2_VISUAL_SPEC.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-103 | 3 | ALL | `/tenant-select` | 테넌트 선택 | **Refactor** | Batch 1 | [CORE_SOLUTION_IDENTITY](./CORE_SOLUTION_IDENTITY.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-104 | 3 | ADMIN | `/admin/user-management` | 사용자·상담사·내담자 통합 관리 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-105 | 3 | ADMIN | `/admin/mapping-management`, `/admin/mappings/pending-payment-cleanup` | 매칭·입금 대기 정리 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-106 | 3 | ADMIN | `/admin/sessions`, `/admin/consultation-logs` | 회기·상담일지 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-107 | 3 | ADMIN | `/admin/schedules`, `/admin/schedule`, `/schedule` | 스케줄 (SchedulePage) | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-108 | 3 | ADMIN | `/admin/notifications` | 통합 알림·메시지 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-109 | 3 | ADMIN | `/admin/statistics`, `/admin/statistics-dashboard` | 통계 대시보드 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-110 | 3 | ADMIN | `/erp/dashboard`, `/admin/erp/financial`, `/erp/financial` | ERP 대시·통합 재무 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-111 | 3 | ADMIN | `/erp/purchase`, `/erp/budget`, `/erp/salary`, `/erp/approvals` | ERP 구매·예산·급여·승인 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-112 | 3 | ADMIN/STAFF | `/admin/mypage`, `/mypage` | 마이페이지 (역할별 redirect) | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-113 | 3 | ADMIN | `/admin/common-codes`, `/admin/tenant-common-codes` | 공통코드 관리 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-114 | 3 | ADMIN | `/admin/package-pricing` | 패키지 요금 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P1 | ☐ | ☐ | ☐ |
| CS-ADM-115 | 3 | ADMIN | ContentHeader·ActionBar·MGButton·UnifiedModal | **공통 컴ponent SSOT** (전 페이지 횡단) | **Refactor** | Batch 2~4 | [COMMERCIALIZATION § D4~D7](./COMMERCIALIZATION_DESIGN_PLAN.md#의사결정-매트릭스) · [DESIGN_V2_TOKEN_SSOT](../../DESIGN_V2_TOKEN_SSOT.md) | P1 | ☐ | ☐ | ☐ |

### 2.3 ADMIN — P2 (Phase 3 Batch 4 또는 후순위)

| ID | Phase | 역할 | 라우트 | 페이지/영역명 | 작업 유형 | Implementation | 스펙 문서 | 우선순위 | A | B | C |
|----|-------|------|--------|---------------|-----------|----------------|-----------|----------|---|---|---|
| CS-ADM-201 | 3 | ADMIN | `/admin/system-config`, `/admin/system/ai-providers` | 시스템·AI 설정 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P2 | ☐ | ☐ | ☐ |
| CS-ADM-202 | 3 | ADMIN | `/admin/branding`, `/tenant/profile`, `/tenant/settings` | 테넌트 브랜딩·프로필 | **Refactor** | Batch 4 | [BRAND_SSOT](../BRAND_SSOT_CORE_SOLUTION.md) | P2 | ☐ | ☐ | ☐ |
| CS-ADM-203 | 3 | ADMIN | `/admin/compliance/*` | 컴플라이언스 메뉴·대시·파기 등 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P2 | ☐ | ☐ | ☐ |
| CS-ADM-204 | 3 | ADMIN | `/admin/shop/*`, `/admin/billing/*` | 샵·결제·구독 어드민 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P2 | ☐ | ☐ | ☐ |
| CS-ADM-205 | 3 | ADMIN | `/admin/cache-monitoring`, `/admin/security-monitoring`, `/admin/api-performance` | 모니터링 대시 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P2 | ☐ | ☐ | ☐ |
| CS-ADM-206 | 3 | ADMIN | `/admin/wellness/*`, `/admin/content-master`, `/admin/community-moderation` | 웰니스·콘텐츠·커뮤니티 검수 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P2 | ☐ | ☐ | ☐ |
| CS-ADM-207 | 3 | PUBLIC | `/onboarding`, `/pricing` | CS structural samples (React 구조만) | **Keep** | — (Reference) | [SAMPLE_PAGES_POLICY](../SAMPLE_PAGES_POLICY.md) · C-1 Deprecated | P2 | ☐ | — | — |
| CS-ADM-208 | 3 | ALL | `/notifications`, `/help`, `/privacy`, `/terms` | 공통·법무·도움말 | **Refactor** | Batch 4 | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P2 | ☐ | ☐ | ☐ |
| CS-ADM-209 | 3 | ADMIN | `/admin/system`, `/admin/logs`, `/admin/settings` (ComingSoon) | 준비중 플레이스홀더 | **Keep** | — | [COMMERCIALIZATION](./COMMERCIALIZATION_DESIGN_PLAN.md) | P2 | ☐ | — | — |

### 2.4 CONSULTANT — Phase 4 (Batch 5)

| ID | Phase | 역할 | 라우트 | 페이지/영역명 | 작업 유형 | Implementation | 스펙 문서 | 우선순위 | A | B | C |
|----|-------|------|--------|---------------|-----------|----------------|-----------|----------|---|---|---|
| CS-CNS-001 | 4 | CONSULTANT | `/consultant/renewal/dashboard` | **Consultant Hub** — 메인 대시 | **Rebuild** | Batch 5 | [DESIGN_PHASE3 § Phase 4](./DESIGN_PHASE3_MASTER_PLAN.md#phase-4--확장-역할별-허브) · `/` 템플릿 파생 | P1 | ☐ | ☐ | ☐ |
| CS-CNS-002 | 4 | CONSULTANT | `/consultant/renewal/schedule` | 일정 | **Rebuild** | Batch 5 | Phase 4 (시안 후 작성) | P1 | ☐ | ☐ | ☐ |
| CS-CNS-003 | 4 | CONSULTANT | `/consultant/renewal/clients` | 내담자 관리 | **Rebuild** | Batch 5 | Phase 4 | P1 | ☐ | ☐ | ☐ |
| CS-CNS-004 | 4 | CONSULTANT | `/consultant/renewal/consultation-records` | 상담 기록 | **Rebuild** | Batch 5 | Phase 4 | P1 | ☐ | ☐ | ☐ |
| CS-CNS-005 | 4 | CONSULTANT | `/consultant/renewal/availability` | 가용 시간 | **Rebuild** | Batch 5 | Phase 4 | P1 | ☐ | ☐ | ☐ |
| CS-CNS-006 | 4 | CONSULTANT | `/consultant/renewal/salary-settlement`, `/consultant/salary-settlement` | 급여·정산 | **Refactor** | Batch 5 | Phase 4 | P2 | ☐ | ☐ | ☐ |
| CS-CNS-007 | 4 | CONSULTANT | `/consultant/more/*` (session-kpi, mind-weather-inbox) | More 허브·부가 | **Refactor** | Batch 5 | Phase 4 | P2 | ☐ | ☐ | ☐ |
| CS-CNS-008 | 4 | CONSULTANT | `/consultant/schedule`, `/consultant/clients` (레거시) | 레거시 상담사 라우트 | **Refactor** | Batch 5 | Phase 4 — renewal 수렴 후 deprecate | P2 | ☐ | ☐ | ☐ |

### 2.5 CLIENT — Phase 4 (Batch 6)

| ID | Phase | 역할 | 라우트 | 페이지/영역명 | 작업 유형 | Implementation | 스펙 문서 | 우선순위 | A | B | C |
|----|-------|------|--------|---------------|-----------|----------------|-----------|----------|---|---|---|
| CS-CLT-001 | 4 | CLIENT | `/client`, `/client/home` | **Client Hub** — ClientHomeRenewal | **Rebuild** | Batch 6 | [DESIGN_PHASE3 § Phase 4](./DESIGN_PHASE3_MASTER_PLAN.md#phase-4--확장-역할별-허브) | P1 | ☐ | ☐ | ☐ |
| CS-CLT-002 | 4 | CLIENT | `/client/booking`, `/client/schedule` | 예약·일정 | **Rebuild** | Batch 6 | Phase 4 | P1 | ☐ | ☐ | ☐ |
| CS-CLT-003 | 4 | CLIENT | `/client/consultations`, `/client/session-management` | 상담·회기 | **Rebuild** | Batch 6 | Phase 4 | P1 | ☐ | ☐ | ☐ |
| CS-CLT-004 | 4 | CLIENT | `/client/wellness-hub`, `/client/mood-journal` | 웰니스·기분 일지 | **Refactor** | Batch 6 | Phase 4 | P1 | ☐ | ☐ | ☐ |
| CS-CLT-005 | 4 | CLIENT | `/client/session-payment`, `/client/payment-history` | 결제·내역 | **Refactor** | Batch 6 | Phase 4 | P2 | ☐ | ☐ | ☐ |
| CS-CLT-006 | 4 | CLIENT | `/client/shop/*` | 온라인 샵·장바구니·주문 | **Refactor** | Batch 6 | Phase 4 | P2 | ☐ | ☐ | ☐ |
| CS-CLT-007 | 4 | CLIENT | `/client/more`, `/client/community/*` | More·커뮤니티 | **Refactor** | Batch 6 | Phase 4 | P2 | ☐ | ☐ | ☐ |
| CS-CLT-008 | 4 | CLIENT | `/client/mypage`, `/client/settings` | 마이페이지·설정 | **Refactor** | Batch 6 | Phase 4 | P2 | ☐ | ☐ | ☐ |

**집계 (검수 대상)**

| 구분 | 건수 |
|------|------|
| **총 페이지/영역** | **48** |
| P0 | 8 |
| P1 | 23 |
| P2 | 17 |
| Phase 3 (Batch 1~4) | 32 |
| Phase 4 (Batch 5~6) | 16 |

---

## 3. Phase 3 Implementation Batch

Batch별 **Gate 2(시안) → Gate 3(React)** 일괄 검수. Batch 간 선행 hotfix **금지** (P0 Rebuild·Pipeline 포함).

| Batch | 이름 | 포함 ID | Phase | Gate 2 시안 | Gate 3 React |
|-------|------|---------|-------|-------------|--------------|
| **Batch 1** | Public & Auth First Impression | CS-ADM-001, CS-ADM-101~103 | 3 | ☐ | ☐ |
| **Batch 2** | Admin Shell + Main Hub | CS-ADM-002~005, CS-ADM-008, CS-ADM-115 (셸·공통) | 3 | ☐ | ☐ |
| **Batch 3** | Admin Core Ops (P0) | CS-ADM-006~007 | 3 | ☐ | ☐ |
| **Batch 4** | Admin Extended (P1~P2) | CS-ADM-104~114, CS-ADM-201~206, CS-ADM-208 | 3 | ☐ | ☐ |
| **Batch 5** | Consultant Hub | CS-CNS-001~008 | 4 | ☐ | ☐ |
| **Batch 6** | Client Hub | CS-CLT-001~008 | 4 | ☐ | ☐ |

**Batch 의존성**

```
Batch 1 (Public/Auth) ──┐
                        ├──► Batch 2 (Shell/Hub) ──► Batch 3 (Admin P0) ──► Batch 4 (Admin Extended)
                        │                                                              │
                        └──────────────────────────────────────────────────────────────┘
                                                                                        │
                                              Phase 3 완료 후 ──► Batch 5 (Consultant) ──► Batch 6 (Client)
```

---

## 4. Hotfix 목록 (참고 — 본 개편 Batch 아님)

디자인 Phase 3 **선행 UI 수정으로 분류하지 않음**. incident·보안·기능 버그만 별도 트랙.

| ID | 영역 | 비고 |
|----|------|------|
| HF-EXC-001 | z-index·모달 가림 (P0 증상) | **Phase 3 Batch 2** `--mg-v2-z-*` 일괄로 해결. 단독 hotfix 지양 |
| HF-EXC-002 | SaaS Blue `#3B82F6` 잔존 | **Phase 3** 토큰 치환. 부분 색상 패치 금지 |
| HF-EXC-003 | Core Flow Pipeline 레이아웃 | **Phase 3 Batch 2** 전용. 선행 CSS hotfix **절대 금지** |

---

## 5. 디자인 검수 체크리스트 (페이지/시안 공통)

각 ID·Batch 시안·React 반영 시 **전항목** 확인. 상세 측정 기준은 [COMMERCIALIZATION § 상용화 품질 바](./COMMERCIALIZATION_DESIGN_PLAN.md#상용화-품질-바-측정-가능-체크리스트) SSOT.

### 5.1 브랜드·토큰

- [ ] **Calm Forest `--mg-v2-*` only** — `#3B82F6`·`#8B5CF6`·임의 HEX 0건
- [ ] **Shield H2 로고** — 텍스트-only "Core Solution" 금지; light/dark variant 명시
- [ ] Off-black 텍스트 `--mg-v2-color-text-primary`; 순수 `#000` 금지

### 5.2 레이아웃·컴포넌트 SSOT

- [ ] **GNB** 64px · **LNB** 260px · 모바일 드로어 — [PHASE1_ADMIN §3.1](./PHASE1_ADMIN_MAIN_HUB_SPEC.md)
- [ ] **ContentHeader** — 타이틀·브레드크럼·ActionBar 위계
- [ ] **MGButton** — Primary 40px·radius 10px; legacy `btn-*` 금지 (Phase 3 코드)
- [ ] **UnifiedModal** — 커스텀 오버레이 금지 (Phase 3 코드)
- [ ] **8px 그리드** — `--mg-v2-space-*` only

### 5.3 반응형

- [ ] **1440px** 데스크톱 시안 1벌
- [ ] **375px** 모바일 시안 1벌 — KPI 1열·LNB 드로어·가로 스croll 없음(허브 본문)
- [ ] 터치 타깃 **44×44px** 이상

### 5.4 접근성·모션

- [ ] `:focus-visible` 2px+ 포커스 링; 키보드 탭 순서
- [ ] **`prefers-reduced-motion`** — KpiFlipCard crossfade/instant ([KPI_FLIP_CARD_SPEC §3](./KPI_FLIP_CARD_SPEC.md))
- [ ] 아이콘-only `aria-label`; 시맨틱 `nav`·`main`·`header`

### 5.5 카피·정체성

- [ ] **제네릭 B2B SaaS 금지** — "비즈니스 핵심"·"멀티테넌트" 마케팅 톤 배제
- [ ] **현장형 상담센터** 톤 — [CORE_SOLUTION_IDENTITY](./CORE_SOLUTION_IDENTITY.md)
- [ ] Trinity public 카피·컴포넌트 **혼용 금지**

### 5.6 상태 (Empty / Loading / Error)

- [ ] Empty — 일러스트+한 줄+CTA 1개 (시안 1프레임)
- [ ] Loading — 스켈레톤 또는 통일 스피너; 빈 화면 금지
- [ ] Error — SafeErrorDisplay 패턴 (Phase 3 구현)

### 5.7 다크 모드

- [ ] 라이트+다크 각 1프레임 (또는 나란히)
- [ ] `[data-theme="dark"]` + TOKEN SSOT 단일화 (`.dark-mode` 레거시 제거는 Phase 3)

---

## 6. 사용자 검수 워크플로

| Step | 이름 | 대상 | 완료 조건 | ☐ |
|------|------|------|-----------|---|
| **A** | 스펙 문서 검수 | §2 표의 Gate A 열 · P0 스펙 5종 | Keep/Refactor/Rebuild·KPI 3·Batch 구분 **명시적 OK** — **2026-06-18 사용자 승인** | ☑ |
| **B** | 시안/와이어 검수 | core-designer 산출 (1440+375) | §5 전항 + 상용화 품질 바 시안 항목 · 확정본 경로 DOC_INVENTORY 기록 | ☐ |
| **C** | React 스테이징 검수 | Batch별 staging | 확정 시안 대비 레이아웃·토큰·a11y · core-tester 게이트 | ☐ |
| **D** | prod 배포 전 sign-off | Batch 1~4 (Phase 3) 완료 후 | [PRE_PRODUCTION_GO_LIVE_CHECKLIST](../../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) 디자인·하드코딩 항목 | ☐ |

**Phase 2 (= Step A+B)** 는 [DESIGN_PHASE3_MASTER_PLAN § Phase 2](./DESIGN_PHASE3_MASTER_PLAN.md#phase-2--검수)와 동일하며, **본 문서 §2·§5를 SSOT**로 사용한다.

---

## 7. 금지·범위 외

| 항목 | 처리 |
|------|------|
| **Trinity** (`frontend-trinity/`) | 본 체크리스트 **제외**. [trinity/README](../trinity/README.md) 별도 |
| **CS `/onboarding`, `/pricing`** | structural samples only — 디자인 1순위 아님 ([SAMPLE_PAGES_POLICY](../SAMPLE_PAGES_POLICY.md)) |
| **C-1 public 스펙** (`DESIGN_V2_PHASE_C1_*.md`) | Deprecated · Reference only |
| **static HTML mockup** | 신규 생성·선행 **금지** |
| **Phase 3 선행 hotfix** | Core Flow Pipeline·Public Main·`/` 허브·KpiFlipCard |
| **전역 버튼/색상 일괄 치환 스크립트** | 금지 ([COMMERCIALIZATION § 비용 절약](./COMMERCIALIZATION_DESIGN_PLAN.md#비용시간-절약-원칙)) |
| **`/test/*` 개발 라우트** | 검수 대상 제외 |

---

## 8. 관련 문서

- [COMMERCIALIZATION_SPEC_ACTIVE.md](./COMMERCIALIZATION_SPEC_ACTIVE.md) — **Active Commercial SSOT** (Gate·Batch·진행 상태)  
- [README.md](./README.md) — 읽기 순서  
- [DESIGN_PHASE3_MASTER_PLAN.md](./DESIGN_PHASE3_MASTER_PLAN.md)  
- [COMMERCIALIZATION_DESIGN_PLAN.md](./COMMERCIALIZATION_DESIGN_PLAN.md)  
- [DESIGN_CURRENT_STATE_ANALYSIS.md](./DESIGN_CURRENT_STATE_ANALYSIS.md)  
- [DOC_INVENTORY.md](./DOC_INVENTORY.md)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-18 | Gate A P0 8건(CS-ADM-001~008) 사용자 승인 — Step A ☑; [COMMERCIALIZATION_SPEC_ACTIVE](./COMMERCIALIZATION_SPEC_ACTIVE.md) 연계 |
| 2026-06-18 | 초안 — Phase 3 착수 전 전체 페이지 인벤토리·6 Batch·3단계 검수 게이트 SSOT |
