# GNB 드롭다운 마크업·접근성 가이드 (v2)

**작성일**: 2026-03-15  
**담당**: core-publisher  
**목적**: GNB 드롭다운(프로필/빠른액션/알림) 전역 `[role="menu"]` 스타일 충돌 해결을 위한 **마크업·접근성** 정리. 코드 작성 없이 구조·역할·클래스·오버레이 가이드만 기술.

**참조**:
- `docs/design-system/v2/PROFILE_DROPDOWN_LAYOUT_FIX_SPEC.md` — 패널 레이아웃·포지셔닝
- `docs/design-system/v2/GNB_COMPONENTS_DESIGN_SPEC.md` — GNB 컴포넌트 스펙
- `frontend/src/styles/06-components/_dropdowns.css` — 전역 `[role="menu"]` 규칙 (충돌 원인)
- `.cursor/skills/core-solution-publisher/SKILL.md` — HTML 마크업 표준

---

## 1. 구조: 트리거 + 패널 DOM 계층

### 1.1 기본 DOM 계층

- **트리거**: 패널 열기/닫기를 제어하는 버튼 (아이콘 또는 아바타+이름 등).
- **패널**: 트리거 클릭 시 노출되는 플로팅 영역 (메뉴 목록·프로필 정보·알림 목록 등).

권장 **형식** (마크업 관점):

```
[래퍼: 드롭다운 블록]
├── [트리거 버튼]
└── [패널 컨테이너]  ← 열림 시에만 보이거나, 항상 DOM에 두고 visibility/aria-hidden으로 제어
    └── [패널 내부: 헤더·리스트·푸터 등]
```

- 래퍼에 `position: relative`를 두고 패널을 `position: absolute`로 붙이는 방식과, 패널을 **React Portal**로 `document.body` 직하위에 두는 방식 두 가지를 고려할 수 있음.

### 1.2 패널 위치: 형제(트리거 옆) vs React Portal

| 구분 | 패널을 트리거와 **형제**로 둠 (같은 래퍼 안) | 패널을 **React Portal**로 `document.body` 직하위 |
|------|---------------------------------------------|--------------------------------------------------|
| **DOM** | 트리거 래퍼의 자식으로 패널이 같은 부모 아래에 있음 | 패널만 body 직하위에 렌더, 트리거는 GNB 내부에 유지 |
| **포지셔닝** | `position: absolute`, 기준: 래퍼. `top: calc(100%+8px)`, `right: 0` 등으로 배치 | `position: fixed` + 트리거의 getBoundingClientRect() 등으로 **좌표 계산** 필요 |
| **장점** | 기준점이 명확, 좌표 계산 불필요. overflow만 래퍼·GNB 경로에서 visible로 두면 됨 | 부모 overflow/stacking context에 영향받지 않음. z-index·잘림 이슈 회피에 유리 |
| **단점** | GNB 또는 조상에 overflow: hidden이 있으면 패널 잘림. transform 사용 시 containing block 변경 주의 | 매번 트리거 위치 계산·리사이즈/스크롤 시 갱신 필요. 구현 복잡도 증가 |
| **스타일 충돌** | 전역 `[role="menu"]`가 패널에 적용되면 동일하게 fixed 등이 걸려 레이아웃 꼬임 | Portal이면 DOM이 body 쪽이라, 전역 셀렉터가 그대로 적용되면 동일 이슈 가능 (역할/클래스 정리 필요) |

**권장**:
- **포지셔닝이 `fixed` + 좌표 계산**이면 → **React Portal** 선택 권장. GNB overflow/transform 이슈를 원천 회피하고, 전역 스타일은 아래 3장처럼 **v2 전용 클래스·data 속성**으로 패널만 타깃해 우선순위 확보.
- **absolute + 트리거 래퍼 기준**으로 유지할 경우 → GNB·gnb-right 경로 전체에 `overflow: visible` 유지하고, 패널에 적용되는 전역 `[role="menu"]` 규칙을 v2 전용 셀렉터로 덮어쓰는 방식 필요.

---

## 2. 접근성: role·aria·키보드

### 2.1 전역 `[role="menu"]` 스타일 충돌

`_dropdowns.css` 등에서 **전역**으로 다음이 적용되어 있음:

- `[role="menu"]`: position, z-index, isolation 등
- `[role="menu"] > *`: position: fixed, z-index, transform 등

GNB 드롭다운 패널에 `role="menu"`를 그대로 쓰면 이 전역 규칙이 적용되어 레이아웃·위치가 깨짐.

### 2.2 대안 (A) vs (B)

| 방안 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **(A) role="menu" 유지** | 현재처럼 패널에 `role="menu"` 사용. **v2 전용 클래스**로 스타일 우선순위 확보 (예: `.mg-v2-dropdown-panel[role="menu"]` 또는 `.mg-v2-dropdown-panel`만으로 패널 스타일 정의). 전역 `[role="menu"]`보다 구체적인 셀렉터로 덮어씀. | ARIA 의미론 유지. 메뉴 위젯 패턴과 일치. | 전역 CSS에 계속 `[role="menu"]`가 있으면, 셀렉터 구체화·로드 순서 관리 필요 |
| **(B) role 변경** | `role="dialog"` 또는 `role="listbox"` 등으로 변경. `aria-label`, `aria-modal`(dialog인 경우) 등으로 의미 보완. | 전역 menu 스타일과 완전히 분리. | 메뉴가 아닌 위젯으로 스크린리더에 노출될 수 있음. listbox는 단일 선택 목록 의미가 강함. |

**권장**: **(A) role="menu" 유지 + v2 전용 클래스로 스타일 우선순위 확보.**  
GNB 드롭다운은 “메뉴” 의미가 맞고, 전역 스타일을 “v2 GNB 패널”에만 적용되지 않도록 하거나, v2 전용 스타일이 전역보다 나중에·더 구체적으로 적용되도록 정리.

### 2.3 필수 ARIA·속성

- **트리거 버튼**
  - `aria-haspopup="menu"` — 메뉴 형태의 팝업이 있음을 표시.
  - `aria-expanded="true"|"false"` — 패널 열림 상태와 동기화.
  - `aria-controls="패널 id"` — 제어 대상 패널과 연결 (패널에 `id` 부여).
  - 아이콘만 있을 때: `aria-label="알림"`, `"빠른 메뉴"`, `"프로필 메뉴"` 등으로 목적 명시.

- **패널**
  - `id` — 트리거의 `aria-controls`와 동일한 값.
  - `role="menu"` (A안 유지 시).
  - `aria-label="알림"` / `"빠른 메뉴"` / `"프로필 메뉴"` 등 — 패널 목적 요약 (트리거와 동일하거나 보완).

- **메뉴 항목**
  - `role="menuitem"` (메뉴인 경우). 링크/버튼에 각각 적용.
  - 필요 시 `role="menuitemcheckbox"` / `menuitemradio`는 사용 패턴에 맞춰 선택.

### 2.4 키보드

- **ESC**: 패널 닫기. 포커스를 트리거로 되돌리기.
- **포커스 트랩**: 패널이 열려 있는 동안 포커스를 패널 내부로 가두기 (Tab/Shift+Tab 시 패널 밖으로 나가지 않음). 단, “닫기” 오버레이(모바일)나 트리거로 돌아가는 동작은 허용.
- **화살표 키**: 메뉴 항목 간 위/아래 이동 (선택 사항이지만, role="menu" 사용 시 권장).
- **Enter/Space**: 현재 포커스된 menuitem 실행.

---

## 3. 클래스·속성 (BEM·전역 셀렉터 회피)

### 3.1 BEM 유지

- **공통 패널 래퍼**: `.mg-v2-dropdown-panel`
- **블록별 패널**:  
  - `.mg-v2-profile-dropdown__panel`  
  - `.mg-v2-notification-dropdown__panel`  
  - `.mg-v2-quick-actions-dropdown__panel`
- 트리거·래퍼: 기존 스펙 유지 (예: `.mg-v2-profile-dropdown`, `.mg-v2-profile-trigger` 등).

패널 요소에는 **공통** `mg-v2-dropdown-panel` + **블록 요소** `mg-v2-*-dropdown__panel`을 함께 두어, 공통 스타일과 블록별 스타일을 나누어 적용.

### 3.2 전역 `[role="menu"]`에 걸리지 않도록

- **스타일 셀렉터**: v2 GNB 패널만 타깃하려면 **클래스 우선**으로 셀렉터를 구체화.
  - 예: `.mg-v2-dropdown-panel.mg-v2-profile-dropdown__panel` 로 패널 스타일 정의.
  - 전역 `[role="menu"]` / `[role="menu"] > *` 보다 **나중에 로드**되거나, **더 구체적인 셀렉터**로 필요한 속성(position, top, right, z-index 등)을 덮어씀.
- **data-attribute 제안**:  
  - 패널 루트에 `data-mg-v2-dropdown="panel"` 를 두면, 스타일 셀렉터에서 **`[data-mg-v2-dropdown="panel"]`** 만으로도 “v2 GNB 드롭다운 패널”만 선택 가능.  
  - CSS에서 사용 가능: 예) `[data-mg-v2-dropdown="panel"] { position: absolute; ... }` 또는 `.mg-v2-dropdown-panel[data-mg-v2-dropdown="panel"] { ... }` 로 전역 `[role="menu"]`와 분리해 적용 가능.

---

## 4. 오버레이 (모바일 배경 딤)

- **역할**: 패널 외부 클릭·탭 시 닫기용 배경 영역.
- **시맨틱**:  
  - **버튼**으로 마크업 권장 (`<button type="button">`).  
  - 클릭 시 “패널 닫기”만 수행하므로 버튼이 적합.  
  - `aria-label="메뉴 닫기"` 또는 `"드롭다운 닫기"` 등으로 목적 명시.
- **클래스**: 기존 `.mg-v2-dropdown-overlay` 유지.
- **접근성**: 포커스 가능하게 두고, 포커스 트랩 시 “오버레이 → 트리거” 순서로 Tab 이동 가능하게 하거나, 오버레이에 포커스 시 다음 Tab에서 트리거로 이동하도록 처리하면 됨.

---

## 5. 요약 체크리스트

| 항목 | 내용 |
|------|------|
| **구조** | 트리거 + 패널 DOM 계층 명확. fixed+좌표 계산 시 Portal 권장. |
| **접근성** | role="menu" 유지 시 v2 전용 클래스로 스타일 우선순위 확보. aria-label, aria-expanded, aria-haspopup, aria-controls 적용. ESC 닫기·포커스 트랩. |
| **클래스** | .mg-v2-dropdown-panel, .mg-v2-profile-dropdown__panel 등 BEM 유지. data-mg-v2-dropdown="panel" 선택 사용 가능. |
| **오버레이** | button + aria-label("메뉴 닫기" 등), .mg-v2-dropdown-overlay. |

이 문서는 **마크업·접근성·클래스/속성 가이드**만 다룹니다. JS/React 구현·이벤트·구체적 CSS 값은 core-coder·기존 레이아웃 스펙(PROFILE_DROPDOWN_LAYOUT_FIX_SPEC, GNB_COMPONENTS_DESIGN_SPEC)을 참고하면 됩니다.
