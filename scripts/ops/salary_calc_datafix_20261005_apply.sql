-- =============================================================================
-- 운영 급여 calc 1건 데이터 정정 — APPLY (특별지원금 제거, 단일 트랜잭션, 감사)
-- 워크플로: .github/workflows/repair-prod-salary-calc-datafix.yml (mode=apply, confirm=CONFIRM, KST 11–19시 거부)
--
-- 1회성 예외 승인: 사용자(재학)가 2026-10-05 01:18 KST 에 AGENTS.md §4 / 00-guardrails
--   「데이터 수동 보정 금지」의 1회성 예외로 이 정정(calc 1건, NEUTRALIZE)을 명시 승인했고 리더가 승인했다.
--   이 예외는 이 스크립트 세트(dry_run/apply/rollback, 20261005)에만 해당한다. 다른 보정의 선례가 아니다.
--   근거: 특별지원금 「내담자당 최초 10회기 이상 패키지 1회」 정책 위반(재결제 매핑 2건) — salary-mismatch-0905.
--
-- 값은 저장소에 두지 않는다: 워크플로 masked input `params` → 세션 변수 preamble(@tenant_id, @calc_id, …).
-- 공개 저장소(Actions 로그 공개) → 금액·테넌트를 출력하지 않는다. 전/후 전체 값은 DB 의
--   backup_salary_fix_20261005_{calc,tax,ssp,audit} 와 erp_sync_logs 감사 행에만 남긴다.
--
-- 동작
--   [1] 사전 가드(트랜잭션 전). 하나라도 다르면 백업도 만들지 않고 중단.
--   [2] 백업 테이블 생성(이미 있으면 ERROR 1050 → 이중 실행 방지) + 백업.
--   [3] START TRANSACTION → FOR UPDATE 잠금 → 재확인 → salary_calculations 1행 → salary_tax_calculations 2행
--       → special_support_monthly_payouts 2행(NEUTRALIZE: amount=0 행 유지 / DELETE: 삭제) → 사후 정합성
--       → 감사(backup audit 1 + erp_sync_logs 1) → COMMIT.
--   모든 DML WHERE 에 현재 값을 고정. ASSERT 실패 시 `ASSERT_FAILED__<이름>` 조회 → ERROR 1146 → mysql 중단
--   → 미커밋 트랜잭션은 세션 종료로 ROLLBACK. (MySQL 8.0 은 PREPARE 안 SIGNAL 미지원(1295)이라 이 방식.)
--   트랜잭션 중간 실패 시 백업 테이블만 남는다 → 재시도 전 DROP 필요.
-- payout 모드: 기본 NEUTRALIZE. 현재 코드는 매핑별 지급기록 존재(sp.id)로만 판정하므로 행을 지우면(DELETE)
--   미리보기가 다시 특별지원금을 넣고 다음 확정에서 재지급된다. DELETE 는 코드 수정 배포 후에만.
-- =============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET SESSION innodb_lock_wait_timeout = 15;
SET SESSION autocommit = 1;

-- 파라미터는 워크플로 preamble 이 설정한다. 누락 시 중단(fail closed).
SET @payout_mode = IFNULL(@payout_mode, 'NEUTRALIZE');
SET @actor  = CONCAT('DATAFIX-20261005-CALC', IFNULL(@calc_id, 0));
SET @reason = '특별지원금 정책(내담자당 최초 10회기 이상 패키지 1회) 위반 재결제 매핑 2건 지급분 제거. 사용자 1회성 예외 승인 2026-10-05 01:18 KST.';
SET @c = (@tenant_id IS NOT NULL AND @calc_id IS NOT NULL AND @consultant_id IS NOT NULL AND @period IS NOT NULL
          AND @period_start IS NOT NULL AND @period_end IS NOT NULL AND @commission IS NOT NULL
          AND @old_bonus IS NOT NULL AND @new_bonus IS NOT NULL AND @old_gross IS NOT NULL AND @new_gross IS NOT NULL
          AND @old_tax IS NOT NULL AND @new_tax IS NOT NULL AND @old_net IS NOT NULL AND @new_net IS NOT NULL
          AND @old_nat IS NOT NULL AND @new_nat IS NOT NULL AND @old_loc IS NOT NULL AND @new_loc IS NOT NULL
          AND @map_a IS NOT NULL AND @client_a IS NOT NULL AND @prev_map_a IS NOT NULL
          AND @map_b IS NOT NULL AND @client_b IS NOT NULL AND @prev_map_b IS NOT NULL AND @ss_unit IS NOT NULL
          AND @new_bonus = 0 AND @old_bonus = 2 * @ss_unit);
SET @n = 'params_present';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ASSERT 헬퍼: SET @c = <조건>; SET @n = '<이름>'; 다음 줄의 PREPARE. 조건이 0/NULL 이면
--   'SELECT 1 FROM `ASSERT_FAILED__<이름>`' → ERROR 1146 "Table ... ASSERT_FAILED__<이름> doesn't exist" 로 중단.

-- =============================================================================
-- [1] 사전 가드 (읽기 전용, 트랜잭션 전) — 하나라도 다르면 백업 테이블도 만들지 않고 중단
-- =============================================================================
SET @c = (@payout_mode IN ('NEUTRALIZE', 'DELETE')); SET @n = 'payout_mode';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM salary_calculations sc
          WHERE sc.id = @calc_id
            AND sc.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
            AND sc.consultant_id = @consultant_id
            AND sc.calculation_period = @period COLLATE utf8mb4_unicode_ci
            AND sc.calculation_period_start = @period_start
            AND sc.calculation_period_end = @period_end
            AND sc.status = 'APPROVED'
            AND sc.paid_at IS NULL
            AND IFNULL(sc.calculation_kind, 'PRIMARY') = 'PRIMARY'
            AND sc.is_deleted = FALSE
            AND sc.commission_earnings = @commission
            AND IFNULL(sc.base_salary, 0) = 0
            AND IFNULL(sc.hourly_earnings, 0) = 0
            AND sc.bonus_earnings = @old_bonus
            AND sc.gross_salary = @old_gross
            AND sc.total_salary = @old_gross
            AND sc.deductions = @old_tax
            AND sc.net_salary = @old_net) = 1;
SET @n = 'pre_calc_pinned';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM salary_calculations WHERE parent_calculation_id = @calc_id) = 0;
SET @n = 'pre_no_adjustment_children';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- 세금 행: 정확히 2행(국세/지방세)이고 현재 금액·과세표준이 고정값
SET @c = (SELECT COUNT(*) FROM salary_tax_calculations WHERE calculation_id = @calc_id) = 2
     AND (SELECT COUNT(*) FROM salary_tax_calculations
          WHERE calculation_id = @calc_id AND tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
            AND tax_type = 'WITHHOLDING_NATIONAL' AND tax_rate = 0.0300
            AND base_amount = @old_gross AND taxable_amount = @old_gross AND tax_amount = @old_nat) = 1
     AND (SELECT COUNT(*) FROM salary_tax_calculations
          WHERE calculation_id = @calc_id AND tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
            AND tax_type = 'WITHHOLDING_LOCAL' AND tax_rate = 0.0030
            AND base_amount = @old_gross AND taxable_amount = @old_gross AND tax_amount = @old_loc) = 1
     AND FLOOR(@new_gross * 0.03) = @new_nat AND FLOOR(@new_gross * 0.003) = @new_loc
     AND @new_nat + @new_loc = @new_tax AND @new_gross - @new_tax = @new_net
     AND @old_nat + @old_loc = @old_tax AND @old_gross - @old_tax = @old_net
     AND @old_gross - @old_bonus = @new_gross AND @commission = @new_gross;
SET @n = 'pre_tax_rows_and_arithmetic';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- 지급기록: 대상 calc 에 묶인 행은 정확히 map_a·map_b 두 행뿐, 각 10,000, 9월, 매핑-내담자 일치
SET @c = (SELECT COUNT(*) FROM special_support_monthly_payouts WHERE salary_calculation_id = @calc_id) = 2
     AND (SELECT COUNT(*) FROM special_support_monthly_payouts sp
          WHERE sp.salary_calculation_id = @calc_id
            AND sp.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
            AND sp.consultant_id = @consultant_id
            AND sp.salary_year_month = @period COLLATE utf8mb4_unicode_ci
            AND sp.amount = @ss_unit
            AND ((sp.mapping_id = @map_a AND sp.client_id = @client_a)
              OR (sp.mapping_id = @map_b AND sp.client_id = @client_b))) = 2
     AND (SELECT COUNT(*) FROM consultant_client_mappings m
          WHERE m.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci AND m.consultant_id = @consultant_id
            AND ((m.id = @map_a AND m.client_id = @client_a) OR (m.id = @map_b AND m.client_id = @client_b))) = 2;
SET @n = 'pre_payout_target_rows';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- 정책 근거: 같은 내담자가 이전 매핑(prev_map_a/b)으로 다른 calc 에서 이미 지급받았는지
SET @c = (SELECT COUNT(*) FROM special_support_monthly_payouts sp
          WHERE sp.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
            AND sp.salary_calculation_id <> @calc_id
            AND ((sp.mapping_id = @prev_map_a AND sp.client_id = @client_a)
              OR (sp.mapping_id = @prev_map_b AND sp.client_id = @client_b))) = 2;
SET @n = 'pre_policy_prior_payouts';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- 회계 원장: 대상 calc 에 연결된 financial_transactions 가 없어야 한다(있으면 원장도 정정 필요 → 중단)
SET @c = (SELECT COUNT(*) FROM financial_transactions ft
          WHERE ft.related_entity_id = @calc_id
            AND (ft.category = 'SALARY' OR ft.related_entity_type IN ('SALARY', 'SALARY_CALCULATION'))) = 0;
SET @n = 'pre_no_financial_transactions';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- =============================================================================
-- [2] BEFORE 스냅샷 (로그 출력) + 백업 테이블 (DDL → 트랜잭션 밖에서 먼저)
-- =============================================================================
SELECT 'BEFORE' AS snapshot, sc.id, sc.status, sc.paid_at IS NULL AS unpaid, sc.version,
       sc.bonus_earnings = @old_bonus AS bonus_eq_old, sc.gross_salary = @old_gross AS gross_eq_old,
       sc.deductions = @old_tax AS tax_eq_old, sc.net_salary = @old_net AS net_eq_old
FROM salary_calculations sc WHERE sc.id = @calc_id;
SELECT 'BEFORE tax' AS snapshot, t.id, t.tax_type, t.tax_rate, t.base_amount = @old_gross AS base_eq_old
FROM salary_tax_calculations t WHERE t.calculation_id = @calc_id ORDER BY t.id;
SELECT 'BEFORE payouts' AS snapshot, sp.id, sp.mapping_id, sp.client_id, sp.salary_year_month, sp.amount = @ss_unit AS amount_eq_unit
FROM special_support_monthly_payouts sp WHERE sp.salary_calculation_id = @calc_id ORDER BY sp.id;

-- 백업 테이블: 이미 있으면 오류(1050)로 중단 → 이중 실행 방지. 생성 후 남겨 두고 보존 기간 뒤 수동 DROP.
CREATE TABLE backup_salary_fix_20261005_calc (
  id BIGINT NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL,
  consultant_id BIGINT NOT NULL,
  calculation_period VARCHAR(20) NULL,
  status VARCHAR(30) NOT NULL,
  commission_earnings DECIMAL(15,2) NULL,
  bonus_earnings DECIMAL(15,2) NULL,
  deductions DECIMAL(15,2) NULL,
  gross_salary DECIMAL(15,2) NULL,
  net_salary DECIMAL(15,2) NULL,
  total_salary DECIMAL(15,2) NULL,
  approved_at DATETIME(6) NULL,
  paid_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,
  updated_by VARCHAR(50) NULL,
  version BIGINT NULL,
  backed_up_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DATAFIX 20261005 calc before';
CREATE TABLE backup_salary_fix_20261005_tax LIKE salary_tax_calculations;
CREATE TABLE backup_salary_fix_20261005_ssp LIKE special_support_monthly_payouts;
CREATE TABLE backup_salary_fix_20261005_audit (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(40) NOT NULL,
  actor VARCHAR(50) NOT NULL,
  calc_id BIGINT NOT NULL,
  payout_mode VARCHAR(20) NULL,
  reason TEXT NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DATAFIX 20261005 audit';

INSERT INTO backup_salary_fix_20261005_calc
  (id, tenant_id, consultant_id, calculation_period, status, commission_earnings, bonus_earnings, deductions,
   gross_salary, net_salary, total_salary, approved_at, paid_at, updated_at, updated_by, version)
SELECT id, tenant_id, consultant_id, calculation_period, status, commission_earnings, bonus_earnings, deductions,
       gross_salary, net_salary, total_salary, approved_at, paid_at, updated_at, updated_by, version
FROM salary_calculations WHERE id = @calc_id;
INSERT INTO backup_salary_fix_20261005_tax SELECT * FROM salary_tax_calculations WHERE calculation_id = @calc_id;
INSERT INTO backup_salary_fix_20261005_ssp SELECT * FROM special_support_monthly_payouts WHERE salary_calculation_id = @calc_id;

SET @c = (SELECT COUNT(*) FROM backup_salary_fix_20261005_calc) = 1
     AND (SELECT COUNT(*) FROM backup_salary_fix_20261005_tax) = 2
     AND (SELECT COUNT(*) FROM backup_salary_fix_20261005_ssp) = 2;
SET @n = 'backup_rowcounts_1_2_2';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- =============================================================================
-- [3] 정정 트랜잭션
-- =============================================================================
START TRANSACTION;

-- 지급 처리와 경합 방지: 대상 calc 행 잠금 후 가드 재확인(잠금 이후 값이 바뀌었으면 중단)
SELECT id INTO @locked_id FROM salary_calculations WHERE id = @calc_id FOR UPDATE;
SELECT COUNT(*) INTO @locked_tax FROM salary_tax_calculations WHERE calculation_id = @calc_id FOR UPDATE;
SELECT COUNT(*) INTO @locked_ssp FROM special_support_monthly_payouts WHERE salary_calculation_id = @calc_id FOR UPDATE;

SET @c = (SELECT COUNT(*) FROM salary_calculations sc JOIN backup_salary_fix_20261005_calc b ON b.id = sc.id
          WHERE sc.id = @calc_id AND sc.status = 'APPROVED' AND sc.paid_at IS NULL
            AND sc.version <=> b.version AND sc.gross_salary = @old_gross AND sc.net_salary = @old_net) = 1;
SET @n = 'tx_recheck_after_lock';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- [3-1] salary_calculations (1행)
UPDATE salary_calculations
   SET bonus_earnings = @new_bonus,
       gross_salary   = @new_gross,
       total_salary   = @new_gross,
       deductions     = @new_tax,
       net_salary     = @new_net,
       updated_at     = NOW(6),
       updated_by     = @actor,
       version        = version + 1
 WHERE id = @calc_id
   AND tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
   AND consultant_id = @consultant_id
   AND calculation_period = @period COLLATE utf8mb4_unicode_ci
   AND status = 'APPROVED'
   AND paid_at IS NULL
   AND IFNULL(calculation_kind, 'PRIMARY') = 'PRIMARY'
   AND is_deleted = FALSE
   AND commission_earnings = @commission
   AND bonus_earnings = @old_bonus
   AND gross_salary = @old_gross
   AND total_salary = @old_gross
   AND deductions = @old_tax
   AND net_salary = @old_net;
SET @rc = ROW_COUNT();
SET @c = (@rc = 1); SET @n = 'rc_salary_calculations_eq_1';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- [3-2] salary_tax_calculations (국세 1행 + 지방세 1행, 제자리 UPDATE)
UPDATE salary_tax_calculations
   SET base_amount = @new_gross, taxable_amount = @new_gross, tax_amount = @new_nat, updated_at = NOW(6)
 WHERE calculation_id = @calc_id
   AND tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
   AND tax_type = 'WITHHOLDING_NATIONAL'
   AND base_amount = @old_gross AND taxable_amount = @old_gross AND tax_amount = @old_nat;
SET @rc = ROW_COUNT();
SET @c = (@rc = 1); SET @n = 'rc_tax_national_eq_1';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

UPDATE salary_tax_calculations
   SET base_amount = @new_gross, taxable_amount = @new_gross, tax_amount = @new_loc, updated_at = NOW(6)
 WHERE calculation_id = @calc_id
   AND tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
   AND tax_type = 'WITHHOLDING_LOCAL'
   AND base_amount = @old_gross AND taxable_amount = @old_gross AND tax_amount = @old_loc;
SET @rc = ROW_COUNT();
SET @c = (@rc = 1); SET @n = 'rc_tax_local_eq_1';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- [3-3] special_support_monthly_payouts (대상 두 행) — 모드에 따라 둘 중 하나만 실행된다
UPDATE special_support_monthly_payouts
   SET amount = 0
 WHERE @payout_mode = 'NEUTRALIZE'
   AND salary_calculation_id = @calc_id
   AND tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
   AND consultant_id = @consultant_id
   AND salary_year_month = @period COLLATE utf8mb4_unicode_ci
   AND amount = @ss_unit
   AND ((mapping_id = @map_a AND client_id = @client_a) OR (mapping_id = @map_b AND client_id = @client_b));
SET @rc_neutralize = ROW_COUNT();

DELETE FROM special_support_monthly_payouts
 WHERE @payout_mode = 'DELETE'
   AND salary_calculation_id = @calc_id
   AND tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci
   AND consultant_id = @consultant_id
   AND salary_year_month = @period COLLATE utf8mb4_unicode_ci
   AND amount = @ss_unit
   AND ((mapping_id = @map_a AND client_id = @client_a) OR (mapping_id = @map_b AND client_id = @client_b));
SET @rc_delete = ROW_COUNT();

SET @c = (@payout_mode = 'NEUTRALIZE' AND @rc_neutralize = 2 AND @rc_delete = 0)
      OR (@payout_mode = 'DELETE'     AND @rc_neutralize = 0 AND @rc_delete = 2);
SET @n = 'rc_payouts_eq_2';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- [3-4] 사후 정합성 (커밋 전)
SET @c = (SELECT COUNT(*) FROM salary_calculations
          WHERE id = @calc_id AND status = 'APPROVED' AND paid_at IS NULL
            AND bonus_earnings = @new_bonus AND gross_salary = @new_gross AND total_salary = @new_gross
            AND deductions = @new_tax AND net_salary = @new_net
            AND gross_salary - deductions = net_salary
            AND commission_earnings + bonus_earnings = gross_salary) = 1
     AND (SELECT SUM(tax_amount) FROM salary_tax_calculations WHERE calculation_id = @calc_id) = @new_tax
     AND (SELECT COUNT(*) FROM salary_tax_calculations WHERE calculation_id = @calc_id AND base_amount = @new_gross) = 2
     AND (SELECT IFNULL(SUM(amount), 0) FROM special_support_monthly_payouts WHERE salary_calculation_id = @calc_id) = 0
     AND (SELECT COUNT(*) FROM special_support_monthly_payouts WHERE salary_calculation_id = @calc_id)
         = IF(@payout_mode = 'NEUTRALIZE', 2, 0);
SET @n = 'post_consistency';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- [3-5] 감사 기록
--  (a) 전용 감사 테이블(백업 스키마 옆)
INSERT INTO backup_salary_fix_20261005_audit (action, actor, calc_id, payout_mode, reason, before_json, after_json)
VALUES ('CORRECTION', @actor, @calc_id, @payout_mode, @reason,
        JSON_OBJECT('bonus_earnings', @old_bonus, 'gross_salary', @old_gross, 'total_salary', @old_gross,
                    'deductions', @old_tax, 'net_salary', @old_net,
                    'tax', JSON_OBJECT('WITHHOLDING_NATIONAL', @old_nat, 'WITHHOLDING_LOCAL', @old_loc),
                    'payouts', (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'mapping_id', mapping_id, 'client_id', client_id,
                                                                 'amount', amount, 'salary_year_month', salary_year_month))
                                FROM backup_salary_fix_20261005_ssp)),
        JSON_OBJECT('bonus_earnings', @new_bonus, 'gross_salary', @new_gross, 'total_salary', @new_gross,
                    'deductions', @new_tax, 'net_salary', @new_net,
                    'tax', JSON_OBJECT('WITHHOLDING_NATIONAL', @new_nat, 'WITHHOLDING_LOCAL', @new_loc),
                    'payouts', IF(@payout_mode = 'NEUTRALIZE', 'amount=0 (rows kept)', 'deleted')));
SET @rc = ROW_COUNT();
SET @c = (@rc = 1); SET @n = 'rc_audit_backup_table_eq_1';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

--  (b) 앱 스키마 내 감사 행: erp_sync_logs (sync_type 'SALARY' · status 'COMPLETED' 은 ErpSyncLog enum 에 있는 값).
--      audit_logs 는 action 이 JPA EnumType.STRING(AuditAction) 이라 enum 에 없는 값을 넣으면
--      관리자 감사 로그 목록(findByTenantIdOrderByCreatedAtDesc) 조회가 깨질 수 있어 쓰지 않는다.
INSERT INTO erp_sync_logs (sync_type, sync_date, records_processed, status, error_message, tenant_id,
                           started_at, completed_at, duration_seconds, sync_data, created_at, created_by)
VALUES ('SALARY', NOW(6), 1, 'COMPLETED', NULL, @tenant_id,
        NOW(6), NOW(6), 0,
        JSON_OBJECT('type', 'DATA_CORRECTION', 'ticket', 'salary-mismatch-0905', 'calculation_id', @calc_id,
                    'consultant_id', @consultant_id, 'period', @period, 'payout_mode', @payout_mode,
                    'removed_special_support', @old_bonus, 'mappings', JSON_ARRAY(@map_a, @map_b),
                    'before', JSON_OBJECT('gross_salary', @old_gross, 'deductions', @old_tax, 'net_salary', @old_net),
                    'after',  JSON_OBJECT('gross_salary', @new_gross, 'deductions', @new_tax, 'net_salary', @new_net),
                    'reason', @reason, 'backup_tables', 'backup_salary_fix_20261005_{calc,tax,ssp,audit}'),
        NOW(6), @actor);
SET @rc = ROW_COUNT();
SET @c = (@rc = 1); SET @n = 'rc_audit_erp_sync_logs_eq_1';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`')); PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

COMMIT;

-- =============================================================================
-- [4] AFTER 스냅샷
-- =============================================================================
SELECT 'AFTER' AS snapshot, sc.id, sc.status, sc.paid_at IS NULL AS unpaid, sc.version, sc.updated_by,
       sc.bonus_earnings = @new_bonus AS bonus_eq_new, sc.gross_salary = @new_gross AS gross_eq_new,
       sc.total_salary = @new_gross AS total_eq_new, sc.deductions = @new_tax AS tax_eq_new,
       sc.net_salary = @new_net AS net_eq_new
FROM salary_calculations sc WHERE sc.id = @calc_id;
SELECT 'AFTER tax' AS snapshot, t.id, t.tax_type, t.base_amount = @new_gross AS base_eq_new,
       t.tax_amount = CASE t.tax_type WHEN 'WITHHOLDING_NATIONAL' THEN @new_nat WHEN 'WITHHOLDING_LOCAL' THEN @new_loc END AS tax_eq_new
FROM salary_tax_calculations t WHERE t.calculation_id = @calc_id ORDER BY t.id;
SELECT 'AFTER payouts' AS snapshot, sp.id, sp.mapping_id, sp.client_id, sp.salary_year_month, sp.amount = 0 AS amount_zero
FROM special_support_monthly_payouts sp WHERE sp.salary_calculation_id = @calc_id ORDER BY sp.id;
SELECT 'AFTER untouched' AS snapshot, COUNT(*) AS other_calcs_of_consultant_touched
FROM salary_calculations sc
WHERE sc.tenant_id = @tenant_id COLLATE utf8mb4_unicode_ci AND sc.consultant_id = @consultant_id
  AND sc.id <> @calc_id AND sc.updated_by = @actor COLLATE utf8mb4_unicode_ci;
SELECT 'AFTER audit' AS snapshot, a.id, a.action, a.actor, a.calc_id, a.payout_mode, a.created_at
FROM backup_salary_fix_20261005_audit a ORDER BY a.id;
