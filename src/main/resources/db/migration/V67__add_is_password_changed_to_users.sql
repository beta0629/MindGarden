-- users.is_password_changed (재실행·부분 적용)
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_password_changed') > 0,
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN is_password_changed BOOLEAN NOT NULL DEFAULT TRUE COMMENT ''비밀번호 변경 여부 (임시 비밀번호인 경우 false, 비밀번호 변경 후 true)'''
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
