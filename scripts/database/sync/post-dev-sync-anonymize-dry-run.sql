-- =============================================================================
-- dry-run: prod→dev 익명화 전/후 샘플 점검 (SELECT only — WRITE 없음)
-- =============================================================================
-- 사용: 개발 DB에서만.
--   mysql ... < scripts/database/sync/post-dev-sync-anonymize-dry-run.sql
-- 익명화 후 기대:
--   - KEEP: user_id / password / email / phone (로그인 가능)
--   - name: DevUser- / DevConsultant- / DevClient-
--   - phone/email DB 마스킹 금지 (#584 폐기). 화면 마스킹은 FE.
-- =============================================================================

SELECT 'users sample (name REPLACE, email/phone KEEP)' AS section;
SELECT
    id,
    tenant_id,
    role,
    user_id,
    LEFT(email, 48) AS email_preview,
    LEFT(IFNULL(phone, ''), 32) AS phone_preview,
    LEFT(name, 48) AS name_preview,
    CASE
        WHEN (UPPER(TRIM(role)) IN ('CONSULTANT', 'ROLE_CONSULTANT')
              OR UPPER(TRIM(role)) LIKE '%CONSULTANT%')
             AND name LIKE 'DevConsultant-%' THEN 'NAME_CONSULTANT_OK'
        WHEN UPPER(TRIM(role)) NOT IN ('CONSULTANT', 'ROLE_CONSULTANT')
             AND UPPER(TRIM(role)) NOT LIKE '%CONSULTANT%'
             AND name LIKE 'DevUser-%' THEN 'NAME_USER_OK'
        WHEN name LIKE 'DevConsultant-%' THEN 'NAME_CONSULTANT_OK'
        WHEN name LIKE '%::%' THEN 'NAME_CIPHER'
        ELSE 'NAME_OTHER'
    END AS name_state,
    CASE
        WHEN email IS NULL OR email = '' THEN 'EMAIL_EMPTY'
        WHEN email LIKE '%***@***.com' THEN 'EMAIL_LEGACY_DB_MASK'
        WHEN email LIKE '%::%' OR email LIKE 'legacy::%' THEN 'EMAIL_CIPHER'
        ELSE 'EMAIL_KEEP_OK'
    END AS email_state,
    CASE
        WHEN phone IS NULL OR phone = '' THEN 'PHONE_EMPTY'
        WHEN phone LIKE '010****%' THEN 'PHONE_LEGACY_DB_MASK'
        WHEN phone LIKE '%::%' OR phone LIKE 'legacy::%' THEN 'PHONE_CIPHER'
        ELSE 'PHONE_KEEP_OK'
    END AS phone_state
FROM users
ORDER BY id
LIMIT 20;

SELECT 'consultants name check' AS section;
SELECT
    u.id,
    u.role,
    LEFT(u.name, 40) AS name_preview,
    CASE WHEN u.name LIKE 'DevConsultant-%' THEN 'OK' ELSE 'BAD' END AS consultant_name_state
FROM users u
WHERE UPPER(TRIM(u.role)) IN ('CONSULTANT', 'ROLE_CONSULTANT')
   OR UPPER(TRIM(u.role)) LIKE '%CONSULTANT%'
   OR EXISTS (SELECT 1 FROM consultants c WHERE c.id = u.id)
ORDER BY u.id
LIMIT 20;

SELECT 'consultants hangul residual (expect 0)' AS section;
SELECT COUNT(*) AS consultant_hangul_name_suspect
FROM users u
WHERE (UPPER(TRIM(u.role)) IN ('CONSULTANT', 'ROLE_CONSULTANT')
       OR UPPER(TRIM(u.role)) LIKE '%CONSULTANT%'
       OR EXISTS (SELECT 1 FROM consultants c WHERE c.id = u.id))
  AND u.name IS NOT NULL
  AND CHAR_LENGTH(u.name) < 32
  AND u.name REGEXP '[가-힣]';

SELECT 'clients sample (name REPLACE, email/phone KEEP)' AS section;
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
    END AS name_state,
    CASE
        WHEN email IS NULL OR email = '' THEN 'EMAIL_EMPTY'
        WHEN email LIKE '%***@***.com' THEN 'EMAIL_LEGACY_DB_MASK'
        WHEN email LIKE '%::%' OR email LIKE 'legacy::%' THEN 'EMAIL_CIPHER'
        ELSE 'EMAIL_KEEP_OK'
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

SELECT 'legacy #584 DB phone/email mask residual (informational)' AS section;
SELECT COUNT(*) AS users_legacy_email_mask
FROM users
WHERE email LIKE '%***@***.com';

SELECT COUNT(*) AS users_legacy_phone_mask
FROM users
WHERE phone LIKE '010****%';
