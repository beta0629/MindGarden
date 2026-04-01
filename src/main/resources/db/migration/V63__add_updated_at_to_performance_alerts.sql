-- V63: performance_alerts.updated_at (재실행·부분 적용: 컬럼 있으면 ADD 스킵)
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'performance_alerts' AND COLUMN_NAME = 'updated_at') > 0,
    'SELECT 1',
    'ALTER TABLE performance_alerts ADD COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) AFTER created_at'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE performance_alerts
SET updated_at = created_at
WHERE updated_at IS NULL;
