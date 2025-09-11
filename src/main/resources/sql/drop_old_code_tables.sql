-- 기존 코드 테이블 삭제 스크립트
-- code_groups + code_values 테이블의 데이터가 common_codes 테이블로 마이그레이션 완료 후 실행

-- 외래키 제약조건 확인 및 삭제
SET FOREIGN_KEY_CHECKS = 0;

-- 기존 코드 테이블 삭제
DROP TABLE IF EXISTS code_values;
DROP TABLE IF EXISTS code_groups;

-- 외래키 제약조건 복원
SET FOREIGN_KEY_CHECKS = 1;

-- 삭제 완료 로그
SELECT '기존 코드 테이블 삭제 완료' AS message;
