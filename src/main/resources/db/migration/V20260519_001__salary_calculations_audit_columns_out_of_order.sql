-- salary_calculations: 운영 등에서 V20260516_002가 스킵된(out-of-order) 환경용 보강.
-- 내용은 V20260516_002와 동일하며 information_schema 기준 idempotent (중복 적용 안전).
-- 신규 DB는 16_002 적용 후 본 스크립트는 컬럼 존재 시 전부 no-op.
-- @author MindGarden
-- @since 2026-05-19

SET @db := DATABASE();

-- updated_by (ApproveSalaryWithErpSync / ProcessSalaryPaymentWithErpSync 필수)
SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'salary_calculations' AND COLUMN_NAME = 'updated_by') = 0,
    'ALTER TABLE salary_calculations ADD COLUMN updated_by VARCHAR(50) NULL COMMENT ''마지막 수정자''',
    'SELECT 1'
) INTO @stmt;
PREPARE ps FROM @stmt;
EXECUTE ps;
DEALLOCATE PREPARE ps;

-- created_by (감사·프로시저 확장 정합, 없을 때만 추가)
SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'salary_calculations' AND COLUMN_NAME = 'created_by') = 0,
    'ALTER TABLE salary_calculations ADD COLUMN created_by VARCHAR(50) NULL COMMENT ''생성자''',
    'SELECT 1'
) INTO @stmt;
PREPARE ps FROM @stmt;
EXECUTE ps;
DEALLOCATE PREPARE ps;

-- approved_at (승인 시각, 없을 때만)
SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'salary_calculations' AND COLUMN_NAME = 'approved_at') = 0,
    'ALTER TABLE salary_calculations ADD COLUMN approved_at DATETIME(6) NULL COMMENT ''승인 시각''',
    'SELECT 1'
) INTO @stmt;
PREPARE ps FROM @stmt;
EXECUTE ps;
DEALLOCATE PREPARE ps;

-- paid_at (지급 완료 시각, 없을 때만)
SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'salary_calculations' AND COLUMN_NAME = 'paid_at') = 0,
    'ALTER TABLE salary_calculations ADD COLUMN paid_at DATETIME(6) NULL COMMENT ''지급 완료 시각''',
    'SELECT 1'
) INTO @stmt;
PREPARE ps FROM @stmt;
EXECUTE ps;
DEALLOCATE PREPARE ps;
