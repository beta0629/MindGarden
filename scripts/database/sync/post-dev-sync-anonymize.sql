-- =============================================================================
-- 개발 DB 전용: prod→dev 복원 직후 PII 치환 (POST_SYNC_SQL_FILE)
-- =============================================================================
-- 대상: DEV DB ONLY. 운영(prod)에서 실행 금지.
-- 표준: docs/standards/PII_PROTECTION_STANDARD.md §2
-- 런북: docs/project-management/PROD_TO_DEV_DB_SYNC_RUNBOOK.md
--
-- 전략 (P0) — 로그인 식별자·비밀번호 미치환
--   KEEP (전원·역할 무관):
--     user_id / password / email / phone / social_* / *hash* lookup /
--     tenant_id / id / role / lifecycle_state / FK·업무 데이터
--   REPLACE (표시·영상용 PII 만):
--     name / nickname / address* / rrn / memo·notes / 계좌·지점 연락처 등
--   AES @Convert 컬럼(name 등)은 데모 평문으로 치환.
--     safeDecrypt() 는 비암호문을 그대로 반환 → 화면 표시 OK.
--     이후 JPA 저장 시 AttributeConverter 가 활성 키로 재암호화.
--   UserAnonymizationService 미사용 (계정 종료·tombstone 경로와 다름).
--   consultants PII 는 users(JOINED) 의 name 등 UPDATE 로 충분.
--
-- 선택 실행 (수동):
--   mysql ... mind_garden_dev < scripts/database/sync/post-dev-sync-anonymize.sql
-- dry-run 샘플: post-dev-sync-anonymize-dry-run.sql
-- =============================================================================

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- users — 표시용 PII 만 (email/phone/user_id/password/social 로그인 필드 유지)
-- -----------------------------------------------------------------------------
UPDATE users
SET
    name = CONCAT('DevUser-', LPAD(id, 6, '0')),
    nickname = IF(nickname IS NULL OR nickname = '', NULL, CONCAT('nick-', id)),
    gender = NULL,
    birth_date = NULL,
    rrn_encrypted = NULL,
    address = NULL,
    address_detail = NULL,
    postal_code = NULL,
    profile_image_url = NULL,
    memo = NULL,
    notes = NULL,
    -- 로그인 자체는 유지; 일회성 토큰만 폐기 (비번·식별자와 무관)
    email_verification_token = NULL,
    email_verification_expires_at = NULL,
    password_reset_token = NULL,
    password_reset_expires_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- clients — name/주소/의료 등만 (email·phone 유지: 로그인·OTP·동기화)
-- -----------------------------------------------------------------------------
UPDATE clients
SET
    name = CONCAT('DevClient-', LPAD(id, 6, '0')),
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
-- branches (연락·주소 — 테넌트 식별자/지점명 유지)
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
