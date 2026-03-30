# 어드민 공통코드 관리 리뉴얼 화면 설계서 (COMMON_CODE_REDESIGN_SPEC)

## 1. 개요 및 설계 원칙

본 문서는 `docs/planning/COMMON_CODE_REDESIGN_PLAN.md`를 바탕으로 `frontend/src/components/admin/CommonCodeManagement.js`의 전면 리뉴얼을 위한 UI/UX 설계 및 컴포넌트 스펙을 정의합니다.

- **표준 레이아웃 준수**: `AdminCommonLayout`, `ContentHeader`, `ContentArea`를 사용하여 어드민 통일성을 확보합니다.
- **아토믹 디자인 패턴**: Organisms(`GroupListSection`, `CodeDetailSection`) 단위를 기반으로 페이지를 2단계(마스터-디테일) 구조로 분리합니다.
- **디자인 토큰 전면 적용**: 기존의 하드코딩된 hex 컬러 및 픽셀 여백(ImprovedCommonCodeManagement.css 등)을 배제하고, `var(--mg-*)` 및 `var(--ad-b0kla-*)` 토큰을 철저히 명시합니다. 클래스는 `mg-v2-*` 및 `mg-v2-ad-b0kla__*` 네이밍을 따릅니다.

---

## 2. 페이지 전체 레이아웃 (Template/Page)

- **컴포넌트**: `CommonCodeManagementPage`
- **구조**:
  1. `AdminCommonLayout` 내부
  2. `ContentHeader`: 페이지 제목 ("공통코드 관리") 및 브레드크럼/설명
  3. `ContentArea`: 내부를 CSS Grid를 사용하여 **2단 분할(마스터-디테일)** 로 구성. (데스크탑 기준 좌: 4, 우: 8 비율 또는 좌 350px 고정, 우 1fr)

### 2.1. 페이지 컨테이너 스타일 스펙
- **레이아웃(ContentArea 내부)**:
  - `display: grid`
  - `grid-template-columns: 350px 1fr` (모바일/태블릿에서는 `1fr` 세로 배치 `flex-direction: column`)
  - `gap: var(--mg-spacing-xl)` (약 24px)
  - `align-items: start`

---

## 3. 아토믹 컴포넌트 스펙 (Organisms)

### 3.1. GroupListSection (코드그룹 목록 패널)
마스터에 해당하는 좌측 영역으로, 시스템에 등록된 공통코드 그룹을 조회하고 선택합니다.

- **컨테이너 스타일 (`mg-v2-card` 계열 활용)**:
  - `background: var(--ad-b0kla-card-bg)`
  - `border: 1px solid var(--ad-b0kla-border)`
  - `border-radius: var(--ad-b0kla-radius-sm)`
  - `box-shadow: var(--ad-b0kla-shadow)`
  - `padding: var(--mg-spacing-lg)`
  - `display: flex; flex-direction: column; gap: var(--mg-spacing-md)`

- **섹션 헤더**:
  - 좌측 세로 악센트 바: `border-left: 4px solid var(--ad-b0kla-green)`
  - 제목 텍스트: "코드그룹 목록", `font-size: 16px`, `font-weight: 600`, `color: var(--ad-b0kla-title-color)`
  - 패딩: `padding-left: var(--mg-spacing-sm)`

- **검색 바 (SearchFilterBar - Molecule)**:
  - `input` 테두리: `1px solid var(--ad-b0kla-border)`
  - 포커스 시: `border-color: var(--ad-b0kla-green)`

- **리스트 아이템 (GroupCard)**:
  - 개별 코드그룹을 나타내는 카드/리스트 항목.
  - `padding: var(--mg-spacing-md)`
  - `border-bottom: 1px solid var(--ad-b0kla-border)` (마지막 항목 제외)
  - **호버 및 활성 상태 (Selected)**:
    - 호버 시: `background: var(--ad-b0kla-bg)`
    - 활성 시: `background: var(--ad-b0kla-green-bg)`, `border-left: 3px solid var(--ad-b0kla-green)`, `color: var(--ad-b0kla-green)` (폰트 볼드 처리)
  - 텍스트 색상: 기본 `var(--ad-b0kla-title-color)`, 보조 설명 `var(--ad-b0kla-text-secondary)`

### 3.2. CodeDetailSection (세부 코드 목록 패널)
디테일에 해당하는 우측 영역으로, 선택된 코드그룹의 세부 공통코드들을 조회/수정/추가합니다.

- **컨테이너 스타일**:
  - `background: var(--ad-b0kla-card-bg)`
  - `border: 1px solid var(--ad-b0kla-border)`
  - `border-radius: var(--ad-b0kla-radius-sm)`
  - `padding: var(--mg-spacing-xl)`
  - `display: flex; flex-direction: column; gap: var(--mg-spacing-lg)`

- **섹션 헤더 (우측 액션 버튼 포함)**:
  - **좌측 영역**: 악센트 바 + "{선택된 그룹명} 세부 코드"
  - **우측 영역 (ActionButtons - Molecule)**:
    - [신규 추가] 버튼: `mg-v2-btn mg-v2-btn--primary` (배경: `var(--ad-b0kla-green)`, 글자: `#fff`)
    - [저장] 버튼: `mg-v2-btn mg-v2-btn--outline` (테두리: `var(--ad-b0kla-green)`, 글자: `var(--ad-b0kla-green)`)

- **데이터 테이블 (DataTable - Molecule)**:
  - 표 형식으로 세부 코드를 리스팅. 인라인 폼 입력 방식 혹은 행 클릭 시 수정 모드.
  - **Table 헤더**: `background: var(--ad-b0kla-bg)`, `border-bottom: 2px solid var(--ad-b0kla-border)`, `color: var(--ad-b0kla-text-secondary)`, `font-weight: 600`, `font-size: 13px`
  - **Table 로우**: `border-bottom: 1px solid var(--ad-b0kla-border)`
  - **로우 호버**: `background: var(--mg-gray-50)` 또는 `var(--ad-b0kla-bg)`
  - **데이터 텍스트**: `color: var(--ad-b0kla-title-color)`, `font-size: 14px`

- **사용여부 (Pill Toggle 뱃지)**:
  - 사용(Active): `background: var(--ad-b0kla-green-bg)`, `color: var(--ad-b0kla-green)`
  - 미사용(Inactive): `background: var(--ad-b0kla-bg)`, `color: var(--ad-b0kla-text-secondary)`
  - 뱃지 클래스: `mg-v2-badge` 또는 `mg-v2-pill` 스타일 적용.

---

## 4. 컴포넌트별 CSS 토큰 매핑 가이드 (core-coder 전달용)

하드코딩을 원천 차단하기 위해 core-coder는 다음의 변수 매핑을 준수해야 합니다.

| 영역 | 속성 | 사용할 토큰 (CSS 변수) |
|---|---|---|
| **컨테이너 (카드)** | Background | `var(--ad-b0kla-card-bg)` |
| | Border | `var(--ad-b0kla-border)` |
| | Border Radius | `var(--ad-b0kla-radius-sm)` |
| | Box Shadow | `var(--ad-b0kla-shadow)` |
| **타이포그래피** | 제목 텍스트 | `var(--ad-b0kla-title-color)` |
| | 본문 텍스트 | `var(--ad-b0kla-title-color)` |
| | 보조/설명 텍스트 | `var(--ad-b0kla-text-secondary)` |
| **주조색 (Accent/Active)** | Primary Color (Green) | `var(--ad-b0kla-green)` |
| | 연한 배경 (호버/선택) | `var(--ad-b0kla-green-bg)` |
| **여백 (Spacing)** | 내부 패딩/섹션 갭 | `var(--mg-spacing-sm)`, `var(--mg-spacing-md)`, `var(--mg-spacing-lg)`, `var(--mg-spacing-xl)` |
| **테이블/리스트** | 헤더 배경 | `var(--ad-b0kla-bg)` |
| | 구분선 | `var(--ad-b0kla-border)` |

---

## 5. UI 인터랙션 및 상태(State) 설계 가이드

1. **상태 관리 (State)**:
   - 최상위 `CommonCodeManagementPage`에서 `selectedGroup` 상태를 관리합니다.
   - `GroupListSection`에서 항목을 클릭하면 `selectedGroup`이 업데이트되며, `CodeDetailSection`에 props로 전달되어 세부 코드 목록 API를 트리거합니다.
2. **반응형 처리**:
   - 데스크톱: 350px 고정너비 좌측 리스트 + 나머지 우측 디테일 영역 (`grid-template-columns: 350px 1fr`)
   - 모바일/태블릿 (max-width: 768px): 1단 세로 배치. 그룹 선택 란이 상단에 100% 너비로 위치하고, 선택 후 하단으로 디테일 영역이 펼쳐지거나 모달 형태로 전환 (CSS Flex/Grid 재조정).
3. **접근성(A11y)**:
   - 버튼 및 인풋 요소에 적절한 `aria-label` 부여.
   - 포커스 시 `outline: 2px solid var(--ad-b0kla-green)`을 명시적으로 노출하여 키보드 탐색을 지원.

---

## 6. 완료 조건
- [ ] 본 설계서를 바탕으로 `frontend/src/components/admin/CommonCodeManagement.js`의 기존 하드코딩 CSS가 완벽히 제거됨을 확인.
- [ ] 명시된 Organisms (`GroupListSection`, `CodeDetailSection`)가 React 컴포넌트로 분리 구현됨.
- [ ] B0KlA 어드민 디자인 톤(녹색 주조, 다크 텍스트, 카드형 레이아웃)에 부합하게 렌더링됨.