# Seq 28g Phase 2 Set E — Saved View UI (ERP Budget · Refund Pilot) 화면설계

**작성일**: 2026-07-07  
**담당**: core-designer / core-coder (디자인 handoff + 구현 동일 PR)  
**관련**: Seq 28g Phase 2 Set E  
**대상 화면**:
- `/erp/budget` — `frontend/src/components/erp/BudgetManagement.js`
- `/erp/refund-management` — `frontend/src/components/erp/RefundManagement.js`

**SSOT 참조**:
- `frontend/src/components/erp/FinancialManagement.js` + `financialManagementSavedViewConstants.js`
- `frontend/src/components/admin/ClientComprehensiveManagement/molecules/SavedViewControls.js`
- `docs/design-system/SCREEN_SPEC_28G_PHASE2_SAVED_VIEW_CLIENT_PILOT.md`

---

## 1. 개요 및 배경

ERP 예산·환불 관리 화면에 Phase 2 Saved View(named views + Chip UI)를 FinancialManagement 파일럿과 동일 패턴으로 확장한다. 사용자는 필터·탭·뷰 모드 조합을 이름 붙여 localStorage v1에 저장하고, 테넌트·사용자 스코프에서만 복원한다. BE preset API는 Phase 3 이후.

---

## 2. 레이아웃

### 2.1 공통 원칙

- `ErpPageShell` · `ContentHeader` 레이아웃 **유지** (구조 변경 없음).
- `SavedViewControls`는 각 화면의 `ErpFilterToolbar` **직전** 얇은 행(`mg-w-full mg-mb-md` 래퍼 내부, 필터 상단).
- 높이 32px~40px, flex row, `gap: var(--mg-spacing-8)`.

### 2.2 Budget (`/erp/budget`)

```
ContentHeader (ErpPageShell headerSlot)
  └─ tabsSlot: 예산 / 카테고리 / 리포트 탭
main:
  └─ SavedViewControls
  └─ ErpFilterToolbar (primaryRow: 카테고리·상태 필터, secondaryRow: 새로고침)
  └─ 탭별 본문 (KPI + 목록)
```

### 2.3 Refund (`/erp/refund-management`)

```
ContentHeader (페이지 타이틀 — 기존 유지)
FinancialRefundHubTabs
ContentArea > ErpPageShell:
  └─ RefundKpiBlock
  └─ SavedViewControls
  └─ RefundFilterBlock (ErpFilterToolbar)
  └─ 환불 이력 (ViewModeToggle)
```

---

## 3. UI 컴포넌트 (Atomic)

| 계층 | 컴포넌트 | 재사용 |
|------|----------|--------|
| Molecules | `SavedViewControls` | Client Pilot SSOT 그대로 |
| Atoms | `SavedViewChip` | readonly **기본값** Chip 고정 |
| Molecules | `SaveViewModal`, `DeleteSavedViewModal` | UnifiedModal 기반 |

**토큰**: `var(--mg-color-primary-main)`, `var(--mg-color-background-main)`, `var(--mg-color-surface-main)`, `var(--mg-color-text-secondary)`, `var(--mg-color-border-main)`, `var(--mg-spacing-8)`.

---

## 4. 데이터 스키마 (localStorage v1)

키: `mg.savedView.v1:{tenantId}:{userId}:{pageId}`

| 화면 | pageId |
|------|--------|
| 예산 관리 | `erp.budget.management` |
| 환불 관리 | `erp.refund.management` |

### 4.1 Budget filters payload

```json
{
  "activeTab": "budgets",
  "category": "all",
  "status": "all"
}
```

- `activeTab`: `budgets` \| `categories` \| `reports`
- `category`: `all` 또는 `BUDGET_CATEGORY` codeValue
- `status`: `all` 또는 `ACTIVE` \| `INACTIVE` \| `EXHAUSTED` \| `EXPIRED`

### 4.2 Refund filters payload

```json
{
  "selectedPeriod": "month",
  "selectedStatus": "all",
  "refundViewMode": "table"
}
```

- `selectedPeriod`: RefundFilterBlock PERIOD_OPTIONS value
- `selectedStatus`: RefundFilterBlock STATUS_OPTIONS value
- `refundViewMode`: ViewModeToggle value (현재 `table`만)

### 4.3 Named views 배열

Client Pilot과 동일. `default` 뷰는 `isReadonly: true`, 삭제 불가.

---

## 5. 상호작용·상태

| 동작 | 동작 |
|------|------|
| 필터·탭·viewMode 변경 | active named view payload에 **debounced 300ms** persist |
| 기본값 Chip | `resetToDefaultView()` + 화면 필터 초기값 적용 |
| 현재 뷰 저장 | UnifiedModal 이름 입력 → named view 추가 |
| tenantId 없음 | hook no-op (저장·복원 없음) |
| 로딩/에러 | SavedViewControls는 필터 영역과 함께 표시 (Financial 파일럿과 동일) |

---

## 6. Jest Gate

1. `buildSavedViewStorageKey`에 각 pageId 포함
2. named view 저장·복원 시 filters payload 유지
3. `resetToDefaultView` → default payload + `activeViewId === 'default'`
4. named view 삭제 → active가 default로 복귀

파일:
- `frontend/src/components/erp/__tests__/budgetManagement.savedView.test.js`
- `frontend/src/components/erp/__tests__/refundManagement.savedView.test.js`

---

## 7. Must Not

- BE API로 preset 저장 금지
- `#hex` / 임의 px 하드코딩 금지
- ErpPageShell·ContentHeader 제거·대체 금지
- default Chip 삭제·rename 금지
