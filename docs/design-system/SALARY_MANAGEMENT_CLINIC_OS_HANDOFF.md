# 상담사 지급 (`/erp/salary`) Clinic-OS TO-BE UI/UX 스펙 (Design Handoff)

**역할**: core-designer · **코드 작성 금지** (구현은 core-coder)  
**대상**: `/erp/salary` (`SalaryManagement`)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`  
**OFD/SSOT 카피**: `frontend/src/constants/operatorFinanceDashboardStrings.js` (`OFD_LINKS.SALARY` = 「상담사 지급」)  
**상태**: **Critic PASS 후 TO-BE** — 본 문서가 `/erp/salary` 비주얼·IA·카피의 **단일 핸드오프**.  
**폐기**: 이전 AS-IS chrome 요약(등록 프로필 / 계산 완료 / 지급 총액·expense blue · 탭 지배 · 카드 히스토리)은 **superseded**. 구현 기준은 아래 TO-BE만.

**트윈(크롬만)**: `/erp/purchase` quiet header + summary strip · `/erp/financial` MoneyTodoList strip  
**범위**: Frontend chrome / layout / IA / copy / CSS class.  
**Non-goals**: 백엔드 급여·원천세 계산 SSOT·세율 변경, STAFF fail-closed 완화, 장부/이번달돈 금액 polarity 변경.

---

## 1. 개요·배경

운영자가 **승인·지급**을 한 화면에서 끝내는 것이 primary job이다.  
AS-IS는 KPI(프로필/계산건수/지급총액 blue)·탭·계산 미리보기가 1st viewport를 경쟁하고, 히스토리가 카드·탭 중심이며, 「지급」 FE CTA·⋮·할 일 strip이 없다.  
TO-BE는 Clinic-OS quiet chrome + **list/approve/pay SSOT**로 재구성하고, 계산 상세는 2nd stage로만 둔다.

---

## 2. 레이아웃 블록 다이어그램 (위→아래)

```
AdminCommonLayout
└─ ContentArea
   └─ ErpPageShell (.salary-management-shell.salary-management--clinic-os)
      ├─ headerSlot: SalaryQuietHeader
      │     h1「상담사 지급」 + ghost tools (기산일/급여 설정 · 새로고침)
      │     ※ ContentHeader / 영문 서브타이틀 / ErpFilterToolbar 페이지 크롬 금지
      └─ children: .salary-management
         ├─ 1) SalarySummaryStrip — **3 cells**
         │     [지급 예정 ₩] | [공제 ₩] | [승인대기 n건]
         ├─ 2) 「할 일」 strip — MoneyTodoList / useMoneyTodoStrip 패턴 재사용
         │     (빈면이면 섹션 자체 미렌더 — MoneyTodoList null 계약과 동일)
         └─ 3) Main stage (.salary-management__stage) — **primary SSOT**
               ├─ toolbar: 기간·상담사 필터 + ghost「계산」(2nd stage entry) + (선택) 프로필 진입
               └─ list/table: 행 = 상담사·기간·실지급·상태뱃지 · CTA「승인」|「지급」 · ⋮
                     └─ 2nd stage (overlay/drawer/panel — not competing primary):
                           계산 미리보기·세금 상세·확정 · 행 ⋮「계산」에서만
```

**IA 원칙**

| 계층 | 콘텐츠 | 규칙 |
|------|--------|------|
| Primary | 목록/테이블 + 승인/지급 | 첫 본문 stage의 **유일한** 주 콘텐츠. 탭으로 프로필·계산·세금을 동등 경쟁시키지 않음 |
| Secondary strip | 할 일 | OFD/장부 트윈. 금액 0·팩트 없으면 숨김 |
| 2nd stage | 계산 상세 | toolbar 「계산」 또는 행 ⋮「계산」만. 탭 3분할로 primary 자리 차지 금지 |
| Tools | 기산일/설정·새로고침 | quiet header ghost만. 페이지 primary solid CTA로 올리지 않음 |

---

## 3. 컴포넌트 인벤토리 (재사용 우선)

### 3.1 Template / Shell

| 계층 | 컴포넌트 | 재사용 |
|------|----------|--------|
| Template | `AdminCommonLayout` + `ContentArea` + `ErpPageShell` | 필수 |
| Organism | `SalaryQuietHeader` | 유지·카피/aria만 TO-BE |
| Organism | `SalarySummaryStrip` | **셀 의미·색 재정의** (아래 §5) |
| Organism | `MoneyTodoList` + hook `useMoneyTodoStrip` | **재사용 권장** (장부/OFD와 동일 패턴). salary 전용 복제 금지 |
| Organism | Main stage list/table | 신규 배치: 카드 히스토리 → **테이블(또는 ListTableView)** |
| Molecule | `EntityRowActions` (⋮) — `MappingEntityRowActions` 패턴 | overflow SSOT. salary 행 전용 래퍼만 |
| Atom | `MGButton` solid primary / ghost | dusty teal primary. danger = 삭제만 |
| Atom | `KpiNumeral`, `EmptyState`, `UnifiedLoading`, `UnifiedModal` | 기존 |

### 3.2 모달 (크롬만 · 로직 non-goal)

`SalaryConfigModal` / `SalaryProfileFormModal` / `TaxDetailsModal` / `SalaryExportModal` / `ConsultantProfileModal` — 이번 배치 **필수 리스타일 아님**(P1 잔여 가능). 페이지 크롬에서 B0KlA class 유입 금지.

### 3.3 공통 모듈 검토 결과

- **재사용**: AdminCommonLayout, ErpPageShell, MGButton, EntityRowActions, MoneyTodoList, useMoneyTodoStrip, EmptyState, UnifiedModal, KpiNumeral  
- **신규 organism 금지**: salary-only todo list / custom overlay approve shell  
- **탭**: `TabChipRow`를 primary IA로 쓰지 않음. 프로필·세금은 stage 내 secondary 진입(툴바/⋮/설정)으로 이동

---

## 4. 정확한 한국어 카피 테이블

### 4.1 제목·aria (영문 서브타이틀 금지)

| 키 (권장 상수) | TO-BE 카피 | 비고 |
|----------------|------------|------|
| `SM_PAGE_TITLE` | **상담사 지급** | AS-IS「급여 관리」폐기. OFD `OFD_LINKS.SALARY.label`과 정렬 |
| `SM_PAGE_TITLE_ID` | `salary-management-page-title` | 유지 |
| `SM_MAIN_ARIA_LABEL` | **상담사 지급 콘텐츠** | AS-IS「급여·세금 관리 콘텐츠」폐기 |
| Header `aria-label` | **상담사 지급** | h1과 동일 |
| `SM_HEADER_TOOLS_ARIA` | 상담사 지급 도구 | |
| `SM_CONFIG_CTA` / aria | 기산일/급여 설정 · (aria 동일 취지) | ghost |
| `SM_REFRESH_CTA` / aria | 목록 새로고침 | ghost |
| LNB `menuItems` label | **상담사 지급** | AS-IS「급여 관리」→ 정렬. `#879`「매칭」→「배정」이 LNB/이 화면에 보이면 **배정** |

### 4.2 Summary strip

| 셀 | 라벨 | 값 | 단위 |
|----|------|-----|------|
| 1 | **지급 예정** | 기간 내 미지급(및 지급 예정 대상) 상담사 **실지급(net) 합** | 원 (`formatKrw` / `formatWonAmount`) |
| 2 | **공제** | 동일 범위 **원천 공제(국세+지방세) 합** | 원 |
| 3 | **승인대기** | `CALCULATED` 건수 | 건 |

- Band aria: **상담사 지급 요약**  
- 금액에 `건` 금지. 건수 셀만 `건`.

### 4.3 「할 일」 strip

| 항목 | 카피 |
|------|------|
| 섹션 제목 | **할 일** (페이지 로컬) 또는 OFD와 통일 시 **지금 할 일** — **한 페이지 내 단일 선택**. 권장: 장부 트윈과 맞추려면 `OFD_WORKBENCH.TODO_TITLE`(지금 할 일). Critic 방향이 짧은 운영 카피면 **할 일** 채택 가능 — 코더는 상수 한곳으로만. |
| dense facts | OFD 규칙: 급여일·원천세 신고·사업자 확인 등. **합산「3.3%」문자열 금지** |
| 원천 코멘트 | `원천징수 국세 {n}원 · 지방세 {m}원` (`OFD_TODO_RULES` / `buildWithholdingStoredAmountComment`) |

### 4.4 상태 뱃지 (짧은 운영 라벨)

기존 상태머신 유지: `PENDING` → `CALCULATED` → `APPROVED` → `PAID` (`CANCELLED`).

| `SALARY_STATUS` | TO-BE 뱃지 | AS-IS (폐기) |
|-----------------|------------|--------------|
| `PENDING` | 대기 | 대기 |
| `CALCULATED` | **승인대기** | 계산완료 |
| `APPROVED` | **지급대기** (승인 직후 토스트만 **승인됨** 가능) | 승인완료 |
| `PAID` | **지급됨** | 지급완료 |
| `CANCELLED` | 취소 | 취소 |

리스트 뱃지는 **다음 행동**을 드러낸다: 계산됨→승인대기, 승인됨→지급대기.

### 4.5 행 CTA·⋮

| 상태 | Primary CTA | ⋮ (secondary) |
|------|-------------|----------------|
| `CALCULATED` | **승인** (`SALARY_ACTION_LABELS.APPROVE` 유지) | 계산 · 세금 상세 · 내보내기 · 인쇄 · 다시 계산(해당 시) |
| `APPROVED` | **지급** (신규 FE CTA · `POST .../pay/{id}` 연결은 코더; **카피만 본 스펙**) | 계산 · 세금 상세 · 내보내기 · 인쇄 · 다시 계산(해당 시) |
| `PAID` | CTA 없음 (또는 ghost 비활성 금지 — 빈 칸) | 세금 상세 · 내보내기 · 인쇄 · 빠진 회기 추가 정산(해당 시) |
| 그 외 | — | 조회성만 |

- ⋮ aria: **지급 행 작업** (영문 Matching 금지; LNB `#879`와 같이 **배정** 방향 — 이 화면에는「매칭」카피 넣지 않음)

### 4.6 빈·로딩·에러

| 상태 | 카피 |
|------|------|
| 목록 빈 | **지급할 내역이 없습니다.** (이모지 없음 · `EmptyState`) |
| 할 일 없음 | 섹션 미표시 |
| 로딩 | **불러오는 중…** (`SM_LOADING.INLINE` 유지 가능) |
| 승인/지급 실패 | 기존 서버 메시지 · 영문 enum 노출 금지 |

### 4.7 원천징수 카피 (UI only · 세율 변경 금지)

| 위치 | TO-BE | 금지 |
|------|-------|------|
| 라벨·breakdown | **국세 3%** · **지방세 0.3%** 분리 | UI에 단독 **「3.3%」** / 「합계 3.3%」를 주 라벨로 노출 |
| 상세 보조문 | 필요 시 「국세 3% + 지방세 0.3%」(분리 병기) | `TAX_BREAKDOWN_LABELS.withholdingTax`의 「합계 3.3%」, `SALARY_TAX_ROW_TYPE_LABELS.WITHHOLDING_TAX` 합산 표기, 프로필 모달「원천징수 3.3%만」등 — **이 화면·연결 카피 정리 대상** (백엔드 rate 불변) |
| OFD facts | 국세·지방세 금액 분리 | `3.3%` 문자열 |

---

## 5. 색·토큰 매핑 (strip cells)

### 5.1 Polarity 계약 ( Critic PASS )

| 셀 | 의미 | 색 (참고 hex) | 토큰 |
|----|------|---------------|------|
| **지급 예정** 금액 | 상담사에게 줘야 할 **net pay 합** = operator **owed** | `#B91C1C` | **`var(--color-red-700)`** (`frontend/src/styles/common/variables.css`에 존재). Clinic-OS 신규 시맨틱이 필요하면 `--mg-v2-color-money-owed` → `#B91C1C` 추가를 코더·토큰 PR에 제안. **`--mg-v2-color-semantic-info`(expense blue) 금지**. **`--mg-v2-color-semantic-error`(#A84848)로 대체하지 말 것** — owed red와 calendar income brick은 다름 |
| **공제** 금액 | 원천 합 | 본문/보조 | `var(--mg-v2-color-text-primary)` 숫자 · 라벨 `text-secondary`. 수입/지출 blue·red 미사용 |
| **승인대기** 건수 | 카운트 | 본문 | 동일 · 금액 polarity 색 없음 |
| 셀 크롬 | surface + hairline | — | `neutral-100`/`neutral-50` + `neutral-300` border. **좌측 4px accent 금지** · lucide 타일 금지 |

### 5.2 건드리지 말 것

- **장부 / 이번달돈**의 salary outflow 집계 **out blue** (제품 쪽 `#1D4ED8` 또는 해당 페이지 SSOT blue) — **변경 금지**  
- 이 페이지 strip의 「지급 예정」을 expense blue(`semantic-info` / `#0284C7` 등)로 칠하지 않음  
- MGButton primary = dusty teal `#0E5F5A` / `var(--mg-v2-color-primary-solid)` — 금액색과 무관

### 5.3 페이지 토큰 (Clinic-OS)

| 용도 | 토큰 |
|------|------|
| page / paper | `var(--mg-v2-color-neutral-50)` |
| surface | `var(--mg-v2-color-neutral-100)` |
| hairline | `var(--mg-v2-color-neutral-300)` |
| text | `var(--mg-v2-color-text-primary)` / `…-secondary` |
| type | 4-step only: h1 / h2 / body-md / caption · `--mg-v2-font-family-base` |
| spacing | `--mg-v2-space-*` |
| stage | border 1px neutral-300 · `--mg-v2-radius-lg` · min-height ~36rem |
| CTA/⋮ 높이 | **36px** — AS-IS `size="small"`/`--button-height-sm`(2rem=32) 폐기 대상. ExpectedVisitsWidget·Purchase card footer·MappingEntityRowActions는 `--button-height-sm` 정렬 패턴을 **따르되**, salary row는 **36**로 고정. 토큰 제안: `--mg-v2-component-height-row: 2.25rem` 또는 기존 변수에 36 매핑 후 `height/min-height/max-height` 동시 적용 (Purchase `__card-footer` 계약과 동일 패턴) |

---

## 6. 상호작용 — Primary vs 2nd stage calc

```
[목록이 SSOT]
  행 선택/스크롤 → 승인(CALCULATED) | 지급(APPROVED)
  ⋮ → 계산 | 세금 |보내기 | …

[계산 = 2nd stage]
  toolbar「계산」또는 ⋮「계산」
    → panel/drawer/modal: 대상 선택·미리보기·확정
    → 확정 성공 시 목록으로 복귀(CALCULATED 행 등장)
  ※ 계산 폼·미리보기를 stage 상단 고정 primary로 두지 않음
  ※ TabChipRow「프로필|계산|세금」동등 탭 IA 폐기
```

**승인 → 지급**

1. `CALCULATED` → CTA **승인** → 뱃지 **지급대기** (`APPROVED`)  
2. `APPROVED` → CTA **지급** → 뱃지 **지급됨** (`PAID`)  
3. 지급 FE가 AS-IS에 없으면 **추가**가 TO-BE 필수(백엔드 `POST /pay/{calculationId}` 이미 존재)

---

## 7. CSS 클래스 네이밍 (BEM · `salary-management--*`)

기존 `salary-management` / `salary-management--clinic-os` 유지. 신규·재의미 셀만 명시.

| 클래스 | 역할 |
|--------|------|
| `salary-management--clinic-os` | 페이지 lock modifier |
| `salary-management-header` / `__title` / `__action` | quiet header |
| `salary-management-summary` / `__cell` / `__label` / `__amount` | 3-cell strip |
| `salary-management-summary__amount--owed` | **지급 예정** red (`--color-red-700`) · AS-IS `--expense` **제거** |
| `salary-management-summary__cell--owed` | 선택 wash(8–12% color-mix of owed red) — loud fill 금지 |
| `salary-management-summary__amount--deduction` | 공제(중립) |
| `salary-management-summary__amount--pending-count` | 승인대기 건수 |
| `salary-management__todo` | MoneyTodoList 래퍼(필요 시) |
| `salary-management__stage` | main stage |
| `salary-management__toolbar` | 필터 + 「계산」 |
| `salary-management__table` / `__row` / `__actions` | primary list |
| `salary-management__cta` | 승인/지급 — height 36 토큰 |
| `salary-management__row-menu` | ⋮ EntityRowActions 스코프 — trigger 36 정렬 |
| `salary-management__badge` / `--awaiting-approval` / `--awaiting-pay` / `--paid` | 상태 뱃지 |
| `salary-management__calc-stage` | 2nd stage calc panel |

**금지 클래스**: `mg-v2-ad-b0kla*`, 좌측 accent utility, 페이지 스코프 hex one-off.

---

## 8. Non-goals

- 백엔드 급여·세금 **계산 SSOT**·절사 규칙·세율(3% / 0.3%) **변경**
- STAFF 권한 fail-closed **완화** (ADMIN-only finance 유지)
- `/erp/financial` · `/erp/dashboard`(이번달돈) outflow blue / income red 계약 변경
- 모달 내부 전부 Clinic-OS 리스타일(별 큐)
- Pencil/B0KlA forest primary·섹션 레일 재도입
- 회계 균등 탭(차변/대변) IA

---

## 9. AS-IS → TO-BE gap (구현 체크용)

| AS-IS | TO-BE |
|-------|-------|
| Strip: 등록 프로필 / 계산 완료 / 지급 총액(expense blue) | 지급 예정(owed red) / 공제 / 승인대기 |
| History = cards · tabs dominate | table/list primary · tabs 비1차 |
| 할 일 없음 | MoneyTodoList 패턴 |
| 지급 FE CTA 없음 | APPROVED → **지급** |
| ⋮ 없음 | EntityRowActions |
| CTA height 32 (`button-height-sm`) | **36** 정렬 |
| 합산 3.3% 라벨 | 국세 3% + 지방세 0.3% 분리 |
| 제목「급여 관리」(+ 세금 관리 aria) | **상담사 지급** |

---

## 10. Acceptance checklist (core-coder)

```text
[ ] Quiet header: AdminCommonLayout + ErpPageShell headerSlot · h1「상담사 지급」· 영문 서브타이틀 없음
[ ] aria/main: 「상담사 지급 콘텐츠」등 제목과 정합 · 「급여 · 세금 관리」잔존 없음
[ ] LNB/메뉴: 「상담사 지급」· 화면에 「매칭」카피 없음(필요 시「배정」)
[ ] Summary 3 cells: 지급 예정 / 공제 / 승인대기 — 좌측 4px bar·아이콘 타일 없음
[ ] 지급 예정 금액 = net pay sum · color var(--color-red-700)/#B91C1C · expense blue 클래스 제거
[ ] 장부/이번달돈 blue outflow 미변경
[ ] 「할 일」(또는 OFD「지금 할 일」) strip · MoneyTodoList/useMoneyTodoStrip 재사용 · 빈면 숨김
[ ] Primary stage = list/table + 승인/지급 · cards+equal tabs 1차 IA 아님
[ ] 계산 상세 = toolbar「계산」또는 행 ⋮ 만 (2nd stage)
[ ] CALCULATED → CTA「승인」· badge「승인대기」
[ ] APPROVED → CTA「지급」· badge「지급대기」(토스트「승인됨」허용)
[ ] PAID → badge「지급됨」· 지급 CTA 없음
[ ] 승인/지급/⋮ height 36 · 상호 정렬 (ExpectedVisits/Purchase/EntityRowActions 패턴)
[ ] MGButton primary = dusty teal #0E5F5A · 4-step type · paper neutral-50
[ ] 원천 UI: 국세 3% + 지방세 0.3% 분리 · 단독「3.3%」주라벨 없음 · 백엔드 rate 불변
[ ] EmptyState · 이모지 없음 · AdminDashboardB0KlA 신규 import 없음
[ ] STAFF fail-closed · admin-only 유지
[ ] Lock test 갱신: SalaryManagement.clinicOsChrome / salaryManagementClinicOsStrings
[ ] Hex soft-gate: 신규 CSS는 토큰 · owed red는 --color-red-700 또는 합의된 --mg-v2-color-money-owed만
```

---

## 11. 참조

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` — opening contract (type·buttons·layout)
- `frontend/src/constants/operatorFinanceDashboardStrings.js` — OFD_LINKS.SALARY, withholding prefixes
- `frontend/src/constants/salaryManagementClinicOsStrings.js` — chrome strings (TO-BE 갱신 대상)
- `frontend/src/constants/salaryConstants.js` — status machine · AS-IS labels (뱃지 카피 갱신 대상)
- `frontend/src/components/erp/salary/SalaryQuietHeader.js` · `SalarySummaryStrip.js`
- `frontend/src/components/erp/organisms/moneyCockpit/MoneyTodoList.js` · `hooks/useMoneyTodoStrip.js`
- `frontend/src/components/admin/mapping-management/molecules/MappingEntityRowActions.js` · `EntityRowActions`
- `frontend/src/components/dashboard-v2/ExpectedVisitsWidget.css` — row action height 정렬 계약
- `frontend/src/styles/common/variables.css` — `--color-red-700: #B91C1C`
- Backend pay: `POST /api/v1/admin/salary/pay/{calculationId}` (카피·CTA 노출만 본 스펙; 계산 로직 non-goal)

---

**요약 (코더 한 줄)**: `/erp/salary`는 「상담사 지급」 quiet chrome + owed-red「지급 예정」3-cell + 할 일 + **list에서 승인→지급**이 primary이고, 계산은 ⋮/툴바 2nd stage다.
