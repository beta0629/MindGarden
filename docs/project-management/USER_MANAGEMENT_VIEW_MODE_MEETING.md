# 사용자 관리 보기 전환(큰 카드 / 작은 카드 / 리스트) 공통 컴포넌트 — 회의 결과

**문서 목적**: 사용자 관리(상담사·내담자·스태프)에서 **보기 전환(큰 카드 / 작은 카드 / 리스트)** 공통(core) 컴포넌트 도입을 위해, 디자이너·컴포넌트 관리자·퍼블리셔·코더 관점을 통합한 회의 결과물.

**작성일**: 2025-03-17  
**참조**: 매칭 관리 `MappingListBlock` 보기 전환 UI (`mg-v2-ad-b0kla__pill-toggle`), B0KlA·unified-design-tokens

---

## 1. 요구·배경 요약

| 항목 | 내용 |
|------|------|
| **현상** | 사용자 관리(상담사·내담자·스태프)에서 현재 **큰 카드만** 노출되어, 인원이 많아지면 스크롤·관리가 어려움. |
| **제안** | **공통(core) 컴포넌트**로, **아이콘 클릭**으로 다음 3가지 보기를 전환할 수 있게 함. |
| **보기 모드** | ① 현재 목록(큰 카드) ② 작은 목록(작은 카드) ③ 리스트형 목록(테이블/리스트) |

**참고 UI**: 매칭 관리의 보기 전환과 동일한 패턴 적용.  
- DOM 예: `section.mg-v2-content-section` > `div.mg-v2-mapping-list-block__card` > `div.mg-v2-mapping-list-block__header` > **`div.mg-v2-ad-b0kla__pill-toggle mg-v2-mapping-list-block__toggle`**  
- 해당 톱글은 아이콘 버튼 3개(카드 / 테이블 / 캘린더). 사용자 관리에는 **큰 카드 / 작은 카드 / 리스트** 3모드로 동일 패턴 적용.

---

## 2. core-designer 관점

### 2.1 3가지 보기의 UI·UX 요구사항

| 보기 | 레이아웃 | 정보 밀도 | 비고 |
|------|----------|-----------|------|
| **큰 카드** | 현재와 동일. 카드당 세로 공간 넉넉, 한 줄에 1개 또는 반응형 2열. | 낮음. 카드당 주요 정보(이름·상태·요약) + 액션. | 기존 사용자 관리 카드 유지. |
| **작은 카드** | 그리드 다열(예: 3~4열 데스크톱, 2열 태블릿, 1열 모바일). 카드 높이·패딩 축소. | 중간. 이름·상태·1~2개 핵심 필드. | 터치 영역 최소 44px 유지. |
| **리스트** | 테이블/리스트형. 한 행에 여러 컬럼(이름·이메일·상태·등록일 등). | 높음. 스캔·정렬·필터와 조합 용이. | 가로 스크롤 방지 또는 반응형 컬럼 숨김. |

- **터치·접근성**: 모든 보기 전환 버튼은 터치 타겟 최소 44px, 포커스 링·키보드 이동 지원.
- **B0KlA·디자인 토큰 일관성**: `--ad-b0kla-*`, `--mg-*` 토큰 사용. 카드/리스트 배경·테두리·타이포는 기존 매칭 리스트 블록과 시각적 톤 유지.

### 2.2 톱글(pill-toggle) 영역

| 항목 | 명세 |
|------|------|
| **아이콘** | **큰 카드**: `LayoutGrid`(lucide-react 등) — 큰 그리드. **작은 카드**: `LayoutGrid2` 또는 동일 계열 2x2 그리드 아이콘. **리스트**: `List` — 리스트/테이블. |
| **라벨/툴팁** | 각 버튼 `title` 또는 `aria-label`: "큰 카드", "작은 카드", "리스트"(또는 "테이블 뷰"). 스크린 리더·호버 시 설명 제공. |
| **선택 상태** | 선택된 버튼: `mg-v2-ad-b0kla__pill--active` 적용(배경 `--ad-b0kla-green`, 흰색 텍스트/아이콘). 비선택: 투명 배경, 보조 텍스트 색. |
| **배치** | 목록 블록 헤더 우측(제목 왼쪽, 토글 오른쪽). 매칭 리스트의 `mg-v2-mapping-list-block__header` 내 토글과 동일한 위치 규칙. |

---

## 3. core-component-manager 관점

### 3.1 공통 컴포넌트 이름·위치

| 항목 | 제안 |
|------|------|
| **이름** | **ViewModeToggle** (또는 **ListBlockViewSwitcher**). 보기 모드만 전환하는 역할이 명확한 쪽 권장. 본 문서에서는 **ViewModeToggle**로 통일. |
| **위치** | `frontend/src/components/common/ViewModeToggle.js` (또는 `frontend/src/components/common/view-mode/ViewModeToggle.js`). 공통 컴포넌트 디렉터리(`common`)에 두어 재사용 범위를 명확히 함. |
| **스타일** | B0KlA pill 토글 스타일은 이미 `MappingListBlock.css`·`AdminDashboardB0KlA.css`에 정의됨. ViewModeToggle 전용 CSS는 `ViewModeToggle.css`로 분리하거나, 공통 B0KlA 클래스만 사용해 중복 제거. |

### 3.2 재사용 범위

| 적용 대상 | 비고 |
|-----------|------|
| **우선 적용** | 사용자 관리 3타입: **ConsultantComprehensiveManagement**(상담사), **ClientComprehensiveManagement**(내담자), **StaffManagement**(스태프). 각 페이지의 "목록 블록" 헤더에 ViewModeToggle 추가. |
| **스타일/마크업 공통화** | 매칭 리스트(`MappingListBlock`)와 동일한 B0KlA 클래스(`mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active`) 사용. 옵션(카드/테이블/캘린더 vs 큰카드/작은카드/리스트)만 props로 구분. 필요 시 MappingListBlock도 ViewModeToggle을 사용하도록 리팩터링 검토(Phase 3 이후). |

### 3.3 Props API 제안

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| **viewMode** | `'largeCard' \| 'smallCard' \| 'list'` | O | 현재 보기 모드. |
| **onViewModeChange** | `(mode: 'largeCard' \| 'smallCard' \| 'list') => void` | O | 모드 변경 시 콜백. |
| **options** | `Array<{ value, icon, label, title? }>` | X | 기본값: `[{ value: 'largeCard', icon: LayoutGrid, label: '큰 카드' }, { value: 'smallCard', icon: LayoutGrid2, label: '작은 카드' }, { value: 'list', icon: List, label: '리스트' }]`. 커스터마이즈 시 사용. |
| **className** | `string` | X | 컨테이너 추가 클래스(예: `mg-v2-mapping-list-block__toggle`). |
| **ariaLabel** | `string` | X | 톱글 그룹의 `aria-label` (예: "목록 보기 전환"). |

---

## 4. core-publisher 관점

### 4.1 HTML 마크업 구조

- **톱글 컨테이너**: `<div class="mg-v2-ad-b0kla__pill-toggle [컨텍스트별 modifier]" role="group" aria-label="목록 보기 전환">`.
- **버튼 3개**: 각각 `<button type="button" class="mg-v2-ad-b0kla__pill [mg-v2-ad-b0kla__pill--active]" aria-pressed="true|false" aria-label="큰 카드" title="큰 카드">` 형태. 아이콘만 넣을 경우 `aria-label`·`title`로 접근성 보완.
- **카드/리스트 영역 래퍼 클래스 제안**:
  - 큰 카드: `mg-v2-list-block__grid mg-v2-list-block__grid--large` (또는 기존 `mg-v2-mapping-list-block__grid`와 동일한 네이밍 규칙).
  - 작은 카드: `mg-v2-list-block__grid mg-v2-list-block__grid--small` (다열 그리드).
  - 리스트: `mg-v2-list-block__table` 또는 `mg-v2-list-block__list` (테이블/리스트 스타일).

### 4.2 기존 매칭 톱글과의 클래스 공통화

| 클래스 | 용도 |
|--------|------|
| **mg-v2-ad-b0kla__pill-toggle** | 톱글 컨테이너. flex, 패딩, 둥근 모서리, 테두리·배경(B0KlA). |
| **mg-v2-ad-b0kla__pill** | 개별 버튼. 아이콘/텍스트, 비활성 스타일. |
| **mg-v2-ad-b0kla__pill--active** | 선택된 버튼. 초록 배경·흰색. |

- 사용자 관리 보기 전환에서도 위 3종 클래스를 그대로 사용하여, 매칭 관리(MappingListBlock)와 시각·동작 일관성 유지. 컨텍스트별 modifier(예: `mg-v2-mapping-list-block__toggle`, `mg-v2-user-list-block__toggle`)는 레이아웃·간격만 필요 시 추가.

---

## 5. core-coder 관점

### 5.1 구현 단계 요약

| 단계 | 내용 |
|------|------|
| **(1) 공통 ViewModeToggle 컴포넌트** | `frontend/src/components/common/ViewModeToggle.js`(및 `.css`) 구현. props: viewMode, onViewModeChange, options(선택). B0KlA pill 클래스 사용, 아이콘 3개(큰카드/작은카드/리스트). |
| **(2) 사용자 관리 3페이지 적용** | ConsultantComprehensiveManagement, ClientComprehensiveManagement, StaffManagement에 viewMode state + ViewModeToggle 배치 + 목록 블록 헤더에 토글 노출. 기존 "큰 카드" 영역을 viewMode === 'largeCard'일 때만 렌더. |
| **(3) 작은 카드·리스트 뷰** | viewMode === 'smallCard'일 때 사용할 **작은 카드 그리드** 컴포넌트, viewMode === 'list'일 때 사용할 **리스트(테이블) 뷰** 컴포넌트 구현. 기존 카드 컴포넌트 재사용 가능하면 재사용, 아니면 뷰 전용 컴포넌트 추가(같은 데이터 소스, 다른 레이아웃). |

### 5.2 참고 코드

- **매칭 보기 전환**: `frontend/src/components/admin/mapping-management/organisms/MappingListBlock.js`
  - `viewMode` state: `'card' | 'table' | 'calendar'`.
  - 톱글: `div.mg-v2-ad-b0kla__pill-toggle.mg-v2-mapping-list-block__toggle` 내부 버튼 3개(LayoutGrid, List, Calendar).
  - `renderContent()` 분기: 빈 목록 / table → MappingTableView / calendar → MappingCalendarView / 기본 → 그리드 카드.

- 사용자 관리에서는 `viewMode`: `'largeCard' | 'smallCard' | 'list'`, `renderContent()`(또는 동일 역할 함수)에서 큰 카드 그리드 / 작은 카드 그리드 / 리스트(테이블) 컴포넌트를 분기 렌더.

---

## 6. Phase별 실행 계획

| Phase | 담당 역할 | 목표 | 주요 산출·파일 |
|-------|-----------|------|----------------|
| **Phase 1** | core-coder | 공통 **ViewModeToggle** 컴포넌트 구현 | `frontend/src/components/common/ViewModeToggle.js`, `ViewModeToggle.css`(필요 시). props: viewMode, onViewModeChange, options. B0KlA pill 클래스·아이콘(큰/작은/리스트). |
| **Phase 2** | core-coder | 사용자 관리 3타입에 viewMode + 토글 + 조건부 렌더 적용 | ConsultantComprehensiveManagement.js, ClientComprehensiveManagement.js, StaffManagement.js. 목록 블록 헤더에 ViewModeToggle 추가, viewMode state, largeCard일 때 기존 카드 그리드 유지. smallCard/list일 때는 임시 플레이스홀더 또는 Phase 3 연계. |
| **Phase 3** | core-designer → core-coder | 작은 카드·리스트 뷰 컴포넌트 설계 및 구현 | 디자이너: 작은 카드/리스트 레이아웃·정보 밀도 스펙. 코더: SmallCardGridView, ListTableView(또는 페이지별 뷰 컴포넌트) 구현 후 Phase 2 페이지에 연결. |
| **Phase 4** (선택) | core-coder | 매칭 리스트 ViewModeToggle 공통화 | MappingListBlock에서 기존 인라인 톱글을 ViewModeToggle 사용으로 교체(options: card/table/calendar). 일관성·유지보수성 확보. |

---

## 7. 위임문 초안 (Phase별)

문서 확정 후, 아래를 참고해 Phase 단위로 서브에이전트를 호출할 수 있음.

### Phase 1 위임 초안 (core-coder)

- **태스크**: 사용자 관리 보기 전환용 공통 컴포넌트 ViewModeToggle 구현.
- **참조 문서**: `docs/project-management/USER_MANAGEMENT_VIEW_MODE_MEETING.md`.
- **요구사항**:  
  - 위치: `frontend/src/components/common/ViewModeToggle.js` (및 필요 시 `.css`).  
  - Props: viewMode (`'largeCard'|'smallCard'|'list'`), onViewModeChange, options(선택), className, ariaLabel(선택).  
  - B0KlA 클래스: `mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active` 사용.  
  - 아이콘: LayoutGrid(큰 카드), LayoutGrid2(작은 카드), List(리스트).  
  - 접근성: role="group", aria-label, aria-pressed, title.  
- **완료 기준**: Storybook 또는 사용자 관리 페이지에 임시 삽입 시 3모드 전환 가능, 스타일이 매칭 리스트 톱글과 일관됨.

### Phase 2 위임 초안 (core-coder)

- **태스크**: ConsultantComprehensiveManagement, ClientComprehensiveManagement, StaffManagement에 viewMode state + ViewModeToggle + 조건부 렌더 적용.
- **참조**: 본 회의 문서 §5, MappingListBlock.js의 viewMode·renderContent 패턴.
- **요구사항**:  
  - 각 페이지 목록 블록 헤더(제목 옆)에 ViewModeToggle 배치.  
  - viewMode state 추가, largeCard일 때 기존 카드 그리드 그대로 노출.  
  - smallCard/list일 때는 Phase 3 연동 전까지 빈 영역 또는 "준비 중" 문구 등으로 처리 가능.  
- **완료 기준**: 3페이지 모두에서 토글 클릭 시 viewMode 변경·큰 카드 보기 유지.

### Phase 3 위임 초안 (core-designer → core-coder)

- **태스크(디자이너)**: 작은 카드·리스트 뷰의 레이아웃·정보 밀도·B0KlA 토큰 스펙 작성.
- **태스크(코더)**: 위 스펙에 따라 작은 카드 그리드·리스트(테이블) 뷰 컴포넌트 구현 후, Phase 2의 3페이지에 viewMode 분기로 연결.
- **완료 기준**: 3가지 보기(큰 카드 / 작은 카드 / 리스트)가 모두 동작하고, 반응형·접근성 요구 충족.

---

## 8. 체크리스트 요약

- [ ] ViewModeToggle 공통 컴포넌트 구현(B0KlA pill, 3모드 아이콘).
- [ ] 상담사/내담자/스태프 관리 목록 블록에 viewMode state + ViewModeToggle 적용.
- [ ] 작은 카드·리스트 뷰 컴포넌트 설계 및 구현.
- [ ] 3모드 전환 시 데이터 소스 동일·화면만 전환되는지 검증.
- [ ] 터치 타겟 44px, aria-label/title, 키보드 포커스 확인.

---

*이 문서는 디자이너·컴포넌트 관리자·퍼블리셔·코더 관점을 한 문서에 통합한 회의 결과물이며, 확정 후 Phase별로 core-coder 등에 위임문을 전달해 실행할 수 있습니다.*
