-- ============================================
-- 상담사·내담자 등록 추가 항목: users rrn_encrypted, clients address_detail/postal_code
-- 기획: CONSULTANT_CLIENT_REGISTRATION_ADDITIONS_PLAN.md
-- @author MindGarden
-- @since 2026-03-02
-- ============================================
-- NULL 허용, 기존 데이터 호환. 이미 있으면 제외(조건부 추가).
-- ============================================

-- 1. users.rrn_encrypted (주민번호 암호화 저장)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'rrn_encrypted');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN rrn_encrypted VARCHAR(500) NULL COMMENT ''주민번호 암호화값(앞6+뒤1)''',
    'SELECT ''users.rrn_encrypted already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. users.address, address_detail, postal_code (없을 경우만 추가)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'address');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN address VARCHAR(500) NULL COMMENT ''기본 주소''',
    'SELECT ''users.address already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'address_detail');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN address_detail VARCHAR(500) NULL COMMENT ''상세 주소''',
    'SELECT ''users.address_detail already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'postal_code');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN postal_code VARCHAR(20) NULL COMMENT ''우편번호''',
    'SELECT ''users.postal_code already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. clients.address_detail (없을 경우만 추가)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'address_detail');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE clients ADD COLUMN address_detail VARCHAR(500) NULL COMMENT ''상세 주소''',
    'SELECT ''clients.address_detail already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. clients.postal_code (없을 경우만 추가)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'postal_code');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE clients ADD COLUMN postal_code VARCHAR(20) NULL COMMENT ''우편번호''',
    'SELECT ''clients.postal_code already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
