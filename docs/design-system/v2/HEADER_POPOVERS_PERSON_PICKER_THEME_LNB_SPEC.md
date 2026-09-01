# GNB 헤더 팝오버·인물 선택 카드·테마 전환·LNB 명도 통합 UI/UX 스펙 (v2)

**문서 식별자**: `docs/design-system/v2/HEADER_POPOVERS_PERSON_PICKER_THEME_LNB_SPEC.md`  
**작성자**: Core Designer  
**대상 구현자**: Core Coder (`core-coder`)  
**단일 소스(SSOT)**: `mindgarden-design-system.pen`, `pencil-new.pen`, `frontend/src/styles/unified-design-tokens.css`  
**적용 범위**: 단일 PR 통합 배치 (A. Header Popovers / B. Person Picker Cards / C. GNB Theme Switch / D. LNB Hover Text Contrast)

---

## 1. 개요 및 배경

마인드가든(MindGarden) 어드민 및 상담 시스템의 상단 네비게이션(GNB), 사이드바(LNB), 핵심 모달(매칭 생성) 전반에서 발견된 시각적 불일치와 인터랙션 결함을 해소하고, 일관된 **Calm Clinical(차분한 클리니컬)** 톤을 정립합니다.

### 1.1 해결 대상 핵심 증상 (Symptom Analysis)
1. **증상 A (shot-a 3-col dense)**: `MappingCreationModal` 상담사/내담자 그리드가 3열(`minmax(200px, 1fr)`)로 과밀하게 배치되어 긴 이름/이메일이 절단되고 정보 인지가 저해됨.
2. **증상 B (shot-b avatar clip + double border)**: 인물 카드 내부 아바타가 패딩 부족으로 상하단에 클리핑되며, `MGButton` 중첩과 B0KlA 아웃라인 CSS로 인해 2중 보더(Double Border) 및 outline 단차가 발생함.
3. **증상 C (shot-c title/segmented/empty cramped)**: `NotificationDropdown`의 타이틀, 탭, 빈 상태 영역이 수직으로 압축되어 답답하고, 탭 바에 흰색 갭 슬리버(sliver)가 발생함.
4. **증상 D (shot-d double border 8 buttons)**: `QuickActionsDropdown`의 메뉴 행이 `MGButton` outline chrome으로 렌더링되어 각 행마다 개별 테두리가 노출되고 상하 여백이 붕괴됨.
5. **GNB 테마 제어 부재**: 라이트/다크 모드 전환 진입점이 GNB 프로필 영역에 구조화되어 있지 않음.
6. **LNB 호버 텍스트 명도 저하**: `NavLink.css`의 hover 상태에서 텍스트 색상이 다크 사이드바 배경 위에 Slate 계열(`--mg-v2-color-text-primary`)로 잘못 적용되어 텍스트와 쉐브론의 명도 대비가 1.18:1로 급락함.

### 1.2 핵심 설계 원칙 (Core Design Principles)
- **Palette SSOT**: Slate `#0F172A` (베이스 텍스트/다크 표면), Dusty Teal `#0E5F5A` (라이트 주조색/Solid) / `#0F766E` (다크 주조색/Solid).
- **Type Scale (4-Step)**:
  - Step 1 (Title): `16px` / Semi-bold (600) / Line-height `1.4`
  - Step 2 (Body Large / Subtitle): `14px` / Medium (500) / Line-height `1.5`
  - Step 3 (Body Standard): `13px` / Regular (400) ~ Medium (500) / Line-height `1.5`
  - Step 4 (Caption / Meta): `12px` / Regular (400) / Line-height `1.4`
- **Surface Rewrite (클린 서페이스 재작성)**: 임시 땜질식 CSS 패치나 `!important` 중첩을 배제하고, 아토믹 계층에 맞는 깨끗한 표면 토큰과 네이티브 엘리먼트로 재구성합니다.
- **No MGButton Chrome on Inner Rows/Cards**: 메뉴 아이템 행, 네비게이션 링크, 선택 카드에 `MGButton` outline 래퍼를 사용하지 않고 네이티브 버튼(`button[type="button"]`)으로 플러시(Flush) 처리합니다.
- **No Emojis & No Decorative SVGs**: 불필요한 장식용 SVG나 이모지를 전면 배제하고, Lucide 정규 아이콘과 클리니컬 타이포그래피만 사용합니다.

---

## 2. 아토믹 디자인 계층 구조 (Atomic Hierarchy)

```
Pages / Templates
  └── AdminDashboardV2 / AdminCommonLayout (Template)
       ├── Organisms
       │    ├── DesktopLnb (사이드바 - LNB)
       │    └── GnbHeader (상단 헤더 - GNB)
       │         └── Molecules (GNB Popovers)
       │              ├── QuickActionsDropdown (A)
       │              ├── NotificationDropdown (A)
       │              └── ProfileDropdown (A, C)
       │                   └── GnbDropdownPortal (공통 포털 쉘)
       └── Modals / Organisms
            └── MappingCreationModal (B)
                 └── Molecules (Person Picker Cards / Payment Timing Cards)
                      └── Atoms
                           ├── Avatar (44px No-clip)
                           ├── NavIcon / Lucide Icons
                           ├── SafeText
                           └── BadgeSelect / SegmentedTabs
```

---

## 3. 세부 UI/UX 스펙 (Scope A–D)

### [A] Header Popovers — QuickActionsDropdown & NotificationDropdown

GNB 상단 드롭다운 팝오버 3종(`QuickActionsDropdown`, `NotificationDropdown`, `ProfileDropdown`)은 단일 공통 쉘(`HeaderPopover Shell`) 구조와 비주얼 토큰을 공유합니다.

#### A.1 공통 HeaderPopover Shell 구조 및 토큰
- **포털 컨테이너**: `GnbDropdownPortal` (Portal to `document.body`)
- **패널 클래스**: `.mg-v2-dropdown-panel`
- **배경색 (Surface)**: `var(--mg-color-surface-main)` (Light: `#FFFFFF` / Dark: `#1E293B`)
- **테두리 (Border)**: `1px solid var(--mg-color-border-main)` (Light: `#E2E8F0` / Dark: `#334155`)
- **모서리 반경 (Radius)**: `var(--radius-lg, 16px)`
- **그림자 (Elevation Shadow)**: `var(--mg-shadow-lg, 0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06))`
- **내부 패널 여백**:
  - 패널 헤더: `padding: 14px 16px;` (하단 1px 보더 `1px solid var(--mg-color-border-main)`)
  - 아이템 목록 컨테이너: `padding: 8px;` (외부 테두리와 아이템 간 8px 버퍼 확보)
  - 푸터 액션 영역: `padding: 10px 16px;` (상단 1px 보더 `1px solid var(--mg-color-border-main)`)

---

#### A.2 QuickActionsDropdown (빠른 액션)
- **너비 및 높이**:
  - 데스크톱: `width: 280px; min-height: 180px; max-height: 420px;`
  - 모바일 (<= 767px): `width: calc(100vw - 32px); max-width: 280px;`
- **헤더 타이틀**:
  - 텍스트: "빠른 액션"
  - 폰트: `font-size: 15px; font-weight: 600; color: var(--mg-color-text-main);`
  - 패딩: `14px 16px;`
- **메뉴 행 (Flush Menu Rows)**:
  - **엘리먼트**: 네이티브 `<button type="button" className="mg-v2-quick-action-item">` (MGButton 사용 금지)
  - **개별 행 보더**: `border: none;` (8개 버튼의 개별 테두리 및 2중 보더 완전 제거)
  - **행 높이 & 크기**: `min-height: 42px; width: 100%;`
  - **행 내부 패딩**: `padding: 10px 12px; border-radius: var(--radius-md, 8px);`
  - **레이아웃**: `display: flex; align-items: center; gap: 10px;`
  - **아이콘**:
    - 크기: 18px x 18px
    - 색상: `color: var(--mg-color-primary-solid);` (Light: `#0E5F5A` / Dark: `#0F766E`)
  - **라벨 텍스트**:
    - 폰트: `font-size: 14px; font-weight: 500; color: var(--mg-color-text-main);`
  - **우측 쉐브론/화살표**:
    - 크기: 16px x 16px
    - 색상: `color: var(--mg-color-text-secondary);`
- **인터랙션 상태**:
  - Default: `background: transparent; color: var(--mg-color-text-main);`
  - Hover / Focus-Visible: `background: var(--mg-color-bg-hover); color: var(--mg-color-text-main);`
  - Active: `background: var(--mg-color-primary-50); color: var(--mg-color-primary-solid);`
  - Focus Ring: `outline: 2px solid var(--mg-color-primary-solid); outline-offset: -2px;`

---

#### A.3 NotificationDropdown (알림 센터)
- **너비 및 높이**:
  - 데스크톱: `width: 380px; min-height: 280px; max-height: min(520px, calc(100vh - 96px));`
  - 모바일 (<= 767px): `width: calc(100vw - 32px); max-width: 360px;`
- **헤더 영역**:
  - 패딩: `14px 16px; display: flex; justify-content: space-between; align-items: center;`
  - 타이틀: `font-size: 15px; font-weight: 600; color: var(--mg-color-text-main);`
  - "모두 읽음" 액션:
    - 폰트: `font-size: 12px; font-weight: 500; color: var(--mg-color-primary-solid);`
    - 패딩: `4px 8px; border-radius: 4px;`
    - Hover: `background: var(--mg-color-bg-hover); text-decoration: none;`
- **진짜 세그먼트 컨트롤 (True Segmented Control)**:
  - 래퍼 클래스: `.mg-v2-notification-segmented`
  - 컨테이너 스타일:
    - `display: flex; gap: 0; padding: 4px; margin: 8px 16px 12px 16px;`
    - `background: var(--mg-color-background-muted, #F1F5F9);` (Dark: `#0F172A`)
    - `border-radius: var(--radius-md, 8px);`
    - `border: 1px solid var(--mg-color-border-main);`
    - **흰색 갭 슬리버(sliver) 방지**: 탭 항목 간 margin 0, gap 0, 부모 배경색 완전 통일.
  - 세그먼트 탭 버튼 (`.mg-v2-notification-segmented__tab`):
    - 높이: `34px;`
    - 폰트: `font-size: 13px; font-weight: 500;`
    - `border: none; outline: none; border-radius: 6px; flex: 1;`
    - `transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;`
  - **Active 탭**:
    - `background: var(--mg-color-primary-solid, #0E5F5A);` (Dark: `#0F766E`)
    - `color: var(--mg-color-text-on-primary, #FFFFFF); font-weight: 600;`
    - `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);`
  - **Inactive 탭**:
    - `background: transparent;`
    - `color: var(--mg-color-text-secondary, #475569);` (Dark: `#94A3B8`)
    - Hover: `color: var(--mg-color-text-main); background: rgba(0, 0, 0, 0.04);` (Dark: `rgba(255, 255, 255, 0.05)`)
- **알림 목록 항목 (`.mg-v2-notification-item`)**:
  - 패딩: `12px 16px;`
  - `border-bottom: 1px solid var(--mg-color-border-soft, #F1F5F9);` (마지막 항목 제외)
  - Unread (읽지 않음): `background: var(--mg-color-b0kla-green-50, rgba(14, 95, 90, 0.04));`
  - Read (읽음): `background: transparent;`
  - Hover: `background: var(--mg-color-bg-hover);`
  - 제목: `font-size: 13px; font-weight: 600; color: var(--mg-color-text-main); line-height: 1.4;`
  - 본문: `font-size: 12px; color: var(--mg-color-text-secondary); line-height: 1.5; margin-top: 4px;`
  - 날짜/시간: `font-size: 11px; color: var(--mg-color-text-tertiary); margin-top: 6px;`
- **Empty State (빈 목록 영역)**:
  - 패딩: `48px 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;`
  - 아이콘: 32px x 32px, `color: var(--mg-color-text-tertiary);`
  - 안내 문구: `font-size: 13px; color: var(--mg-color-text-secondary); text-align: center;`
- **푸터 ("알림 전체 보기")**:
  - 패딩: `12px 16px; text-align: center;`
  - 버튼/링크 스타일:
    - 높이: `38px; width: 100%; display: flex; align-items: center; justify-content: center;`
    - `border-radius: var(--radius-md, 8px);`
    - `background: var(--mg-color-background-muted); color: var(--mg-color-text-main); font-size: 13px; font-weight: 500;`
    - Hover: `background: var(--mg-color-bg-hover); color: var(--mg-color-primary-solid);`

---

### [B] MappingCreationModal Person Picker Cards (상담사·내담자 선택 카드)

`MappingCreationModal`의 Step 1(상담사 선택) 및 Step 2(내담자 선택) 화면의 인물 선택 카드를 개선합니다.

#### B.1 그리드 레이아웃 (Grid Layout)
- **데스크톱**:
  - `display: grid;`
  - `grid-template-columns: repeat(2, minmax(0, 1fr));` (또는 `repeat(auto-fill, minmax(280px, 1fr));`)
  - 과밀한 3열 구조를 완전 배제하고, 여유 있는 **2열(2-col)** 구조로 확장.
  - 간격: `column-gap: 16px; row-gap: 12px;`
  - 최대 높이: `max-height: min(340px, 45vh); overflow-y: auto; padding: 2px;`
- **모바일 (<= 767px)**:
  - `grid-template-columns: 1fr;` (1열 전폭 배치)
  - 간격: `row-gap: 10px;`

#### B.2 인물 선택 카드 지오메트리 및 상태
- **엘리먼트**: 네이티브 `<button type="button" className="mg-v2-mapping-creation-modal__card" aria-pressed={isSelected}>` (MGButton 및 중첩 컨텐츠 클래스 제거)
- **크기 & 패딩**:
  - `min-height: 76px;` (72px ~ 88px 범위 준수)
  - `padding: 16px;`
  - `width: 100%; box-sizing: border-box;`
  - `display: flex; align-items: center; gap: 14px; text-align: left;`
  - `border-radius: var(--radius-md, 10px);`
- **아바타 클리핑 방지 (Zero-clip Avatar)**:
  - 아바타 크기: `44px x 44px` (고정)
  - `flex-shrink: 0; border-radius: 50%; overflow: hidden;`
  - 상하 16px 패딩(카드 전체 높이 76px = 44px + 32px)으로 아바타 테두리가 카드 상하단에 절대 클리핑되지 않음.
- **카드 정보 영역 (`.mg-v2-mapping-creation-modal__card-info`)**:
  - `display: flex; flex-direction: column; min-width: 0; flex: 1;`
  - 이름 (`strong`): `font-size: 14px; font-weight: 600; color: var(--mg-color-text-main); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
  - 이메일/정보 (`span`): `font-size: 12px; font-weight: 400; color: var(--mg-color-text-secondary); line-height: 1.4; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
- **인터랙션 및 선택 상태 (Single-Border System)**:
  - **Default (미선택)**:
    - `background: var(--mg-color-surface-main);`
    - `border: 1px solid var(--mg-color-border-main);` (Light: `#D4CFC8` / Dark: `#334155`)
    - `box-shadow: none;`
  - **Hover (미선택 호버)**:
    - `background: var(--mg-color-surface-main);`
    - `border: 1px solid var(--mg-color-primary-solid, #0E5F5A);`
    - `box-shadow: var(--mg-shadow-sm, 0 1px 3px rgba(0,0,0,0.06));`
  - **Selected (선택됨)**:
    - `background: var(--mg-color-b0kla-green-50, rgba(14, 95, 90, 0.08));` (Dark: `rgba(15, 118, 110, 0.18)`)
    - `border: 1px solid var(--mg-color-primary-solid, #0E5F5A);` (Dark: `#0F766E`)
    - **이중 보더 방지**: `border: 2px`를 사용하지 않고 정확히 **1px solid**를 유지하며, 은은한 서페이스 틴트(subtle tint)로 선택감을 표현.
  - **Focus-Visible (키보드 포커스)**:
    - `outline: 2px solid var(--mg-color-primary-solid); outline-offset: 2px;`

---

### [C] GNB Light / Dark Theme Selection

테넌트 헤더 클러스터의 프로필 드롭다운(`ProfileDropdown`) 내부에 라이트/다크 테마 전환 행을 배치하고 `useDarkMode` 훅과 완벽히 연동합니다.

#### C.1 GNB 프로필 트리거 유지 (#620 준수)
- **트리거 구조**: `#620` 이슈 결정사항에 따라 아바타 + 이름(텍스트)과 우측 쉐브론(`CHEVRON_DOWN`) 아이콘을 분리.
- **외곽 필 보더 금지**: 트리거 전체를 감싸는 bordered pill 컨테이너를 생성하지 않으며 `MGButton` chrome을 씌우지 않음.

#### C.2 ProfileDropdown 내부 테마 전환 행
- **위치**: `ProfileDropdown` 메뉴 목록 상단 (내 정보 바로 아래 또는 설정 위)
- **컨테이너 클래스**: `.mg-v2-profile-theme-row`
- **레이아웃**:
  - `display: flex; align-items: center; justify-content: space-between;`
  - `padding: 10px 16px; min-height: 42px;`
- **좌측 라벨**:
  - `display: flex; align-items: center; gap: 8px;`
  - 아이콘: Lucide `Sun` (라이트 모드 시) 또는 `Moon` (다크 모드 시), 크기 16px, `color: var(--mg-color-text-secondary);`
  - 텍스트: "화면 테마" (또는 "다크 모드"), `font-size: 13px; font-weight: 500; color: var(--mg-color-text-main);`
- **우측 테마 세그먼트 스위치 (`.mg-v2-theme-switch`)**:
  - **구조**: 2-버튼 컴팩트 세그먼트 (라이트 / 다크)
  - 컨테이너:
    - `display: inline-flex; padding: 2px; border-radius: 6px;`
    - `background: var(--mg-color-background-muted); border: 1px solid var(--mg-color-border-main);`
  - 개별 버튼 (`.mg-v2-theme-switch__btn`):
    - `padding: 4px 10px; font-size: 12px; font-weight: 500; border: none; border-radius: 4px; cursor: pointer;`
    - Active: `background: var(--mg-color-primary-solid); color: var(--mg-color-text-on-primary); font-weight: 600;`
    - Inactive: `background: transparent; color: var(--mg-color-text-secondary);`
- **useDarkMode 훅 연동**:
  - `const { resolved, setMode } = useDarkMode();`
  - 라이트 클릭 시: `setMode('light')`
  - 다크 클릭 시: `setMode('dark')`
  - 즉각적인 `<html data-theme="...">` 전환 및 로컬 스토리지 동기화.

---

### [D] LNB Hover & Active Text Contrast

사이드바(LNB) 메뉴 항목의 호버 및 활성 상태에서 텍스트/아이콘 명도 대비 결함을 근본적으로 해결합니다.

#### D.1 결함 원인 및 토큰 수정 원칙
- **문제점**: `NavLink.css` 및 `DesktopLnb.css`에서 `:hover` 시 `color: var(--mg-v2-color-text-primary)`를 참조하도록 지정되어 있었음. `--mg-v2-color-text-primary`는 라이트 모드에서 Slate `#0F172A`(다크 텍스트)를 반환하므로, 다크 사이드바 배경(`#2C2C2C` / `#1E293B`) 위에서 1.18:1 수준의 검은색 텍스트로 회귀하여 가독성이 완전 붕괴됨.
- **해결 원칙**:
  - LNB는 **라이트/다크 테마와 무관하게 항상 다크 서페이스(Dark Surface)**로 렌더링됩니다.
  - 따라서 LNB 내부의 모든 Hover / Active 상태 텍스트, 아이콘, 쉐브론은 **반드시 온-필(On-Fill) / 온-프라이머리(Near-White) 토큰만 사용**해야 합니다.
  - 사용 토큰: `var(--mg-color-text-on-primary, #FFFFFF)` 또는 `var(--mg-v2-color-text-on-sidebar-active, #F8FAFC)`
  - 노란색 hover 텍스트, 아웃라인 border 땜질 등 비표준 패치는 일체 금지.
  - `#618` 네이티브 쉐브론 구조를 유지합니다.

#### D.2 LNB 세부 인터랙션 상태 스펙
- **기본 상태 (Default)**:
  - 배경: `background: transparent;`
  - 텍스트/아이콘: `color: rgba(255, 255, 255, 0.7); font-size: 14px; font-weight: 500;`
  - 쉐브론: `color: rgba(255, 255, 255, 0.7);`
- **호버 상태 (Hover)**:
  - 배경: `background: var(--mg-color-surface-hover, rgba(255, 255, 255, 0.1));` (또는 Dusty Teal wash `rgba(14, 95, 90, 0.3)`)
  - 텍스트/아이콘/쉐브론: **`color: var(--mg-color-text-on-primary, #FFFFFF) !important;`** (명도 대비 12:1 이상 확보)
- **활성 상태 (Active - `.mg-v2-nav-link--active`)**:
  - 배경: `background: var(--mg-layout-sidebar-active-bg, rgba(14, 95, 90, 0.45));`
  - 좌측 액센트 바: `width: 4px; border-radius: 2px; background: var(--mg-color-primary-solid, #0E5F5A);`
  - 텍스트/아이콘/쉐브론: **`color: var(--mg-color-text-on-primary, #FFFFFF); font-weight: 600;`**
- **키보드 포커스 (Focus-Visible)**:
  - `outline: none; box-shadow: 0 0 0 2px var(--mg-color-primary-300, #5FBBB0);`

---

## 4. 디자인 토큰 매핑 참조표 (CSS Variables SSOT)

모든 스타일 선언은 아래의 `var(--mg-*)` 및 `var(--mg-v2-*)` 토큰만 사용하며, 하드코딩된 hex/px 값을 직접 사용하지 않습니다.

| 시맨틱 토큰명 | 라이트 모드 값 (Light) | 다크 모드 값 (Dark) | 주요 사용처 |
|---|---|---|---|
| `var(--mg-color-text-main)` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | 본문 메인 텍스트, 헤더 타이틀, 카드 이름 |
| `var(--mg-color-text-secondary)` | `#475569` (Slate 600) | `#94A3B8` (Slate 400) | 보조 설명, 이메일, 비활성 탭 텍스트 |
| `var(--mg-color-text-tertiary)` | `#94A3B8` (Slate 400) | `#64748B` (Slate 500) | 메타 정보, 캡션, 타임스탬프 |
| `var(--mg-color-text-on-primary)` | `#FFFFFF` (Pure White) | `#FFFFFF` (Pure White) | LNB 호버/활성 텍스트, 솔리드 버튼 텍스트, Active 탭 |
| `var(--mg-color-primary-solid)` | `#0E5F5A` (Dusty Teal) | `#0F766E` (Solid Teal) | 주조 솔리드 버튼, Active 세그먼트, 카드 선택 보더 |
| `var(--mg-color-b0kla-green-50)` | `rgba(14, 95, 90, 0.08)` | `rgba(15, 118, 110, 0.18)` | 선택 카드 배경 틴트, 안읽은 알림 배경 |
| `var(--mg-color-surface-main)` | `#FFFFFF` (White) | `#1E293B` (Slate 800) | 팝오버 패널 배경, 인물 카드 기본 배경 |
| `var(--mg-color-background-muted)` | `#F1F5F9` (Slate 100) | `#0F172A` (Slate 900) | 세그먼트 컨트롤 트랙 배경, 푸터 버튼 배경 |
| `var(--mg-color-bg-hover)` | `#F8FAFC` (Slate 50) | `#334155` (Slate 700) | 메뉴 행 호버, 리스트 행 호버 |
| `var(--mg-color-surface-hover)` | `rgba(255, 255, 255, 0.1)` | `rgba(255, 255, 255, 0.1)` | LNB 다크 사이드바 메뉴 호버 배경 |
| `var(--mg-color-border-main)` | `#E2E8F0` (Slate 200) | `#334155` (Slate 700) | 팝오버 외곽 테두리, 카드 기본 테두리, 구분선 |
| `var(--mg-color-border-soft)` | `#F1F5F9` (Slate 100) | `#1E293B` (Slate 800) | 알림 목록 행간 얇은 구분선 |
| `var(--radius-lg)` | `16px` | `16px` | GNB 팝오버 패널 모서리 |
| `var(--radius-md)` | `8px` ~ `10px` | `8px` ~ `10px` | 메뉴 행, 인물 카드, 세그먼트 트랙 모서리 |
| `var(--mg-shadow-lg)` | `0 10px 25px -5px rgba(15,23,42,0.1)` | `0 10px 25px -5px rgba(0,0,0,0.5)` | 팝오버 플로팅 그림자 |

---

## 5. CSS 클래스 구조 및 네이밍 명세 (`mg-v2-*`)

### 5.1 GNB 팝오버 공통 및 개별 클래스
- `.mg-v2-dropdown-panel`: 공통 팝오버 쉘 컨테이너
- `.mg-v2-dropdown-panel__header`: 팝오버 상단 헤더
- `.mg-v2-dropdown-panel__title`: 팝오버 헤더 타이틀
- `.mg-v2-quick-actions-dropdown__panel`: 빠른 액션 패널 래퍼
- `.mg-v2-quick-actions-list`: 빠른 액션 목록 (8px 내부 패딩)
- `.mg-v2-quick-action-item`: 플러시 메뉴 버튼 (네이티브 button)
- `.mg-v2-quick-action-item__icon`: 메뉴 아이콘
- `.mg-v2-quick-action-item__label`: 메뉴 라벨
- `.mg-v2-quick-action-item__arrow`: 메뉴 우측 쉐브론
- `.mg-v2-notification-dropdown__panel`: 알림 센터 패널 래퍼
- `.mg-v2-notification-segmented`: 세그먼트 컨트롤 트랙
- `.mg-v2-notification-segmented__tab`: 세그먼트 탭 버튼
- `.mg-v2-notification-segmented__tab--active`: Active 세그먼트 탭
- `.mg-v2-notification-list`: 알림 목록 컨테이너
- `.mg-v2-notification-item`: 알림 목록 행
- `.mg-v2-notification-item--unread`: 읽지 않은 알림 행
- `.mg-v2-notification-empty`: 알림 빈 상태 컨테이너
- `.mg-v2-notification-footer`: 알림 하단 푸터

### 5.2 인물 선택 카드 클래스 (`MappingCreationModal`)
- `.mg-v2-mapping-creation-modal__grid`: 2열 인물 그리드 (`repeat(2, minmax(0, 1fr))`)
- `.mg-v2-mapping-creation-modal__card`: 네이티브 인물 선택 버튼
- `.mg-v2-mapping-creation-modal__card--selected`: 단일 1px 보더 + 틴트 선택 상태
- `.mg-v2-mapping-creation-modal__avatar`: 44px 비클리핑 아바타 래퍼
- `.mg-v2-mapping-creation-modal__card-info`: 인물 텍스트 컨테이너

### 5.3 테마 스위치 클래스 (`ProfileDropdown`)
- `.mg-v2-profile-theme-row`: 프로필 드롭다운 내부 테마 설정 행
- `.mg-v2-theme-switch`: 2-버튼 세그먼트 스위치 트랙
- `.mg-v2-theme-switch__btn`: 테마 스위치 개별 버튼
- `.mg-v2-theme-switch__btn--active`: 활성화된 테마 버튼

### 5.4 LNB 사이드바 링크 클래스 (`NavLink`, `DesktopLnb`)
- `.mg-v2-nav-link`: 사이드바 메뉴 링크
- `.mg-v2-nav-link:hover`: 온-필 화이트 텍스트 호버 상태
- `.mg-v2-nav-link--active`: 액센트 바 + 온-필 화이트 텍스트 활성 상태
- `.mg-v2-desktop-lnb__group-chevron`: 네이티브 LNB 쉐브론

---

## 6. 구현 코더 체크리스트 (Coder Handoff Checklist)

구현 서브에이전트(`core-coder`)는 아래 체크리스트를 순차적으로 확인하고 검증해야 합니다.

### [Scope A] Header Popovers
- [ ] `QuickActionsDropdown.js`: `MGButton`을 제거하고 네이티브 `<button type="button" className="mg-v2-quick-action-item">`으로 교체했는가?
- [ ] `QuickActionsDropdown.css`: 개별 버튼의 테두리(border)를 제거하고, 높이 42px, 내부 패딩 8px 패널 여백, 호버 시 `var(--mg-color-bg-hover)` 필(fill)로 렌더링되는가?
- [ ] `NotificationDropdown.js` & `.css`: 탭 바를 마진/갭 없는 진짜 세그먼트 컨트롤(`.mg-v2-notification-segmented`)로 교체하여 흰색 갭 슬리버를 제거했는가?
- [ ] `NotificationDropdown`: Active 탭이 솔리드 Dusty Teal(`var(--mg-color-primary-solid)`) 배경에 흰색 텍스트(`var(--mg-color-text-on-primary)`)로 렌더링되는가?
- [ ] `NotificationDropdown`: 빈 목록(Empty State) 및 푸터 "알림 전체 보기" 버튼에 충분한 여백(48px / 38px)이 적용되었는가?
- [ ] 팝오버 3종 모두 공통 패널 토큰(반경 16px, 테두리 1px, `var(--mg-shadow-lg)`)을 준수하는가?
- [ ] 기존 네비게이션 경로 및 라벨 데이터가 누락 없이 100% 보존되었는가?

### [Scope B] MappingCreationModal Person Picker Cards
- [ ] `MappingCreationModal.js`: 상담사/내담자 카드의 `MGButton` 래퍼를 제거하고 네이티브 `<button type="button" className="mg-v2-mapping-creation-modal__card" aria-pressed={isSelected}>`로 교체했는가?
- [ ] `MappingCreationModal.css`: 그리드를 과밀한 3열에서 데스크톱 2열(`repeat(2, minmax(0, 1fr))`), 모바일 1열로 변경했는가?
- [ ] 카드 패딩을 `16px` 이상, 최소 높이를 `76px`(72~88px 범위)로 설정하여 44px 아바타가 절대 잘리지 않도록 보장했는가?
- [ ] 선택 상태(`.mg-v2-mapping-creation-modal__card--selected`)에서 `border: 2px` 및 이중 보더를 제거하고, **정확히 1px solid Dusty Teal + 은은한 틴트 배경(`var(--mg-color-b0kla-green-50)`)**으로 렌더링되는가?
- [ ] 상담사/내담자 데이터(이름, 이메일, 통계, 아바타 이니셜)가 정확히 유지되는가?

### [Scope C] GNB Light/Dark Theme Switch
- [ ] `ProfileDropdown.js`: `useDarkMode` 훅(`{ resolved, setMode }`)을 import하여 연결했는가?
- [ ] `ProfileDropdown` 메뉴 내부에 "화면 테마" 전환 행(`.mg-v2-profile-theme-row`)과 2-버튼 세그먼트 스위치(`.mg-v2-theme-switch`)를 배치했는가?
- [ ] #620 준수: GNB 헤더의 아바타+이름 트리거와 쉐브론 분리 구조를 유지하고, 공유 pill-border나 `MGButton` chrome을 추가하지 않았는가?
- [ ] 테마 스위치 클릭 시 `<html data-theme="light|dark">` 속성과 로컬 스토리지가 즉각 변경되는가?

### [Scope D] LNB Hover Text Contrast
- [ ] `NavLink.css`: `:hover` 및 `.mg-v2-nav-link--active` 셀렉터에서 `color: var(--mg-v2-color-text-primary)`를 제거하고 **`color: var(--mg-color-text-on-primary, #FFFFFF)`**로 명시했는가?
- [ ] 라이트 모드 및 다크 모드 양쪽 모두에서 LNB 메뉴 항목에 마우스를 올렸을 때 텍스트/아이콘/쉐브론이 어두운 색으로 회귀하지 않고 선명한 흰색(#FFFFFF)으로 표시되는가?
- [ ] 노란색 hover 텍스트나 비표준 outline patch를 모두 제거하고, 클린한 호버 서페이스(`rgba(255, 255, 255, 0.1)`)를 적용했는가?
- [ ] #618 네이티브 쉐브론 엘리먼트 구조를 그대로 유지했는가?

---

## 7. 결론 및 산출물 요약

본 스펙은 마인드가든의 Calm Clinical 톤앤매너에 맞추어 GNB 팝오버, 인물 선택 모달, 테마 제어, LNB 명도 대비 결함을 전면적이고 일관되게 재작성(Surface Rewrite)합니다. `core-coder`는 본 문서에 명시된 토큰 및 아토믹 가이드를 기반으로 임의의 스타일 추측 없이 100% 정합된 UI를 구현할 수 있습니다.
