# `/erp/financial` 운영자 장부 — Critic PASS UI/UX 스펙

**문서 버전**: 1.0.0  
**작성일**: 2026-09-08  
**담당**: core-designer (시각·레이아웃·디자인 시스템 스펙만 · 제품 UI 코드 작성 없음)  
**라우트**: `/erp/financial` (Canonical) · `/admin/erp/financial` (Query 보존 Redirect)  
**브랜드**: Core Solution Clinic-OS  
**대상 사용자**: 상담센터 센터장/원장(운영자) — 회계사 아님  
**우선순위**: **본 문서(Critic PASS) > Phase 2 스펙 > Clinic-OS SSOT** (충돌 시 Critic 우선)

---

## 0. 우선순위 · 충돌 해소

| 소스 | 역할 |
|------|------|
| **본 문서 (Critic PASS)** | 레이아웃 블록 순서, CTA/⋮ 높이 36, Income/Expense 색 alias, Remaining 음수 ink, 카피(장부/기간 기록 · 차트), MoneyFlowStage compose-only |
| `CLINIC_OS_ADMIN_VISUAL_SSOT.md` | 기본 Clinic-OS 언어(paper, 4-step type, teal primary, no Pencil/B0KlA). **Critic과 충돌하면 Critic 승** |
| `SCREEN_SPEC_OPERATOR_LEDGER_PHASE2.md` | 역사 스펙. 본 문서가 대체하는 항목(제목·블록 순서·남은 돈 음수색·CTA 높이·차트 위치)은 **무시** |

**Explicit Critic overrides of SSOT / Phase2**

| 항목 | SSOT / Phase2 | Critic PASS (적용) |
|------|---------------|-------------------|
| 페이지 제목 | 「들어온 돈 · 나간 돈」 / 현재 문자열 「이번 달 돈」 | **「장부」** |
| 서브타이틀 | 테넌트 서브 금지 또는 장문 설명 | **「기간 기록 · 차트」** (quiet caption) |
| Primary CTA 높이 | ~40px desktop | **36px** (⋮와 동일 행·정렬) |
| CTA variant | solid ~40 또는 현 ghost | **`MGButton` solid primary** dusty teal |
| Income / Expense 숫자색 | calendar: semantic-error / info (`#A84848` / `#0284C7`) | Strip·장부 money polarity: **Income `#B91C1C` · Expense `#1D4ED8`** via **ledger-scoped alias** (컴포넌트 raw hex 금지) |
| Remaining 음수 | danger / semantic-error | **`--mg-v2-color-text-primary` (`#0F172A`)** — 위험 빨강 아님 |
| 블록 순서 | Header → Strip → (패널들) → Filter+Table | Header → Strip → **Chart** → **Table stage** (패널은 끼우지 않음) |
| 차트 | Phase2에 없음 / dashboard only | **기존 `MoneyFlowStage`만** compose. 신규 차트 금지 |

---

## 1. 개요 및 배경

### 1.1 사용성
운영자/센터장이 **기간 단위**로 **들어온 / 나간 / 남은**을 보고, **히스토리 차트·표**로 기록을 읽는다.  
흐름: 기간 선택 → 합계(strip) → 추세(chart) → 목록(table) → (필요 시) 돈 기록.

### 1.2 「이번 달 돈」과의 차별화

| | `/erp/dashboard` 「이번 달 돈」 | `/erp/financial` 「장부」 |
|--|-------------------------------|---------------------------|
| 질문 | 이번 달 돈이 어떻게 되지? | 이 **기간** 기록이 어떻게 되지? |
| 초점 | 콕핏·히어로·지금 손볼 일 | **기간 기록 · 차트 · 표** |
| 차트 | MoneyFlowStage가 콕핏 일부 | 동일 organism을 **장부 본문 3번 슬롯**에 compose |
| 표 | 보조/딥링크 | **메인 stage** (필터는 stage 크롬) |

장부 페이지 제목·aria에 「이번 달 돈」을 쓰지 않는다. 대시보드 전용 카피다.

### 1.3 정보 노출
- **Strip 3셀**: 들어온 / 나간 / 남은. 「순이익」「건」 금지.
- **남은 음수**: ink (`--mg-v2-color-text-primary`). 위험 빨강·danger 토큰 금지.
- **차트**: 기존 `MoneyFlowStage`만. 범례·시리즈 라벨·평균선·축 포맷은 **기존 OFD_CHART / MoneyFlowStage 규칙 유지**. 신규 차트 타입·포크 금지.
- **카피**: 이 페이지에 「매칭」이 있으면 **「배정」**으로 통일.

---

## 2. 레이아웃 구조 (Critic PASS — Phase2보다 우선)

### 2.1 블록 순서 ASCII (Top → Bottom)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 1. Quiet header                                                              │
│    [장부]  기간 기록 · 차트     [이번달|지난달|올해]   [돈 기록 CTA] [ ⋮ ]   │
│    h1 + subtitle(caption) + period chips + solid CTA(36) + overflow(36)       │
├──────────────────────────────────────────────────────────────────────────────┤
│ 2. Summary strip (3 equal cells)                                             │
│    [ 들어온 ]          [ 나간 ]           [ 남은 ]                            │
│    income alias        expense alias      remaining (음수=ink)                │
├──────────────────────────────────────────────────────────────────────────────┤
│ 3. Chart stage                                                               │
│    MoneyFlowStage only (import/compose · 기존 범례·라벨)                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ 4. Table stage                                                               │
│    ┌─ stage chrome ───────────────────────────────────────────────────────┐  │
│    │ 필터(검색·유형·카테고리·직접기간) + 뷰토글(테이블|달력)  ← 표 직전만 │  │
│    ├──────────────────────────────────────────────────────────────────────┤  │
│    │ LedgerTable | LedgerCalendar (동일 stage 기하)                        │  │
│    └──────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────────┤
│ 5. Secondary / folded (후순위 — strip↔chart · chart↔table 사이에 끼우지 말 것)│
│    · MoneyTodoList(지금 손볼 일)                                              │
│    · MonthlyRecurringExpensesPanel(월반복)                                    │
│    · CardMerchantFeeSettingsPanel(수수료)                                     │
│    · TaxDisclosure(세무사용 자료)                                             │
│    → 표 아래 · 접힘 · 또는 ⋮ 메뉴로 이동. 1차 시야에 끼워 넣지 않음.          │
└──────────────────────────────────────────────────────────────────────────────┘
Page paper: --mg-v2-color-neutral-50 (#FAF9F7)
```

### 2.2 끼움 금지 (Hard)

다음을 **strip ↔ chart** 또는 **chart ↔ table** 사이에 두지 않는다.

- `MoneyTodoList`
- `MonthlyRecurringExpensesPanel`
- `CardMerchantFeeSettingsPanel`
- 기타 Todo / 월반복 / 수수료 / 세무 disclosure

허용 위치: **table stage 아래**, **기본 접힘**, 또는 **헤더 ⋮ overflow**의 후순위 항목.

---

## 3. 세부 UI/UX 스펙

### 3.1 Quiet header (`LedgerQuietHeader` 갱신 계약)

| 요소 | 스펙 |
|------|------|
| **Title** | `장부` — `var(--mg-v2-font-size-h1)` · weight 700 · `var(--mg-v2-color-text-primary)` |
| **Subtitle** | `기간 기록 · 차트` — `var(--mg-v2-font-size-caption)` · `var(--mg-v2-color-text-secondary)` · 제목 바로 아래 또는 제목 우측 quiet 한 줄. 테넌트명·「(테넌트: …)」 금지 |
| **Period chips** | `이번 달` \| `지난달` \| `올해` — 기존 `BadgeSelect` / `FM_PERIOD_HEADER_OPTIONS`. 「직접」은 **table stage 필터 크롬**에만 |
| **Primary CTA** | `돈 기록` — `MGButton` **variant solid primary** · fill `var(--mg-v2-color-primary-solid)` (`#0E5F5A`) · label `#FAF9F7` / paper on solid |
| **Overflow ⋮** | 보조 진입(월반복·수수료·세무 등). ghost/icon `MGButton` 또는 기존 `EntityRowActions` 패턴. **페이지 primary가 아님** |

#### CTA / ⋮ 높이 36 계약 (Critic > SSOT ~40)

```
Header actions row
─────────────────────────────────────────
  [ 돈 기록 ]     [ ⋮ ]
     ↑               ↑
  height 36px     height 36px
  same baseline · align-items: center
  radius: var(--mg-v2-radius-md) (10px 계열 유지 시 SSOT radius-md)
─────────────────────────────────────────
```

- Desktop: CTA와 ⋮ **동일 행**, `align-items: center`, **height 36**.
- SSOT 「~40px」보다 **Critic 36 우선**.
- Mobile: CTA full-width 허용 시 touch는 `--mg-v2-component-touch-target` / 44px 가능. ⋮는 CTA와 **시각 높이 정렬** 유지(아이콘 버튼 36 유지 후 터치 패딩으로 확대 가능).
- 구현 힌트(스펙): ledger 스코프 유틸 클래스 예) `.operator-ledger-header__action--critic-36` → `min-height: 36px; height: 36px;` — **컴포넌트 파일에 raw `#0E5F5A` 금지**, 토큰만.

현재 `LedgerQuietHeader`의 ghost CTA는 **solid primary + 36**으로 교체하는 것이 Critic 계약이다.

### 3.2 Summary strip (3 cells)

| 셀 | 라벨 | 금액색 |
|----|------|--------|
| 1 | 들어온 (또는 `들어온 돈`) | `var(--mg-v2-ledger-color-income)` → `#B91C1C` |
| 2 | 나간 (또는 `나간 돈`) | `var(--mg-v2-ledger-color-expense)` → `#1D4ED8` |
| 3 | 남은 (또는 `남은 돈`) | 양수: `var(--mg-v2-color-text-primary)` 또는 primary ink · **음수: 반드시 `var(--mg-v2-color-text-primary)` (`#0F172A`)** |

- 그리드: `repeat(3, 1fr)` · surface + hairline · **좌측 4px accent 금지** · 아이콘 타일 금지.
- 금액: `formatKrw` / `formatWonAmount` · `tabular-nums` · h2 스케일 · 「건」 금지.
- Phase2의 「남은 돈 음수 = danger」및 현 CSS `.operator-ledger-summary__amount--remaining-negative { semantic-error }`는 **Critic에서 폐기**.

### 3.3 Chart — `MoneyFlowStage` import / compose 계약

| 규칙 | 내용 |
|------|------|
| **Import** | `frontend/src/components/erp/organisms/moneyCockpit/MoneyFlowStage.js` **그대로** import |
| **Compose** | `.operator-ledger` 블록 3번 슬롯에 배치. 래퍼는 stage 카드 기하(border 1px neutral-300, radius-lg, paper/surface)만 |
| **Fork 금지** | `MoneyFlowStage` 복제·신규 bar/line 차트 organism 금지 |
| **수정 범위** | moneyCockpit **파일 수정은 최소화**. 색이 Critic income/expense와 어긋나면 **장부 스코프 CSS 변수 오버레이** 또는 토큰 레이어 alias로 해결(컴포넌트 raw hex 금지) |
| **범례·라벨** | 기존 유지: `OFD_CHART.SERIES_INCOME`(`들어옴`) / `SERIES_EXPENSE`(`나감`) / `SECTION_TITLE`(`최근 12개월`) / 월 평균 점선·캡션 · bar value labels ≥12px |
| **Props** | 기존 `{ loading, series }` 계약. series: `{ label, income, expense, … }` |
| **Empty/Loading** | 기존 EmptyState / UnifiedLoading |

### 3.4 Table stage

- **필터**: stage **크롬**으로 **표(또는 달력) 직전**에만. `LedgerInlineFilter` + view toggle.
- **본문**: `LedgerTable` 기본 · `LedgerCalendar` 토글. 동일 `.operator-ledger-stage` 기하 · min-height ~36rem · 단차 금지.
- Calendar money 색: SSOT calendar contract와 Critic strip alias가 다를 수 있음. **Strip/표 polarity는 Critic alias**. Calendar 셀은 기존 calendar contract를 따르되, 장부 페이지 전체에서 income/expense **인지 색이 어긋나면 Critic alias로 정렬**을 코더 체크리스트에 넣는다.
- Empty: `EmptyState`, 이모지 없음.

### 3.5 Secondary panels (후순위)

| 패널 | 위치 |
|------|------|
| MoneyTodoList | table 아래 또는 ⋮ · **끼움 금지** |
| MonthlyRecurringExpensesPanel | 접힘 / ⋮ / table 아래 |
| CardMerchantFeeSettingsPanel | 접힘 / ⋮ / table 아래 |
| TaxDisclosureSection | 최하단 disclosure |

---

## 4. 토큰표 (Clinic-OS + ledger-scoped alias)

Hex는 **참고**. 구현은 **토큰/alias만**. 컴포넌트 JS/CSS에 Critic hex raw 금지 → **`.operator-ledger` 스코프 alias 레이어**.

### 4.1 페이지 · 크롬

| 역할 | 토큰 | Hex 참고 | 비고 |
|------|------|----------|------|
| Page paper | `--mg-v2-color-neutral-50` | `#FAF9F7` | |
| Surface | `--mg-v2-color-neutral-100` | `#F5F3EF` | strip / stage |
| Hairline | `--mg-v2-color-neutral-300` | `#D4CFC8` | |
| Text primary (ink) | `--mg-v2-color-text-primary` | `#0F172A` | 제목 · **남은 음수** |
| Text secondary | `--mg-v2-color-text-secondary` | `#475569` | subtitle · 라벨 |
| CTA fill | `--mg-v2-color-primary-solid` | `#0E5F5A` | solid MGButton |
| CTA hover | `--mg-v2-color-primary-dark` | `#0A4F4B` | |
| CTA label | paper / `#FAF9F7` | `#FAF9F7` | solid 위 |
| Radius | `--mg-v2-radius-md` / `--mg-v2-radius-lg` | — | stage lg |
| Space | `--mg-v2-space-*` | — | |

### 4.2 Ledger-scoped money polarity alias (Critic)

`.operator-ledger` (또는 design-tokens의 ledger scope)에 **alias만** 정의:

| Alias | 값 (참고) | 사용처 |
|-------|-----------|--------|
| `--mg-v2-ledger-color-income` | `#B91C1C` | Strip 들어온 · 표 수입 강조(해당 시) · MoneyFlowStage income fill가 장부에서 읽히도록 스코프 오버레이 |
| `--mg-v2-ledger-color-expense` | `#1D4ED8` | Strip 나간 · 표 지출 강조(해당 시) · chart expense |
| `--mg-v2-ledger-color-remaining-negative` | `var(--mg-v2-color-text-primary)` | 남은 음수 **전용** (= ink, 위험 빨강 아님) |

**금지**: `MoneyFlowStage.js` / `LedgerSummaryStrip.js` 등에 `#B91C1C` / `#1D4ED8` 문자열 하드코딩.

전역 `--mg-v2-color-semantic-error`(`#A84848`)를 Critic income으로 재정의하지 않는다. **ledger scope alias**로만 분리.

### 4.3 4-step type (추가 크기 금지)

| Step | 토큰 | 용도 |
|------|------|------|
| h1 | `--mg-v2-font-size-h1` | `장부` |
| h2 | `--mg-v2-font-size-h2` | strip 금액 · chart section title(기존) |
| body-md | `--mg-v2-font-size-body-md` | 표 · 버튼 라벨 |
| caption | `--mg-v2-font-size-caption` | `기간 기록 · 차트` · strip 라벨 |

Font stack: `--mg-v2-font-family-base`. Pencil/B0KlA forest `#3D5246` · 좌측 accent bar **금지**.

---

## 5. 아토믹 계층 · 공통 모듈

| 계층 | 컴포넌트 | 재사용 |
|------|----------|--------|
| Atom | `MGButton`, `BadgeSelect`, `KpiNumeral`, `EmptyState`, `UnifiedLoading` | 필수 재사용 |
| Atom/Molecule | Overflow ⋮ — `EntityRowActions` / ghost icon `MGButton` | 신규 메뉴 원자 남발 금지 |
| Organism | `LedgerQuietHeader`, `LedgerSummaryStrip`, `MoneyFlowStage`, `LedgerInlineFilter`, `LedgerTable`, `LedgerCalendar` | MoneyFlowStage는 **moneyCockpit 공유** |
| Organism (secondary) | `MoneyTodoList`, `MonthlyRecurringExpensesPanel`, `CardMerchantFeeSettingsPanel`, `TaxDisclosureSection` | 후순위 슬롯만 |
| Organism | `MoneyRecordModal` + `UnifiedModal` | CTA 오픈 |
| Template/Page | `FinancialManagement` / Operator Ledger page in `AdminCommonLayout` | |

신규 차트 organism · 신규 summary 카드 레일 · B0KlA import **금지**.

---

## 6. 상호작용 · 상태

| 상태 | 표시 |
|------|------|
| Loading | strip/chart/table 각 슬롯 inline loading · 전체 깜빡임 최소화 |
| Empty chart | 기존 MoneyFlowStage EmptyState |
| Empty table | 「선택한 기간에 등록된 내역이 없습니다.」 + 돈 기록 유도 |
| Remaining &lt; 0 | `-1,200,000원` · **ink** (`--mg-v2-color-text-primary`) |
| Error | SafeErrorDisplay + 다시 시도 `MGButton` outline |
| ⋮ open | 월반복·수수료·세무 등 secondary만 · primary CTA와 경쟁 금지 |

---

## 7. 대시보드 차별화 (코더 주의)

1. `/erp/dashboard` = 「이번 달 돈」 콕핏. `/erp/financial` = 「장부」 기간 기록·차트·표.
2. 장부 `FM_PAGE_TITLE` 계열을 「이번 달 돈」으로 두지 말 것 → **「장부」**.
3. 장부 subtitle = **「기간 기록 · 차트」**.
4. Todo/믹스 패널을 장부 1차 시야(strip–chart–table)에 끼우지 말 것 — 대시보드 워크벤치 패턴과 분리.
5. MoneyFlowStage는 **공유 compose**; 대시보드 전용 카피로 장부 헤더를 덮지 말 것.

---

## 8. 금지 목록

1. 신규 차트 / MoneyFlowStage 포크  
2. Strip↔Chart · Chart↔Table 사이 Todo·월반복·수수료 패널  
3. 컴포넌트 raw hex (`#B91C1C`, `#1D4ED8`, `#0E5F5A` 등) — 토큰·ledger alias만  
4. Remaining 음수에 semantic-error / danger / 위험 빨강  
5. Pencil / B0KlA 좌측 accent · forest primary `#3D5246`  
6. 「순이익」「건」·페이지 카피 「매칭」(→「배정」)  
7. 제목을 「이번 달 돈」으로 유지  
8. CTA ghost-only를 primary로 유지 · CTA/⋮ 높이 불일치(Critic 36 미준수)  
9. 4-step 밖 타이포 · 이모지 Empty  

---

## 9. 코더 체크리스트 (core-coder)

### 9.1 레이아웃
- [ ] 블록 순서: **Quiet header → Summary strip → MoneyFlowStage → Table stage** (필터는 stage 크롬·표 직전)
- [ ] Todo / 월반복 / 수수료가 strip↔chart 또는 chart↔table **사이에 없음** (아래·접힘·⋮)
- [ ] Tax disclosure는 하단 후순위

### 9.2 Quiet header · CTA/⋮ 36
- [ ] 제목 **「장부」** · 서브 **「기간 기록 · 차트」**
- [ ] 기간칩 3개 + **solid primary** `돈 기록` + **⋮**
- [ ] CTA·⋮ **height 36** · 동일 행 정렬 (Critic > SSOT ~40)
- [ ] CTA 색: `var(--mg-v2-color-primary-solid)` (`#0E5F5A`) — raw hex 없음

### 9.3 Strip · 색
- [ ] 3셀: 들어온 / 나간 / 남은
- [ ] Income → `--mg-v2-ledger-color-income` (`#B91C1C` alias)
- [ ] Expense → `--mg-v2-ledger-color-expense` (`#1D4ED8` alias)
- [ ] Remaining 음수 → `--mg-v2-color-text-primary` (ink) · danger 아님
- [ ] 좌측 4px accent · 아이콘 타일 없음

### 9.4 MoneyFlowStage
- [ ] 기존 organism **import/compose만** · 신규 차트 없음
- [ ] 범례·라벨·평균선·OFD_CHART 규칙 유지
- [ ] 색 조정 시 ledger-scoped alias / CSS 변수 — 컴포넌트 raw hex 금지
- [ ] moneyCockpit 불필요 수정 최소화

### 9.5 Table stage · 카피 · 차별화
- [ ] 필터는 표 직전 stage 크롬만
- [ ] 페이지 내 「매칭」→「배정」
- [ ] 「이번 달 돈」과 제목/역할 혼동 없음 (장부 = 기간 기록·차트·표)
- [ ] paper `#FAF9F7` 토큰 · 4-step type · no Pencil/B0KlA

### 9.6 공통
- [ ] `MGButton` / `UnifiedModal` / `EmptyState` / `BadgeSelect` 재사용
- [ ] `formatKrw` · tabular-nums · 「순이익」「건」 없음
- [ ] `AdminDashboardB0KlA.css` 신규 import 없음

---

## 10. 참조

| 문서 / 파일 | 용도 |
|-------------|------|
| `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` | Clinic-OS 기본 (Critic 충돌 시 Critic) |
| `docs/design-system/SCREEN_SPEC_OPERATOR_LEDGER_PHASE2.md` | Phase2 역사 — 본 문서가 레이아웃·카피·색 우선 |
| `frontend/src/components/erp/organisms/moneyCockpit/MoneyFlowStage.js` | 차트 compose 계약 |
| `frontend/src/components/erp/financial/ledger/LedgerQuietHeader.js` | Quiet header 갱신 대상 |
| `frontend/src/components/erp/financial/ledger/OperatorLedger.css` | 스코프·alias·remaining-negative 수정 대상(구현 시) |
| `frontend/src/constants/operatorFinanceDashboardStrings.js` | `OFD_CHART` 범례·라벨 SSOT |
| `frontend/src/constants/financialManagementStrings.js` | 장부 문자열(제목·서브 갱신) |
| `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` | 공통 모듈 우선 |
| `docs/design-system/ATOMIC_DESIGN_SYSTEM.md` | 아토믹 계층 |

---

## 11. 산출 범위

- **본 문서만** 디자인 산출물. 제품 UI 코드 변경은 **core-coder** 후속.
- 디자이너는 HTML/CSS/JS를 작성하지 않는다.
