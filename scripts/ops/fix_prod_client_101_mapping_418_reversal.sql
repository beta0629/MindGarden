-- 단건 운영 기록 정정 (MindGarden, client_id=101, mapping 404/418, ft 414, JE 411 역분개)
-- 재학 승인(2026-11-21 15:11 KST):
--   1) mapping 404: ACTIVE 유지, total 12->11, remaining 11->10, used 1 유지 + history 1행
--   2) mapping 418: TERMINATED 유지, payment_status APPROVED->REJECTED + 메모
--   3) ft 414: INCOME COMPLETED -> CANCELLED
--   4) JE 411(entry_date=2026-11-21): 정식 역분개(차대 반전 4라인, 90,000 균형) + erp_ledgers 2026-11 보정
--   5) 364·401/398·415/412·일정 746 불변 검증
-- 실행: mysql --default-character-set=utf8mb4 -t (--force 금지)

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET autocommit = 0;

START TRANSACTION;

-- 0) 사전 가드 (테넌트·마감·대상 행·원장·불변 대상)
SELECT tenant_id INTO @tenant_id
FROM tenants
WHERE subdomain = 'mindgarden' AND status = 'ACTIVE'
LIMIT 1;

SET @guard_sql = IF(@tenant_id = 'tenant-incheon-counseling-001',
  'SELECT ''PASS: 00_tenant'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_TENANT_MISMATCH__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 2026-11 마감 여부 확인 (CLOSED 또는 REOPENED 존재 시 즉시 중단)
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

-- 매핑 404·418, ft 414, JE 411 행 잠금 및 정확한 사전 상태 검증
SELECT COUNT(*) INTO @pre_404_cnt
FROM consultant_client_mappings
WHERE tenant_id = @tenant_id
  AND id = 404 AND consultant_id = 3 AND client_id = 101
  AND status = 'ACTIVE' AND payment_status = 'APPROVED'
  AND total_sessions = 12 AND used_sessions = 1 AND remaining_sessions = 11
  AND package_name = '단회기 90,000원' AND package_price = 90000 AND payment_amount = 90000
  AND (is_deleted = 0 OR is_deleted IS NULL)
FOR UPDATE;

SELECT COUNT(*) INTO @pre_418_cnt
FROM consultant_client_mappings
WHERE tenant_id = @tenant_id
  AND id = 418 AND consultant_id = 3 AND client_id = 101
  AND status = 'TERMINATED' AND payment_status = 'APPROVED' AND payment_timing = 'SAME_DAY_CARD'
  AND total_sessions = 1 AND used_sessions = 1 AND remaining_sessions = 0
  AND package_price = 90000 AND payment_amount = 90000
  AND (is_deleted = 0 OR is_deleted IS NULL)
FOR UPDATE;

SELECT COUNT(*) INTO @pre_ft414_cnt
FROM financial_transactions
WHERE tenant_id = @tenant_id
  AND id = 414 AND related_entity_id = 418
  AND related_entity_type = 'CONSULTANT_CLIENT_MAPPING_ADDITIONAL'
  AND transaction_type = 'INCOME' AND status = 'COMPLETED'
  AND amount = 90000.00 AND tax_amount = 8182.00
  AND amount_before_tax = 81818.00 AND withholding_tax_amount = 2970.00
  AND card_merchant_fee_amount = 0.00
  AND is_deleted = 0
FOR UPDATE;

SELECT COUNT(*) INTO @pre_je411_cnt
FROM accounting_entries
WHERE tenant_id = @tenant_id
  AND id = 411 AND financial_transaction_id = 414
  AND entry_number = 'JE-tenant-incheon-counseling-001-2026-0411'
  AND entry_type = 'DEBIT' AND account_code = 'ERP-CASH'
  AND amount = 90000.00 AND total_debit = 90000.00 AND total_credit = 90000.00
  AND entry_status = 'POSTED' AND approval_status = 'APPROVED' AND is_deleted = 0
FOR UPDATE;

SELECT COUNT(*) INTO @existing_rev_cnt
FROM accounting_entries
WHERE tenant_id = @tenant_id
  AND related_transaction_id = 411
  AND related_transaction_type = 'REVERSAL_OF_ACCOUNTING_ENTRY'
  AND is_deleted = 0;

SELECT COUNT(*), IFNULL(SUM(debit_amount), 0), IFNULL(SUM(credit_amount), 0)
INTO @pre_je411_line_cnt, @pre_je411_debit, @pre_je411_credit
FROM erp_journal_entry_lines
WHERE tenant_id = @tenant_id AND journal_entry_id = 411 AND is_deleted = 0
FOR UPDATE;

SELECT COUNT(*) INTO @pre_ledger_cnt
FROM erp_ledgers
WHERE tenant_id = @tenant_id
  AND period_start = '2026-11-01' AND period_end = '2026-11-30'
  AND id IN (41, 42, 43, 44) AND account_id IN (5, 7, 9, 10)
FOR UPDATE;

SET @guard_sql = IF(
  @pre_404_cnt = 1 AND @pre_418_cnt = 1 AND @pre_ft414_cnt = 1
  AND @pre_je411_cnt = 1 AND @existing_rev_cnt = 0
  AND @pre_je411_line_cnt = 4 AND @pre_je411_debit = 90000.00 AND @pre_je411_credit = 90000.00
  AND @pre_ledger_cnt = 4,
  'SELECT ''PASS: 02_preconditions_locked'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_PRECONDITION_MISMATCH__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 1) 매핑 404 회기 정정 (12/1/11 -> 11/1/10, 표시명·금액 유지)
UPDATE consultant_client_mappings
SET total_sessions = 11,
    remaining_sessions = 10,
    updated_at = NOW()
WHERE tenant_id = @tenant_id
  AND id = 404 AND consultant_id = 3 AND client_id = 101
  AND status = 'ACTIVE' AND total_sessions = 12 AND used_sessions = 1 AND remaining_sessions = 11
  AND (is_deleted = 0 OR is_deleted IS NULL);

SET @rc_404 = ROW_COUNT();
SET @guard_sql = IF(@rc_404 = 1,
  'SELECT ''PASS: 03_update_mapping_404_rc_1'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_UPDATE_404_RC__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 1-1) 매핑 404 이력 1행 기록
INSERT INTO consultant_client_mapping_history
  (tenant_id, mapping_id, client_id, consultant_id, event_type,
   before_state_json, after_state_json, triggered_by_user_id, reason, created_at)
VALUES
  (@tenant_id, 404, 101, 3, 'UPDATED',
   '{"totalSessions":12,"usedSessions":1,"remainingSessions":11,"status":"ACTIVE"}',
   '{"totalSessions":11,"usedSessions":1,"remainingSessions":10,"status":"ACTIVE"}',
   NULL,
   '오등록 미결제 매핑 418(단회기 90,000원) 병합 회기 1회 차감 정정',
   NOW());

SET @rc_hist = ROW_COUNT();
SET @guard_sql = IF(@rc_hist = 1,
  'SELECT ''PASS: 04_insert_history_404_rc_1'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_INSERT_HISTORY_RC__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 2) 매핑 418 TERMINATED 유지 + payment_status REJECTED + 메모
UPDATE consultant_client_mappings
SET payment_status = 'REJECTED',
    notes = CONCAT(IFNULL(notes, ''), '\n[정정 2026-11-21] 단말 미결제 오등록 무효: payment_status=REJECTED, 병합 회기 1은 매핑 404에서 차감, ft 414 취소 및 JE 411 역분개 처리'),
    updated_at = NOW()
WHERE tenant_id = @tenant_id
  AND id = 418 AND consultant_id = 3 AND client_id = 101
  AND status = 'TERMINATED' AND payment_status = 'APPROVED'
  AND total_sessions = 1 AND payment_amount = 90000
  AND (is_deleted = 0 OR is_deleted IS NULL);

SET @rc_418 = ROW_COUNT();
SET @guard_sql = IF(@rc_418 = 1,
  'SELECT ''PASS: 05_update_mapping_418_rc_1'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_UPDATE_418_RC__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 3) ft 414 CANCELLED
UPDATE financial_transactions
SET status = 'CANCELLED',
    updated_at = NOW()
WHERE tenant_id = @tenant_id
  AND id = 414 AND related_entity_id = 418
  AND related_entity_type = 'CONSULTANT_CLIENT_MAPPING_ADDITIONAL'
  AND transaction_type = 'INCOME' AND status = 'COMPLETED'
  AND amount = 90000.00 AND is_deleted = 0;

SET @rc_ft414 = ROW_COUNT();
SET @guard_sql = IF(@rc_ft414 = 1,
  'SELECT ''PASS: 06_update_ft_414_rc_1'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_UPDATE_FT414_RC__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 4) JE 411 정식 역분개 (entry_date=2026-11-21, 차대 반전 4라인, 90,000 균형)
SELECT COALESCE(MAX(CAST(SUBSTRING(e2.entry_number, LENGTH(e2.entry_number) - 3) AS UNSIGNED)), 0) + 1
INTO @next_je_seq
FROM accounting_entries e2
WHERE e2.tenant_id = @tenant_id
  AND e2.entry_number LIKE CONCAT('JE-', @tenant_id, '-2026-%')
FOR UPDATE;

SET @rev_entry_number = CONCAT('JE-', @tenant_id, '-2026-', LPAD(@next_je_seq, 4, '0'));

INSERT INTO accounting_entries
  (tenant_id, entry_number, entry_date, entry_type, account_code, account_name, amount,
   description, related_transaction_id, financial_transaction_id, related_transaction_type,
   balance_sheet_category, subcategory, approval_status, approver_id, approved_at, approval_comment,
   total_debit, total_credit, entry_status, posted_at, is_deleted, created_at, updated_at)
VALUES
  (@tenant_id, @rev_entry_number, '2026-11-21', 'CREDIT', 'ERP-CASH', '현금 계정', 90000.00,
   '역분개: 단말 미결제 오등록 매핑 418 취소 (원분개 JE-tenant-incheon-counseling-001-2026-0411, ft 414)',
   411, 414, 'REVERSAL_OF_ACCOUNTING_ENTRY',
   'ASSETS_CURRENT', NULL, 'APPROVED', NULL, NOW(), '오등록 미결제 ft 414 / JE 411 정식 역분개',
   90000.00, 90000.00, 'POSTED', NOW(), 0, NOW(), NOW());

SET @rc_je_hdr = ROW_COUNT();
SET @rev_je_id = LAST_INSERT_ID();
SET @guard_sql = IF(@rc_je_hdr = 1 AND @rev_je_id > 0,
  'SELECT ''PASS: 07_insert_reversal_je_header_rc_1'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_INSERT_JE_HEADER_RC__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

INSERT INTO erp_journal_entry_lines
  (tenant_id, journal_entry_id, account_id, debit_amount, credit_amount,
   description, line_number, created_at, updated_at, is_deleted)
SELECT l.tenant_id,
       @rev_je_id,
       l.account_id,
       l.credit_amount,
       l.debit_amount,
       CONCAT('[역분개] ', IFNULL(l.description, '')),
       l.line_number,
       NOW(),
       NOW(),
       0
FROM erp_journal_entry_lines l
WHERE l.tenant_id = @tenant_id
  AND l.journal_entry_id = 411
  AND l.is_deleted = 0
ORDER BY l.line_number;

SET @rc_je_lines = ROW_COUNT();
SELECT COUNT(*), IFNULL(SUM(debit_amount), 0), IFNULL(SUM(credit_amount), 0)
INTO @rev_line_cnt, @rev_debit_sum, @rev_credit_sum
FROM erp_journal_entry_lines
WHERE tenant_id = @tenant_id AND journal_entry_id = @rev_je_id AND is_deleted = 0;

-- 원분개(411) + 역분개(@rev_je_id) 계정별 순합계(차변-대변) 불균형/미상계 확인
SELECT COUNT(*) INTO @unbalanced_account_cnt
FROM (
  SELECT account_id, SUM(debit_amount) - SUM(credit_amount) AS net_amt
  FROM erp_journal_entry_lines
  WHERE tenant_id = @tenant_id AND journal_entry_id IN (411, @rev_je_id) AND is_deleted = 0
  GROUP BY account_id
  HAVING net_amt <> 0.00
) t;

SET @guard_sql = IF(
  @rc_je_lines = 4 AND @rev_line_cnt = 4
  AND @rev_debit_sum = 90000.00 AND @rev_credit_sum = 90000.00
  AND @unbalanced_account_cnt = 0,
  'SELECT ''PASS: 08_insert_reversal_je_lines_rc_4_balanced'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_REVERSAL_LINES_BALANCE__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 5) erp_ledgers 2026-11 보정 (account_id 5, 7, 9, 10)
UPDATE erp_ledgers lg
INNER JOIN (
  SELECT tenant_id, account_id,
         SUM(debit_amount) AS add_debit,
         SUM(credit_amount) AS add_credit
  FROM erp_journal_entry_lines
  WHERE tenant_id = @tenant_id AND journal_entry_id = @rev_je_id AND is_deleted = 0
  GROUP BY tenant_id, account_id
) rev ON rev.tenant_id = lg.tenant_id AND rev.account_id = lg.account_id
-- MySQL UPDATE SET은 좌→우로 평가된다. total_debit/credit를 먼저 갱신한 뒤
-- (lg.total_debit + rev.add_debit)를 쓰면 closing_balance에 역분개 금액이 이중 반영된다.
-- closing은 갱신 전(원래) total_debit/credit 기준으로 먼저 계산한다.
SET lg.closing_balance = lg.opening_balance + (lg.total_debit + rev.add_debit) - (lg.total_credit + rev.add_credit),
    lg.total_debit = lg.total_debit + rev.add_debit,
    lg.total_credit = lg.total_credit + rev.add_credit,
    lg.updated_at = NOW()
WHERE lg.tenant_id = @tenant_id
  AND lg.period_start = '2026-11-01'
  AND lg.period_end = '2026-11-30'
  AND lg.id IN (41, 42, 43, 44);

SET @rc_ledger = ROW_COUNT();
SET @guard_sql = IF(@rc_ledger = 4,
  'SELECT ''PASS: 09_update_erp_ledgers_2026_11_rc_4'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_UPDATE_LEDGERS_RC__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 6) 불변 항목 + 결과 합계 검증 (실패 시 즉시 중단·롤백)
SELECT COUNT(*) INTO @invar_364
FROM consultant_client_mappings
WHERE tenant_id = @tenant_id AND id = 364 AND status = 'SESSIONS_EXHAUSTED'
  AND total_sessions = 1 AND used_sessions = 1 AND remaining_sessions = 0 AND payment_amount = 250000;

SELECT COUNT(*) INTO @invar_404
FROM consultant_client_mappings
WHERE tenant_id = @tenant_id AND id = 404 AND status = 'ACTIVE'
  AND total_sessions = 11 AND used_sessions = 1 AND remaining_sessions = 10
  AND package_name = '단회기 90,000원' AND package_price = 90000 AND payment_amount = 90000;

SELECT COUNT(*) INTO @invar_421
FROM consultant_client_mappings
WHERE tenant_id = @tenant_id AND id = 421 AND status = 'TERMINATED'
  AND total_sessions = 10 AND used_sessions = 10 AND remaining_sessions = 0 AND payment_amount = 850000;

SELECT COUNT(*) INTO @invar_746
FROM schedules
WHERE tenant_id = @tenant_id AND id = 746 AND client_id = 101 AND mapping_id = 404
  AND status = 'COMPLETED' AND session_sequence = 1 AND (is_deleted = 0 OR is_deleted IS NULL);

SELECT IFNULL(SUM(CASE WHEN transaction_type = 'INCOME' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0),
       IFNULL(SUM(CASE WHEN transaction_type = 'EXPENSE' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0)
INTO @client_101_completed_income, @client_101_completed_expense
FROM financial_transactions
WHERE tenant_id = @tenant_id AND is_deleted = 0
  AND (
    (related_entity_type LIKE 'CONSULTANT_CLIENT_MAPPING%' AND related_entity_id IN (364, 404, 418, 421))
  );

SELECT COUNT(*) INTO @invar_je_398_412
FROM accounting_entries
WHERE tenant_id = @tenant_id AND is_deleted = 0 AND entry_status = 'POSTED'
  AND ((id = 398 AND financial_transaction_id = 401 AND amount = 90000.00)
    OR (id = 412 AND financial_transaction_id = 415 AND amount = 850000.00));

SET @guard_sql = IF(
  @invar_364 = 1 AND @invar_404 = 1 AND @invar_421 = 1 AND @invar_746 = 1
  AND @client_101_completed_income = 1190000.00 AND @client_101_completed_expense = 0.00
  AND @invar_je_398_412 = 2,
  'SELECT ''PASS: 10_invariants_and_net_1190000'' AS guard_step',
  'SELECT 1 FROM __GUARD_FAIL_INVARIANT_CHECK__');
PREPARE gs FROM @guard_sql; EXECUTE gs; DEALLOCATE PREPARE gs;

-- 트랜잭션 종료 직전 스냅샷(dry_run 시에도 변경 예정 상태 확인용)
SELECT 'PRE_TX_END_MAPPINGS' AS section, id, status, payment_status,
       total_sessions, used_sessions, remaining_sessions, package_name, payment_amount
FROM consultant_client_mappings
WHERE tenant_id = @tenant_id AND id IN (364, 404, 418, 421)
ORDER BY id;

SELECT 'PRE_TX_END_FT' AS section, id, related_entity_id, transaction_type, status, amount
FROM financial_transactions
WHERE tenant_id = @tenant_id AND id IN (400, 401, 414, 415)
ORDER BY id;

SELECT 'PRE_TX_END_JE' AS section, id, entry_number, entry_date, entry_type,
       account_code, amount, total_debit, total_credit, entry_status,
       financial_transaction_id, related_transaction_id, related_transaction_type
FROM accounting_entries
WHERE tenant_id = @tenant_id AND id IN (397, 398, 411, 412, @rev_je_id)
ORDER BY id;

SELECT 'PRE_TX_END_LEDGERS_2026_11' AS section, id, account_id, opening_balance,
       total_debit, total_credit, closing_balance
FROM erp_ledgers
WHERE tenant_id = @tenant_id AND period_start = '2026-11-01' AND period_end = '2026-11-30'
  AND id IN (40, 41, 42, 43, 44)
ORDER BY account_id;

__TX_END__;
