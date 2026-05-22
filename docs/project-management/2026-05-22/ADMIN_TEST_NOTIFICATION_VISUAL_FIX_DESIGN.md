# ADMIN_TEST_NOTIFICATION_VISUAL_FIX_DESIGN

## §0 결정 요약 (TL;DR)
- 어드민 테스트 발송 페이지의 시각적 깨짐 현상은 정의되지 않은 `--admin-*` 및 일부 `--mg-color-*` 변수 사용이 원인입니다.
- SSOT(`frontend/src/styles/unified-design-tokens.css`)에 이미 정의된 `--mg-*` 토큰으로 1:1 매핑하여 레이아웃과 카드 UI를 복구합니다.
- 마인드가든 어드민 대시보드 샘플(다크 사이드바 + 밝은 메인, 섹션 블록)의 톤앤매너를 유지하도록 시안을 구성했습니다.

## §1 토큰 매핑 표

| 미정의 변수 (현재) | 정의된 대체 변수 (SSOT) | 사용 위치 | 비고 |
|---|---|---|---|
| `--admin-spacing-xs` | `--mg-spacing-xs` | padding, gap | L1154 |
| `--admin-spacing-sm` | `--mg-spacing-sm` | padding, gap | L1155 |
| `--admin-spacing-md` | `--mg-spacing-md` | padding, gap | L1156 |
| `--admin-spacing-lg` | `--mg-spacing-lg` | padding, gap, margin | L1157 |
| `--admin-radius-md` | `--mg-radius-md` | border-radius | L1163 |
| `--admin-radius-lg` | `--mg-radius-lg` | border-radius | L1164 |
| `--admin-shadow-sm` | `--mg-shadow-sm` | box-shadow | L1169 |
| `--admin-shadow-md` | `--mg-shadow-md` | box-shadow | L1170 |
| `--mg-color-surface-light` | `--mg-color-surface-main` | 카드/섹션 배경 | L1407 (`#F5F3EF`) |
| `--color-bg-surface` | `--color-bg-primary` | 입력창/내부 배경 | L449 (`var(--mg-white)`) |
| `--mg-color-error-main` | `--mg-color-error` | 에러 텍스트, 보더 | L1128 (`#E57373`) |
| `--mg-color-warning-main` | `--mg-color-warning-500` | 경고 텍스트, 보더 | L1557 (`#f59e0b`) |
| `--mg-color-success-main` | `--mg-color-success` | 성공 텍스트, 보더 | L1130 (`#059669`) |
| `--mg-color-border-main` | `--mg-color-border-main` | 테두리 | SSOT에 이미 정의됨 (L1127) |
| `--mg-color-text-main` | `--mg-color-text-main` | 기본 텍스트 | SSOT에 이미 정의됨 (L1124) |
| `--mg-color-text-secondary` | `--mg-color-text-secondary` | 보조 텍스트 | SSOT에 이미 정의됨 (L1125) |
| `--mg-color-primary-main` | `--mg-color-primary-main` | 주조색, 활성 탭 | SSOT에 이미 정의됨 (L1309) |

## §2 시안 (와이어 + 시각 디테일)

### 2.1 페이지 컨테이너 및 레이아웃
- **배경**: `--mg-color-background-main` (#FAF9F7)
- **그리드**: 좌측 폼(2fr) + 우측 이력(1fr), `gap: var(--mg-spacing-lg)`
- **모바일**: 단일 컬럼(1fr), `gap: var(--mg-spacing-md)`

### 2.2 좌측 폼 (TestNotificationForm)
- **카드 컨테이너**:
  - `background: var(--mg-color-surface-main)`
  - `border: 1px solid var(--mg-color-border-main)`
  - `border-radius: var(--mg-radius-lg)`
  - `box-shadow: var(--mg-shadow-md)`
  - `padding: var(--mg-spacing-lg)`
- **수신자 BadgeSelect**:
  - 선택(Active): `background: var(--mg-color-primary-main)`, `color: var(--color-bg-primary)`
  - 미선택(Inactive): `background: var(--mg-color-surface-main)`, `border: 1px solid var(--mg-color-border-main)`, `color: var(--mg-color-text-secondary)`
- **채널 탭 (SMS / 카카오 알림톡)**:
  - Active: `color: var(--mg-color-primary-main)`, `border-bottom: 2px solid var(--mg-color-primary-main)`
  - Inactive: `color: var(--mg-color-text-secondary)`
- **입력 필드 (Input, Textarea, Select)**:
  - `background: var(--color-bg-primary)`
  - `border: 1px solid var(--mg-color-border-main)`
  - `border-radius: var(--mg-radius-md)`
  - `padding: var(--mg-spacing-sm) var(--mg-spacing-md)`
  - Focus 시: `border-color: var(--mg-color-primary-main)`, `box-shadow: var(--mg-shadow-sm)`
- **글자수 카운터**:
  - 기본: `color: var(--mg-color-text-secondary)`
  - 임계점(예: 90바이트 초과 시): `color: var(--mg-color-warning-500)`, `font-weight: 600`
- **Rate-limit 카운터**:
  - 정상: `color: var(--mg-color-text-secondary)`
  - 소진: `color: var(--mg-color-error)`, `border-color: var(--mg-color-error)`
- **발송하기 버튼**:
  - 데스크탑: 우측 정렬, `min-width: 8rem`
  - 모바일: 풀폭(`width: 100%`)
  - Primary 스타일: `background: var(--mg-color-primary-main)`, `color: var(--color-bg-primary)`, `border-radius: var(--mg-radius-md)`
  - Disabled: `opacity: 0.5`, `cursor: not-allowed`

### 2.3 우측 이력 패널 (TestNotificationHistory)
- **카드 컨테이너**:
  - 폼과 동일한 카드 스타일 (`surface-main`, `border-main`, `radius-lg`, `shadow-sm`)
  - `max-height: 32rem`, `overflow-y: auto`
- **헤더 영역**:
  - 타이틀: `font-size: 1rem`, `font-weight: 600`, `color: var(--mg-color-text-main)`
  - 새로고침 버튼: 우측 상단 배치
- **이력 리스트 아이템 (칩 및 레이아웃)**:
  - 개별 아이템 배경: `var(--color-bg-primary)`
  - 테두리: `1px solid var(--mg-color-border-main)` (실패 시 `var(--mg-color-error)`)
  - **채널 칩**:
    - SMS: `color: var(--mg-color-primary-main)`, `border-color: var(--mg-color-primary-main)`
    - 알림톡: `color: var(--mg-color-warning-500)`, `border-color: var(--mg-color-warning-500)`
  - **결과 칩**:
    - 성공: `background: var(--mg-color-success)`, `color: var(--color-bg-primary)`
    - 실패: `background: var(--mg-color-error)`, `color: var(--color-bg-primary)`
  - 사유 텍스트: `color: var(--mg-color-text-secondary)`, `font-size: 0.875rem`

### 2.4 모달 (UnifiedModal)
- 정보 확인, 최종 발송, 성공, 실패 4종 모두 공통 `UnifiedModal` 컴포넌트 사용
- 버튼: 취소(Outline), 확인(Primary)
- 성공 아이콘/텍스트: `var(--mg-color-success)`
- 실패 아이콘/텍스트: `var(--mg-color-error)`

## §3 i18n·마이크로카피 정합
- 기존 어드민 페이지(`SystemConfigManagement`, `KakaoAlimtalkSettingsPage`)의 톤앤매너를 유지합니다.
- 하드코딩된 텍스트는 없어야 하며, 모두 `admin.json`의 키를 사용해야 합니다.
- **주요 마이크로카피**:
  - "알림 테스트 발송" (admin.testNotification.title)
  - "발송 이력이 없습니다." (admin.testNotification.history.empty)
  - "발송하기" (admin.testNotification.form.submit)
  - "새로고침" (admin.testNotification.history.refresh)

## §4 core-coder 위임 체크리스트 (수정 파일·라인·검증 기준)
- [ ] `frontend/src/components/admin/system/AdminTestNotificationPage.css`
  - `--admin-spacing-*` 변수를 `--mg-spacing-*`으로 치환
- [ ] `frontend/src/components/admin/system/TestNotificationForm.css`
  - `--admin-spacing-*`, `--admin-radius-*`, `--admin-shadow-*` 변수를 `--mg-*`로 치환
  - `--mg-color-surface-light` -> `--mg-color-surface-main`
  - `--color-bg-surface` -> `--color-bg-primary`
  - `--mg-color-error-main` -> `--mg-color-error`, `--mg-color-warning-main` -> `--mg-color-warning-500`, `--mg-color-success-main` -> `--mg-color-success`
- [ ] `frontend/src/components/admin/system/TestNotificationHistory.css`
  - 폼과 동일한 토큰 치환 적용
- [ ] 브라우저에서 화면을 렌더링하여 카드 배경, 패딩, 그림자, 색상이 정상적으로 표시되는지 확인 (마인드가든 어드민 대시보드 샘플과 시각 정합)
