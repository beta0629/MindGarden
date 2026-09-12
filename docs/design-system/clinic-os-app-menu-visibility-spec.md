# Clinic-OS 앱 메뉴 노출 관리 (App Menu Visibility) UI/UX 스펙

**문서 상태**: ACTIVE — core-designer Handoff Spec (2026-09-12 개정: 즉시 토글)  
**대상 라우트**: `/admin/menu-permissions` (기존 `MenuPermissionManagement` 개선·재사용, 신규 URL 지양)  
**진입점**: 통합 사용자 관리 → 「앱 메뉴 노출」 (Admin LNB 신규 항목 금지)  
**역할 구분**: UI/UX·디자인 스펙 전용 문서 (코드 작성·구현 금지 — 구현은 core-coder)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`, live `/admin/dashboard` (Admin Dashboard V2)  
**패턴 트윈**: `docs/design-system/USER_MANAGEMENT_CLINIC_OS_SHELL_SPEC.md` (QuietHeader + TabChipRow), `docs/design-system/MAPPING_MANAGEMENT_CLINIC_OS_HANDOFF.md` (Stage Row Card), `docs/design-system/clinic-os-package-visibility.md` (노출 토글), `SettingSwitchRow` (`Switch` role="switch")  
**오케스트레이션**: `docs/project-management/APPLE_FOLLOWUP_ORCHESTRATION_20260912.md`

---

## 0. 사용자 확정 요구 및 핵심 원칙

1. **LNB 수정 과제 아님**: Admin LNB 네비게이션에 신규 메뉴나 링크를 새로 추가/수정하는 작업이 아니다.
2. **모바일 앱/웹 메뉴의 역할별 보이기/숨기기(Visibility)**: 특히 Apple App Store UGC(가이드라인 1.2) 심사 제출 시, 심사 통과 전까지 **CLIENT(내담자) / CONSULTANT(상담사) 모바일 앱 더보기 메뉴 중 «커뮤니티»를 임시 OFF** 하거나, 테넌트 정책에 맞춰 각 역할별 앱 메뉴 노출을 제어하는 관리자 전용 화면이다.
3. **Clinic-OS 비주얼 표준 완전 준수**: 구 B0KlA 메뉴 권한 관리 AS-IS(좌측 300px 고정 패널 + 카드 그리드 + VIEW/CREATE/UPDATE/DELETE 4단 체크박스 + B0KlA forest green)는 **완전 폐기**.
4. **정보 구조 정제**:
   - 노출 항목: **한국어 메뉴명**, 직관적인 **노출 스위치(Switch)**, **잠금 상태 + 잠금 사유 툴팁/헬퍼**, **기본/센터맞춤 뱃지**, **노출 위치(앱/웹/전체) 배지**.
   - 비노출(폐기): 개발자용 `menuCode`, 기술적 `menuPath`(`/api/...` 또는 라우트 경로), CRUD 4체크박스.
5. **하드게이트 UI 금지**: `REVIEW_MODE` 같은 코드 레벨 하드코딩 플래그 UI를 두지 않고, 센터 관리자가 직관적으로 토글할 수 있는 표준 RBAC 메뉴 노출 제어 화면으로 구성한다.

---

## 1. 개요 및 배경

### 1.1 배경 및 목적
- **문제점 (AS-IS)**:
  - 기존 `/admin/menu-permissions`는 2025년 레거시 B0KlA 스타일로 작성되어 좌측에 고정 300px 사이드바가 있고, 우측에는 기술적인 `menuCode`, `menuPath`, CRUD 4개 체크박스(조회/생성/수정/삭제)가 나열된 복잡한 개발자 지향 화면이었다.
  - 모바일 앱(iOS/Android Expo)에서 App Store 심사(UGC 1.2 등) 제출 시, 특정 메뉴(예: «커뮤니티»)를 일시적으로 숨겨야 하거나 센터 운영 정책에 따라 메뉴를 선택적으로 켜고 꺼야 할 때 직관적으로 조작할 수 있는 관리자 UI가 없었다.
- **해결 방안 (TO-BE)**:
  - 기존 라우트 `/admin/menu-permissions`를 유지하면서, Clinic-OS 표준(AdminCommonLayout → ContentArea → QuietHeader → TabChipRow 역할 칩 → 배지 레일 → 스테이지 행 카드)으로 현대화한다.
  - 복잡한 CRUD 권한 매트릭스 대신 **"누가(역할) 어떤 메뉴를 볼 수 있는가(보이기/숨기기 토글)"** 에 집중하여 모바일 앱 및 웹 사용자 경험을 센터 관리자가 쉽게 통제하도록 개선한다.

---

## 2. 레이아웃 구조 (위 → 아래 계층)

```
AdminCommonLayout (어드민 표준 레이아웃 셸)
└─ ContentArea (.mg-v2-menu-permission.menu-permission--clinic-os)
   ├─ QuietHeader (제목+부제만 — 우측 일괄 저장 CTA 없음)
   │  ├─ Left: 타이틀(h1) "앱 메뉴 노출 관리" + 서브타이틀(caption)
   │  └─ Right: (비움) — 행 Switch가 즉시 적용되므로 헤더 Primary CTA 금지
   ├─ TabChipRow (역할 선택 칩스)
   │  └─ [내담자 (CLIENT)] [상담사 (CONSULTANT)] [사무원 (STAFF)] [관리자 (ADMIN)]
   ├─ Badge Rail / Summary Strip (선택 역할 상태 요약)
   │  └─ 총 N개 메뉴 중 M개 노출 중 (미저장/변경 대기 뱃지 없음 — 즉시 반영)
   └─ Main Stage (단일 카드 컨테이너: border 1px neutral-300, radius-lg, bg-neutral-50)
      ├─ Stage Filter / Group Bar
      │  └─ [전체] [모바일 앱 메뉴] [웹 대시보드 메뉴]
      └─ Stage Rows (행마다 Switch → 토글 즉시 grant/revoke API)
         ├─ … 잠금 행 / 토글 가능 행 …
         └─ 커뮤니티 (App Store UGC · 심사 시 OFF) ★
```

### 2.1 선정 이유
- **단일 메인 스테이지 원칙**: Clinic-OS SSOT에 따라 좌우 분할 패널을 제거하고, 상단 `TabChipRow`로 역할을 전환하며 하단 단일 카드 스테이지에서 목록을 확인한다.
- **균일한 행 높이 및 스캔 가능성**: 메뉴명·뱃지·Switch가 한 행에 온다.
- **즉시 적용**: 「변경사항 저장」일괄 CTA는 **폐기**. 행 Switch 토글 시 `POST …/grant`(canView true/false) 또는 동등 API를 **즉시** 호출한다. 실패 시 토글 롤백 + 토스트.
- **App Store 심사**: `CLIENT`/`CONSULTANT` → «커뮤니티» Switch OFF 한 번으로 원격 숨김.

---

## 3. 세부 UI/UX 스펙 (CSS 변수 / 토큰 명시)

### 3.1 Quiet Header
- **컴포넌트**: `MenuPermissionQuietHeader` (Clinic-OS QuietHeader 패턴)
- **제목**: `앱 메뉴 노출 관리`
- **부제**: `행의 스위치를 바꾸는 즉시 해당 역할의 앱·웹 메뉴 노출이 적용됩니다. 심사 제출 전 커뮤니티를 끌 수 있습니다.`
- **우측 액션**: **없음** (일괄「변경사항 저장」CTA **완전 제거**)
- **금지**: 헤더 Primary/Save 버튼, B0KlA forest green, 미저장 뱃지, `REVIEW_MODE` UI

### 3.2 역할 선택 칩 (TabChipRow)
- **컴포넌트**: `TabChipRow` (공통 컴포넌트, `size="sm"`)
- **역할 목록**:
  1. `CLIENT` (내담자) — **기본 선택 탭** (App Store 심사 대응의 핵심)
  2. `CONSULTANT` (상담사)
  3. `STAFF` (사무원)
  4. `ADMIN` (관리자 — 시스템 필수 메뉴로 안내)
- **비주얼 사양**:
  - 활성 탭: `MGButton` variant `primary` (fill: `var(--mg-v2-color-primary-solid)`, color: `var(--mg-v2-color-neutral-50)`)
  - 비활성 탭: `MGButton` variant `outline` (border: `1px solid var(--mg-v2-color-neutral-300)`, color: `var(--mg-v2-color-text-secondary)`)
  - 높이: `var(--button-height-sm, 32px)` 동일 높이 락
  - 단차 방지: `align-items: stretch`
  - 간격: `var(--mg-v2-space-2, 0.5rem)`

### 3.3 요약 및 안내 레일 (Badge Rail / Summary Strip)
- **위치**: `TabChipRow` 바로 아래, Main Stage 상단
- **컨테이너 스타일**:
  - Background: `var(--mg-v2-color-neutral-100, #F5F3EF)`
  - Border: `1px solid var(--mg-v2-color-neutral-300, #D4CFC8)`
  - Border-radius: `var(--mg-v2-radius-md, 0.375rem)`
  - Padding: `var(--mg-v2-space-3, 0.75rem) var(--mg-v2-space-4, 1rem)`
  - Display: Flex, justify-content: space-between, align-items: center
- **좌측 정보**:
  - 현재 선택: `<span class="role-pill">내담자(CLIENT) 앱</span>`
  - 상태 요약: `총 6개 메뉴 중 5개 노출 중` (font-size: `var(--mg-v2-font-size-body-md)`, color: `var(--mg-v2-color-text-secondary)`)
  - 미저장/변경 대기 뱃지: **사용하지 않음** (즉시 적용이므로)
- **우측 액션**: 기본값 복원 버튼은 본 배치에서 **비표시**(필요 시 후속). 즉시 토글이 SSOT.

### 3.4 Main Stage 컨테이너 (ContentCard)
- **컨테이너 스타일**:
  - Background: `var(--mg-v2-color-neutral-50, #FAF9F7)`
  - Border: `1px solid var(--mg-v2-color-neutral-300, #D4CFC8)`
  - Border-radius: `var(--mg-v2-radius-lg, 0.5rem)`
  - Min-height: `32rem`
  - Overflow: hidden
  - Box-shadow: none (평면 Clinic-OS 기하)

### 3.5 Stage Rows (메뉴 노출 제어 행 목록)
각 메뉴 행은 `SettingSwitchRow` 패턴을 확장한 Clinic-OS 표준 행 컴포넌트(`AppMenuStageRow`)로 렌더링된다.

- **행 컨테이너 사양 (`.mg-v2-app-menu-row`)**:
  - Display: Flex, align-items: center, justify-content: space-between
  - Padding: `var(--mg-v2-space-4, 1rem) var(--mg-v2-space-5, 1.25rem)`
  - Border-bottom: `1px solid var(--mg-v2-color-neutral-200, #EBE6DF)`
  - Background: `var(--mg-v2-color-surface-card, #FFFFFF)`
  - Transition: `background var(--mg-v2-transition-fast)`
  - Hover 시: Background `var(--mg-v2-color-neutral-100, #F5F3EF)`
  - 마지막 행: `border-bottom: none`

- **행 내부 좌측: 메뉴 정보 구역 (`.mg-v2-app-menu-row__info`)**:
  - Flex: `1 1 auto`, min-width: `0`, display: flex, align-items: center, gap: `var(--mg-v2-space-3, 0.75rem)`
  - **아이콘**: 20px quiet Lucide 아이콘 (예: `Users`, `CreditCard`, `ShoppingBag`, `Bell`), color: `var(--mg-v2-color-secondary-main, #475569)`
  - **텍스트 블록**:
    - **메뉴명 (한국어)**: font-size `var(--mg-v2-font-size-body-md, 0.875rem)`, weight `var(--mg-v2-font-weight-semibold, 600)`, color `var(--mg-v2-color-text-primary, #0F172A)`
    - **설명/경로 힌트**: font-size `var(--mg-v2-font-size-caption, 0.75rem)`, color `var(--mg-v2-color-text-tertiary, #64748B)`. 예: `모바일 앱 > 더보기 > 상담 · 결제 섹션`
  - **뱃지 그룹 (`.mg-v2-app-menu-row__badges`)**:
    - **노출 위치 뱃지**: `앱(iOS/AOS)` 또는 `웹(Web)`. (bg: `var(--mg-v2-color-neutral-200)`, text: `var(--mg-v2-color-neutral-700)`, radius: `var(--mg-v2-radius-sm)`, font-size: `11px`, padding: `2px 6px`)
    - **설정 속성 뱃지**:
      - `기본 메뉴`: 시스템 표준 메뉴 (bg: `var(--mg-v2-color-neutral-200)`, text: `var(--mg-v2-color-neutral-700)`)
      - `센터 맞춤`: 테넌트 플래그/설정에 의해 켜고 끄는 메뉴 (bg: `var(--mg-v2-color-primary-subtle, #DCE8E5)`, text: `var(--mg-v2-color-primary-dark, #0A4F4B)`)
      - `심사 유의`: App Store 심사 등 규제 대상 (bg: `var(--mg-v2-color-semantic-warning-light, #FFFBEB)`, text: `var(--mg-v2-color-semantic-warning-dark, #B45309)`)

- **행 내부 우측: 상태 표시 및 스위치 컨트롤 (`.mg-v2-app-menu-row__control`)**:
  - Display: Flex, align-items: center, gap: `var(--mg-v2-space-3, 0.75rem)`
  - **잠금 안내 (잠금 상태일 때)**:
    - 아이콘: `Lock` (14px), color: `var(--mg-v2-color-neutral-500, #94A3B8)`
    - 안내 문구: `필수 기본 메뉴 (변경 불가)` 또는 `상위 관리자 전용` (font-size: `var(--mg-v2-font-size-caption)`, color: `var(--mg-v2-color-neutral-500)`)
  - **노출 상태 텍스트 배지**:
    - 노출 중 (ON): `노출` (color: `var(--mg-v2-color-semantic-success, #059669)`, bg: `var(--mg-v2-color-semantic-success-light, #ECFDF5)`, radius: `var(--mg-v2-radius-sm)`, padding: `2px 8px`, font-size: `12px`, weight: `500`)
    - 숨김 (OFF): `숨김` (color: `var(--mg-v2-color-text-secondary, #475569)`, bg: `var(--mg-v2-color-neutral-200, #EBE6DF)`, radius: `var(--mg-v2-radius-sm)`, padding: `2px 8px`, font-size: `12px`, weight: `500`)
  - **스위치 컴포넌트 (`Switch`)**:
    - 공통 Atom `Switch` (`role="switch"`, `checked`, `onCheckedChange`, `disabled`, `isPending`)
    - ON 토큰: bg `var(--mg-v2-color-primary-main, #0E5F5A)`
    - OFF 토큰: bg `var(--mg-v2-color-neutral-300, #D4CFC8)`
    - Knob: bg `var(--mg-v2-color-surface-card, #FFFFFF)`
    - 폭 44px, 높이 24px, radius 999px
    - 포커스 링: `var(--mg-v2-color-border-focus, #0D9488)`

---

## 4. 아토믹 계층 및 재사용 컴포넌트 매핑

신규 컴포넌트를 난립하지 않고, 기존에 검증된 공통 모듈 및 토큰 시스템을 100% 재사용한다.

| 아토믹 계층 | 컴포넌트 명 | 역할 및 재사용 여부 | 소스 경로 |
|------------|------------|-------------------|-----------|
| **Template** | `AdminCommonLayout` | 어드민 기본 GNB/LNB 셸 프레임워크 | `frontend/src/components/layout/AdminCommonLayout.jsx` |
| **Organism** | `ContentArea` | Clinic-OS 본문 래퍼 (`.menu-permissions--clinic-os`) | `frontend/src/components/dashboard-v2/content/ContentArea.js` |
| **Organism** | `ContentHeader` | QuietHeader (제목, 부제, 우측 primary CTA) | `frontend/src/components/dashboard-v2/content/ContentHeader.js` |
| **Molecule** | `TabChipRow` | 역할 전환 칩 행 (`CLIENT`, `CONSULTANT` 등) | `frontend/src/components/common/TabChipRow.jsx` |
| **Organism** | `ContentCard` | Main Stage 단일 카드 컨테이너 | `frontend/src/components/dashboard-v2/content/ContentCard.js` |
| **Molecule** | `SettingSwitchRow` | 개별 메뉴 노출 설정 행의 기반 구조 | `frontend/src/components/common/molecules/SettingSwitchRow.js` |
| **Atom** | `Switch` | iOS/안드로이드 스타일의 불리언 토글 스위치 | `frontend/src/components/common/Switch.js` |
| **Atom** | `MGButton` | 헤더 저장 CTA (solid primary dusty teal) 및 탭 | `frontend/src/components/common/MGButton.js` |
| **Atom** | `Badge` / `StatusBadge` | `노출`, `숨김`, `센터 맞춤`, `심사 유의` 뱃지 | `frontend/src/components/common/Badge.js` |
| **Atom** | `SafeText` | React #130 방지 안전 텍스트 렌더링 | `frontend/src/components/common/SafeText.js` |
| **Molecule** | `EmptyState` | 검색 결과 없거나 데이터 로드 실패 시 상태 | `frontend/src/components/common/EmptyState.js` |
| **Atom** | `UnifiedLoading` | 데이터 조회 중 인라인/전체 로딩 | `frontend/src/components/common/UnifiedLoading.js` |

---

## 5. 상태 및 예외 처리 (Interaction & States)

### 5.1 로딩 상태 (Loading)
- **초기 로딩**: `AdminCommonLayout`의 `loading` 속성을 활용하거나 Stage 내부 `UnifiedLoading` 타입 `inline` 노출.
- **저장 중 (`isPending`)**:
  - 우측 헤더 `변경사항 저장` 버튼: `loading={true}`, `loadingText="저장 중..."`, 버튼 비활성화.
  - 모든 행의 `Switch`: `disabled={true}`, `isPending={true}` (`aria-busy="true"`).

### 5.2 토글 변경 대기 상태 (Dirty / Unsaved Changes)
- 스위치를 클릭하면 즉시 API를 호출하여 개별 저장하지 않고, **로컬 상태에 반영 후 상단 요약 레일에 `수정됨 (저장 필요)` 배지 표시**.
- 헤더의 `변경사항 저장` 버튼 활성화.
- 사용자가 저장을 누르지 않고 다른 역할 탭으로 이동하려 할 경우:
  - `useConfirm` 다이얼로그 호출: *"저장되지 않은 변경사항이 있습니다. 저장하지 않고 이동하시겠습니까?"*
  - 취소 시 현재 역할 유지, 확인 시 변경사항 폐기 후 탭 전환.

### 5.3 잠금(Lock) 및 비활성화 상태 (Disabled & Locked)
- **필수 시스템 메뉴 (예: 내담자의 '회기 · 결제', '알림 센터')**:
  - 스위치가 비활성화(`disabled={true}`)되어 끄거나 켤 수 없음.
  - 스위치 좌측에 회색 `Lock` 아이콘과 함께 `필수 기본 메뉴` 텍스트 고정.
  - 마우스 호버 시 툴팁 제공: *"서비스 이용에 필수적인 메뉴로 숨길 수 없습니다."*

### 5.4 에러 및 알림 (Toast & Error Banner)
- 데이터 로드 실패 시: 상단 에러 배너 노출 + `다시 시도` 액션 버튼 제공.
- 저장 성공 시: `notificationManager.success('메뉴 노출 설정이 저장되었습니다.')` 토스트 표시.
- 저장 실패 시: `notificationManager.error('저장에 실패했습니다. 다시 시도해 주세요.')` 토스트 표시.

---

## 6. 핵심 시나리오: CLIENT(내담자) 선택 시 «커뮤니티» 행 식별 및 토글 워크플로

이 시나리오는 **Apple App Store UGC 심사 제출 담당자 및 센터 관리자**의 실제 행동 경로를 완벽히 지원한다.

```
[1. 화면 진입]
  관리자가 /admin/menu-permissions 로 이동
  → 기본적으로 '내담자 (CLIENT)' 탭이 활성화되어 표시됨

[2. 커뮤니티 행 식별]
  스테이지의 3번째 행에 «커뮤니티» 가 명확하게 표시됨:
  ┌────────────────────────────────────────────────────────────────────────┐
  │ [UsersIcon]  커뮤니티                                                   │
  │              모바일 앱 더보기 > 상담 · 결제 섹션                          │
  │              [앱(iOS/AOS)] [센터 맞춤] [심사 유의]                     │
  │                                           [노출 중]  ( [====] ) (ON)   │
  └────────────────────────────────────────────────────────────────────────┘

[3. 심사 전 커뮤니티 OFF 토글]
  관리자가 스위치를 클릭
  → 스위치가 왼쪽으로 슬라이드되며 회색(OFF)으로 전환
  → 상태 텍스트가 [숨김] 으로 변경
  → 상단 요약 레일에 [수정됨 (저장 필요)] 뱃지 출현
  → 상단 우측 [변경사항 저장] 버튼 강조

[4. 저장 완료]
  관리자가 우측 상단 [변경사항 저장] 버튼 클릭
  → 확인 팝업 ("내담자 앱에서 '커뮤니티' 메뉴가 비노출됩니다. 저장하시겠습니까?")
  → 확인 클릭 시 저장 API 호출
  → 성공 토스트: "메뉴 노출 설정이 저장되었습니다."
  → 결과: Expo 모바일 앱(iOS/Android)의 ClientMore(더보기) 화면에서 '커뮤니티' 메뉴 아이템이 즉시 숨겨짐!
```

---

## 7. 화면 와이어프레임 (Clinic-OS ASCII Mockup)

```text
+------------------------------------------------------------------------------------------------------------------------+
| AdminCommonLayout (Sidebar 260px / GNB)                                                                                |
|                                                                                                                        |
| ContentHeader                                                                                                          |
|   앱 메뉴 노출 관리                                                                      [ 변경사항 저장 (Teal) ]      |
|   모바일 앱과 웹에서 역할별로 노출할 메뉴를 켜고 끕니다. 심사 제출 시 특정 메뉴를 안전하게 비활성화할 수 있습니다.     |
|                                                                                                                        |
| TabChipRow                                                                                                             |
|   ( [내담자 (CLIENT)] )  [ 상담사 (CONSULTANT) ]  [ 사무원 (STAFF) ]  [ 관리자 (ADMIN) ]                               |
|                                                                                                                        |
| Summary Strip (Badge Rail)                                                                                             |
|   내담자(CLIENT) 앱 메뉴   •   총 6개 중 5개 노출 중   •   [ 수정됨 (저장 필요) ]                [ 기본값으로 복원 ]    |
|                                                                                                                        |
| Main Stage (ContentCard - Single Plain Surface)                                                                        |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [ 아이콘 ]  메뉴 정보                                                 뱃지               상태       스위치         | |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [CreditCard] 회기 · 결제                                         [앱] [기본 메뉴]   (🔒필수) [노출]  [ ●=== ] (LOCKED)  |
| |              모바일 앱 > 더보기 > 상담 · 결제 섹션                                                                 | |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [Shopping]   온라인 쇼핑                                         [앱] [센터 맞춤]            [노출]  [ ===● ] (ON)      |
| |              모바일 앱 > 더보기 > 상담 패키지 · 심리 검사 구매                                                     | |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [Users]      커뮤니티                                            [앱] [심사 유의]            [숨김]  [ ●=== ] (OFF) ★   |
| |              모바일 앱 > 더보기 > 게시글 · 댓글 (Apple UGC 심사 대응)                                              | |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [Bell]       알림 센터                                           [앱] [기본 메뉴]   (🔒필수) [노출]  [ ●=== ] (LOCKED)  |
| |              모바일 앱 > 더보기 > 알림 · 메시지 섹션                                                               | |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [Message]    메시지                                              [앱] [기본 메뉴]   (🔒필수) [노출]  [ ●=== ] (LOCKED)  |
| |              모바일 앱 > 더보기 > 상담사와의 1:1 대화 목록                                                         | |
| +--------------------------------------------------------------------------------------------------------------------+ |
| | [Settings]   계정 설정                                           [앱] [기본 메뉴]   (🔒필수) [노출]  [ ●=== ] (LOCKED)  |
| |              모바일 앱 > 더보기 > 내 정보 및 환경설정                                                              | |
| +--------------------------------------------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------------------------------------------+
```

---

## 8. 사용 토큰 목록 (Unified Design Tokens SSOT)

하드코딩된 색상값이나 치수(#hex, px 리터럴)는 일체 배제하며, 다음 CSS 변수만을 사용한다.

```css
/* Color - Brand & Primary */
var(--mg-v2-color-primary-main)       /* #0E5F5A - Dusty Clinic Teal */
var(--mg-v2-color-primary-solid)      /* #0E5F5A - Solid CTA Fill */
var(--mg-v2-color-primary-dark)       /* #0A4F4B - Hover & Active */
var(--mg-v2-color-primary-subtle)     /* #DCE8E5 - Soft Tint Wash */

/* Color - Neutrals */
var(--mg-v2-color-neutral-50)         /* #FAF9F7 - Page Background / Cards */
var(--mg-v2-color-neutral-100)        /* #F5F3EF - Surface Secondary */
var(--mg-v2-color-neutral-200)        /* #EBE6DF - Row Borders / Dividers */
var(--mg-v2-color-neutral-300)        /* #D4CFC8 - Outlines & Hairlines */
var(--mg-v2-color-neutral-700)        /* #475569 - Secondary Elements */
var(--mg-v2-color-neutral-900)        /* #0F172A - Dominant Slate */

/* Color - Text */
var(--mg-v2-color-text-primary)       /* #0F172A - H1, H2, Row Label */
var(--mg-v2-color-text-secondary)     /* #475569 - Subtitle, Descriptions */
var(--mg-v2-color-text-tertiary)      /* #64748B - Meta, Helper hints */

/* Color - Semantics */
var(--mg-v2-color-semantic-success)       /* #059669 - '노출' Badge Text */
var(--mg-v2-color-semantic-success-light) /* #ECFDF5 - '노출' Badge Fill */
var(--mg-v2-color-semantic-warning)       /* #D97706 - '심사 유의' Accent */
var(--mg-v2-color-semantic-warning-light) /* #FFFBEB - '심사 유의' / Unsaved Fill */
var(--mg-v2-color-semantic-error)         /* #A84848 - Danger / Error */

/* Typography */
var(--mg-v2-font-family-base)         /* Pretendard, Noto Sans KR */
var(--mg-v2-font-size-h1)             /* 1.75rem (28px) - Page Title */
var(--mg-v2-font-size-body-md)        /* 0.875rem (14px) - Row Label, Tab Label */
var(--mg-v2-font-size-caption)        /* 0.75rem (12px) - Description, Badges */
var(--mg-v2-font-weight-regular)      /* 400 */
var(--mg-v2-font-weight-medium)       /* 500 */
var(--mg-v2-font-weight-semibold)     /* 600 */
var(--mg-v2-font-weight-bold)         /* 700 */

/* Spacing & Sizing */
var(--mg-v2-space-2)                  /* 0.5rem (8px) */
var(--mg-v2-space-3)                  /* 0.75rem (12px) */
var(--mg-v2-space-4)                  /* 1rem (16px) */
var(--mg-v2-space-5)                  /* 1.25rem (20px) */
var(--mg-v2-space-6)                  /* 1.5rem (24px) */
var(--button-height-sm)               /* 32px - Tab Chips */
var(--button-height-default)          /* 40px - Header Save CTA */
var(--mg-v2-touch-target-min)         /* 44px - Mobile Touch Target */

/* Radius */
var(--mg-v2-radius-sm)                /* 0.25rem (4px) - Badges */
var(--mg-v2-radius-md)                /* 0.375rem (6px) - Buttons, Rails */
var(--mg-v2-radius-lg)                /* 0.5rem (8px) - Main Stage Card */
var(--mg-v2-radius-pill)              /* 9999px - Switch, Pill Chips */
```

---

## 9. 참조 파일 및 구현 가이드 (참조 경로)

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`: 어드민 비주얼 SSOT (QuietHeader, dusty teal primary, 4-step type).
- `docs/design-system/USER_MANAGEMENT_CLINIC_OS_SHELL_SPEC.md`: TabChipRow를 이용한 역할 전환 셸 패턴.
- `docs/design-system/MAPPING_MANAGEMENT_CLINIC_OS_HANDOFF.md`: Main Stage 단일 카드 컨테이너 구조.
- `docs/design-system/clinic-os-package-visibility.md`: 노출 토글(`publicVisible`) 개념 및 UI.
- `frontend/src/components/common/molecules/SettingSwitchRow.js`: 스위치 행 분자 컴포넌트.
- `frontend/src/components/common/Switch.js`: 토글 스위치 원자 컴포넌트.
- `frontend/src/components/common/TabChipRow.jsx`: 단차 없는 동일 높이 탭 칩 컴포넌트.
- `frontend/src/components/admin/MenuPermissionManagement.js`: 기존 컨테이너 (개선 대상).
- `frontend/src/components/ui/MenuPermissionManagementUI.js`: 기존 UI (B0KlA 잔여 제거 대상).
- `expo-app/app/(client)/(more)/index.tsx`: 내담자 더보기 메뉴 연동 지점 (`커뮤니티` 조건부 노출 대상).
- `expo-app/app/(consultant)/(more)/index.tsx`: 상담사 더보기 메뉴 연동 지점.

---

## 10. 코더 구현 체크리스트 (core-coder handoff)

- [ ] QuietHeader: 일괄「변경사항 저장」CTA **제거**. 제목·부제만.
- [ ] 행 Switch `onCheckedChange` → **즉시** `grantMenuPermission({ roleId, menuId, canView })`.  
      **숨김도 grant(canView=false)** — `revoke`는 행 비활성 후 min-role 기본노출로 되돌아갈 수 있어 금지.
- [ ] 표시 상태: `visible = Boolean(menu.canView)` 만 (`hasPermission` OR 금지).
- [ ] 실패 시 낙관적 UI 롤백 + 토스트. 토글 중 중복 클릭 방지(행별 pending).
- [ ] 커뮤니티 기본 OFF: Flyway로 CLIENT/`CLT_COMMUNITY`, CONSULTANT/`CST_COMMUNITY` `can_view=0` 멱등 시드.
- [ ] Admin LNB에 신규 항목 추가 금지. 진입은 통합 사용자 관리 → 앱 메뉴 노출.
- [ ] `APP_STORE_REVIEW_MODE` 금지. Clinic-OS 토큰만. HEX 하드코딩 금지.
- [ ] EULA 동의 게이트·iPad letterbox는 동 오케스트레이션 §2 갭 메움과 함께 develop PR.

---

## 11. 2026-09-12 개정 요약 (디자이너)

| 항목 | AS-IS (#980) | TO-BE |
|------|--------------|-------|
| 저장 | QuietHeader「변경사항 저장」일괄 | **제거** · 행 Switch 즉시 grant |
| 부제 | 켜고 끕니다… | 스위치 즉시 적용 안내 |
| 미저장 뱃지 | 있음(스펙) | **없음** |
| 커뮤니티 기본 | 시드 메뉴만(기본 노출) | RoleMenuPermission `canView=false` 시드 |
