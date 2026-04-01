-- AI 분석 결과 필드 추가 — 인덱스만 (재실행·부분 적용)
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'security_threat_detection' AND INDEX_NAME = 'idx_threat_ai_analysis') > 0,
    'SELECT 1',
    'CREATE INDEX idx_threat_ai_analysis ON security_threat_detection(threat_type, detected_at)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
