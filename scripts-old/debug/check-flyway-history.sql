-- Flyway 마이그레이션 히스토리 확인
SELECT version, description, type, script, installed_on, execution_time, success 
FROM flyway_schema_history 
ORDER BY installed_rank DESC 
LIMIT 10;

-- onboarding_request 테이블 존재 확인
SHOW TABLES LIKE 'onboarding_request';

