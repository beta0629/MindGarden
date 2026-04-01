-- onboarding_request.subdomain (재실행·부분 적용)
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'onboarding_request' AND COLUMN_NAME = 'subdomain') > 0,
    'SELECT 1',
    'ALTER TABLE onboarding_request ADD COLUMN subdomain VARCHAR(100) NULL COMMENT ''서브도메인 (예: mycompany.dev.core-solution.co.kr의 mycompany 부분)'' AFTER tenant_id'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
