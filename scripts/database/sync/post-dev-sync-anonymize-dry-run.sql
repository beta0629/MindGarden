-- =============================================================================
-- dry-run: prod→dev 익명화 전/후 샘플 점검 (SELECT only — WRITE 없음)
-- =============================================================================
-- 사용: 개발 DB에서만.
--   mysql ... mind_garden_dev < scripts/database/sync/post-dev-sync-anonymize-dry-run.sql
-- 익명화 후 기대:
--   - login KEEP: user_id / email / phone 은 원본(암호문) 형태 유지
--   - display REPLACE: name 이 DevUser- / DevClient- 접두
-- =============================================================================

SELECT 'users sample (login KEEP vs name REPLACE)' AS section;
SELECT
    id,
    tenant_id,
    role,
    user_id,
    LEFT(email, 48) AS email_preview,
    LEFT(IFNULL(phone, ''), 32) AS phone_preview,
    LEFT(name, 48) AS name_preview,
    CASE
        WHEN name LIKE 'DevUser-%' THEN 'NAME_ANON_OK'
        WHEN name LIKE '%::%' THEN 'NAME_CIPHER'
        ELSE 'NAME_OTHER'
    END AS name_state,
    CASE
        WHEN email LIKE 'dev-u-%@dev.local' THEN 'EMAIL_SHOULD_NOT_BE_REPLACED'
        WHEN email LIKE '%::%' OR CHAR_LENGTH(email) >= 32 THEN 'EMAIL_KEPT_LIKELY'
        ELSE 'EMAIL_OTHER'
    END AS email_state
FROM users
ORDER BY id
LIMIT 20;

SELECT 'clients sample (email/phone KEEP, name REPLACE)' AS section;
SELECT
    id,
    tenant_id,
    LEFT(email, 48) AS email_preview,
    LEFT(IFNULL(phone, ''), 32) AS phone_preview,
    LEFT(name, 48) AS name_preview,
    CASE
        WHEN name LIKE 'DevClient-%' THEN 'NAME_ANON_OK'
        WHEN name LIKE '%::%' THEN 'NAME_CIPHER'
        ELSE 'NAME_OTHER'
    END AS name_state
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

SELECT 'display-name residual (expect 0 short Hangul names after anonymize)' AS section;
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
