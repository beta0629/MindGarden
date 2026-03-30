# GNB 드롭다운 미동작 원인 분석 보고서

**작성일**: 2026-03-15  
**대상**: GNB 영역 드롭다운(프로필, 빠른액션, 알림) 전부 미동작  
**역할**: core-debugger — 원인 분석·수정 제안만 수행, 코드 수정 없음

---

## 1. 증상 정리

- **현상**: GNB 드롭다운(프로필, 빠른액션, 알림)이 **하나도 작동하지 않음**.
- **해석 가능한 시나리오**:
  - **A)** 트리거 클릭해도 패널이 **전혀 안 열림**
  - **B)** 열리지만 **위치가 잘못됨** (화면 밖·(0,0)·안 보임)
  - **C)** 열리자마자 **즉시 닫힘**
  - **D)** 열리고 보이지만 **클릭/포커스가 안 됨**

아래 원인 후보는 위 시나리오 모두에 걸쳐 검토한 결과입니다.

---

## 2. 확인한 코드 요약

| 구분 | 파일 | 역할 |
|------|------|------|
| 트리거/배치 | `frontend/src/components/dashboard-v2/molecules/GnbRight.js` | SearchInput + 세 드롭다운 나열, ref/이벤트는 각 드롭다운 내부 |
| 프로필 | `frontend/src/components/dashboard-v2/molecules/ProfileDropdown.js` | dropdownRef(래퍼), triggerRef(버튼), panelRef(패널), Portal → body, click-outside·Escape |
| 빠른액션 | `frontend/src/components/dashboard-v2/molecules/QuickActionsDropdown.js` | 동일 구조, NavIcon에 onClick으로 토글 |
| 알림 | `frontend/src/components/dashboard-v2/molecules/NotificationDropdown.js` | 동일 구조 |
| 위치 계산 | `frontend/src/components/dashboard-v2/hooks/useDropdownPosition.js` | triggerRef/panelRef, isOpen 시 useLayoutEffect에서 computePanelStyle, requestAnimationFrame으로 setPanelStyle |
| 스타일 | `frontend/src/components/dashboard-v2/styles/dropdown-common.css` | `.mg-v2-dropdown-panel` position:fixed, z-index, opacity 0→1 애니메이션 |
| 전역 | `frontend/src/utils/globalDropdownFix.js` | v2 패널 클래스 제외 후 나머지 드롭다운만 forceFixedPosition |
| 전역 | `frontend/src/utils/unifiedLayoutSystem.js` | `[role="menu"]` 등으로 드롭다운 등록, **position: relative** 등 인라인 스타일 적용 |

---

## 3. 가능한 원인 후보

### 3.1 (우선 추정) unifiedLayoutSystem이 v2 패널을 드롭다운으로 등록해 스타일 덮어씀

- **위치**: `frontend/src/utils/unifiedLayoutSystem.js`
- **내용**:
  - `initMutationObserver()`에서 `document.body`를 관찰하며 **추가된 노드**에 대해 `dropdownSelectors`(`'[role="menu"]'` 포함)로 매칭 후 `registerDropdown(node)` 호출.
  - v2 패널은 **`role="menu"`** 를 가진 `div`로 렌더됨(ProfileDropdown/QuickActionsDropdown/NotificationDropdown 모두).
  - `registerDropdown(element)` 안에서 **`element.style.position = 'relative'`**, `zIndex`, `isolation` 등을 인라인으로 설정함.
- **결과**:
  - Portal로 body에 붙은 직후 MutationObserver가 패널을 “드롭다운”으로 등록하고 **position: relative** 를 넣어, `useDropdownPosition`이 적용한 **position: fixed** 및 **top/left** 가 덮어씌워짐.
  - 패널이 문서 흐름에 따라 body 상단 등 잘못된 위치에 그려지거나, 화면 밖/겹침으로 “안 보이거나 작동 안 함”처럼 보일 수 있음.
- **확인 방법**: 드롭다운 열린 상태에서 해당 패널 DOM 요소의 computed style에서 `position`이 `relative`인지, `top`/`left`가 비어 있는지 확인.

### 3.2 useDropdownPosition에서 panelRef 타이밍 (보조)

- **위치**: `frontend/src/components/dashboard-v2/hooks/useDropdownPosition.js`
- **내용**:
  - `useLayoutEffect` 안에서 `panelRef.current`가 null이면 early return하여 `panelStyle`을 갱신하지 않음.
  - Portal은 같은 커밋에서 body에 붙고 ref는 그 시점에 붙지만, **다른 전역 스크립트(unifiedLayoutSystem)가 그 직후에 같은 노드의 style을 덮어쓰면** 1프레임만 fixed였다가 relative로 바뀌는 상황 가능.
- **결과**: “열리는 것 같다가 바로 사라지거나”, “한 번에 잘못된 위치에만 보임” 등과 결합될 수 있음.

### 3.3 click-outside로 인한 즉시 닫힘 (가능성 낮음)

- **위치**: 세 드롭다운 공통 — `dropdownRef.current.contains(target) && panelRef.current.contains(target)` 둘 다 false일 때만 닫음.
- **내용**: 패널은 body에 있으므로 `dropdownRef`(GNB 내 래퍼)에는 포함되지 않지만, **패널 클릭 시 `panelRef.current.contains(target)`가 true**이므로 “패널 클릭 = 외부 클릭”으로 처리되지 않음. 따라서 **패널을 클릭해서 닫히는 구조는 아님**.
- **예외**: 트리거 클릭 시 `setIsOpen(true)` 직후 같은 이벤트 루프에서 document에 mousedown 리스너가 붙는 게 아니라, `useEffect`로 다음 커밋 후에 붙으므로, “열리는 클릭”이 click-outside로 오인될 가능성은 낮음.

### 3.4 전역 스타일/스크립트가 v2 패널을 가리거나 숨김

- **globalDropdownFix.js**: v2 패널 클래스를 `isV2DropdownPanel()`로 제외하고 있어, 해당 스크립트가 v2 패널에 `position`/z-index를 덮어쓰지는 않음.
- **unifiedLayoutSystem.js**: v2 구분 없이 **`[role="menu"]`** 만 보고 처리하므로, v2 패널이 여기서 한 번 더 “드롭다운”으로 취급됨(위 3.1과 동일).

### 3.5 트리거 자체가 동작하지 않는 경우

- **ProfileDropdown**: `user`가 없으면 `return null` → 트리거가 아예 없음. 세션/`sessionManager.getUser()` 확인 필요.
- **QuickActionsDropdown**: `actions.length === 0`이면 `return null` → 역할별 빠른 액션이 없으면 트리거 없음.
- **NotificationDropdown**: 조건부 null 없음.
- **NavIcon**: `onClick`을 그대로 버튼에 전달하므로, 상위에서 `onClick={() => setIsOpen(!isOpen)}`이면 정상 동작해야 함. 다만 상위에서 클릭을 막는 레이어(예: 겹친 오버레이)가 있으면 “클릭해도 안 열림” 가능.

### 3.6 CSS로 인한 비가시화

- **dropdown-common.css**: `.mg-v2-dropdown-panel`에 `opacity: 0`, `transform: translateY(-8px)`로 시작 후 `dropdownFadeIn`으로 200ms 안에 `opacity: 1`, `translateY(0)` 적용. **position이 relative로 덮이면** 레이아웃이 깨져 화면 밖에 있거나 높이 0으로 보이지 않을 수 있음.

---

## 4. 에러/로그와의 연관

- **콘솔 에러**: 현재 코드만 보면 React 경고나 필수 예외는 없어 보임. 다만 `sessionManager.getUser()`가 null을 반환하면 ProfileDropdown이 아예 렌더되지 않으며, 알림 API 실패 시 NotificationDropdown은 `console.error('알림 조회 실패:', error)`만 출력.
- **연관 가능성**: “하나도 작동하지 않음”이 **콘솔 에러로 인한 상위 컴포넌트 크래시**라면, 해당 라우트에서 GNB 자체가 마운트되지 않았을 수 있음. 이 경우 에러 메시지·스택을 확인하면 원인 추적에 도움됨.

---

## 5. 수정 제안 (core-coder 적용용)

### 5.1 [최우선] unifiedLayoutSystem에서 v2 GNB 패널 제외

- **파일**: `frontend/src/utils/unifiedLayoutSystem.js`
- **목적**: v2 드롭다운 패널은 이미 `useDropdownPosition` + Portal로 자체 포지셔닝하므로, 전역 시스템이 `position: relative` 등을 적용하지 않도록 제외.
- **방향**:
  - **옵션 A**: `registerDropdown` 진입 시, 노드가 v2 패널 클래스(`mg-v2-dropdown-panel`, `mg-v2-profile-dropdown__panel`, `mg-v2-quick-actions-dropdown__panel`, `mg-v2-notification-dropdown__panel`) 중 하나를 가지면 **즉시 return**.
  - **옵션 B**: `dropdownSelectors`에서 `[role="menu"]`를 제거하거나, “v2 패널이 아닐 때만” 등록하도록 조건 추가. (다른 [role="menu"] 사용처와 충돌하지 않게 범위 검토 필요.)
- **참고**: `globalDropdownFix.js`의 `V2_DROPDOWN_PANEL_CLASSES` / `isV2DropdownPanel`과 동일한 클래스 목록을 여기서도 사용하면 일관성 유지에 유리.

### 5.2 useDropdownPosition 보강 (선택)

- **파일**: `frontend/src/components/dashboard-v2/hooks/useDropdownPosition.js`
- **목적**: ref가 아직 붙지 않은 첫 프레임에서도 기본 위치라도 주어, 0,0에 그려지는 시간을 줄이거나 없앰.
- **방향**: `panelRef.current`가 null일 때도 `triggerRef.current`만 있으면, `top`/`left`를 트리거 하단·오른쪽 정렬 등 **기본값만이라도** `panelStyle`에 넣어 반환(예: 트리거 rect만 사용한 단순 계산). 현재는 `triggerEl || panelEl`이 없으면 `{ position: 'fixed', zIndex }`만 반환하므로, 최소한 top/left는 트리거 기준으로 두는 편이 안전.

### 5.3 드롭다운 컴포넌트 측 (필요 시)

- **파일**: `ProfileDropdown.js`, `QuickActionsDropdown.js`, `NotificationDropdown.js`
- **방향**: 5.1 적용 후에도 문제가 남으면, 패널 루트에 **data 속성** 예: `data-v2-dropdown-panel="true"` 추가하고, unifiedLayoutSystem에서 `[data-v2-dropdown-panel="true"]`는 등록 대상에서 제외하는 방식으로 이중 방어 가능.

### 5.4 확인용 체크리스트 (수정 후)

1. **unifiedLayoutSystem 제외 적용 후**
   - GNB에서 프로필·빠른액션·알림 트리거 각각 클릭 시 패널이 열리는지.
   - 열린 패널의 DOM에서 `getComputedStyle(panel).position`이 **fixed**인지, `top`/`left`가 숫자(px)로 들어 있는지.
2. **세션/역할**
   - 로그인 상태에서 프로필 드롭다운이 보이는지(ProfileDropdown이 null이 아닌지).
   - 해당 역할에 빠른 액션이 있을 때만 빠른액션 아이콘이 보이는지 확인.
3. **전역 스크립트**
   - 개발자 도구에서 패널이 body 직계 자식으로 붙는지, 그 직후 같은 노드에 `position: relative` 등이 인라인으로 붙지 않는지 확인.
4. **콘솔**
   - 드롭다운 열기/닫기 시 React 경고나 스크립트 에러가 없는지 확인.

---

## 6. 요약

| 우선순위 | 원인 후보 | 수정 방향 |
|----------|-----------|-----------|
| 1 | **unifiedLayoutSystem**이 `[role="menu"]`로 v2 패널을 등록해 `position: relative` 등으로 덮어씀 | `unifiedLayoutSystem.js`에서 v2 패널 클래스(또는 data 속성)로 **등록 제외** |
| 2 | useDropdownPosition에서 panelRef가 null인 프레임에서 top/left 미설정 | 훅에서 trigger만 있어도 기본 top/left 계산해 반환 (선택) |
| 3 | click-outside가 패널을 외부로 오인 | 현재 로직상 가능성 낮음; 5.1 적용 후에도 즉시 닫히면 그때 재검토 |
| 4 | 트리거 미노출 (user null, actions 빈 배열) | 세션/역할 설정 확인 |

**다음 단계**: 위 5.1을 적용한 뒤, 5.4 체크리스트로 동작 여부를 확인하고, 필요 시 5.2·5.3을 보완하는 것을 권장합니다. 코드 수정은 core-coder에게 위임합니다.
