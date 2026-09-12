# Clinic-OS 앱 메뉴 노출 관리 (App Menu Visibility) UI/UX 스펙

**문서 상태**: APPROVED — core-designer Handoff Spec  
**대상 라우트**: `/admin/menu-permissions` (기존 `MenuPermissionManagement` 재사용 · 신규 URL 및 신규 LNB 금지)  
**역할 구분**: UI/UX·디자인 스펙 전용 문서 (코드 작성·구현 금지)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`, live `/admin/dashboard` (Admin Dashboard V2)  
**오케스트레이션 SSOT**: `docs/project-management/MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md`  
**패턴 트윈**: `docs/design-system/clinic-os-menu-permissions.md`, `SettingSwitchRow` (`Switch` role="switch"), `TabChipRow` (역할 칩)

---

## 0. 핵심 변경 사항 및 설계 원칙

1. **일괄 «변경사항 저장» CTA 완전 금지**:
   - 상단 QuietHeader 및 화면 전체에서 일괄 저장 버튼(배치 저장 CTA)을 제거한다.
   - 각 메뉴 행의 스위치를 클릭하는 즉시 개별 grant API를 호출하여 **실시간 즉시 적용(Instant Grant)** 된다.
   - 미저장 대기 뱃지(`수정됨 (저장 필요)`) 및 미저장 변경 확인 팝업(`useConfirm`)을 폐기한다.
2. **행마다 iOS | Android 이중 Switch (Dual-Switch Group) 배치**:
   - 모바일 앱 표면 메뉴(Client/Consultant More 탭)에 대해 **[iOS Switch]** 와 **[Android Switch]** 를 독립적으로 제공한다.
   - Apple App Store UGC(가이드라인 1.2) 심사 시 **커뮤니티 메뉴를 iOS에서만 즉시 OFF하고, Android는 ON 상태를 유지**할 수 있다.
   - 클라이언트 소스 코드에 `if (Platform.OS === 'ios') hide community`와 같은 하드코딩을 원천 차단하고, DB/API RBAC(`can_view_ios`, `can_view_android`) 플래그로만 통제한다.
3. **LNB 신규 메뉴 추가 금지**:
   - Admin 좌측 LNB에 신규 메뉴나 추가 뎁스를 만들지 않는다.
   - 기존 경로인 `사용자 관리 > 메뉴 권한`(`/admin/menu-permissions`)을 그대로 유지·재사용한다.
4. **역할 칩 기본값: CLIENT (내담자)**:
   - 화면 진입 시 기본 선택 탭을 `CLIENT`로 두어, 심사 담당자나 관리자가 1초 안에 내담자 앱 메뉴 상태를 확인하고 조작할 수 있도록 동선을 단축한다.
5. **커뮤니티 «심사 유의» 뱃지 명시**:
   - Apple App Store UGC 심사 대상인 `커뮤니티` 행에 눈에 띄는 `심사 유의` 뱃지를 노출한다.
6. **잠금 메뉴 비활성화 + 명확한 잠금 사유 제공**:
   - 시스템 필수 메뉴나 역할 권한 정책(예: 상담사의 스케줄 생성 불가, 스태프의 재무 접근 불가)에 따라 잠긴 메뉴는 스위치를 비활성화(`disabled`)하고 자물쇠(🔒) 아이콘 및 사유를 명확히 안내한다.
7. **Clinic-OS CSS 토큰 100% 준수**:
   - 레거시 B0KlA forest green (`#3D5246`) 및 임의 HEX 리터럴을 일체 금지하며, `var(--mg-v2-*)` 토큰만 사용한다.
8. **iOS 심사 모드 원버튼**:
   - QuietHeader 아래 1줄에 **「iOS에서 커뮤니티 숨기기」/「다시 보이기」** 원버튼을 둔다.
   - 클릭 즉시 CLIENT·CONSULTANT 커뮤니티의 `canViewIos`만 일괄 변경한다. Android·웹은 불변.
   - 커뮤니티를 Flyway로 사전 OFF하지 않는다. 가이드라인 준수 확인 후 필요 시 원버튼만 사용한다.

---

## 1. 개요 및 배경

### 1.1 배경 및 해결 과제
- **기존 문제**:
  - 기존 메뉴 노출 제어는 단일 `canView` 플래그로만 작동하여, iOS와 Android 앱에서 동일하게 켜지거나 꺼지는 구조였다.
  - 이로 인해 Apple App Store의 까다로운 UGC(User-Generated Content, 1.2) 심사 제출 시, 심사 리스크를 피하기 위해 커뮤니티를 숨기면 Android 사용자까지 커뮤니티를 이용할 수 없게 되는 문제가 있었다.
  - 또한 상단에 일괄 저장 CTA가 있어, 관리자가 스위치를 조작한 뒤 저장을 누르지 않고 이탈하여 설정이 유실되는 UX 오류가 빈번했다.
- **해결 방안 (TO-BE)**:
  - `/admin/menu-permissions` 화면의 앱 메뉴 행에 **iOS Switch**와 **Android Switch**를 나란히 배치한다.
  - 각 스위치를 토글하는 즉시 백엔드 grant API를 비동기 호출(Optimistic UI + Fallback Rollback)하여 변경사항이 실시간 반영되도록 한다.
  - 일괄 저장 CTA를 제거하고 깔끔한 QuietHeader로 전환한다.

---

## 2. 레이아웃 및 정보 구조 (IA)

```text
AdminCommonLayout (어드민 표준 레이아웃 셸 · LNB 수정 없음)
└─ ContentArea (.menu-permission--clinic-os)
   ├─ QuietHeader
   │  ├─ Left: h1「앱 메뉴 노출 관리」
   │  └─ Subtitle「행의 스위치를 토글하는 즉시 iOS·Android 모바일 앱에 각각 반영됩니다.」
   │  (우측 일괄 저장 CTA 없음)
   │
   ├─ TabChipRow (역할 선택 칩스 · CLIENT 기본 선택)
   │  └─ [ (내담자) ]  [ 상담사 ]  [ 스태프 ]  [ 관리자 ]
   │
   ├─ Badge Rail (상태 요약 레일)
   │  ├─ Left: [내담자(CLIENT) 앱] • 총 6개 메뉴 • iOS 5개 노출 / Android 6개 노출
   │  └─ Right: 💡 각 플랫폼별 스위치는 조작 즉시 실시간 저장됩니다.
   │
   └─ Main Stage (ContentCard · Single Plain Surface)
      └─ Stage Rows Container (단일 행 리스트)
         ├─ Row 1: [CreditCard] 회기 · 결제       [앱] [기본]       | [🔒 필수] [🔒 필수]
         ├─ Row 2: [Shopping]   온라인 쇼핑       [앱] [센터 맞춤]  | [iOS: 노출] [Android: 노출]
         ├─ Row 3: [Users]      커뮤니티 ★       [앱] [심사 유의]  | [iOS: 숨김] [Android: 노출]
         ├─ Row 4: [Bell]       알림 센터         [앱] [기본]       | [🔒 필수] [🔒 필수]
         ├─ Row 5: [Message]    1:1 메시지        [앱] [기본]       | [🔒 필수] [🔒 필수]
         └─ Row 6: [Settings]   내 정보 · 설정    [앱] [기본]       | [🔒 필수] [🔒 필수]
```

### 2.1 화면 와이어프레임 (Clinic-OS ASCII Mockup)

```text
+------------------------------------------------------------------------------------------------------------------------+
| AdminCommonLayout (Sidebar 260px / GNB)                                                                                |
|                                                                                                                        |
|   QuietHeader                                                                                                            |
|   앱 메뉴 노출 관리                                                                                                    |
|   가이드라인 준수 확인 후 필요 시 iOS 원버튼으로 커뮤니티만 숨깁니다. iOS·Android 스위치는 즉시 적용됩니다.             |
|                                                                                                                        |
|   [ iOS 심사 · 커뮤니티 ]  내담자·상담사 커뮤니티 iOS만 일괄 변경 · Android·웹 유지                                     |
|   [ iOS에서 커뮤니티 숨기기 ]  (대칭: 다시 보이기)                                                                     |
|                                                                                                                        |
| TabChipRow                                                                                                             |
|   ( [ 내담자 ] )  [ 상담사 ]  [ 스태프 ]  [ 관리자 ]                                                                    |
|                                                                                                                        |
| Summary Strip (Badge Rail)                                                                                             |
|   내담자(CLIENT) 앱   •   총 6개 메뉴   •   iOS 5개 노출 · Android 6개 노출       💡 스위치 조작 즉시 실시간 저장됩니다 |
|                                                                                                                        |
| Main Stage (ContentCard - Plain Surface)                                                                               |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | 메뉴 정보                                           뱃지                  iOS 노출 제어       Android 노출 제어    | |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [CreditCard] 회기 · 결제                         [앱] [기본]         [🔒필수] ( ===● )    [🔒필수] ( ===● )       | |
| |              모바일 앱 더보기 > 상담 · 결제 섹션                                                                   | |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [Shopping]   온라인 쇼핑                         [앱] [센터 맞춤]     [노출]   ( ===● )    [노출]   ( ===● )       | |
| |              모바일 앱 더보기 > 패키지 · 검사 구매                     (ON)                 (ON)                   | |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [Users]      커뮤니티                            [앱] [심사 유의]     [숨김]   ( ●=== )    [노출]   ( ===● )   ★   | |
| |              모바일 앱 더보기 > 게시글 · 댓글 (Apple UGC 심사 대응)   (OFF)                (ON)                   | |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [Bell]       알림 센터                           [앱] [기본]         [🔒필수] ( ===● )    [🔒필수] ( ===● )       | |
| |              모바일 앱 더보기 > 알림 내역                                                                          | |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [Message]    1:1 메시지                          [앱] [기본]         [🔒필수] ( ===● )    [🔒필수] ( ===● )       | |
| |              모바일 앱 더보기 > 상담사 대화 목록                                                                   | |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [Settings]   내 정보 · 설정                      [앱] [기본]         [🔒필수] ( ===● )    [🔒필수] ( ===● )       | |
| |              모바일 앱 더보기 > 환경설정 및 계정                                                                   | |
| +--------------------------------------------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------------------------------------------+
```

---

## 3. 세부 UI/UX 스펙 (CSS 변수 / 토큰 명시)

### 3.1 QuietHeader (ContentHeader 개정)
- **컴포넌트**: `MenuPermissionQuietHeader` (또는 `ContentHeader` Clinic-OS 변형)
- **제목 (`h1`)**:
  - 텍스트: `앱 메뉴 노출 관리`
  - Font: `var(--mg-v2-font-size-h1, 1.75rem)` (28px), Weight: `var(--mg-v2-font-weight-bold, 700)`
  - Color: `var(--mg-v2-color-text-primary)` (`#0F172A`)
  - Border-left / Accent bar: **절대 금지 (`border-left: none !important`)**
- **부제 (`p`)**:
  - 텍스트: `행의 스위치를 토글하는 즉시 iOS·Android 모바일 앱에 각각 반영됩니다.`
  - Font: `var(--mg-v2-font-size-body-md, 0.875rem)` (14px)
  - Color: `var(--mg-v2-color-text-secondary)` (`#475569`)
- **우측 컨트롤 구역**:
  - **일괄 «변경사항 저장» 버튼 완전 제거**.
  - 비워두거나 필요 시 조용한 동기화 상태 인디케이터(예: `실시간 반영 중`)만 배치.

### 3.2 역할 선택 칩 (TabChipRow)
- **컴포넌트**: `TabChipRow` (공통 분자 컴포넌트, `size="sm"`)
- **역할 순서 및 라벨 (한글 SSOT)**:
  1. `내담자` (`CLIENT`) — **초기 진입 시 기본 활성화**
  2. `상담사` (`CONSULTANT`)
  3. `스태프` (`STAFF`)
  4. `관리자` (`ADMIN`)
- **스타일 사양**:
  - 활성 탭: `MGButton` variant `primary` (Fill: `var(--mg-v2-color-primary-solid, #0E5F5A)`, Text: `var(--mg-v2-color-neutral-50, #FAF9F7)`)
  - 비활성 탭: `MGButton` variant `outline` (Border: `1px solid var(--mg-v2-color-neutral-300, #D4CFC8)`, Text: `var(--mg-v2-color-text-secondary, #475569)`)
  - 높이: `var(--button-height-sm, 32px)` 고정 (단차 발생 방지)
  - Gap: `var(--mg-v2-space-2, 0.5rem)`

### 3.3 상태 요약 레일 (Badge Rail / Summary Strip)
- **컴포넌트**: `MenuPermissionBadgeRail`
- **컨테이너 스타일**:
  - Background: `var(--mg-v2-color-neutral-50, #FAF9F7)`
  - Border: `1px solid var(--mg-v2-color-neutral-300, #D4CFC8)`
  - Border-radius: `var(--mg-v2-radius-md, 0.625rem)`
  - Padding: `var(--mg-v2-space-sm, 0.5rem) var(--mg-v2-space-md, 1rem)`
  - Display: Flex, justify-content: space-between, align-items: center
- **좌측 요약 정보**:
  - 역할 뱃지: `<span class="menu-permission-badge">내담자(CLIENT) 앱</span>`
  - 구분점: `•` (color: `var(--mg-v2-color-text-secondary)`)
  - 플랫폼별 노출 통계: `iOS 5개 노출 · Android 6개 노출 (총 6개)`
- **우측 가이드**:
  - 문구: `💡 각 스위치는 조작 즉시 저장됩니다.` (font-size: `var(--mg-v2-font-size-caption, 0.75rem)`, color: `var(--mg-v2-color-text-secondary)`)
  - `수정됨 (저장 필요)` 배지 및 `기본값 복원` 버튼 제거.

### 3.4 Main Stage 컨테이너 (ContentCard)
- **스타일 사양**:
  - Background: `var(--mg-v2-color-neutral-50, #FAF9F7)`
  - Border: `1px solid var(--mg-v2-color-neutral-300, #D4CFC8)`
  - Border-radius: `var(--mg-v2-radius-md, 0.625rem)`
  - Min-height: `24rem`
  - Padding: `var(--mg-v2-space-md, 1rem)`

### 3.5 Stage Row: 메뉴 정보 구역 (`.menu-permission-row__info`)
- **행 컨테이너 (`.menu-permission-row`)**:
  - Display: Grid
  - Grid-template-columns: `minmax(0, 1fr) auto auto` (또는 Flex)
  - Align-items: Center
  - Gap: `var(--mg-v2-space-md, 1rem)`
  - Padding: `var(--mg-v2-space-3, 0.75rem) 0`
  - Border-bottom: `1px solid var(--mg-v2-color-neutral-300, #D4CFC8)`
  - 마지막 행: `border-bottom: none`
- **메뉴 타이틀 및 설명**:
  - **메뉴명 (한글 SSOT)**: `var(--mg-v2-font-size-body-md, 0.875rem)`, font-weight: `600`, color: `var(--mg-v2-color-text-primary, #0F172A)`
  - **경로 / 설명 힌트**: `var(--mg-v2-font-size-caption, 0.75rem)`, color: `var(--mg-v2-color-text-secondary, #475569)`. (예: `모바일 앱 더보기 > 게시글 · 댓글 (Apple UGC 심사 대응)`)
  - **기술적 `menuCode`, `menuPath` 노출 절대 금지**.
- **뱃지 컬럼 (`.menu-permission-row__badge-col`)**:
  - **위치 뱃지**:
    - `앱`: bg `var(--mg-v2-color-neutral-200)`, text `var(--mg-v2-color-neutral-700)`
    - `웹`: bg `var(--mg-v2-color-neutral-100)`, text `var(--mg-v2-color-text-secondary)`
  - **설정 속성 뱃지**:
    - `기본`: bg `var(--mg-v2-color-neutral-100)`, border `1px solid var(--mg-v2-color-neutral-300)`, text `var(--mg-v2-color-text-secondary)`
    - `센터 맞춤`: bg `var(--mg-v2-color-neutral-50)`, border `1px solid var(--mg-v2-color-primary-main)`, text `var(--mg-v2-color-primary-main, #0E5F5A)`
  - **심사 유의 뱃지 (커뮤니티 전용)**:
    - 라벨: `심사 유의`
    - Background: `var(--mg-v2-color-semantic-warning-light, #FFFBEB)`
    - Color: `var(--mg-v2-color-semantic-warning-dark, #B45309)`
    - Font-size: `var(--mg-v2-font-size-caption, 0.75rem)`, Font-weight: `600`
    - Radius: `var(--mg-v2-radius-sm, 0.375rem)`

### 3.6 Stage Row: 듀얼 스위치 컨트롤 구역 (`.menu-permission-dual-controls`)

각 앱 표면 메뉴 행의 우측에는 **iOS 노출 제어 셀**과 **Android 노출 제어 셀**이 나란히 배치된다.

```text
┌────────────────────────────────────────────────────────┐
│  [ iOS ]  [노출] ( ===● )   │   [ Android ]  [노출] ( ===● )  │
└────────────────────────────────────────────────────────┘
```

- **듀얼 컨트롤 컨테이너 (`.menu-permission-dual-controls`)**:
  - Display: Flex
  - Align-items: Center
  - Gap: `var(--mg-v2-space-4, 1rem)`
  - Justify-content: Flex-end
- **플랫폼 셀 구분선 (`.menu-permission-dual-controls__divider`)**:
  - Width: `1px`
  - Height: `1.75rem`
  - Background: `var(--mg-v2-color-neutral-300, #D4CFC8)`
- **플랫폼 스위치 셀 (`.menu-permission-switch-cell`)**:
  - Display: Flex
  - Align-items: Center
  - Gap: `var(--mg-v2-space-2, 0.5rem)`
  - **1) 플랫폼 라벨 (`.menu-permission-switch-cell__label`)**:
    - 텍스트: `iOS` 또는 `Android`
    - Font-size: `var(--mg-v2-font-size-caption, 0.75rem)` (12px)
    - Font-weight: `var(--mg-v2-font-weight-semibold, 600)`
    - Color: `var(--mg-v2-color-text-secondary, #475569)`
    - Min-width: `2.75rem` (라벨 정렬 고정)
  - **2) 노출 상태 텍스트 뱃지 (`.menu-permission-badge--state`)**:
    - **노출 (ON)**:
      - 텍스트: `노출`
      - Background: `var(--mg-v2-color-semantic-success-light, #ECFDF5)`
      - Color: `var(--mg-v2-color-semantic-success, #059669)`
      - Padding: `0.125rem 0.375rem`, Radius: `var(--mg-v2-radius-sm, 0.25rem)`
      - Font-size: `0.6875rem` (11px), Font-weight: `600`
    - **숨김 (OFF)**:
      - 텍스트: `숨김`
      - Background: `var(--mg-v2-color-neutral-200, #EBE6DF)`
      - Color: `var(--mg-v2-color-text-secondary, #475569)`
      - Padding: `0.125rem 0.375rem`, Radius: `var(--mg-v2-radius-sm, 0.25rem)`
      - Font-size: `0.6875rem` (11px), Font-weight: `600`
  - **3) 스위치 컴포넌트 (`Switch`)**:
    - 공통 Atom `Switch` (`role="switch"`)
    - Property:
      - `checked`: `menu.canViewIos` (iOS) / `menu.canViewAndroid` (Android)
      - `onCheckedChange`: `(next) => handleToggle(menu.menuId, 'ios', next)` / `handleToggle(menu.menuId, 'android', next)`
      - `disabled`: `isLocked || isPending`
      - `isPending`: 해당 플랫폼의 토글 API 진행 중 여부
      - `ariaLabel`: `MENU_PERM_ROW.VISIBILITY_ARIA_PLATFORM(menuName, 'iOS')`
    - ON 토큰: Background `var(--mg-v2-color-primary-main, #0E5F5A)`
    - OFF 토큰: Background `var(--mg-v2-color-neutral-300, #D4CFC8)`
    - Knob 토큰: Background `var(--mg-v2-color-neutral-50, #FAF9F7)`
    - 너비 40px, 높이 22px, Radius `var(--mg-v2-radius-pill, 9999px)`

### 3.7 잠금 상태 (Disabled & Locked Reason)
- **대상 메뉴**:
  - `회기 · 결제`, `알림 센터`, `내 정보 · 설정` 등 내담자/상담사 서비스 구동 필수 기본 메뉴.
  - 상담사의 `스케줄 등록` 메뉴 (`CST_SCHEDULE` — 상담사는 스케줄 생성 불가, 센터 대리 등록 정책).
  - 스태프의 `운영 · 재무` 메뉴 (`ADM_ERP`, `ERP_FINANCIAL` 등 — 스태프 접근 불가 정책).
- **시각 표현**:
  - 스위치가 비활성화(`disabled={true}`)되고 조작 불가능.
  - 컨트롤 셀 내에 자물쇠 아이콘과 사유 표시:
    - 아이콘: `<i className="bi bi-lock-fill" aria-hidden="true" />` (color: `var(--mg-v2-color-text-secondary)`)
    - 라벨: `🔒 필수` 또는 `🔒 잠김`
    - 툴팁 / 상세 사유:
      - `상담사는 스케줄을 생성할 수 없습니다. 센터·스태프가 대리 등록합니다.`
      - `스태프에게 운영·재무 권한을 줄 수 없습니다.`
      - `서비스 구동에 필수적인 기본 메뉴로 비활성화할 수 없습니다.`

### 3.8 웹 전용 메뉴 행 사양 (Surface = WEB)
- 웹 대시보드 전용 메뉴(예: 관리자의 테넌트 설정, 장부 관리 등 앱에 노출되지 않는 메뉴)는 iOS/Android 분기가 불필요하다.
- **표시 방식**:
  - 우측 컨트롤 구역에 이중 스위치 대신 **단일 웹 스위치 [웹: 노출/숨김]** 를 배치하거나,
  - 뱃지에 `웹 전용`을 표시하고 단일 `canView` 토글을 제공한다.
  - 앱 전용 탭 필터(`surfaceFilter === 'APP'`)가 활성화된 상태에서는 기본적으로 모바일 앱 표면 메뉴만 필터링되어 노출되므로, 관리자가 혼동할 여지를 최소화한다.

---

## 4. 인터랙션 및 상태 전이 (Interaction & States)

### 4.1 즉시 적용(Instant Grant) 워크플로

```
[관리자 행동]
  관리자가 '커뮤니티' 행의 'iOS' 스위치를 클릭 (ON → OFF)
     │
     ▼
[낙관적 업데이트 (Optimistic Update)]
  1. 즉시 로컬 state에서 canViewIos = false 로 반전
  2. 스위치가 왼쪽으로 슬라이드되며 회색(OFF)으로 전환
  3. 상태 뱃지가 [노출]에서 [숨김]으로 즉시 변경
  4. 해당 스위치에 isPending = true 설정 (aria-busy="true", 중복 클릭 방지)
     │
     ▼
[백엔드 Grant API 비동기 호출]
  PUT /api/v1/menus/permissions/grant (또는 patch endpoint)
  Payload: { roleId, menuId, canViewIos: false } (부분 필드 갱신)
     │
  ┌──┴──────────────────────────────────────┐
  ▼                                         ▼
[호출 성공 (Success)]                 [호출 실패 (Error & Rollback)]
  - isPending = false 해제              - isPending = false 해제
  - 마이크로 토스트 알림:                - canViewIos = true 로 즉시 롤백 (이전 상태 복원)
    "내담자 '커뮤니티' iOS 노출을 숨겼습니다." - 상태 뱃지 [노출] 로 롤백
  - 백그라운드 데이터 정합성 유지        - 에러 토스트 알림:
                                          "설정 변경에 실패하여 이전 상태로 복구되었습니다."
                                        - 해당 행에 0.4초간 semantic-warning/error 틴트 페이드
```

### 4.2 Optimistic UI & Rollback 규약
- **사용자 인지 지연 0ms**: API 응답을 기다리지 않고 즉시 스위치 핑거 애니메이션과 상태 뱃지가 전환된다.
- **중복 요청 방어**: API 호출 진행 중에는 스위치에 `isPending={true}`를 전달하여 `disabled` 상태로 만들고, `aria-busy="true"`를 부여하여 광클릭/더블클릭을 방지한다.
- **원복(Rollback) 완결성**: 네트워크 오류, 403 권한 거부, 서버 500 에러 발생 시 원래 값(`prevCanViewIos`)으로 정확히 롤백하고 사용자에게 명확한 에러 토스트를 제공한다.

### 4.3 상태별 화면 사양 (Loading / Error / Empty)

| 상태 | UI 표현 | 사용 컴포넌트 및 토큰 |
|------|---------|-----------------------|
| **초기 로딩** | Stage 내부 중앙 인라인 스피너 | `<UnifiedLoading type="inline" text="메뉴 권한 정보를 불러오는 중..." />` |
| **조회 에러** | Stage 상단 인라인 경고 배너 | `<div className="menu-permission-error" role="alert">` (bg: `var(--mg-v2-color-semantic-error-light)`, color: `var(--mg-v2-color-semantic-error)`) + `다시 시도` 버튼 |
| **빈 목록** | Stage 중앙 Empty 안내 | `<EmptyState title="표시할 메뉴가 없습니다" description="선택한 역할에 매핑된 메뉴가 존재하지 않습니다." />` (이모지 없음) |
| **개별 스위치 Pending** | 해당 스위치 딤드 & 터치 잠금 | `Switch isPending={true}` (opacity: 0.7, cursor: wait) |

---

## 5. 핵심 시나리오: CLIENT «커뮤니티» iOS 분리 토글 워크플로

이 시나리오는 **Apple App Store UGC 심사 제출 담당자 및 센터 관리자**의 실제 행동 경로를 완벽히 지원한다.

```text
[1. 화면 진입]
  관리자가 어드민에서 /admin/menu-permissions 로 이동
  → 별도 클릭 없이 자동으로 '내담자 (CLIENT)' 탭이 기본 선택되어 열림

[2. 커뮤니티 행 식별]
  목록에서 '커뮤니티' 행이 즉시 식별됨:
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │ [Users]  커뮤니티                                                                     │
  │          모바일 앱 더보기 > 게시글 · 댓글 (Apple UGC 심사 대응)                          │
  │          [앱] [센터 맞춤] [심사 유의]                                                  │
  │                                [ iOS ] [숨김] ( ●=== ) │ [ Android ] [노출] ( ===● )   │
  └────────────────────────────────────────────────────────────────────────────────────────┘

[3. 심사 전 커뮤니티 iOS만 OFF 토글]
  관리자가 [ iOS ] 스위치를 클릭
  → 스위치가 왼쪽(OFF)으로 즉시 슬라이드
  → iOS 상태 뱃지가 [숨김] 으로 즉시 변경
  → 안드로이드 스위치는 여전히 [노출] (ON) 유지!
  → 우측 상단 토스트: "내담자 역할의 '커뮤니티' iOS 노출이 비활성화되었습니다."
  → 저장 버튼을 누를 필요 없이 즉시 반영 완료!

[4. 모바일 앱 반영 결과]
  - iOS Expo 앱: 내담자가 앱 실행 시 더보기 탭에서 '커뮤니티' 메뉴가 완전히 숨겨짐 (Apple 심사 통과).
  - Android Expo 앱: 내담자가 앱 실행 시 '커뮤니티' 메뉴가 정상 노출되어 서비스 차질 없음.
  - 심사 통과 후: 관리자가 다시 들어와 [ iOS ] 스위치를 켜면 즉시 iOS에서도 커뮤니티가 재노출됨.
```

---

## 6. 아토믹 컴포넌트 매핑 및 공통 모듈 재사용

신규 컴포넌트를 난립하지 않고, 기존에 검증된 공통 모듈 및 토큰 시스템을 100% 재사용한다.

| 아토믹 계층 | 컴포넌트 명 | 역할 및 재사용 규약 | 소스 경로 |
|------------|------------|-------------------|-----------|
| **Template** | `AdminCommonLayout` | 어드민 기본 GNB/LNB 셸 프레임워크 (LNB 변경 없음) | `frontend/src/components/layout/AdminCommonLayout.jsx` |
| **Organism** | `ContentArea` | Clinic-OS 본문 래퍼 (`.menu-permission--clinic-os`) | `frontend/src/components/dashboard-v2/content/ContentArea.js` |
| **Organism** | `MenuPermissionQuietHeader` | QuietHeader (h1 + subtitle, **일괄 저장 버튼 없음**) | `frontend/src/components/admin/menu-permission/MenuPermissionQuietHeader.js` |
| **Molecule** | `TabChipRow` | 역할 전환 칩 행 (`내담자`, `상담사`, `스태프`, `관리자`) | `frontend/src/components/common/TabChipRow.jsx` |
| **Organism** | `MenuPermissionBadgeRail` | 플랫폼별 노출 현황 및 즉시 적용 가이드 요약 레일 | `frontend/src/components/admin/menu-permission/MenuPermissionBadgeRail.js` |
| **Organism** | `ContentCard` | Main Stage 단일 카드 컨테이너 | `frontend/src/components/dashboard-v2/content/ContentCard.js` |
| **Atom** | `Switch` | iOS / Android 노출 토글 스위치 (`role="switch"`) | `frontend/src/components/common/Switch.js` |
| **Atom** | `Badge` / `StatusBadge` | `앱`, `웹`, `기본`, `센터 맞춤`, `심사 유의`, `노출`, `숨김` | `frontend/src/components/common/Badge.js` |
| **Atom** | `SafeText` | React #130 방지 안전 텍스트 렌더링 (`toDisplayString`) | `frontend/src/components/common/SafeText.js` |
| **Molecule** | `EmptyState` | 메뉴 목록 부재 시 안내 (이모지 없음) | `frontend/src/components/common/EmptyState.js` |
| **Atom** | `UnifiedLoading` | 데이터 조회 중 인라인 로딩 인디케이터 | `frontend/src/components/common/UnifiedLoading.js` |

---

## 7. 사용 디자인 토큰 목록 (Unified Design Tokens SSOT)

하드코딩된 색상값이나 치수(#hex, px 리터럴)는 일체 배제하며, 다음 CSS 변수만을 사용한다.

```css
/* Color - Brand & Primary (Clinic Dusty Teal SSOT) */
var(--mg-v2-color-primary-main)          /* #0E5F5A - Switch ON Fill & Center Accent */
var(--mg-v2-color-primary-solid)         /* #0E5F5A - Active Tab Chip Fill */
var(--mg-v2-color-primary-dark)          /* #0A4F4B - Hover & Active State */
var(--mg-v2-color-primary-subtle)        /* #DCE8E5 - Soft Tint Wash */

/* Color - Neutrals */
var(--mg-v2-color-neutral-50)            /* #FAF9F7 - Page Background / Stage Card */
var(--mg-v2-color-neutral-100)           /* #F5F3EF - Surface Secondary */
var(--mg-v2-color-neutral-200)           /* #EBE6DF - Row Borders / Badges */
var(--mg-v2-color-neutral-300)           /* #D4CFC8 - Outlines & Switch OFF Fill */
var(--mg-v2-color-neutral-700)           /* #475569 - Secondary Elements */
var(--mg-v2-color-neutral-900)           /* #0F172A - Dominant Slate */

/* Color - Text */
var(--mg-v2-color-text-primary)          /* #0F172A - H1, Row Label */
var(--mg-v2-color-text-secondary)        /* #475569 - Subtitle, Descriptions, Switch Labels */
var(--mg-v2-color-text-tertiary)         /* #64748B - Meta, Helper hints */

/* Color - Semantics */
var(--mg-v2-color-semantic-success)       /* #059669 - '노출' Badge Text */
var(--mg-v2-color-semantic-success-light) /* #ECFDF5 - '노출' Badge Fill */
var(--mg-v2-color-semantic-warning)       /* #D97706 - Warning Accent */
var(--mg-v2-color-semantic-warning-light) /* #FFFBEB - '심사 유의' Badge Fill */
var(--mg-v2-color-semantic-warning-dark)  /* #B45309 - '심사 유의' Badge Text */
var(--mg-v2-color-semantic-error)         /* #A84848 - Danger / Error Banner */
var(--mg-v2-color-semantic-error-light)   /* #FEF2F2 - Error Banner Fill */

/* Typography */
var(--mg-v2-font-family-base)            /* Pretendard, Noto Sans KR, sans-serif */
var(--mg-v2-font-size-h1)                /* 1.75rem (28px) - Page Title */
var(--mg-v2-font-size-body-md)           /* 0.875rem (14px) - Row Label, Tab Label */
var(--mg-v2-font-size-caption)           /* 0.75rem (12px) - Description, Switch Labels, Badges */
var(--mg-v2-font-weight-regular)         /* 400 */
var(--mg-v2-font-weight-medium)          /* 500 */
var(--mg-v2-font-weight-semibold)        /* 600 */
var(--mg-v2-font-weight-bold)            /* 700 */

/* Spacing & Sizing */
var(--mg-v2-space-2)                     /* 0.5rem (8px) */
var(--mg-v2-space-3)                     /* 0.75rem (12px) */
var(--mg-v2-space-4)                     /* 1rem (16px) */
var(--mg-v2-space-5)                     /* 1.25rem (20px) */
var(--button-height-sm)                  /* 32px - Tab Chips */
var(--mg-v2-touch-target-min)            /* 44px - Touch Target */

/* Radius */
var(--mg-v2-radius-sm)                   /* 0.25rem (4px) - Badges */
var(--mg-v2-radius-md)                   /* 0.625rem (10px) - Cards, Rail */
var(--mg-v2-radius-pill)                 /* 9999px - Switch, Pill Chips */
```

---

## 8. CSS 클래스 사양 (`MenuPermissionClinicOs.css` 개정 가이드)

코더가 그대로 구현할 수 있는 클래스명 및 스타일 구조:

```css
/* 듀얼 스위치 컨트롤 그룹 */
.menu-permission-dual-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--mg-v2-space-4, var(--mg-spacing-16));
}

/* 플랫폼 스위치 셀 (iOS / Android) */
.menu-permission-switch-cell {
  display: flex;
  align-items: center;
  gap: var(--mg-v2-space-2, var(--mg-spacing-8));
}

.menu-permission-switch-cell__label {
  font-size: var(--mg-v2-font-size-caption, 0.75rem);
  font-weight: 600;
  color: var(--mg-v2-color-text-secondary);
  min-width: 2.75rem;
  text-align: right;
}

/* 플랫폼 간 구분선 */
.menu-permission-dual-controls__divider {
  width: 0.0625rem;
  height: 1.5rem;
  background: var(--mg-v2-color-neutral-300);
}

/* 심사 유의 뱃지 */
.menu-permission-badge--review {
  background: var(--mg-v2-color-semantic-warning-light, #FFFBEB);
  color: var(--mg-v2-color-semantic-warning-dark, #B45309);
  border: 0.0625rem solid transparent;
  font-weight: 600;
}

/* 잠금 사유 컨테이너 */
.menu-permission-lock {
  display: inline-flex;
  align-items: center;
  gap: var(--mg-v2-space-xs, var(--mg-spacing-4));
  font-size: var(--mg-v2-font-size-caption, 0.75rem);
  color: var(--mg-v2-color-text-secondary);
}

.menu-permission-lock i {
  font-size: 0.875rem;
  color: var(--mg-v2-color-text-secondary);
}
```

---

## 9. 코더 구현 체크리스트 (Handoff Checklist for core-coder)

디자이너의 스펙을 받아 구현할 **core-coder**를 위한 필수 점검 항목입니다.

- [ ] **일괄 저장 UX 완전 제거**:
  - `MenuPermissionQuietHeader`에서 `MGButton` (변경사항 저장) 컴포넌트 제거.
  - `handleBatchSave`, `MENU_PERM_CONFIRM.BATCH_SAVE`, 미저장 대기 상태(`isDirty`) 로직 제거.
- [ ] **이중 Switch UI 바인딩**:
  - `MenuPermissionManagementUI` 행에 `canViewIos`, `canViewAndroid` 각각 바인딩된 2개의 `Switch` 렌더링.
  - 각 스위치에 플랫폼 라벨(`iOS`, `Android`) 및 상태 뱃지(`노출`, `숨김`) 표기.
- [ ] **즉시 Grant API 연동**:
  - 각 스위치 클릭 시 `grantMenuPermission({ roleId, menuId, canViewIos: next })` 또는 `{ canViewAndroid: next }` 부분 갱신 호출.
  - Optimistic UI 적용 및 실패 시 Rollback 로직 구현.
- [ ] **초기 역할 및 뱃지**:
  - 초기 진입 시 `selectedRole`을 `CLIENT`(내담자)로 우선 선택.
  - `커뮤니티` 행(`CLT_COMMUNITY`, `CST_COMMUNITY`)에 `심사 유의` 뱃지 노출.
- [ ] **하드락 잠금 정책 준수**:
  - `getMenuPermissionLock` 결과 `locked === true`인 메뉴는 두 스위치 모두 `disabled={true}` 처리하고 자물쇠 아이콘 + 사유 표기.
- [ ] **Admin LNB 신규 메뉴 추가 금지**:
  - LNB 트리에 새로운 항목을 추가하지 않고 기존 `/admin/menu-permissions` 유지.
- [ ] **하드코딩 방지**:
  - 클라이언트 소스에 `if (Platform.OS === 'ios')` 커뮤니티 숨김 하드코딩 금지. LNB 서버 필터 결과만 사용.
  - 임의 HEX 코드 금지, `--mg-v2-*` 토큰만 사용.
