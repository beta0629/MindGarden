# 환불 관리 (`/erp/refund-management`) Clinic-OS TO-BE UI/UX 스펙 (Design Handoff)

**역할**: core-designer · **코드 작성 금지** (구현은 core-coder)  
**대상**: `/erp/refund-management` (`RefundManagement`)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`  
**상태**: **Critic PASS 후 TO-BE** — 본 문서가 `/erp/refund-management` 비주얼·IA·카피의 **단일 핸드오프**.  
**폐기**: 이전 AS-IS chrome(ContentHeader「환불 관리 시스템」+ 영문/부제 · B0KlA ContentArea · 4카드 KPI · always-on 사유/ERP/회계 블록 · 행 항상 secondary「ERP 반영」)은 **superseded**. 구현 기준은 아래 TO-BE만.

**트윈(크롬만)**: `/erp/purchase` QuietHeader + SummaryStrip · `/erp/salary` QuietHeader + SummaryStrip + MoneyTodoList strip · `/erp/approvals` OpsApproval* · `ErpPageShell` · `EntityRowActions`  
**허브**: `FinancialRefundHubTabs` — `/erp/financial` ↔ `/erp/refund-management` **유지** (B0KlA pill → Clinic-OS SegmentedTabs/TabChipRow 스타일만 정리)  
**범위**: Frontend chrome / layout / IA / copy / CSS class / 행 CTA 분기(FE 휴리스틱).  
**Non-goals**: refund·ERP 엔드포인트·호출 shape 변경. `POST …/reflect-erp-refund` URL 유지(404 토스트 UX 유지). 환불 실행 버튼은 배정(매칭) 관리 SSOT 유지.

---

## 1. 개요·배경 · 폐기 AS-IS

운영자가 **환불 이력 조회**와 **ERP 미반영 건 반영**을 한 stage에서 끝내는 것이 primary job이다.  
AS-IS는 ContentHeader(「환불 관리 시스템」+ 부제) · B0KlA ContentArea · 4카드 KPI(건수/금액/회기/연동상태) · filter · table · always-on 사유 통계·ERP 상세·회계 블록이 1st viewport를 경쟁하고, 행 CTA는 항상 secondary「ERP 반영」이다. `erpStatus` API 필드는 컨트롤러 경로에 실데이터가 없어 **신뢰 불가**.

TO-BE는 Clinic-OS quiet chrome + **3-cell strip + 환불 레일 + list SSOT**로 재구성한다. 사유·ERP 상세·회계는 collapsible 또는 행/페이지 ⋮로만 두고, Pencil/B0KlA·좌측 4px accent를 제거한다.

### AS-IS → TO-BE (폐기 요약)

| AS-IS | TO-BE |
|-------|-------|
| ContentHeader「환불 관리 시스템」+ 부제「상담 환불 현황…」 | Quiet header h1「**환불 관리**」· 부제/영문 서브타이틀 **폐기** |
| `mg-v2-ad-b0kla` ContentArea · accent KPI 4카드 | Clinic-OS paper · Summary strip **3 cells** · 좌측 4px **금지** |
| KPI: 건수 / 금액 / 회기 / ERP 연동 상태 | 건수 / 환불 금액(expense blue) / ERP 미반영 |
| always-on 사유·ERP sync·회계 블록 | collapsible 또는 ⋮ (1st viewport 경쟁 금지) |
| 행 항상 secondary「ERP 반영」 | unreflected → primary「ERP 반영」· reflected → ghost「열기」 |
| Hub tabs `mg-v2-ad-b0kla__pill-toggle` | Clinic-OS SegmentedTabs / TabChipRow 스타일 (라우트 허브 유지) |

---

## 2. 레이아웃 블록 다이어그램 (위→아래)

```
AdminCommonLayout title="환불 관리"
└─ ContentArea (B0KlA class 금지)
   └─ ErpPageShell (.refund-management-shell.refund-management--clinic-os)
      ├─ (선택) tabsSlot: FinancialRefundHubTabs — Clinic-OS segmented/chip (허브 유지)
      ├─ headerSlot: RefundQuietHeader
      │     h1「환불 관리」 + ghost tools (목록 새로고침 · 선택적 엑셀/일괄은 툴바·⋮)
      │     ※ ContentHeader / 영문·장문 부제 / 「운영 현황으로 돌아가기」페이지 primary 금지
      └─ children: .refund-management
         ├─ 1) RefundSummaryStrip — **3 cells**
         │     [환불 건수] | [환불 금액 ₩ blue] | [ERP 미반영 n건]
         ├─ 2) 「환불 레일」— secondary strip (blue tone)
         │     「ERP 미반영 N건 · 합계」— MoneyTodoList / salary 할일 strip 트윈
         │     (pending 0 · 팩트 없으면 섹션 자체 미렌더)
         ├─ 3) chips / filter row (기간·상태 · SavedView · ghost 새로고침 등)
         └─ 4) Main stage (.refund-management__stage) — **primary SSOT**
               └─ list/table: 행 = 일시·내담자·상담사·패키지·회기·금액·사유·상태뱃지
                     · CTA「ERP 반영」|「열기」(§6) · ⋮ EntityRowActions
                     └─ 2nd stage (collapsible / drawer / ⋮ only):
                           사유 통계 · ERP 상세 · 회계
```

**IA 원칙**

| 계층 | 콘텐츠 | 규칙 |
|------|--------|------|
| Primary | 목록/테이블 + 행 CTA | 첫 본문 stage의 **유일한** 주 콘텐츠 |
| Summary | 3-cell strip | 동일 너비 · surface + hairline · 좌측 4px·아이콘 타일 금지 |
| Secondary strip | 환불 레일 | MoneyTodoList/salary 할일 트윈. 빈면이면 **미렌더** |
| Chips | 기간·상태 필터 | stage **위** filter row. ErpFilterToolbar를 페이지 정체성으로 쓰지 않음 |
| 2nd stage | 사유·ERP·회계 | collapsible 또는 행/페이지 ⋮만. always-on 3블록 **폐기** |
| Tools | 새로고침 등 | quiet header ghost. 페이지 primary solid CTA로 올리지 않음 |
| Hub | 일상 거래 ↔ 환불·정산 | 라우트 유지 · 비주얼만 Clinic-OS |

---

## 3. 컴포넌트 인벤토리 (재사용 우선)

### 3.1 Template / Shell

| 계층 | 컴포넌트 | 재사용 |
|------|----------|--------|
| Template | `AdminCommonLayout` + `ContentArea` + `ErpPageShell` | 필수. ContentArea에서 `mg-v2-ad-b0kla` **제거** |
| Organism | `RefundQuietHeader` | **신규** (PurchaseQuietHeader / SalaryQuietHeader / OpsApprovalQuietHeader 트윈) |
| Organism | `RefundSummaryStrip` | **신규** (PurchaseSummaryStrip / SalarySummaryStrip 트윈). AS-IS `RefundKpiBlock` 4카드 **대체·폐기** |
| Organism | `RefundErpPendingRail` (가칭) | MoneyTodoList / salary `__todo` **패턴 재사용**. OFD MoneyTodoList를 그대로 끼우지 말고 **동일 null 계약·밀도·blue tone**의 refund 전용 rail. MoneyTodoList 본문 복제 금지 — CSS/레이아웃 트윈 |
| Organism | Main stage list/table | 기존 `RefundHistoryTableBlock` 재배치 + CTA 분기 + 36px + EntityRowActions |
| Molecule | `EntityRowActions` (⋮) — Mapping/Salary/Ledger 패턴 | overflow SSOT |
| Molecule | `FinancialRefundHubTabs` | **유지** · B0KlA pill class 제거 · SegmentedTabs/TabChipRow Clinic-OS |
| Molecule | filter chips (`RefundFilterBlock` 정리) | stage 위 chips. 일괄 ERP 반영은 툴바 secondary 유지 가능 |
| Atom | `MGButton` solid primary / ghost | dusty teal primary only. danger = 삭제만 |
| Atom | `KpiNumeral`, `EmptyState`/`ErpEmptyState`, `UnifiedLoading`, `ErpStatusBadge`, `SafeText`/`ErpSafeText` | 기존 |

### 3.2 AS-IS 블록 처리

| AS-IS | TO-BE |
|-------|-------|
| `RefundKpiBlock` | SummaryStrip 3-cell로 **대체**. 4카드·accent class 폐기 |
| `RefundErpSyncBlock` | 레일(요약) + ⋮/collapsible「ERP 상세」로 **이전**. always-on 섹션 폐기 |
| `RefundReasonStatsBlock` | collapsible 또는 페이지 ⋮ |
| `RefundAccountingBlock` | collapsible 또는 페이지 ⋮ |
| `ContentHeader` | QuietHeader로 교체 |
| `mg-v2-mapping-list-block` 카드 래퍼 | `__stage` Clinic-OS 기하로 정렬 (mapping list B0KlA 유입 금지) |

### 3.3 공통 모듈 검토 결과

- **재사용**: AdminCommonLayout, ErpPageShell, MGButton, EntityRowActions, KpiNumeral, EmptyState, UnifiedModal(해당 시), SegmentedTabs/TabChipRow, FinancialRefundHubTabs(허브), SavedViewControls(필터 보조 — stage 위)
- **신규 organism 허용**: QuietHeader / SummaryStrip / PendingRail만 (트윈 복제 수준). custom overlay·두 번째 primary 금지
- **MoneyTodoList**: 계약(빈면 null)만 트윈. OFD「지금 할 일」카피를 이 페이지 레일 제목으로 강제하지 않음 — 레일 카피는 §4.3

---

## 4. 정확한 한국어 카피 테이블 (상수 키 `RM_*`)

권장 상수 파일(코더): `frontend/src/constants/refundManagementClinicOsStrings.js` (신규) — Saved View 상수(`refundManagementSavedViewConstants.js`)와 분리.

### 4.1 제목·aria (영문 서브타이틀 금지)

| 키 (권장 상수) | TO-BE 카피 | 비고 |
|----------------|------------|------|
| `RM_PAGE_TITLE` | **환불 관리** | AS-IS「환불 관리 시스템」폐기 |
| `RM_PAGE_TITLE_ID` | `refund-management-page-title` | |
| `RM_MAIN_ARIA_LABEL` | **환불 관리 콘텐츠** | |
| Header `aria-label` | **환불 관리** | h1과 동일 |
| `RM_HEADER_TOOLS_ARIA` | 환불 관리 도구 | |
| `RM_REFRESH_CTA` / aria | 목록 새로고침 | ghost |
| AdminCommonLayout `title` | **환불 관리** | AS-IS와 동일 유지 가능 |
| LNB | 배정·결제·환불 그룹 내 기존 라벨 정합 | 화면에「매칭」카피 없음 → 필요 시「배정」 |

**폐기 카피**: 「환불 관리 시스템」·「상담 환불 현황 및 환불·결제 연동」·영문 서브타이틀·페이지 액션「운영 현황으로 돌아가기」(LNB/허브로 충분).

### 4.2 Summary strip (3 cells)

| 셀 | 라벨 키 | TO-BE 라벨 | 값 소스 | 단위 |
|----|---------|------------|---------|------|
| 1 | `RM_SUMMARY.COUNT_LABEL` | **환불 건수** | `summary.totalRefundCount` | 건 |
| 2 | `RM_SUMMARY.AMOUNT_LABEL` | **환불 금액** | `summary.totalRefundAmount` | 원 (`formatKrw` / ErpSafeNumber CURRENCY) |
| 3 | `RM_SUMMARY.PENDING_ERP_LABEL` | **ERP 미반영** | `erp-sync-status.pendingErpRequests` | 건 |

- Band aria: `RM_SUMMARY.BAND_ARIA` = **환불 관리 요약**
- 금액 셀에 `건` 금지. 건수 셀만 `건`.
- AS-IS「환불 회기」·「ERP 연동 상태(연동 완료/오류·성공률)」KPI 셀 **폐기** (회기·성공률은 행/상세·⋮로).

### 4.3 환불 레일 (secondary strip)

| 키 | TO-BE 카피 |
|----|------------|
| `RM_RAIL_TITLE` / fact line | **ERP 미반영 {N}건 · 합계** (합계 = 미반영 금액 합이 API/FE에서 산출 가능하면 원 표기; 불가하면 건수만) |
| `RM_RAIL_ARIA` | ERP 미반영 환불 |
| 빈면 | 섹션 **미렌더** (`pendingErpRequests === 0` 이고 표시할 팩트 없음) |

- MoneyTodoList / salary 할일 strip과 **동일 밀도·간격**. blue tone wash(§5).
- 레일 안에서 두 번째 solid primary CTA 만들지 않음. 필요 시 ghost「목록에서 보기」정도.

### 4.4 Hub tabs (유지)

| 값 | 라벨 |
|----|------|
| `financial` | **일상 거래** → `/erp/financial` |
| `refund` | **환불·정산** → `/erp/refund-management` |

### 4.5 행 CTA·⋮

| 상태 (FE 판정 §6) | Primary/row CTA | ⋮ (secondary) |
|-------------------|-----------------|----------------|
| unreflected | **ERP 반영** (`MGButton` solid primary) | 사유·ERP 상세·회계·내보내기(해당 시) |
| reflected | **열기** (`MGButton` ghost) | 동일 overflow. 「ERP 반영」재노출 금지(또는 ⋮「다시 반영」만 — 기본은 숨김) |

- ⋮ aria: `RM_ROW_MENU_ARIA` = **환불 행 작업**
- 「열기」: 행 상세/매핑 조회 등 기존 탐색 동작(코더: 기존 네비·모달 중 최소 침습). 없으면 ghost로 행 확장/상세 panel.

### 4.6 빈·로딩·에러

| 상태 | 카피 |
|------|------|
| 목록 빈 | **선택한 기간에 환불 이력이 없습니다.** (이모지 없음) |
| 레일 없음 | 섹션 미표시 |
| 로딩 | **환불 데이터를 불러오는 중…** / **불러오는 중…** |
| ERP 반영 404 등 | 기존 토스트 UX **유지** (엔드포인트 URL 불변) |

### 4.7 Collapsible / ⋮ 섹션 제목

| 키 | 카피 |
|----|------|
| `RM_COLLAPSE_REASON` | **사유 통계** |
| `RM_COLLAPSE_ERP` | **ERP 상세** |
| `RM_COLLAPSE_ACCOUNTING` | **회계** |

---

## 5. Strip / Rail 색·토큰

### 5.1 Summary strip polarity (Critic PASS)

| 셀 | 의미 | 색 (참고 hex) | 토큰 |
|----|------|---------------|------|
| **환불 건수** | 카운트 | 본문 | `var(--mg-v2-color-text-primary)` · 라벨 `text-secondary` |
| **환불 금액** | 나간 돈(expense) | `#1D4ED8` | **`var(--mg-v2-color-money-expense)`** |
| **ERP 미반영** | 카운트 | 본문 | 금액 polarity 색 없음 |
| 셀 크롬 | surface + hairline | — | `neutral-100`/`neutral-50` + `neutral-300` border. **좌측 4px accent 금지** · lucide 타일 금지 |

### 5.2 환불 레일 (blue tone)

| 용도 | 토큰 |
|------|------|
| 금액/강조 숫자 | `var(--mg-v2-color-money-expense)` (`#1D4ED8`) |
| wash (8–12%) | `color-mix(in srgb, var(--mg-v2-color-money-expense) 8–12%, transparent)` |
| 테두리·surface | `neutral-300` / `neutral-100` |
| 제목 | body-md / caption · text-primary |

MoneyTodoList / salary todo strip과 **동일 기하**. loud fill·neon 금지.

### 5.3 MGButton vs 금액색 (혼용 금지)

| 역할 | 색 | 규칙 |
|------|-----|------|
| Primary CTA (ERP 반영) | dusty teal `#0E5F5A` / `var(--mg-v2-color-primary-solid)` | **금액 blue와 혼용 금지** — 버튼을 blue로 칠하지 않음 |
| Ghost (열기·새로고침) | slate text + hairline | |
| 환불 금액 숫자만 | money-expense blue | CTA fill에 사용 금지 |

### 5.4 페이지 토큰 (Clinic-OS)

| 용도 | 토큰 |
|------|------|
| page / paper | `var(--mg-v2-color-neutral-50)` |
| surface | `var(--mg-v2-color-neutral-100)` |
| hairline | `var(--mg-v2-color-neutral-300)` |
| text | `var(--mg-v2-color-text-primary)` / `…-secondary` |
| type | 4-step only: h1 / h2 / body-md / caption · `--mg-v2-font-family-base` |
| spacing | `--mg-v2-space-*` |
| stage | border 1px neutral-300 · `--mg-v2-radius-lg` · min-height ~36rem |
| CTA/⋮ 높이 | **36px** — `var(--mg-v2-component-height-row)` (2.25rem) 또는 `var(--mg-spacing-36)` (OpsApproval twin). height/min-height/max-height 동시 |

---

## 6. Row actions · 36px · FE 휴리스틱

### 6.1 높이

- 행 CTA(「ERP 반영」/「열기」) + ⋮ trigger = **36px** 정렬 (Salary `__cta` / OpsApproval `__action-btn` / Purchase card footer / EntityRowActions 패턴).
- AS-IS `size="sm"` / `--button-height-sm`(32) **폐기 대상**.

### 6.2 CTA 분기 규칙 (API `erpStatus` 신뢰 불가 → FE 휴리스틱)

컨트롤러/목록 DTO에 `erpStatus` 실데이터가 없는 전제. **엔드포인트 변경 금지**. BE가 후속으로 `erpStatus`를 채우면 동일 분기 테이블을 우선 사용.

**권장 reflected 판정** (하나라도 참이면 reflected):

1. `erpReference` truthy, **또는**
2. `erpStatus` ∈ {`SENT`, `REFLECTED`, `SYNCED`} (대소문자 정규화 후)

**그 외** → unreflected.

| 판정 | 행 CTA | variant |
|------|--------|---------|
| unreflected | **ERP 반영** | `MGButton` **primary** (dusty teal) → 기존 `POST /api/v1/admin/mappings/{mappingId}/reflect-erp-refund` |
| reflected | **열기** | `MGButton` **ghost** |

- 일괄 반영(선택 행)은 툴바 secondary/ghost 유지 가능. primary는 **행 단위 미반영 ERP 반영**에 둔다.
- 404 등 실패 토스트 = **기존 UX 유지**.

### 6.3 상호작용 요약

```
[목록이 SSOT]
  unreflected → CTA「ERP 반영」(primary 36) → reflect-erp-refund
  reflected   → CTA「열기」(ghost 36)
  ⋮ → 사유 통계 | ERP 상세 | 회계 | …

[2nd stage]
  page collapsible 또는 ⋮ only
  ※ 사유·ERP·회계 always-on 3블록 1st viewport 금지
```

---

## 7. Collapsible / ⋮ 배치

| 콘텐츠 | 1st viewport | 배치 |
|--------|--------------|------|
| 환불 이력 테이블 | ✅ primary | `__stage` |
| 필터 chips | ✅ stage 직전 | filter row |
| 사유 통계 | ❌ | stage 하단 **접힌** collapsible 또는 페이지/행 ⋮ |
| ERP 상세(성공률·마지막 동기화·실패 건 등) | ❌ | 동일. 레일은 pending **요약만** |
| 회계 | ❌ | 동일 |

- 기본: collapsible **접힘**. 펼침은 사용자 제스처만.
- EntityRowActions로 행 단위 overflow 가능하면 페이지 하단 always-visible 통계 제거 가능.

---

## 8. CSS BEM 클래스 (`refund-management--clinic-os`)

기존 `refund-management` 스코프 유지. Clinic-OS modifier·신규 블록만 명시.

| 클래스 | 역할 |
|--------|------|
| `refund-management--clinic-os` | 페이지 lock modifier |
| `refund-management-shell` | ErpPageShell 래퍼(선택) |
| `refund-management-header` / `__title` / `__action` | QuietHeader |
| `refund-management-summary` / `__cell` / `__label` / `__amount` | 3-cell strip |
| `refund-management-summary__amount--expense` | 환불 금액 → `--mg-v2-color-money-expense` |
| `refund-management-summary__cell--expense` | 선택 wash(8–12% money-expense) |
| `refund-management-summary__amount--count` | 건수(중립) |
| `refund-management-summary__amount--pending-erp` | ERP 미반영 건수 |
| `refund-management-rail` / `__title` / `__fact` / `__amount` | 환불 레일 (blue tone) |
| `refund-management__chips` / `__toolbar` | filter chips |
| `refund-management__stage` | main stage |
| `refund-management__table` / `__row` / `__actions` | primary list |
| `refund-management__cta` | ERP 반영 / 열기 — height 36 토큰 |
| `refund-management__cta--primary` | unreflected |
| `refund-management__cta--ghost` | reflected「열기」 |
| `refund-management__row-menu` | ⋮ EntityRowActions — trigger 36 |
| `refund-management__collapse` / `--reason` / `--erp` / `--accounting` | 2nd stage collapsible |
| `mg-v2-financial-refund-hub` | hub 래퍼 — **B0KlA pill class 제거** |

**금지 클래스**: `mg-v2-ad-b0kla*`, `mg-v2-ad-b0kla__pill-toggle`, `refund-management__stat-card--accent-*`, 좌측 accent utility, 페이지 스코프 hex one-off, `AdminDashboardB0KlA.css` 신규 import.

---

## 9. Non-goals / API 불변

| 항목 | 규칙 |
|------|------|
| `GET /api/v1/admin/refund-statistics` | shape·의미 변경 금지. strip은 기존 `summary.*` 사용 |
| `GET /api/v1/admin/refund-history` | shape 변경 금지. `erpStatus` 부재 시 §6 FE 휴리스틱 |
| `GET /api/v1/admin/erp-sync-status` | `pendingErpRequests` 등 기존 필드 사용. 엔드포인트 변경 금지 |
| `POST /api/v1/admin/mappings/{mappingId}/reflect-erp-refund` | **URL·호출 shape 유지**. 404 토스트 UX 유지 |
| 환불 **실행** CTA | 배정(매칭) 관리 SSOT. 본 화면에 환불 실행 버튼 추가 금지 |
| 금액 계산 SSOT | 환불 금액·회기 계산 백엔드 변경 금지 |
| Pencil/B0KlA | forest primary·섹션 레일·4px accent **재도입 금지** |
| Financial/Salary 모달 전체 리스타일 | 별 큐 (P1 leftovers) |

---

## 10. Acceptance checklist (core-coder) + chrome lock test

Salary §10 / OpsApproval lock test와 동일 게이트 수준.

```text
[ ] Quiet header: AdminCommonLayout + ErpPageShell headerSlot · h1「환불 관리」· 「환불 관리 시스템」/영문·장문 부제 없음
[ ] ContentHeader 제거 · 「운영 현황으로 돌아가기」페이지 primary 없음
[ ] aria/main: 「환불 관리 콘텐츠」등 제목 정합
[ ] Layout 순서: QuietHeader → Summary 3 cells → 환불 레일 → chips → list(__stage)
[ ] Summary 3: 환불 건수(totalRefundCount) / 환불 금액(totalRefundAmount, --mg-v2-color-money-expense #1D4ED8) / ERP 미반영(pendingErpRequests)
[ ] 좌측 4px bar·아이콘 타일·4카드 KPI·accent-* 없음
[ ] 환불 레일: 「ERP 미반영 N건 · 합계」blue tone · MoneyTodoList/salary todo 트윈 · 빈면 미렌더
[ ] Primary stage = list/table · 사유/ERP/회계 always-on 1st viewport 아님 (collapsible/⋮)
[ ] Row CTA: unreflected「ERP 반영」primary teal · reflected「열기」ghost · 휴리스틱 §6 문서화 구현
[ ] CTA/⋮ height 36 (--mg-v2-component-height-row 또는 --mg-spacing-36)
[ ] MGButton primary = dusty teal #0E5F5A · 금액 blue와 버튼 fill 혼용 없음
[ ] FinancialRefundHubTabs 유지 · B0KlA pill class 제거 · Clinic-OS SegmentedTabs/TabChipRow
[ ] AdminDashboardB0KlA.css / mg-v2-ad-b0kla* 페이지 import·class 없음
[ ] API: reflect-erp-refund URL 불변 · 통계/이력/sync-status shape 불변 · 404 토스트 UX 유지
[ ] EmptyState · 이모지 없음 · 4-step type · paper neutral-50
[ ] safeDisplay / ErpSafeText / ErpSafeNumber 경계 유지
[ ] Hex soft-gate: 신규 CSS는 --mg-v2-* / --mg-v2-color-money-expense / --mg-spacing-36(또는 row height)만
[ ] Lock test 신규: RefundManagement.clinicOsChrome (+ 필요 시 refundManagementClinicOsStrings)
```

### Lock test 항목 (권장 파일)

`frontend/src/components/erp/__tests__/RefundManagement.clinicOsChrome.test.js`

| 검증 | 기대 |
|------|------|
| QuietHeader + SummaryStrip + `__stage` | import/JSX 존재 · ContentHeader 없음 |
| Layout order | QuietHeader → summary → rail → chips → stage (소스 순서 또는 testid) |
| No B0KlA | `AdminDashboardB0KlA` import 없음 · `mg-v2-ad-b0kla` 클래스 없음 |
| Summary expense | `__amount--expense` → `--mg-v2-color-money-expense` |
| Rail | `refund-management-rail` · 빈면 시 null/미렌더 계약 |
| Row height | `__cta` / `__row-menu` → 36px 토큰 |
| CTA branch | unreflected primary / reflected ghost 문자열·variant |
| Hub | FinancialRefundHubTabs 존재 · `mg-v2-ad-b0kla__pill-toggle` 없음 |
| Reflect URL | `reflect-erp-refund` 문자열 유지 |

---

## 11. CLINIC_OS_REMAINING_SCREENS 갱신 메모 (ALIGNED 후보)

**대상 문서**: `docs/design-system/CLINIC_OS_REMAINING_SCREENS.md`

| 항목 | 메모 |
|------|------|
| 라우트 | `/erp/refund-management` |
| 컴포넌트 | `RefundManagement` |
| 핸드오프 | 본 문서 — Critic PASS TO-BE |
| 상태 제안 | 구현·lock test PASS 후 **ALIGNED 후보** → ALIGNED 표로 이동 |
| 현재(문서 작성 시점) | LEGACY/PARTIAL(B0KlA ContentArea · 4카드 · always-on 블록). P1 #10「Financial leftovers — RefundHub」와 **연계**: 허브 탭 Clinic-OS 정리 + 본 페이지 크롬 ALIGNED가 한 배치로 닫히면 P1 #10에서 RefundHub 잔여를 축소 |
| Out of scope 혼동 방지 | `/erp/financial` 페이지 크롬 ALIGNED ≠ 환불 관리 페이지 ALIGNED. 본 핸드오프 구현 전까지 환불 관리는 ALIGNED 표에 넣지 **말 것** |
| 완료 조건 | §10 checklist + chrome lock test green · B0KlA diff 0 on page |

코더 완료 후 인벤토리 갱신 예시 행:

```text
| 환불 관리 | `/erp/refund-management` | `RefundManagement` | QuietHeader+3-cell+rail+__stage. [REFUND_MANAGEMENT_CLINIC_OS_HANDOFF](./REFUND_MANAGEMENT_CLINIC_OS_HANDOFF.md) |
```

---

## 12. 참조

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` — opening contract
- `docs/design-system/SALARY_MANAGEMENT_CLINIC_OS_HANDOFF.md` — quiet + strip + todo + stage + §10
- `docs/design-system/OPS_APPROVAL_CENTER_CLINIC_OS_HANDOFF.md` — inbox twin · 36px · lock test
- `docs/design-system/CLINIC_OS_REMAINING_SCREENS.md` — ALIGNED 큐
- `frontend/src/components/erp/RefundManagement.js` · `refund-management/*`
- `frontend/src/components/erp/financial/FinancialRefundHubLayout.js`
- `frontend/src/components/erp/purchase/PurchaseQuietHeader.js` · `PurchaseSummaryStrip.js`
- `frontend/src/components/erp/salary/SalaryQuietHeader.js` · `SalarySummaryStrip.js`
- `frontend/src/components/erp/organisms/moneyCockpit/MoneyTodoList.js`
- `frontend/src/components/common` — `EntityRowActions`, `SegmentedTabs`, `TabChipRow`, `MGButton`
- `frontend/src/styles/tokens/design-v2-tokens.css` — `--mg-v2-color-money-expense: #1D4ED8`
- API (불변): `refund-statistics` · `refund-history` · `erp-sync-status` · `POST …/reflect-erp-refund`

---

**요약 (코더 한 줄)**: `/erp/refund-management`는 「환불 관리」quiet chrome + expense-blue「환불 금액」3-cell + ERP 미반영 레일 + **list에서 미반영「ERP 반영」primary / 반영됨「열기」ghost**가 primary이고, 사유·ERP·회계는 ⋮/collapsible 2nd stage다. API·reflect URL 불변.
