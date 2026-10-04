-- =============================================================================
-- 운영 급여 calc 1건 데이터 정정 — ROLLBACK (apply 이전 값으로 복원)
-- 워크플로: .github/workflows/repair-prod-salary-calc-datafix.yml (mode=rollback, confirm=CONFIRM, KST 11–19시 거부)
--
-- 1회성 예외 승인: 사용자(재학) 2026-10-05 01:18 KST, 리더 승인 (apply 와 같은 예외의 되돌림 경로).
-- 전제: apply 가 COMMIT 되었고 backup_salary_fix_20261005_{calc,tax,ssp,audit} 가 남아 있다.
-- 가드: 대상 calc 가 「정정 직후 값 + APPROVED + paid_at NULL + updated_by=DATAFIX」일 때만 복원.
--       이미 지급(PAID)됐거나 다른 경로로 값이 바뀌었으면 중단 → 그때는 ADJUSTMENT 정산.
-- DELETE 모드였다면 지급기록 2행을 원래 id 로 재삽입(그 사이 같은 매핑에 새 행이 생겼으면 UNIQUE 충돌로 중단).
-- 값은 apply 와 같은 masked input `params` preamble 로 받는다. 금액·테넌트는 출력하지 않는다.
-- =============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET SESSION innodb_lock_wait_timeout = 15;
SET SESSION autocommit = 1;

SET @actor = CONCAT('DATAFIX-20261005-CALC', IFNULL(@calc_id, 0), '-RB');
SET @fix_actor = CONCAT('DATAFIX-20261005-CALC', IFNULL(@calc_id, 0));
SET @c = (@tenant_id IS NOT NULL AND @calc_id IS NOT NULL AND @consultant_id IS NOT NULL
          AND @new_bonus IS NOT NULL AND @new_gross IS NOT NULL AND @new_tax IS NOT NULL AND @new_net IS NOT NULL
          AND @new_nat IS NOT NULL AND @new_loc IS NOT NULL);
SET @n = 'rb_params_present';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- [1] 가드
SET @c = (SELECT COUNT(*) FROM backup_salary_fix_20261005_calc WHERE id = @calc_id) = 1
     AND (SELECT COUNT(*) FROM backup_salary_fix_20261005_tax WHERE calculation_id = @calc_id) = 2
     AND (SELECT COUNT(*) FROM backup_salary_fix_20261005_ssp WHERE salary_calculation_id = @calc_id) = 2;
SET @n = 'rb_backups_present_1_2_2';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @payout_mode = (SELECT payout_mode FROM backup_salary_fix_20261005_audit
                    WHERE action = 'CORRECTION' AND calc_id = @calc_id ORDER BY id DESC LIMIT 1);
SET @c = (@payout_mode IN ('NEUTRALIZE', 'DELETE')); SET @n = 'rb_payout_mode_known';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

START TRANSACTION;

SELECT id INTO @locked_id FROM salary_calculations WHERE id = @calc_id FOR UPDATE;
SELECT COUNT(*) INTO @locked_tax FROM salary_tax_calculations WHERE calculation_id = @calc_id FOR UPDATE;

SET @c = (SELECT COUNT(*) FROM salary_calculations
          WHERE id = @calc_id AND tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci AND consultant_id = @consultant_id
            AND status = 'APPROVED' AND paid_at IS NULL AND is_deleted = FALSE
            AND bonus_earnings = @new_bonus AND gross_salary = @new_gross AND total_salary = @new_gross
            AND deductions = @new_tax AND net_salary = @new_net
            AND updated_by = @fix_actor COLLATE utf8mb4_unicode_ci) = 1
     AND (SELECT COUNT(*) FROM salary_tax_calculations t JOIN backup_salary_fix_20261005_tax b ON b.id = t.id
          WHERE t.calculation_id = @calc_id AND t.base_amount = @new_gross
            AND ((t.tax_type = 'WITHHOLDING_NATIONAL' AND t.tax_amount = @new_nat)
              OR (t.tax_type = 'WITHHOLDING_LOCAL' AND t.tax_amount = @new_loc))) = 2;
SET @n = 'rb_current_state_is_corrected';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- [2] salary_calculations 복원 (금액 컬럼만; updated_* / version 은 앞으로 진행)
UPDATE salary_calculations sc
  JOIN backup_salary_fix_20261005_calc b ON b.id = sc.id
   SET sc.bonus_earnings = b.bonus_earnings,
       sc.gross_salary   = b.gross_salary,
       sc.total_salary   = b.total_salary,
       sc.deductions     = b.deductions,
       sc.net_salary     = b.net_salary,
       sc.updated_at     = NOW(6),
       sc.updated_by     = @actor,
       sc.version        = sc.version + 1
 WHERE sc.id = @calc_id AND sc.status = 'APPROVED' AND sc.paid_at IS NULL
   AND sc.gross_salary = @new_gross AND sc.net_salary = @new_net;
SET @rc = ROW_COUNT();
SET @c = (@rc = 1); SET @n = 'rb_rc_calc_eq_1';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- [3] salary_tax_calculations 복원 (id 기준)
UPDATE salary_tax_calculations t
  JOIN backup_salary_fix_20261005_tax b ON b.id = t.id
   SET t.base_amount = b.base_amount, t.taxable_amount = b.taxable_amount, t.tax_amount = b.tax_amount,
       t.updated_at = NOW(6)
 WHERE t.calculation_id = @calc_id AND t.base_amount = @new_gross;
SET @rc = ROW_COUNT();
SET @c = (@rc = 2); SET @n = 'rb_rc_tax_eq_2';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- [4] special_support_monthly_payouts 복원
--     NEUTRALIZE: amount 를 백업값으로 되돌림 / DELETE: 원래 id 그대로 재삽입
UPDATE special_support_monthly_payouts sp
  JOIN backup_salary_fix_20261005_ssp b ON b.id = sp.id
   SET sp.amount = b.amount
 WHERE @payout_mode = 'NEUTRALIZE' AND sp.salary_calculation_id = @calc_id AND sp.amount = 0;
SET @rc_upd = ROW_COUNT();

INSERT INTO special_support_monthly_payouts
  (id, tenant_id, consultant_id, client_id, mapping_id, salary_year_month, amount, salary_calculation_id, created_at)
SELECT b.id, b.tenant_id, b.consultant_id, b.client_id, b.mapping_id, b.salary_year_month, b.amount,
       b.salary_calculation_id, b.created_at
FROM backup_salary_fix_20261005_ssp b
WHERE @payout_mode = 'DELETE'
  AND NOT EXISTS (SELECT 1 FROM special_support_monthly_payouts x WHERE x.id = b.id);
SET @rc_ins = ROW_COUNT();

SET @c = (@payout_mode = 'NEUTRALIZE' AND @rc_upd = 2 AND @rc_ins = 0)
      OR (@payout_mode = 'DELETE'     AND @rc_upd = 0 AND @rc_ins = 2);
SET @n = 'rb_rc_payouts_eq_2';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- [5] 사후 확인: 현재 행 = 백업 행
SET @c = (SELECT COUNT(*) FROM salary_calculations sc JOIN backup_salary_fix_20261005_calc b ON b.id = sc.id
          WHERE sc.bonus_earnings = b.bonus_earnings AND sc.gross_salary = b.gross_salary
            AND sc.total_salary = b.total_salary AND sc.deductions = b.deductions AND sc.net_salary = b.net_salary
            AND sc.status = b.status COLLATE utf8mb4_unicode_ci AND sc.paid_at <=> b.paid_at AND sc.approved_at <=> b.approved_at) = 1
     AND (SELECT COUNT(*) FROM salary_tax_calculations t JOIN backup_salary_fix_20261005_tax b ON b.id = t.id
          WHERE t.base_amount = b.base_amount AND t.taxable_amount = b.taxable_amount AND t.tax_amount = b.tax_amount) = 2
     AND (SELECT COUNT(*) FROM special_support_monthly_payouts sp JOIN backup_salary_fix_20261005_ssp b ON b.id = sp.id
          WHERE sp.amount = b.amount AND sp.mapping_id = b.mapping_id AND sp.client_id = b.client_id
            AND sp.salary_calculation_id <=> b.salary_calculation_id AND sp.salary_year_month = b.salary_year_month) = 2;
SET @n = 'rb_post_equals_backup';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- [6] 감사
INSERT INTO backup_salary_fix_20261005_audit (action, actor, calc_id, payout_mode, reason, before_json, after_json)
SELECT 'ROLLBACK', @actor, @calc_id, @payout_mode, 'correction.sql 되돌림',
       JSON_OBJECT('gross_salary', @new_gross, 'deductions', @new_tax, 'net_salary', @new_net),
       JSON_OBJECT('gross_salary', b.gross_salary, 'deductions', b.deductions, 'net_salary', b.net_salary,
                   'bonus_earnings', b.bonus_earnings)
FROM backup_salary_fix_20261005_calc b WHERE b.id = @calc_id;
INSERT INTO erp_sync_logs (sync_type, sync_date, records_processed, status, error_message, tenant_id,
                           started_at, completed_at, duration_seconds, sync_data, created_at, created_by)
SELECT 'SALARY', NOW(6), 1, 'COMPLETED', NULL, b.tenant_id, NOW(6), NOW(6), 0,
       JSON_OBJECT('type', 'DATA_CORRECTION_ROLLBACK', 'ticket', 'salary-mismatch-0905', 'calculation_id', @calc_id,
                   'payout_mode', @payout_mode,
                   'restored', JSON_OBJECT('gross_salary', b.gross_salary, 'deductions', b.deductions, 'net_salary', b.net_salary)),
       NOW(6), @actor
FROM backup_salary_fix_20261005_calc b WHERE b.id = @calc_id;
SET @rc = ROW_COUNT();
SET @c = (@rc = 1); SET @n = 'rb_rc_audit_eq_1';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

COMMIT;

SELECT 'AFTER ROLLBACK' AS snapshot, sc.id, sc.status, sc.paid_at IS NULL AS unpaid, sc.updated_by, sc.version,
       (sc.bonus_earnings = b.bonus_earnings AND sc.gross_salary = b.gross_salary AND sc.total_salary = b.total_salary
        AND sc.deductions = b.deductions AND sc.net_salary = b.net_salary) AS amounts_eq_backup
FROM salary_calculations sc JOIN backup_salary_fix_20261005_calc b ON b.id = sc.id WHERE sc.id = @calc_id;
SELECT 'AFTER ROLLBACK tax' AS snapshot, t.id, t.tax_type,
       (t.base_amount = b.base_amount AND t.tax_amount = b.tax_amount) AS eq_backup
FROM salary_tax_calculations t JOIN backup_salary_fix_20261005_tax b ON b.id = t.id
WHERE t.calculation_id = @calc_id ORDER BY t.id;
SELECT 'AFTER ROLLBACK payouts' AS snapshot, sp.id, sp.mapping_id, sp.client_id, sp.amount = b.amount AS amount_eq_backup
FROM special_support_monthly_payouts sp JOIN backup_salary_fix_20261005_ssp b ON b.id = sp.id
WHERE sp.salary_calculation_id = @calc_id ORDER BY sp.id;
-- 백업 테이블은 지우지 않는다(감사 보존).
