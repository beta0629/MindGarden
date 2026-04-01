-- psych_assessment_documents: BaseEntity 필수 컬럼 추가 (version, deleted_at)
-- JPA 조회 시 Unknown column 예외로 500 발생 방지
-- 이미 컬럼이 있는 DB에서도 적용 가능하도록 information_schema 기준 idempotent 처리

SET @dbname = DATABASE();
SET @tablename = 'psych_assessment_documents';

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
    'ALTER TABLE psych_assessment_documents ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''Column deleted_at already exists'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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
    'ALTER TABLE psych_assessment_documents ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT ''Column version already exists'' AS msg'
);
PREPARE stmt2 FROM @sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
