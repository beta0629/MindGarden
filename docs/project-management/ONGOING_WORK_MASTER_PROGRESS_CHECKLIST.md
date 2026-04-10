# 진행 중 작업 — 마스터 진행도 체크리스트 (SSOT)

**목적**: 여러 트랙(ERP·공통 UI·보안·검증)이 동시에 진행될 때 **일이 끝나지 않는 느낌**을 줄이고, **전체에서 진행도를 한곳**에서 파악한다.  
**갱신 주기**: 배치(또는 PR)가 끝날 때마다 담당자가 이 문서만 갱신한다. (세부 설계는 각 전용 문서에 둔다.)

**최종 갱신**: 2026-04-11  
**주관**: core-planner(오케스트레이션) — 구현은 `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`·위임 순서 준수.

---

## 병렬 블록 배치 (현재 스프린트)

**원칙**: 파일 충돌을 막기 위해 **한 블록 = 담당 파일 집합이 겹치지 않게** 나눈다. 배치가 끝나면 아래 표와 구역 1 표를 갱신한다.

| 블록 ID | 범위 (파일·주제) | 담당 | 상태 | 비고 |
|---------|------------------|------|------|------|
| **ERP-B1** | `ErpDashboard.js`, `IntegratedFinanceDashboard.js`, `FinancialCalendarView.js` — 무음 새로고침 트리거를 `MGButton` `loading` 패턴으로 통일 | core-coder | ☑ | `develop` · `68fbd5dfd` (2026-04-11) |
| **ERP-B2** | `ItemManagement.js`, `BudgetManagement.js`, `PurchaseManagement.js` — 무음 재조회 트리거를 `MGButton` `loading`/`loadingText` 패턴으로 통일 | core-coder | ☑ | 동일 커밋 |
| **ERP-B3** | `ImprovedTaxManagement.js`; 환불·승인(`RefundFilters.js`, `RefundFilterBlock.js`, `ApprovalHubLayout.js`) — 무음 새로고침 `MGButton` 통일 | core-coder | ☑ | `develop` · `65e5e5339` (2026-04-11) |
| **ERP-B4a** | `FinancialManagement.js` — 에러 배너 **다시 시도** 네이티브 버튼 → `MGButton` (`loading`·`BudgetManagement`와 동일 계약) | core-coder | ☑ | `develop` · `9dc04b1d1` (2026-04-11) |
| **ERP-B4b** | `organisms/ErpFinanceAdminSyncCard.js` — `Button`(ui) 2곳 → `MGButton`, `initLoading`/`backfillLoading` 연동 | core-coder | ☑ | 동일 커밋 |

---

## 사용 방법

| 단계 | 내용 |
|------|------|
| 1 | 작업 착수 전: 아래 표에서 해당 행 상태를 **진행 중**으로 바꾼다. |
| 2 | PR·배치 완료 후: **완료**로 바꾸고, 필요 시 **비고**에 커밋/PR 번호를 적는다. |
| 3 | 새 트랙이 생기면 **같은 표 형식**으로 행을 추가하고, 상위 기준 문서 링크를 넣는다. |
| 4 | 코드 변경이 있는 배치는 **`core-tester` 검증 게이트**를 통과한 뒤에만 완료로 둔다. |

**상태 기호**

| 기호 | 의미 |
|------|------|
| ☐ | 미착수 |
| 🔄 | 진행 중 |
| ☑ | 완료 |
| — | 해당 없음 / 보류 |

---

## 1. ERP — UX·품질 (로딩·필터·패턴 통일)

**상위 기준**: [ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md](./ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md)  
**관련**: [ERP_CURRENT_STATE_DB_AND_LOGIC_ANALYSIS.md](./ERP_CURRENT_STATE_DB_AND_LOGIC_ANALYSIS.md), `docs/planning/ERP_TEST_SCENARIOS.md`

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| ERP-P4-01 | `UnifiedLoading` — 페이지 전체 대신 인라인·섹션 로딩으로 통일 (ERP 화면별) | 🔄 | 화면별 잔여 점검 |
| ERP-P4-02 | 무음 재조회: `silentRefreshing` + `aria-busy` + 툴바 패턴 정리 | 🔄 | |
| ERP-P4-03 | `ErpFilterToolbar` 도입·정렬 (화면별) | 🔄 | |
| ERP-P4-04 | 무음 조회 트리거 버튼 — `MGButton` `loading` / `loadingText` 패턴 통일 | 🔄 | 급여·재무 거래 탭 일부 ☑ (2026-04-10) |
| ERP-P4-05 | 나머지 ERP 화면 네이티브 새로고침·검색 버튼 인벤토리 → 동일 패턴 적용 | 🔄 | B1~B4 주요 패치 ☑; `components/erp` 내 `RefreshCw`는 필터 초기화·안내 아이콘 등 소수 잔여 |

---

## 2. 공통 UI·레이아웃 (모달·Admin 레이아웃)

**상위 기준**: [SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md](./SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md), [COMMON_UI_ENCAPSULATION_PLAN.md](./COMMON_UI_ENCAPSULATION_PLAN.md)

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| UI-01 | 관리자 공통 레이아웃(`AdminCommonLayout` 등) 미적용 페이지 정리 | 🔄 | 1차 병렬 적용 이력 있음 — 잔여 점검 |
| UI-02 | 미비 모달·서브 컴포넌트 `UnifiedModal` 등 공통화 (2차) | ☐ | |
| UI-03 | [COMPONENT_COMMONIZATION_PARALLEL_CHECKLIST.md](./COMPONENT_COMMONIZATION_PARALLEL_CHECKLIST.md) 잔여·후속 | 🔄 | 표 내 개별 항목은 해당 문서에서 관리 |

---

## 3. 보안·공개 API (온보딩 등)

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| SEC-01 | 공개 온보딩 API 보강 (Rate limit·쿨다운·CAPTCHA·모니터링) | ☐ | `docs/project-management/2026-03-31/TODO_ONBOARDING_PUBLIC_API_HARDENING.md` |

---

## 4. 검증 게이트 (배치 완료 조건)

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| QA-01 | 코드 변경 배치 — `core-tester` 스모크·회귀 (프로젝트 표준) | 🔄 | 배치마다 해당 |
| QA-02 | ERP E2E·스모크 (저장소 워크플로·시나리오가 있는 경우) | ☐ | `docs/planning/ERP_TEST_SCENARIOS.md` 참고 |

---

## 5. 운영 반영 (배포 전)

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| OPS-01 | 운영 반영 전 체크리스트 | ☐ | `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` |
| OPS-02 | 하드코딩·표시 경계·LNB/설정 회의 손오프 조건 | ☐ | `ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` 등 |

---

## 진행률 스냅샷 (수동)

**갱신 시 아래만 수정하면 된다.**

| 구역 | 완료 / 전체 (대략) | 메모 |
|------|-------------------|------|
| 1. ERP | 0 / 5 (세부는 표 참고) | P4-04 일부 완료 시 비고에 날짜 기입 |
| 2. 공통 UI | (채우기) | |
| 3. 보안 | 0 / 1 | |
| 4. 검증 | (채우기) | |
| 5. 운영 | (채우기) | |

---

## 참고 — 문서 중복을 피하는 법

- **원칙**: 이 파일은 **진행도·상태만** 담는다. 설계 상세·페이즈 정의는 **ERP 마스터 플랜** 등 원문에 둔다.
- **이중 관리 방지**: 세부 체크리스트가 이미 있는 주제(예: 공통화 병렬 체크리스트)는 **세부 문서에서 ID를 완료 처리**하고, 이 마스터 표에서는 **트랙 단위 상태**만 맞춘다.

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-04-10 | 최초 작성 — ERP P4 무음 조회·MGButton 일부 반영, 온보딩·레이아웃·검증·운영 구역 추가 |
| 2026-04-10 | 병렬 블록 ERP-B1·B2 표 추가, ERP-P4-05 진행 중 반영 |
| 2026-04-11 | ERP-B1·B2 `core-coder` 병렬 위임; 체크리스트는 커밋 전까지 🔄·미커밋 명시 |
| 2026-04-11 | ERP-B1/B2 커밋 `68fbd5dfd` 반영, develop·main 푸시 |
| 2026-04-11 | ERP-B3 병렬 위임(B3a/B3b), 체크리스트 🔄 |
| 2026-04-11 | ERP-B3 커밋 `65e5e5339`, 체크리스트 ☑ |
| 2026-04-11 | ERP-B4a/B4b 병렬 위임 (재무 오류 재시도·동기화 카드) |
| 2026-04-11 | ERP-B4 커밋 `9dc04b1d1`, 체크리스트 ☑ |
