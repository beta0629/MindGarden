# GNB v2 드롭다운 패널 내부 레이아웃 겹침 — 모듈 단위 수정 검토

**작성일**: 2026-03-15  
**작성자**: core-component-manager  
**목적**: 프로필·빠른 액션·알림 드롭다운의 패널 내부 레이아웃 겹침 수정을 모듈/컴포넌트 단위로 나누어 처리 가능한지 검토. 제안·문서화만 수행, 코드 직접 수정 없음.

**참조**:
- `docs/design-system/v2/PROFILE_DROPDOWN_LAYOUT_FIX_SPEC.md`
- `docs/design-system/v2/GNB_COMPONENTS_DESIGN_SPEC.md`
- `.cursor/skills/core-solution-encapsulation-modularization/SKILL.md`

---

## 1. 현상 요약

| 드롭다운 | 현상 |
|----------|------|
| **프로필** | 아바타·내 정보·이메일·로그아웃 등이 겹침 |
| **빠른 액션** | 헤더/첫 항목 텍스트 ghosting |
| **알림** | (문서 상 명시된 겹침 이슈는 프로필·빠른 액션 위주이나, 동일 공통 스타일 사용 시 영향 가능) |

**관련 자산**:
- 공통: `dropdown-common.css`, `useDropdownPosition.js`
- 프로필: `ProfileDropdown.js`, `ProfileDropdown.css`
- 빠른 액션: `QuickActionsDropdown.js`, `QuickActionsDropdown.css`
- 알림: `NotificationDropdown.js`, `NotificationDropdown.css`

---

## 2. 모듈 구분 및 상호 의존성

### 2.1 모듈 구분

| 구분 | 파일 | 역할 | 독립 수정 가능 여부 |
|------|------|------|---------------------|
| **(가) 공통 스타일** | `frontend/src/components/dashboard-v2/styles/dropdown-common.css` | 오버레이, 패널 공통(위치·배경·테두리·애니메이션), **공통 헤더/타이틀** | ⚠️ 수정 시 세 드롭다운 동시 영향 |
| **(가′) 공통 훅** | `frontend/src/components/dashboard-v2/hooks/useDropdownPosition.js` | 패널 `position: fixed` 및 top/left 계산, 플립 | ✅ 레이아웃 겹침과 무관·독립 수정 가능 |
| **(나) 프로필 전용** | `ProfileDropdown.js` + `ProfileDropdown.css` | 트리거, 패널 마크업, **프로필 전용 헤더**(`__header`/`__info`/`__menu`) | ✅ 공통 헤더 미사용 → 프로필만 수정 가능 |
| **(다) 빠른 액션 전용** | `QuickActionsDropdown.js` + `QuickActionsDropdown.css` | 트리거, **공통 `__header`/`__title`** 사용, 리스트/항목 | ⚠️ 공통 헤더 수정 시 알림과 공유 |
| **(라) 알림 전용** | `NotificationDropdown.js` + `NotificationDropdown.css` | 트리거, **공통 `__header`/`__title`** 사용, 리스트/항목/푸터 | ⚠️ 공통 헤더 수정 시 빠른 액션과 공유 |

### 2.2 공통 클래스명·BEM 공유 현황

**dropdown-common.css에서 정의·사용되는 클래스**:

| 클래스 | 사용처 | 비고 |
|--------|--------|------|
| `.mg-v2-dropdown-overlay` | 세 드롭다운 공통 | 모바일 배경 딤 |
| `.mg-v2-dropdown-panel` | 세 드롭다운 패널 루트(복수 클래스 중 하나) | position, 배경, border, shadow, 애니메이션 |
| `.mg-v2-profile-dropdown__panel` | ProfileDropdown | 공통 파일에서 패널 셀렉터로 나열됨 |
| `.mg-v2-quick-actions-dropdown__panel` | QuickActionsDropdown | 동일 |
| `.mg-v2-notification-dropdown__panel` | NotificationDropdown | 동일 |
| `.mg-v2-dropdown-panel__header` | **QuickActionsDropdown, NotificationDropdown** | 프로필은 **미사용**(자체 `mg-v2-profile-dropdown__header` 사용) |
| `.mg-v2-dropdown-panel__title` | QuickActionsDropdown, NotificationDropdown | 헤더 내 제목 텍스트 |

**프로필만의 구조**:
- `mg-v2-profile-dropdown__header` → `ProfileDropdown.css` 전용
- `mg-v2-profile-dropdown__info`, `__name`, `__email`, `__menu`, `mg-v2-profile-menu-item` → 모두 프로필 전용

**알림 전용 CSS 파일에 있는 “공통명”**:
- `mg-v2-dropdown-panel__footer`, `mg-v2-dropdown-panel__footer-link` → **NotificationDropdown.css**에 정의. 스펙상 푸터는 알림만 사용하므로 실질적으로 알림 전용이지만, 클래스명은 공통 BEM(`dropdown-panel__footer`)을 사용.

**결론 (모듈별 독립 수정)**:
- **(나) 프로필**: 공통 `__header`/`__title`을 쓰지 않으므로 **독립 모듈로 수정 가능**. 패널 루트는 공통 `.mg-v2-dropdown-panel` + 애니메이션만 공유.
- **(다) 빠른 액션, (라) 알림**: **공통 `.mg-v2-dropdown-panel__header` / `__title`**를 공유. 공통에서 헤더 레이아웃을 바꾸면 두 드롭다운에 동시 적용됨.
- **(가) 공통**: 패널 컨테이너 공통 스타일·헤더 스타일 변경 시 **세 드롭다운 중 프로필은 헤더 제외**, **빠른 액션·알림은 헤더 포함** 적용.

---

## 3. 적재적소 권장안: 공통 vs 드롭다운별

### 3.1 권장: “공통 패널 레이아웃” + “드롭다운별 내부 레이아웃” 혼합

| 수정 대상 | 권장 위치 | 이유 |
|-----------|-----------|------|
| **패널 컨테이너 공통 구조** | **dropdown-common.css** | 세 드롭다운 모두 `display: flex`, `flex-direction: column`, `overflow: hidden` 등 동일 구조. 공통에서 한 번에 정의하면 일관성 유지·중복 제거. |
| **공통 헤더(빠른 액션·알림)** | **dropdown-common.css** | `mg-v2-dropdown-panel__header` / `__title`는 두 드롭다운에서만 사용. ghosting 등 헤더 이슈가 공통 원인이라면 여기서 수정 시 두 드롭다운 동시 해결. |
| **프로필 전용 헤더/정보/메뉴** | **ProfileDropdown.css** | 프로필은 공통 헤더를 쓰지 않음. 아바타·이름·이메일·역할·메뉴 겹침은 **프로필 전용** `__header`, `__info`, `__name`, `__email`, `__menu`에서만 조정. (PROFILE_DROPDOWN_LAYOUT_FIX_SPEC.md 반영) |
| **빠른 액션 리스트/첫 항목** | **QuickActionsDropdown.css** | 헤더/첫 항목 ghosting이 **헤더와 첫 번째 항목 사이** 레이아웃·z-index·opacity 이슈라면, 공통 헤더 수정 후에도 **리스트·항목**은 빠른 액션 전용 CSS에서 점검. |
| **알림 리스트/항목** | **NotificationDropdown.css** | 알림은 현재 겹침 이슈가 명시되지 않았으나, 공통 헤더/패널 수정 시 영향받을 수 있으므로 검증 대상. |

### 3.2 요약

- **공통 패널 레이아웃**: `dropdown-common.css`에서 **패널 루트·공통 헤더**의 flex, flex-shrink, overflow 등으로 “한 번에” 겹침 방지 기반 마련. (containing block·transform 주의는 기존 PROFILE_DROPDOWN_LAYOUT_FIX_SPEC.md 참고.)
- **드롭다운별**: 프로필은 **반드시 ProfileDropdown.css**에서만 수정. 빠른 액션·알림은 공통 헤더 적용 후에도 **각 전용 CSS**에서 리스트/첫 항목/푸터 등 추가 조정.

---

## 4. core-coder 협업: 모듈별 수정 순서 및 영향 체크

### 4.1 권장 수정 순서

1. **공통 (가)**  
   - **dropdown-common.css**  
   - 패널 공통 구조(display, flex-direction, overflow), 필요 시 공통 헤더(`__header`, `__title`)의 flex-shrink·레이아웃 정리.  
   - **영향**: 세 드롭다운 패널 비주얼; 빠른 액션·알림 헤더 동시 변경.

2. **프로필 (나)**  
   - **ProfileDropdown.css** (필요 시 ProfileDropdown.js 마크업 검토)  
   - `__header` / `__info` / `__name` / `__email` / `__menu` 겹침 해소 (PROFILE_DROPDOWN_LAYOUT_FIX_SPEC.md 테이블 반영).  
   - **영향**: 프로필 드롭다운만.

3. **빠른 액션 (다)**  
   - **QuickActionsDropdown.css** (필요 시 QuickActionsDropdown.js 마크업)  
   - 헤더 아래 리스트·첫 항목 ghosting 제거(위치, z-index, opacity 등).  
   - **영향**: 빠른 액션만; 단 공통 헤더를 써서 1단계 변경이 먼저 반영된 상태에서 점검.

4. **알림 (라)**  
   - **NotificationDropdown.css** (필요 시 NotificationDropdown.js)  
   - 공통 패널/헤더 변경으로 인한 레이아웃·겹침 여부 검증 후, 알림 리스트/푸터만 조정.  
   - **영향**: 알림만.

(공통 훅 **useDropdownPosition.js**는 위치 계산만 담당하므로, “겹침” 수정과는 별도. 필요 시 독립적으로 다룸.)

### 4.2 모듈 수정 시 타 드롭다운 영향 체크 포인트

| 수정 모듈 | 체크 포인트 |
|-----------|--------------|
| **dropdown-common.css** | (1) 프로필: 패널만 공통 적용, 헤더는 자체 클래스이므로 프로필 패널 박스·애니메이션만 확인. (2) 빠른 액션·알림: `__header`/`__title` 스타일 변경 시 두 드롭다운 모두에서 헤더·첫 줄 가독성 확인. |
| **ProfileDropdown.css** | 빠른 액션·알림과 클래스 공유 없음 → 다른 드롭다운 영향 없음. |
| **QuickActionsDropdown.css** | 알림·프로필과 클래스 공유 없음 → 다른 드롭다운 영향 없음. |
| **NotificationDropdown.css** | `mg-v2-dropdown-panel__footer`는 알림에서만 사용. 푸터 스타일 변경 시 알림만 확인. |

---

## 5. 정리

- **모듈 구분**: (가) 공통 스타일, (나) 프로필, (다) 빠른 액션, (라) 알림을 **독립 모듈로 나누어 수정 가능**. 단 (가)와 (다)(라)는 **공통 헤더/타이틀**로 연결되어 있어, 공통 수정 시 빠른 액션·알림을 함께 검증해야 함.
- **적재적소**: 겹침 수정은 **공통 패널·공통 헤더**에서 한 번에 기반을 잡고, **프로필은 전용 CSS**, **빠른 액션/알림은 전용 CSS**에서 각각 마무리하는 혼합 방안 권장.
- **core-coder 순서**: 공통 → 프로필 → 빠른 액션 → 알림. 각 단계 후 해당 드롭다운만 열어 시각 검증하고, 공통 수정 후에는 빠른 액션·알림 둘 다 열어서 헤더·첫 항목을 확인하는 것이 안전함.

**다음 단계**: 본 검토를 core-coder에 전달하여 위 순서와 체크 포인트대로 구현 후, 필요 시 component-manager가 인벤토리·본 문서를 갱신.
