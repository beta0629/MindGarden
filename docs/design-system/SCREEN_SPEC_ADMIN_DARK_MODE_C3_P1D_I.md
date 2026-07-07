# SCREEN SPEC: Admin Dark Mode C-3 Phase 0-A (P1-d~i)

## 1. 개요
- **Phase**: C-3 Phase 0-A (P1-d ~ P1-i 라우트군)
- **목표**: Admin Dark Mode C-3 전역 rollout의 일환으로, P1-d~i 6개 라우트군에 대한 모달, 필터 툴바, 테이블, 폼의 `[data-theme="dark"]` cascade 스펙을 정의한다.
- **대상 라우트**: `/admin/permissions`, `/admin/schedule`, `/admin/notifications`, `/admin/lifecycle/dormant-users`, `/admin/system-config`, ERP 잔여 페이지.

## 2. Token SSOT (Dark Cascade)
모든 다크 모드 스타일은 `[data-theme="dark"]` 하위에서 CSS 변수(`var(--mg-dark-*)` 및 관련 alias)만 사용하여 적용해야 한다. 컴포넌트 CSS에 hex 값을 직접 하드코딩하는 것은 엄격히 금지된다.

### 2.1 모달 (Modal & SidePeek)
- **Overlay**: `var(--ad-b0kla-overlay-bg)` (alias of `var(--mg-dark-modal-overlay)`)
- **Panel/Body Background**: `var(--mg-color-surface-main)` 또는 `var(--mg-dark-content-bg)`
- **Header/Footer Background**: `var(--mg-color-surface-raised)`
- **Border**: `var(--mg-color-border-subtle)`
- **Text**: `var(--mg-color-text-primary)`

### 2.2 필터 툴바 & 칩 (Filter Toolbar & Chips)
- **Toolbar Background**: `var(--mg-dark-toolbar-bg)`
- **Toolbar Border**: `var(--mg-dark-toolbar-border)`
- **Chip Default Background**: `var(--mg-dark-chip-bg)`
- **Chip Default Text**: `var(--mg-dark-chip-text)`
- **Chip Active Background**: `var(--mg-dark-chip-active-bg)`
- **Chip Active Text**: `var(--mg-dark-chip-active-text)`
- **Search Input Background**: `var(--filter-search-background)`

### 2.3 테이블 (B0KlA Table)
- **Header Background**: `var(--ad-b0kla-table-header-bg)`
- **Header Text**: `var(--ad-b0kla-table-header-text)`
- **Row Background**: `var(--ad-b0kla-table-row-bg)`
- **Row Hover**: `var(--ad-b0kla-table-row-hover)`
- **Row Selected**: `var(--ad-b0kla-table-row-selected)`
- **Border**: `var(--ad-b0kla-table-border)`

### 2.4 폼 컨트롤 (Forms)
- **Input Background**: `var(--mg-v2-form-bg)`
- **Input Border**: `var(--mg-v2-form-border)`
- **Input Text**: `var(--mg-v2-form-text)`
- **Focus Ring**: `var(--mg-v2-form-focus-ring)`
- **Label Text**: `var(--mg-v2-form-label)`
- **Error Text**: `var(--mg-v2-form-error)`

## 3. Must Not (금지 사항)
- **라이트 모드 회귀 금지**: `[data-theme="light"]` 상태이거나 속성이 없을 때 기존 라이트 모드 UI/UX가 전혀 변경되지 않아야 한다.
- **Hex 하드코딩 금지**: CSS 파일 내에 다크 모드 전용 hex 색상(예: `#1F2937`)을 직접 기입하지 않는다. 반드시 `unified-design-tokens.css` 또는 `dashboard-tokens-extension.css`에 정의된 변수를 사용한다.
- **UnifiedModal 우회 금지**: 커스텀 오버레이나 래퍼를 새로 만들지 않고, 반드시 `UnifiedModal` 공통 모듈의 다크 모드 cascade를 따른다.

## 4. 라우트별 Cascade 포인트 (P1-d ~ P1-i)

### P1-d: 권한 관리 (`/admin/permissions`)
- **주요 컴포넌트**: 권한 트리, 권한 설정 폼
- **Cascade 포인트**:
  - 트리 노드 hover/selected 상태: `var(--ad-b0kla-table-row-hover)`, `var(--ad-b0kla-table-row-selected)`
  - 폼 컨트롤 (Checkbox/Radio/Input): `var(--mg-v2-form-*)` 토큰 적용

### P1-e: 일정 관리 (`/admin/schedule`, `/admin/schedules`)
- **주요 컴포넌트**: 캘린더 뷰, 필터 툴바
- **Cascade 포인트**:
  - 필터 툴바: `var(--mg-dark-toolbar-bg)`, `var(--mg-dark-chip-*)`
  - 캘린더 셀/배경: `var(--mg-color-surface-main)`, `var(--mg-color-border-subtle)`

### P1-f: 알림 관리 (`/admin/notifications`)
- **주요 컴포넌트**: 알림 리스트, 발송 모달
- **Cascade 포인트**:
  - 리스트 아이템: `var(--ad-b0kla-table-row-bg)`, hover 시 `var(--ad-b0kla-table-row-hover)`
  - 발송 모달 (`UnifiedModal`): `var(--mg-color-surface-main)`, 폼 입력 필드 `var(--mg-v2-form-bg)`

### P1-g: 휴면 회원 관리 (`/admin/lifecycle/dormant-users`)
- **주요 컴포넌트**: AdminCommonLayout, 테이블
- **Cascade 포인트**:
  - AdminCommonLayout 셸은 G-14 P3에서 적용 완료됨.
  - 내부 데이터 테이블: `var(--ad-b0kla-table-*)` 토큰 적용

### P1-h: 시스템 설정 (`/admin/system-config`, `/admin/settings`)
- **주요 컴포넌트**: 설정 폼 집중 영역
- **Cascade 포인트**:
  - 모든 Input, Select, Textarea: `var(--mg-v2-form-*)` 토큰 일괄 적용
  - 섹션 블록 배경: `var(--mg-color-surface-main)`

### P1-i: ERP 잔여 (`/erp/dashboard`, `/erp/budget`, `/erp/refund-management` 등)
- **주요 컴포넌트**: ERP 필터 툴바, 재무 테이블, 통계 카드
- **Cascade 포인트**:
  - 카드 배경: `var(--ad-b0kla-card-bg)`
  - 필터 툴바: `var(--mg-dark-toolbar-bg)`
  - 테이블: `var(--ad-b0kla-table-*)`

## 5. 1280px / 768px 와이어프레임 및 레이아웃 배치

### 1280px (Desktop)
```text
+-----------------------------------------------------------------------------+
| GNB (Dark) [Toggle: Dark Mode ON]                                           |
+-------------------------+---------------------------------------------------+
| LNB (Sidebar)           | Title: System Config (P1-h)                       |
| bg: var(--mg-dark-lnb-bg) | bg: var(--mg-dark-content-bg)                   |
|                         +---------------------------------------------------+
|                         | [Section Block bg: var(--mg-color-surface-main)]  |
|                         | Label: var(--mg-v2-form-label)                    |
|                         | [Input bg: var(--mg-v2-form-bg) border: subtle]   |
|                         |                                                   |
|                         | Label: var(--mg-v2-form-label)                    |
|                         | [Select bg: var(--mg-v2-form-bg)]                 |
|                         |                                                   |
|                         | [Save Button]                                     |
+-------------------------+---------------------------------------------------+
```

### 768px (Tablet)
```text
+-------------------------------------------------------+
| GNB (Dark) [Hamburger] [Toggle: Dark Mode ON]         |
+-------------------------------------------------------+
| Title: Schedule (P1-e)                                |
| bg: var(--mg-dark-content-bg)                         |
+-------------------------------------------------------+
| [Filter Toolbar bg: var(--mg-dark-toolbar-bg)]        |
| [Chip: All] [Chip: Pending]                           |
+-------------------------------------------------------+
| [Calendar View / List View]                           |
| bg: var(--mg-color-surface-main)                      |
| border: var(--mg-color-border-subtle)                 |
|                                                       |
| * UnifiedModal Overlay opens: var(--ad-b0kla-overlay) |
| * Modal Panel bg: var(--mg-color-surface-main)        |
+-------------------------------------------------------+
```

## 6. Coder 분할 권장 (PR Splitting Strategy)
안정적인 리뷰와 롤백 방지를 위해 core-coder는 다음 단위로 PR을 분할하여 작업할 것을 권장한다 (1 PR = 1 가설 원칙 준수).

1. **PR 1 (P1-d ~ P1-f)**:
   - `/admin/permissions` (권한)
   - `/admin/schedules` (일정)
   - `/admin/notifications` (알림)
2. **PR 2 (P1-g ~ P1-h)**:
   - `/admin/lifecycle/dormant-users` (휴면 회원)
   - `/admin/system-config`, `/admin/settings` (시스템 설정)
3. **PR 3 (P1-i)**:
   - `/erp/dashboard`, `/erp/budget`, `/erp/refund-management` 등 ERP 잔여 화면
