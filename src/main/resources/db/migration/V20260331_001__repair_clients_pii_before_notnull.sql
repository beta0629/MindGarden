-- clients PII 정합: NULL·공백-only email/name 을 users(동일 PK·CLIENT)로 보강 후 placeholder.
-- V20260330_001 이 배포·체크섬 고정인 환경에서 빈 문자열·배포본 불일치 등으로 남은 무효값을 제거한다.
-- DDL 은 information_schema 로 이미 목표 정의인 경우 스킵(멱등).
--
-- 주의: flyway_schema_history 에서 V20260330_001 이 아직 실패(success=0)인 DB는
-- 마이그레이션 순서상 본 버전이 자동 실행되지 않는다. repair 후 V20260330 재시도 전에
-- 동일 UPDATE 블록을 수동 실행해야 할 수 있다.
--
-- @author CoreSolution
-- @since 2026-03-31

-- 1) email: users 에서 보강 (내담자·동일 id)
UPDATE clients c
INNER JOIN users u ON c.id = u.id AND u.role = 'CLIENT'
SET c.email = u.email
WHERE (c.email IS NULL OR TRIM(c.email) = '')
  AND u.email IS NOT NULL
  AND TRIM(u.email) <> '';

-- 2) email: 여전히 NULL/빈 값 → id 기반 placeholder (UNIQUE 충돌 방지)
UPDATE clients
SET email = CONCAT('__migrate_missing_email_', LPAD(CAST(id AS CHAR), 19, '0'), '@clients.migrate.invalid')
WHERE email IS NULL OR TRIM(email) = '';

-- 3) name: users 에서 보강
UPDATE clients c
INNER JOIN users u ON c.id = u.id AND u.role = 'CLIENT'
SET c.name = u.name
WHERE (c.name IS NULL OR TRIM(c.name) = '')
  AND u.name IS NOT NULL
  AND TRIM(u.name) <> '';

-- 4) name: placeholder
UPDATE clients
SET name = CONCAT('__migrate_missing_name_', LPAD(CAST(id AS CHAR), 19, '0'))
WHERE name IS NULL OR TRIM(name) = '';

-- 5) 길이 초과 값 정리 (MODIFY 전 Data too long 방지)
UPDATE clients SET phone = LEFT(phone, 500) WHERE phone IS NOT NULL AND CHAR_LENGTH(phone) > 500;
UPDATE clients SET gender = LEFT(gender, 500) WHERE gender IS NOT NULL AND CHAR_LENGTH(gender) > 500;
UPDATE clients SET address = LEFT(address, 500) WHERE address IS NOT NULL AND CHAR_LENGTH(address) > 500;
UPDATE clients SET emergency_contact = LEFT(emergency_contact, 500)
WHERE emergency_contact IS NOT NULL AND CHAR_LENGTH(emergency_contact) > 500;
UPDATE clients SET emergency_phone = LEFT(emergency_phone, 500)
WHERE emergency_phone IS NOT NULL AND CHAR_LENGTH(emergency_phone) > 500;

SET @addr_detail_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'address_detail');
SET @sql_truncate_ad = IF(@addr_detail_exists > 0,
    'UPDATE clients SET address_detail = LEFT(address_detail, 500) WHERE address_detail IS NOT NULL AND CHAR_LENGTH(address_detail) > 500',
    'SELECT ''skip address_detail truncate''');
PREPARE stmt_truncate_ad FROM @sql_truncate_ad;
EXECUTE stmt_truncate_ad;
DEALLOCATE PREPARE stmt_truncate_ad;

-- 6) 컬럼별 MODIFY: nullable 이거나 길이가 500 미만일 때만 (V20260330 완료 DB에서는 no-op)

SET @need_name = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'name'
      AND (IS_NULLABLE = 'YES' OR IFNULL(CHARACTER_MAXIMUM_LENGTH, 0) < 500));
SET @sql = IF(@need_name > 0,
    'ALTER TABLE clients MODIFY COLUMN name VARCHAR(500) NOT NULL',
    'SELECT ''skip clients.name (already VARCHAR(500) NOT NULL)''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @need_email = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'email'
      AND (IS_NULLABLE = 'YES' OR IFNULL(CHARACTER_MAXIMUM_LENGTH, 0) < 500));
SET @sql = IF(@need_email > 0,
    'ALTER TABLE clients MODIFY COLUMN email VARCHAR(500) NOT NULL',
    'SELECT ''skip clients.email (already VARCHAR(500) NOT NULL)''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @need_phone = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'phone'
      AND IFNULL(CHARACTER_MAXIMUM_LENGTH, 0) < 500);
SET @sql = IF(@need_phone > 0,
    'ALTER TABLE clients MODIFY COLUMN phone VARCHAR(500) NULL',
    'SELECT ''skip clients.phone''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @need_gender = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'gender'
      AND IFNULL(CHARACTER_MAXIMUM_LENGTH, 0) < 500);
SET @sql = IF(@need_gender > 0,
    'ALTER TABLE clients MODIFY COLUMN gender VARCHAR(500) NULL',
    'SELECT ''skip clients.gender''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @need_address = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'address'
      AND IFNULL(CHARACTER_MAXIMUM_LENGTH, 0) < 500);
SET @sql = IF(@need_address > 0,
    'ALTER TABLE clients MODIFY COLUMN address VARCHAR(500) NULL',
    'SELECT ''skip clients.address''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @need_ec = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'emergency_contact'
      AND IFNULL(CHARACTER_MAXIMUM_LENGTH, 0) < 500);
SET @sql = IF(@need_ec > 0,
    'ALTER TABLE clients MODIFY COLUMN emergency_contact VARCHAR(500) NULL',
    'SELECT ''skip clients.emergency_contact''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @need_ep = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'emergency_phone'
      AND IFNULL(CHARACTER_MAXIMUM_LENGTH, 0) < 500);
SET @sql = IF(@need_ep > 0,
    'ALTER TABLE clients MODIFY COLUMN emergency_phone VARCHAR(500) NULL',
    'SELECT ''skip clients.emergency_phone''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
