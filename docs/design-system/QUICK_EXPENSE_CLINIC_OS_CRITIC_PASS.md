# 나간 돈 기록 (`QuickExpenseForm`) Clinic-OS Critic PASS 핸드오프

**상태: Critic PASS** — 본 문서가 `QuickExpenseForm` 비주얼·IA·카피의 **단일 핸드오프**. 구현은 core-coder.  
**역할**: core-designer · **제품 UI 코드(JS/CSS/Java) 작성 금지** (구현은 core-coder)  
**대상 컴포넌트**: `frontend/src/components/erp/QuickExpenseForm.js` / `QuickExpenseForm.css`  
**단일 호출부**: `frontend/src/components/erp/IntegratedFinanceDashboard.js`  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`  
**우선순위 규약**: **Ledger Critic > Clinic-OS SSOT** (충돌 시 Critic 우선)  
**브랜치**: `cursor/quick-expense-clinic-os-f10a` · base `develop` · PR develop · **do not merge**

---

## 0. 우선순위·충돌 해소 (Critic > SSOT)

| 항목 | SSOT (`CLINIC_OS_ADMIN_VISUAL_SSOT.md`) | Ledger Critic 규약 (본 문서) | 충돌 해소 (**Critic > SSOT**) |
|------|-----------------------------------------|------------------------------|-------------------------------|
| **금액 색상 (Expense)** | `--mg-v2-color-semantic-info` (`#0284C7`) | `var(--mg-v2-color-money-expense)` (`#1D4ED8`) | **Critic 승**: 지출 금액은 `#1D4ED8` (`var(--mg-v2-color-money-expense)`). `semantic-info` 금지. |
| **CTA 높이** | ~40px | 36px (`var(--mg-spacing-36)`) | **Critic 승**: 등록 CTA 36px. |
| **모달 서페이스** | B0KlA 혼재 (`mg-v2-ad-b0kla`) | Clinic-OS Paper (`mg-v2-clinic-os`) | **Critic 승**: B0KlA / `--ad-b0kla-*` 제거. paper `neutral-50`. |
| **왼쪽 악센트 레일** | B0KlA 4px | 악센트 바 금지 | **Critic 승**: 4px 악센트 금지. |

---

## 1. 개요·배경 및 §0.4

### 1.1 목적
운영자(센터장)가 **나간 돈**을 공통코드 카테고리 칩 → 금액 → 등록으로 빠르게 기록한다.

### 1.2 §0.4
- **사용성**: Stage1 칩 → Stage2 금액(`autoFocus`) → 등록(teal 36).
- **정보 노출**: 제목/서브, 공통코드 칩, 선택 경로, 부가세 힌트, 금액, 에러/로딩. **비노출**: 결제수단 UI, 거래일 필드(오늘 기본값으로 제출).
- **레이아웃**: UnifiedModal paper. Stage1 칩 그리드 → Stage2 금액 + 취소/등록.

---

## 2. ASCII 레이아웃

### Stage 1
```text
┌───────────────────────────────────────────────┐
│ 나간 돈 기록                              [X] │
│ 공통코드 카테고리만                           │
├───────────────────────────────────────────────┤
│ [카테고리>하위] [카테고리>하위] …  (공통코드) │
│ (i) 버튼을 클릭하면 금액 입력창이 나타납니다  │
└───────────────────────────────────────────────┘
```

### Stage 2
```text
┌───────────────────────────────────────────────┐
│ 나간 돈 기록                              [X] │
│ 공통코드 카테고리만                           │
├───────────────────────────────────────────────┤
│ 대분류 > 소분류                               │
│ 부가세 포함 금액(원)을 입력하세요.            │
│ [ 금액 입력 ]  ← color money-expense #1D4ED8  │
│                         [취소] [등록 teal 36] │
└───────────────────────────────────────────────┘
```

---

## 3. 컴포넌트 인벤토리

| 계층 | 컴포넌트 | 규약 |
|------|----------|------|
| Modal | `UnifiedModal` | `title`/`subtitle`/`className="mg-v2-clinic-os"`/`size="medium"` |
| Atom | `MGButton` | chips secondary · cancel secondary · register primary teal h36 |
| Atom | `ErpSafeText` | 칩·선택 라벨 |
| Molecule | `SafeErrorDisplay` | inline |
| Atom | `UnifiedLoading` | inline codes loading |

신규 organism 금지.

---

## 4. 한국어 카피

| 위치 | TO-BE |
|------|-------|
| title | **나간 돈 기록** |
| subtitle | **공통코드 카테고리만** |
| Stage2 경로 | `<대분류> > <소분류>` |
| 일반 힌트 | 부가세 포함 금액(원)을 입력하세요. |
| 급여 힌트 | 금액(원)을 입력하세요. (급여는 부가세 없음) |
| placeholder | 금액 입력 |
| 취소 | 취소 |
| 등록 | 등록 |
| Stage1 info | 버튼을 클릭하면 금액 입력창이 나타납니다 (부가세 포함 금액 입력) |

문자열은 상수 파일로 분리해도 됨 (기존 financial/OFD 패턴).

---

## 5. 토큰

| 역할 | 토큰 | Hex 참고 |
|------|------|----------|
| Paper | `--mg-v2-color-neutral-50` | `#FAF9F7` |
| Border | `--mg-v2-color-neutral-300` | |
| Text primary | `--mg-v2-color-text-primary` | |
| Text secondary | `--mg-v2-color-text-secondary` | |
| Amount | **`--mg-v2-color-money-expense`** | **`#1D4ED8`** |
| CTA fill | `--mg-v2-color-primary-solid` | `#0E5F5A` |
| CTA hover | `--mg-v2-color-primary-dark` | `#0A4F4B` |
| CTA height | **`--mg-spacing-36`** | 36px |

컴포넌트 raw hex 금지. `semantic-info`를 money로 쓰지 말 것.

---

## 6. 상호작용

1. GET `/api/v1/erp/common-codes/financial` → chips (API only)
2. Chip → Stage2, amount autofocus
3. Cancel → Stage1
4. Submit POST `/api/v1/erp/finance/quick-expense?category&subcategory&amount&description&transactionDate` (`transactionDate`=오늘)
5. **paymentMethod 파라미터 전송 금지** (API 미지원)

---

## 7. Critic PASS 체크리스트 (코더)

- [ ] **C1** B0KlA 제거 · `mg-v2-clinic-os` · `--ad-b0kla-*` 제거
- [ ] **C2** title 「나간 돈 기록」 · subtitle 「공통코드 카테고리만」
- [ ] **C3** Stage1→Stage2 단일 모달 · 신규 organism 금지
- [ ] **C4** 공통코드 SSOT 칩만 · 하드코딩 카테고리 금지
- [ ] **C5** amount = `--mg-v2-color-money-expense` (not semantic-info)
- [ ] **C6** 등록 MGButton teal solid · height `var(--mg-spacing-36)`
- [ ] **C7** txn date=오늘 · paymentMethod UI/API 미사용 (Non-goal)
- [ ] **C8** UnifiedModal / MGButton / ErpSafeText / SafeErrorDisplay / UnifiedLoading만
- [ ] **C9** OUT: MoneyRecordModal / FinancialTransactionForm / IFD 페이지 셸

---

## 8. Non-goals / OUT / 결제수단 리스크

- **paymentMethod**: quick-expense API·지출 엔티티 미지원 → **UI 미노출 · BE 확장 금지**. 제품 intent는 문서 리스크로만.
- **OUT**: 장부 「돈 기록」 들어온/나간 탭, IFD 페이지 셸 restyle, VAT 계산 로직 변경, design-v2-tokens 신규 ledger alias.

---

## 9. 코더 완료 조건

1. 변경: `QuickExpenseForm.js` / `.css` (+ 필요 시 문자열 상수 · `QuickExpenseForm.clinicOsChrome.test.js`)
2. Modal: title/subtitle/clinic-os
3. CSS: paper tokens · money-expense amount · CTA 36 · no ad-b0kla
4. 기능: 칩→금액→등록 유지 · date today

---

## 10. 참조

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`
- `docs/design-system/SALARY_MANAGEMENT_CLINIC_OS_HANDOFF.md`
- `frontend/src/components/consultant/ConsultationLogModal.js` (paper twin)
- `frontend/src/components/erp/approval/OpsApprovalCenter.css` (h36 twin)
- `frontend/src/styles/tokens/design-v2-tokens.css` (`--mg-v2-color-money-expense`)

---

## Critic PASS 게이트 (기획 확정)

| # | 결과 |
|---|------|
| C1–C9 | **전부 Y** → **Critic PASS** (2026-09-08) |
