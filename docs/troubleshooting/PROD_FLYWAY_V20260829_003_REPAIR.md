# Prod Flyway V20260829_003 repair (ERROR 1227 DROP PROCEDURE)

**대상**: 운영 DB (`mind_garden`).  
**비밀·호스트**: URL·비밀번호·SSH 대상을 적지 않는다. `PRODUCTION_DB_PASSWORD` 등 배포 Secret을 사용한다.

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
   delete `flyway_schema_history` rows where `success = 0` and version/script matches `20260829.003` only.

**Do not** edit V20260511 / V20260512 history migrations.  
**Do not** hardcode combined tax rate `0.033` (use `WITHHOLDING_NATIONAL` 0.03 + `WITHHOLDING_LOCAL` 0.003).

---

## 3. One-shot SQL (manual, if workflow guard did not run)

**Only `success = 0`. Never delete `success = 1`.**

```sql
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
```

Then restart the inactive (green/blue) slot so Flyway re-applies the seed-only script.

---

## 4. Verification after deploy

```sql
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
WHERE Db = DATABASE()
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
