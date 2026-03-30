# 모달·버튼 일관성 기획서

**작성일**: 2025-03-14  
**대상 이슈**  
1. 입금 확인 모달(MappingDepositModal): 크기 비정상(1156px 등), 버튼 일관성 없음  
2. 전역 버튼 스타일 불일치: 아토믹 디자인 기반 통일 필요  

**산출물**: 요구사항·범위·우선순위·참조 파일 및 분배실행 표

---

## 1. 요구사항·목표

### 1.1 입금 확인 모달 (MappingDepositModal)

| 항목 | 요구사항 | 비고 |
|------|----------|------|
| (a) 모달 크기 로직 | `size="auto"` vs 고정(`small`/`medium`) 명확화. 콘텐츠 양에 맞는 적절한 크기 | 현재 `size="auto"` 사용, 90vh·flex 레이아웃 충돌 시 비정상 높이 발생 가능 |
| (b) 높이 제한 | 콘텐츠 양에 따른 적절한 `max-height`·`min-height` 적용. 100vh 초과 방지 | `_unified-modals.css` `.mg-modal--auto`는 `max-height: 90vh`이나, B0KlA·MappingCreationModal.css 충돌 가능 |
| (c) 버튼 통일 | 취소(secondary/outline), 입금 확인(primary) B0KlA 표준 클래스로 통일 | 현재 `mg-v2-button-outline`, `mg-v2-button-primary` 사용. 프로젝트 전역 표준과 정렬 필요 |

### 1.2 전역 버튼 일관성

| 항목 | 요구사항 |
|------|----------|
| 조사 | `Button.js`, `mg-v2-button`, `mg-button`, `MGButton` 등 기존 버튼 컴포넌트/클래스 사용처·역할 정리 |
| 수렴 | 권장 표준 1개로 수렴 (컴포넌트 + 클래스 체계) |
| 적용 | 모달·폼·카드 등 전역에 일관 적용 방안 |

---

## 2. 범위

### 2.1 포함

- `MappingDepositModal.js` 및 관련 CSS
- `UnifiedModal` 및 `_unified-modals.css`, `_modals.css`, `MappingCreationModal.css` 모달 크기 로직
- 전역 버튼: `frontend/src/components/ui/Button/Button.js`, `mg-button`, `mg-v2-button` 계열, 모달·폼·카드 내 버튼 사용처

### 2.2 제외

- UnifiedModal 자체 구조 변경(단, size/height 관련 prop·CSS 보완은 포함)
- 기존 모달 마이그레이션 대상 전부(입금 확인 모달에 집중)

---

## 3. 현황 조사 요약 (참조용)

### 3.1 입금 확인 모달

| 항목 | 현재 |
|------|------|
| 컴포넌트 | `MappingDepositModal.js` |
| 모달 | UnifiedModal, `size="auto"`, `className="mg-v2-ad-b0kla"` |
| 스타일 | `MappingCreationModal.css` import |
| 버튼 | `mg-v2-button mg-v2-button-outline` (취소), `mg-v2-button mg-v2-button-primary` (입금 확인) |

### 3.2 모달 크기 관련 CSS (충돌 가능 지점)

| 파일 | 셀렉터 | 내용 |
|------|--------|------|
| `06-components/_unified-modals.css` | `.mg-modal.mg-modal--auto` | `max-height: 90vh`, `height: auto` |
| `06-components/_unified-modals.css` | `.mg-modal.mg-modal--auto .mg-modal__body` | `max-height: calc(90vh - 140px)` |
| `MappingCreationModal.css` | `.mg-modal.mg-v2-ad-b0kla` | `height: fit-content`, `max-height: 90vh` |
| `MappingCreationModal.css` | `.mg-modal.mg-v2-ad-b0kla .mg-modal__body` | `max-height: min(70vh, 600px)` |

→ `90vh`가 큰 뷰포트(예: 1284px)에서 1156px로 계산될 수 있음. `size="auto"`인 단순 폼 모달에 90vh 전체를 허용하는 것이 적절한지 검토 필요.

### 3.3 버튼 패턴 (코드베이스 조사 결과)

| 패턴 | 사용처 예 | 비고 |
|------|-----------|------|
| `mg-button mg-button-primary` | ConsultantCard, ClientCard, SessionManagement | mindgarden-design-system.css |
| `mg-button mg-button-outline` | ClassForm, StatisticsModal | |
| `mg-v2-button mg-v2-button-primary` | RatableConsultationsSection, AdminDashboard, ClientSchedule | B0KlA·어드민 |
| `mg-v2-button mg-v2-button-secondary` | ErpReportModal, DiscountPaymentConfirmationModal | BEM modifier 혼용 |
| `mg-v2-button mg-v2-button--secondary` | ConfirmModal, PrivacyConsentModal, ConsultantRatingModal | 하이픈 vs 언더스코어 |
| `mg-v2-button mg-v2-button-outline` | MappingDepositModal | B0KlA 모달 |
| `Button` 컴포넌트 (mg-button) | Button.js → `mg-button mg-button--${variant}` | ui/Button |
| `MGButton` | IntegratedFinanceDashboard | 별도 컴포넌트 |

→ `mg-button` vs `mg-v2-button`, `mg-v2-button-primary` vs `mg-v2-button--primary` 등 혼용. B0KlA·어드민 영역은 `mg-v2-button` 계열, 그 외는 `mg-button` 계열 혼재.

---

## 4. 우선순위

| 순위 | 작업 | 목표 |
|------|------|------|
| P0 | 입금 확인 모달 크기 수정 | size·max-height 로직 정리로 비정상 높이(1156px 등) 해소 |
| P0 | 입금 확인 모달 버튼 통일 | 취소·확인 버튼 B0KlA 표준으로 정렬 |
| P1 | 전역 버튼 표준 1개 수렴 | 아토믹 Atoms 기준으로 Button 컴포넌트·클래스 권장안 확정 |
| P2 | 모달·폼·카드 전역 버튼 적용 | 점진적 마이그레이션 방안 |

---

## 5. 참조 파일 목록

| 구분 | 경로 |
|------|------|
| 입금 확인 모달 | `frontend/src/components/admin/mapping/MappingDepositModal.js` |
| 통합 모달 | `frontend/src/components/common/modals/UnifiedModal.js` |
| Unified 모달 CSS | `frontend/src/styles/06-components/_unified-modals.css` |
| 베이스 모달 CSS | `frontend/src/styles/06-components/_base/_modals.css` |
| 매칭 생성 모달 CSS | `frontend/src/components/admin/MappingCreationModal.css` |
| 버튼 컴포넌트 | `frontend/src/components/ui/Button/Button.js` |
| 디자인 시스템 버튼 | `frontend/src/styles/mindgarden-design-system.css` (mg-button) |
| B0KlA 버튼 | `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` |
| 매칭 모달 스펙 | `docs/design-system/MAPPING_MODALS_DESIGN_SPEC.md` |
| 매칭 모달 일관성 | `docs/project-management/MAPPING_MODAL_CONSISTENCY_PLAN.md` |
| 모달 표준 스킬 | `.cursor/skills/core-solution-unified-modal/SKILL.md` |
| 아토믹 디자인 스킬 | `.cursor/skills/core-solution-atomic-design/SKILL.md` |
| 디자인 토큰 | `frontend/src/styles/unified-design-tokens.css` |

---

## 6. 의존성·순서

1. **탐색(explore)**: 버튼·모달 사용처·CSS 충돌점 추가 파악 (필요 시)
2. **설계(core-designer)**: 모달 크기·버튼 표준 스펙 (size 로직, height 제한, 버튼 클래스 명세)
3. **구현(core-coder)**: MappingDepositModal 수정, (P1 이후) 전역 버튼 마이그레이션

---

## 7. 리스크·제약

- 모달 CSS가 `_modals.css`, `_unified-modals.css`, `MappingCreationModal.css`, `unified-design-tokens.css` 등 여러 파일에 분산. specificity·로드 순서에 따른 충돌 가능.
- 버튼 통일 시 기존 50+ 사용처 영향. 한 번에 변경 시 리그레션 위험 → 점진 적용 권장.
- B0KlA 어드민 영역은 `mg-v2-button`·B0KlA 토큰 유지 필요.

---

## 8. 분배실행 (실행 요청)

아래 순서로 서브에이전트를 호출해 주세요.

### Phase 0 (탐색, 선택)

- **목적**: 모달 비정상 높이(1156px) 원인·버튼 사용처 추가 파악
- **서브에이전트**: `explore`
- **전달 프롬프트**:  
  "다음 조사 수행: (1) MappingDepositModal이 렌더될 때 `.mg-modal--auto`, `.mg-v2-ad-b0kla`, `mg-modal__body`에 적용되는 CSS 규칙 및 충돌 가능성. (2) `mg-v2-button` vs `mg-button` 사용처 파일·라인 수. 결과를 기획에게 보고."

### Phase 1 (설계)

- **목적**: 입금 확인 모달 크기·버튼 및 전역 버튼 표준 스펙
- **서브에이전트**: `core-designer`
- **전달 프롬프트** (필수 포함):
  - **사용성**: 입금 확인 모달은 간단한 폼(요약바+입력 1개). 콘텐츠에 맞는 compact 높이, 100vh 초과 방지.
  - **정보 노출**: 상담사·내담자·패키지·금액 요약, 입금 참조번호 입력. 기존과 동일.
  - **레이아웃**: UnifiedModal size(`auto` vs `medium`), 바디 `max-height` 제안. 모달 푸터 버튼: 취소(보조), 입금 확인(주조) 클래스 명세.
  - **버튼 표준**: 아토믹 Atoms 기준, B0KlA·어드민용 권장 1개(컴포넌트+클래스). `mg-button` vs `mg-v2-button` 수렴 방안.
  - **참조**: `docs/design-system/MAPPING_MODALS_DESIGN_SPEC.md`, `MAPPING_MODAL_CONSISTENCY_PLAN.md`, `core-solution-unified-modal`, `unified-design-tokens.css`, B0KlA 토큰. 산출물: 스펙 문서(코드 없음).

### Phase 2 (구현 — 입금 확인 모달)

- **목적**: MappingDepositModal 크기·버튼 수정
- **서브에이전트**: `core-coder`
- **전달 프롬프트**:  
  "Phase 1 core-designer 산출물을 참고하여 MappingDepositModal.js 수정: (1) UnifiedModal size·className 조정, 필요 시 CSS 보완으로 비정상 높이(1156px 등) 해소. (2) 취소·입금 확인 버튼을 B0KlA 표준 클래스로 통일. `/core-solution-frontend`, `/core-solution-unified-modal`, `/core-solution-atomic-design` 적용. 결과를 기획에게 보고."

### Phase 3 (구현 — 전역 버튼, P1 완료 후)

- **목적**: 권장 표준 1개로 수렴, 점진 적용 방안 적용
- **서브에이전트**: `core-coder`
- **전달 프롬프트**:  
  "Phase 1 버튼 표준 스펙에 따라, 모달·폼·카드 등 우선 적용 대상(목록은 기획·디자이너 산출물 참조)에 Button 컴포넌트 또는 권장 클래스 적용. 기존 스타일 호환 유지. 결과를 기획에게 보고."

---

## 9. 완료 기준·체크리스트

### 입금 확인 모달

- [ ] 모달 높이가 뷰포트·콘텐츠에 비해 비정상적으로 크지 않음 (90vh 초과·1156px 등 방지)
- [ ] 취소·입금 확인 버튼이 B0KlA·매칭 모달 스펙과 일치
- [ ] UnifiedModal 사용 유지, className="mg-v2-ad-b0kla" 유지

### 전역 버튼 (P1)

- [ ] 권장 표준 1개(컴포넌트+클래스) 문서화
- [ ] 우선 적용 대상 목록 확정
