-- clients PII 컬럼: users 테이블 암호문(최대 500) 복사 시 truncation 방지
-- AdminServiceImpl registerClient / updateClient 가 savedUser 값을 Client 에 그대로 저장함
--
-- 실패 복구: flyway_schema_history 에 success=0 만 있는 버전은 repair 후 동일 스크립트가 재실행됨.
-- 이미 VARCHAR(500) 인 컬럼에 동일 정의의 MODIFY 를 다시 적용하는 것은 무해(멱등에 가깝게 동작).
--
-- DDL 메모: 단일 ALTER 에 다중 MODIFY COLUMN + COLLATE 반복은 일부 MySQL 8 / 환경에서
-- 파서·온라인 DDL 조합 이슈로 실패하는 사례가 있어, 컬럼별 ALTER 로 분리한다.
-- COLLATE 는 테이블 기본 collation 을 따른다(불필요한 COLLATE 재지정 제거).
-- email UNIQUE: 길이 확장만인 경우 InnoDB 가 인덱스 키 길이를 갱신하며, 별도 DROP/ADD INDEX 불필요.
--
-- 레거시 NULL 행: MODIFY ... NOT NULL 시 MySQL 1138 (Invalid use of NULL value) 발생.
-- id 기반 placeholder로 UNIQUE(email) 충돌을 피한다. 이미 값이 있으면 UPDATE 는 0행.
--
-- @author CoreSolution
-- @since 2026-03-30

UPDATE clients
SET name = CONCAT('__migrate_missing_name_', LPAD(CAST(id AS CHAR), 19, '0'))
WHERE name IS NULL;

UPDATE clients
SET email = CONCAT('__migrate_missing_email_', LPAD(CAST(id AS CHAR), 19, '0'), '@clients.migrate.invalid')
WHERE email IS NULL;

ALTER TABLE clients MODIFY COLUMN name VARCHAR(500) NOT NULL;

ALTER TABLE clients MODIFY COLUMN email VARCHAR(500) NOT NULL;

ALTER TABLE clients MODIFY COLUMN phone VARCHAR(500) NULL;

ALTER TABLE clients MODIFY COLUMN gender VARCHAR(500) NULL;

ALTER TABLE clients MODIFY COLUMN address VARCHAR(500) NULL;

ALTER TABLE clients MODIFY COLUMN emergency_contact VARCHAR(500) NULL;

ALTER TABLE clients MODIFY COLUMN emergency_phone VARCHAR(500) NULL;
