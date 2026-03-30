-- Flyway 실패한 마이그레이션 기록 수정 스크립트
-- V34 마이그레이션 실패 기록 삭제

-- 실패한 V34 마이그레이션 기록 삭제
DELETE FROM flyway_schema_history 
WHERE version = '34' AND success = 0;

-- 확인
SELECT * FROM flyway_schema_history 
WHERE version = '34' 
ORDER BY installed_rank DESC 
LIMIT 5;

