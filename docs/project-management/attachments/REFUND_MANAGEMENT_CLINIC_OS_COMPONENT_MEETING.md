# `/erp/refund-management` Clinic-OS 공통 모듈 재사용·중복 방지 합의서

| 항목 | 내용 |
|------|------|
| **역할** | core-component-manager (제안·문서화만 · 코드 수정 없음) |
| **대상** | `/erp/refund-management` (`RefundManagement`) Clinic-OS TO-BE |
| **비주얼 SSOT** | `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` |
| **트윈 참조** | Purchase / Salary / OpsApproval QuietHeader+SummaryStrip · Salary `MoneyTodoList` 위치 · `EntityRowActions` · `TabChipRow` · `SegmentedTabs` |
| **AS-IS 잔여** | `ContentHeader` + `RefundKpiBlock`(4카드) + `FinancialRefundHubTabs`(`AdminDashboardB0KlA.css` + `mg-v2-ad-b0kla__pill-toggle`) + 행 단독 `MGButton` secondary「ERP 반영」 |
| **상태** | **합의 확정 (이번 배치)** — core-coder 구현 기준 |

---

## TO-BE 스택 (위→아래)

```
AdminCommonLayout → ContentArea → ErpPageShell (--clinic-os)
  headerSlot: RefundQuietHeader (h1 + ghost 도구 · ContentHeader 폐기)
  children:
    1) RefundSummaryStrip — 3 cell
         [환불 건수] | [환불 금액 money-expense] | [ERP 미반영 n]
    2) RefundActionRail — 환불 레일 (대기·일괄 CTA 등 · 빈면 숨김)
    3) TabChipRow chips — period · status (페이지 내 필터 IA)
    4) Main stage list/table
         Row: EntityRowActions
           · primary「ERP 반영」dusty teal
           · ghost「열기」
           · 사유·ERP·회계 → ⋮ / collapsible (2nd stage)
```

허브 라우트 전환(`일상 거래` ↔ `환불·정산`)은 페이지 크롬 밖·`ErpPageShell.tabsSlot` 등에서 **공용 `SegmentedTabs`** 유지 (B0KlA 클래스 제거).

---

## 조사 결론·합의 (Q1–Q7)

### 1. QuietHeader / SummaryStrip — 도메인 organism 복제 vs 공용 추출

| 항목 | 합의 |
|------|------|
| **권고** | **이번 배치: salary/purchase/ops처럼 도메인 organism 복제 허용** |
| **신규** | `RefundQuietHeader`, `RefundSummaryStrip` → `frontend/src/components/erp/refund-management/` (또는 `erp/refund/` Clinic-OS 폴더) |
| **Visual SSOT** | Purchase/Salary/Ops strip: vertical dividers · surface-secondary · `KpiNumeral` · 3 cell |
| **금액 색** | 환불 금액 cell = **money-expense** (ledger expense blue / semantic-info 계약). owed-red·두 번째 primary 금지 |
| **공용 추출** | `QuietHeader`/`SummaryStrip` 공통 molecule은 **후속 Phase**. 이번 배치에서 공통 추상화 금지 (과도한 결합·범위 팽창) |
| **폐기** | 페이지 크롬의 `ContentHeader` / 영문 서브타이틀 / B0KlA KPI 4카드 그리드 |

### 2. 환불 레일 — `MoneyTodoList` vs `RefundActionRail`

| 항목 | 합의 |
|------|------|
| **권고** | **`RefundActionRail` 신규 (도메인 organism)** |
| **이유** | `MoneyTodoList`는 OFD 콕핏 전용(상담료·지급·환불 금액 + **타 라우트 navigate**). props·카피·링크가 환불 관리 **인페이지 액션 레일**과 불일치. Salary는 OFD 트윈이라 재사용이 맞음; Refund 페이지에 억지 재사용은 중복이 아니라 **오용** |
| **허용 API 스케치** | pending ERP 미반영 건수/금액, 일괄「선택 건 ERP 반영」등 **페이지 핸들러**; 빈 데이터면 섹션 `null`(Salary todo와 동일 빈면 계약) |
| **금지** | `MoneyTodoList` 복제·OFD 링크 하드코딩 레일 · salary-only todo 패턴을 refund에 복사 |

### 3. `EntityRowActions` 재사용

| 항목 | 합의 |
|------|------|
| **권고** | **필수 재사용** (`components/common/molecules/EntityRowActions`) |
| **Row CTA** | `primaryAction` = 「ERP 반영」(`MGButton` solid primary / dusty teal) · 가시 ghost「열기」 |
| **Overflow(⋮)** | 사유 상세 · ERP 동기화 · 회계 상태 등 → items / collapsible 2nd stage. 행에 secondary solid·커스텀 메뉴 금지 |
| **AS-IS** | `RefundHistoryTableBlock` 단독 secondary「ERP 반영」버튼 → EntityRowActions로 교체 |

### 4. `TabChipRow` / chips (period · status)

| 항목 | 합의 |
|------|------|
| **권고** | **공용 `TabChipRow` 재사용** (Purchase in-page tabs / Salary view chips 트윈) |
| **용도** | 기간·상태 **필터 chips** (페이지 primary IA가 아님 · list가 primary) |
| **폐기** | `RefundFilterBlock`의 구 select·ErpFilterToolbar 지배 크롬(필터는 chips+필요 시 ghost 도구로 축소). 페이지 원오프 chip CSS 금지 (`TabChipRow.css`만) |

### 5. `FinancialRefundHubTabs` B0KlA 정리 · `SegmentedTabs`

| 항목 | 합의 |
|------|------|
| **권고** | **공용 `SegmentedTabs` 유지** · B0KlA 제거 |
| **조치** | `AdminDashboardB0KlA.css` import 삭제 · `mg-v2-ad-b0kla__pill-toggle` className 제거 · Clinic-OS 토큰/기본 SegmentedTabs 스타일만 |
| **비교체** | Hub(2 라우트 전환)를 `TabChipRow`로 바꾸지 않음. **Hub = SegmentedTabs** / **페이지 내 period·status = TabChipRow** 역할 분리 |
| **잔여** | `CLINIC_OS_REMAINING_SCREENS` P1 #10 환불 허브 PARTIAL → 본 합의로 페이지·허브 크롬 정렬 목표 |

### 6. `RefundKpiBlock` 4카드 → SummaryStrip 3cell

| 항목 | 합의 |
|------|------|
| **권고** | **`RefundSummaryStrip` 3cell로 대체** |
| **셀** | (1) 환불 건수 (2) 환불 금액 · money-expense (3) ERP 미반영 건수(또는 금액 — 디자인 핸드오프 카피 SSOT) |
| **폐기/축소** | `RefundKpiBlock` 4카드(건수·금액·회기·연동상태) **페이지 1st viewport에서 폐기**. 회기·성공률 등 상세는 list/⋮/2nd stage 또는 후속 |
| **파일** | 블록 파일은 미사용 시 삭제 또는 thin re-export 금지 후 제거(코더 판단 · 테스트 import 정리) |

### 7. 신규 금지 목록

| 금지 | 근거 |
|------|------|
| Custom overlay / 커스텀 모달 쉘 | `UnifiedModal`만 |
| Second primary color · forest `#3D5246` · page-custom hex | Clinic-OS dusty teal primary only |
| 왼쪽 4px accent bar · Pencil/B0KlA 섹션 카드 | SSOT 금지 |
| 신규 `AdminDashboardB0KlA.css` import · `mg-v2-ad-b0kla__*` 신규 사용 | 레거시 잔존만 정리 대상 |
| ContentHeader를 Clinic-OS quiet chrome 대용 | QuietHeader SSOT |
| KPI 4카드 그리드 / StatCard accent 복제 | SummaryStrip 3cell |
| `MoneyTodoList` 강제 재사용 또는 OFD todo 복제 organism | `RefundActionRail` |
| 행 전용 커스텀 ⋮ / dropdown | `EntityRowActions` |
| 페이지 원오프 tab/chip CSS | `TabChipRow.css` / `SegmentedTabs.css` |
| ErpButton·레거시 `mg-v2-button` primary 신규 | `MGButton` + `erpMgButtonProps` |
| 공용 QuietHeader/SummaryStrip 추상화(이번 배치) | 후속 |

---

## 재사용 목록 (필수)

| 모듈 | 경로/역할 |
|------|-----------|
| `AdminCommonLayout` + `ContentArea` + `ErpPageShell` | 셸 |
| `MGButton` + `buildErpMgButtonClassName` | CTA SSOT |
| `TabChipRow` | period · status chips |
| `SegmentedTabs` | FinancialRefundHubTabs (B0KlA 제거) |
| `EntityRowActions` | 행 primary/ghost/⋮ |
| `KpiNumeral` / `UnifiedLoading` / `EmptyState` | strip·리스트 |
| `UnifiedModal` / `ConfirmModal` | 확인·상세 모달 |
| `ErpSafeText` / `safeDisplay` | 표시 경계 |
| `ListTableView` (선택) | stage 테이블 표준화 시 |

## 신규 허용 (이번 배치 · 도메인 organism만)

| 컴포넌트 | 계층 | 비고 |
|----------|------|------|
| `RefundQuietHeader` | Organism | Purchase/Salary twin 복제 |
| `RefundSummaryStrip` | Organism | 3 cell · money-expense |
| `RefundActionRail` | Organism | MoneyTodoList **비재사용** |
| (선택) `refundManagementClinicOsStrings.js` | constants | 카피 하드코딩 방지 |
| (선택) 행 thin wrapper | Molecule | EntityRowActions props 조립만 |

## 신규 금지 (요약)

Custom overlay · second primary · B0KlA/accent bar · ContentHeader chrome · KPI 4카드 · MoneyTodoList 오용/복제 · 행 커스텀 메뉴 · 원오프 chip CSS · 공용 Header/Strip 추출(이번 배치)

---

## 배치 제안 (적재적소)

| 대상 | 위치 | 비고 |
|------|------|------|
| QuietHeader / SummaryStrip / ActionRail | `erp/refund-management/` | 도메인 organism · common 승격은 후속 |
| Hub tabs | `erp/financial/FinancialRefundHubLayout.js` | SegmentedTabs만 · B0KlA 정리 |
| Chips / Row actions | `common/TabChipRow`, `common/molecules/EntityRowActions` | 이동·복제 금지 |
| 폐기 | `RefundKpiBlock` 1st viewport · `ContentHeader` on refund page | |

**공통화 후속 (별 Phase)**: Purchase/Salary/Ops/Refund QuietHeader·SummaryStrip → `common` 또는 `erp/organisms/clinicOsChrome` 추출 후보로 `COMPONENT_COMMONIZATION_CANDIDATES`에 등재 권장.

---

## core-coder 전달 한 줄

`/erp/refund-management`는 RefundQuietHeader+3cell SummaryStrip(money-expense)+RefundActionRail(신규·MoneyTodoList 금지)+TabChipRow+list(EntityRowActions: ERP 반영 primary / 열기 ghost / 사유·ERP·회계 ⋮)로 Clinic-OS 정렬하고, Hub는 SegmentedTabs만 남겨 B0KlA 제거·RefundKpiBlock/ContentHeader는 폐기한다.

---

## 참조

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`
- `docs/design-system/CLINIC_OS_REMAINING_SCREENS.md` (P1 #10 환불 허브)
- `docs/design-system/SALARY_MANAGEMENT_CLINIC_OS_HANDOFF.md` (트윈·재사용 패턴)
- `frontend/src/components/erp/salary/SalaryQuietHeader.js`, `SalarySummaryStrip.js`
- `frontend/src/components/erp/purchase/PurchaseQuietHeader.js`, `PurchaseSummaryStrip.js`
- `frontend/src/components/erp/organisms/moneyCockpit/MoneyTodoList.js`
- `frontend/src/components/common/TabChipRow.jsx`, `SegmentedTabs.jsx`, `molecules/EntityRowActions.js`
- `frontend/src/components/erp/financial/FinancialRefundHubLayout.js`
- `frontend/src/components/erp/refund-management/RefundKpiBlock.js`
- `/core-solution-common-modules`, `/core-solution-encapsulation-modularization`, `/core-solution-atomic-design`
