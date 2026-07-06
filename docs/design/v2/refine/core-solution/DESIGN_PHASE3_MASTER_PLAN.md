# Core Solution Design Phase 3 — Master Plan

> **Status**: Active  
> **Version**: v1.1 — 점검 결과·상용화 계획 반영  
> **Scope**: Core Solution 메인 앱 UI (`frontend/`, 로그인 후 **`/`**). Trinity·public 샘플 페이지는 부차적.  
> **상용화 SSOT**: [COMMERCIALIZATION_DESIGN_PLAN.md](./COMMERCIALIZATION_DESIGN_PLAN.md) · [DESIGN_CURRENT_STATE_ANALYSIS.md](./DESIGN_CURRENT_STATE_ANALYSIS.md)

---

## 원칙 (SSOT)

1. **디자인은 마지막 단계** — 문서·시안 기준 확립 후 React 반영.  
2. **고품질 시안 1벌** → 사용자 검수 → 일괄 React 반영 (부분 패치·일괄 버튼 치환 금지).  
3. **시각 기준**: B0KlA / `AdminDashboardV2`, Calm Forest `--mg-v2-*`, Shield H2 로고.  
4. **코드 앵커**: `frontend/src/components/dashboard-v2/AdminDashboardV2.js`  
5. `/landing`, `/onboarding`, `/pricing` = React 구조 샘플만. 디자인 1순위 아님.  
6. static HTML mockup 신규 생성·선행 **금지** (삭제됨).

---

## Phase 개요

| Phase | 이름 | 산출물 | 다음 단계 게이트 |
|-------|------|--------|------------------|
| **0** | 문서 정리 | INDEX, DOC_INVENTORY, Status 헤더, Deprecated 정리 | 사용자 INDEX 확인 |
| **1** | 메인 시안 (`/`) 및 공개 메인 (`/landing`) | 로그인 후 허브/대시보드 및 공개 메인 **시안 1벌** | 사용자 시안 검수 |
| **2** | 검수 | 피드백 반영·시안 확정 | 확정 서명(또는 명시적 OK) |
| **3** | React 일괄 반영 | `frontend/` 공개 메인(첫인상) → 허브 UI 일괄 구현 | core-tester 게이트 |
| **4** | 확장 | 역할별 허브(상담사 → 내담자 순) 시안→검수→반영 | Phase별 동일 워크플로 |

---

## Phase 0 — 문서 정리

### 목표
CS 디자인 문서 SSOT 재정립. Trinity·mockup·C-1 public 혼동 제거.

### 완료 조건
- [x] [README.md](./README.md) INDEX·읽기 순서·Trinity 제외 명시  
- [x] [DOC_INVENTORY.md](./DOC_INVENTORY.md) CS 파일 Status 표  
- [x] Active/Reference/Deprecated/Archive 헤더 일괄 적용  
- [x] C-1 spec·mockup·Blackhole Ring Deprecated 처리  
- [x] 깨진 mockup 링크 제거  

### 금지사항
- Trinity 본문 대규모 재작성  
- React/HTML mockup 생성  
- public 페이지를 디자인 1순위로 승격  

---

## Phase 1 — 메인 시안 (`/`)

### 목표
로그인 후 **`/`** (TabletHomepage / 대시보드 허브) 상용화 수준 시안 **1벌** 제작.  
Trinity 퍼블릭 페이지를 넘어서는 **내부 앱** 디테일(정보 밀도·역할별 진입·LNB/GNB·위젯).

### 입력 문서
- [CORE_SOLUTION_IDENTITY.md](./CORE_SOLUTION_IDENTITY.md)  
- [DESIGN_V2_TOKEN_SSOT.md](../../DESIGN_V2_TOKEN_SSOT.md)  
- [DESIGN_V2_VISUAL_SPEC.md](../../DESIGN_V2_VISUAL_SPEC.md)  
- [KR_SAAS_BENCHMARK_20260617.md](./KR_SAAS_BENCHMARK_20260617.md) (참고)  
- 코드 앵커: `AdminDashboardV2.js`, `/admin-dashboard-sample` 라우트  

### 완료 조건
- 데스크톱·모바일(최소 375px) 시안 1벌  
- Calm Forest 토큰만 사용 (하드코딩 HEX 금지)  
- Shield H2 로고 variant 명시  
- 역할/테넌트 컨텍스트가 드러나는 허브 IA 스케치 포함  
- KPI 3종 확정 반영: 1. 오늘 상담 일정, 2. 상담사별 오늘 일정, 3. 신규 상담 접수 (2026-06-18)
- [COMMERCIALIZATION_DESIGN_PLAN.md](./COMMERCIALIZATION_DESIGN_PLAN.md) **상용화 품질 바** 시안 항목 충족  
- [사용자 게이트](./COMMERCIALIZATION_DESIGN_PLAN.md#사용자-게이트) 3문항 확정(또는 기본값 문서화)  

### 금지사항
- React 선행 구현  
- static HTML mockup  
- `/landing`·C-1 스펙을 `/` 시안 기준으로 혼용  
- SaaS Blue `#3B82F6` 팔레트를 앱 UI 주조색으로 사용  
- 부분 컴포넌트만 따로 시안 (전체 허브 1벌 원칙)  

---

## Phase 2 — 검수

### 목표
Phase 1 시안 사용자 검수·피드백 반영 후 **확정본** 확보.

### SSOT
- **[DESIGN_REVIEW_CHECKLIST.md](./DESIGN_REVIEW_CHECKLIST.md)** — 전체 수정 대상 목록(§2)·Implementation Batch(§3)·Step A~D 워크플로(§6)·페이지 공통 검수 항목(§5)  
- Phase 2 = 체크리스트 **Step A(스펙) + Step B(시안)** Gate 통과

### 완료 조건
- [DESIGN_REVIEW_CHECKLIST.md §2](./DESIGN_REVIEW_CHECKLIST.md#2-전체-수정-대상-목록) P0 ID Gate A·B ☑  
- [DESIGN_REVIEW_CHECKLIST.md §5](./DESIGN_REVIEW_CHECKLIST.md#5-디자인-검수-체크리스트-페이지시안-공통) + [COMMERCIALIZATION_DESIGN_PLAN.md](./COMMERCIALIZATION_DESIGN_PLAN.md) **상용화 품질 바** 시안 항목 전항목 통과  
- Batch 1~2 확정 시안 파일 경로 DOC_INVENTORY에 기록  
- 미확정 항목은 Phase 3 착수 **차단**  

### 금지사항
- 검수 없이 React 착수  
- “일단 코드에 넣고 보면서” 수정  

---

## Phase 3 — React `/` 반영

### 목표
확정 시안을 `frontend/`의 **공개 메인**과 **허브**에 **일괄** 반영. (반영 순서: 공개 메인(첫인상) → Admin hub 또는 병렬 진행)

### 완료 조건
- `AdminDashboardV2`·TabletHomepage(또는 후속 허브 페이지) 및 공개 메인 라우트와 시각 정합  
- `--mg-v2-*` 토큰만 참조 ([DESIGN_V2_HANDOFF_TO_CODER.md](../../DESIGN_V2_HANDOFF_TO_CODER.md) 준수)  
- [COMMERCIALIZATION_DESIGN_PLAN.md](./COMMERCIALIZATION_DESIGN_PLAN.md) **Keep/Refactor/Rebuild** 표 및 **코드 정합** 체크리스트 충족  
- **[추가]** 공개 메인의 Rebuild (Shield 로고, Calm Forest, 현장형 상담센터 정체성 반영)
- **[추가]** Core Flow Pipeline(전체 너비 균등 분배) 및 KPI Flip Card(3D 회전) 레이아웃 동시 구현
- core-tester: 시각·회귀·접근성 게이트 통과  

### 금지사항
- 시안 없이 부분 패치  
- 전역 버튼/색상 일괄 치환 스크립트  
- public `/landing`과 동일 Template 재사용을 `/` 기준으로 강제  

---

## Phase 4 — 확장 (역할별 허브)

### 목표
어드민(Phase 1~3 완료 후) → **상담사(CONSULTANT) → 내담자(CLIENT)** 순서로 역할별 허브를 Phase 1~3와 동일 워크플로(시안 1벌 → 검수 → React)로 확장.

### 완료 조건
- 역할별 IA·시안·검수·React 반영이 Phase 3와 동일 게이트  
- [COMMERCIALIZATION_DESIGN_PLAN.md](./COMMERCIALIZATION_DESIGN_PLAN.md) 상용화 품질 바·Phase 4 Rebuild 범위 준수  
- [GAP_ANALYSIS.md](../v2/GAP_ANALYSIS.md) 갱신  

### 금지사항
- `/` 미완 상태에서 역할별 페이지만 선행 고도화  
- Trinity 퍼널 작업과 리소스 혼선  

---

## 담당 매핑 (참고)

| Phase | 주 담당 |
|-------|---------|
| 0 | 문서 (generalPurpose + 본 스킬) |
| 1 | core-designer (`model: gemini-3.1-pro` 권장) |
| 2 | 사용자 검수 |
| 3 | core-coder → core-tester |
| 4 | core-designer → core-coder (반복) |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-18 | Phase 3 Master Plan 초안 — 1·2차 실패 후 SSOT 재정립 |
| 2026-06-18 | v1.1 — COMMERCIALIZATION_DESIGN_PLAN 링크·상용화 체크리스트 Phase별 완료 조건 |
| 2026-06-18 | v1.2 — Phase 2 검수 SSOT = DESIGN_REVIEW_CHECKLIST 참조 |
