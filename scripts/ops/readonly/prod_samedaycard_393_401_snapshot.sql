-- Diagnostic snapshot for known incident mappings 393 and 401 (read-only).
-- SELECT only. No SET. No PII columns (name/phone/email). No other id lists.
-- Purpose: compare current status/remaining/payment_status/updated_at with
--          20:38 KST RCA (#1866 run 43013574869) and check #1868 sibling predicates.

SELECT '== 1. column types' AS section;
SELECT COLUMN_NAME,
       COLUMN_TYPE,
       IS_NULLABLE,
       COLUMN_DEFAULT
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'consultant_client_mappings'
   AND COLUMN_NAME IN (
         'id','tenant_id','client_id','consultant_id','status',
         'payment_status','payment_timing','total_sessions','used_sessions',
         'remaining_sessions','is_deleted','created_at','updated_at'
       )
 ORDER BY ORDINAL_POSITION;

SELECT '== 2. mapping 393 and 401 current fields' AS section;
SELECT m.id,
       m.tenant_id,
       m.client_id,
       m.consultant_id,
       m.status,
       m.payment_status,
       m.payment_timing,
       m.total_sessions,
       m.used_sessions,
       m.remaining_sessions,
       m.is_deleted,
       CAST(m.is_deleted AS UNSIGNED) AS is_deleted_u,
       (m.is_deleted IS NULL) AS is_deleted_is_null,
       (m.is_deleted = 0) AS is_deleted_eq_0,
       m.created_at,
       m.updated_at
  FROM consultant_client_mappings m
 WHERE m.id IN (393, 401)
 ORDER BY m.id;

SELECT '== 3. sibling predicate flags (393 vs 401)' AS section;
SELECT (a.tenant_id <=> b.tenant_id) AS same_tenant,
       (a.client_id = b.client_id) AS same_client,
       (a.consultant_id = b.consultant_id) AS same_consultant,
       (a.id <> b.id) AS different_id,
       (a.status = 'ACTIVE') AS a_status_active,
       (b.status = 'ACTIVE') AS b_status_active,
       (b.remaining_sessions > 0) AS b_remaining_gt_0,
       (a.is_deleted = 0) AS a_is_deleted_eq_0,
       (b.is_deleted = 0) AS b_is_deleted_eq_0,
       (a.is_deleted IS NULL) AS a_is_deleted_null,
       (b.is_deleted IS NULL) AS b_is_deleted_null,
       (UPPER(TRIM(a.payment_timing)) = 'SAME_DAY_CARD') AS a_samedaycard,
       (
         a.remaining_sessions IS NULL
         OR a.remaining_sessions <= 0
         OR (
              a.used_sessions IS NOT NULL
              AND a.total_sessions IS NOT NULL
              AND a.used_sessions >= a.total_sessions
            )
       ) AS a_exhausted_predicate,
       (
         (a.tenant_id <=> b.tenant_id)
         AND (a.client_id = b.client_id)
         AND (a.consultant_id = b.consultant_id)
         AND (a.id <> b.id)
         AND (b.status = 'ACTIVE')
         AND (b.is_deleted = 0)
         AND (b.remaining_sessions > 0)
       ) AS sibling_predicate_pass,
       a.updated_at AS mapping_393_updated_at,
       b.updated_at AS mapping_401_updated_at
  FROM consultant_client_mappings a
  JOIN consultant_client_mappings b
    ON a.id = 393 AND b.id = 401;

SELECT '== 4. original #1868 counts (same snapshot)' AS section;
SELECT COUNT(*) AS exhausted_active_cnt,
       SUM(CASE
             WHEN EXISTS (
               SELECT 1
                 FROM consultant_client_mappings sibling
                WHERE sibling.tenant_id <=> exhausted.tenant_id
                  AND sibling.client_id = exhausted.client_id
                  AND sibling.consultant_id = exhausted.consultant_id
                  AND sibling.id <> exhausted.id
                  AND sibling.status = 'ACTIVE'
                  AND sibling.is_deleted = 0
                  AND sibling.remaining_sessions > 0
             ) THEN 1 ELSE 0
           END) AS blocked_eq0,
       SUM(CASE
             WHEN EXISTS (
               SELECT 1
                 FROM consultant_client_mappings sibling
                WHERE sibling.tenant_id <=> exhausted.tenant_id
                  AND sibling.client_id = exhausted.client_id
                  AND sibling.consultant_id = exhausted.consultant_id
                  AND sibling.id <> exhausted.id
                  AND sibling.status = 'ACTIVE'
                  AND (sibling.is_deleted = 0 OR sibling.is_deleted IS NULL)
                  AND sibling.remaining_sessions > 0
             ) THEN 1 ELSE 0
           END) AS blocked_eq0_or_null,
       SUM(CASE
             WHEN EXISTS (
               SELECT 1
                 FROM consultant_client_mappings sibling
                WHERE sibling.tenant_id <=> exhausted.tenant_id
                  AND sibling.client_id = exhausted.client_id
                  AND sibling.consultant_id = exhausted.consultant_id
                  AND sibling.id <> exhausted.id
                  AND sibling.status = 'ACTIVE'
                  AND sibling.remaining_sessions > 0
             ) THEN 1 ELSE 0
           END) AS blocked_ignore_is_deleted
  FROM consultant_client_mappings exhausted
 WHERE UPPER(TRIM(exhausted.payment_timing)) = 'SAME_DAY_CARD'
   AND exhausted.status = 'ACTIVE'
   AND exhausted.is_deleted = 0
   AND (
         exhausted.remaining_sessions IS NULL
         OR exhausted.remaining_sessions <= 0
         OR (
              exhausted.used_sessions IS NOT NULL
              AND exhausted.total_sessions IS NOT NULL
              AND exhausted.used_sessions >= exhausted.total_sessions
            )
       );
