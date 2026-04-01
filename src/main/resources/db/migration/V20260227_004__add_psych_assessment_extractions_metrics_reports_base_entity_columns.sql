-- psych_assessment_extractions, psych_assessment_metrics, psych_assessment_reports
-- BaseEntity 필수 컬럼 추가 (version, deleted_at)
-- 참조: V20260227_003 (documents 마이그레이션)
-- 운영 DB에 이미 컬럼이 있어도 실패하지 않도록 information_schema 기준 idempotent 처리

SET @dbname = DATABASE();

SET @tablename = 'psych_assessment_extractions';
SET @columnname = 'deleted_at';
SET @prepared = (
    SELECT COUNT(*) = 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
);
SET @sql = IF(
    @prepared,
    'ALTER TABLE psych_assessment_extractions ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''Column psych_assessment_extractions.deleted_at already exists'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @tablename = 'psych_assessment_extractions';
SET @columnname = 'version';
SET @prepared = (
    SELECT COUNT(*) = 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
);
SET @sql = IF(
    @prepared,
    'ALTER TABLE psych_assessment_extractions ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT ''Column psych_assessment_extractions.version already exists'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @tablename = 'psych_assessment_metrics';
SET @columnname = 'deleted_at';
SET @prepared = (
    SELECT COUNT(*) = 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
);
SET @sql = IF(
    @prepared,
    'ALTER TABLE psych_assessment_metrics ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''Column psych_assessment_metrics.deleted_at already exists'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @tablename = 'psych_assessment_metrics';
SET @columnname = 'version';
SET @prepared = (
    SELECT COUNT(*) = 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
);
SET @sql = IF(
    @prepared,
    'ALTER TABLE psych_assessment_metrics ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT ''Column psych_assessment_metrics.version already exists'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @tablename = 'psych_assessment_reports';
SET @columnname = 'deleted_at';
SET @prepared = (
    SELECT COUNT(*) = 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
);
SET @sql = IF(
    @prepared,
    'ALTER TABLE psych_assessment_reports ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''Column psych_assessment_reports.deleted_at already exists'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @tablename = 'psych_assessment_reports';
SET @columnname = 'version';
SET @prepared = (
    SELECT COUNT(*) = 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
);
SET @sql = IF(
    @prepared,
    'ALTER TABLE psych_assessment_reports ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT ''Column psych_assessment_reports.version already exists'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
