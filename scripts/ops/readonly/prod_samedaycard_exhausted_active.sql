-- SAME_DAY_CARD mappings: remaining 0 (or used >= total) but status=ACTIVE — counts only.
-- SELECT only. No SET. No PII columns (name/phone/email). No mapping/user id lists.
-- Entity SSOT: ConsultantClientMapping / table consultant_client_mappings
--   payment_timing VARCHAR(32) = 'SAME_DAY_CARD' (Java equalsIgnoreCase)
--   status, remaining_sessions, used_sessions, total_sessions
--   tenant_id, client_id, consultant_id, created_at, is_deleted (AuditableTenantBase)
-- Exhausted: remaining_sessions IS NULL OR remaining_sessions <= 0
--            OR (used_sessions >= total_sessions when both are not null)
-- Live rows only: is_deleted = 0 (schedule validation iterates live ACTIVE rows)
-- "blocked": same tenant_id + client_id + consultant_id has another live ACTIVE
--            mapping with remaining_sessions > 0
--            (validateRemainingSessions returns on the first pair match;
--             an exhausted ACTIVE can hide a usable sibling)

SELECT '== 1. totals' AS section;
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
           END) AS blocked_by_sibling_active_remaining_cnt,
       SUM(CASE
             WHEN exhausted.remaining_sessions IS NULL
               OR exhausted.remaining_sessions <= 0 THEN 1 ELSE 0
           END) AS rem_le_0_cnt,
       SUM(CASE
             WHEN exhausted.used_sessions IS NOT NULL
              AND exhausted.total_sessions IS NOT NULL
              AND exhausted.used_sessions >= exhausted.total_sessions THEN 1 ELSE 0
           END) AS used_ge_total_cnt
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

SELECT '== 2. by tenant' AS section;
SELECT exhausted.tenant_id,
       COUNT(*) AS mapping_cnt,
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
           END) AS blocked_by_sibling_active_remaining_cnt
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
       )
 GROUP BY exhausted.tenant_id
 ORDER BY mapping_cnt DESC, exhausted.tenant_id;

SELECT '== 3. by created month' AS section;
SELECT DATE_FORMAT(exhausted.created_at, '%Y-%m') AS created_year_month,
       COUNT(*) AS mapping_cnt,
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
           END) AS blocked_by_sibling_active_remaining_cnt
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
       )
 GROUP BY DATE_FORMAT(exhausted.created_at, '%Y-%m')
 ORDER BY created_year_month;
