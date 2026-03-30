# 매뉴얼 매칭 큐 — 상담사 선택 드롭다운 미표시 원인 분석

## 1. 증상

- **화면**: 매뉴얼 매칭 큐(manual-matching-queue) 내 "상담사 선택" 트리거는 보이지만, 클릭 시 선택 목록(옵션 리스트)이 표시되지 않음.
- **DOM 위치**: `section.manual-matching-queue > div.match-queue-row[0] > div.match-queue-row__action > div.match-queue-row__select > div.custom-select > div.custom-select__trigger`

---

## 2. 검색된 파일·컴포넌트 경로

| 구분 | 경로 |
|------|------|
| 섹션(organism) | `frontend/src/components/admin/AdminDashboard/organisms/ManualMatchingQueue.js` |
| 행(molecule) | `frontend/src/components/admin/AdminDashboard/molecules/MatchQueueRow.js` |
| 커스텀 셀렉트 | `frontend/src/components/common/CustomSelect.js` |
| ManualMatchingQueue 스타일 | `frontend/src/components/admin/AdminDashboard/organisms/ManualMatchingQueue.css` |
| MatchQueueRow 스타일 | `frontend/src/components/admin/AdminDashboard/molecules/MatchQueueRow.css` |
| CustomSelect 스타일 | `frontend/src/components/common/CustomSelect.css` |
| 사용처(B0KlA) | `frontend/src/components/admin/AdminDashboard.js` (라인 840~851) |
| 사용처(V2) | `frontend/src/components/dashboard-v2/AdminDashboardV2.js` (라인 1218~1231) |
| 전역 드롭다운/레이아웃 | `frontend/src/styles/06-components/_dropdowns.css`, `frontend/src/styles/07-global/_layout-fixes.css` |
| 드롭다운 유틸 | `frontend/src/utils/globalDropdownFix.js`, `frontend/src/utils/dropdownPositionHelper.js`, `frontend/src/utils/unifiedLayoutSystem.js` |

---

## 3. 드롭다운 구현 방식 요약

### 3.1 커스텀 셀렉트 vs 네이티브 select

- **커스텀 셀렉트** 사용. 네이티브 `<select>` 아님.
- `CustomSelect.js`: 트리거(`.custom-select__trigger`) + 포탈로 렌더되는 드롭다운(`.custom-select__dropdown`).

### 3.2 open/열림 상태 관리

- **위치**: `CustomSelect` 내부 `useState(false)` → `isOpen`.
- **토글**: 트리거 `onClick`에서 `e.preventDefault()`, `e.stopPropagation()` 후 `setIsOpen(!isOpen)` (단, `!disabled && !loading`일 때만).
- **닫힘**: 외부 클릭 감지 `useEffect`에서 `document.addEventListener('click', handleClickOutside)` (열린 뒤 100ms 지연 등록).

### 3.3 옵션 리스트 데이터 소스

- **ManualMatchingQueue**: 상위에서 받은 `items[]` 각 항목의 `item.consultantOptions` 사용. 없으면 `[]`.
- **상위(AdminDashboard / AdminDashboardV2)**:
  - `items`: `unassignedClients.map(...)` → 각 클라이언트당 `consultantOptions: consultants.map(c => ({ value: String(c.id), label: c.name || ... }))`.
  - `consultants`: AdminDashboardV2 기준 `useState([])` + API `GET /api/v1/admin/consultants/with-vacation` 등으로 설정.
- **MatchQueueRow**: `consultantOptions`를 그대로 `CustomSelect`의 `options` prop으로 전달.
- **CustomSelect**: `options`를 `safeOptions`로 정규화 후 검색어로 필터링한 `filteredOptions`로 렌더. 옵션이 없으면 "옵션이 없습니다" 표시.

### 3.4 옵션 목록이 렌더되는 조건

- **조건부 렌더링**: `CustomSelect.js` 200~236라인 — `isOpen && ReactDOM.createPortal(..., document.body)`.
- 즉, **열림 시에만** 드롭다운 DOM이 `document.body` 직계 자식으로 포탈 렌더됨.
- 포탈된 노드: `<div ref={dropdownRef} className="custom-select__dropdown">` (내부에 검색/옵션 영역 포함).

---

## 4. 원인 후보와 근거

### 4.1 (유력) 포탈된 드롭다운에 대한 CSS 선택자 불일치 — **목록이 항상 숨겨짐**

**근거(코드/DOM):**

- `CustomSelect.css`:
  - 기본: `.custom-select__dropdown` → `opacity: 0`, `pointer-events: none` (83~85라인).
  - 표시: `.custom-select.open .custom-select__dropdown` → `opacity: 1`, `pointer-events: auto` (89~92라인).
- `CustomSelect.js`: 드롭다운을 `ReactDOM.createPortal(..., document.body)`로 **body 직계 자식**에 렌더.
- DOM 구조상 포탈된 요소는 **`.custom-select`의 자손이 아님** → `.custom-select.open .custom-select__dropdown` 선택자가 **포탈된 노드에 적용되지 않음**.
- 따라서 포탈된 `.custom-select__dropdown`는 항상 기본 스타일만 적용되어 **항상 opacity: 0, pointer-events: none** 상태로 남음 → 보이지 않고 클릭도 불가.

**정리:** 클릭 시 `isOpen`은 true로 바뀌고 드롭다운 DOM은 body에 생성되지만, 해당 노드에는 “열림” 스타일이 적용되지 않아 목록이 안 나오는 것으로 보는 것이 타당함.

---

### 4.2 open 상태 토글이 되지 않음 (클릭 핸들러 미연결·state 미갱신)

**가능성:** 낮음.

**근거:** 트리거에 `onClick`이 연결되어 있고 `setIsOpen(!isOpen)` 호출됨. 사용자 설명대로 “트리거는 보인다”고 했으므로 클릭 자체는 동작할 가능성이 높고, 열렸을 때 **보이지 않는** 현상과 더 잘 맞음.

---

### 4.3 옵션 배열이 비어 있음 (API 미호출·실패·잘못된 키)

**가능성:** 보조.

**근거:** 옵션이 비어 있으면 CustomSelect는 "옵션이 없습니다" 문구를 **드롭다운 내부**에 렌더함. 그 영역 자체가 보이지 않는다면 “옵션 없음” 메시지도 안 보이는 것이 맞음. 따라서 **목록이 아예 안 보이는** 현상의 1차 원인으로는 4.1이 더 유력하고, 옵션 부재는 “목록은 떠 있는데 비어 있음”일 때 추가로 확인하면 됨.

---

### 4.4 z-index / overflow로 목록이 가려짐

**가능성:** 낮음(포탈 사용 시).

**근거:** 드롭다운이 `document.body`에 렌더되므로 `section.manual-matching-queue`나 `.match-queue-row`의 `overflow`는 포탈된 패널을 잘라내지 않음. CustomSelect.css에서 `.custom-select__dropdown`에 `z-index: 10100 !important` 지정. 전역/레이아웃 CSS에서도 `.custom-select__dropdown`에 fixed·z-index 지정. 즉, **가시성이 확보된다면** z-index로 가려질 가능성은 상대적으로 낮음. 다만 현재는 4.1 때문에 **opacity: 0**으로 숨겨진 상태가 우선임.

---

### 4.5 이벤트 버블링·preventDefault로 클릭이 막힘

**가능성:** 트리거 “열기”에는 거의 해당 없음.

**근거:** 트리거 클릭 시 `e.stopPropagation()`으로 상위로 버블링을 막고, `setIsOpen(true)`로 열림. “목록이 안 열린다”가 아니라 “열린 목록이 안 보인다”에 가깝다면 4.1이 더 설명에 맞음.

---

### 4.6 조건부 렌더링 오류 (open이어도 옵션 영역이 렌더되지 않음)

**가능성:** 구조적으로는 정상, 스타일만 미적용.

**근거:** `isOpen === true`일 때만 `createPortal`이 호출되므로, open일 때는 옵션 영역이 DOM에 생성됨. 문제는 “렌더 안 됨”이 아니라 **렌더된 요소가 CSS로 숨겨져 있음(opacity: 0, pointer-events: none)** 이라고 보는 것이 맞음.

---

### 4.7 기타 (포커스·키보드·다른 요소가 가림)

**가능성:** 보조.

**근거:** 키보드(Enter/Space/ArrowDown)로도 `setIsOpen(true)` 호출 가능. 포커스/키보드만으로는 “트리거는 보이는데 목록만 안 보인다”를 설명하기 어렵고, 역시 4.1이 주원인으로 보는 것이 타당함.

---

## 5. 결론 및 추가 확인 제안

### 5.1 가장 유력한 원인 (1~2개)

1. **포탈 사용에 따른 CSS 선택자 불일치(4.1)**  
   - 드롭다운이 `document.body`에 렌더되므로 `.custom-select.open .custom-select__dropdown`가 적용되지 않고, 포탈된 노드는 항상 `opacity: 0`, `pointer-events: none` 상태로 남음.  
   - 그래서 트리거 클릭 시 목록이 “생성은 되지만 보이지 않고, 클릭도 안 됨”으로 이어짐.

2. **(보조)** 옵션 데이터가 비어 있는 경우(4.3)  
   - "옵션이 없습니다"만 보이는 경우에 해당. “목록 영역 자체가 안 보일 때”는 1번이 선행 원인으로 확인하는 것이 좋음.

### 5.2 추가 확인 제안

- **브라우저 개발자 도구**: 트리거 클릭 후 `document.body` 직계 자식 중 `div.custom-select__dropdown` 존재 여부 확인. 존재하면 4.1 가능성 높음.
- **Computed 스타일**: 해당 `div.custom-select__dropdown` 노드에서 `opacity`, `pointer-events` 계산값 확인. `opacity: 0`, `pointer-events: none`이면 4.1 확정에 가깝음.
- **데이터**: 상위에서 `consultants`/`unassignedClients`가 제대로 로드되어 각 row에 `consultantOptions`가 비어 있지 않은지 확인 (목록이 한 번 보이게 된 뒤 “비어 있음”이면 4.3 검토).

---

## 6. 수정 제안 (core-coder 위임용)

- **파일**: `frontend/src/components/common/CustomSelect.js`, `frontend/src/components/common/CustomSelect.css`.
- **방향**:
  1. **CSS**: 포탈된 드롭다운이 body에 단독으로 있어도 “열림” 스타일이 적용되도록, **열림 시 포탈된 노드에 붙는 클래스**(예: `custom-select__dropdown--open`)를 도입하고, 해당 클래스에 `opacity: 1`, `pointer-events: auto` 적용.  
     또는 포탈된 `div`에 `className`을 `custom-select__dropdown ${isOpen ? 'custom-select__dropdown--open' : ''}`처럼 동적으로 주고, CSS에서는 `.custom-select__dropdown--open`로 표시 스타일 정의.
  2. **JS**: `createPortal`로 렌더하는 `div`에 위와 같이 `isOpen`에 따른 클래스를 부여해, 부모 `.custom-select.open`에 의존하지 않도록 함.
- **체크리스트**:
  - 매뉴얼 매칭 큐에서 "상담사 선택" 클릭 시 옵션 목록이 보이는지.
  - 옵션 클릭 시 선택·닫힘·배정 플로우가 정상인지.
  - 다른 화면에서 동일 CustomSelect 사용 시 기존 동작이 깨지지 않는지.

---

*작성: core-debugger. 코드 수정은 수행하지 않았으며, 분석 및 수정 제안만 정리함.*
