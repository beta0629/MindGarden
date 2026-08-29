-- =============================================================================
-- V20260829_004 — salary_calculations: calculation_kind / parent_calculation_id
-- ---------------------------------------------------------------------------
-- 계획서: docs/project-management/SALARY_LATE_NOTES_ADJUSTMENT_PLAN.md
-- tip 기준: V20260828_003. V20260829_001/002 는 #681 예약 — 본 파일만 사용.
--
-- 정책:
--   • calculation_kind: PRIMARY | ADJUSTMENT (기존 행 PRIMARY 백필)
--   • parent_calculation_id: ADJUSTMENT 만 PRIMARY id 참조 (FK)
--   • 비삭제 PRIMARY 1건 per (tenant_id, consultant_id, calculation_period)
--     — MySQL partial unique 대용: generated STORED 컬럼 + UNIQUE
--       (PRIMARY·비삭제만 키값, ADJUSTMENT/삭제는 NULL → UNIQUE 충돌 없음)
--   • 프로시저 DROP/CREATE 는 본 마이그에 포함하지 않음 (SYSTEM_USER 이슈).
--     SSOT: database/schema/procedures_standardized/*.sql + deployment twin
-- =============================================================================

SET @dbname = DATABASE();

-- -----------------------------------------------------------------------------
-- 1. calculation_kind (멱등)
-- -----------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'salary_calculations'
       AND COLUMN_NAME = 'calculation_kind') > 0,
    'SELECT 1',
    'ALTER TABLE salary_calculations ADD COLUMN calculation_kind VARCHAR(20) NOT NULL DEFAULT ''PRIMARY'' COMMENT ''PRIMARY|ADJUSTMENT'' AFTER status'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 기존 행 백필 (DEFAULT 적용 전 레거시 NULL 방어)
UPDATE salary_calculations
SET calculation_kind = 'PRIMARY'
WHERE calculation_kind IS NULL OR calculation_kind = '';

-- -----------------------------------------------------------------------------
-- 2. parent_calculation_id (멱등)
-- -----------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'salary_calculations'
       AND COLUMN_NAME = 'parent_calculation_id') > 0,
    'SELECT 1',
    'ALTER TABLE salary_calculations ADD COLUMN parent_calculation_id BIGINT NULL COMMENT ''ADJUSTMENT → PRIMARY salary_calculations.id'' AFTER calculation_kind'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK (멱등)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'salary_calculations'
       AND CONSTRAINT_NAME = 'fk_salary_calculations_parent'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY') > 0,
    'SELECT 1',
    'ALTER TABLE salary_calculations ADD CONSTRAINT fk_salary_calculations_parent FOREIGN KEY (parent_calculation_id) REFERENCES salary_calculations (id)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 3. 중복 PRIMARY 사전 점검 — UNIQUE 실패 방지
-- -----------------------------------------------------------------------------
SET @duplicatePrimaryCount = (
    SELECT COALESCE(SUM(dup_cnt - 1), 0)
    FROM (
        SELECT COUNT(*) AS dup_cnt
        FROM salary_calculations
        WHERE is_deleted = FALSE
          AND calculation_kind = 'PRIMARY'
          AND calculation_period IS NOT NULL
          AND calculation_period <> ''
        GROUP BY tenant_id, consultant_id, calculation_period
        HAVING COUNT(*) > 1
    ) AS dup_groups
);

SET @msg = CONCAT(
    'V20260829_004 ABORT — salary_calculations 비삭제 PRIMARY 중복 ',
    @duplicatePrimaryCount,
    ' 건. 정리 후 재실행 필요.'
);

SET @preparedStatement = (SELECT IF(
    @duplicatePrimaryCount > 0,
    CONCAT('SIGNAL SQLSTATE ''45000'' SET MESSAGE_TEXT = ''', @msg, ''''),
    'SELECT 1'
));
PREPARE abortIfDuplicates FROM @preparedStatement;
EXECUTE abortIfDuplicates;
DEALLOCATE PREPARE abortIfDuplicates;

-- -----------------------------------------------------------------------------
-- 4. partial unique 대용 generated 컬럼 + UNIQUE (멱등)
--    PRIMARY·비삭제만 tenant|consultant|period 키, 그 외 NULL
-- -----------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'salary_calculations'
       AND COLUMN_NAME = 'primary_period_uk') > 0,
    'SELECT 1',
    CONCAT(
        'ALTER TABLE salary_calculations ADD COLUMN primary_period_uk VARCHAR(200) ',
        'GENERATED ALWAYS AS (',
        'CASE WHEN (is_deleted = 0 OR is_deleted IS FALSE) ',
        'AND calculation_kind = ''PRIMARY'' ',
        'AND calculation_period IS NOT NULL ',
        'AND calculation_period <> '''' ',
        'THEN CONCAT(tenant_id, ''|'', consultant_id, ''|'', calculation_period) ',
        'ELSE NULL END',
        ') STORED COMMENT ''비삭제 PRIMARY 월 유니크 키'''
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'salary_calculations'
       AND INDEX_NAME = 'uk_salary_calculations_primary_period') > 0,
    'SELECT 1',
    'CREATE UNIQUE INDEX uk_salary_calculations_primary_period ON salary_calculations (primary_period_uk)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 조회 보조 인덱스 (멱등)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'salary_calculations'
       AND INDEX_NAME = 'idx_salary_calculations_parent') > 0,
    'SELECT 1',
    'CREATE INDEX idx_salary_calculations_parent ON salary_calculations (tenant_id, parent_calculation_id)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
