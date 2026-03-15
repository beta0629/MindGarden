# GNB 드롭다운 검증 체크리스트

**목적**: GNB 드롭다운(프로필/빠른 액션/알림) 수정 후 동작 검증 및 core-debugger 원인 분석과 연계  
**참조**: `docs/standards/TESTING_STANDARD.md`, `docs/design-system/v2/GNB_DROPDOWN_SPEC.md`  
**최종 업데이트**: 2026-03-15

---

## 1. 기존 테스트 확인 결과

### 1.1 GNB 드롭다운 전용 테스트

| 대상 | 단위 테스트 | 통합 테스트 | E2E |
|------|-------------|-------------|-----|
| ProfileDropdown | **없음** | 없음 | 없음 |
| QuickActionsDropdown | **없음** | 없음 | 없음 |
| NotificationDropdown | **없음** | 없음 | 없음 |
| useDropdownPosition | **없음** | - | - |

- **결론**: 위 컴포넌트/훅에 대한 기존 단위·통합·E2E 테스트는 **전혀 없음**.

### 1.2 프론트엔드 테스트 전체 실행 요약 (2026-03-15 기준)

| 항목 | 결과 |
|------|------|
| 실행 명령 | `cd frontend && npm test -- --watchAll=false --passWithNoTests` |
| Test Suites | 2 passed, **10 failed**, 12 total |
| Tests | 25 passed, **11 failed**, 36 total |

**통과한 스위트**

- `src/components/admin/AdminDashboard/__tests__/CoreFlowPipeline.test.js`
- `src/components/admin/AdminDashboard/__tests__/PipelineStepCard.test.js`

**실패한 스위트 (GNB와 무관)**

- `src/components/ui/__tests__/components.test.js` — `../../setupTests` 모듈 없음
- `src/components/ui/Modal/Modal.test.js` — Jest 파싱 에러 (Modal.js 문법)
- `src/components/ui/Table/Table.test.js` — 파싱 에러
- `src/components/ui/__tests__/integration.test.js` — Button/Modal/Table 경로 오류
- `src/components/ui/Button/Button.test.js` — (실패 상세는 터미널 로그 참고)
- `src/components/ui/ThemeSelector/ThemeSelector.test.js` — (동일)
- `src/components/ui/Icon/Icon.test.js` — (동일)
- `src/components/dashboard/widgets/__tests__/PendingDepositsWidget.test.js` — `../../../utils/ajax` 없음
- `src/components/dashboard/widgets/__tests__/VacationStatsWidget.test.js` — `../../../utils/ajax` 없음
- `src/App.test.js` — `react-router-dom` resolve 실패

**실패 케이스 목록 (요약)**

- GNB 드롭다운 관련 실패: **0건** (해당 테스트 없음)
- 기타: 설정/경로/파싱/모듈 부재로 인한 10개 스위트 실패

---

## 2. 동작 검증 시나리오 (단위 테스트용 체크리스트)

다음 시나리오는 **테스트 코드가 없을 때** 수동·자동 검증용 체크리스트로 사용할 수 있습니다.  
테스트 작성 시 `docs/standards/TESTING_STANDARD.md`의 Given-When-Then, `@DisplayName` 한글 설명을 따르세요.

### 2.1 트리거 클릭 시 패널 열림

| # | 시나리오 | 검증 방법 | 적용 대상 |
|---|----------|-----------|-----------|
| 1 | 트리거 버튼(또는 트리거 영역) 클릭 시 `isOpen`이 true로 전환되어 패널이 보인다 | 클릭 후 `role="menu"` 또는 `.mg-v2-dropdown-panel`가 document에 존재하고 visible | 프로필, 빠른 액션, 알림 |
| 2 | 트리거 다시 클릭 시 패널이 닫힌다 (토글) | 두 번째 클릭 후 패널이 DOM에서 제거되거나 보이지 않음 | 동일 |
| 3 | 트리거에 `aria-expanded`가 열림/닫힘 상태를 반영한다 | 열림 시 `true`, 닫힘 시 `false` | 동일 |

### 2.2 Portal 렌더링

| # | 시나리오 | 검증 방법 | 적용 대상 |
|---|----------|-----------|-----------|
| 4 | 패널(및 오버레이)이 `ReactDOM.createPortal(..., document.body)`로 렌더된다 | `document.body` 직계 자식에 `.mg-v2-dropdown-panel` 또는 오버레이가 존재 | 동일 |
| 5 | 패널이 열린 상태에서 body 직계 자식에 오버레이 + 패널 노드가 있다 | DOM 구조: `body > [overlay], body > [panel]` (또는 Fragment로 한 번에 추가) | 동일 |

### 2.3 useDropdownPosition 스타일 적용

| # | 시나리오 | 검증 방법 | 적용 대상 |
|---|----------|-----------|-----------|
| 6 | `useDropdownPosition(triggerRef, panelRef, isOpen)`이 반환한 style이 패널의 `style` prop에 적용된다 | 패널 DOM의 `style.position === 'fixed'`, `style.zIndex` 존재 | 동일 |
| 7 | `isOpen === true`일 때 훅이 `triggerRef.current`와 `panelRef.current`를 사용해 top/left(또는 bottom)를 계산한다 | 패널이 트리거 아래(또는 플립 시 위)에 위치하며, `style.top` 또는 `style.bottom`이 숫자(px)로 설정됨 | 동일 |
| 8 | 트리거/패널 ref가 아직 없을 때에도 패널이 기본 fixed + zIndex만으로라도 렌더된다 (폭주 방지) | `panelRef.current`가 null인 첫 프레임에서도 `position: fixed`, `zIndex`는 적용됨 | 동일 |

### 2.4 클릭 아웃사이드 시 닫힘

| # | 시나리오 | 검증 방법 | 적용 대상 |
|---|----------|-----------|-----------|
| 9 | 패널이 열린 상태에서 트리거·패널·오버레이 외부를 클릭(mousedown)하면 패널이 닫힌다 | 외부 영역에서 `mousedown` 디스패치 후 `isOpen`이 false, 패널 unmount 또는 비표시 | 동일 |
| 10 | 오버레이 클릭 시 패널이 닫힌다 | 오버레이 버튼 클릭 시 `setIsOpen(false)` 동작 | 동일 |
| 11 | Escape 키 입력 시 패널이 닫힌다 | `keydown` Escape 후 패널 닫힘 | 동일 |

### 2.5 컴포넌트별 추가 시나리오

| 컴포넌트 | 추가 시나리오 |
|----------|----------------|
| ProfileDropdown | `user`가 null이면 트리거/패널 미렌더; 메뉴 항목(내 정보/설정/로그아웃) 클릭 시 `setIsOpen(false)` 및 navigate/onLogout 호출 |
| QuickActionsDropdown | `actions.length === 0`이면 null 반환; 역할별 액션 목록 표시, 항목 클릭 시 navigate 또는 onModalAction 호출 후 닫힘 |
| NotificationDropdown | 열릴 때 `/api/v1/alerts` 호출, 로딩/빈 목록/목록 렌더 구분, 읽음 처리 등 (API mock 필요) |

---

## 3. E2E / 수동 체크리스트

### 3.1 E2E 환경

- **도구**: Playwright (`tests/e2e/playwright.config.ts`)
- **위치**: `tests/e2e/tests/**/*.spec.ts`
- **현재 GNB/드롭다운 E2E**: **없음**

### 3.2 E2E 추가 제안 (core-coder 구현 권장)

다음 시나리오를 `tests/e2e/tests/gnb-dropdown.spec.ts`(또는 `layout/gnb-dropdown.spec.ts`)로 추가하는 것을 권장합니다.

- **전제**: 로그인 후 v2 대시보드(AdminDashboardV2 등)가 노출되는 경로로 이동한 상태.
- **시나리오 요약**  
  1. **프로필 드롭다운**: 프로필 트리거 클릭 → 패널이 보임 → "내 정보" 또는 "설정" 등 메뉴가 보임 → 바깥 클릭 또는 Escape → 패널 사라짐.  
  2. **빠른 액션 드롭다운**: 빠른 액션 아이콘 클릭 → 패널 열림 → 항목 표시 확인 → 외부 클릭으로 닫힘.  
  3. **알림 드롭다운**: 알림 아이콘 클릭 → 패널 열림(로딩 후 목록 또는 "새로운 알림이 없습니다") → 닫기.

**검증 포인트**

- `role="menu"` 또는 `.mg-v2-dropdown-panel`가 보일 때까지 대기 후 `expect(...).toBeVisible()`.
- 패널이 `document.body` 아래에 있는지 필요 시 `page.locator('body >> .mg-v2-dropdown-panel')` 등으로 확인.
- 닫힘 후 해당 패널이 사라졌는지 `expect(...).not.toBeVisible()` 또는 DOM에서 제거 여부 확인.

### 3.3 수동 확인용 체크리스트

| # | 확인 항목 | 프로필 | 빠른액션 | 알림 |
|---|-----------|--------|----------|------|
| 1 | 트리거 클릭 시 패널이 열린다 | ☐ | ☐ | ☐ |
| 2 | 패널이 트리거 근처(아래/위)에 위치한다 | ☐ | ☐ | ☐ |
| 3 | 스크롤/리사이즈 시 패널 위치가 어색하지 않다 (이탈 없음) | ☐ | ☐ | ☐ |
| 4 | 패널/트리거 밖 클릭 시 패널이 닫힌다 | ☐ | ☐ | ☐ |
| 5 | Escape 키로 패널이 닫힌다 | ☐ | ☐ | ☐ |
| 6 | 오버레이(모바일) 클릭 시 닫힌다 | ☐ | ☐ | ☐ |
| 7 | 메뉴 항목 클릭 시 동작 후 패널이 닫힌다 | ☐ | ☐ | ☐ |
| 8 | 여러 드롭다운을 연속으로 열어도 한 번에 하나만 열리거나 동작이 꼬이지 않는다 | ☐ | ☐ | ☐ |

---

## 4. core-debugger 결과와 연계 테스트 제안

디버거가 제안한 원인을 **테스트로 재현·검증**하기 위한 케이스입니다.  
구현은 core-coder가 담당하며, 아래는 테스트 관점 제안입니다.

### 4.1 ref 타이밍 이슈

**가설**: `isOpen`이 true가 될 때 Portal로 패널이 막 마운트되며, `useLayoutEffect` 실행 시점에 `panelRef.current`가 아직 null이라 위치 계산이 한 프레임 건너뛸 수 있음.

**재현·검증용 테스트 제안**

- **단위(훅)**: `useDropdownPosition`을 렌더하는 작은 테스트 컴포넌트에서 `isOpen`을 true로 바꾼 직후, 한 프레임(또는 `requestAnimationFrame` 이후) 뒤에 `panelRef.current`가 채워져 있고, 그 다음에 `panelStyle`에 `top`/`left`(또는 `bottom`)가 숫자로 들어오는지 검증.
- **단위(컴포넌트)**: 트리거 클릭 직후(같은 틱)에 패널 DOM이 body에 있고, 그 패널의 `style.top`/`style.left`가 0이 아닌 값으로 설정되는지 검증.  
  - “첫 오픈 시 한 프레임 지연 후에만 위치가 적용된다”를 허용할지, “첫 오픈 시에도 위치가 적용되어야 한다”를 검증할지는 팀 정책에 따름.

### 4.2 click-outside 로직 이슈

**가설**: 오버레이·패널이 `document.body`에 있기 때문에 `dropdownRef.current.contains(target)`이 항상 false이고, `panelRef.current.contains(target)`만으로만 보호되는데, 이벤트 순서나 ref null 시 조건문 통과 여부로 인해 의도치 않게 닫히거나 안 닫힐 수 있음.

**재현·검증용 테스트 제안**

- **단위**:  
  - 패널이 열린 상태에서 **오버레이**를 클릭했을 때만 `setIsOpen(false)`가 호출되고, **패널 내부**를 클릭했을 때는 호출되지 않는지 검증.  
  - `mousedown`을 트리거 영역 밖·패널 밖에서 디스패치했을 때 한 번만 닫히는지 검증.  
  - (선택) `dropdownRef.current`가 null인 경우 `handleClickOutside`가 호출되지 않거나, 호출되더라도 setState가 호출되지 않도록 방어 로직이 있다면 그에 대한 테스트.

### 4.3 공통 훅/로직

- **useDropdownPosition**:  
  - `triggerRef.current` 또는 `panelRef.current`가 null일 때 기본값 `{ position: 'fixed', zIndex }`만 반환하는지.  
  - 둘 다 있을 때 `computePanelStyle` 결과가 반환되고, 해당 객체에 `top` 또는 `bottom`, `left`가 포함되는지.
- **공통 이벤트**:  
  - resize/scroll 시 위치 재계산이 호출되는지(리스너 등록/해제는 구현 세부에 따라 스냅샷 또는 mock으로 검증).

---

## 5. 산출물 요약

| 항목 | 내용 |
|------|------|
| **기존 테스트** | GNB 드롭다운(ProfileDropdown, QuickActionsDropdown, NotificationDropdown, useDropdownPosition) 전용 테스트 없음. 프론트엔드 전체: 2 스위트 통과, 10 스위트 실패(경로/설정/파싱 등, GNB와 무관). |
| **실패 케이스** | GNB 관련 실패 0건. 나머지 실패는 위 1.2 목록 참고. |
| **검증 시나리오** | §2 동작 검증 시나리오(단위 테스트용 체크리스트) 11개 + 컴포넌트별 추가 시나리오. |
| **E2E** | Playwright 사용 중, GNB 드롭다운 E2E 없음 → §3.2에 추가 제안. |
| **수동 체크리스트** | §3.3 표. |
| **core-debugger 연계** | §4 ref 타이밍, click-outside 로직에 대한 재현·검증용 테스트 케이스 제안. |

테스트 코드 구현은 core-coder 담당이며, 본 문서의 체크리스트와 §4 제안을 바탕으로 단위/통합/E2E를 추가할 수 있습니다.

---

## 6. 추가된 테스트 파일 (선택 구현)

| 파일 | 목적 | 현재 상태 |
|------|------|-----------|
| `frontend/src/components/dashboard-v2/molecules/__tests__/ProfileDropdown.test.js` | §2 검증 시나리오(트리거 클릭·Portal·스타일·Escape·메뉴 클릭) 재현 | **실행 불가** — Jest에서 `Cannot find module 'react-router-dom'` (프로젝트 공통 이슈, `App.test.js`와 동일). 모듈 해상도/테스트 설정 수정 후 실행 가능. |

위 단위 테스트는 체크리스트 §2.1~2.4 일부를 코드로 검증하도록 작성되어 있으며, core-coder가 Jest 설정을 수정한 뒤 동일 패턴으로 QuickActionsDropdown / NotificationDropdown 테스트를 확장할 수 있습니다.
