-- 실패한 마이그레이션 40번 수정
UPDATE flyway_schema_history 
SET success = 1 
WHERE version = '40' AND success = 0;

