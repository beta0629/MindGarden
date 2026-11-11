-- Legacy homepage consultation_inquiries — production survey (read-only).
-- SELECT / SHOW / information_schema only. No writes. No SET (session READ ONLY via mysql --init-command).
-- PII never printed: name, phone, email, message, tags, referral_source (counts/structure only).
-- Candidate schemas: mindgarden_homepage, core_solution. Missing table statements error; workflow uses --force.
-- Column presence is not assumed for every GROUP BY; missing columns fail that block only.

SELECT '== 1A. schema discovery (consultation_inquiries)' AS section;
SELECT TABLE_SCHEMA,
       TABLE_NAME,
       TABLE_TYPE,
       ENGINE,
       TABLE_ROWS,
       CREATE_TIME,
       UPDATE_TIME,
       TABLE_COLLATION
  FROM information_schema.TABLES
 WHERE TABLE_NAME = 'consultation_inquiries'
 ORDER BY TABLE_SCHEMA;

SELECT '== 1B. columns (all visible schemas)' AS section;
SELECT TABLE_SCHEMA,
       COLUMN_NAME,
       COLUMN_TYPE,
       IS_NULLABLE,
       COLUMN_DEFAULT,
       COLUMN_KEY,
       ORDINAL_POSITION
  FROM information_schema.COLUMNS
 WHERE TABLE_NAME = 'consultation_inquiries'
 ORDER BY TABLE_SCHEMA, ORDINAL_POSITION;

SELECT '== 1C. discovery status' AS section;
SELECT CASE
         WHEN EXISTS (
           SELECT 1
             FROM information_schema.TABLES
            WHERE TABLE_NAME = 'consultation_inquiries'
         ) THEN 'FOUND'
         ELSE 'NONE FOUND: consultation_inquiries not visible in any schema for this connection'
       END AS discovery_status,
       (SELECT COUNT(DISTINCT TABLE_SCHEMA)
          FROM information_schema.TABLES
         WHERE TABLE_NAME = 'consultation_inquiries') AS visible_schema_count;

SELECT '== 1D. table DDL mindgarden_homepage.consultation_inquiries' AS section;
SHOW CREATE TABLE `mindgarden_homepage`.`consultation_inquiries`;

SELECT '== 1E. table DDL core_solution.consultation_inquiries' AS section;
SHOW CREATE TABLE `core_solution`.`consultation_inquiries`;

-- Totals / time range — candidate blocks (missing table → error for that block only with --force)
SELECT '== 2A. totals mindgarden_homepage.consultation_inquiries' AS section;
SELECT COUNT(*) AS total_rows,
       MIN(created_at) AS min_created_at,
       MAX(created_at) AS max_created_at,
       MIN(updated_at) AS min_updated_at,
       MAX(updated_at) AS max_updated_at
  FROM `mindgarden_homepage`.`consultation_inquiries`;

SELECT '== 2B. totals core_solution.consultation_inquiries' AS section;
SELECT COUNT(*) AS total_rows,
       MIN(created_at) AS min_created_at,
       MAX(created_at) AS max_created_at,
       MIN(updated_at) AS min_updated_at,
       MAX(updated_at) AS max_updated_at
  FROM `core_solution`.`consultation_inquiries`;

-- GROUP BY counts — counts only; null bucket labeled '(null)'
SELECT '== 3A1. by inquiry_type mindgarden_homepage' AS section;
SELECT IFNULL(inquiry_type, '(null)') AS inquiry_type,
       COUNT(*) AS row_count
  FROM `mindgarden_homepage`.`consultation_inquiries`
 GROUP BY inquiry_type
 ORDER BY row_count DESC, inquiry_type;

SELECT '== 3A2. by status mindgarden_homepage' AS section;
SELECT IFNULL(status, '(null)') AS status,
       COUNT(*) AS row_count
  FROM `mindgarden_homepage`.`consultation_inquiries`
 GROUP BY status
 ORDER BY row_count DESC, status;

SELECT '== 3A3. by preferred_contact_method mindgarden_homepage' AS section;
SELECT IFNULL(preferred_contact_method, '(null)') AS preferred_contact_method,
       COUNT(*) AS row_count
  FROM `mindgarden_homepage`.`consultation_inquiries`
 GROUP BY preferred_contact_method
 ORDER BY row_count DESC, preferred_contact_method;

SELECT '== 3A4. by status x inquiry_type mindgarden_homepage' AS section;
SELECT IFNULL(status, '(null)') AS status,
       IFNULL(inquiry_type, '(null)') AS inquiry_type,
       COUNT(*) AS row_count
  FROM `mindgarden_homepage`.`consultation_inquiries`
 GROUP BY status, inquiry_type
 ORDER BY row_count DESC, status, inquiry_type;

SELECT '== 3B1. by inquiry_type core_solution' AS section;
SELECT IFNULL(inquiry_type, '(null)') AS inquiry_type,
       COUNT(*) AS row_count
  FROM `core_solution`.`consultation_inquiries`
 GROUP BY inquiry_type
 ORDER BY row_count DESC, inquiry_type;

SELECT '== 3B2. by status core_solution' AS section;
SELECT IFNULL(status, '(null)') AS status,
       COUNT(*) AS row_count
  FROM `core_solution`.`consultation_inquiries`
 GROUP BY status
 ORDER BY row_count DESC, status;

SELECT '== 3B3. by preferred_contact_method core_solution' AS section;
SELECT IFNULL(preferred_contact_method, '(null)') AS preferred_contact_method,
       COUNT(*) AS row_count
  FROM `core_solution`.`consultation_inquiries`
 GROUP BY preferred_contact_method
 ORDER BY row_count DESC, preferred_contact_method;

SELECT '== 3B4. by status x inquiry_type core_solution' AS section;
SELECT IFNULL(status, '(null)') AS status,
       IFNULL(inquiry_type, '(null)') AS inquiry_type,
       COUNT(*) AS row_count
  FROM `core_solution`.`consultation_inquiries`
 GROUP BY status, inquiry_type
 ORDER BY row_count DESC, status, inquiry_type;

-- NULL/empty + duplicate phone-hash summary (hashes never appear in result set)
SELECT '== 4A. null_empty_dup_phone mindgarden_homepage' AS section;
SELECT SUM(CASE WHEN phone IS NULL OR TRIM(phone) = '' THEN 1 ELSE 0 END) AS null_or_empty_phone,
       SUM(CASE WHEN name IS NULL OR TRIM(name) = '' THEN 1 ELSE 0 END) AS null_or_empty_name,
       SUM(CASE WHEN message IS NULL OR TRIM(message) = '' THEN 1 ELSE 0 END) AS null_or_empty_message,
       SUM(CASE WHEN phone IS NOT NULL AND TRIM(phone) <> '' THEN 1 ELSE 0 END) AS rows_with_nonempty_phone,
       (SELECT COUNT(*)
          FROM (
            SELECT 1
              FROM `mindgarden_homepage`.`consultation_inquiries`
             WHERE phone IS NOT NULL AND TRIM(phone) <> ''
             GROUP BY SHA2(TRIM(phone), 256)
          ) d) AS distinct_phone_hash_count,
       (SELECT COUNT(*)
          FROM (
            SELECT 1
              FROM `mindgarden_homepage`.`consultation_inquiries`
             WHERE phone IS NOT NULL AND TRIM(phone) <> ''
             GROUP BY SHA2(TRIM(phone), 256)
            HAVING COUNT(*) > 1
          ) d) AS duplicate_phone_hash_group_count,
       (SELECT IFNULL(SUM(cnt), 0)
          FROM (
            SELECT COUNT(*) AS cnt
              FROM `mindgarden_homepage`.`consultation_inquiries`
             WHERE phone IS NOT NULL AND TRIM(phone) <> ''
             GROUP BY SHA2(TRIM(phone), 256)
            HAVING COUNT(*) > 1
          ) d) AS duplicate_phone_hash_row_count
  FROM `mindgarden_homepage`.`consultation_inquiries`;

SELECT '== 4B. null_empty_dup_phone core_solution' AS section;
SELECT SUM(CASE WHEN phone IS NULL OR TRIM(phone) = '' THEN 1 ELSE 0 END) AS null_or_empty_phone,
       SUM(CASE WHEN name IS NULL OR TRIM(name) = '' THEN 1 ELSE 0 END) AS null_or_empty_name,
       SUM(CASE WHEN message IS NULL OR TRIM(message) = '' THEN 1 ELSE 0 END) AS null_or_empty_message,
       SUM(CASE WHEN phone IS NOT NULL AND TRIM(phone) <> '' THEN 1 ELSE 0 END) AS rows_with_nonempty_phone,
       (SELECT COUNT(*)
          FROM (
            SELECT 1
              FROM `core_solution`.`consultation_inquiries`
             WHERE phone IS NOT NULL AND TRIM(phone) <> ''
             GROUP BY SHA2(TRIM(phone), 256)
          ) d) AS distinct_phone_hash_count,
       (SELECT COUNT(*)
          FROM (
            SELECT 1
              FROM `core_solution`.`consultation_inquiries`
             WHERE phone IS NOT NULL AND TRIM(phone) <> ''
             GROUP BY SHA2(TRIM(phone), 256)
            HAVING COUNT(*) > 1
          ) d) AS duplicate_phone_hash_group_count,
       (SELECT IFNULL(SUM(cnt), 0)
          FROM (
            SELECT COUNT(*) AS cnt
              FROM `core_solution`.`consultation_inquiries`
             WHERE phone IS NOT NULL AND TRIM(phone) <> ''
             GROUP BY SHA2(TRIM(phone), 256)
            HAVING COUNT(*) > 1
          ) d) AS duplicate_phone_hash_row_count
  FROM `core_solution`.`consultation_inquiries`;
