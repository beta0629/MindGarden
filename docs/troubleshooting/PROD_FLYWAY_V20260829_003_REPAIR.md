# Prod Flyway V20260829_003 repair (ERROR 1227 DROP PROCEDURE)

> Note (2026-08-29): Prod deploy run **#2071** was rejected mid-wait when `required_reviewers` was deleted on environment `prod`. A new push to `main` retriggers 🚀 Core Solution 운영 배포 (wait_timer=5; no Approve needed). / 운영 배포 #2071은 wait 중 `required_reviewers` 삭제로 거절됨. `main` 새 푸시로 재트리거.

> Follow-up (2026-08-29): **#695** landed fail-closed repair against `core_solution`. Docs-only retriggers **#697** / **#698** set `backend_changed=false`, so JAR upload + blue-green repair never ran. This follow-up prefers `/etc/mindgarden/prod.env` `DB_*` (same keys as the JVM) before unit `Environment` / `PRODUCTION_DB_PASSWORD`, and touches `.github/workflows/deploy-production.yml` so the next `main` merge runs a real blue-green deploy + repair.

**대상**: 운영 Flyway SSOT 스키마는 **`core_solution`** (`application.yml` 기본 `DB_NAME:core_solution`).  
**NOT** `mind_garden` — `deploy-standardized-procedures.sh` 가 `mind_garden` 을 차단하며, procedure-deploy 단계의 `PROD_DB_NAME` 기본값도 `core_solution` 이다.

**비밀·호스트**: URL·비밀번호·SSH 대상을 적지 않는다. 해석 순서: `/etc/mindgarden/prod.env` `DB_*` → systemd unit `Environment` → `PRODUCTION_DB_PASSWORD`. Default `DB_NAME=core_solution`.

**관련**: `docs/troubleshooting/FLYWAY_REPAIR_FAILED_MIGRATION.md`,  
`V20260607_002__special_support_payout_lifetime_unique.sql` (동일 1227 선례).

---

## 1. Symptom

- Prod deploy **run 2069**: green JVM died during Flyway on  
  `V20260829_003__salary_preview_confirm_parity.sql`.
- Failure at `DROP PROCEDURE IF EXISTS CalculateSalaryPreview` →  
  **MySQL Error 1227** (`SYSTEM_USER` access denied).
- Same would hit `ProcessIntegratedSalaryCalculation` DROP later in the old script.
- App Flyway user cannot DROP DEFINER/`SYSTEM_USER` procedures.  
  SP SSOT is the procedure-deploy path (`PRODUCTION_DB_PROCEDURE_USER`) — already succeeded in 2069.

### 1.1 After #689 (seed-only + guarded repair) — run https://github.com/beta0629/MindGarden/actions/runs/33235859586

- Seed-only `V20260829_003` was correct and present in the JAR.
- Guarded repair logged:  
  `V20260829_003 flyway success=0 repair mysql 호출 실패 — 배포는 계속`
- Root cause: repair used DB name **`mind_garden`**, but Flyway history lives in **`core_solution`**.
- Green then failed with  
  `FlywayValidateException: Detected failed migration to version 20260829.003`  
  (leftover `success = 0` row). Nginx not switched; live stayed blue.

---

## 2. Fix (code)

1. **Migration is seed-only**  
   `src/main/resources/db/migration/V20260829_003__salary_preview_confirm_parity.sql`  
   keeps only idempotent `SALARY_TAX_RATE` / `common_codes` inserts.  
   All `DELIMITER` / `DROP` / `CREATE PROCEDURE` bodies removed.

2. **SP bodies stay on procedure-deploy SSOT**
   - `database/schema/procedures_standardized/CalculateSalaryPreview_standardized.sql`
   - `database/schema/procedures_standardized/ProcessIntegratedSalaryCalculation_standardized.sql`
   - Applied via deploy-production procedure step / `PRODUCTION_DB_PROCEDURE_USER`.

3. **Guarded one-shot** in `.github/workflows/deploy-production.yml`  
   (step `🔄 블루그린 백엔드·Nginx 적용`, after ACTIVE/INACTIVE, **before** inactive `systemctl restart`):  
   - Resolve `DB_HOST` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME`:  
     (1) non-empty keys from `/etc/mindgarden/prod.env` (grep/sed, no `source`),  
     (2) then systemd `Environment` of inactive (then active) for any still-empty,  
     (3) then `$PRODUCTION_DB_PASSWORD` if password still empty;  
     defaults: `localhost`, `mindgarden`, **`core_solution`**.
   - Delete `flyway_schema_history` rows where `success = 0` and version/script matches  
     `20260829.003` only (never `success = 1`).
   - Separate `COUNT` → `DELETE` → verify `COUNT = 0` (no multi-statement `ROW_COUNT`).
   - On missing password / mysql failure / leftover `success = 0`: **`::error` + `exit 1`**  
     (do not restart green knowing Validate will fail). Optional `sudo mysql … -u root` retry  
     (prefer `$PRODUCTION_DB_PASSWORD` for root, else resolved app password).

**Do not** edit V20260511 / V20260512 history migrations.  
**Do not** hardcode combined tax rate `0.033` (use `WITHHOLDING_NATIONAL` 0.03 + `WITHHOLDING_LOCAL` 0.003).  
**Do not** re-add DROP/CREATE PROCEDURE to V20260829_003.

---

## 3. One-shot SQL (manual, if workflow guard did not run)

**Schema: `core_solution`.** Only `success = 0`. Never delete `success = 1`.

```sql
USE core_solution;

-- Inspect first
SELECT installed_rank, version, description, success, checksum, script, installed_on
FROM flyway_schema_history
WHERE success = 0
  AND (
    version IN ('20260829.003', '20260829_003')
    OR script LIKE '%V20260829_003%'
  );

-- Repair (failure row only)
DELETE FROM flyway_schema_history
WHERE success = 0
  AND (
    version IN ('20260829.003', '20260829_003')
    OR script LIKE '%V20260829_003%'
  );

-- Or fully qualified:
-- DELETE FROM core_solution.flyway_schema_history
-- WHERE success = 0 AND (...);
```

Then restart the inactive (green/blue) slot so Flyway re-applies the seed-only script.

---

## 4. Verification after deploy

```sql
USE core_solution;

SELECT installed_rank, version, description, success, checksum, script, installed_on
FROM flyway_schema_history
WHERE version IN ('20260829.003', '20260829_003')
   OR script LIKE '%V20260829_003%'
ORDER BY installed_rank DESC;

SELECT code_group, code_value, extra_data, is_active
FROM common_codes
WHERE code_group = 'SALARY_TAX_RATE'
  AND code_value IN ('WITHHOLDING_NATIONAL', 'WITHHOLDING_LOCAL')
  AND tenant_id IS NULL
  AND is_deleted = FALSE;

SHOW PROCEDURE STATUS
WHERE Db = 'core_solution'
  AND Name IN ('CalculateSalaryPreview', 'ProcessIntegratedSalaryCalculation');
```

Expect: history row `success = 1`; two withholding codes present; both procedures exist (from procedure-deploy, not from this Flyway file).

---

## 5. Audit note (sibling migrations)

| Version | DROP PROCEDURE salary SPs? | Action |
|---------|----------------------------|--------|
| V20260829_001 | No | OK |
| V20260829_002 | `ApplyDiscountAccounting` (already applied) | Leave unchanged |
| V20260829_003 | Was DROP/CREATE salary SPs | **Fixed — seed only** |
| V20260829_004 / 005 | No salary SP DROP | OK |
