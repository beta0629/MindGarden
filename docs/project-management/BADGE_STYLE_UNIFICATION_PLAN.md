# 배지(상태·등급·레벨) 스타일 통일 검토 및 통일 계획

**문서 목적**: 내담자/상담사 프로필 카드의 배지 색상 불일치 이슈를 검토하고, **코어 플래너**가 통일 작업 Phase를 진행할 수 있도록 현황·불일치 목록·통일 방향·수정 대상을 정리한 문서입니다.  
**산출**: core-component-manager. **실행 위임**: core-planner → (Phase 배정 후) core-coder.

**배지 스타일 통일 Phase 1~5 완료**

---

## 1. 현황 요약

### 1.1 이슈 내용

- **증상**: 동일한 "활성" 상태인데 화면/컴포넌트마다 **회색** vs **녹색** 등으로 다르게 표시됨.
- **원인 요약**:
  1. **적용 방식 혼용**: 배지 색상을 주는 방식이 두 가지로 나뉨.
     - **인라인 CSS 변수**: `style={{ '--status-bg-color': ... }}` 로 배경색 주입 (일부 컴포넌트).
     - **모디파이어 클래스**: `mg-v2-status-badge--active`, `mg-v2-badge--success` 등 클래스로 스타일 적용 (다른 컴포넌트).
  2. **스타일 정의 다중 소스**: `.mg-v2-status-badge` 및 모디파이어가 여러 CSS 파일에 흩어져 정의되어 있고, **클래스 네이밍**도 두 체계가 공존함.
     - **상태 이름 기반 (BEM)**: `mg-v2-status-badge--active`, `--inactive`, `--pending`, `--completed`, `--suspended`, `--default`
     - **의미(variant) 기반**: `mg-v2-badge--success`, `--warning`, `--neutral`, `--danger`, `--info`
  3. **인라인 사용 시 색상 공급 문제**: `getStatusColorSync(codeValue)` 가 **사용자 상태(ACTIVE/INACTIVE 등)를 지원하지 않음**. `defaultColorMap`에 `'true'`/`'false'`만 있어, `client?.status`가 `'ACTIVE'` 등이면 **항상 fallback `var(--mg-gray-500)`** 반환 → "활성"이 회색으로 표시되는 원인.

### 1.2 조사 범위

- **배지 관련 클래스**: `mg-v2-status-badge`, `mg-v2-grade-badge`, `mg-v2-consultant-level-badge`
- **사용 방식**: 인라인 `--status-bg-color` vs 모디파이어 클래스 vs 공통 컴포넌트(StatusBadge.js)
- **스타일 정의 위치**: `StatusBadge.css`, `ProfileCard.css`, `ConsultantClientList.css`, `unified-design-tokens.css`, `AdminDashboardB0KlA.css` 등

---

## 2. 불일치 목록

### 2.1 mg-v2-status-badge 사용처 및 방식

| 파일 | 사용 방식 | 비고 |
|------|-----------|------|
| **ClientOverviewTab.js** | 인라인 `style={{ '--status-bg-color': statusColor }}` / `statusColor(client)` | `getStatusColorSync(client?.status)` 사용 → ACTIVE 등 미지원으로 **회색** 표시됨 |
| **ClientConsultationTab.js** | 인라인 `style={{ '--status-bg-color': consultation.isSessionCompleted ? 'var(--mg-success-500,...)' : 'var(--mg-warning-500,...)' }}` | 완료/진행중만 하드코딩, 색은 의도대로 나올 수 있음 |
| **ConsultantComprehensiveManagement.js** | 모디파이어 `mg-v2-status-badge mg-v2-status-badge--${consultant.status?.toLowerCase() \|\| 'active'}` | BEM 상태명 기반 (active/inactive 등) |
| **consultant/molecules/ClientCard.js** | 모디파이어 `mg-v2-status-badge ${statusConfig.className}` (예: `mg-v2-status-badge--active`) | BEM 상태명 기반 |
| **StatusBadge.js** (공통) | 모디파이어 `mg-v2-status-badge mg-v2-badge--${resolvedVariant}` (success/warning/neutral/danger/info) | variant 기반, 디자인 토큰 사용 |
| **SalaryManagement.js** | `mg-v2-status-badge mg-v2-badge--neutral` | variant 기반 |
| **MappingCard.js** | `className="mg-v2-status-badge"` 만 사용 | 배경색은 다른 CSS(또는 상속)에 의존, 컨텍스트에 따라 불일치 가능 |
| **StaffManagement.js** | `mg-v2-status-badge` / `mg-v2-grade-badge` 만 사용 | 모디파이어 없음, 스타일 일관성 낮음 |

### 2.2 mg-v2-grade-badge 사용처

| 파일 | 사용 방식 | 비고 |
|------|-----------|------|
| **ClientOverviewTab.js** | `mg-v2-grade-badge` + 텍스트(등급 아이콘/한글) | 별도 모디파이어 없음 |
| **StaffManagement.js** | `mg-v2-grade-badge` (활성/비활성 텍스트) | 역할/상태 표시에 grade-badge 클래스 사용 |
| **ConsultationCompletionStatsView.js** | `mg-v2-grade-badge ${stat.grade ? 'mg-v2-grade-badge-active' : 'mg-v2-grade-badge-inactive'}` | active/inactive 모디파이어 사용 |

스타일 정의: `unified-design-tokens.css` 에 `.mg-v2-grade-badge`, `.mg-v2-grade-badge-active`, `.mg-v2-grade-badge-inactive` 존재.  
프로필 카드용 등급(브론즈/실버 등)과 혼용 여부는 추가 정리 필요.

### 2.3 mg-v2-consultant-level-badge 사용처

| 파일 | 사용 방식 | 비고 |
|------|-----------|------|
| **ConsultantComprehensiveManagement.js** | `mg-v2-consultant-level-badge mg-v2-consultant-level-badge--${level}` (junior/manier/senior/expert/master) | 일관되게 모디파이어 사용 |
| **ProfileCard.css** | `.mg-v2-consultant-level-badge`, `--junior`, `--manier`, `--senior`, `--expert`, `--master` 정의 | 단일 소스, 디자인 토큰·fallback 사용 |

상담사 레벨 배지는 **모디파이어 클래스 일원화**가 되어 있으나, `StatusBadge`/`grade-badge`와 네이밍·토큰 체계만 통일하면 됨.

### 2.4 스타일 정의 소스 (중복·충돌)

| 정의 위치 | 내용 | 충돌/중복 |
|-----------|------|-----------|
| **StatusBadge.css** | `.mg-v2-status-badge` + `.mg-v2-status-badge.mg-v2-badge--success/warning/neutral/danger/info` | variant 기반, 공통 컴포넌트 전용. 레거시 규칙 이기기 위해 specificity 강화 주석 있음 |
| **unified-design-tokens.css** (11877 근처) | `.mg-v2-status-badge { background-color: var(--status-bg-color, var(--mg-secondary-500)); }` + `mg-v2-status-badge-active/inactive` (단일 하이픈) | 인라인 변수 기반 기본 스타일. `--status-bg-color` 미설정 시 회색 계열 |
| **unified-design-tokens.css** (16987 근처) | `.mg-v2-status-badge` + `mg-v2-status-badge--active/inactive/pending/completed/suspended/default` (배경색 직접 지정) | BEM 더블 대시. active=success-500, inactive=error-500 등 |
| **ConsultantClientList.css** | `.mg-v2-status-badge` + `mg-v2-status-badge--active/inactive/pending/completed/suspended` (연한 배경+진한 글자) | BEM 동일하나 **색감이 다름** (success-50/700 등). 같은 "활성"이어도 화면마다 진한 녹색 vs 연한 녹색 배경으로 다르게 보일 수 있음 |
| **AdminDashboardB0KlA.css** | `.mg-v2-ad-b0kla .mg-v2-mapping-client-block .mg-v2-status-badge--success/warning/neutral` | 특정 블록 내에서만 적용, success/warning/neutral 이름 사용 |

---

## 3. 통일 방향 제안

### 3.1 권장 방향 (모디파이어 클래스 일원화 + 공통 컴포넌트 확대)

1. **단일 스타일 소스**
   - **상태 배지**: `frontend/src/components/common/StatusBadge.css` + (필요 시) `unified-design-tokens.css` 내 **한 곳**만 유지.
   - **레거시/중복**: `unified-design-tokens.css` 내 `.mg-v2-status-badge` 중복 정의 정리, `ConsultantClientList.css`의 배지 색상은 공통 스펙에 맞추거나 공통 컴포넌트로 대체.

2. **적용 방식 통일: 모디파이어 클래스**
   - **인라인 `--status-bg-color` 제거**: ClientOverviewTab, ClientConsultationTab 등에서 `style={{ '--status-bg-color': ... }}` 제거.
   - **상태 → 모디파이어 매핑 일원화**:  
     - 옵션 A: **상태 이름 기반** 유지 시 `mg-v2-status-badge--active`, `--inactive` 등 하나의 체계로 통일하고, 모든 사용처가 동일 클래스명 사용.  
     - 옵션 B: **의미(variant) 기반**으로 통일 시 `StatusBadge.js`처럼 `mg-v2-badge--success`, `--warning` 등만 사용하고, 상태값→variant 매핑은 공통 유틸/StatusBadge에서만 수행.  
     - **권장**: 옵션 B (이미 StatusBadge.js + StatusBadge.css가 variant 기반으로 디자인 토큰 사용 중이므로, 신규/기존 화면 모두 **StatusBadge 컴포넌트** 또는 **status → variant 매핑 테이블 + 동일 클래스 규칙** 적용).

3. **공통 컴포넌트 확대**
   - 내담자/상담사 프로필 카드·목록에서 **상태 배지**는 가능한 한 **`StatusBadge`** 컴포넌트 사용 (`status` prop + 필요 시 `variant` prop).
   - `getStatusColorSync` 의존 제거: 사용자 상태(ACTIVE/INACTIVE 등)에 대한 색상은 **StatusBadge 내부의 status→variant 매핑** 또는 공통 코드 기반 색상 조회로만 제공.

4. **등급 배지(mg-v2-grade-badge)**
   - 용도 정리: "등급(브론즈/실버 등)" vs "활성/비활성" 표시가 혼용되어 있으면, 클래스명 또는 컴포넌트를 분리해 의미별로 일원화.

5. **상담사 레벨 배지(mg-v2-consultant-level-badge)**
   - 현재 ProfileCard.css 단일 소스 유지. 디자인 토큰 변수명만 프로젝트 표준과 맞추면 됨.

### 3.2 대안 (디자인 토큰/테마 변수 일원화)

- 모든 배지 색상을 **CSS 변수(디자인 토큰)** 로만 정의하고, 인라인에서는 `--status-bg-color` 대신 **상태별 변수** (예: `--mg-badge-status-active-bg`)를 설정하는 방식도 가능.
- 이 경우에도 **한 곳에서만** 변수 정의 + **모디파이어 클래스에서만** 해당 변수 참조하도록 하면, 인라인 style 제거와 동일한 효과를 낼 수 있음.  
- 단, 현재는 **모디파이어 클래스 일원화 + StatusBadge 확대**가 기존 코드와의 정합성이 높아 권장.

---

## 4. 수정 대상 파일/컴포넌트 목록

### 4.1 반드시 손대야 할 파일 (불일치 직접 원인)

| 구분 | 파일 | 조치 요약 |
|------|------|------------|
| 프론트 | **ClientComprehensiveManagement/ClientOverviewTab.js** | 인라인 `--status-bg-color` 제거, StatusBadge 사용 또는 status→모디파이어 매핑 적용 |
| 프론트 | **ClientComprehensiveManagement/ClientConsultationTab.js** | 인라인 `--status-bg-color` 제거, StatusBadge 또는 모디파이어 클래스로 통일 |
| 프론트 | **ConsultantComprehensiveManagement.js** | 이미 모디파이어 사용 중. 사용하는 모디파이어 체계가 최종 선택한 단일 체계와 동일한지 확인 후, 필요 시 StatusBadge 컴포넌트로 교체 |
| 프론트 | **consultant/molecules/ClientCard.js** | 모디파이어 체계가 통일안과 일치하는지 확인, 필요 시 StatusBadge로 교체 |
| 스타일 | **unified-design-tokens.css** | `.mg-v2-status-badge` 중복 정의 및 `mg-v2-status-badge-active`(단일 하이픈) vs `mg-v2-status-badge--active`(더블 대시) 정리, 단일 소스로 통합 |
| 스타일 | **ConsultantClientList.css** | `.mg-v2-status-badge--*` 색상을 공통 스펙(StatusBadge.css 또는 통일안)에 맞추거나, 해당 영역에서 StatusBadge 컴포넌트 사용 |

### 4.2 추가로 점검 권장 (일관성·재사용)

| 구분 | 파일 | 조치 요약 |
|------|------|------------|
| 프론트 | **MappingCard.js** | `mg-v2-status-badge` 단독 사용 → 매핑 상태에 맞는 모디파이어 또는 StatusBadge 적용 권장 |
| 프론트 | **StaffManagement.js** | status/grade 배지에 모디파이어 또는 StatusBadge 적용해 다른 화면과 시각 통일 |
| 유틸 | **utils/codeHelper.js** | `getStatusColorSync`: 사용자 상태(ACTIVE/INACTIVE 등) 지원 추가하거나, 배지용 색상은 사용하지 않고 StatusBadge 쪽 매핑만 사용하도록 정리 |
| 스타일 | **StatusBadge.css** | 최종 채택한 모디파이어 체계(variant vs 상태명)에 맞춰 유지 또는 소폭 확장 |
| 스타일 | **ProfileCard.css** | `mg-v2-consultant-level-badge` 유지, 토큰명만 표준과 통일 |
| 스타일 | **AdminDashboardB0KlA.css** | 매핑 블록 내 `mg-v2-status-badge--success/warning/neutral`가 통일안과 충돌하지 않도록 확인 |

### 4.3 참고 (다른 배지/레거시)

- `mg-client-card__status-badge`, `mg-consultant-card__status-badge`, `consultant-status-badge`, `status-badge`(BEM 아님) 등 다른 네이밍의 배지는 **별도 Phase**에서 정리 권장. 본 문서는 `mg-v2-*` 배지 통일에 집중.

---

## 5. 코어 플래너 위임

- **위임 대상**: **core-planner**
- **요청 내용**:  
  - 위 현황·불일치·통일 방향을 바탕으로 **배지 스타일 통일 Phase**를 기획하고,  
  - Phase 단위로 **core-coder**(코드 수정·이동·통합), **core-component-manager**(문서·인벤토리 갱신) 등을 배정하여 실행하도록 진행해 주세요.  
- **산출물 활용**:  
  - 본 문서(`BADGE_STYLE_UNIFICATION_PLAN.md`)를 Phase 입력 자료로 사용하고,  
  - 통일 작업 완료 후 필요 시 이 문서에 "결과 요약" 섹션을 추가하거나, `COMPONENT_PLACEMENT_PROPOSAL.md` / `COMPONENT_INVENTORY.md` 를 갱신해 주세요.

---

## 6. Phase 및 담당 (코어 플래너 기획 완료)

**기획 완료일**: 코어 플래너 기획 완료. 실행 시 `docs/project-management/BADGE_STYLE_UNIFICATION_PHASES.md` 의 분배실행 표를 참고하여 Phase 순서대로 서브에이전트를 호출하세요.

### 6.1 목표·범위 요약

- **목표**: 상태·등급·레벨 배지 스타일 단일 소스화, 인라인 `--status-bg-color` 제거, 모디파이어 클래스·StatusBadge 컴포넌트로 통일.
- **범위**: §4 수정 대상 파일(필수·권장) 및 §2 불일치 목록 전제. 레거시 배지 클래스(`mg-client-card__status-badge` 등) 정리는 별도 Phase 권장.

### 6.2 의존성·순서

- **Phase 1(스타일 정의)** → **Phase 2(StatusBadge·매핑)** → **Phase 3(화면 적용)**. Phase 1·2 완료 후 동일 규칙으로 Phase 3 적용.
- **Phase 4(등급/레벨)**는 Phase 3과 병렬 가능(영역이 다름). Phase 5(문서)는 코드 변경 Phase 이후 수행.

### 6.3 Phase 목록 및 담당

| Phase | 명칭 | 담당 서브에이전트 | 목표 | 비고 |
|-------|------|-------------------|------|------|
| **1** | 스타일 정의 정리 | **core-coder** | unified-design-tokens.css·ConsultantClientList.css·StatusBadge.css 내 `.mg-v2-status-badge` 중복 제거, 단일 소스(variant 기반 권장)로 통합, BEM 더블 대시/단일 하이픈 정리 | §3.1, §2.4 참조 |
| **2** | StatusBadge·매핑 정비 | **core-coder** | StatusBadge에 ACTIVE/INACTIVE 등 status→variant 매핑 반영, getStatusColorSync 의존 제거 또는 보조용으로만 사용. 필요 시 codeHelper 확장 | §3.1 공통 컴포넌트 확대 |
| **3** | 화면·컴포넌트 적용 | **core-coder** | ClientOverviewTab, ClientConsultationTab, ConsultantComprehensiveManagement, ClientCard 등 인라인 제거, StatusBadge 또는 통일된 모디파이어 적용. MappingCard·StaffManagement 권장 조치 반영 | §4.1·§4.2 |
| **4** | 등급·레벨 배지 정리 | **core-component-manager** → **core-coder** | grade-badge 용도(등급 vs 활성/비활성) 분리 제안, consultant-level-badge 토큰 표준 확인. 제안서 기반으로 core-coder가 구현. **제안서**: `BADGE_STYLE_UNIFICATION_PHASE4_PROPOSAL.md` | §3.1 4·5항 |
| **5** | 문서·인벤토리 갱신 | **core-component-manager** 또는 **generalPurpose** | 본 문서 결과 요약 섹션 추가, COMPONENT_INVENTORY/COMPONENT_PLACEMENT_PROPOSAL 필요 시 갱신. `/core-solution-documentation` 적용 | §5 산출물 활용 |

### 6.4 리스크·제약

- 기존 화면별 CSS specificity·레거시 클래스와 충돌 가능: Phase 1에서 StatusBadge.css·unified-design-tokens.css 우선순위 정리 시 레거시 규칙 주석 또는 제거로 정리.
- AdminDashboardB0KlA.css 등 스코프된 배지 클래스는 통일안(success/warning/neutral)과 일치하는지 Phase 3에서 점검.

### 6.5 단계별 완료 기준·체크리스트

- **Phase 1**: (1) `.mg-v2-status-badge` 및 모디파이어가 한 곳(또는 StatusBadge.css + tokens 한 블록)에서만 정의됨. (2) ConsultantClientList.css 배지 색이 공통 스펙과 동일하거나 해당 영역이 StatusBadge 사용으로 대체됨.
- **Phase 2**: (1) StatusBadge에 status prop으로 ACTIVE/INACTIVE 등이 올 때 올바른 variant(success/neutral 등)로 표시됨. (2) getStatusColorSync 인라인 사용처가 Phase 3에서 제거될 수 있음 확인.
- **Phase 3**: (1) §4.1 필수 파일 모두 인라인 `--status-bg-color` 제거됨. (2) 동일 "활성" 상태가 화면 간 동일 색상으로 표시됨. (3) §4.2 권장 파일 점검 완료.
- **Phase 4**: (1) grade-badge 용도 분리 또는 문서화됨. (2) consultant-level-badge 토큰명이 프로젝트 표준과 맞음.
- **Phase 5**: (1) BADGE_STYLE_UNIFICATION_PLAN.md에 결과 요약 추가. (2) 필요 시 컴포넌트 인벤토리 갱신됨.

---

## 7. 결과 요약 (Phase 1~5 반영)

Phase 1~5까지 순차·병렬 실행이 완료되었고, 상태·등급·레벨 배지의 단일 소스화와 화면 적용이 반영된 상태입니다.

**Phase별 수행 요약**  
- **Phase 1(스타일 정의)**: `unified-design-tokens.css`, `ConsultantClientList.css`, `StatusBadge.css`에서 `.mg-v2-status-badge` 중복 정의를 제거하고, **variant 기반**(success/warning/neutral/danger/info) 단일 소스로 통합. BEM 더블 대시(`--active` 등)와 단일 하이픈 혼용 정리.  
- **Phase 2(StatusBadge·매핑)**: `StatusBadge.js`에 사용자/매칭 상태(ACTIVE, INACTIVE, PENDING_PAYMENT 등) → variant 매핑(`STATUS_TO_VARIANT`) 반영. `getStatusColorSync`는 레거시·보조용으로만 사용하도록 정리(deprecated 주석).  
- **Phase 3(화면·컴포넌트 적용)**: `ClientOverviewTab`, `ClientConsultationTab`, `ConsultantComprehensiveManagement`, `ClientCard`, `MappingCard`, `StaffManagement` 등에서 인라인 `--status-bg-color` 제거 후 **StatusBadge** 또는 통일된 모디파이어 클래스 적용.  
- **Phase 4(등급·레벨)**: `BADGE_STYLE_UNIFICATION_PHASE4_PROPOSAL.md` 제안서 기반으로 등급 배지(mg-v2-grade-badge) 용도 분리·정리, 레벨 배지(mg-v2-consultant-level-badge) 단일 소스(ProfileCard.css) 유지 및 토큰 검토 반영.  
- **Phase 5(문서·인벤토리)**: 본 §7 결과 요약 추가 및 완료 표시. (COMPONENT_INVENTORY.md·COMPONENT_PLACEMENT_PROPOSAL.md는 프로젝트에 없어 본 문서 내 요약만 반영.)

**수정된 주요 파일·통일된 배지 체계**  
수정·반영된 주요 파일: `frontend/src/components/common/StatusBadge.js`, `StatusBadge.css`, `ClientComprehensiveManagement/ClientOverviewTab.js`, `ClientConsultationTab.js`, `ConsultantComprehensiveManagement.js`, `consultant/molecules/ClientCard.js`, `MappingCard.js`, `StaffManagement.js`, `unified-design-tokens.css`, `ConsultantClientList.css`, `AdminDashboardB0KlA.css`, `utils/codeHelper.js` 등.  
통일된 배지 체계: **(1) 상태 배지** — 공통 컴포넌트 **StatusBadge** 사용, `status` / `variant` prop으로 표시. 클래스는 `mg-v2-status-badge` + `mg-v2-badge--{variant}`(success/warning/neutral/danger/info) 단일 규칙. **(2) 등급·레벨** — 등급 표시는 `mg-v2-grade-badge`(등급 전용), 상담사 레벨은 `mg-v2-consultant-level-badge` + 모디파이어(junior/senior 등), 스타일은 ProfileCard.css 단일 소스 유지.

---

*작성: core-component-manager (검토·정리·문서화). 코드 수정은 core-coder가 수행합니다. Phase 및 담당: core-planner 기획 완료.*
