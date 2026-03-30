# GNB 드롭다운 깨짐 현상 — 원인·수용 기준·해결 방향

> **목표**: GNB 영역 프로필/빠른액션/알림 드롭다운이 트리거 아래·우측 정렬로 정상 표시되고, 스크롤·z-index·모바일에서도 동작하도록 수정하기 위한 스펙.  
> **산출물**: 원인·영향 정리, 수용 기준, 해결 방향, 작업 순서. **코드 작성 없음.**

---

## 1. 요약·목표

- **문제**: GNB의 프로필·빠른액션·알림 드롭다운 패널이 깨져서 표시됨(top=-56px 등 잘못된 좌표, 또는 뷰포트 기준 위치 꼬임).
- **목표**: 위 세 드롭다운을 트리거 기준으로 올바르게 배치하고, 스크롤/overflow·z-index·모바일까지 일관되게 동작하게 한다.

---

## 2. 원인·영향 정리

### 2.1 관련 파일 경로

| 구분 | 파일 경로 | 비고 |
|------|-----------|------|
| 전역 드롭다운 스타일 | `frontend/src/styles/06-components/_dropdowns.css` | `main.css`에서 import |
| 전역 레이아웃 수정 | `frontend/src/styles/07-global/_layout-fixes.css` | `main.css`에서 import |
| 전역 드롭다운 스크립트 | `frontend/src/utils/globalDropdownFix.js` | DOM 로드 후 자동 실행 |
| v2 드롭다운 공통 스타일 | `frontend/src/components/dashboard-v2/styles/dropdown-common.css` | 각 molecule에서 import |
| v2 프로필 드롭다운 | `frontend/src/components/dashboard-v2/molecules/ProfileDropdown.js` / `ProfileDropdown.css` | 패널에 `role="menu"` 사용 |
| v2 빠른액션 드롭다운 | `frontend/src/components/dashboard-v2/molecules/QuickActionsDropdown.js` / `QuickActionsDropdown.css` | 동일 |
| v2 알림 드롭다운 | `frontend/src/components/dashboard-v2/molecules/NotificationDropdown.js` / `NotificationDropdown.css` | 동일 |
| 스타일 로드 순서 | `frontend/src/styles/main.css` | 06-components → 07-global 순 |

### 2.2 어떤 규칙이 어떤 요소를 덮는지

#### (1) `_dropdowns.css` — `[role="menu"]` 전역 적용

- **위치**: `frontend/src/styles/06-components/_dropdowns.css`
- **규칙 1 (L4~L21)**:  
  `select`, `.custom-select`, `.dropdown`, `[role="listbox"]`, **`[role="menu"]`**, `.select-wrapper`, `.dropdown-menu`, …  
  → **`position: relative`**, **`z-index: var(--z-dropdown)`**, **`isolation: isolate`** 적용.
- **규칙 2 (L24~L39)**:  
  **`[role="menu"] > *`** (자식) → **`position: fixed`**, `z-index: var(--z-dropdown-fixed)`, `transform: translateZ(0)`, `will-change: transform`, `isolation: isolate`.

**영향**: v2 패널은 `div.mg-v2-dropdown-panel.*__panel`에 **`role="menu"`**를 사용하므로,  
- 패널 **자체**는 전역 규칙 1에 의해 **`position: relative`**를 받음.  
- v2 전용 **`dropdown-common.css`**의 `.mg-v2-dropdown-panel { position: absolute; top: calc(100% + 8px); right: 0; }`는 **같은 또는 나중에 로드되더라도**, 전역 `[role="menu"]` 규칙과의 우선순위·소스 순서에 따라 **덮어쓰일 수 있음**.  
- 결과: 패널이 **absolute**가 아니라 **relative**로 동작하면, 트리거 아래가 아닌 **문서 흐름 상 위치**에 남아 있거나, 레이아웃이 깨져 **top=-56px** 같은 잘못된 좌표로 보일 수 있음.

#### (2) `globalDropdownFix.js` — `[role="menu"]`에 `position: fixed` 강제, **top/left 미설정**

- **위치**: `frontend/src/utils/globalDropdownFix.js`
- **동작**:  
  - `forceFixedPosition(element)`에서 `element.matches('[role="menu"]')` 등으로 드롭다운으로 판단하면,  
    **`element.style.position = 'fixed !important'`**,  
    **`element.style.zIndex = 'var(--z-dropdown) !important'`** 등을 **인라인**으로 설정.  
  - **`top`·`left`(또는 `right`/`bottom`)는 설정하지 않음.**  
  - MutationObserver·스크롤 핸들러·주기적 `fixAllDropdowns()`로 **새로 추가된/보이는** `[role="menu"]` 요소에 반복 적용.

**영향**:  
- v2 패널이 **position: fixed**만 적용되고 **좌표가 없음** → 뷰포트 기준으로 **초기 위치(0,0 부근 또는 문서 흐름 상 남은 위치)**에 고정되거나, 스크롤 시 더 꼬임.  
- 즉, **전역 스크립트가 v2 GNB 드롭다운의 의도한 위치(트리거 아래·우측 정렬)를 망가뜨리는 직접 원인**으로 볼 수 있음.

#### (3) `_layout-fixes.css` — 헤더 내부 전체에 `position: relative`

- **위치**: `frontend/src/styles/07-global/_layout-fixes.css`
- **규칙 (L68~L71)**:  
  `.mg-header *`, `.simple-header *` → **`position: relative`**, **`z-index: var(--z-header)`**.

**영향**:  
- GNB(헤더) 안의 **모든 자손**이 `position: relative`를 받음.  
- v2 드롭다운 **컨테이너**(`.mg-v2-profile-dropdown` 등)와 **패널** 모두 헤더 자손이면, 패널의 **absolute** 기준이 되는 부모도 **relative**이면서, 위 (1)(2)에 의해 패널 자신은 **relative** 또는 **fixed(좌표 없음)**가 되어 **배치 계산이 어긋남**.

#### (4) v2 드롭다운 측 구현

- **패널 마크업**:  
  `ProfileDropdown.js` L94, `QuickActionsDropdown.js` L79, `NotificationDropdown.js` L135  
  → `<div className="mg-v2-dropdown-panel mg-v2-profile-dropdown__panel" role="menu">` 형태.
- **의도한 스타일**:  
  `dropdown-common.css`의 `.mg-v2-dropdown-panel` → **`position: absolute`**, **`top: calc(100% + 8px)`**, **`right: 0`**, `z-index: 1000` 등.
- **결론**: v2는 **absolute + 트리거 기준** 배치를 의도하지만, **`role="menu"`** 사용 때문에 (1) 전역 CSS와 (2) 전역 스크립트의 영향을 받아 **위치가 깨짐**.

### 2.3 원인 요약 표

| 원인 | 파일 | 적용 대상 | 덮어쓰는 내용 | 결과 |
|------|------|-----------|--------------|------|
| 전역 `[role="menu"]` 스타일 | `_dropdowns.css` | v2 패널(`role="menu"`) | 패널에 `position: relative`, `z-index`, `isolation` | v2의 `position: absolute` 무력화·위치 꼬임 |
| 전역 `[role="menu"] > *` 스타일 | `_dropdowns.css` | v2 패널의 자식 | 자식에 `position: fixed` | 패널 내부 레이아웃에도 영향 가능 |
| 전역 스크립트 | `globalDropdownFix.js` | `[role="menu"]` | 인라인 `position: fixed !important`, **top/left 없음** | 뷰포트 기준 위치 꼬임 |
| 헤더 전체 relative | `_layout-fixes.css` | `.mg-header *` | `position: relative`, `z-index: var(--z-header)` | GNB 내부 기준점·스택 맥락 변경 |

---

## 3. 수용 기준 (Acceptance Criteria)

GNB 드롭다운(프로필·빠른액션·알림)을 열었을 때 아래를 만족해야 한다.

1. **위치·정렬**  
   - 패널이 **트리거 버튼 바로 아래**에 붙어 표시되고, **우측 정렬**(트리거 오른쪽 끝 기준)이 유지된다.
2. **스크롤·overflow**  
   - 페이지 또는 GNB 영역 스크롤 시에도 패널이 **잘리지 않고** 보이거나, 스크롤 시 패널이 **자동으로 닫히거나** 의도한 방식으로 동작한다.  
   - `overflow: hidden` 등으로 패널이 잘리지 않는다.
3. **z-index**  
   - 패널이 **다른 GNB 요소(로고·검색·다른 버튼)** 위에 올바르게 겹쳐 보이며, 모달·다른 플로팅 UI와의 순서도 일관된다.
4. **모바일**  
   - 모바일 뷰포트에서도 (1)~(3)과 동일하게 동작하고, 기존 오버레이·터치 영역(닫기 등)이 정상 동작한다.

---

## 4. 해결 방향 제안

### 4.1 전역 스타일 격리 — v2 전용으로 `role="menu"` 전역 회피

- **목적**: `_dropdowns.css`의 **`[role="menu"]`** 전역 규칙이 **v2 GNB 드롭다운 패널**에 적용되지 않도록 한다.
- **방향**  
  - **A안**: v2 패널에는 **`role="menu"`를 제거**하고, 접근성용 **다른 role/aria** 조합(예: `role="dialog"` + `aria-label`, 또는 `role="listbox"` 등)으로 대체하여 **전역 `[role="menu"]` 셀렉터 대상에서 제외**한다.  
  - **B안**: 전역 규칙을 **세밀하게 한정**한다. 예: `_dropdowns.css`에서 `[role="menu"]` 대신 **기존 레거시 클래스만** 대상으로 하거나, **v2 패널 클래스**(`.mg-v2-dropdown-panel`)를 **제외**하는 셀렉터(예: `[role="menu"]:not(.mg-v2-dropdown-panel)`)를 사용한다.  
- **선택 시 고려**: 접근성(a11y) 요구와 기존 `role="menu"` 사용처 검토. **코더/디자이너**가 a11y 스펙과 함께 결정.

### 4.2 전역 스크립트 격리 — v2 패널 제외 또는 top/left 설정

- **목적**: `globalDropdownFix.js`가 **v2 GNB 드롭다운 패널**에 **position: fixed만 넣고 top/left를 비우는** 동작을 하지 않도록 한다.
- **방향**  
  - **A안**: `[role="menu"]` 중 **v2 패널**(예: `.mg-v2-dropdown-panel` 또는 `.mg-v2-profile-dropdown__panel` 등)은 **forceFixedPosition 적용 대상에서 제외**한다.  
  - **B안**: 제외하지 않고, v2 패널에 대해서는 **트리거의 getBoundingClientRect()**로 **top/left(또는 right/bottom)**를 계산해 인라인으로 넣어 준다. (구현 부담·유지보수는 코더가 판단.)
- **권장**: 우선 **A안(제외)**으로 전역 스크립트 영향만 제거하고, v2는 **CSS/포지셔닝 방식**으로만 처리하는 것이 단순하다.

### 4.3 포지셔닝 방식 — fixed + getBoundingClientRect vs Portal

- **현재 v2 의도**: `dropdown-common.css`의 **absolute** + 트리거 기준(top: calc(100%+8px), right: 0).
- **옵션**  
  - **옵션 1 — absolute 유지**: 위 4.1·4.2로 **전역 규칙/스크립트만 격리**하고, v2는 계속 **position: absolute** + 트리거 바로 아래 배치.  
    - 장점: 변경 범위 작음.  
    - 단점: GNB가 sticky/scroll 시 패널이 잘릴 수 있으므로, **overflow/stacking context** 확인 필요.  
  - **옵션 2 — fixed + getBoundingClientRect**: 패널을 **position: fixed**로 두고, 열릴 때 **트리거.getBoundingClientRect()**로 top/left를 계산해 인라인 또는 state로 적용.  
    - 장점: 스크롤과 무관하게 뷰포트 기준으로 항상 보임.  
    - 단점: 리사이즈·스크롤 시 위치 갱신 로직 필요.  
  - **옵션 3 — Portal**: 패널을 **document.body 또는 GNB 바깥 컨테이너**로 Portal 렌더링하고, **fixed + getBoundingClientRect**로 위치 계산.  
    - 장점: overflow/ stacking context 이슈를 원천 회피.  
    - 단점: 구현량·포커스/접근성 처리 증가.
- **권장**: **옵션 1**로 시작해, 전역 격리만으로 수용 기준을 만족하면 그대로 둠. 만족하지 않으면 **옵션 2** 또는 **옵션 3**을 코더가 선택해 진행.

### 4.4 작업 순서 (코더 / 디자이너 / 퍼블리셔)

- **1) 기획·스펙 확정**  
  - 본 문서(GNB_DROPDOWN_FIX_SPEC.md)와 수용 기준을 팀에서 확정.
- **2) 전역 격리 (코더)**  
  - **2-1** `_dropdowns.css`: v2 패널이 전역 `[role="menu"]` 대상에서 빠지도록 **셀렉터 수정**(B안) 또는 **v2에서 role 변경**(A안).  
  - **2-2** `globalDropdownFix.js`: `.mg-v2-dropdown-panel`(및 동일 패턴)을 **forceFixedPosition 적용 대상에서 제외**.  
  - **2-3** 필요 시 `_layout-fixes.css`에서 GNB 내 v2 드롭다운 패널만 예외 처리 검토.
- **3) 접근성 검토 (디자이너 또는 코더)**  
  - `role="menu"` 제거 시 **대체 role/aria** 결정 및 스펙 반영. (디자이너가 a11y 요구사항 정리, 코더가 적용.)
- **4) v2 포지셔닝 검증 (코더)**  
  - 옵션 1로 수용 기준(트리거 아래·우측, 스크롤·z-index·모바일) 확인.  
  - 미달 시 옵션 2/3 설계 후 구현.
- **5) 퍼블리셔**  
  - 이번 수정이 **마크업 구조 변경**(예: Portal용 루트, wrapper 추가)을 수반하면, **core-publisher**가 디자이너 스펙에 맞춰 **HTML 구조·클래스**만 정리하고, 코더가 JSX·스타일·로직 연동.

**정리**: 코드 작성은 **core-coder**가 담당하고, 접근성·비주얼 요구는 **core-designer**와 협의. 마크업만 변경될 경우 **core-publisher**가 HTML 스펙을 담당. **기획은 본 스펙으로 범위와 순서만 제시하고, 실제 수정 내용은 코더/디자이너가 결정.**

---

## 5. 리스크·제약

- **전역 셀렉터 변경**: `[role="menu"]`를 수정하면 **다른 페이지의 role="menu" 사용처**에 영향을 줄 수 있음. 전역 검색으로 영향 범위 파악 후 수정할 것.
- **globalDropdownFix.js 제외 로직**: v2 패널만 안전하게 식별할 수 있는 클래스(`.mg-v2-dropdown-panel`)를 사용해 제외할 것.
- **접근성**: `role="menu"` 제거 시 스크린 리더·키보드 동작이 유지되도록 대체 role/aria를 반드시 정한다.

---

## 6. 참조

- 전역 스타일 로드: `frontend/src/styles/main.css`  
- GNB·레이아웃: `docs/standards/`, `docs/layout/README.md`, `/core-solution-planning` §0.2  
- 서브에이전트 활용: `docs/standards/SUBAGENT_USAGE.md`  
- 디자인 시스템: `frontend/src/styles/unified-design-tokens.css`, `docs/design-system/`

---

*문서 끝. 코드 작성 없음.*
