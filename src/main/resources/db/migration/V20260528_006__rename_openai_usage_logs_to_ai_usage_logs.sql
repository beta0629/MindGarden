-- V20260528_006: openai_usage_logs → ai_usage_logs 테이블 리네임
--
-- 트랙 B PR-2 (Phase 4 리네임 일괄, 기획서 §7 Q5=a):
--   - 엔티티 OpenAIUsageLog → AiUsageLog (@Table(name="ai_usage_logs"))
--   - 멀티 AI 프로바이더 (OpenAI/Gemini/Claude/Replicate) 통합 사용 로그 테이블로 의미 명확화
--
-- 보존: 솔라피 V20260528_003 미적용 보존 (본 마이그레이션과 무관)
--
-- 멱등성: 이미 ai_usage_logs 가 존재하거나 openai_usage_logs 가 없으면 RENAME 생략
-- (Flyway repair 후 재실행·부분 적용 환경 대응)

SET @dbname = DATABASE();

-- 1) openai_usage_logs 가 존재하고 ai_usage_logs 가 존재하지 않을 때만 RENAME
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'openai_usage_logs') > 0
    AND
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'ai_usage_logs') = 0,
    'RENAME TABLE openai_usage_logs TO ai_usage_logs',
    'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
