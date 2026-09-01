# Phase 2 — core-tester 위임 프롬프트 (전문)

**subagent_type**: `core-coder` 완료 후 실행 · **`core-tester`**  
**branch**: `cursor/common-code-expense-ssot-0237`

## Scope

Verify common-code ↔ expense category SSOT alignment. Do not implement product fixes (report failures; planner may re-dispatch coder).

## Required checks

1. **Parent filter**: EXPENSE_SUBCATEGORY filtered by parent EXPENSE_CATEGORY value.
2. **Register visibility**: newly created category/sub appears in tenant list and financial dropdown path.
3. **Delete key**: listed row id/scope == DELETE target; unused → success; no 「존재하지 않는 코드」 for visible tenant rows.
4. **Seed**: onboarding / CopyDefaultTenantCodes includes EXPENSE_*; tenant tree matches.
5. **No literals**: `FinancialTransactionServiceImpl` / related SP paths must not use FINANCIAL_* write leftovers or Korean category name fallbacks for expense SSOT; grep evidence.
6. **Auto code / minimal fields**: create without manual codeValue for expense groups works (or documented API contract).
7. **No display-only alias fix**: picker must not paper over duplicate hybrid rows.
8. Out of scope regressions: salary formula / withholding / polarity / Clinic-OS untouched.

## Suggested commands (adjust to repo)

- Backend unit/integration for changed tests (Maven surefire filters on CommonCode / TenantCommonCode / Onboarding / FinancialTransactionConstants).
- Frontend jest for CommonCodeForm / tenantCodeConstants / QuickExpense / picker if present.
- Grep gate: `FINANCIAL_CATEGORY|FINANCIAL_SUBCATEGORY` in write/calc paths; `MANAGEMENT_FEE` in QuickExpenseForm; hybrid EXPENSE in `HYBRID_READ_WITH_CORE_FALLBACK_GROUPS`.

## Deliverable

- Pass/fail per check with evidence (test output / grep)
- Changed-file smoke if builds run
- Residual risks
