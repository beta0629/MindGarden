-- 실패한 마이그레이션 40번 삭제
DELETE FROM flyway_schema_history WHERE version = '40' AND success = 0;

