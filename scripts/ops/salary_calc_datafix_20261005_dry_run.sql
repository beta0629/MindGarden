-- =============================================================================
-- 운영 급여 calc 1건 데이터 정정 — DRY-RUN (읽기 전용: SELECT 만, DDL/DML 없음)
-- 워크플로: .github/workflows/repair-prod-salary-calc-datafix.yml (mode=dry-run, 세션 READ ONLY)
--
-- 1회성 예외 승인: 사용자(재학)가 2026-10-05 01:18 KST 에 AGENTS.md §4 / 00-guardrails
--   「데이터 수동 보정 금지」의 1회성 예외로 이 정정(calc 1건, NEUTRALIZE)을 명시 승인했고 리더가 승인했다.
--   이 예외는 이 스크립트 세트(dry_run/apply/rollback, 20261005)에만 해당한다. 다른 보정의 선례가 아니다.
--
-- 값(테넌트·calc·상담사·매핑·금액)은 저장소에 두지 않는다. 워크플로가 masked input `params` 로
--   @tenant_id, @calc_id … 세션 변수 preamble 을 만들어 이 파일 앞에 붙인다.
-- 공개 저장소라 Actions 로그가 공개된다 → 금액·테넌트·이름을 출력하지 않는다.
--   금액은 「기대값과 일치(1/0)」와 「차이(실제-기대)」만, 행은 id·유형·월만 출력한다.
-- 모든 guard_* = 1 이어야 apply 를 실행한다.
-- =============================================================================

SELECT '=== 0. params present ===' AS section;
SELECT (@tenant_id IS NOT NULL AND @calc_id IS NOT NULL AND @consultant_id IS NOT NULL AND @period IS NOT NULL
        AND @period_start IS NOT NULL AND @period_end IS NOT NULL AND @commission IS NOT NULL
        AND @old_bonus IS NOT NULL AND @new_bonus IS NOT NULL AND @old_gross IS NOT NULL AND @new_gross IS NOT NULL
        AND @old_tax IS NOT NULL AND @new_tax IS NOT NULL AND @old_net IS NOT NULL AND @new_net IS NOT NULL
        AND @old_nat IS NOT NULL AND @new_nat IS NOT NULL AND @old_loc IS NOT NULL AND @new_loc IS NOT NULL
        AND @map_a IS NOT NULL AND @client_a IS NOT NULL AND @prev_map_a IS NOT NULL
        AND @map_b IS NOT NULL AND @client_b IS NOT NULL AND @prev_map_b IS NOT NULL AND @ss_unit IS NOT NULL) AS guard_params_present,
       @calc_id AS calc_id, @consultant_id AS consultant_id, @period AS period,
       @map_a AS map_a, @client_a AS client_a, @prev_map_a AS prev_map_a,
       @map_b AS map_b, @client_b AS client_b, @prev_map_b AS prev_map_b,
       @payout_mode AS payout_mode;

SELECT '=== 1. guards (all must be 1) ===' AS section;
SELECT
  (SELECT COUNT(*) FROM salary_calculations sc
    WHERE sc.id = @calc_id AND sc.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
      AND sc.consultant_id = @consultant_id AND sc.calculation_period = @period COLLATE utf8mb4_unicode_ci
      AND sc.calculation_period_start = @period_start AND sc.calculation_period_end = @period_end
      AND sc.status = 'APPROVED' AND sc.paid_at IS NULL AND IFNULL(sc.calculation_kind, 'PRIMARY') = 'PRIMARY'
      AND sc.is_deleted = FALSE AND sc.commission_earnings = @commission
      AND IFNULL(sc.base_salary, 0) = 0 AND IFNULL(sc.hourly_earnings, 0) = 0
      AND sc.bonus_earnings = @old_bonus AND sc.gross_salary = @old_gross AND sc.total_salary = @old_gross
      AND sc.deductions = @old_tax AND sc.net_salary = @old_net) = 1                                   AS guard_calc_pinned,
  (SELECT COUNT(*) FROM salary_calculations WHERE parent_calculation_id = @calc_id) = 0                AS guard_no_adjustment_children,
  (SELECT COUNT(*) FROM salary_tax_calculations WHERE calculation_id = @calc_id) = 2                    AS guard_tax_rows_eq_2,
  (SELECT COUNT(*) FROM salary_tax_calculations WHERE calculation_id = @calc_id
     AND tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci AND tax_type = 'WITHHOLDING_NATIONAL' AND tax_rate = 0.0300
     AND base_amount = @old_gross AND taxable_amount = @old_gross AND tax_amount = @old_nat) = 1       AS guard_tax_national,
  (SELECT COUNT(*) FROM salary_tax_calculations WHERE calculation_id = @calc_id
     AND tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci AND tax_type = 'WITHHOLDING_LOCAL' AND tax_rate = 0.0030
     AND base_amount = @old_gross AND taxable_amount = @old_gross AND tax_amount = @old_loc) = 1       AS guard_tax_local,
  (FLOOR(@new_gross * 0.03) = @new_nat AND FLOOR(@new_gross * 0.003) = @new_loc
     AND @new_nat + @new_loc = @new_tax AND @new_gross - @new_tax = @new_net
     AND @old_nat + @old_loc = @old_tax AND @old_gross - @old_tax = @old_net
     AND @old_gross - @old_bonus = @new_gross AND @commission = @new_gross AND @new_bonus = 0
     AND @old_bonus = 2 * @ss_unit)                                                                     AS guard_param_arithmetic,
  (SELECT COUNT(*) FROM special_support_monthly_payouts WHERE salary_calculation_id = @calc_id) = 2    AS guard_payouts_for_calc_eq_2,
  (SELECT COUNT(*) FROM special_support_monthly_payouts sp
     WHERE sp.salary_calculation_id = @calc_id AND sp.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
       AND sp.consultant_id = @consultant_id
       AND sp.salary_year_month = @period COLLATE utf8mb4_unicode_ci AND sp.amount = @ss_unit
       AND ((sp.mapping_id = @map_a AND sp.client_id = @client_a)
         OR (sp.mapping_id = @map_b AND sp.client_id = @client_b))) = 2                                AS guard_payouts_target_rows,
  (SELECT COUNT(*) FROM consultant_client_mappings m
     WHERE m.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci AND m.consultant_id = @consultant_id
       AND ((m.id = @map_a AND m.client_id = @client_a) OR (m.id = @map_b AND m.client_id = @client_b))) = 2 AS guard_mapping_client_match,
  (SELECT COUNT(*) FROM special_support_monthly_payouts sp
     WHERE sp.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci AND sp.salary_calculation_id <> @calc_id
       AND ((sp.mapping_id = @prev_map_a AND sp.client_id = @client_a)
         OR (sp.mapping_id = @prev_map_b AND sp.client_id = @client_b))) = 2                           AS guard_policy_prior_payouts,
  (SELECT COUNT(*) FROM financial_transactions ft WHERE ft.related_entity_id = @calc_id
     AND (ft.category = 'SALARY' OR ft.related_entity_type IN ('SALARY', 'SALARY_CALCULATION'))) = 0    AS guard_no_ledger_rows,
  (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME LIKE 'backup\_salary\_fix\_20261005\_%') = 0                                        AS guard_backup_tables_absent;

SELECT '=== 2. calc row: match(1/0) and delta(actual-expected) — 금액 미출력 ===' AS section;
SELECT sc.id, sc.consultant_id = @consultant_id AS consultant_ok,
       sc.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci AS tenant_ok,
       sc.calculation_period = @period COLLATE utf8mb4_unicode_ci AS period_ok,
       sc.status, IFNULL(sc.calculation_kind, 'PRIMARY') AS kind, sc.paid_at IS NULL AS unpaid,
       sc.approved_at IS NOT NULL AS has_approved_at, sc.is_deleted, sc.version,
       sc.total_consultations, sc.completed_consultations,
       IFNULL(sc.base_salary, 0) = 0 AS base_zero, IFNULL(sc.hourly_earnings, 0) = 0 AS hourly_zero,
       sc.commission_earnings = @commission AS commission_ok, sc.commission_earnings - @commission AS d_commission,
       sc.bonus_earnings = @old_bonus AS bonus_ok, sc.bonus_earnings - @old_bonus AS d_bonus,
       sc.gross_salary = @old_gross AS gross_ok, sc.gross_salary - @old_gross AS d_gross,
       sc.total_salary = @old_gross AS total_ok, sc.total_salary - @old_gross AS d_total,
       sc.deductions = @old_tax AS tax_ok, sc.deductions - @old_tax AS d_tax,
       sc.net_salary = @old_net AS net_ok, sc.net_salary - @old_net AS d_net
FROM salary_calculations sc WHERE sc.id = @calc_id;

SELECT '=== 3. tax rows of calc ===' AS section;
SELECT t.id, t.tax_type, t.tax_rate, t.is_active,
       t.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci AS tenant_ok,
       t.base_amount = @old_gross AS base_ok, t.taxable_amount = @old_gross AS taxable_ok,
       t.base_amount - @old_gross AS d_base,
       t.tax_amount = CASE t.tax_type WHEN 'WITHHOLDING_NATIONAL' THEN @old_nat WHEN 'WITHHOLDING_LOCAL' THEN @old_loc END AS tax_ok,
       t.tax_amount - CASE t.tax_type WHEN 'WITHHOLDING_NATIONAL' THEN @old_nat WHEN 'WITHHOLDING_LOCAL' THEN @old_loc END AS d_tax,
       t.calculation_details IS NULL AS details_null
FROM salary_tax_calculations t WHERE t.calculation_id = @calc_id ORDER BY t.id;
SELECT (SELECT COUNT(*) FROM salary_tax_calculations WHERE calculation_id = @calc_id) AS tax_rows,
       (SELECT SUM(tax_amount) FROM salary_tax_calculations WHERE calculation_id = @calc_id) = @old_tax AS tax_sum_eq_deductions;

SELECT '=== 4. special_support payouts: rows of calc, and all rows of the two clients ===' AS section;
SELECT sp.id, sp.consultant_id, sp.client_id, sp.mapping_id, sp.salary_year_month, sp.salary_calculation_id,
       sp.amount = @ss_unit AS amount_eq_unit, sp.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci AS tenant_ok,
       sp.created_at
FROM special_support_monthly_payouts sp
WHERE sp.salary_calculation_id = @calc_id
   OR (sp.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci AND sp.client_id IN (@client_a, @client_b))
ORDER BY sp.client_id, sp.id;
SELECT m.id AS mapping_id, m.consultant_id, m.client_id, m.total_sessions, m.payment_status, m.status, m.is_deleted
FROM consultant_client_mappings m
WHERE m.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci AND m.id IN (@map_a, @map_b, @prev_map_a, @prev_map_b)
ORDER BY m.id;

SELECT '=== 5. derived / accounting (expect 1 SALARY_APPROVAL log, 0 ledger, 0 children) ===' AS section;
SELECT e.id, e.sync_type, e.status, e.created_at,
       CAST(JSON_UNQUOTE(JSON_EXTRACT(e.sync_data, '$.gross_salary')) AS DECIMAL(15,2)) = @old_gross AS log_gross_eq_old,
       CAST(JSON_UNQUOTE(JSON_EXTRACT(e.sync_data, '$.net_salary')) AS DECIMAL(15,2)) = @old_net AS log_net_eq_old
FROM erp_sync_logs e
WHERE e.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
  AND CAST(JSON_UNQUOTE(JSON_EXTRACT(e.sync_data, '$.calculation_id')) AS UNSIGNED) = @calc_id
ORDER BY e.id;
SELECT (SELECT COUNT(*) FROM financial_transactions ft WHERE ft.related_entity_id = @calc_id
          AND (ft.category = 'SALARY' OR ft.related_entity_type IN ('SALARY', 'SALARY_CALCULATION'))) AS ledger_rows_for_calc,
       (SELECT COUNT(*) FROM financial_transactions ft WHERE ft.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
          AND ft.category = 'SALARY' AND ft.transaction_date >= @period_start) AS salary_ledger_rows_since_period,
       (SELECT COUNT(*) FROM salary_calculations WHERE parent_calculation_id = @calc_id) AS adjustment_children;

SELECT '=== 6. schema: columns / collation (tables in scope) ===' AS section;
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLLATION_NAME, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('salary_calculations', 'salary_tax_calculations', 'special_support_monthly_payouts', 'erp_sync_logs')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('salary_calculations', 'salary_tax_calculations', 'special_support_monthly_payouts',
                     'erp_sync_logs', 'consultant_client_mappings', 'financial_transactions', 'audit_logs')
ORDER BY TABLE_NAME;
SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('salary_calculations', 'salary_tax_calculations', 'special_support_monthly_payouts')
GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
ORDER BY TABLE_NAME, INDEX_NAME;
SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
FROM information_schema.REFERENTIAL_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND (TABLE_NAME IN ('salary_calculations', 'salary_tax_calculations', 'special_support_monthly_payouts')
       OR REFERENCED_TABLE_NAME IN ('salary_calculations', 'salary_tax_calculations', 'special_support_monthly_payouts'));

SELECT '=== 7. triggers on tables in scope (expect none) ===' AS section;
SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_TIMING, EVENT_OBJECT_TABLE
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
  AND EVENT_OBJECT_TABLE IN ('salary_calculations', 'salary_tax_calculations', 'special_support_monthly_payouts', 'erp_sync_logs');
SELECT COUNT(*) AS trigger_count_in_scope
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
  AND EVENT_OBJECT_TABLE IN ('salary_calculations', 'salary_tax_calculations', 'special_support_monthly_payouts', 'erp_sync_logs');

SELECT '=== 8. server / session ===' AS section;
SELECT VERSION() AS mysql_version, @@gtid_mode AS gtid_mode, @@enforce_gtid_consistency AS enforce_gtid,
       @@read_only AS server_read_only, @@transaction_read_only AS session_tx_read_only,
       @@autocommit AS autocommit, @@character_set_connection AS cs_conn, @@collation_connection AS coll_conn,
       @@collation_database AS coll_db, @@sql_mode AS sql_mode, @@time_zone AS time_zone, NOW() AS db_now;
SELECT PRIVILEGE_TYPE, IS_GRANTABLE, 'GLOBAL' AS scope FROM information_schema.USER_PRIVILEGES
WHERE GRANTEE = CONCAT('''', SUBSTRING_INDEX(CURRENT_USER(), '@', 1), '''@''', SUBSTRING_INDEX(CURRENT_USER(), '@', -1), '''')
UNION ALL
SELECT PRIVILEGE_TYPE, IS_GRANTABLE, 'SCHEMA' FROM information_schema.SCHEMA_PRIVILEGES
WHERE TABLE_SCHEMA = DATABASE()
  AND GRANTEE = CONCAT('''', SUBSTRING_INDEX(CURRENT_USER(), '@', 1), '''@''', SUBSTRING_INDEX(CURRENT_USER(), '@', -1), '''')
ORDER BY scope, PRIVILEGE_TYPE;
