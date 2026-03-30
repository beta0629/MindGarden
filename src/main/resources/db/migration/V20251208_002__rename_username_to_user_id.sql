-- 표준화 2025-12-08: username 컬럼을 user_id로 변경
-- Java 필드명과 DB 컬럼명 일치

-- 1. users 테이블의 username 컬럼을 user_id로 변경
ALTER TABLE users 
CHANGE COLUMN username user_id VARCHAR(50) NOT NULL;

-- 2. 인덱스 이름 변경 (UK_users_username -> UK_users_user_id)
ALTER TABLE users 
DROP INDEX UK_users_username;

ALTER TABLE users 
ADD CONSTRAINT UK_users_user_id UNIQUE (user_id);

-- 3. 관련 외래키나 참조가 있다면 확인 필요 (현재는 없음)

