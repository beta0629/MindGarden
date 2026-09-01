# Phase 1 — core-coder 위임 프롬프트 (전문)

**subagent_type**: `core-coder`  
**branch**: `cursor/common-code-expense-ssot-0237` only (develop base). Do not merge main.  
**plan**: `docs/project-management/COMMON_CODE_EXPENSE_SSOT_ALIGNMENT_PLAN_20260831.md`

You implement code only. No force push / amend. Commit OK if convenient (main may also commit). File edits required.

## Facts (file-backed, not hypotheses)

- SSOT table: `common_codes` (tenant_id NULL=core, NOT NULL=tenant). No `tenant_common_codes` table.
- Expense groups: `EXPENSE_CATEGORY` / `EXPENSE_SUBCATEGORY` (parent via parent_code_group/value).
- Ledger dropdown: `GET /api/v1/erp/common-codes/financial` → those groups.
- Split paths: `FinancialCommonCodeInitializer` seeds EXPENSE_* as core; `OnboardingServiceImpl.insertDefaultTenantCommonCodes` seeds tenant; hybrid `findCodesByGroupWithFallback` exposes tenant∪core → duplicate codeValue / delete target confusion.
- `CommonCodeManagement` LIST hybrid (platform API), DELETE via `TENANT_WRITE_ISOLATED_GROUPS` → tenant API → deleting core row shows 「존재하지 않는 코드」/시스템코드.
- Java auto-TX still uses `FINANCIAL_SUBCATEGORY`/`FINANCIAL_CATEGORY` + Korean literal fallbacks (`FinancialTransactionServiceImpl`).
- `CopyDefaultTenantCodes` SP whitelist lacks EXPENSE_*.
- FE display-only maps (`financialTransactionCategoryPicker.js` etc.) — **forbidden as the fix**. Unify root SSOT.
- Register: expense groups require manual codeValue; auto-gen only CONSULTATION_PACKAGE.
- Hardcode: QuickExpenseForm `MANAGEMENT_FEE`, SP Korean category literals — no magic category strings in backend/calc.

## Design (must follow; adjust only with evidence)

- Tenant scope is operational SSOT: if tenant has EXPENSE_*, read/write/delete that only. Core is bootstrap/fallback seed — never hybrid list + tenant delete.
- Or unify list/delete/create to same scope; backfill unseeded tenants via onboarding/CopyDefaultTenantCodes/Flyway then remove core fallback exposure.
- FINANCIAL_* leftover writes → migrate to EXPENSE_* SSOT or remove.
- Auto codeValue: extend PACKAGE pattern with per-group prefix constants; no hardcoded name lists.
- Do not touch: withholding tax / salary formula / polarity / Clinic-OS restyle.
- Keep Korean operator copy.
- Do not remap ledger amounts; if normalizing, migrate write values to SSOT codes only.

## Target paths (edit as needed; grep for leftovers)

Backend:  
`CommonCodeRepository.java`, `CommonCodeServiceImpl.java`, `TenantCommonCodeServiceImpl.java`,  
`TenantCommonCodeController.java`, `CommonCodeController.java`, `ErpController.java`,  
`FinancialCommonCodeInitializer.java`, `TenantOnboardingSalaryAndFinancialSeedDefinitions.java`,  
`OnboardingServiceImpl.java`, `OnboardingConstants.java`, `FinancialCommonCodeSeedStrings.java`,  
`CommonCodeSubcategoryParents.java`, `ConsultationPackageCodeConstants.java` (or new auto-value constants),  
`FinancialTransactionServiceImpl.java`, `FinancialTransactionConstants.java`,  
`src/main/resources/sql/procedures/copy_default_tenant_codes.sql`, Flyway SP recreations + **new** Flyway for whitelist + tenant EXPENSE_* backfill.

Frontend:  
`tenantCodeConstants.js`, `commonCodeApi.js`, `CommonCodeManagement.js`, `CommonCodeForm.js`,  
`commonCodeParentGroups.js`, `QuickExpenseForm.js`, `financialTransactionCategoryPicker.js` (+ constants),  
related moneyCockpit hardcodes.

Tests: seed / tenant common code / financial constants / FE form as needed.

## Completion criteria

1. Register parent → child appears under parent filter.
2. Delete target == listed row; never 「코드가 없다」 for visible unused row; in-use → real reason.
3. Tenant seed tree == EXPENSE_* SSOT; SP whitelist includes EXPENSE_*.
4. SP/Java calc same SSOT; no preview≠confirm fork; no FINANCIAL_* leftover write; no Korean category literal fallbacks in calc.
5. Auto codeValue + minimal fields (root: display name; child: parent + display name; rest defaults).
6. No category magic strings in backend/calc/QuickExpense chips.
7. No display-only alias map as the “fix”.
8. Hardcode gate: `ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17, `SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3.

## References

- `docs/standards/BACKEND_CODING_STANDARD.md`, `FRONTEND_DEVELOPMENT_STANDARD.md`, `API_CALL_STANDARD.md`, `COMMON_MODULES_USAGE_GUIDE.md`, `CODE_STYLE_STANDARD.md`
- Skills: `/core-solution-backend`, `/core-solution-frontend`, `/core-solution-multi-tenant`, `/core-solution-database-first`, `/core-solution-encapsulation-modularization`, `/core-solution-code-style`, `/core-solution-api`
- `CommonCodeSubcategoryParents`, `tenantCodeConstants`, `FinancialTransactionConstants`, `TenantOnboardingSalaryAndFinancialSeedDefinitions`

## Deliverable back to planner

- List of changed files
- Migration files added (yes/no + names)
- How read/write/delete scope was unified (brief)
- Known residual risks
- Suggested test commands for core-tester
