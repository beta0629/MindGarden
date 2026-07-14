-- =============================================================================
-- dry-run: prod→dev 익명화 전/후 샘플 점검 (SELECT only — WRITE 없음)
-- =============================================================================
-- 사용: 개발 DB에서만.
--   mysql ... < scripts/database/sync/post-dev-sync-anonymize-dry-run.sql
-- 익명화 후 기대:
--   - KEEP: user_id / password
--   - name: DevUser- / DevConsultant- / DevClient-
--   - phone: 010****NNNN / email: ??NNNN***@***.com
-- =============================================================================

SELECT 'users sample (name + phone/email mask)' AS section;
SELECT
    id,
    tenant_id,
    role,
    user_id,
    LEFT(email, 48) AS email_preview,
    LEFT(IFNULL(phone, ''), 32) AS phone_preview,
    LEFT(name, 48) AS name_preview,
    CASE
        WHEN role = 'CONSULTANT' AND name LIKE 'DevConsultant-%' THEN 'NAME_CONSULTANT_OK'
        WHEN role <> 'CONSULTANT' AND name LIKE 'DevUser-%' THEN 'NAME_USER_OK'
        WHEN name LIKE 'DevConsultant-%' THEN 'NAME_CONSULTANT_OK'
        WHEN name LIKE '%::%' THEN 'NAME_CIPHER'
        ELSE 'NAME_OTHER'
    END AS name_state,
    CASE
        WHEN email REGEXP '^[a-z]{2}[0-9]{4}\\*\\*\\*@\\*\\*\\*\\.com$' THEN 'EMAIL_MASK_OK'
        WHEN email LIKE '%::%' OR email LIKE 'legacy::%' THEN 'EMAIL_CIPHER'
        ELSE 'EMAIL_OTHER'
    END AS email_state,
    CASE
        WHEN phone IS NULL OR phone = '' THEN 'PHONE_EMPTY'
        WHEN phone LIKE '010****%' THEN 'PHONE_MASK_OK'
        WHEN phone LIKE '%::%' OR phone LIKE 'legacy::%' THEN 'PHONE_CIPHER'
        ELSE 'PHONE_OTHER'
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
WHERE u.role = 'CONSULTANT'
   OR EXISTS (SELECT 1 FROM consultants c WHERE c.id = u.id)
ORDER BY u.id
LIMIT 20;

SELECT 'clients sample (email/phone mask, name REPLACE)' AS section;
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
        WHEN email REGEXP '^[a-z]{2}[0-9]{4}\\*\\*\\*@\\*\\*\\*\\.com$' THEN 'EMAIL_MASK_OK'
        WHEN email LIKE '%::%' OR email LIKE 'legacy::%' THEN 'EMAIL_CIPHER'
        ELSE 'EMAIL_OTHER'
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

SELECT COUNT(*) AS users_plain_email_suspect
FROM users
WHERE email IS NOT NULL
  AND email NOT LIKE '%***@***.com'
  AND email NOT LIKE '%::%'
  AND email NOT LIKE 'legacy::%'
  AND email LIKE '%@%';

SELECT COUNT(*) AS users_plain_phone_suspect
FROM users
WHERE phone IS NOT NULL
  AND phone <> ''
  AND phone NOT LIKE '010****%'
  AND phone NOT LIKE '%::%'
  AND phone NOT LIKE 'legacy::%';
