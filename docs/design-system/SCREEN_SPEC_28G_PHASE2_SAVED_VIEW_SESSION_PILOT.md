# Seq 28g Phase 2 Set D — Saved View UI (Session Pilot) 화면설계

**작성일**: 2026-07-07  
**담당**: core-designer (handoff) → core-coder (구현)  
**관련**: Seq 28g Phase 2 Set D  
**대상 화면**: `/admin/sessions` (`SessionManagement.js`)

---

## 1. 배경 및 목표

- **Phase 1 (완료)**: `useSavedViewPreference` silent persist (UI 없음).
- **Phase 2 Set D (현재)**: 회기 관리 화면에 Named Saved View UI를 추가한다.
- **해결 과제**: 검색어·매핑 상태 필터·탭(빠른 추가/검색/전체 매핑) 조합을 이름 붙여 저장·복원.
- **제약**:
  - BE API·테넌트 간 공유 preset 없음 (localStorage only).
  - Consultant/Staff 탭 등 타 화면 범위 제외.
  - B0KlA 레이아웃·ContentHeader SSOT·AdminCommonLayout children 패턴 유지.

---

## 2. 사용자 관점 (UX)

1. 현재 `searchTerm`, `filterStatus`, `activeTab` 상태를 이름 지정 후 저장.
2. 저장된 뷰는 Chip(알약) 또는 드롭다운(4개 이상)으로 원클릭 복원.
3. '기본값' Chip으로 초기 상태(`list` viewMode, 빈 검색, ALL 상태, quick 탭) 복귀.
4. tenant + userId 로컬 스코프에만 노출.

---

## 3. 레이아웃 및 UI 스펙 (B0KlA)

### 3.1 페이지 골격

```
AdminCommonLayout
└─ div.mg-v2-ad-b0kla.mg-v2-session-management
   └─ div.mg-v2-ad-b0kla__container
      └─ ContentArea
         ├─ ContentHeader (title / subtitle SSOT)
         └─ main.mg-dashboard-layout
            ├─ SavedViewControls 행 (신규)
            ├─ 통계 StatCard 그리드
            └─ 탭·본문 콘텐츠
```

### 3.2 SavedViewControls 배치

- **위치**: `ContentHeader` 직후, `main` 최상단 — 통계 카드 그리드 **위**.
- **컨테이너**: `section.mg-v2-session-saved-view-row` (padding/gap은 B0KlA 토큰).
- **높이**: 32px~40px 수준의 얇은 행. 기존 탭·필터 UI를 가리지 않음.

### 3.3 재사용 컴포넌트 (Atomic Design)

| 계층 | 컴포넌트 | 경로 |
|------|----------|------|
| Atoms | `SavedViewChip` | `ClientComprehensiveManagement/atoms/SavedViewChip.js` |
| Molecules | `SavedViewControls` | `ClientComprehensiveManagement/molecules/SavedViewControls.js` |
| Molecules | `SaveViewModal` | `ClientComprehensiveManagement/molecules/SaveViewModal.js` |
| Molecules | `DeleteSavedViewModal` | `ClientComprehensiveManagement/molecules/DeleteSavedViewModal.js` |

- **CSS 클래스**: `mg-v2-saved-view-controls` (기존 SavedViewControls.css).
- **Chip Active**: 배경 `var(--mg-color-primary-main)`, 텍스트 `var(--mg-color-background-main)`.
- **Chip Inactive**: 배경 `var(--mg-color-surface-main)`, 테두리 `var(--mg-color-border-main)`.
- **Gap**: `var(--mg-spacing-8)`.

### 3.4 viewMode 기본값

- **default viewMode**: `list` (ViewModeToggle 도입 시 list/card B0KlA pill 정합).
- 본 Pilot PR에서는 ViewModeToggle UI 미노출. payload·localStorage에 `viewMode: 'list'`만 SSOT로 유지.

---

## 4. 데이터 스키마 및 SSOT

### 4.1 Constants 파일

`frontend/src/constants/sessionManagementSavedViewConstants.js`

| 상수 | 값 |
|------|-----|
| `SESSION_MANAGEMENT_SAVED_VIEW_PAGE_ID` | `admin.session-management` |
| `SESSION_MANAGEMENT_DEFAULT_VIEW_MODE` | `list` |
| `SESSION_MANAGEMENT_DEFAULT_ACTIVE_TAB` | `quick` |
| `SESSION_MANAGEMENT_DEFAULT_FILTER_STATUS` | `ALL` |
| `SESSION_MANAGEMENT_DEFAULT_SEARCH_TERM` | `''` |
| `SESSION_MANAGEMENT_SAVED_VIEW_PERSIST_DEBOUNCE_MS` | `300` |

### 4.2 LocalStorage Key

```text
mg.savedView.v1:{tenantId}:{userId}:admin.session-management
```

viewMode 단독 키 (향후 ViewModeToggle):

```text
mg.viewMode.v1:{tenantId}:{userId}:admin.session-management
```

### 4.3 Named Views payload (filters)

```json
{
  "viewMode": "list",
  "filters": {
    "searchTerm": "",
    "filterStatus": "ALL",
    "activeTab": "quick"
  },
  "sort": {},
  "density": "comfortable"
}
```

- `activeTab`: `quick` | `search` | `mapping`

---

## 5. 상호작용·상태

| 상태 | 표시 |
|------|------|
| 로딩 | 기존 `UnifiedLoading` (SavedViewControls는 로딩 완료 후 본문과 함께 표시) |
| 저장 뷰 없음 | '기본값' Chip만 Active |
| 저장 성공 | 새 Chip 추가 + localStorage persist |
| 삭제 | DeleteSavedViewModal → default fallback 시 filters 초기화 |
| debounced persist | filters/viewMode 변경 300ms 후 silent `setSavedView` |

---

## 6. Jest Gate

1. `pageId` storageKey가 `admin.session-management`를 사용.
2. named view 저장·복원 시 `searchTerm`, `filterStatus`, `activeTab`, `viewMode` 유지.
3. `resetToDefaultView` 시 default payload 복원.
4. `deleteNamedView`가 default 뷰 보호.

---

## 7. Must Not

- BE API 호출 금지 (localStorage only).
- `#hex` / px 하드코딩 CSS 금지 — `var(--mg-*)` 토큰만.
- Consultant/Staff·타 admin 화면 Saved View 변경 금지 (본 PR scope 외).

---

## 8. 참조

- `docs/design-system/SCREEN_SPEC_28G_PHASE2_SAVED_VIEW_CLIENT_PILOT.md`
- `frontend/src/components/admin/ClientComprehensiveManagement.js`
- `frontend/src/constants/financialManagementSavedViewConstants.js`
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`
- `frontend/src/styles/unified-design-tokens.css`
