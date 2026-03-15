# GNB 드롭다운 디자인 스펙 (v2)

**대상**: 프로필·빠른액션·알림 등 GNB(Global Navigation Bar) 드롭다운  
**목적**: 전역 CSS/스크립트와의 충돌을 피하고, 뷰포트/스크롤과 무관하게 일관된 위치·비주얼을 유지하기 위한 수정용 디자인 스펙.  
**참조**: [PENCIL_DESIGN_GUIDE.md](../PENCIL_DESIGN_GUIDE.md), 어드민 대시보드 샘플(B0KlA), `dropdown-common.css`, 각 Dropdown CSS.

---

## 1. 위치 전략

### 1.1 요구사항

- **의미적 위치**: 트리거 버튼 기준 **트리거 하단 + 8px, 우측 정렬** 유지.
- **표시 안정성**: 스크롤·overflow 제한과 무관하게 패널이 항상 보이도록 할 것.

### 1.2 권장: `position: fixed` + 트리거 `getBoundingClientRect()` 계산

- **권장 여부**: **권장함.**  
  `position: absolute`는 스크롤/overflow가 있는 조상 때문에 잘리거나 위치가 틀어질 수 있으므로, 뷰포트 기준 고정 위치가 안전함.
- **적용 방식**  
  - 패널 루트에 `position: fixed` 적용.  
  - 트리거 DOM에서 `getBoundingClientRect()`로 `triggerRect` 취득.  
  - 아래 수식으로 `top`/`left`(또는 `right`) 설정.

**수식 예시 (우측 정렬 유지)**

- `top = triggerRect.bottom + 8`
- `left = triggerRect.right - panelWidth`  
  또는 `right = viewportWidth - triggerRect.right` 후 `left: auto` (또는 `right`만 사용하고 `left: auto`).
- **뷰포트 밖일 때**:  
  - 아래 공간 부족 시 위로 열기: `top = triggerRect.top - panelHeight - 8` (섹션 3 반응형 규칙 참고).

**주의**

- `panelWidth`는 실제 렌더된 너비 또는 고정 너비(예: 260px, 280px, 360px) 사용.  
- 리플로우 후 한 번 더 위치를 보정해도 됨.

---

## 2. z-index

### 2.1 요구사항

- GNB 드롭다운 패널은 **GNB 헤더 위**에 표시되어야 함.
- 전역 z-index 체계와 충돌하지 않도록 **변수** 사용.

### 2.2 사용할 변수 및 권장값

| 용도 | 변수명 | 권장값 | 비고 |
|------|--------|--------|------|
| GNB 드롭다운 패널 | `var(--mg-z-dropdown)` 또는 `var(--z-header-dropdown)` | **1001** | 헤더(1000)보다 큼 |
| GNB 드롭다운 오버레이(모바일 배경 딤) | `var(--mg-z-overlay)` | **1000** | 헤더와 동일 또는 패널보다 1 낮게 |

- 기존 `01-settings/_z-index.css`에 `--z-header: 1000`, `--z-header-dropdown: 1001`이 있으므로, **GNB 패널에는 `var(--z-header-dropdown)` 또는 `var(--mg-z-dropdown)`을 사용**하고, 둘 중 하나를 프로젝트에서 통일할 것.
- `unified-design-tokens.css` 등에 `--mg-z-dropdown: 1001`, `--mg-z-overlay: 1000`이 정의되어 있으면 해당 변수 사용.

---

## 3. 반응형

### 3.1 브레이크포인트

- **데스크톱**: 768px 이상  
- **모바일**: 767px 이하  

(기존 `dropdown-common.css`, 각 Dropdown CSS의 `@media (max-width: 767px)`와 동일 기준.)

### 3.2 데스크톱 (768px 이상)

| 항목 | 규칙 |
|------|------|
| 패널 최대 너비 | 드롭다운별 고정 너비 유지 (프로필 260px, 빠른액션 280px, 알림 360px). 필요 시 `max-width`만 제한. |
| 패널 최대 높이 | 기존 유지 (예: 400px, 알림은 `min(480px, calc(100vh - 80px))` 등). |
| 뷰포트 밖 처리 | 아래 공간 부족 시 **위로 열기**: `top = triggerRect.top - panelHeight - 8`. 좌우는 우측 정렬 유지, 필요 시 좌측으로 넘치지 않도록 `left = max(16, triggerRect.right - panelWidth)` 등으로 클리핑. |

### 3.3 모바일 (767px 이하)

| 항목 | 규칙 |
|------|------|
| 패널 최대 너비 | `max-width: calc(100vw - 32px)`. 드롭다운별 width는 기존(240px, 260px, 320px) 유지. |
| 패널 최대 높이 | `calc(100vh - 100px)` 또는 `min(360px, calc(100vh - 100px))` 등으로 뷰포트 안에 수납. |
| 뷰포트 밖일 때 | 위로 열기 동일: 아래 공간 부족 시 `top = triggerRect.top - panelHeight - 8`. |
| 오버레이 | `.mg-v2-dropdown-overlay` 표시 (배경 딤), z-index는 `var(--mg-z-overlay)` 등으로 패널보다 낮게. |

---

## 4. 비주얼 (B0KlA · dropdown-common 톤 유지)

### 4.1 공통 패널

- **배경색**: `var(--mg-color-surface-main, #F5F3EF)`  
- **테두리**: `1px solid var(--mg-color-border-main, #D4CFC8)`  
- **border-radius**: `16px`  
- **그림자**: `0 8px 24px rgba(0, 0, 0, 0.12)` (기존 dropdown-common과 동일)

### 4.2 애니메이션

- **페이드인 유지**: 기존 `dropdownFadeIn` (200ms, cubic-bezier(0.4, 0, 0.2, 1), opacity 0→1, translateY(-8px)→0) 유지 권장.
- 진입만 애니메이션하고, 위치 계산은 열릴 때 한 번만 수행하면 됨.

### 4.3 헤더/푸터/리스트

- 헤더·푸터 구분선: `1px solid var(--mg-color-border-main, #D4CFC8)`.  
- 타이포·패딩·색상은 기존 `dropdown-common.css` 및 각 Dropdown CSS의 B0KlA 토큰 유지 (`var(--mg-color-text-main)`, `var(--mg-color-text-secondary)` 등).

---

## 5. 전역 스타일 격리

### 5.1 문제

- 전역 `_dropdowns.css`에서 `[role="menu"]`에 `position: relative`, `z-index: var(--z-dropdown)`(100) 적용.
- `[role="menu"] > *`에 `position: fixed` 적용.
- GNB v2 패널은 `role="menu"`를 사용 중이므로 위 전역 규칙에 의해 위치·z-index가 덮일 수 있음.

### 5.2 방향 (코드 작성 없이 방향만)

- **옵션 A (권장)**: **v2 전용 클래스로 우선순위 확보**  
  - 모든 GNB 드롭다운 패널 스타일을 `.mg-v2-dropdown-panel`(및 드롭다운별 패널 클래스)로 적용.  
  - 필요 시 셀렉터를 **`.mg-v2-dropdown-panel[role="menu"]`**처럼 더 구체화하여 전역 `[role="menu"]`보다 우선하도록 함.  
  - **접근성**: `role="menu"` 유지. ARIA는 기존대로 사용.
- **옵션 B**: **캐스케이드 순서**  
  - v2 드롭다운 전용 CSS를 전역 `_dropdowns.css`보다 **나중에** 로드하여, 동일 셀렉터라도 v2 규칙이 이기도록 함.  
  - 클래스는 그대로 `.mg-v2-dropdown-panel` 등으로 지정.
- **옵션 C**: **role 변경**  
  - v2만 `role="dialog"` 또는 `role="listbox"` 등으로 바꾸고, `aria-haspopup="true"`, `aria-expanded` 등으로 의미 보강.  
  - 전역 `[role="menu"]` 규칙과 완전히 분리되지만, 시맨틱/스크린리더 동작 검토 필요.

**정리**: **옵션 A**를 권장. `role="menu"`는 유지하고, `.mg-v2-dropdown-panel[role="menu"]` 등으로 전역 규칙보다 우선하도록 지정하는 방향만 스펙에 둠. 구현 시 구체적인 셀렉터·로드 순서는 코더가 결정.

---

## 6. 참조 파일 요약

| 파일 | 용도 |
|------|------|
| `frontend/src/components/dashboard-v2/styles/dropdown-common.css` | 공통 패널·오버레이·애니메이션 |
| `frontend/src/components/dashboard-v2/molecules/ProfileDropdown.css` | 프로필 패널 너비·높이·메뉴 스타일 |
| `frontend/src/components/dashboard-v2/molecules/QuickActionsDropdown.css` | 빠른액션 패널 너비·높이 |
| `frontend/src/components/dashboard-v2/molecules/NotificationDropdown.css` | 알림 패널·리스트·푸터 |
| `frontend/src/styles/06-components/_dropdowns.css` | 전역 `[role="menu"]` 규칙 (충돌 원인) |
| `frontend/src/styles/01-settings/_z-index.css` | `--z-header`, `--z-header-dropdown` 등 |
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | B0KlA 팔레트·타이포·토큰 |

---

**문서 버전**: 1.0  
**작성**: Core Designer (스펙만 작성, 코드 미포함)
