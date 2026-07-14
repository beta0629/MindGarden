-- =============================================================================
-- 개발 DB 전용: prod→dev 복원 직후 PII 치환 (POST_SYNC_SQL_FILE)
-- =============================================================================
-- 대상: DEV DB ONLY. 운영(prod)에서 실행 금지.
-- 표준: docs/standards/PII_PROTECTION_STANDARD.md §2
-- 런북: docs/project-management/PROD_TO_DEV_DB_SYNC_RUNBOOK.md
--
-- 전략 (P1)
--   KEEP:
--     user_id / password / social_* / *hash* lookup /
--     tenant_id / id / role / lifecycle_state / FK·업무 데이터
--   REPLACE (표시용 + 화면 노출 방지):
--     name / nickname / address* / rrn / memo·notes /
--     phone·email → 부분 마스킹 평문 (010****1234 / ab####***@***.com)
--     계좌·지점 연락처 등
--   역할별 name 접두:
--     CONSULTANT (또는 consultants JOIN) → DevConsultant-{id}
--     그 외 users → DevUser-{id}
--     clients → DevClient-{id}
--   AES @Convert 컬럼은 데모 평문으로 치환.
--     safeDecrypt() 는 비암호문을 그대로 반환 → 화면 표시 OK.
--     이후 JPA 저장 시 AttributeConverter 가 활성 키로 재암호화.
--   로그인 메모:
--     폼은 email/phone 경로(CustomUserDetailsService). 원본 email/phone 로
--     로그인은 불가 → 마스킹된 값 + password 로 로그인.
--     user_id·password 컬럼은 유지.
--   UserAnonymizationService 미사용 (계정 종료·tombstone 경로와 다름).
--
-- 선택 실행 (수동):
--   mysql ... < scripts/database/sync/post-dev-sync-anonymize.sql
-- dry-run 샘플: post-dev-sync-anonymize-dry-run.sql
-- =============================================================================

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- users — name + phone/email 부분 마스킹 (user_id/password 유지)
-- -----------------------------------------------------------------------------
UPDATE users
SET
    name = CONCAT('DevUser-', LPAD(id, 6, '0')),
    nickname = IF(nickname IS NULL OR nickname = '', NULL, CONCAT('nick-', id)),
    -- 부분 마스킹(유니크): 010****{id 4자리} / {2글자}{id4}***@***.com
    phone = IF(
        phone IS NULL OR phone = '',
        NULL,
        CONCAT('010****', LPAD(MOD(id, 10000), 4, '0'))
    ),
    email = CONCAT(
        CHAR(97 + MOD(id, 26)),
        CHAR(97 + MOD(FLOOR(id / 26), 26)),
        LPAD(MOD(id, 10000), 4, '0'),
        '***@***.com'
    ),
    gender = NULL,
    birth_date = NULL,
    rrn_encrypted = NULL,
    address = NULL,
    address_detail = NULL,
    postal_code = NULL,
    profile_image_url = NULL,
    memo = NULL,
    notes = NULL,
    email_verification_token = NULL,
    email_verification_expires_at = NULL,
    password_reset_token = NULL,
    password_reset_expires_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 상담사 name — DevConsultant- (role 또는 consultants 테이블)
-- -----------------------------------------------------------------------------
UPDATE users
SET
    name = CONCAT('DevConsultant-', LPAD(id, 6, '0')),
    updated_at = CURRENT_TIMESTAMP
WHERE role = 'CONSULTANT';

SET @has_consultants := (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultants'
);
SET @sql_consultant_names := IF(
    @has_consultants > 0,
    'UPDATE users u INNER JOIN consultants c ON c.id = u.id SET u.name = CONCAT(''DevConsultant-'', LPAD(u.id, 6, ''0'')), u.updated_at = CURRENT_TIMESTAMP',
    'SELECT 1'
);
PREPARE stmt_consultant_names FROM @sql_consultant_names;
EXECUTE stmt_consultant_names;
DEALLOCATE PREPARE stmt_consultant_names;

-- -----------------------------------------------------------------------------
-- clients — name + phone/email 부분 마스킹
-- -----------------------------------------------------------------------------
UPDATE clients
SET
    name = CONCAT('DevClient-', LPAD(id, 6, '0')),
    phone = IF(
        phone IS NULL OR phone = '',
        NULL,
        CONCAT('010****', LPAD(MOD(id, 10000), 4, '0'))
    ),
    email = CONCAT(
        CHAR(97 + MOD(id, 26)),
        CHAR(97 + MOD(FLOOR(id / 26), 26)),
        LPAD(MOD(id, 10000), 4, '0'),
        '***@***.com'
    ),
    gender = NULL,
    birth_date = NULL,
    address = NULL,
    address_detail = NULL,
    postal_code = NULL,
    vehicle_plate = NULL,
    emergency_contact = NULL,
    emergency_phone = IF(
        emergency_phone IS NULL OR emergency_phone = '',
        NULL,
        CONCAT('010****', LPAD(MOD(id, 10000), 4, '0'))
    ),
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
-- branches — VIEW(깨진 DEFINER) 이면 베이스 테이블로 폴백
-- -----------------------------------------------------------------------------
SET @has_branches_base := (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches_dropped_20260612'
);
SET @branches_is_view := (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'branches'
      AND TABLE_TYPE = 'VIEW'
);
SET @has_branches_table := (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'branches'
      AND TABLE_TYPE = 'BASE TABLE'
);
SET @branches_target := IF(
    @has_branches_table > 0,
    'branches',
    IF(@branches_is_view > 0 AND @has_branches_base > 0, 'branches_dropped_20260612', NULL)
);
SET @sql_branches := IF(
    @branches_target IS NOT NULL,
    CONCAT(
        'UPDATE `', @branches_target, '` SET phone_number = ''02-0000-0000'', fax_number = NULL, ',
        'email = CONCAT(''dev-branch-'', id, ''@dev.local''), address = ''Dev Address'', ',
        'address_detail = NULL, updated_at = CURRENT_TIMESTAMP WHERE id IS NOT NULL'
    ),
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
