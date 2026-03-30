# 공통코드 관리 리뉴얼 기획 (COMMON_CODE_REDESIGN_PLAN)

## 1. 제목 및 목표
- **제목**: 어드민 공통코드 관리 페이지 아토믹 디자인 및 표준 레이아웃 전면 리뉴얼
- **목표**: 기존 하드코딩된 스타일과 비표준 레이아웃으로 구현된 `CommonCodeManagement.js`를 MindGarden 표준 디자인 시스템(디자인 토큰 적용) 및 아토믹 디자인 패턴, 어드민 공통 레이아웃에 맞춰 재구축한다.

## 2. 범위 및 경계
- **포함 범위**: 
  - `frontend/src/components/admin/CommonCodeManagement.js` 페이지 전면 재구축
  - 기존 `ImprovedCommonCodeManagement.css` 등 하드코딩된 CSS 제거 및 디자인 토큰(`var(--mg-*)`, `var(--ad-b0kla-*)`) 기반 스타일링 적용
  - 아토믹 디자인 패턴(Atoms, Molecules, Organisms)에 따른 컴포넌트 분리
  - `AdminCommonLayout`, `ContentArea`, `ContentHeader` 적용을 통한 어드민 표준 레이아웃 준수
- **제외 범위**: 
  - 백엔드 API 수정 (기존 API 엔드포인트 유지)
  - 공통코드 비즈니스 로직(데이터 흐름)의 근본적인 변경

## 3. 의존성 및 우선순위
- **선행 조건**: 
  - MindGarden 표준 디자인 토큰(`unified-design-tokens.css`) 및 B0KlA 토큰 정의 확인
  - `AdminCommonLayout`, `ContentArea`, `ContentHeader` 공통 컴포넌트의 가용성 확인
- **우선순위**:
  1. 기존 UI 분석 및 아토믹 디자인 컴포넌트(Organisms, Molecules) 설계 (core-designer)
  2. 아토믹 컴포넌트 기반 코드 구현 및 레이아웃 적용 (core-coder)

## 4. UI 재구성 기획 (아토믹 디자인)
기존 2단계 구조(코드그룹 선택 -> 코드 목록 관리)를 뷰포트 활용을 최적화하기 위해 다음과 같이 분리합니다.

- **Templates / Pages**:
  - `CommonCodeManagementPage`: `AdminCommonLayout` 내부의 `ContentArea`를 2단(좌: 코드그룹, 우: 코드목록) 분할 혹은 마스터-디테일 패턴으로 구성. 상단에는 `ContentHeader` 배치.
- **Organisms**:
  - `CodeGroupListPanel`: 코드그룹(마스터) 목록을 표시하고 검색/추가 기능을 제공하는 패널. (`mg-v2-card` 계열 클래스 활용)
  - `CodeItemListPanel`: 선택된 코드그룹에 속한 세부 코드(디테일) 목록을 표시하고 CRUD를 수행하는 패널.
- **Molecules**:
  - `SearchFilterBar`: 검색어 입력 및 필터링 컴포넌트.
  - `ActionButtons`: 추가, 수정, 삭제, 저장 등의 액션 버튼 그룹.
  - `DataTable`: 공통코드 목록을 보여주는 데이터 테이블.
- **스타일 원칙**:
  - 커스텀 CSS 지양. 클래스명은 `mg-v2-*` 사용.
  - 색상, 여백, 폰트 사이즈 등은 반드시 `var(--mg-*)` 및 `var(--ad-b0kla-*)` 디자인 토큰 사용.

## 5. 리스크 및 제약사항
- 기존 페이지에서 사용하던 컴포넌트 상태(State) 관리 로직이 컴포넌트 분리에 따라 복잡해질 수 있으므로, 최상위 Page 단위에서 상태를 중앙 집중화하거나 적절한 Context/Props 드릴링 설계가 필요함.
- 디자인 토큰 미적용 시 코드 리뷰에서 반려될 수 있으므로 철저한 토큰 사용 검증 필요.

## 6. 완료 기준 및 체크리스트
- [ ] `AdminCommonLayout`, `ContentArea`, `ContentHeader`가 적용되었는가?
- [ ] 하드코딩된 색상/여백 코드가 모두 제거되고 `var(--mg-*)`, `var(--ad-b0kla-*)` 토큰으로 대체되었는가?
- [ ] UI가 Atoms, Molecules, Organisms로 명확히 분리되었는가?
- [ ] 기존 공통코드 조회/추가/수정/삭제 기능이 오류 없이 동작하는가?

---

## 7. 분배실행 표 (실행 위임문)

다음 순서로 서브에이전트를 호출하여 작업을 진행합니다. Phase 1과 Phase 2는 의존성이 있으므로 순차적으로 실행해야 합니다.

| Phase | 담당 서브에이전트 | 적용 스킬 | 목표 및 전달 프롬프트 (요약) |
|---|---|---|---|
| **Phase 1** | `core-designer` | `/core-solution-atomic-design`<br>`/core-solution-design-system-css` | **목표**: 공통코드 관리 페이지 UI/UX 설계 및 컴포넌트 스펙 도출<br>**프롬프트**: "어드민 공통코드 관리 페이지를 아토믹 디자인 패턴(Organisms: `CodeGroupListPanel`, `CodeItemListPanel` 등)으로 설계하세요. 디자인 토큰(`var(--mg-*)`, `var(--ad-b0kla-*)`)을 사용한 스타일링 가이드와 `AdminCommonLayout` 적용 방안을 포함한 설계 산출물을 작성하여 core-coder에게 전달할 스펙을 정리해 주세요." |
| **Phase 2** | `core-coder` | `/core-solution-frontend`<br>`/core-solution-atomic-design` | **목표**: 설계 스펙을 바탕으로 리액트 코드 구현 및 리팩토링<br>**프롬프트**: "Phase 1의 설계 스펙을 바탕으로 `frontend/src/components/admin/CommonCodeManagement.js`를 재구축하세요. `AdminCommonLayout`, `ContentArea`, `ContentHeader`를 적용하고, 내부 컴포넌트를 아토믹 패턴으로 분리하세요. 기존 하드코딩된 CSS를 제거하고 반드시 `mg-v2-*` 클래스와 디자인 토큰을 사용해 구현하세요." |
