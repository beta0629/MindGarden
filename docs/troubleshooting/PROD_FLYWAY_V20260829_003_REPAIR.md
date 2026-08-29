# Prod Flyway V20260829_003 repair (ERROR 1227 DROP PROCEDURE)

**대상**: 운영 DB — **`/etc/mindgarden/prod.env` 의 `DB_NAME` 이 SSOT** (종종 `core_solution`).  
`mind_garden` 만 가정하지 말 것. 워크플로 원샷 repair·수동 SQL 모두 동일 SSOT를 따른다.  
**비밀·호스트**: URL·비밀번호·SSH 대상을 적지 않는다. `PRODUCTION_DB_PASSWORD` 등 배포 Secret / prod.env `DB_*` 를 사용한다.

**관련**: `docs/troubleshooting/FLYWAY_REPAIR_FAILED_MIGRATION.md`,  
`V20260607_002__special_support_payout_lifetime_unique.sql` (동일 1227 선례).

---

## 1. Symptom

### 1.1 Run 2069 (원본 마이그 실패)

- Prod deploy **run 2069**: green JVM died during Flyway on  
  `V20260829_003__salary_preview_confirm_parity.sql`.
- Failure at `DROP PROCEDURE IF EXISTS CalculateSalaryPreview` →  
  **MySQL Error 1227** (`SYSTEM_USER` access denied).
- Same would hit `ProcessIntegratedSalaryCalculation` DROP later in the old script.
- App Flyway user cannot DROP DEFINER/`SYSTEM_USER` procedures.  
  SP SSOT is the procedure-deploy path (`PRODUCTION_DB_PROCEDURE_USER`) — already succeeded in 2069.

### 1.2 Run 2070 (repair 미적용 → 동일 Validate 크래시)

- Prod deploy **2070** (Actions run **33235859586**, SHA **8e592c327**).
- 워크플로 원샷 repair 가 다음 이유로 **mysql 호출 실패**:
  - DB 이름 **`mind_garden` 하드코딩** (앱/프로시저 SSOT 와 불일치 — 실제는 prod.env `DB_NAME`, 종종 `core_solution`)
  - **stderr 삼킴** (`2>/dev/null`) → warning annotation 만
  - `mindgarden` CLI 계정이 `flyway_schema_history` 에 **DELETE 권한 없을 수 있음** (root 재시도 없음)
- Annotation:  
  `V20260829_003 flyway success=0 repair mysql 호출 실패 — 배포는 계속 (수동 repair 문서 참고)`
- 배포는 **계속**되어 inactive 슬롯 `systemctl restart` → Flyway 가 leftover `success=0` 때문에 기동 거부.
- Green journal (2069 와 동일 잔존 행, 신규 오류 아님):

```text
Validate failed: Migrations have failed validation
Detected failed migration to version 20260829.003 (salary preview confirm parity).
Please remove any half-completed changes then run repair to fix the schema history.
```

- Nginx 는 blue 유지 (inactive 헬스 실패로 전환 생략).

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

3. **Guarded one-shot (fail-closed)** in `.github/workflows/deploy-production.yml`  
   (step `🔄 블루그린 백엔드·Nginx 적용`, after ACTIVE/INACTIVE, **before** inactive `systemctl restart`):

| 항목 | 동작 |
|------|------|
| DB_* 해석 | 1) `/etc/mindgarden/prod.env` (`DB_HOST`/`DB_USERNAME`/`DB_PASSWORD`/`DB_NAME`, grep/sed·따옴표·CRLF 제거, **source 금지**) → 2) inactive unit `Environment` → 3) `PRODUCTION_DB_PASSWORD` → 4) 기본값 `localhost` / `mindgarden` / **`core_solution`** (`mind_garden` 하드코딩 금지) |
| DELETE | `success = 0` 이고 version/script 가 `20260829.003` / `V20260829_003` 인 행만. **`success=1` 절대 삭제 금지** |
| mysql | stderr **미삼킴**. 1) app user (`DB_*`) → 실패 시 2) `sudo mysql -u root -p"$PRODUCTION_DB_PASSWORD"` (매핑 프로시저 블록과 동일 root 재시도). 성공 경로(app-user vs root)·삭제 건수 로그 |
| 실패 시 | `::error::` + **`exit 1`** — **inactive `systemctl restart` / Nginx 전환 전**에 중단. 배포 계속 금지 |

**Do not** edit V20260511 / V20260512 history migrations.  
**Do not** hardcode combined tax rate `0.033` (use `WITHHOLDING_NATIONAL` 0.03 + `WITHHOLDING_LOCAL` 0.003).

---

## 3. One-shot SQL (manual, if workflow guard did not run)

Connect with **prod.env `DB_NAME`** (또는 unit Environment). Example:

```bash
# DB_NAME 확인 (서버)
grep -E '^[[:space:]]*DB_NAME[[:space:]]*=' /etc/mindgarden/prod.env
```

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

App user 에 DELETE 권한이 없으면 root (또는 동등 권한)으로 동일 SQL 실행.  
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
