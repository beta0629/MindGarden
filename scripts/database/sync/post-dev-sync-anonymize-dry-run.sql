-- =============================================================================
-- dry-run: prod→dev 익명화 전/후 샘플 점검 (SELECT only — WRITE 없음)
-- =============================================================================
-- 사용: 개발 DB에서만.
--   mysql ... mind_garden_dev < scripts/database/sync/post-dev-sync-anonymize-dry-run.sql
-- 익명화 전: 암호문/실명 길이 패턴 확인. 익명화 후: dev-u- / DevUser- 접두 확인.
-- =============================================================================

SELECT 'users sample' AS section;
SELECT
    id,
    tenant_id,
    user_id,
    LEFT(email, 48) AS email_preview,
    LEFT(name, 48) AS name_preview,
    LEFT(IFNULL(phone, ''), 32) AS phone_preview,
    CHAR_LENGTH(email) AS email_len,
    CHAR_LENGTH(name) AS name_len,
    CASE
        WHEN email LIKE 'dev-u-%@dev.local' THEN 'ANON_OK'
        WHEN email LIKE '%::%' THEN 'CIPHER_OR_VERSIONED'
        ELSE 'OTHER'
    END AS email_state
FROM users
ORDER BY id
LIMIT 20;

SELECT 'clients sample' AS section;
SELECT
    id,
    tenant_id,
    LEFT(email, 48) AS email_preview,
    LEFT(name, 48) AS name_preview,
    LEFT(IFNULL(phone, ''), 32) AS phone_preview,
    CASE
        WHEN email LIKE 'dev-c-%@dev.local' THEN 'ANON_OK'
        WHEN email LIKE '%::%' THEN 'CIPHER_OR_VERSIONED'
        ELSE 'OTHER'
    END AS email_state
FROM clients
ORDER BY id
LIMIT 20;

SELECT 'accounts sample' AS section;
SELECT
    id,
    tenant_id,
    LEFT(account_number, 24) AS account_number_preview,
    LEFT(account_holder, 32) AS account_holder_preview
FROM accounts
ORDER BY id
LIMIT 10;

SELECT 'branches sample' AS section;
SELECT
    id,
    tenant_id,
    LEFT(IFNULL(email, ''), 48) AS email_preview,
    LEFT(IFNULL(phone_number, ''), 24) AS phone_preview,
    LEFT(IFNULL(address, ''), 40) AS address_preview
FROM branches
ORDER BY id
LIMIT 10;

SELECT 'pii residual probe (expect 0 after anonymize for Hangul in short name)' AS section;
SELECT COUNT(*) AS users_short_hangul_name_suspect
FROM users
WHERE name IS NOT NULL
  AND CHAR_LENGTH(name) < 32
  AND name REGEXP '[가-힣]';

SELECT COUNT(*) AS clients_short_hangul_name_suspect
FROM clients
WHERE name IS NOT NULL
  AND CHAR_LENGTH(name) < 32
  AND name REGEXP '[가-힣]';
