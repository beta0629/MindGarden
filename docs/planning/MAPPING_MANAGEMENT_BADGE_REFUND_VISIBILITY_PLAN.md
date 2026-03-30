# 매칭 관리 배지·환불 버튼 가시성 적용 계획서

**작성일**: 2025-03-17  
**담당**: core-planner (기획·분배만, 코드 수정 없음)  
**목표**: 매칭 관리 화면에서 공통 배지 색상 가시성 및 환불 버튼 가시성이 적용되지 않는 문제를, 디버거 분석 결과를 바탕으로 태스크·담당을 분배하고 실행할 계획을 정리한다.

---

## 1. 목표·범위

### 1.1 목표

- **매칭 관리 페이지**(MappingManagementPage) 및 하위 컴포넌트에서  
  (1) **공통 배지 색상 가시성** 적용, (2) **환불 버튼 가시성** 적용.
- 디버거가 제안한 수정 항목을 **우선순위·순서**에 따라 태스크로 나누고, **core-coder** 등에게 분배실행 표대로 위임한다.

### 1.2 적용 범위

| 포함 | 제외 |
|------|------|
| MappingManagementPage, MappingListRow, MappingTableView, MappingCard(해당 시 사용 시), KPI·필터 영역(MappingKpiSection, MappingSearchSection 등) | 다른 어드민 페이지의 배지/버튼 단독 개선(본 계획서 범위 외) |

- **포함 영역**: (1) 공통 배지 색상 가시성 — B0KlA 토큰 반영 + 테이블 뷰 StatusBadge 통일. (2) 환불 버튼 가시성 — 리스트·테이블 뷰 모두 B0KlA 가시성 강화 적용.

---

## 2. 디버거 분석 요약

### 2.1 배지 가시성이 적용되지 않는 이유

- **토큰**: `--ad-b0kla-text-secondary`가 현재 `var(--mg-gray-600)`으로 정의되어 있어, 이 토큰을 쓰는 KPI 라벨·필터 칩·테이블 헤더 등이 밝은 배경 대비에서 옅게 보인다. B0KlA 대비 분석서에서 **gray-700** 변경이 제안되었으나 아직 반영되지 않음.
- **테이블 뷰**: 상태 컬럼이 common **StatusBadge**가 아닌 **인라인 `mg-v2-badge` span**만 사용하여, `dashboard-tokens-extension.css`의 BADGE_LIGHT_BG_CONTRAST_SPEC(`--mg-badge-status-*`)이 테이블 뷰에는 적용되지 않음. 카드/리스트 뷰(StatusBadge 사용)에만 공통 배지 가시성이 적용된 상태.

### 2.2 환불 버튼이 잘 안 보이는 이유

- **MappingListRow**: ActionButton이 `mg-v2-button--danger`(이중 하이픈)를 사용하므로 AdminDashboardB0KlA.css의 “환불 버튼 가시성 강화” 블록이 적용됨.
- **MappingTableView**: 버튼은 **`mg-v2-button-danger`**(단일 하이픈)인데, B0KlA 가시성 강화 선택자는 **`mg-v2-button--danger`**(이중 하이픈)만 대상으로 함. **클래스 불일치**로 테이블 뷰 환불 버튼에는 B0KlA 가시성 블록이 적용되지 않을 수 있음.

---

## 3. 태스크 목록 (우선순위·순서)

| 순서 | 태스크 ID | 내용 | 우선순위 |
|------|-----------|------|----------|
| 1 | T1 | **토큰 수정**: `dashboard-tokens-extension.css`에서 `--ad-b0kla-text-secondary`를 `var(--mg-gray-700)`으로 변경. (선택) `--ad-b0kla-subtitle-color`를 `var(--mg-gray-700)`으로 변경. | 필수 |
| 2 | T2 | **테이블 뷰 StatusBadge 적용**: MappingTableView 상태 컬럼의 인라인 `mg-v2-badge` span을 common **StatusBadge**로 교체, variant 매핑 유지. | 필수 |
| 3 | T3 | **B0KlA 환불 버튼 선택자 보강**: AdminDashboardB0KlA.css “환불 버튼 가시성 강화” 블록에 `.mg-v2-mapping-table__actions-inner .mg-v2-button-danger`(단일 하이픈) 추가. | 필수 |
| 4 | T4 | **(선택) KPI·필터 라벨 점검**: MappingKpiSection·MappingSearchSection 등에서 `--ad-b0kla-text-secondary` 사용처가 T1 토큰 변경 후 가독성 개선되는지 확인. 추가 수정 필요 시 코더에게 전달. | 선택 |

- **실행 순서**: T1 → T2 → T3. T4는 T1 완료 후 검증 단계에서 필요 시 수행.

---

## 4. 분배실행 표

| Phase | 담당 서브에이전트 | 전달할 태스크 설명(체크리스트 요약) | 참조 문서 |
|-------|-------------------|-------------------------------------|-----------|
| **Phase 1** | **core-coder** | **T1 토큰 수정.** `frontend/src/styles/dashboard-tokens-extension.css`에서 `--ad-b0kla-text-secondary`를 `var(--mg-gray-700)`으로 변경. (선택) `--ad-b0kla-subtitle-color`를 `var(--mg-gray-700)`으로 변경. 완료 기준: 저장 후 B0KlA 스코프 내 라벨·칩·헤더 가독성 개선. | `docs/debug/MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_ANALYSIS.md` §5.1, `docs/debug/ADMIN_DASHBOARD_B0KLA_CONTRAST_ANALYSIS.md` §4 |
| **Phase 2** | **core-coder** | **T2 테이블 뷰 StatusBadge 적용.** MappingTableView 상태 컬럼: 인라인 `<span className={\`mg-v2-badge ${badgeVariant}\`}>` 제거 후 common **StatusBadge** 사용. status·variant는 기존 매핑 상태·getStatusVariant 결과를 StatusBadge variant(success/warning/neutral/danger/info)에 맞게 전달. 완료 기준: 테이블 뷰에서도 StatusBadge.css 및 dashboard-tokens-extension의 `--mg-badge-status-*` 적용됨. | `docs/debug/MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_ANALYSIS.md` §5.2 |
| **Phase 3** | **core-coder** | **T3 환불 버튼 가시성.** `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` “환불 버튼 가시성 강화” 블록(93–107행 근처)에 `.mg-v2-mapping-table__actions-inner .mg-v2-button-danger`를 기존 `.mg-v2-button--danger`와 동일 규칙으로 추가. 완료 기준: 카드/리스트 뷰와 테이블 뷰 모두에서 환불 버튼에 동일한 가시성 강화 적용. | `docs/debug/MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_ANALYSIS.md` §5.3 |
| **Phase 4 (선택)** | **core-coder** | **T4 KPI·필터 라벨 점검.** T1 완료 후 매칭 관리 화면에서 MappingKpiSection 라벨·MappingSearchSection 칩 등 가독성 확인. 추가 조정 필요 시 동일 토큰/클래스 기준으로 수정. | 본 계획서 §3 T4, 디버거 분석 §2 |

- **실행 순서**: Phase 1 → Phase 2 → Phase 3. Phase 4는 검증 후 필요 시 호출.
- **참조 스킬**: core-coder — `/core-solution-frontend`, `/core-solution-common-modules`, `/core-solution-atomic-design`. AdminCommonLayout 사용 페이지이므로 기존 레이아웃 유지.

---

## 5. core-coder 전달용 체크리스트

Phase 1~3 호출 시 아래 체크리스트를 태스크에 포함해 전달한다.

- [ ] **T1** `dashboard-tokens-extension.css`: `--ad-b0kla-text-secondary`를 `var(--mg-gray-700)`으로 변경.
- [ ] **T1** (선택) `--ad-b0kla-subtitle-color`를 `var(--mg-gray-700)`으로 변경.
- [ ] **T2** MappingTableView 상태 컬럼: 인라인 `mg-v2-badge` span 제거 → common **StatusBadge** 사용, variant 매핑 유지.
- [ ] **T3** AdminDashboardB0KlA.css: 환불 버튼 가시성 강화 선택자에 `.mg-v2-mapping-table__actions-inner .mg-v2-button-danger` 추가.
- [ ] **검증** 매칭 관리 화면에서 카드/테이블 뷰 전환 후 배지·라벨·필터 칩·환불 버튼 가독성 확인.

---

## 6. 검증 방법 (선택)

- 매칭 관리 페이지 접속 후 **카드 뷰**와 **테이블 뷰** 전환.
- **배지**: 상태 배지(활성/대기/완료 등)가 테이블 뷰에서도 카드/리스트 뷰와 동일한 색·대비로 보이는지 확인.
- **라벨·칩**: KPI 라벨, 필터 pill/칩, 테이블 헤더 텍스트가 T1 토큰 변경 후 gray-700 수준으로 읽기 쉬운지 확인.
- **환불 버튼**: 리스트 행·테이블 행의 “환불” 버튼이 B0KlA 가시성 강화(진한 빨강·border·shadow)가 동일하게 적용되는지 확인.

---

## 7. 요약

| 항목 | 내용 |
|------|------|
| **목표** | 매칭 관리에서 공통 배지 가시성 + 환불 버튼 가시성 적용. |
| **원인** | (1) `--ad-b0kla-text-secondary` gray-600 유지, (2) 테이블 뷰 인라인 mg-v2-badge로 공통 토큰 미적용, (3) 환불 버튼 클래스 mg-v2-button-danger vs mg-v2-button--danger 불일치. |
| **태스크** | T1 토큰 → T2 테이블 StatusBadge → T3 B0KlA 환불 선택자 보강 → (선택) T4 KPI·필터 점검. |
| **다음 단계** | 분배실행 표(§4)대로 Phase 1부터 **core-coder** 호출, §5 체크리스트로 완료 검증. |

---

**기획서 위치**: `docs/planning/MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_PLAN.md`
