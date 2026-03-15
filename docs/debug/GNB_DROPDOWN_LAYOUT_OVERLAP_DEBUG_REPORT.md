# GNB v2 드롭다운 패널 내부 레이아웃 겹침 디버그 보고서

**작성일**: 2026-03-15  
**대상**: 프로필 드롭다운·빠른 액션 드롭다운 패널 **내부** 요소 겹침(위치 자체는 잡혀 있다고 가정)  
**역할**: core-debugger — 원인 분석·수정 제안만 수행, 코드 수정 없음

---

## 1. 증상 요약

| 드롭다운 | 현상 |
|----------|------|
| **프로필** | 아바타가 "내 정보" 텍스트/아이콘과 겹침; 이메일이 "로그아웃"에 가려짐; 전체적으로 요소 겹침·정리되지 않음 |
| **빠른 액션** | "빠른 대시보드 보기" 같은 텍스트가 두 번 겹쳐 보이는 ghosting(이중 렌더처럼 보임) |

---

## 2. 근본 원인: 전역 `[role="menu"] > *` 규칙

### 2.1 추정 원인

**전역 스타일에서 `[role="menu"]`의 직계 자식(`> *`)에 `position: fixed`가 적용되어, 패널 내부의 헤더 블록과 메뉴 블록이 모두 문서 흐름에서 빠져 동일한 위치에 쌓여 겹침.**

- 프로필: `mg-v2-profile-dropdown__header`(아바타+정보)와 `mg-v2-profile-dropdown__menu`(내 정보/설정/로그아웃)가 둘 다 `position: fixed` → 서로 겹침.
- 빠른 액션: `mg-v2-dropdown-panel__header`("빠른 액션" 제목)와 `mg-v2-quick-actions-list`(대시보드 보기 등)가 둘 다 `position: fixed` → 헤더와 리스트 첫 항목이 겹쳐 ghosting처럼 보임.

### 2.2 근거 (파일:행)

**파일**: `frontend/src/styles/06-components/_dropdowns.css`

- **6~21행**: `[role="menu"]` 자체에 `position: relative`, `z-index`, `isolation` 적용.
- **26~37행** (핵심):

```css
select option,
.custom-select__dropdown,
.dropdown-menu,
[role="listbox"] > *,
[role="menu"] > *,        /* ← v2 패널의 직계 자식(헤더, 메뉴 영역)이 여기 해당 */
.select-dropdown,
.ant-select-dropdown,
.react-select__menu {
  position: fixed;
  z-index: var(--z-dropdown-fixed);
  transform: translateZ(0);
  will-change: transform;
  isolation: isolate;
}
```

v2 패널 구조는 다음과 같음.

- **ProfileDropdown**: `div[role="menu"].mg-v2-dropdown-panel.mg-v2-profile-dropdown__panel`  
  - 직계 자식: `div.mg-v2-profile-dropdown__header`, `div.mg-v2-profile-dropdown__menu`
- **QuickActionsDropdown**: `div[role="menu"].mg-v2-dropdown-panel.mg-v2-quick-actions-dropdown__panel`  
  - 직계 자식: `div.mg-v2-dropdown-panel__header`, `div.mg-v2-quick-actions-list`

위 직계 자식들은 모두 `[role="menu"] > *` 선택자에 매칭되므로 `position: fixed`가 적용됨. `top`/`left`가 없어 초기 containing block(뷰포트) 기준으로 같은 위치에 겹쳐짐.

### 2.3 수정 제안

- **옵션 A (권장)**  
  v2 드롭다운 패널의 직계 자식만 전역 규칙에서 제외하도록, **dropdown-common.css**에 다음 추가:

  - 선택자: `.mg-v2-dropdown-panel[role="menu"] > *`
  - 속성: `position: static;` (또는 `position: relative;`), 필요 시 `transform: none;`, `will-change: auto;`  
  - 목적: 패널 내부는 일반 문서 흐름으로 두어 flex 레이아웃(헤더 + 메뉴)이 정상 동작하도록 함.

- **옵션 B**  
  전역 `_dropdowns.css`에서 `[role="menu"] > *`를 수정해, v2 패널 직계 자식을 제외하도록 선택자 변경 (예: `:not(.mg-v2-dropdown-panel) > *` 형태로 v2 패널 내부는 제외).  
  전역 영향이 크므로 변경 범위·테스트가 필요함.

---

## 3. 프로필 드롭다운: 겹침 유발 가능 CSS 요약

구조: `.mg-v2-profile-dropdown__header`(아바타 + `__info`) + `.mg-v2-profile-dropdown__menu`(내 정보/설정/로그아웃).

| 구분 | 추정 원인 | 근거 (파일:행) | 수정 제안 |
|------|-----------|----------------|-----------|
| **직계 자식 position: fixed** | 헤더·메뉴 블록이 둘 다 fixed로 동일 위치에 쌓임 | `_dropdowns.css` 27행 `[role="menu"] > *` | 위 2.3 적용 시 해소 (패널 내부는 static/relative 유지) |
| **패널 flex + min-height** | `ProfileDropdown.css` 56~62행: 패널에 `min-height: 220px`, `flex-direction: column`, `overflow: hidden`. 직계 자식이 fixed면 flex 레이아웃이 무의미해짐 | `ProfileDropdown.css` 56~62행 | 2.3 적용 후에는 현재 flex/min-height 유지로 정상 동작 예상 |
| **헤더 flex 방향** | `__header`는 `flex-direction: column`, `align-items: center` (71~78행). 레이아웃 자체는 겹침 원인이 아니나, fixed로 빠진 뒤에는 의미 없음 | `ProfileDropdown.css` 71~78행 | 2.3 적용 후 그대로 사용 |
| **메뉴 영역 flex: 1** | `__menu`에 `flex: 1`, `overflow-y: auto` (153~156행). fixed 시 flex 영역으로 계산되지 않음 | `ProfileDropdown.css` 153~156행 | 2.3 적용 후 그대로 사용 |
| **z-index / overflow** | 패널 내부에는 겹침을 유발하는 별도 z-index·overflow 규칙 없음. 전역 `[role="menu"] > *`의 `isolation: isolate`만 자식 stacking context에 영향 | `_dropdowns.css` 36~37행 | 2.3에서 패널 직계 자식 제외 시 함께 해소 |
| **ProfileAvatar** | `ProfileAvatar.css`: position 미지정, flex만 사용. 아바타 자체는 겹침 원인 아님 | `ProfileAvatar.css` 전역 | 수정 불필요 |

**정리**: 프로필 겹침의 직접 원인은 **전역 `[role="menu"] > *`의 `position: fixed`** 하나로 설명 가능. 2.3 수정 제안 적용 시 헤더와 메뉴가 다시 문서 흐름에 참여해 아바타·이메일·메뉴 항목이 겹치지 않도록 할 수 있음.

---

## 4. 빠른 액션 드롭다운: ghosting(이중 렌더처럼 보임) 원인

### 4.1 추정 원인

**헤더("빠른 액션")와 리스트 영역(첫 항목 "대시보드 보기" 등)이 동일한 전역 규칙으로 `position: fixed`가 적용되어 같은 위치에 겹쳐 보이는 것.**  
실제 DOM/텍스트가 두 번 렌더된 것이 아니라, **두 블록이 같은 좌표에 그려져** 제목과 첫 항목이 겹쳐 보이는 현상.

### 4.2 근거 (파일:행)

- **전역 규칙**: 위 2.2와 동일. `[role="menu"] > *` → `mg-v2-dropdown-panel__header`, `mg-v2-quick-actions-list` 모두 `position: fixed` (`_dropdowns.css` 27행).
- **구조**: `QuickActionsDropdown.js` 105~126행 — `role="menu"` 패널 직계 자식은 `mg-v2-dropdown-panel__header`(제목 "빠른 액션")와 `mg-v2-quick-actions-list`(버튼 목록) 두 개뿐.
- **텍스트 출처**:  
  - "빠른 액션": `QuickActionsDropdown.js` 106행 `mg-v2-dropdown-panel__title`.  
  - "대시보드 보기": `gnbQuickActions.js` 26행 ADMIN 퀵 액션 `label: '대시보드 보기'`.  
  서로 다른 노드이나, 두 블록이 fixed로 겹쳐 있어 한 줄에 두 텍스트가 겹쳐 보일 수 있음.
- **이중 렌더 가능성**  
  - JSX 상 동일 노드가 두 번 렌더되는 구조 없음 (헤더 1회, map으로 리스트 1회).  
  - `dropdown-common.css`의 `dropdownFadeIn`은 패널 전체에만 적용되며, `::before`/`::after`로 텍스트를 그리는 규칙 없음.  
  - 따라서 **ghosting은 “같은 위치에 그려진 두 블록”으로 설명 가능.**

### 4.3 수정 제안

- **우선**: 위 2.3(옵션 A) 적용.  
  `.mg-v2-dropdown-panel[role="menu"] > *`에 `position: static`(또는 `relative`)를 주어 헤더와 리스트가 세로로 쌓이도록 하면, "빠른 액션"과 "대시보드 보기" 겹침 현상이 사라져야 함.
- **추가 점검**: 수정 후에도 ghosting이 남으면, 해당 패널에만 적용되는 `::before`/`::after` 또는 다른 전역 선택자(예: `[role="menu"]` 하위)가 텍스트/배경을 중복 그리는지 검사.

---

## 5. 체크리스트 (core-coder 수정 후 확인용)

- [ ] **프로필 드롭다운**: 패널 열었을 때 아바타·이름·이메일·배지가 헤더 영역에만 보이고, "내 정보"/"설정"/"로그아웃"은 그 아래 메뉴 영역에만 표시되는지.
- [ ] **빠른 액션 드롭다운**: "빠른 액션" 제목이 헤더에 한 번만 보이고, "대시보드 보기" 등 항목은 리스트 영역에만 한 번씩 보이는지(겹침/ghosting 없음).
- [ ] **다른 드롭다운**: `_dropdowns.css` 수정 시 기존 `[role="menu"]` 사용처(다른 페이지/컴포넌트)가 있는지 확인하고, v2 패널만 제외했을 때 레이아웃·동작이 깨지지 않는지.
- [ ] **접근성**: `role="menu"` 유지 시, 패널 직계 자식에 `position: static`을 줘도 스크린 리더/키보드 동작에 문제 없는지 한 번 확인.

---

## 6. 참고 파일 목록

| 파일 | 용도 |
|------|------|
| `frontend/src/styles/06-components/_dropdowns.css` | 전역 `[role="menu"]`, `[role="menu"] > *` 규칙 (겹침 직접 원인) |
| `frontend/src/components/dashboard-v2/styles/dropdown-common.css` | v2 패널·헤더 공통 스타일, 페이드인 애니메이션 |
| `frontend/src/components/dashboard-v2/molecules/ProfileDropdown.js` | 프로필 패널 구조 (header + menu) |
| `frontend/src/components/dashboard-v2/molecules/ProfileDropdown.css` | 프로필 패널·헤더·메뉴 스타일 |
| `frontend/src/components/dashboard-v2/molecules/QuickActionsDropdown.js` | 빠른 액션 패널 구조 (header + list) |
| `frontend/src/components/dashboard-v2/molecules/QuickActionsDropdown.css` | 빠른 액션 패널·리스트 스타일 |
| `frontend/src/constants/gnbQuickActions.js` | 빠른 액션 라벨("대시보드 보기" 등) |
| `frontend/src/styles/07-global/_layout-fixes.css` | 드롭다운 z-index 등 (패널 내부 겹침과는 무관) |
