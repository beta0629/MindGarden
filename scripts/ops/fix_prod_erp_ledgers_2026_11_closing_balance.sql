-- 단건 운영 기록 정정: erp_ledgers 2026-11 closing_balance 4행 재계산만
-- 재학 승인(리더0629 전달, 2026-11-21 16:40 KST): 「11월 장부 잔액 4칸 보정 실행해」
-- 범위: tenant_id='tenant-incheon-counseling-001', period 2026-11-01~2026-11-30,
--       id IN (41, 42, 43, 44) 의 closing_balance만
--       closing_balance = opening_balance + total_debit - total_credit
-- 다른 칸·다른 행 변경 금지. 본 파일만 실행 (fix_prod_client_101_mapping_418_reversal.sql 재실행 금지).
-- 실행: mysql --default-character-set=utf8mb4 -t (--force 금지)

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET autocommit = 0;

START TRANSACTION;

SELECT tenant_id INTO @tenant_id
FROM tenants
WHERE subdomain = 'mindgarden' AND status = 'ACTIVE'
LIMIT 1;

SET @guard_sql = IF(@tenant_id = 'tenant-incheon-counseling-001',
  'SELECT ''PASS: 00_tenant'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_TENANT_MISMATCH__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 2026-11 마감이면 원장 잔액 보정을 중단한다.
SELECT COUNT(*) INTO @closed_period_cnt
FROM financial_period
WHERE tenant_id = @tenant_id
  AND period_end >= '2026-11-01'
  AND period_start <= '2026-11-30'
  AND status IN ('CLOSED', 'REOPENED');

SET @guard_sql = IF(@closed_period_cnt = 0,
  'SELECT ''PASS: 01_period_2026_11_open'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_2026_11_PERIOD_CLOSED__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 대상 4행 잠금 + 테넌트·기간·id·현재 closing/opening/debit/credit 일치
SELECT COUNT(*) INTO @pre_cnt
FROM erp_ledgers
WHERE tenant_id = @tenant_id
  AND period_start = '2026-11-01'
  AND period_end = '2026-11-30'
  AND id IN (41, 42, 43, 44)
  AND (
    (id = 41 AND account_id = 7 AND opening_balance = 46697544.00 AND total_debit = 12718136.00 AND total_credit = 1910000.00 AND closing_balance = 57415680.00)
    OR (id = 42 AND account_id = 5 AND opening_balance = -48766512.00 AND total_debit = 78848.00 AND total_credit = 11341869.00 AND closing_balance = -59950685.00)
    OR (id = 43 AND account_id = 9 AND opening_balance = -4679306.00 AND total_debit = 8182.00 AND total_credit = 1176913.00 AND closing_balance = -5839855.00)
    OR (id = 44 AND account_id = 10 AND opening_balance = -1586382.00 AND total_debit = 2970.00 AND total_credit = 427218.00 AND closing_balance = -2007660.00)
  )
FOR UPDATE;

SET @guard_sql = IF(@pre_cnt = 4,
  'SELECT ''PASS: 02_preconditions_locked_current_closing'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_LEDGER_PRECONDITIONS__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 비대상 행(id=40)은 잠금만 하고 값이 그대로인지 확인한다. 변경하지 않는다.
SELECT COUNT(*) INTO @invar_40
FROM erp_ledgers
WHERE tenant_id = @tenant_id
  AND id = 40
  AND period_start = '2026-11-01'
  AND period_end = '2026-11-30'
  AND account_id = 6
  AND opening_balance = 8186976.00
  AND total_debit = 2047864.00
  AND total_credit = 0.00
  AND closing_balance = 10234840.00
FOR UPDATE;

SET @guard_sql = IF(@invar_40 = 1,
  'SELECT ''PASS: 03_invariant_ledger_40_untouched_pre'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_LEDGER_40_PRE__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

SELECT 'PRE_UPDATE_LEDGERS' AS section, id, account_id, opening_balance,
       total_debit, total_credit, closing_balance,
       opening_balance + total_debit - total_credit AS expected_closing
FROM erp_ledgers
WHERE tenant_id = @tenant_id
  AND period_start = '2026-11-01' AND period_end = '2026-11-30'
  AND id IN (40, 41, 42, 43, 44)
ORDER BY id;

-- closing_balance만 재계산. 다른 칸은 SET하지 않는다.
UPDATE erp_ledgers
SET closing_balance = opening_balance + total_debit - total_credit
WHERE tenant_id = @tenant_id
  AND period_start = '2026-11-01'
  AND period_end = '2026-11-30'
  AND id IN (41, 42, 43, 44)
  AND (
    (id = 41 AND closing_balance = 57415680.00)
    OR (id = 42 AND closing_balance = -59950685.00)
    OR (id = 43 AND closing_balance = -5839855.00)
    OR (id = 44 AND closing_balance = -2007660.00)
  );

SET @rc_ledger = ROW_COUNT();
SET @guard_sql = IF(@rc_ledger = 4,
  'SELECT ''PASS: 04_update_closing_balance_rc_4'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_UPDATE_CLOSING_RC__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 갱신 후 정상값 + opening/debit/credit 불변
SELECT COUNT(*) INTO @post_ok
FROM erp_ledgers
WHERE tenant_id = @tenant_id
  AND period_start = '2026-11-01'
  AND period_end = '2026-11-30'
  AND (
    (id = 41 AND account_id = 7 AND opening_balance = 46697544.00 AND total_debit = 12718136.00 AND total_credit = 1910000.00 AND closing_balance = 57505680.00)
    OR (id = 42 AND account_id = 5 AND opening_balance = -48766512.00 AND total_debit = 78848.00 AND total_credit = 11341869.00 AND closing_balance = -60029533.00)
    OR (id = 43 AND account_id = 9 AND opening_balance = -4679306.00 AND total_debit = 8182.00 AND total_credit = 1176913.00 AND closing_balance = -5848037.00)
    OR (id = 44 AND account_id = 10 AND opening_balance = -1586382.00 AND total_debit = 2970.00 AND total_credit = 427218.00 AND closing_balance = -2010630.00)
  );

SELECT COUNT(*) INTO @invar_40_post
FROM erp_ledgers
WHERE tenant_id = @tenant_id
  AND id = 40
  AND period_start = '2026-11-01'
  AND period_end = '2026-11-30'
  AND account_id = 6
  AND opening_balance = 8186976.00
  AND total_debit = 2047864.00
  AND total_credit = 0.00
  AND closing_balance = 10234840.00;

SET @guard_sql = IF(@post_ok = 4 AND @invar_40_post = 1,
  'SELECT ''PASS: 05_post_closing_matches_expected'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_POST_CLOSING_VALUES__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 직전 정정 결과(매핑/전표/합계)는 건드리지 않았는지 확인
SELECT COUNT(*) INTO @invar_404
FROM consultant_client_mappings
WHERE tenant_id = @tenant_id AND id = 404 AND status = 'ACTIVE'
  AND payment_status = 'APPROVED'
  AND total_sessions = 11 AND used_sessions = 1 AND remaining_sessions = 10
  AND package_price = 90000 AND payment_amount = 90000;

SELECT COUNT(*) INTO @invar_418
FROM consultant_client_mappings
WHERE tenant_id = @tenant_id AND id = 418 AND status = 'TERMINATED'
  AND payment_status = 'REJECTED'
  AND total_sessions = 1 AND used_sessions = 1 AND remaining_sessions = 0
  AND payment_amount = 90000;

SELECT COUNT(*) INTO @invar_ft414
FROM financial_transactions
WHERE tenant_id = @tenant_id AND id = 414 AND related_entity_id = 418
  AND transaction_type = 'INCOME' AND status = 'CANCELLED' AND amount = 90000.00
  AND is_deleted = 0;

SELECT COUNT(*) INTO @invar_rev_je
FROM accounting_entries
WHERE tenant_id = @tenant_id
  AND related_transaction_id = 411
  AND related_transaction_type = 'REVERSAL_OF_ACCOUNTING_ENTRY'
  AND financial_transaction_id = 414
  AND entry_date = '2026-11-21'
  AND entry_status = 'POSTED'
  AND total_debit = 90000.00 AND total_credit = 90000.00
  AND is_deleted = 0;

SELECT
  SUM(CASE WHEN transaction_type = 'INCOME' AND status = 'COMPLETED' THEN amount ELSE 0 END),
  SUM(CASE WHEN transaction_type = 'EXPENSE' AND status = 'COMPLETED' THEN amount ELSE 0 END)
INTO @completed_income, @completed_expense
FROM financial_transactions
WHERE tenant_id = @tenant_id
  AND is_deleted = 0
  AND related_entity_type LIKE 'CONSULTANT_CLIENT_MAPPING%'
  AND related_entity_id IN (364, 404, 418, 421);

SET @guard_sql = IF(
  @invar_404 = 1 AND @invar_418 = 1 AND @invar_ft414 = 1 AND @invar_rev_je = 1
  AND @completed_income = 1190000.00 AND @completed_expense = 0.00,
  'SELECT ''PASS: 06_prior_correction_invariants'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_PRIOR_CORRECTION_INVARIANTS__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

SELECT 'PRE_TX_END_LEDGERS_2026_11' AS section, id, account_id,
       opening_balance, total_debit, total_credit, closing_balance
FROM erp_ledgers
WHERE tenant_id = @tenant_id
  AND period_start = '2026-11-01' AND period_end = '2026-11-30'
  AND id IN (40, 41, 42, 43, 44)
ORDER BY id;

__TX_END__;
