-- V69: openai_usage_logs 멀티 AI 확장 (재실행·부분 적용)
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'openai_usage_logs' AND COLUMN_NAME = 'ai_provider') > 0,
    'SELECT 1',
    'ALTER TABLE openai_usage_logs ADD COLUMN ai_provider VARCHAR(50) DEFAULT ''OPENAI'' COMMENT ''AI 제공자: OPENAI, GEMINI, GOOGLE_SPEECH 등'' AFTER model'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'openai_usage_logs' AND COLUMN_NAME = 'api_endpoint') > 0,
    'SELECT 1',
    'ALTER TABLE openai_usage_logs ADD COLUMN api_endpoint VARCHAR(200) COMMENT ''API 엔드포인트 URL'' AFTER ai_provider'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'openai_usage_logs' AND COLUMN_NAME = 'response_time_ms') > 0,
    'SELECT 1',
    'ALTER TABLE openai_usage_logs ADD COLUMN response_time_ms INT COMMENT ''응답 시간 (밀리초)'' AFTER estimated_cost'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'openai_usage_logs' AND COLUMN_NAME = 'is_success') > 0,
    'SELECT 1',
    'ALTER TABLE openai_usage_logs ADD COLUMN is_success BOOLEAN DEFAULT TRUE COMMENT ''요청 성공 여부'' AFTER response_time_ms'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'openai_usage_logs' AND COLUMN_NAME = 'error_message') > 0,
    'SELECT 1',
    'ALTER TABLE openai_usage_logs ADD COLUMN error_message TEXT COMMENT ''에러 메시지 (실패 시)'' AFTER is_success'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'openai_usage_logs' AND INDEX_NAME = 'idx_ai_provider') > 0,
    'SELECT 1',
    'CREATE INDEX idx_ai_provider ON openai_usage_logs(ai_provider)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'openai_usage_logs' AND INDEX_NAME = 'idx_is_success') > 0,
    'SELECT 1',
    'CREATE INDEX idx_is_success ON openai_usage_logs(is_success)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'openai_usage_logs' AND INDEX_NAME = 'idx_tenant_provider') > 0,
    'SELECT 1',
    'CREATE INDEX idx_tenant_provider ON openai_usage_logs(tenant_id, ai_provider)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'openai_usage_logs' AND INDEX_NAME = 'idx_created_at_provider') > 0,
    'SELECT 1',
    'CREATE INDEX idx_created_at_provider ON openai_usage_logs(created_at, ai_provider)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE openai_usage_logs
SET ai_provider = 'OPENAI'
WHERE ai_provider IS NULL;

ALTER TABLE openai_usage_logs
COMMENT='AI 사용량 로그 (OpenAI, Gemini, Google Speech 등 멀티 AI 제공자 지원)';
