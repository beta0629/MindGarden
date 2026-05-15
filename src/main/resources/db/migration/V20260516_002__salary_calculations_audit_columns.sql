-- salary_calculations: 승인·지급 표준 프로시저 및 JPA와 정합 (updated_by, 타임스탬프)
-- information_schema로 컬럼 존재 시 스킵 (재실행·환경 차이 대응)
-- @author MindGarden
-- @since 2026-05-15

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
