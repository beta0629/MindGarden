-- Flyway 마이그레이션 상태 확인
SELECT version, description, installed_on, success 
FROM flyway_schema_history 
WHERE version IN ('V13', 'V15', 'V41') 
ORDER BY installed_rank;

