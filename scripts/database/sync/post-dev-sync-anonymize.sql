-- =============================================================================
-- 개발 DB 전용: prod→dev 복원 직후 PII 치환 (POST_SYNC_SQL_FILE)
-- =============================================================================
-- 대상: DEV DB ONLY. 운영(prod)에서 실행 금지.
-- 표준: docs/standards/PII_PROTECTION_STANDARD.md §2
-- 런북: docs/project-management/PROD_TO_DEV_DB_SYNC_RUNBOOK.md
--
-- 전략 (P0)
--   1) AES @Convert 컬럼(users/clients 의 name·email·phone·nickname 등):
--      식별 가능한 운영 암호문 → 행 id 기반 데모 평문 으로 치환.
--      PersonalDataEncryptionUtil.safeDecrypt() 는 암호문 형태가 아니면 평문 그대로
--      반환하므로 개발 앱 로그인·목록·검색이 깨지지 않는다.
--      이후 JPA 저장 시 AttributeConverter 가 활성 키로 재암호화한다.
--   2) UserAnonymizationService 는 사용하지 않음 (ANONYMIZED·tombstone·비활성화로
--      개발 로그인을 망가뜨림).
--   3) 보존: tenant_id, id, user_id, password, role, lifecycle_state, FK·업무 데이터.
--   4) consultants PII 는 users(JOINED) 에 있으므로 users UPDATE 로 충분.
--
-- 선택 실행 (수동):
--   mysql ... mind_garden_dev < scripts/database/sync/post-dev-sync-anonymize.sql
-- dry-run 샘플: post-dev-sync-anonymize-dry-run.sql
-- =============================================================================

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- users (PII §2: name, phone, email + 주소·주민·소셜 토큰 등)
-- -----------------------------------------------------------------------------
UPDATE users
SET
    email = CONCAT('dev-u-', id, '@dev.local'),
    name = CONCAT('DevUser-', LPAD(id, 6, '0')),
    nickname = IF(nickname IS NULL OR nickname = '', NULL, CONCAT('nick-', id)),
    phone = CONCAT('010-0000-', LPAD(MOD(id, 10000), 4, '0')),
    gender = NULL,
    birth_date = NULL,
    rrn_encrypted = NULL,
    address = NULL,
    address_detail = NULL,
    postal_code = NULL,
    profile_image_url = NULL,
    memo = NULL,
    notes = NULL,
    social_provider = NULL,
    social_provider_user_id = NULL,
    social_linked_at = NULL,
    is_social_account = 0,
    email_verification_token = NULL,
    email_verification_expires_at = NULL,
    password_reset_token = NULL,
    password_reset_expires_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- clients (PII §2 + 비상연락·의료·차량 등)
-- -----------------------------------------------------------------------------
UPDATE clients
SET
    name = CONCAT('DevClient-', LPAD(id, 6, '0')),
    email = CONCAT('dev-c-', id, '@dev.local'),
    phone = CONCAT('010-1000-', LPAD(MOD(id, 10000), 4, '0')),
    gender = NULL,
    birth_date = NULL,
    address = NULL,
    address_detail = NULL,
    postal_code = NULL,
    vehicle_plate = NULL,
    emergency_contact = NULL,
    emergency_phone = NULL,
    medical_history = NULL,
    allergies = NULL,
    medications = NULL,
    consultation_purpose = NULL,
    consultation_history = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- accounts (계좌번호·예금주) — 테이블 있을 때만
-- -----------------------------------------------------------------------------
SET @has_accounts := (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts'
);
SET @sql_accounts := IF(
    @has_accounts > 0,
    'UPDATE accounts SET account_number = CONCAT(''****'', LPAD(MOD(id, 10000), 4, ''0'')), account_holder = CONCAT(''DevHolder-'', id), updated_at = CURRENT_TIMESTAMP WHERE id IS NOT NULL',
    'SELECT 1'
);
PREPARE stmt_accounts FROM @sql_accounts;
EXECUTE stmt_accounts;
DEALLOCATE PREPARE stmt_accounts;

-- -----------------------------------------------------------------------------
-- branches (연락·주소 — 테넌트 식별자/이름 유지)
-- -----------------------------------------------------------------------------
SET @has_branches := (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches'
);
SET @sql_branches := IF(
    @has_branches > 0,
    'UPDATE branches SET phone_number = ''02-0000-0000'', fax_number = NULL, email = CONCAT(''dev-branch-'', id, ''@dev.local''), address = ''Dev Address'', address_detail = NULL, updated_at = CURRENT_TIMESTAMP WHERE id IS NOT NULL',
    'SELECT 1'
);
PREPARE stmt_branches FROM @sql_branches;
EXECUTE stmt_branches;
DEALLOCATE PREPARE stmt_branches;

-- -----------------------------------------------------------------------------
-- dormant_user_pii_vault (휴면 vault — 복원 가능한 실 PII 제거)
-- -----------------------------------------------------------------------------
SET @has_dormant := (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dormant_user_pii_vault'
);
SET @sql_dormant := IF(
    @has_dormant > 0,
    'UPDATE dormant_user_pii_vault SET encrypted_pii = JSON_OBJECT(''devSyncAnonymized'', TRUE, ''label'', ''DEV_SYNC_ANON'') WHERE id IS NOT NULL',
    'SELECT 1'
);
PREPARE stmt_dormant FROM @sql_dormant;
EXECUTE stmt_dormant;
DEALLOCATE PREPARE stmt_dormant;

-- -----------------------------------------------------------------------------
-- payments 가상계좌 등 (컬럼 존재 시)
-- -----------------------------------------------------------------------------
SET @has_payments_va := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payments'
      AND COLUMN_NAME = 'virtual_account_number'
);
SET @sql_payments := IF(
    @has_payments_va > 0,
    'UPDATE payments SET virtual_account_number = CONCAT(''VA-DEV-'', id) WHERE virtual_account_number IS NOT NULL',
    'SELECT 1'
);
PREPARE stmt_payments FROM @sql_payments;
EXECUTE stmt_payments;
DEALLOCATE PREPARE stmt_payments;

-- -----------------------------------------------------------------------------
-- recurring_expenses.account_number (컬럼 존재 시)
-- -----------------------------------------------------------------------------
SET @has_re_acct := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'recurring_expenses'
      AND COLUMN_NAME = 'account_number'
);
SET @sql_re := IF(
    @has_re_acct > 0,
    'UPDATE recurring_expenses SET account_number = CONCAT(''****'', LPAD(MOD(id, 10000), 4, ''0'')) WHERE account_number IS NOT NULL',
    'SELECT 1'
);
PREPARE stmt_re FROM @sql_re;
EXECUTE stmt_re;
DEALLOCATE PREPARE stmt_re;

SELECT 'post-dev-sync-anonymize.sql completed' AS status, DATABASE() AS db_name, NOW() AS finished_at;
